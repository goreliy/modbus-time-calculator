import { ModbusBackendServiceImpl } from './modbusBackend';
import { SavedModbusSettings, SavedModbusRequest } from './storage';
import { toast } from 'sonner';
import { API_BASE_URL } from '../config/api';

export class ModbusService {
  private static instance: ModbusService;
  private backendService: ModbusBackendServiceImpl;
  private pollingInterval: NodeJS.Timeout | null = null;
  private isBackendAvailable: boolean = true;

  private constructor() {
    this.backendService = ModbusBackendServiceImpl.getInstance();
  }

  static getInstance(): ModbusService {
    if (!ModbusService.instance) {
      ModbusService.instance = new ModbusService();
    }
    return ModbusService.instance;
  }

  private handleNetworkError(error: any, context: string) {
    console.error(`Network error in ${context}:`, error);
    this.isBackendAvailable = false;
    
    if (error.message === 'Failed to fetch' || error.code === 'ECONNREFUSED') {
      toast.error('Cannot connect to Modbus server. Please ensure the backend is running.');
    } else {
      toast.error(`Error in ${context}: ${error.message}`);
    }
    
    return null;
  }

  async stopCurrentTimeout(): Promise<void> {
    try {
      if (!this.isBackendAvailable) {
        toast.error('Cannot stop timeout: Modbus server is not available');
        return;
      }
      
      const response = await fetch(`${API_BASE_URL}/stop-timeout`, {
        method: 'POST'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      if (result.success) {
        console.log('Timeout stopped successfully');
      } else {
        throw new Error('Failed to stop timeout');
      }
    } catch (error) {
      return this.handleNetworkError(error, 'stopping timeout');
    }
  }

  async getAvailablePorts(): Promise<string[]> {
    try {
      if (!this.isBackendAvailable) {
        console.warn('Backend is not available, returning empty ports list');
        return [];
      }
      return await this.backendService.getAvailablePorts();
    } catch (error) {
      this.handleNetworkError(error, 'getting available ports');
      return [];
    }
  }

  async connect(settings: SavedModbusSettings): Promise<boolean> {
    try {
      if (!this.isBackendAvailable) {
        toast.error('Cannot connect: Modbus server is not available');
        return false;
      }
      
      const validatedSettings = {
        ...settings,
        baudRate: settings.baudRate || 9600,
        parity: settings.parity || 'N',
        stopBits: settings.stopBits || 1,
        dataBits: settings.dataBits || 8,
        timeout: settings.timeout || 10000,
        connectionType: settings.connectionType || 'serial'
      };
      
      return await this.backendService.connect(validatedSettings);
    } catch (error) {
      this.handleNetworkError(error, 'connecting to device');
      return false;
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (this.pollingInterval) {
        clearInterval(this.pollingInterval);
        this.pollingInterval = null;
      }
      if (this.isBackendAvailable) {
        await this.backendService.disconnect();
      }
    } catch (error) {
      this.handleNetworkError(error, 'disconnecting');
    }
  }

  async sendRequest(request: SavedModbusRequest): Promise<any> {
    try {
      if (!this.isBackendAvailable) {
        toast.error('Cannot send request: Modbus server is not available');
        return null;
      }
      return await this.backendService.sendRequest(request);
    } catch (error) {
      return this.handleNetworkError(error, 'sending request');
    }
  }

  async startPolling(settings: { requests: SavedModbusRequest[]; interval: number; cycles?: number }): Promise<void> {
    try {
      if (!this.isBackendAvailable) {
        toast.error('Cannot start polling: Modbus server is not available');
        return;
      }
      
      await this.backendService.startPolling(settings);
      
      if (this.pollingInterval) {
        clearInterval(this.pollingInterval);
      }
      
      this.pollingInterval = setInterval(async () => {
        try {
          const status = await this.getPollingStatus();
          console.log('Polling status update:', status);
        } catch (error) {
          console.error('Error updating polling status:', error);
        }
      }, 1000);
    } catch (error) {
      this.handleNetworkError(error, 'starting polling');
    }
  }

  async stopPolling(): Promise<void> {
    try {
      if (this.pollingInterval) {
        clearInterval(this.pollingInterval);
        this.pollingInterval = null;
      }
      if (this.isBackendAvailable) {
        await this.backendService.stopPolling();
      }
    } catch (error) {
      this.handleNetworkError(error, 'stopping polling');
    }
  }

  async getPollingStatus(): Promise<any> {
    try {
      if (!this.isBackendAvailable) {
        return { is_polling: false, error: 'Backend not available' };
      }
      
      const response = await fetch(`${API_BASE_URL}/polling-status`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      return this.handleNetworkError(error, 'getting polling status');
    }
  }
}
