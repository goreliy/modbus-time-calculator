import React from 'react';
import { Card } from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

interface ModbusDataVisualizerProps {
  data: Array<number | boolean>;
  title?: string;
}

export const ModbusDataVisualizer = ({ data, title = "Modbus Data" }: ModbusDataVisualizerProps) => {
  const chartData = data.map((value, index) => ({
    index,
    value: typeof value === 'boolean' ? (value ? 1 : 0) : value
  }));

  return (
    <Card className="p-6 bg-gray-800/50 backdrop-blur border-gray-700/50">
      <h3 className="text-xl font-semibold mb-4 text-gray-200">{title}</h3>
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#444" />
            <XAxis 
              dataKey="index" 
              stroke="#888" 
              label={{ value: 'Index', position: 'insideBottom', offset: -5 }} 
            />
            <YAxis 
              stroke="#888" 
              label={{ value: 'Value', angle: -90, position: 'insideLeft' }} 
            />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
              labelStyle={{ color: '#9ca3af' }}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke="#3b82f6" 
              activeDot={{ r: 8 }} 
              dot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};