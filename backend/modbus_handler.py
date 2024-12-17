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

class ModbusHandler:
    def __init__(self):
        self.serial = None
        self._lock = threading.Lock()
        self._crc16_table = self._generate_crc16_table()
        self._stop_polling = threading.Event()

    def _generate_crc16_table(self):
        table = []
        for i in range(256):
            crc = 0
            c = i
            for j in range(8):
                if (crc ^ c) & 0x0001:
                    crc = (crc >> 1) ^ 0xA001
                else:
                    crc = crc >> 1
                c = c >> 1
            table.append(crc)
        return table

    def _calculate_crc(self, data: bytes) -> int:
        crc = 0xFFFF
        for byte in data:
            crc = (crc >> 8) ^ self._crc16_table[(crc ^ byte) & 0xFF]
        return crc

    def get_available_ports(self) -> List[str]:
        ports = []
        for port in serial.tools.list_ports.comports():
            ports.append(port.device)
        return ports

    def connect(self, settings: ModbusSettings) -> bool:
        try:
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

    def disconnect(self):
        if self.serial and self.serial.is_open:
            self.serial.close()
            self.serial = None

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
                    print(f"Timeout for request {request.name}, but continuing...")
                    return {
                        "error": "Timeout: No response received",
                        "request_hex": data.hex(),
                        "timestamp": datetime.now().isoformat()
                    }
                
                try:
                    parsed_data = self._parse_response(bytes(response), request.function)
                    return {
                        "request_hex": data.hex(),
                        "response_hex": response.hex(),
                        "parsed_data": parsed_data,
                        "timestamp": datetime.now().isoformat()
                    }
                except Exception as e:
                    print(f"Parse error for request {request.name}: {str(e)}, but continuing...")
                    return {
                        "error": f"Parse error: {str(e)}",
                        "request_hex": data.hex(),
                        "response_hex": response.hex(),
                        "timestamp": datetime.now().isoformat()
                    }
                
            except Exception as e:
                print(f"Error in request {request.name}: {str(e)}, but continuing...")
                return {
                    "error": str(e),
                    "request_hex": data.hex() if 'data' in locals() else None,
                    "timestamp": datetime.now().isoformat()
                }

    def _parse_response(self, response: bytes, function: int) -> Union[List[bool], List[int]]:
        if len(response) < 5:
            raise ValueError("Response too short")
        
        received_crc = struct.unpack('<H', response[-2:])[0]
        calculated_crc = self._calculate_crc(response[:-2])
        if received_crc != calculated_crc:
            raise ValueError("CRC check failed")
        
        if response[1] & 0x80:
            error_code = response[2]
            raise Exception(f"Modbus error: {error_code}")
        
        if function in [1, 2]:  # Read Coils/Discrete Inputs
            byte_count = response[2]
            coil_data = []
            for i in range(byte_count):
                byte_value = response[3 + i]
                for bit in range(8):
                    coil_data.append(bool(byte_value & (1 << bit)))
            return coil_data
        
        elif function in [3, 4]:  # Read Holding/Input Registers
            byte_count = response[2]
            register_count = byte_count // 2
            registers = []
            for i in range(register_count):
                register = struct.unpack('>H', response[3 + i*2:5 + i*2])[0]
                registers.append(register)
            return registers
        
        elif function in [5, 6]:  # Write Single Coil/Register
            value = struct.unpack('>H', response[4:6])[0]
            return [value]
        
        elif function in [15, 16]:  # Write Multiple Coils/Registers
            count = struct.unpack('>H', response[4:6])[0]
            return [count]
        
        else:
            raise ValueError(f"Unsupported function: {function}")

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
                except Exception as e:
                    print(f"Error during polling for {request.name}: {str(e)}, continuing with next request")
                    continue
                
                if not self._stop_polling.is_set():
                    if interval > 0:
                        time.sleep(interval)
                    else:
                        time.sleep(0.001)

    def stop_polling(self) -> None:
        print("Stopping polling...")
        self._stop_polling.set()
