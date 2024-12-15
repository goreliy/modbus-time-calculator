import React from 'react';
import { Button } from "@/components/ui/button";
import { Trash2 } from 'lucide-react';

interface RequestActionsProps {
  onDelete: () => void;
  onSend: () => void;
  disabled?: boolean;
}

export const RequestActions = ({ onDelete, onSend, disabled }: RequestActionsProps) => {
  return (
    <div className="flex justify-end gap-2 mt-4">
      <Button
        variant="destructive"
        size="sm"
        onClick={onDelete}
        disabled={disabled}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
      <Button
        onClick={onSend}
        disabled={disabled}
        className="bg-blue-600 hover:bg-blue-700"
      >
        Send
      </Button>
    </div>
  );
};