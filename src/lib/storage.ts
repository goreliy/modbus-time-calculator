export interface SavedModbusSettings {
  port: string;
  baudRate?: number;
  parity?: string;
  stopBits?: number;
  dataBits?: number;
  timeout: number;  // in microseconds
  connectionType?: string;
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
  data?: number[];
  comment?: string;
  order?: number;
  cycles?: number;
  delay_after: number;  // in microseconds
}

const DEFAULT_SETTINGS: SavedModbusSettings = {
  port: '',
  baudRate: 9600,
  parity: 'N',
  stopBits: 1,
  dataBits: 8,
  timeout: 10000,  // 10000 microseconds (0.01 seconds)
  connectionType: 'serial'
};

const loadSettings = (): SavedModbusSettings => {
  // Load settings from local storage or return default settings
  const settings = localStorage.getItem('modbusSettings');
  return settings ? JSON.parse(settings) : DEFAULT_SETTINGS;
};

const saveSettings = (settings: SavedModbusSettings) => {
  // Save settings to local storage
  localStorage.setItem('modbusSettings', JSON.stringify(settings));
};

export { DEFAULT_SETTINGS, loadSettings, saveSettings };
