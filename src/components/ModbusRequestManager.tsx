import React from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SavedModbusRequest } from '@/lib/storage';
import { Plus } from 'lucide-react';
import { RequestForm } from './modbus/RequestForm';
import { RequestPreview } from './modbus/RequestPreview';
import { RequestActions } from './modbus/RequestActions';

interface ModbusRequestManagerProps {
  requests: SavedModbusRequest[];
  onRequestsChange: (requests: SavedModbusRequest[]) => void;
  onSendRequest: (request: SavedModbusRequest) => void;
  disabled?: boolean;
  requestData: Record<string, Array<{
    timestamp: string;
    values: {
      decimal: number[];
      hex: string[];
      binary: string[];
    };
  }>>;
  requestStats?: Record<string, {
    total: number;
    completed: number;
    timeouts: number;
    errors: number;
    remaining: number;
  }>;
}

export const ModbusRequestManager = ({
  requests,
  onRequestsChange,
  onSendRequest,
  disabled,
  requestData,
  requestStats
}: ModbusRequestManagerProps) => {
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
  };

  const updateRequest = (index: number, updates: Partial<SavedModbusRequest>) => {
    const newRequests = [...requests];
    newRequests[index] = { ...newRequests[index], ...updates };
    onRequestsChange(newRequests);
  };

  const deleteRequest = (index: number) => {
    const newRequests = requests.filter((_, i) => i !== index);
    onRequestsChange(newRequests);
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
        >
          <Plus className="mr-2 h-4 w-4" /> Add Request
        </Button>
      </div>

      <div className="space-y-4">
        {requests.map((request, index) => (
          <Card key={request.id} className="p-4 bg-gray-700/50">
            <RequestForm
              request={request}
              onUpdate={(updates) => updateRequest(index, updates)}
              disabled={disabled}
            />
            <RequestPreview request={request} />
            <RequestActions
              request={request}
              onDelete={() => deleteRequest(index)}
              onSend={() => onSendRequest(request)}
              disabled={disabled}
              data={requestData[request.id] || []}
              stats={requestStats?.[request.id]}
            />
          </Card>
        ))}
      </div>
    </Card>
  );
};