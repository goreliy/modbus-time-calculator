import React from 'react';
import { Card } from "@/components/ui/card";
import { ModbusCalculator } from '@/components/ModbusCalculator';
import { PacketVisualizer } from '@/components/PacketVisualizer';

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
            S2000PP Modbus Calculator
          </h1>
          <p className="text-gray-400 text-lg md:text-xl">
            Calculate Modbus RTU polling times and analyze packet structures
          </p>
        </header>

        <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
          <Card className="bg-gray-800/50 backdrop-blur border-gray-700/50 p-6 shadow-xl hover:shadow-2xl transition-shadow duration-300">
            <ModbusCalculator />
          </Card>
          
          <Card className="bg-gray-800/50 backdrop-blur border-gray-700/50 p-6 shadow-xl hover:shadow-2xl transition-shadow duration-300">
            <PacketVisualizer />
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;