import React, { useState } from 'react';
import { ModbusConnection } from '@/components/ModbusConnection';
import { ModbusDataVisualizer } from '@/components/ModbusDataVisualizer';
import { ModbusRequestManager } from '@/components/ModbusRequestManager';
import { SavedModbusRequest, loadRequests, saveRequests } from '@/lib/storage';

const Index = () => {
  const [modbusData, setModbusData] = useState<Array<number | boolean>>([]);
  const [requests, setRequests] = useState<SavedModbusRequest[]>(loadRequests());

  const handleRequestsChange = (newRequests: SavedModbusRequest[]) => {
    setRequests(newRequests);
    saveRequests(newRequests);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
            S2000PP Modbus Tool
          </h1>
          <p className="text-gray-400 text-lg md:text-xl">
            Configure and monitor Modbus RTU communications
          </p>
        </header>

        <ModbusRequestManager
          requests={requests}
          onRequestsChange={handleRequestsChange}
          onSendRequest={(request) => console.log('Send request:', request)}
        />

        <ModbusConnection 
          onDataReceived={setModbusData}
          requests={requests}
          onRequestsChange={handleRequestsChange}
        />

        {modbusData.length > 0 && (
          <ModbusDataVisualizer data={modbusData} title="Received Modbus Data" />
        )}
      </div>
    </div>
  );
};

export default Index;