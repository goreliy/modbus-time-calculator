import React, { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ModbusService, ModbusSettings, ModbusRequest } from '@/lib/modbusService';

interface ModbusConnectionProps {
  onDataReceived?: (data: Array<number | boolean>) => void;
}

export const ModbusConnection = ({ onDataReceived }: ModbusConnectionProps) => {
  const [ports, setPorts] = useState<string[]>([]);
  const [settings, setSettings] = useState<ModbusSettings>({
    port: '',
    baudRate: 9600,
    parity: 'N',
    stopBits: 1,
    dataBits: 8,
    timeout: 1000
  });
  const [isConnected, setIsConnected] = useState(false);
  const [request, setRequest] = useState<ModbusRequest>({
    name: 'Test Request',
    function: 3,
    startAddress: 0,
    count: 10,
    slaveId: 1,
    comment: 'Read 10 holding registers'
  });

  const modbusService = ModbusService.getInstance();

  useEffect(() => {
    loadPorts();
  }, []);

  const loadPorts = async () => {
    const availablePorts = await modbusService.getAvailablePorts();
    setPorts(availablePorts);
    if (availablePorts.length > 0) {
      setSettings(prev => ({ ...prev, port: availablePorts[0] }));
    }
  };

  const handleConnect = async () => {
    if (isConnected) {
      await modbusService.disconnect();
      setIsConnected(false);
    } else {
      const success = await modbusService.connect(settings);
      setIsConnected(success);
    }
  };

  const handleSendRequest = async () => {
    try {
      const response = await modbusService.sendRequest(request);
      console.log('Modbus response:', response);
      if (response.parsedData && onDataReceived) {
        onDataReceived(response.parsedData);
      }
    } catch (error) {
      console.error('Error sending request:', error);
    }
  };

  return (
    <Card className="bg-gray-800/50 backdrop-blur border-gray-700/50 p-6">
      <h2 className="text-2xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
        Modbus Connection
      </h2>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Port</Label>
            <Select
              value={settings.port}
              onValueChange={(value) => setSettings(prev => ({ ...prev, port: value }))}
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
            />
          </div>

        </div>

        <div className="grid grid-cols-2 gap-4 mt-4">
          <div className="space-y-2">
            <Label>Function Code</Label>
            <Select
              value={request.function.toString()}
              onValueChange={(value) => setRequest(prev => ({ ...prev, function: parseInt(value) }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select function" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 - Read Coils</SelectItem>
                <SelectItem value="2">2 - Read Discrete Inputs</SelectItem>
                <SelectItem value="3">3 - Read Holding Registers</SelectItem>
                <SelectItem value="4">4 - Read Input Registers</SelectItem>
                <SelectItem value="5">5 - Write Single Coil</SelectItem>
                <SelectItem value="6">6 - Write Single Register</SelectItem>
                <SelectItem value="15">15 - Write Multiple Coils</SelectItem>
                <SelectItem value="16">16 - Write Multiple Registers</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Start Address</Label>
            <Input
              type="number"
              value={request.startAddress}
              onChange={(e) => setRequest(prev => ({ ...prev, startAddress: parseInt(e.target.value) }))}
            />
          </div>

          <div className="space-y-2">
            <Label>Count</Label>
            <Input
              type="number"
              value={request.count}
              onChange={(e) => setRequest(prev => ({ ...prev, count: parseInt(e.target.value) }))}
            />
          </div>

          <div className="space-y-2">
            <Label>Slave ID</Label>
            <Input
              type="number"
              value={request.slaveId}
              onChange={(e) => setRequest(prev => ({ ...prev, slaveId: parseInt(e.target.value) }))}
            />
          </div>
        </div>

        <div className="flex gap-4">
          <Button
            className={`flex-1 ${isConnected ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}`}
            onClick={handleConnect}
          >
            {isConnected ? 'Disconnect' : 'Connect'}
          </Button>

          <Button
            className="flex-1 bg-blue-500 hover:bg-blue-600"
            onClick={handleSendRequest}
            disabled={!isConnected}
          >
            Send Request
          </Button>
        </div>
      </div>
    </Card>
  );
};
