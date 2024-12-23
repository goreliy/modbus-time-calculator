from dataclasses import dataclass
from typing import Optional
import serial
import serial.tools.list_ports
import socket

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

    def connect(self, settings: ModbusSettings) -> bool:
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
            return True
            
        except Exception as e:
            print(f"Connection error: {str(e)}")
            self._is_connected = False
            return False

    def disconnect(self) -> None:
        if self.serial and self.serial.is_open:
            self.serial.close()
            self.serial = None
        if self.tcp_socket:
            self.tcp_socket.close()
            self.tcp_socket = None
        self._is_connected = False

    def is_connected(self) -> bool:
        if self.serial:
            self._is_connected = self.serial.is_open
        elif self.tcp_socket:
            self._is_connected = True  # TCP connection status is checked on send/receive
        return self._is_connected

    def send_and_receive(self, data: bytearray) -> Optional[bytearray]:
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
                return None
                
            return bytearray(response)
            
        except Exception as e:
            print(f"Communication error: {str(e)}")
            self._is_connected = False  # Mark as disconnected on error
            return None
