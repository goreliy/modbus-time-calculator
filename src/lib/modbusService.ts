import { SavedModbusRequest, SavedModbusSettings } from './storage';

export interface ModbusResponse {
  error?: string;
  requestHex?: string;
  responseHex?: string;
  timestamp: string;
  parsedData?: Array<number | boolean>;
  formatted_data?: {
    decimal: number[];
    hex: string[];
    binary: string[];
  };
}

interface PollingOptions {
  requests: SavedModbusRequest[];
  interval: number;
  cycles?: number;
}

class ModbusService {
  private static instance: ModbusService;
  private baseUrl: string;

  private constructor() {
    this.baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
  }

  public static getInstance(): ModbusService {
    if (!ModbusService.instance) {
      ModbusService.instance = new ModbusService();
    }
    return ModbusService.instance;
  }

  async getAvailablePorts(): Promise<string[]> {
    console.log('Fetching available ports from:', `${this.baseUrl}/ports`);
    const response = await fetch(`${this.baseUrl}/ports`);
    if (!response.ok) {
      console.error('Failed to get ports:', response.status, response.statusText);
      throw new Error('Failed to get available ports');
    }
    const data = await response.json();
    console.log('Received ports:', data);
    return data.ports;
  }

  async connect(settings: SavedModbusSettings): Promise<boolean> {
    console.log('Connecting with settings:', settings);
    const response = await fetch(`${this.baseUrl}/connect`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        port: settings.port,
        baudRate: settings.baudRate,
        parity: settings.parity,
        stopBits: settings.stopBits,
        dataBits: settings.dataBits,
        timeout: settings.timeout
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
      console.error('Connection failed:', errorData);
      throw new Error(`Failed to connect: ${errorData.detail}`);
    }

    const result = await response.json();
    return result.success;
  }

  async disconnect(): Promise<void> {
    const response = await fetch(`${this.baseUrl}/disconnect`, {
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error('Failed to disconnect');
    }
  }

  async sendRequest(request: SavedModbusRequest): Promise<ModbusResponse> {
    const response = await fetch(`${this.baseUrl}/request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: request.name,
        function: request.function,
        start_address: request.startAddress,
        count: request.count,
        slave_id: request.slaveId,
        data: request.data,
        comment: request.comment,
        order: request.order,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to send request');
    }

    return response.json();
  }

  async startPolling(options: PollingOptions): Promise<void> {
    const response = await fetch(`${this.baseUrl}/start-polling`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: options.requests.map(req => ({
          name: req.name,
          function: req.function,
          start_address: req.startAddress,
          count: req.count,
          slave_id: req.slaveId,
          data: req.data,
          comment: req.comment,
          order: req.order,
          delay_after: req.delay_after || 0.1,
        })),
        interval: options.interval,
        cycles: options.cycles,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to start polling');
    }
  }

  async stopPolling(): Promise<void> {
    const response = await fetch(`${this.baseUrl}/stop-polling`, {
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error('Failed to stop polling');
    }
  }
}

export { ModbusService };