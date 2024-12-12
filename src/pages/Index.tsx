import React from 'react';
import { Card } from "@/components/ui/card";
import { ModbusCalculator } from '@/components/ModbusCalculator';
import { PacketVisualizer } from '@/components/PacketVisualizer';

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <header className="text-center mb-10">
          <h1 className="text-4xl font-bold mb-2">S2000PP Modbus Calculator</h1>
          <p className="text-gray-400">Calculate Modbus RTU polling times and analyze packet structures</p>
        </header>

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="bg-gray-800 border-gray-700 p-6">
            <ModbusCalculator />
          </Card>
          
          <Card className="bg-gray-800 border-gray-700 p-6">
            <PacketVisualizer />
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;