import { ModbusRequest } from './modbusService';

export interface SavedModbusRequest {
  id: string;
  name: string;
  function: number;
  startAddress: number;
  count: number;
  slaveId: number;
  data?: number[];
  comment?: string;
  order: number;
  cycles?: number;
  delay_after?: number;
}

export const saveRequests = (requests: SavedModbusRequest[]) => {
  localStorage.setItem('modbus_requests', JSON.stringify(requests));
};

export const loadRequests = (): SavedModbusRequest[] => {
  const requests = localStorage.getItem('modbus_requests');
  return requests ? JSON.parse(requests) : [];
};
