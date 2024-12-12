import React, { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ModbusService, ModbusSettings } from '@/lib/modbusService';

export const ModbusConnection = () => {
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

        <Button
          className={`w-full ${isConnected ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}`}
          onClick={handleConnect}
        >
          {isConnected ? 'Disconnect' : 'Connect'}
        </Button>
      </div>
    </Card>
  );
};