export interface ModbusTimingResult {
  requestTime: number;
  responseTime: number;
  totalTime: number;
  bytesPerRequest: number;
  bytesPerResponse: number;
}

export const calculateModbusTiming = (
  baudRate: number,
  numChannels: number,
  packetInterval: number
): ModbusTimingResult => {
  const bytesPerRequest = 8; // Standard Modbus request size
  const bytesPerResponse = 7; // Standard Modbus response size
  const bitsPerByte = 10; // Start bit + 8 data bits + Stop bit

  // Calculate times in milliseconds
  const byteTime = (1000 / baudRate) * bitsPerByte;
  const requestTime = bytesPerRequest * byteTime;
  const responseTime = bytesPerResponse * byteTime;
  const intervalTime = packetInterval * byteTime;

  const totalTime = (requestTime + responseTime + intervalTime) * numChannels;

  return {
    requestTime,
    responseTime,
    totalTime,
    bytesPerRequest,
    bytesPerResponse,
  };
};