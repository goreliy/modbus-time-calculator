import { ModbusBackendServiceImpl } from './modbusBackend';

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
  data?: number[];
  comment?: string;
  slaveId?: number;
}

export interface ModbusResponse {
  requestHex: string;
  responseHex: string;
  parsedData: number[] | boolean[];
  timestamp: string;
  error?: string;
}

export class ModbusService {
  private static instance: ModbusService;
  private backendService: ModbusBackendServiceImpl;

  private constructor() {
    this.backendService = ModbusBackendServiceImpl.getInstance();
    console.log('ModbusService initialized');
  }

  static getInstance(): ModbusService {
    if (!ModbusService.instance) {
      ModbusService.instance = new ModbusService();
    }
    return ModbusService.instance;
  }

  async getAvailablePorts(): Promise<string[]> {
    return await this.backendService.getAvailablePorts();
  }

  async connect(settings: ModbusSettings): Promise<boolean> {
    return await this.backendService.connect(settings);
  }

  async disconnect(): Promise<void> {
    await this.backendService.disconnect();
  }

  async sendRequest(request: ModbusRequest): Promise<ModbusResponse> {
    return await this.backendService.sendRequest(request);
  }
}