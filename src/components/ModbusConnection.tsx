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

interface ModbusConnectionProps {
  onDataReceived?: (data: Array<number | boolean>) => void;
}

export const ModbusConnection = ({ onDataReceived }: ModbusConnectionProps) => {
  const [ports, setPorts] = useState<string[]>([]);
  const [settings, setSettings] = useState<SavedModbusSettings>({
    port: '',
    baudRate: 9600,
    parity: 'N',
    stopBits: 1,
    dataBits: 8,
    timeout: 1000
  });
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const { requests, handleRequestsChange } = useModbusRequests();
  const { history, addHistoryEntry } = useModbusHistory();

  const modbusService = ModbusService.getInstance();
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      toast.error('Failed to load available ports. Please check if the backend service is running.');
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
      toast.error('Connection error occurred. Please check your settings and try again.');
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

      addHistoryEntry({
        timestamp: new Date().toISOString(),
        requestHex: response.requestHex || '',
        responseHex: response.responseHex || '',
        requestName: request.name,
        error: response.error || null
      });

      if (response.error) {
        console.warn('Request error:', response.error);
        toast.error(`Request failed: ${response.error}`);
      } else if (response.parsedData && onDataReceived) {
        console.log('Parsed data:', response.parsedData);
        onDataReceived(response.parsedData);
        toast.success('Request completed successfully');
      }
    } catch (error) {
      console.error('Request error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Failed to send request: ${errorMessage}`);
      
      addHistoryEntry({
        timestamp: new Date().toISOString(),
        requestHex: '',
        responseHex: '',
        requestName: request.name,
        error: errorMessage
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

  return (
    <div className="space-y-6 relative">
      {isLoading && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50 rounded-lg">
          <Loader2 className="animate-spin h-8 w-8 text-white" />
        </div>
      )}
      
      <div className="flex justify-end gap-2 mb-4">
        <Button
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-2"
        >
          <Upload className="h-4 w-4" />
          Import Config
        </Button>
        <Button
          variant="outline"
          onClick={handleExportConfig}
          className="flex items-center gap-2"
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

      <ConnectionSettings
        ports={ports}
        settings={settings}
        isConnected={isConnected}
        onSettingsChange={setSettings}
        onConnect={handleConnect}
      />

      <ModbusRequestManager
        requests={requests}
        onRequestsChange={handleRequestsChange}
        onSendRequest={handleSendRequest}
        disabled={!isConnected}
      />

      <ModbusHistory history={history} />
    </div>
  );
};
