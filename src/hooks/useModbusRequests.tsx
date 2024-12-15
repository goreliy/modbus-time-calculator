import { useState } from 'react';
import { SavedModbusRequest, saveRequests, loadRequests } from '@/lib/storage';
import { toast } from 'sonner';

export const useModbusRequests = () => {
  const [requests, setRequests] = useState<SavedModbusRequest[]>(() => {
    try {
      return loadRequests() || [];
    } catch (error) {
      console.error('Error loading requests:', error);
      toast.error('Failed to load saved requests');
      return [];
    }
  });

  const handleRequestsChange = (newRequests: SavedModbusRequest[]) => {
    try {
      setRequests(newRequests);
      saveRequests(newRequests);
    } catch (error) {
      console.error('Error saving requests:', error);
      toast.error('Failed to save requests');
    }
  };

  return {
    requests,
    handleRequestsChange
  };
};