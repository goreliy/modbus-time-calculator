import { toast } from "@/components/ui/use-toast";

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
  private connected: boolean = false;
  private settings: ModbusSettings = {
    port: '',
    baudRate: 9600,
    parity: 'N',
    stopBits: 1,
    dataBits: 8,
    timeout: 1000
  };

  private constructor() {
    console.log('ModbusService initialized');
  }

  static getInstance(): ModbusService {
    if (!ModbusService.instance) {
      ModbusService.instance = new ModbusService();
    }
    return ModbusService.instance;
  }

  async connect(settings: ModbusSettings): Promise<boolean> {
    try {
      console.log('Connecting with settings:', settings);
      this.settings = settings;
      this.connected = true;
      toast({
        title: "Connected",
        description: `Connected to ${settings.port}`,
      });
      return true;
    } catch (error) {
      console.error('Connection error:', error);
      toast({
        title: "Connection Error",
        description: error instanceof Error ? error.message : "Failed to connect",
        variant: "destructive",
      });
      return false;
    }
  }

  async disconnect(): Promise<void> {
    console.log('Disconnecting');
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

    console.log('Sending request:', request);

    // Симуляция отправки запроса и получения ответа
    const response: ModbusResponse = {
      requestHex: this.createRequestHex(request),
      responseHex: this.createResponseHex(request),
      parsedData: this.simulateResponse(request),
      timestamp: new Date().toISOString()
    };

    return new Promise(resolve => setTimeout(() => resolve(response), 100));
  }

  private createRequestHex(request: ModbusRequest): string {
    const slaveId = request.slaveId || 1;
    const functionCode = request.function;
    const address = request.startAddress;
    const count = request.count;

    // Создаем hex-представление запроса
    return `${slaveId.toString(16).padStart(2, '0')} ${functionCode.toString(16).padStart(2, '0')} ${address.toString(16).padStart(4, '0')} ${count.toString(16).padStart(4, '0')} CRC`;
  }

  private createResponseHex(request: ModbusRequest): string {
    const slaveId = request.slaveId || 1;
    const functionCode = request.function;
    const byteCount = request.count * 2;

    // Создаем hex-представление ответа
    return `${slaveId.toString(16).padStart(2, '0')} ${functionCode.toString(16).padStart(2, '0')} ${byteCount.toString(16).padStart(2, '0')} DATA CRC`;
  }

  private simulateResponse(request: ModbusRequest): number[] | boolean[] {
    switch (request.function) {
      case 1: // Read Coils
      case 2: // Read Discrete Inputs
        return Array(request.count).fill(false).map(() => Math.random() > 0.5);
      
      case 3: // Read Holding Registers
      case 4: // Read Input Registers
        return Array(request.count).fill(0).map(() => Math.floor(Math.random() * 65535));
      
      case 5: // Write Single Coil
        return [request.data?.[0] ? 1 : 0];
      
      case 6: // Write Single Register
        return request.data || [0];
      
      case 15: // Write Multiple Coils
      case 16: // Write Multiple Registers
        return request.data || [];
      
      default:
        return [];
    }
  }

  async getAvailablePorts(): Promise<string[]> {
    // В веб-версии возвращаем фиктивный список портов
    // В реальном приложении здесь будет запрос к бэкенду
    return ['COM1', 'COM2', 'COM3', '/dev/ttyUSB0', '/dev/ttyUSB1'];
  }

  isConnected(): boolean {
    return this.connected;
  }

  getSettings(): ModbusSettings {
    return { ...this.settings };
  }
}