import React, { useState, useEffect, useRef } from 'react';
import { ModbusService } from '@/lib/modbusService';
import { SavedModbusSettings, SavedModbusRequest, saveSettings, loadSettings } from '@/lib/storage';
import { toast } from 'sonner';
import { ConnectionSettings } from './modbus/ConnectionSettings';
import { ModbusRequestManager } from './ModbusRequestManager';
import { ModbusHistory } from './ModbusHistory';
import { useModbusRequests } from '@/hooks/useModbusRequests';
import { useModbusHistory } from '@/hooks/useModbusHistory';
import { Loader2, Download, Upload } from 'lucide-react';
import { Button } from './ui/button';
import { saveToExcel, loadFromExcel } from '@/lib/excelUtils';
import { Card } from './ui/card';
import { LineChart } from './ModbusDataVisualizer';
import { GlobalQueueStatistics } from './modbus/GlobalQueueStatistics';

interface ModbusConnectionProps {
  onDataReceived?: (data: Array<number | boolean>) => void;
}

interface RequestData {
  timestamp: string;
  values: {
    decimal: number[];
    hex: string[];
    binary: string[];
  };
}

export const ModbusConnection = ({ onDataReceived }: ModbusConnectionProps) => {
  const [requestData, setRequestData] = useState<Record<string, RequestData[]>>({});
  const [chartData, setChartData] = useState<Array<{ timestamp: number; value: number }>>([]);
  const [ports, setPorts] = useState<string[]>([]);
  const [settings, setSettings] = useState<SavedModbusSettings>({
    port: '',
    baudRate: 9600,
    parity: 'N',
    stopBits: 1,
    dataBits: 8,
    timeout: 10000,  // Default timeout 10000 microseconds (0.01 seconds)
    connectionType: 'serial'
  });
  
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [lastResponse, setLastResponse] = useState<any>(null);
  const [selectedRequests, setSelectedRequests] = useState<string[]>([]);
  
  const { requests, handleRequestsChange } = useModbusRequests();
  const { history, addHistoryEntry } = useModbusHistory();

  const modbusService = ModbusService.getInstance();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isPolling, setIsPolling] = useState(false);
  const [globalStats, setGlobalStats] = useState({
    totalRequests: 0,
    completedRequests: 0,
    timeoutRequests: 0,
    errorRequests: 0,
    remainingRequests: 0,
    isPolling: false
  });

  useEffect(() => {
    loadPorts();
    loadSavedSettings();
  }, []);

  const loadSavedSettings = () => {
    console.log('Loading saved settings...');
    try {
      const savedSettings = loadSettings();
      if (savedSettings) {
        console.log('Found saved settings:', savedSettings);
        setSettings(savedSettings);
      }
    } catch (error) {
      console.error('Error loading saved settings:', error);
      toast.error('Failed to load saved settings');
    }
  };

  const loadPorts = async () => {
    console.log('Loading available ports...');
    setIsLoading(true);
    try {
      const availablePorts = await modbusService.getAvailablePorts();
      console.log('Available ports:', availablePorts);
      setPorts(availablePorts);
      if (availablePorts.length > 0 && !settings.port) {
        setSettings(prev => ({ ...prev, port: availablePorts[0] }));
      }
    } catch (error) {
      console.error('Error loading ports:', error);
      toast.error('Failed to load available ports');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnect = async () => {
    console.log('Attempting connection with settings:', settings);
    setIsLoading(true);
    try {
      if (isConnected) {
        await modbusService.disconnect();
        setIsConnected(false);
        toast.success('Disconnected successfully');
      } else {
        const success = await modbusService.connect(settings);
        if (success) {
          setIsConnected(true);
          saveSettings(settings);
          toast.success('Connected successfully');
        } else {
          toast.error('Connection failed');
        }
      }
    } catch (error) {
      console.error('Connection error:', error);
      toast.error('Connection error occurred');
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendRequest = async (request: SavedModbusRequest) => {
    console.log('Sending request:', request);
    setIsLoading(true);
    try {
      const response = await modbusService.sendRequest(request);
      console.log('Received response:', response);

      if (response.error) {
        console.warn('Request error:', response.error);
        toast.error(`Request failed: ${response.error}`);
      } else {
        setLastResponse(response);
        
        if (response.formatted_data) {
          console.log('Formatted data:', response.formatted_data);
          
          setRequestData(prev => ({
            ...prev,
            [request.id]: [
              {
                timestamp: response.timestamp,
                values: response.formatted_data
              },
              ...(prev[request.id] || []).slice(0, 999)
            ]
          }));

          // Update chart data
          if (response.parsed_data) {
            setChartData(prev => [
              {
                timestamp: new Date(response.timestamp).getTime(),
                value: response.parsed_data[0] as number
              },
              ...prev.slice(0, 99)
            ]);
            
            if (onDataReceived) {
              onDataReceived(response.parsed_data);
            }
          }
          
          toast.success('Request completed successfully');
        }
      }

      addHistoryEntry({
        timestamp: response.timestamp,
        requestHex: response.request_hex || '',
        responseHex: response.response_hex || '',
        requestName: request.name,
        error: response.error || null,
        formatted_data: response.formatted_data
      });
    } catch (error) {
      console.error('Request error:', error);
      toast.error('Failed to send request');
      
      addHistoryEntry({
        timestamp: new Date().toISOString(),
        requestHex: '',
        responseHex: '',
        requestName: request.name,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportConfig = () => {
    try {
      saveToExcel(settings, requests);
      toast.success('Configuration exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export configuration');
    }
  };

  const handleImportConfig = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    try {
      const { settings: newSettings, requests: newRequests } = await loadFromExcel(file);
      
      if (newSettings) {
        setSettings(prev => ({ ...prev, ...newSettings }));
        saveSettings(newSettings as SavedModbusSettings);
      }
      
      if (newRequests) {
        handleRequestsChange(newRequests);
      }
      
      toast.success('Configuration imported successfully');
    } catch (error) {
      console.error('Import error:', error);
      toast.error('Failed to import configuration');
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleStartPolling = async () => {
    console.log('Starting global polling...');
    if (selectedRequests.length === 0) {
      toast.error('Выберите хотя бы один запрос для очереди');
      return;
    }

    try {
      const selectedRequestObjects = requests.filter(req => selectedRequests.includes(req.id));
      console.log('Selected requests for polling:', selectedRequestObjects);

      await modbusService.startPolling({
        requests: selectedRequestObjects,
        interval: 1.0, // 1 second interval
        cycles: undefined
      });
      setIsPolling(true);
      setGlobalStats(prev => ({ ...prev, isPolling: true }));
      toast.success('Опрос запущен');
    } catch (error) {
      console.error('Polling error:', error);
      toast.error('Не удалось запустить опрос');
    }
  };

  const handleStopPolling = async () => {
    console.log('Stopping global polling...');
    try {
      await modbusService.stopPolling();
      setIsPolling(false);
      setGlobalStats(prev => ({ ...prev, isPolling: false }));
      toast.success('Опрос остановлен');
    } catch (error) {
      console.error('Stop polling error:', error);
      toast.error('Не удалось остановить опрос');
    }
  };

  const handleRequestSelectionChange = (requestId: string, selected: boolean) => {
    setSelectedRequests(prev => {
      if (selected) {
        return [...prev, requestId];
      } else {
        return prev.filter(id => id !== requestId);
      }
    });
  };

  useEffect(() => {
    if (lastResponse?.stats) {
      setGlobalStats(prev => ({
        ...prev,
        totalRequests: requests.reduce((sum, req) => sum + (lastResponse?.stats?.[req.id]?.total || 0), 0),
        completedRequests: requests.reduce((sum, req) => sum + (lastResponse?.stats?.[req.id]?.completed || 0), 0),
        timeoutRequests: requests.reduce((sum, req) => sum + (lastResponse?.stats?.[req.id]?.timeouts || 0), 0),
        errorRequests: requests.reduce((sum, req) => sum + (lastResponse?.stats?.[req.id]?.errors || 0), 0),
        remainingRequests: requests.reduce((sum, req) => sum + (lastResponse?.stats?.[req.id]?.remaining || 0), 0)
      }));
    }
  }, [lastResponse?.stats, requests]);

  return (
    <div className="space-y-6 relative">
      {isLoading && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50 rounded-lg">
          <div className="bg-gray-800 p-4 rounded-lg flex items-center gap-2">
            <Loader2 className="animate-spin h-8 w-8 text-white" />
            <span className="text-white">Processing...</span>
          </div>
        </div>
      )}
      
      <div className="flex justify-end gap-2 mb-4">
        <Button
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-2 bg-[#9b87f5] text-white hover:bg-[#7E69AB]"
        >
          <Upload className="h-4 w-4" />
          Import Config
        </Button>
        <Button
          variant="outline"
          onClick={handleExportConfig}
          className="flex items-center gap-2 bg-[#9b87f5] text-white hover:bg-[#7E69AB]"
        >
          <Download className="h-4 w-4" />
          Export Config
        </Button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImportConfig}
          accept=".xlsx"
          className="hidden"
        />
      </div>

      <div className="grid grid-cols-2 gap-6">
        <ConnectionSettings
          ports={ports}
          settings={settings}
          isConnected={isConnected}
          onSettingsChange={setSettings}
          onConnect={handleConnect}
        />
        <GlobalQueueStatistics
          stats={globalStats}
          onStartPolling={handleStartPolling}
          onStopPolling={handleStopPolling}
          disabled={!isConnected}
          requests={requests}
          selectedRequests={selectedRequests}
          onRequestSelectionChange={handleRequestSelectionChange}
        />
      </div>

      <ModbusRequestManager
        requests={requests}
        onRequestsChange={handleRequestsChange}
        onSendRequest={handleSendRequest}
        disabled={!isConnected || isPolling}
        requestData={requestData}
        requestStats={lastResponse?.stats}
      />

      {chartData.length > 0 && (
        <Card className="p-4 bg-gray-800/50">
          <h3 className="text-lg font-semibold mb-2">Real-time Data</h3>
          <LineChart data={chartData} title="Modbus Values" />
        </Card>
      )}

      {lastResponse && (
        <Card className="p-4 bg-gray-800/50">
          <h3 className="text-lg font-semibold mb-2">Last Response</h3>
          <pre className="bg-gray-900/50 p-4 rounded overflow-x-auto">
            {JSON.stringify(lastResponse, null, 2)}
          </pre>
        </Card>
      )}

      <ModbusHistory history={history} />
    </div>
  );
};