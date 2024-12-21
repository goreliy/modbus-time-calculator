import React from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SavedModbusSettings } from '@/lib/storage';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ConnectionSettingsProps {
  ports: string[];
  settings: SavedModbusSettings;
  isConnected: boolean;
  onSettingsChange: (settings: SavedModbusSettings) => void;
  onConnect: () => void;
}

export const ConnectionSettings = ({
  ports,
  settings,
  isConnected,
  onSettingsChange,
  onConnect
}: ConnectionSettingsProps) => {
  return (
    <Card className="bg-gray-800/50 backdrop-blur border-gray-700/50 p-6">
      <h2 className="text-2xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
        Connection Settings
      </h2>

      <Tabs defaultValue="serial" className="mb-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="serial">Serial</TabsTrigger>
          <TabsTrigger value="tcp">TCP/IP</TabsTrigger>
        </TabsList>

        <TabsContent value="serial">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Port</Label>
              <Select
                value={settings.port}
                onValueChange={(value) => onSettingsChange({ ...settings, port: value })}
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
                value={settings.baudRate?.toString()}
                onValueChange={(value) => onSettingsChange({ ...settings, baudRate: parseInt(value) })}
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
                onValueChange={(value: 'N' | 'E' | 'O') => onSettingsChange({ ...settings, parity: value })}
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
                value={settings.stopBits?.toString()}
                onValueChange={(value) => onSettingsChange({ ...settings, stopBits: parseFloat(value) })}
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
                value={settings.dataBits?.toString()}
                onValueChange={(value) => onSettingsChange({ ...settings, dataBits: parseInt(value) })}
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
                onChange={(e) => onSettingsChange({ ...settings, timeout: parseInt(e.target.value) })}
                min={100}
                max={5000}
                disabled={isConnected}
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="tcp">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>IP Address</Label>
              <Input
                type="text"
                value={settings.ipAddress || ''}
                onChange={(e) => onSettingsChange({ ...settings, ipAddress: e.target.value })}
                placeholder="192.168.1.100"
                disabled={isConnected}
              />
            </div>

            <div className="space-y-2">
              <Label>Port</Label>
              <Input
                type="number"
                value={settings.tcpPort || 502}
                onChange={(e) => onSettingsChange({ ...settings, tcpPort: parseInt(e.target.value) })}
                min={1}
                max={65535}
                disabled={isConnected}
              />
            </div>

            <div className="space-y-2">
              <Label>Timeout (ms)</Label>
              <Input
                type="number"
                value={settings.timeout}
                onChange={(e) => onSettingsChange({ ...settings, timeout: parseInt(e.target.value) })}
                min={100}
                max={5000}
                disabled={isConnected}
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <Button
        className={`w-full ${isConnected ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}`}
        onClick={onConnect}
      >
        {isConnected ? 'Disconnect' : 'Connect'}
      </Button>
    </Card>
  );
};