export interface SavedModbusSettings {
  port: string;
  baudRate: number;
  parity: 'N' | 'E' | 'O';
  stopBits: number;
  dataBits: number;
  timeout: number;  // in microseconds
  connectionType: 'serial' | 'tcp';
  ipAddress?: string;
  tcpPort?: number;
}

export interface SavedModbusRequest {
  id: string;
  name: string;
  function: number;
  startAddress: number;
  count: number;
  slaveId: number;
  comment?: string;
  order: number;
  cycles?: number;
  delay_after: number;  // in microseconds
}

export const DEFAULT_SETTINGS: SavedModbusSettings = {
  port: '',
  baudRate: 9600,
  parity: 'N',
  stopBits: 1,
  dataBits: 8,
  timeout: 10000,  // 10000 microseconds (0.01 seconds)
  connectionType: 'serial'
};

const SETTINGS_KEY = 'modbusSettings';
const REQUESTS_KEY = 'modbusRequests';

export const saveSettings = (settings: SavedModbusSettings): void => {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
};

export const loadSettings = (): SavedModbusSettings => {
  const settings = localStorage.getItem(SETTINGS_KEY);
  return settings ? JSON.parse(settings) : DEFAULT_SETTINGS;
};

export const saveRequests = (requests: SavedModbusRequest[]): void => {
  localStorage.setItem(REQUESTS_KEY, JSON.stringify(requests));
};

export const loadRequests = (): SavedModbusRequest[] => {
  const saved = localStorage.getItem(REQUESTS_KEY);
  return saved ? JSON.parse(saved) : [];
};