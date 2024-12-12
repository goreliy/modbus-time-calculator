import React, { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export const ModbusCalculator = () => {
  const [numChannels, setNumChannels] = useState(1);
  const [numChangedChannels, setNumChangedChannels] = useState(0);
  const [baudRate, setBaudRate] = useState("9600");
  const [packetInterval, setPacketInterval] = useState(5);
  const [totalTime, setTotalTime] = useState(0);

  const baudRates = [
    "1200", "2400", "9600", "19200", "38400", "57600", "115200"
  ];

  useEffect(() => {
    calculatePollingTime();
  }, [numChannels, numChangedChannels, baudRate, packetInterval]);

  const calculatePollingTime = () => {
    const baud = parseInt(baudRate);
    const bytesPerPacket = 8; // Basic Modbus RTU packet size
    const responseSize = 7; // Basic response size
    
    // Time for one byte transmission in milliseconds
    const byteTime = (1000 / baud) * 10; // 10 bits per byte (including start/stop)
    
    // Time for one complete transaction
    const requestTime = bytesPerPacket * byteTime;
    const responseTime = responseSize * byteTime;
    const intervalTime = packetInterval * byteTime;
    
    const totalTimeMs = (requestTime + responseTime + intervalTime) * numChannels;
    setTotalTime(totalTimeMs);
    
    console.log('Calculated polling time:', totalTimeMs, 'ms');
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold mb-4">Modbus Calculator</h2>
      
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Number of Channels ({numChannels})</Label>
          <Slider
            value={[numChannels]}
            onValueChange={(value) => setNumChannels(value[0])}
            min={1}
            max={512}
            step={1}
          />
        </div>

        <div className="space-y-2">
          <Label>Channels with Changes ({numChangedChannels})</Label>
          <Slider
            value={[numChangedChannels]}
            onValueChange={(value) => setNumChangedChannels(value[0])}
            min={0}
            max={numChannels}
            step={1}
          />
        </div>

        <div className="space-y-2">
          <Label>Baud Rate</Label>
          <Select value={baudRate} onValueChange={setBaudRate}>
            <SelectTrigger>
              <SelectValue placeholder="Select baud rate" />
            </SelectTrigger>
            <SelectContent>
              {baudRates.map((rate) => (
                <SelectItem key={rate} value={rate}>
                  {rate} baud
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Packet Interval (bytes) ({packetInterval})</Label>
          <Slider
            value={[packetInterval]}
            onValueChange={(value) => setPacketInterval(value[0])}
            min={1}
            max={20}
            step={1}
          />
        </div>

        <Card className="bg-gray-700 p-4">
          <div className="text-center">
            <p className="text-sm text-gray-300">Total Polling Time</p>
            <p className="text-2xl font-bold">{totalTime.toFixed(2)} ms</p>
          </div>
        </Card>
      </div>
    </div>
  );
};