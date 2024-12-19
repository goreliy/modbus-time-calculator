import React from 'react';
import { Button } from "@/components/ui/button";
import { Trash2, Send } from 'lucide-react';
import { RequestDetailsDialog } from './RequestDetailsDialog';
import { SavedModbusRequest } from '@/lib/storage';

interface RequestActionsProps {
  request: SavedModbusRequest;
  onDelete: () => void;
  onSend: () => void;
  disabled?: boolean;
  data: Array<{
    timestamp: string;
    values: {
      decimal: number[];
      hex: string[];
      binary: string[];
    };
  }>;
}

export const RequestActions = ({
  request,
  onDelete,
  onSend,
  disabled,
  data
}: RequestActionsProps) => {
  return (
    <div className="flex justify-end gap-2 mt-4">
      <RequestDetailsDialog request={request} data={data} />
      <Button
        variant="outline"
        size="icon"
        onClick={onDelete}
        disabled={disabled}
        className="text-red-500 hover:text-red-700"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        onClick={onSend}
        disabled={disabled}
        className="text-green-500 hover:text-green-700"
      >
        <Send className="h-4 w-4" />
      </Button>
    </div>
  );
};