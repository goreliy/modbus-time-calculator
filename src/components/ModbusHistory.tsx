import React from 'react';
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface ModbusHistoryEntry {
  timestamp: string;
  requestHex: string;
  responseHex: string;
  requestName: string;
  error?: string | null;
  formatted_data?: {
    decimal: number[];
    hex: string[];
    binary: string[];
  };
}

interface ModbusHistoryProps {
  history: ModbusHistoryEntry[];
}

export const ModbusHistory = ({ history }: ModbusHistoryProps) => {
  const formatHexString = (hex: string): string => {
    if (!hex) return 'N/A';
    return hex.match(/.{1,2}/g)?.join(' ') || hex;
  };

  const formatResponseData = (entry: ModbusHistoryEntry) => {
    if (entry.error) return entry.error;
    if (!entry.formatted_data) return 'N/A';

    return (
      <div className="space-y-1 text-sm">
        <div>Decimal: {entry.formatted_data.decimal.join(', ')}</div>
        <div>Hex: {entry.formatted_data.hex.join(', ')}</div>
        <div>Binary: {entry.formatted_data.binary.join(', ')}</div>
      </div>
    );
  };

  return (
    <Card className="bg-gray-800/50 backdrop-blur border-gray-700/50 p-6">
      <h2 className="text-2xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
        Request History
      </h2>
      <ScrollArea className="h-[400px] rounded-md border border-gray-700">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Time</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Request (HEX)</TableHead>
              <TableHead>Response Data</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {history.map((entry, index) => (
              <TableRow key={index}>
                <TableCell className="font-mono">
                  {new Date(entry.timestamp).toLocaleTimeString()}
                </TableCell>
                <TableCell>{entry.requestName}</TableCell>
                <TableCell className="font-mono">
                  {formatHexString(entry.requestHex)}
                </TableCell>
                <TableCell>
                  {formatResponseData(entry)}
                </TableCell>
                <TableCell>
                  {entry.error ? (
                    <span className="text-red-500">Error</span>
                  ) : (
                    <span className="text-green-500">Success</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ScrollArea>
    </Card>
  );
};
