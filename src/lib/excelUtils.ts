import * as XLSX from 'xlsx';
import { SavedModbusSettings, SavedModbusRequest } from './storage';

export const saveToExcel = (settings: SavedModbusSettings, requests: SavedModbusRequest[]) => {
  const workbook = XLSX.utils.book_new();

  // Save settings
  const settingsData = [
    ['Setting', 'Value'],
    ['Port', settings.port],
    ['Baud Rate', settings.baudRate],
    ['Parity', settings.parity],
    ['Stop Bits', settings.stopBits],
    ['Data Bits', settings.dataBits],
    ['Timeout', settings.timeout]
  ];
  const settingsSheet = XLSX.utils.aoa_to_sheet(settingsData);
  XLSX.utils.book_append_sheet(workbook, settingsSheet, 'Settings');

  // Save requests
  const requestsData = [
    ['Name', 'Function', 'Start Address', 'Count', 'Slave ID', 'Comment', 'Order']
  ];
  requests.forEach(req => {
    requestsData.push([
      req.name,
      req.function,
      req.startAddress,
      req.count,
      req.slaveId,
      req.comment || '',
      req.order
    ]);
  });
  const requestsSheet = XLSX.utils.aoa_to_sheet(requestsData);
  XLSX.utils.book_append_sheet(workbook, requestsSheet, 'Requests');

  // Save file
  XLSX.writeFile(workbook, 'modbus_config.xlsx');
};

export const loadFromExcel = async (file: File): Promise<{
  settings: Partial<SavedModbusSettings>;
  requests: SavedModbusRequest[];
}> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });

        // Parse settings
        const settingsSheet = workbook.Sheets['Settings'];
        const settingsData = XLSX.utils.sheet_to_json(settingsSheet, { header: 1 });
        const settings: Partial<SavedModbusSettings> = {};
        settingsData.slice(1).forEach((row: any[]) => {
          if (row[0] === 'Port') settings.port = row[1];
          if (row[0] === 'Baud Rate') settings.baudRate = parseInt(row[1]);
          if (row[0] === 'Parity') settings.parity = row[1] as 'N' | 'E' | 'O';
          if (row[0] === 'Stop Bits') settings.stopBits = parseFloat(row[1]);
          if (row[0] === 'Data Bits') settings.dataBits = parseInt(row[1]);
          if (row[0] === 'Timeout') settings.timeout = parseInt(row[1]);
        });

        // Parse requests
        const requestsSheet = workbook.Sheets['Requests'];
        const requestsData = XLSX.utils.sheet_to_json(requestsSheet);
        const requests: SavedModbusRequest[] = requestsData.map((row: any) => ({
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          name: row['Name'],
          function: parseInt(row['Function']),
          startAddress: parseInt(row['Start Address']),
          count: parseInt(row['Count']),
          slaveId: parseInt(row['Slave ID']),
          comment: row['Comment'],
          order: parseInt(row['Order'])
        }));

        resolve({ settings, requests });
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
};