import React, { useState, useEffect } from 'react';
import { ModbusService } from '@/lib/modbusService';
import { SavedModbusSettings, SavedModbusRequest, saveSettings, loadSettings } from '@/lib/storage';
import { toast } from 'sonner';
import { ConnectionSettings } from './modbus/ConnectionSettings';
import { ModbusRequestManager } from './ModbusRequestManager';
import { ModbusHistory } from './ModbusHistory';
import { useModbusRequests } from '@/hooks/useModbusRequests';
import { useModbusHistory } from '@/hooks/useModbusHistory';

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
  
  const { requests, handleRequestsChange } = useModbusRequests();
  const { history, addHistoryEntry } = useModbusHistory();

  const modbusService = ModbusService.getInstance();

  useEffect(() => {
    loadPorts();
    loadSavedSettings();
  }, []);

  const loadSavedSettings = () => {
    try {
      const savedSettings = loadSettings();
      if (savedSettings) {
        setSettings(savedSettings);
      }
    } catch (error) {
      console.error('Error loading saved settings:', error);
      toast.error('Failed to load saved settings');
    }
  };

  const loadPorts = async () => {
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
    }
  };

  const handleConnect = async () => {
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
    }
  };

  const handleSendRequest = async (request: SavedModbusRequest) => {
    try {
      console.log('Sending request:', request);
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
    }
  };

  return (
    <div className="space-y-6">
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