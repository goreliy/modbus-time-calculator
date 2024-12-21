from dataclasses import dataclass
from typing import List, Optional, Union, Dict
import serial
import serial.tools.list_ports
import platform
import subprocess
from datetime import datetime
import struct
import threading
import time
from pathlib import Path
from modbus_utils import generate_crc16_table, calculate_crc
from modbus_logger import ModbusLogger
import socket

@dataclass
class ModbusSettings:
    port: str
    baudrate: int = 9600
    parity: str = 'N'
    stopbits: float = 1
    bytesize: int = 8
    timeout: float = 1.0
    connection_type: str = 'serial'
    ip_address: Optional[str] = None
    tcp_port: Optional[int] = None

@dataclass
class RequestStats:
    total: int = 0
    completed: int = 0
    timeouts: int = 0
    errors: int = 0
    remaining: int = 0

@dataclass
class ModbusRequest:
    name: str
    function: int
    start_address: int
    count: int = 1
    slave_id: int = 1
    data: Optional[List[int]] = None
    comment: Optional[str] = None
    order: int = 0
    delay_after: float = 0.1
    cycles: Optional[int] = None
    stats: RequestStats = RequestStats()

class ModbusHandler:
    def __init__(self):
        self.serial = None
        self.tcp_socket = None
        self._lock = threading.Lock()
        self._crc16_table = generate_crc16_table()
        self._stop_polling = threading.Event()
        self._polling_thread = None
        self.logs_dir = Path("logs")
        self.logger = ModbusLogger(self.logs_dir)
        self.request_queue = []
        self.current_request_stats = {}

    def connect(self, settings: ModbusSettings) -> bool:
        try:
            if settings.connection_type == 'tcp':
                if self.tcp_socket:
                    self.tcp_socket.close()
                self.tcp_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                self.tcp_socket.settimeout(settings.timeout)
                self.tcp_socket.connect((settings.ip_address, settings.tcp_port))
                return True
            else:
                if self.serial and self.serial.is_open:
                    self.serial.close()
                self.serial = serial.Serial(
                    port=settings.port,
                    baudrate=settings.baudrate,
                    parity=settings.parity,
                    stopbits=settings.stopbits,
                    bytesize=settings.bytesize,
                    timeout=settings.timeout
                )
                return True
        except Exception as e:
            print(f"Connection error: {str(e)}")
            return False

    def disconnect(self) -> None:
        if self.serial and self.serial.is_open:
            self.serial.close()
        if self.tcp_socket:
            self.tcp_socket.close()
            self.tcp_socket = None

    def send_request(self, request: ModbusRequest) -> Dict:
        with self._lock:
            try:
                if not (self.serial and self.serial.is_open) and not self.tcp_socket:
                    return {
                        "error": "Not connected",
                        "timestamp": datetime.now().isoformat()
                    }

                data = self._prepare_request(request)
                response = self._send_and_receive(data)
                
                if not response:
                    request.stats.timeouts += 1
                    return {
                        "error": "Timeout: No response received",
                        "request_hex": data.hex(),
                        "timestamp": datetime.now().isoformat()
                    }

                try:
                    parsed_data = self._parse_response(bytes(response), request.function)
                    formatted_data = self._format_response_data(parsed_data)
                    request.stats.completed += 1
                    
                    response_data = {
                        "request_hex": data.hex(),
                        "response_hex": response.hex(),
                        "parsed_data": parsed_data,
                        "formatted_data": formatted_data,
                        "timestamp": datetime.now().isoformat(),
                        "stats": {
                            "total": request.stats.total,
                            "completed": request.stats.completed,
                            "timeouts": request.stats.timeouts,
                            "errors": request.stats.errors,
                            "remaining": request.stats.remaining
                        }
                    }
                    
                    self.logger.save_exchange_log(request, response_data)
                    self.logger.save_port_data(request, parsed_data)
                    
                    return response_data
                    
                except Exception as e:
                    request.stats.errors += 1
                    return {
                        "error": f"Parse error: {str(e)}",
                        "request_hex": data.hex(),
                        "response_hex": response.hex(),
                        "timestamp": datetime.now().isoformat(),
                        "stats": {
                            "total": request.stats.total,
                            "completed": request.stats.completed,
                            "timeouts": request.stats.timeouts,
                            "errors": request.stats.errors,
                            "remaining": request.stats.remaining
                        }
                    }
                
            except Exception as e:
                request.stats.errors += 1
                return {
                    "error": str(e),
                    "timestamp": datetime.now().isoformat(),
                    "stats": {
                        "total": request.stats.total,
                        "completed": request.stats.completed,
                        "timeouts": request.stats.timeouts,
                        "errors": request.stats.errors,
                        "remaining": request.stats.remaining
                    }
                }

    def _prepare_request(self, request: ModbusRequest) -> bytearray:
        data = bytearray([request.slave_id, request.function])
        data.extend(struct.pack('>H', request.start_address))
        
        if request.function in [5, 6]:
            value = request.data[0] if request.data else 0
            if request.function == 5:
                value = 0xFF00 if value else 0x0000
            data.extend(struct.pack('>H', value))
        else:
            data.extend(struct.pack('>H', request.count))
        
        if self.tcp_socket:
            # Add Modbus TCP header
            transaction_id = 1  # Can be incremented for each request
            protocol_id = 0
            length = len(data)
            header = struct.pack('>HHH', transaction_id, protocol_id, length)
            data = header + data
        else:
            # Add CRC for RTU mode
            crc = calculate_crc(data, self._crc16_table)
            data.extend(struct.pack('<H', crc))
        
        return data

    def _send_and_receive(self, data: bytearray) -> Optional[bytearray]:
        if self.tcp_socket:
            self.tcp_socket.send(data)
            response = bytearray()
            while len(response) < 260:  # Maximum Modbus response size
                chunk = self.tcp_socket.recv(260 - len(response))
                if not chunk:
                    break
                response.extend(chunk)
            return response
        else:
            self.serial.reset_input_buffer()
            self.serial.write(data)
            response = bytearray()
            start_time = time.time()
            
            while (time.time() - start_time) < self.serial.timeout:
                if self.serial.in_waiting:
                    new_data = self.serial.read(self.serial.in_waiting)
                    response.extend(new_data)
                    if len(response) >= 5:
                        break
                time.sleep(0.001)
            
            return response if response else None

    def start_polling(self, requests: List[ModbusRequest], interval: float, cycles: Optional[int] = None) -> None:
        print(f"Starting polling with interval {interval}s and {cycles if cycles is not None else 'infinite'} cycles")
        self._stop_polling.clear()
        
        # Initialize request queue and statistics
        self.request_queue = []
        for request in requests:
            request.stats = RequestStats()
            request.stats.total = request.cycles if request.cycles is not None else (cycles if cycles is not None else 0)
            request.stats.remaining = request.stats.total
            self.request_queue.extend([request] * (request.cycles if request.cycles is not None else (cycles if cycles is not None else 1)))
        
        self._polling_thread = threading.Thread(target=self._polling_worker, args=(interval,))
        self._polling_thread.start()

    def _polling_worker(self, interval: float) -> None:
        while not self._stop_polling.is_set() and self.request_queue:
            request = self.request_queue.pop(0)
            
            try:
                print(f"Executing request {request.name}")
                response = self.send_request(request)
                print(f"Poll response for {request.name}: {response}")
                
                request.stats.remaining = len([r for r in self.request_queue if r.name == request.name])
                
                if not self._stop_polling.is_set() and request.delay_after > 0:
                    time.sleep(request.delay_after)
                    
            except Exception as e:
                print(f"Error during polling for {request.name}: {str(e)}")
                request.stats.errors += 1
                continue
            
            if not self._stop_polling.is_set() and interval > 0:
                time.sleep(interval)

    def stop_polling(self) -> None:
        print("Stopping polling...")
        self._stop_polling.set()
        if self._polling_thread and self._polling_thread.is_alive():
            self._polling_thread.join()
        self.request_queue.clear()

    def _parse_response(self, response: bytes, function: int) -> List[Union[int, bool]]:
        # Implementation of response parsing logic
        pass

    def _format_response_data(self, parsed_data: List[Union[int, bool]]) -> Dict[str, List[Union[int, bool]]]:
        # Implementation of response formatting logic
        pass