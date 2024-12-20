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
import csv
import os
from pathlib import Path

@dataclass
class ModbusSettings:
    port: str
    baudrate: int = 9600
    parity: str = 'N'
    stopbits: float = 1
    bytesize: int = 8
    timeout: float = 1.0

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

class ModbusHandler:
    def __init__(self):
        self.serial = None
        self._lock = threading.Lock()
        self._crc16_table = self._generate_crc16_table()
        self._stop_polling = threading.Event()
        self._polling_thread = None
        self.logs_dir = Path("logs")
        self.logs_dir.mkdir(exist_ok=True)

    # ... keep existing code (CRC and port listing methods)

    def _save_exchange_log(self, request: ModbusRequest, response_data: Dict):
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = self.logs_dir / f"exchange_log_{timestamp}.csv"
        
        with open(filename, 'a', newline='') as f:
            writer = csv.writer(f)
            if f.tell() == 0:  # Write header if file is empty
                writer.writerow(['Timestamp', 'Request Name', 'Request HEX', 'Response HEX', 'Parsed Data'])
            
            writer.writerow([
                datetime.now().isoformat(),
                request.name,
                response_data.get('request_hex', ''),
                response_data.get('response_hex', ''),
                str(response_data.get('parsed_data', []))
            ])

    def _save_port_data(self, request: ModbusRequest, parsed_data: List[Union[int, bool]]):
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = self.logs_dir / f"port_data_{request.name}_{timestamp}.csv"
        
        with open(filename, 'a', newline='') as f:
            writer = csv.writer(f)
            if f.tell() == 0:  # Write header if file is empty
                writer.writerow(['Timestamp', 'Value'])
            
            for value in parsed_data:
                writer.writerow([datetime.now().isoformat(), value])

    def send_request(self, request: ModbusRequest) -> Dict:
        with self._lock:
            try:
                if not self.serial or not self.serial.is_open:
                    return {
                        "error": "Not connected",
                        "timestamp": datetime.now().isoformat()
                    }

                print(f"Sending request {request.name} to port {self.serial.port}")
                data = bytearray([request.slave_id, request.function])
                data.extend(struct.pack('>H', request.start_address))
                
                if request.function in [5, 6]:  # Write Single Coil/Register
                    value = request.data[0] if request.data else 0
                    if request.function == 5:  # Write Single Coil
                        value = 0xFF00 if value else 0x0000
                    data.extend(struct.pack('>H', value))
                else:
                    data.extend(struct.pack('>H', request.count))
                
                crc = self._calculate_crc(data)
                data.extend(struct.pack('<H', crc))
                
                print(f"Request data (hex): {data.hex()}")
                
                self.serial.reset_input_buffer()
                self.serial.write(data)
                
                response = bytearray()
                start_time = time.time()
                
                while (time.time() - start_time) < self.serial.timeout:
                    if self.serial.in_waiting:
                        new_data = self.serial.read(self.serial.in_waiting)
                        response.extend(new_data)
                        if len(response) >= 5:  # Minimum response length
                            break
                    time.sleep(0.001)
                
                if not response:
                    print(f"Timeout for request {request.name}")
                    return {
                        "error": "Timeout: No response received",
                        "request_hex": data.hex(),
                        "timestamp": datetime.now().isoformat()
                    }
                
                print(f"Received response (hex): {response.hex()}")
                
                try:
                    parsed_data = self._parse_response(bytes(response), request.function)
                    formatted_data = self._format_response_data(parsed_data)
                    
                    response_data = {
                        "request_hex": data.hex(),
                        "response_hex": response.hex(),
                        "parsed_data": parsed_data,
                        "formatted_data": formatted_data,
                        "timestamp": datetime.now().isoformat()
                    }
                    
                    # Save logs and data
                    self._save_exchange_log(request, response_data)
                    self._save_port_data(request, parsed_data)
                    
                    return response_data
                    
                except Exception as e:
                    print(f"Parse error for {request.name}: {str(e)}")
                    return {
                        "error": f"Parse error: {str(e)}",
                        "request_hex": data.hex(),
                        "response_hex": response.hex(),
                        "timestamp": datetime.now().isoformat()
                    }
                
            except Exception as e:
                print(f"Error in request {request.name}: {str(e)}")
                return {
                    "error": str(e),
                    "request_hex": data.hex() if 'data' in locals() else None,
                    "timestamp": datetime.now().isoformat()
                }

    def start_polling(self, requests: List[ModbusRequest], interval: float, cycles: Optional[int] = None) -> None:
        print(f"Starting polling with interval {interval}s and {cycles if cycles is not None else 'infinite'} cycles")
        self._stop_polling.clear()
        cycle_count = 0
        
        while not self._stop_polling.is_set():
            if cycles is not None:
                if cycle_count >= cycles:
                    print("Polling completed: reached cycle limit")
                    break
                cycle_count += 1
                print(f"Starting cycle {cycle_count} of {cycles}")
            
            sorted_requests = sorted(requests, key=lambda x: x.order)
            
            for request in sorted_requests:
                if self._stop_polling.is_set():
                    print("Polling stopped: received stop signal")
                    break
                    
                try:
                    print(f"Executing request {request.name} in cycle {cycle_count}")
                    response = self.send_request(request)
                    print(f"Poll response for {request.name}: {response}")
                    
                    if not self._stop_polling.is_set() and request.delay_after > 0:
                        print(f"Waiting {request.delay_after}s after request {request.name}")
                        time.sleep(request.delay_after)
                        
                except Exception as e:
                    print(f"Error during polling for {request.name}: {str(e)}")
                    continue
            
            if not self._stop_polling.is_set():
                if interval > 0:
                    print(f"Waiting {interval}s before next cycle")
                    time.sleep(interval)
                else:
                    time.sleep(0.001)

    def stop_polling(self) -> None:
        print("Stopping polling...")
        self._stop_polling.set()

    # ... keep existing code (_parse_response and other utility methods)