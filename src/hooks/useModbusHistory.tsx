import { useState } from 'react';

export interface HistoryEntry {
  timestamp: string;
  requestHex: string;
  responseHex: string;
  requestName: string;
  error: string | null;
}

export const useModbusHistory = () => {
  const [history, setHistory] = useState<HistoryEntry[]>(() => {
    try {
      const savedHistory = localStorage.getItem('modbus_history');
      return savedHistory ? JSON.parse(savedHistory) : [];
    } catch (error) {
      console.error('Error loading history:', error);
      return [];
    }
  });

  const addHistoryEntry = (entry: HistoryEntry) => {
    setHistory(prev => {
      const newHistory = [entry, ...prev].slice(0, 1000);
      localStorage.setItem('modbus_history', JSON.stringify(newHistory));
      return newHistory;
    });
  };

  return {
    history,
    addHistoryEntry
  };
};