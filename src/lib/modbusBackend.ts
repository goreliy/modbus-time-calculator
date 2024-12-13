import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

export interface ModbusSettings {
  port: string;
  baudRate: number;
  parity: 'N' | 'E' | 'O';
  stopBits: number;
  dataBits: number;
  timeout: number;
}

export interface ModbusRequest {
  name: string;
  function: number;
  startAddress: number;
  count: number;
  slaveId?: number;
  data?: number[];
  comment?: string;
  order?: number;
}

export interface ModbusResponse {
  requestHex: string;
  responseHex: string;
  parsedData: number[] | boolean[];
  timestamp: string;
  error?: string;
}

export interface PollingSettings {
  requests: ModbusRequest[];
  interval: number;
  cycles?: number;
}

export interface ModbusBackendService {
  getAvailablePorts: () => Promise<string[]>;
  connect: (settings: ModbusSettings) => Promise<boolean>;
  disconnect: () => Promise<void>;
  sendRequest: (request: ModbusRequest) => Promise<ModbusResponse>;
  startPolling: (settings: PollingSettings) => Promise<void>;
  stopPolling: () => Promise<void>;
}

export class ModbusBackendServiceImpl implements ModbusBackendService {
  private static instance: ModbusBackendServiceImpl;

  private constructor() {
    console.log('ModbusBackendService initialized');
  }

  static getInstance(): ModbusBackendServiceImpl {
    if (!ModbusBackendServiceImpl.instance) {
      ModbusBackendServiceImpl.instance = new ModbusBackendServiceImpl();
    }
    return ModbusBackendServiceImpl.instance;
  }

  async getAvailablePorts(): Promise<string[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/ports`);
      console.log('Available ports:', response.data);
      return response.data.ports;
    } catch (error) {
      console.error('Error getting ports:', error);
      return [];
    }
  }

  async connect(settings: ModbusSettings): Promise<boolean> {
    try {
      const response = await axios.post(`${API_BASE_URL}/connect`, settings);
      console.log('Connection response:', response.data);
      return response.data.success;
    } catch (error) {
      console.error('Connection error:', error);
      return false;
    }
  }

  async disconnect(): Promise<void> {
    try {
      await axios.post(`${API_BASE_URL}/disconnect`);
      console.log('Disconnected successfully');
    } catch (error) {
      console.error('Disconnect error:', error);
    }
  }

  async sendRequest(request: ModbusRequest): Promise<ModbusResponse> {
    try {
      const response = await axios.post(`${API_BASE_URL}/request`, request);
      console.log('Modbus response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Request error:', error);
      throw error;
    }
  }

  async startPolling(settings: PollingSettings): Promise<void> {
    try {
      await axios.post(`${API_BASE_URL}/start-polling`, settings);
      console.log('Polling started');
    } catch (error) {
      console.error('Start polling error:', error);
      throw error;
    }
  }

  async stopPolling(): Promise<void> {
    try {
      await axios.post(`${API_BASE_URL}/stop-polling`);
      console.log('Polling stopped');
    } catch (error) {
      console.error('Stop polling error:', error);
      throw error;
    }
  }
}