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
    delay_after: float = 0.1  # Delay after this request in seconds

class ModbusHandler:
    def __init__(self):
        self.serial = None
        self._lock = threading.Lock()
        self._crc16_table = self._generate_crc16_table()
        self._stop_polling = threading.Event()

    def _generate_crc16_table(self):
        # ... keep existing code (CRC table generation)

    def _calculate_crc(self, data: bytes) -> int:
        # ... keep existing code (CRC calculation)

    def get_available_ports(self) -> List[str]:
        # ... keep existing code (port listing)

    def connect(self, settings: ModbusSettings) -> bool:
        # ... keep existing code (connection handling)

    def disconnect(self):
        # ... keep existing code (disconnection handling)

    def _format_response_data(self, data: List[int]) -> Dict:
        """Format response data in different representations"""
        result = {
            "decimal": [],
            "hex": [],
            "binary": []
        }
        
        for value in data:
            result["decimal"].append(value)
            result["hex"].append(f"0x{value:04X}")
            result["binary"].append(f"0b{value:016b}")
            
        return result

    def send_request(self, request: ModbusRequest) -> Dict:
        with self._lock:
            try:
                if not self.serial or not self.serial.is_open:
                    return {
                        "error": "Not connected",
                        "timestamp": datetime.now().isoformat()
                    }

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
                    print(f"Timeout for request {request.name}, continuing with next request...")
                    return {
                        "error": "Timeout: No response received",
                        "request_hex": data.hex(),
                        "timestamp": datetime.now().isoformat()
                    }
                
                try:
                    parsed_data = self._parse_response(bytes(response), request.function)
                    formatted_data = self._format_response_data(parsed_data)
                    print(f"Response for {request.name}: {formatted_data}")
                    return {
                        "request_hex": data.hex(),
                        "response_hex": response.hex(),
                        "parsed_data": parsed_data,
                        "formatted_data": formatted_data,
                        "timestamp": datetime.now().isoformat()
                    }
                except Exception as e:
                    print(f"Parse error for {request.name}: {str(e)}, continuing...")
                    return {
                        "error": f"Parse error: {str(e)}",
                        "request_hex": data.hex(),
                        "response_hex": response.hex(),
                        "timestamp": datetime.now().isoformat()
                    }
                
            except Exception as e:
                print(f"Error in request {request.name}: {str(e)}, continuing...")
                return {
                    "error": str(e),
                    "request_hex": data.hex() if 'data' in locals() else None,
                    "timestamp": datetime.now().isoformat()
                }

    def _parse_response(self, response: bytes, function: int) -> Union[List[bool], List[int]]:
        # ... keep existing code (response parsing)

    def start_polling(self, requests: List[ModbusRequest], interval: float, cycles: Optional[int] = None) -> None:
        print(f"Starting polling with interval {interval}s and {cycles if cycles is not None else 'infinite'} cycles")
        self._stop_polling.clear()
        cycle_count = 0
        
        run_indefinitely = cycles is None or cycles == 0
        
        while not self._stop_polling.is_set():
            if not run_indefinitely and cycle_count >= cycles:
                print("Polling completed: reached cycle limit")
                break
                
            if not run_indefinitely:
                cycle_count += 1
                print(f"Starting cycle {cycle_count}")
            
            sorted_requests = sorted(requests, key=lambda x: x.order)
            
            for request in sorted_requests:
                if self._stop_polling.is_set():
                    print("Polling stopped: received stop signal")
                    break
                    
                try:
                    response = self.send_request(request)
                    print(f"Poll response for {request.name}: {response}")
                    
                    # Wait for the request-specific delay
                    if not self._stop_polling.is_set() and request.delay_after > 0:
                        time.sleep(request.delay_after)
                        
                except Exception as e:
                    print(f"Error during polling for {request.name}: {str(e)}, continuing with next request")
                    continue
                
                # Global interval between cycles
                if not self._stop_polling.is_set():
                    if interval > 0:
                        time.sleep(interval)
                    else:
                        time.sleep(0.001)

    def stop_polling(self) -> None:
        print("Stopping polling...")
        self._stop_polling.set()