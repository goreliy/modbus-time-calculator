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
from request_queue import RequestQueue, ModbusRequest, RequestStats
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

class ModbusHandler:
    def __init__(self):
        self.serial = None
        self.tcp_socket = None
        self._lock = threading.Lock()
        self._crc16_table = generate_crc16_table()
        self._polling_thread = None
        self.logs_dir = Path("logs")
        self.logger = ModbusLogger(self.logs_dir)
        self.request_queue = RequestQueue()

    def get_available_ports(self) -> List[str]:
        try:
            ports = []
            for port in serial.tools.list_ports.comports():
                ports.append(port.device)
            print(f"Found available ports: {ports}")
            return ports
        except Exception as e:
            print(f"Error getting available ports: {str(e)}")
            raise Exception(f"Failed to get available ports: {str(e)}")

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
                    request.stats.remaining = self.request_queue.get_remaining_count(request.name)
                    return {
                        "error": "Timeout: No response received",
                        "request_hex": data.hex(),
                        "timestamp": datetime.now().isoformat(),
                        "stats": {
                            "total": request.stats.total,
                            "completed": request.stats.completed,
                            "timeouts": request.stats.timeouts,
                            "errors": request.stats.errors,
                            "remaining": request.stats.remaining
                        }
                    }

                try:
                    parsed_data = self._parse_response(bytes(response), request.function)
                    formatted_data = self._format_response_data(parsed_data)
                    request.stats.completed += 1
                    request.stats.remaining = self.request_queue.get_remaining_count(request.name)
                    
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
                    request.stats.remaining = self.request_queue.get_remaining_count(request.name)
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
                request.stats.remaining = self.request_queue.get_remaining_count(request.name)
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
        
        # Add address (2 bytes)
        data.extend([(request.start_address >> 8) & 0xFF, request.start_address & 0xFF])
        
        if request.function in [1, 2, 3, 4]:  # Read functions
            # Add quantity (2 bytes)
            data.extend([(request.count >> 8) & 0xFF, request.count & 0xFF])
        elif request.function in [5, 6]:  # Single write functions
            # Add single value (2 bytes)
            value = request.data[0] if request.data else 0
            data.extend([(value >> 8) & 0xFF, value & 0xFF])
        elif request.function in [15, 16]:  # Multiple write functions
            # Add quantity (2 bytes)
            data.extend([(request.count >> 8) & 0xFF, request.count & 0xFF])
            
            if request.function == 15:  # Write multiple coils
                byte_count = (request.count + 7) // 8
                data.append(byte_count)
                
                values = 0
                for i, value in enumerate(request.data or []):
                    if value:
                        values |= (1 << (i % 8))
                    if (i + 1) % 8 == 0 or i == len(request.data or []) - 1:
                        data.append(values)
                        values = 0
            else:  # Write multiple registers
                byte_count = request.count * 2
                data.append(byte_count)
                
                for value in request.data or []:
                    data.extend([(value >> 8) & 0xFF, value & 0xFF])
        
        # Calculate and append CRC
        crc = calculate_crc(data, self._crc16_table)
        data.extend([crc & 0xFF, (crc >> 8) & 0xFF])
        
        return data

    def _send_and_receive(self, data: bytearray) -> Optional[bytearray]:
        try:
            if self.tcp_socket:
                self.tcp_socket.send(data)
                response = self.tcp_socket.recv(1024)
            else:
                self.serial.write(data)
                response = self.serial.read(256)  # Adjust size as needed
            
            if not response:
                return None
                
            return bytearray(response)
            
        except Exception as e:
            print(f"Communication error: {str(e)}")
            return None

    def start_polling(self, requests: List[ModbusRequest], interval: float, cycles: Optional[int] = None) -> None:
        print(f"Starting polling with interval {interval}s and {cycles if cycles is not None else 'infinite'} cycles")
        self.request_queue = RequestQueue()
        
        # Initialize request queue
        for request in requests:
            self.request_queue.add_request(request, cycles)
        
        self._polling_thread = threading.Thread(target=self._polling_worker, args=(interval,))
        self._polling_thread.start()

    def _polling_worker(self, interval: float) -> None:
        while not self.request_queue.should_stop():
            request = self.request_queue.get_next_request()
            if not request:
                if interval > 0:
                    time.sleep(interval)
                continue
            
            try:
                print(f"Executing request {request.name}")
                response = self.send_request(request)
                print(f"Poll response for {request.name}: {response}")
                
                # For infinite polling, add the request back to the queue
                if request.stats.total == 0:
                    self.request_queue.add_request(request)
                
                if not self.request_queue.should_stop() and request.delay_after > 0:
                    time.sleep(request.delay_after)
                    
            except Exception as e:
                print(f"Error during polling for {request.name}: {str(e)}")
                request.stats.errors += 1
                continue
            
            if not self.request_queue.should_stop() and interval > 0:
                time.sleep(interval)

    def stop_polling(self) -> None:
        print("Stopping polling...")
        self.request_queue.stop()
        if self._polling_thread and self._polling_thread.is_alive():
            self._polling_thread.join()
        self.request_queue.clear()

    def _parse_response(self, response: bytes, function: int) -> List[Union[int, bool]]:
        if len(response) < 3:
            raise Exception("Response too short")
            
        # Skip slave ID and function code
        data = response[2:]
        
        if function in [1, 2]:  # Read coils or discrete inputs
            byte_count = data[0]
            coil_data = []
            
            for byte_val in data[1:byte_count+1]:
                for bit in range(8):
                    coil_data.append(bool(byte_val & (1 << bit)))
                    
            return coil_data
            
        elif function in [3, 4]:  # Read holding or input registers
            byte_count = data[0]
            register_data = []
            
            for i in range(1, byte_count, 2):
                if i + 1 < len(data):
                    register_data.append((data[i] << 8) | data[i + 1])
                    
            return register_data
            
        elif function in [5, 6, 15, 16]:  # Write functions
            # For write functions, return the written values
            return [(data[0] << 8) | data[1]]
            
        else:
            raise Exception(f"Unsupported function code: {function}")

    def _format_response_data(self, parsed_data: List[Union[int, bool]]) -> Dict[str, List[Union[int, bool]]]:
        formatted = {
            "decimal": [],
            "hex": [],
            "binary": []
        }
        
        for value in parsed_data:
            if isinstance(value, bool):
                formatted["decimal"].append(1 if value else 0)
                formatted["hex"].append("0x01" if value else "0x00")
                formatted["binary"].append("0b1" if value else "0b0")
            else:
                formatted["decimal"].append(value)
                formatted["hex"].append(f"0x{value:04X}")
                formatted["binary"].append(f"0b{value:016b}")
                
        return formatted