import { ModbusRequest } from './modbusService';

export interface SavedModbusSettings {
  port: string;
  baudRate: number;
  parity: 'N' | 'E' | 'O';
  stopBits: number;
  dataBits: number;
  timeout: number;
}

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

const SETTINGS_KEY = 'modbus_settings';
const REQUESTS_KEY = 'modbus_requests';

export const saveSettings = (settings: SavedModbusSettings) => {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
};

export const loadSettings = (): SavedModbusSettings | null => {
  const saved = localStorage.getItem(SETTINGS_KEY);
  return saved ? JSON.parse(saved) : null;
};

export const saveRequests = (requests: SavedModbusRequest[]) => {
  localStorage.setItem(REQUESTS_KEY, JSON.stringify(requests));
};

export const loadRequests = (): SavedModbusRequest[] => {
  const saved = localStorage.getItem(REQUESTS_KEY);
  return saved ? JSON.parse(saved) : [];
};