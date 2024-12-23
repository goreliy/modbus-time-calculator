import { ModbusBackendServiceImpl } from './modbusBackend';
import { SavedModbusSettings, SavedModbusRequest } from './storage';

export class ModbusService {
  private static instance: ModbusService;
  private backendService: ModbusBackendServiceImpl;
  private pollingInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.backendService = ModbusBackendServiceImpl.getInstance();
  }

  static getInstance(): ModbusService {
    if (!ModbusService.instance) {
      ModbusService.instance = new ModbusService();
    }
    return ModbusService.instance;
  }

  async getAvailablePorts(): Promise<string[]> {
    return this.backendService.getAvailablePorts();
  }

  async connect(settings: SavedModbusSettings): Promise<boolean> {
    // Ensure all required fields are present before connecting
    const validatedSettings = {
      ...settings,
      baudRate: settings.baudRate || 9600,
      parity: settings.parity || 'N',
      stopBits: settings.stopBits || 1,
      dataBits: settings.dataBits || 8,
      timeout: settings.timeout || 10000,
      connectionType: settings.connectionType || 'serial'
    };
    return this.backendService.connect(validatedSettings);
  }

  async disconnect(): Promise<void> {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
    return this.backendService.disconnect();
  }

  async sendRequest(request: SavedModbusRequest): Promise<any> {
    return this.backendService.sendRequest(request);
  }

  async startPolling(settings: { requests: SavedModbusRequest[]; interval: number; cycles?: number }): Promise<void> {
    await this.backendService.startPolling(settings);
    
    // Start local polling for status updates
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
  }

  async stopPolling(): Promise<void> {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
    return this.backendService.stopPolling();
  }

  async getPollingStatus(): Promise<any> {
    const response = await fetch('http://localhost:8000/polling-status');
    if (!response.ok) {
      throw new Error('Failed to get polling status');
    }
    return response.json();
  }
}
