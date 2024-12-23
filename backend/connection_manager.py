from dataclasses import dataclass
from typing import Optional
import serial
import serial.tools.list_ports
import socket
import threading
import time

@dataclass
class ModbusSettings:
    port: str
    baudrate: int = 9600
    parity: str = 'N'
    stopbits: float = 1
    bytesize: int = 8
    timeout: float = 1000000  # microseconds (1 second)
    connection_type: str = 'serial'
    ip_address: Optional[str] = None
    tcp_port: Optional[int] = None

class ConnectionManager:
    def __init__(self):
        self.serial = None
        self.tcp_socket = None
        self._is_connected = False
        self._lock = threading.Lock()
        self._watchdog_thread = None
        self._stop_watchdog = threading.Event()

    def get_available_ports(self) -> list[str]:
        try:
            ports = []
            for port in serial.tools.list_ports.comports():
                ports.append(port.device)
            print(f"Found available ports: {ports}")
            return ports
        except Exception as e:
            print(f"Error getting available ports: {str(e)}")
            raise Exception(f"Failed to get available ports: {str(e)}")

    def _start_watchdog(self, timeout_microseconds: float):
        def watchdog():
            while not self._stop_watchdog.is_set():
                if not self._is_connected:
                    break
                time.sleep(timeout_microseconds / 2000000)  # Half the timeout in seconds
                with self._lock:
                    if self.serial and not self.serial.is_open:
                        print("Watchdog: Serial port closed unexpectedly")
                        self.disconnect()
                        break

        self._watchdog_thread = threading.Thread(target=watchdog)
        self._watchdog_thread.daemon = True
        self._watchdog_thread.start()

    def connect(self, settings: ModbusSettings) -> bool:
        with self._lock:
            try:
                self.disconnect()  # Always disconnect first
                
                # Convert microseconds to seconds for serial/socket timeout
                timeout_seconds = settings.timeout / 1_000_000
                
                if settings.connection_type == 'tcp':
                    self.tcp_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                    self.tcp_socket.settimeout(timeout_seconds)
                    self.tcp_socket.connect((settings.ip_address, settings.tcp_port))
                else:
                    self.serial = serial.Serial(
                        port=settings.port,
                        baudrate=settings.baudrate,
                        parity=settings.parity,
                        stopbits=settings.stopbits,
                        bytesize=settings.bytesize,
                        timeout=timeout_seconds  # pyserial uses seconds
                    )
                
                self._is_connected = True
                self._stop_watchdog.clear()
                self._start_watchdog(settings.timeout)
                print(f"Successfully connected to {settings.port if settings.port else settings.ip_address}")
                return True
                
            except Exception as e:
                print(f"Connection error: {str(e)}")
                self._is_connected = False
                return False

    def disconnect(self) -> None:
        with self._lock:
            self._stop_watchdog.set()
            if self._watchdog_thread:
                self._watchdog_thread.join(timeout=1.0)
            
            if self.serial:
                try:
                    if self.serial.is_open:
                        self.serial.close()
                except Exception as e:
                    print(f"Error closing serial port: {str(e)}")
                finally:
                    self.serial = None
                    
            if self.tcp_socket:
                try:
                    self.tcp_socket.close()
                except Exception as e:
                    print(f"Error closing TCP socket: {str(e)}")
                finally:
                    self.tcp_socket = None
                    
            self._is_connected = False
            print("Connection closed and resources released")

    def is_connected(self) -> bool:
        with self._lock:
            if self.serial:
                self._is_connected = self.serial.is_open
            elif self.tcp_socket:
                self._is_connected = True  # TCP connection status is checked on send/receive
            return self._is_connected

    def send_and_receive(self, data: bytearray) -> Optional[bytearray]:
        with self._lock:
            if not self.is_connected():
                return None
                
            try:
                if self.tcp_socket:
                    self.tcp_socket.send(data)
                    response = self.tcp_socket.recv(1024)
                else:
                    self.serial.write(data)
                    response = self.serial.read(256)
                
                if not response:
                    print("No response received within timeout period")
                    return None
                    
                return bytearray(response)
                
            except Exception as e:
                print(f"Communication error: {str(e)}")
                self._is_connected = False
                return None

    def __del__(self):
        self.disconnect()