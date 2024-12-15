import React, { useState, useEffect } from 'react';
import { ModbusService } from '@/lib/modbusService';
import { SavedModbusSettings, SavedModbusRequest, saveSettings, loadSettings } from '@/lib/storage';
import { toast } from 'sonner';
import { ConnectionSettings } from './modbus/ConnectionSettings';
import { ModbusRequestManager } from './ModbusRequestManager';
import { ModbusHistory } from './ModbusHistory';
import { useModbusRequests } from '@/hooks/useModbusRequests';
import { useModbusHistory } from '@/hooks/useModbusHistory';
import { Loader2 } from 'lucide-react';

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

  return (
    <div className="space-y-6 relative">
      {isLoading && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50 rounded-lg">
          <Loader2 className="animate-spin h-8 w-8 text-white" />
        </div>
      )}
      
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