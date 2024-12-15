import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SavedModbusRequest } from '@/lib/storage';
import { Plus, Trash2, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ModbusRequestManagerProps {
  requests: SavedModbusRequest[];
  onRequestsChange: (requests: SavedModbusRequest[]) => void;
  onSendRequest: (request: SavedModbusRequest) => void;
  disabled?: boolean;
}

const getCountExplanation = (functionCode: number): string => {
  switch (functionCode) {
    case 1:
    case 2:
      return "Number of coils/discrete inputs to read";
    case 3:
    case 4:
      return "Number of registers to read (2 bytes each)";
    case 5:
      return "Always 1 - single coil write";
    case 6:
      return "Always 1 - single register write";
    case 15:
      return "Number of coils to write";
    case 16:
      return "Number of registers to write";
    default:
      return "Number of items to process";
  }
};

const formatRequestBytes = (request: SavedModbusRequest): string => {
  const bytes: number[] = [
    request.slaveId,
    request.function,
    Math.floor(request.startAddress / 256),
    request.startAddress % 256,
  ];

  if (request.function === 5 || request.function === 6) {
    const value = request.data?.[0] || 0;
    bytes.push(Math.floor(value / 256));
    bytes.push(value % 256);
  } else {
    bytes.push(Math.floor(request.count / 256));
    bytes.push(request.count % 256);
  }

  return bytes.map(b => b.toString(16).padStart(2, '0').toUpperCase()).join(' ');
};

export const ModbusRequestManager = ({
  requests,
  onRequestsChange,
  onSendRequest,
  disabled
}: ModbusRequestManagerProps) => {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [cycles, setCycles] = useState<number | undefined>(undefined);

  const addNewRequest = () => {
    const newRequest: SavedModbusRequest = {
      id: Date.now().toString(),
      name: `Request ${requests.length + 1}`,
      function: 3,
      startAddress: 0,
      count: 1,
      slaveId: 1,
      comment: '',
      order: requests.length,
      cycles: 1
    };
    onRequestsChange([...requests, newRequest]);
    setEditingIndex(requests.length);
  };

  const updateRequest = (index: number, updates: Partial<SavedModbusRequest>) => {
    const newRequests = [...requests];
    newRequests[index] = { ...newRequests[index], ...updates };
    onRequestsChange(newRequests);
  };

  const deleteRequest = (index: number) => {
    const newRequests = requests.filter((_, i) => i !== index);
    onRequestsChange(newRequests);
    setEditingIndex(null);
  };

  return (
    <Card className="bg-gray-800/50 backdrop-blur border-gray-700/50 p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
          Modbus Requests
        </h2>
        <Button
          onClick={addNewRequest}
          className="bg-green-600 hover:bg-green-700"
          disabled={disabled}
        >
          <Plus className="mr-2 h-4 w-4" /> Add Request
        </Button>
      </div>

      <div className="space-y-4">
        {requests.map((request, index) => (
          <Card key={request.id} className="p-4 bg-gray-700/50">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  value={request.name}
                  onChange={(e) => updateRequest(index, { name: e.target.value })}
                  disabled={disabled}
                />
              </div>

              <div className="space-y-2">
                <Label>Comment</Label>
                <Input
                  value={request.comment}
                  onChange={(e) => updateRequest(index, { comment: e.target.value })}
                  disabled={disabled}
                />
              </div>

              <div className="space-y-2">
                <Label>Function</Label>
                <Select
                  value={request.function.toString()}
                  onValueChange={(value) => updateRequest(index, { function: parseInt(value) })}
                  disabled={disabled}
                >
                  <SelectTrigger>
                    <SelectValue />
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
                  onChange={(e) => updateRequest(index, { startAddress: parseInt(e.target.value) })}
                  disabled={disabled}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label>Count</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-4 w-4 text-gray-400" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{getCountExplanation(request.function)}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Input
                  type="number"
                  value={request.count}
                  onChange={(e) => updateRequest(index, { count: parseInt(e.target.value) })}
                  disabled={disabled}
                />
              </div>

              <div className="space-y-2">
                <Label>Slave ID</Label>
                <Input
                  type="number"
                  value={request.slaveId}
                  onChange={(e) => updateRequest(index, { slaveId: parseInt(e.target.value) })}
                  disabled={disabled}
                />
              </div>

              <div className="space-y-2">
                <Label>Cycles (empty for infinite)</Label>
                <Input
                  type="number"
                  value={request.cycles || ''}
                  onChange={(e) => updateRequest(index, { cycles: e.target.value ? parseInt(e.target.value) : undefined })}
                  disabled={disabled}
                  min={1}
                />
              </div>
            </div>

            <div className="mt-4 p-3 bg-gray-800 rounded-md">
              <Label>Request Bytes (HEX)</Label>
              <code className="block mt-2 font-mono text-sm text-green-400">
                {formatRequestBytes(request)}
              </code>
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <Button
                variant="destructive"
                size="sm"
                onClick={() => deleteRequest(index)}
                disabled={disabled}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              <Button
                onClick={() => onSendRequest(request)}
                disabled={disabled}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Send
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </Card>
  );
};