import React, { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ModbusService } from '@/lib/modbusService';
import { ModbusRequestManager } from './ModbusRequestManager';
import { ModbusHistory } from './ModbusHistory';
import { SavedModbusSettings, SavedModbusRequest, saveSettings, loadSettings, saveRequests, loadRequests } from '@/lib/storage';
import { toast } from 'sonner';

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
  const [requests, setRequests] = useState<SavedModbusRequest[]>([]);
  const [history, setHistory] = useState<any[]>([]);

  const modbusService = ModbusService.getInstance();

  useEffect(() => {
    loadPorts();
    loadSavedData();
  }, []);

  const loadSavedData = () => {
    try {
      const savedSettings = loadSettings();
      if (savedSettings) {
        setSettings(savedSettings);
      }

      const savedRequests = loadRequests();
      if (savedRequests) {
        setRequests(savedRequests);
      }

      const savedHistory = localStorage.getItem('modbus_history');
      if (savedHistory) {
        const parsedHistory = JSON.parse(savedHistory);
        setHistory(parsedHistory);
        console.log('Loaded history:', parsedHistory);
      }
    } catch (error) {
      console.error('Error loading saved data:', error);
      toast.error('Failed to load saved data');
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

      const newHistoryEntry = {
        timestamp: new Date().toISOString(),
        requestHex: response.requestHex || '',
        responseHex: response.responseHex || '',
        requestName: request.name,
        error: response.error || null
      };

      setHistory(prev => {
        try {
          const newHistory = [newHistoryEntry, ...prev].slice(0, 1000);
          localStorage.setItem('modbus_history', JSON.stringify(newHistory));
          console.log('History updated successfully');
          return newHistory;
        } catch (error) {
          console.error('Error updating history:', error);
          return prev;
        }
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
      
      setHistory(prev => {
        try {
          const newHistory = [{
            timestamp: new Date().toISOString(),
            requestHex: '',
            responseHex: '',
            requestName: request.name,
            error: errorMessage
          }, ...prev].slice(0, 1000);
          localStorage.setItem('modbus_history', JSON.stringify(newHistory));
          return newHistory;
        } catch (storageError) {
          console.error('Error updating history:', storageError);
          return prev;
        }
      });
    }
  };

  const handleRequestsChange = (newRequests: SavedModbusRequest[]) => {
    try {
      setRequests(newRequests);
      saveRequests(newRequests);
    } catch (error) {
      console.error('Error saving requests:', error);
      toast.error('Failed to save requests');
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-gray-800/50 backdrop-blur border-gray-700/50 p-6">
        <h2 className="text-2xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
          Connection Settings
        </h2>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Port</Label>
            <Select
              value={settings.port}
              onValueChange={(value) => setSettings(prev => ({ ...prev, port: value }))}
              disabled={isConnected}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select port" />
              </SelectTrigger>
              <SelectContent>
                {ports.map(port => (
                  <SelectItem key={port} value={port}>{port}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Baud Rate</Label>
            <Select
              value={settings.baudRate.toString()}
              onValueChange={(value) => setSettings(prev => ({ ...prev, baudRate: parseInt(value) }))}
              disabled={isConnected}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select baud rate" />
              </SelectTrigger>
              <SelectContent>
                {[1200, 2400, 4800, 9600, 19200, 38400, 57600, 115200].map(rate => (
                  <SelectItem key={rate} value={rate.toString()}>{rate}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Parity</Label>
            <Select
              value={settings.parity}
              onValueChange={(value: 'N' | 'E' | 'O') => setSettings(prev => ({ ...prev, parity: value }))}
              disabled={isConnected}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select parity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="N">None</SelectItem>
                <SelectItem value="E">Even</SelectItem>
                <SelectItem value="O">Odd</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Stop Bits</Label>
            <Select
              value={settings.stopBits.toString()}
              onValueChange={(value) => setSettings(prev => ({ ...prev, stopBits: parseFloat(value) }))}
              disabled={isConnected}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select stop bits" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1</SelectItem>
                <SelectItem value="1.5">1.5</SelectItem>
                <SelectItem value="2">2</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Data Bits</Label>
            <Select
              value={settings.dataBits.toString()}
              onValueChange={(value) => setSettings(prev => ({ ...prev, dataBits: parseInt(value) }))}
              disabled={isConnected}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select data bits" />
              </SelectTrigger>
              <SelectContent>
                {[5, 6, 7, 8].map(bits => (
                  <SelectItem key={bits} value={bits.toString()}>{bits}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Timeout (ms)</Label>
            <Input
              type="number"
              value={settings.timeout}
              onChange={(e) => setSettings(prev => ({ ...prev, timeout: parseInt(e.target.value) }))}
              min={100}
              max={5000}
              disabled={isConnected}
            />
          </div>
        </div>

        <div className="mt-6">
          <Button
            className={`w-full ${isConnected ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}`}
            onClick={handleConnect}
          >
            {isConnected ? 'Disconnect' : 'Connect'}
          </Button>
        </div>
      </Card>

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
