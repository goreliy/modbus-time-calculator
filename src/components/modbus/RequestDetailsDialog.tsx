import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { LineChart } from '@/components/ModbusDataVisualizer';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { Download, LineChart as ChartIcon } from 'lucide-react';
import { SavedModbusRequest } from '@/lib/storage';
import { format } from 'date-fns';

interface RequestData {
  timestamp: string;
  values: {
    decimal: number[];
    hex: string[];
    binary: string[];
  };
}

interface RequestDetailsDialogProps {
  request: SavedModbusRequest;
  data: RequestData[];
}

export const RequestDetailsDialog = ({ request, data }: RequestDetailsDialogProps) => {
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
    to: new Date()
  });

  const filteredData = data.filter(item => {
    const timestamp = new Date(item.timestamp);
    return timestamp >= dateRange.from && timestamp <= dateRange.to;
  });

  const exportToCsv = () => {
    const csvContent = [
      ['Timestamp', 'Decimal', 'Hexadecimal', 'Binary'].join(','),
      ...filteredData.map(item => [
        item.timestamp,
        item.values.decimal.join(';'),
        item.values.hex.join(';'),
        item.values.binary.join(';')
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `modbus_request_${request.name}_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.csv`;
    link.click();
  };

  const chartData = filteredData.map(item => ({
    timestamp: new Date(item.timestamp).getTime(),
    value: item.values.decimal[0] || 0
  }));

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon">
          <ChartIcon className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Request Details: {request.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <DateRangePicker
              from={dateRange.from}
              to={dateRange.to}
              onSelect={(range) => {
                if (range?.from && range?.to) {
                  setDateRange({ from: range.from, to: range.to });
                }
              }}
            />
            <Button onClick={exportToCsv} variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </div>

          <div className="h-[300px] bg-gray-800/50 rounded-lg p-4">
            <LineChart data={chartData} title={`${request.name} Values`} />
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Decimal</TableHead>
                  <TableHead>Hexadecimal</TableHead>
                  <TableHead>Binary</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>{format(new Date(item.timestamp), 'yyyy-MM-dd HH:mm:ss')}</TableCell>
                    <TableCell>{item.values.decimal.join(', ')}</TableCell>
                    <TableCell>{item.values.hex.join(', ')}</TableCell>
                    <TableCell>{item.values.binary.join(', ')}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};