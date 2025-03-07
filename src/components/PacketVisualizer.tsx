import React from 'react';
import { Card } from "@/components/ui/card";

export const PacketVisualizer = () => {
  const requestPacket = [
    { value: "0x0F", desc: "Device Address" },
    { value: "0x03", desc: "Function Code" },
    { value: "0x9C", desc: "Register High" },
    { value: "0x48", desc: "Register Low" },
    { value: "0x00", desc: "Count High" },
    { value: "0x01", desc: "Count Low" },
    { value: "CRC", desc: "Checksum" },
  ];

  const responsePacket = [
    { value: "0x0F", desc: "Device Address" },
    { value: "0x03", desc: "Function Code" },
    { value: "0x02", desc: "Byte Count" },
    { value: "0x6D", desc: "Data High" },
    { value: "0x2F", desc: "Data Low" },
    { value: "CRC", desc: "Checksum" },
  ];

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
        Packet Structure
      </h2>
      
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-4 text-gray-200">Request Packet</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
            {requestPacket.map((byte, index) => (
              <div key={index} className="text-center">
                <Card className="bg-gradient-to-br from-blue-900 to-blue-800 p-3 mb-2 hover:from-blue-800 hover:to-blue-700 transition-colors">
                  <span className="text-sm font-mono text-white">{byte.value}</span>
                </Card>
                <span className="text-xs text-gray-400">{byte.desc}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-4 text-gray-200">Response Packet</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
            {responsePacket.map((byte, index) => (
              <div key={index} className="text-center">
                <Card className="bg-gradient-to-br from-green-900 to-green-800 p-3 mb-2 hover:from-green-800 hover:to-green-700 transition-colors">
                  <span className="text-sm font-mono text-white">{byte.value}</span>
                </Card>
                <span className="text-xs text-gray-400">{byte.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};