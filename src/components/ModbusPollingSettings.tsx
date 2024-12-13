import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SavedModbusRequest } from '@/lib/storage';
import { ModbusService } from '@/lib/modbusService';
import { toast } from 'sonner';

interface ModbusPollingSettingsProps {
  requests: SavedModbusRequest[];
  disabled?: boolean;
}

export const ModbusPollingSettings = ({ requests, disabled }: ModbusPollingSettingsProps) => {
  const [isPolling, setIsPolling] = useState(false);
  const [interval, setInterval] = useState(1000);
  const [cycles, setCycles] = useState<number | undefined>(undefined);

  const handleStartPolling = async () => {
    try {
      const modbusService = ModbusService.getInstance();
      await modbusService.startPolling({
        requests,
        interval: interval / 1000, // Convert to seconds
        cycles
      });
      setIsPolling(true);
      toast.success('Polling started');
    } catch (error) {
      console.error('Polling error:', error);
      toast.error('Failed to start polling');
    }
  };

  const handleStopPolling = async () => {
    try {
      const modbusService = ModbusService.getInstance();
      await modbusService.stopPolling();
      setIsPolling(false);
      toast.success('Polling stopped');
    } catch (error) {
      console.error('Stop polling error:', error);
      toast.error('Failed to stop polling');
    }
  };

  return (
    <Card className="bg-gray-800/50 backdrop-blur border-gray-700/50 p-6">
      <h2 className="text-2xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
        Polling Settings
      </h2>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="space-y-2">
          <Label>Interval (ms)</Label>
          <Input
            type="number"
            value={interval}
            onChange={(e) => setInterval(parseInt(e.target.value))}
            min={100}
            disabled={isPolling || disabled}
          />
        </div>

        <div className="space-y-2">
          <Label>Cycles (empty for infinite)</Label>
          <Input
            type="number"
            value={cycles ?? ''}
            onChange={(e) => setCycles(e.target.value ? parseInt(e.target.value) : undefined)}
            min={1}
            disabled={isPolling || disabled}
          />
        </div>
      </div>

      <Button
        className={`w-full ${isPolling ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}`}
        onClick={isPolling ? handleStopPolling : handleStartPolling}
        disabled={disabled || requests.length === 0}
      >
        {isPolling ? 'Stop Polling' : 'Start Polling'}
      </Button>
    </Card>
  );
};