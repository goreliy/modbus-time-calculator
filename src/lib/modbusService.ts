import { toast } from "@/components/ui/use-toast";

export interface ModbusRequest {
  name: string;
  function: number;
  startAddress: number;
  count: number;
  data?: number[];
  comment?: string;
}

export interface ModbusResponse {
  requestHex: string;
  responseHex: string;
  parsedData: number[] | boolean[];
  timestamp: string;
  error?: string;
}

export interface ModbusSettings {
  port: string;
  baudRate: number;
  parity: 'N' | 'E' | 'O';
  stopBits: number;
  dataBits: number;
  timeout: number;
}

// Эмуляция работы с Modbus для веб-интерфейса
export class ModbusService {
  private static instance: ModbusService;
  private connected: boolean = false;
  private settings: ModbusSettings = {
    port: 'COM1',
    baudRate: 9600,
    parity: 'N',
    stopBits: 1,
    dataBits: 8,
    timeout: 1000
  };

  private constructor() {}

  static getInstance(): ModbusService {
    if (!ModbusService.instance) {
      ModbusService.instance = new ModbusService();
    }
    return ModbusService.instance;
  }

  async connect(settings: ModbusSettings): Promise<boolean> {
    try {
      this.settings = settings;
      this.connected = true;
      toast({
        title: "Connected",
        description: `Connected to ${settings.port}`,
      });
      return true;
    } catch (error) {
      toast({
        title: "Connection Error",
        description: error instanceof Error ? error.message : "Failed to connect",
        variant: "destructive",
      });
      return false;
    }
  }

  async disconnect(): Promise<void> {
    this.connected = false;
    toast({
      title: "Disconnected",
      description: "Modbus connection closed",
    });
  }

  async sendRequest(request: ModbusRequest): Promise<ModbusResponse> {
    if (!this.connected) {
      throw new Error("Not connected");
    }

    // Эмуляция отправки запроса
    const response: ModbusResponse = {
      requestHex: "01 03 00 00 00 0A CRC",
      responseHex: "01 03 14 00 00 00 00 00 00 00 00 00 00 CRC",
      parsedData: Array(request.count).fill(0).map(() => Math.floor(Math.random() * 65535)),
      timestamp: new Date().toISOString()
    };

    return new Promise(resolve => setTimeout(() => resolve(response), 100));
  }

  async getAvailablePorts(): Promise<string[]> {
    // В веб-версии возвращаем фиктивный список портов
    return ['COM1', 'COM2', 'COM3', '/dev/ttyUSB0', '/dev/ttyUSB1'];
  }

  isConnected(): boolean {
    return this.connected;
  }

  getSettings(): ModbusSettings {
    return { ...this.settings };
  }
}