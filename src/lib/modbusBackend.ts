import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

export interface ModbusBackendService {
  getAvailablePorts: () => Promise<string[]>;
  connect: (settings: ModbusSettings) => Promise<boolean>;
  disconnect: () => Promise<void>;
  sendRequest: (request: ModbusRequest) => Promise<ModbusResponse>;
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
}