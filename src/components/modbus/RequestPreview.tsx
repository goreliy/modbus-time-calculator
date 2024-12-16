import React from 'react';
import { Label } from "@/components/ui/label";
import { SavedModbusRequest } from '@/lib/storage';

interface RequestPreviewProps {
  request: SavedModbusRequest;
}

const formatRequestBytes = (request: SavedModbusRequest): string => {
  // Create initial request bytes
  const bytes: number[] = [
    request.slaveId,
    request.function,
    Math.floor(request.startAddress / 256),
    request.startAddress % 256,
  ];

  // Add data bytes based on function
  if (request.function === 5 || request.function === 6) {
    const value = request.data?.[0] || 0;
    bytes.push(Math.floor(value / 256));
    bytes.push(value % 256);
  } else {
    bytes.push(Math.floor(request.count / 256));
    bytes.push(request.count % 256);
  }

  // Calculate CRC16 (Modbus)
  let crc = 0xFFFF;
  for (let i = 0; i < bytes.length; i++) {
    crc ^= bytes[i];
    for (let j = 0; j < 8; j++) {
      if (crc & 0x0001) {
        crc = (crc >> 1) ^ 0xA001;
      } else {
        crc = crc >> 1;
      }
    }
  }

  // Add CRC bytes (low byte first, then high byte)
  bytes.push(crc & 0xFF);
  bytes.push((crc >> 8) & 0xFF);

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