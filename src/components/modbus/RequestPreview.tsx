import React from 'react';
import { Label } from "@/components/ui/label";
import { SavedModbusRequest } from '@/lib/storage';

interface RequestPreviewProps {
  request: SavedModbusRequest;
}

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

export const RequestPreview = ({ request }: RequestPreviewProps) => {
  return (
    <div className="mt-4 p-3 bg-gray-800 rounded-md">
      <Label>Request Bytes (HEX)</Label>
      <code className="block mt-2 font-mono text-sm text-green-400">
        {formatRequestBytes(request)}
      </code>
    </div>
  );
};