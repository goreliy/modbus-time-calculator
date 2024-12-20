import csv
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Union
from .modbus_handler import ModbusRequest

class ModbusLogger:
    def __init__(self, logs_dir: Path):
        self.logs_dir = logs_dir
        self.logs_dir.mkdir(exist_ok=True)

    def save_exchange_log(self, request: ModbusRequest, response_data: Dict):
        """Save request/response exchange data to CSV."""
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

    def save_port_data(self, request: ModbusRequest, parsed_data: List[Union[int, bool]]):
        """Save parsed port data to CSV."""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = self.logs_dir / f"port_data_{request.name}_{timestamp}.csv"
        
        with open(filename, 'a', newline='') as f:
            writer = csv.writer(f)
            if f.tell() == 0:  # Write header if file is empty
                writer.writerow(['Timestamp', 'Value'])
            
            for value in parsed_data:
                writer.writerow([datetime.now().isoformat(), value])