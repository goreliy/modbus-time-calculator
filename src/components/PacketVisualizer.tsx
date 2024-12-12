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
    <div className="space-y-6">
      <h2 className="text-2xl font-bold mb-4">Packet Structure</h2>
      
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold mb-2">Request Packet</h3>
          <div className="grid grid-cols-7 gap-1">
            {requestPacket.map((byte, index) => (
              <div key={index} className="text-center">
                <Card className="bg-blue-900 p-2 mb-1">
                  <span className="text-sm font-mono">{byte.value}</span>
                </Card>
                <span className="text-xs text-gray-400">{byte.desc}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-2">Response Packet</h3>
          <div className="grid grid-cols-6 gap-1">
            {responsePacket.map((byte, index) => (
              <div key={index} className="text-center">
                <Card className="bg-green-900 p-2 mb-1">
                  <span className="text-sm font-mono">{byte.value}</span>
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