import React from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SavedModbusRequest } from '@/lib/storage';
import { Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface RequestFormProps {
  request: SavedModbusRequest;
  onUpdate: (updates: Partial<SavedModbusRequest>) => void;
  disabled?: boolean;
}

const getCountExplanation = (functionCode: number): string => {
  switch (functionCode) {
    case 1:
    case 2:
      return "Number of coils/discrete inputs to read";
    case 3:
    case 4:
      return "Number of registers to read (2 bytes each)";
    case 5:
      return "Always 1 - single coil write";
    case 6:
      return "Always 1 - single register write";
    case 15:
      return "Number of coils to write";
    case 16:
      return "Number of registers to write";
    default:
      return "Number of items to process";
  }
};

export const RequestForm = ({ request, onUpdate, disabled }: RequestFormProps) => {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label>Name</Label>
        <Input
          value={request.name}
          onChange={(e) => onUpdate({ name: e.target.value })}
          disabled={disabled}
        />
      </div>

      <div className="space-y-2">
        <Label>Comment</Label>
        <Input
          value={request.comment}
          onChange={(e) => onUpdate({ comment: e.target.value })}
          disabled={disabled}
        />
      </div>

      <div className="space-y-2">
        <Label>Function</Label>
        <Select
          value={request.function.toString()}
          onValueChange={(value) => onUpdate({ function: parseInt(value) })}
          disabled={disabled}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">1 - Read Coils</SelectItem>
            <SelectItem value="2">2 - Read Discrete Inputs</SelectItem>
            <SelectItem value="3">3 - Read Holding Registers</SelectItem>
            <SelectItem value="4">4 - Read Input Registers</SelectItem>
            <SelectItem value="5">5 - Write Single Coil</SelectItem>
            <SelectItem value="6">6 - Write Single Register</SelectItem>
            <SelectItem value="15">15 - Write Multiple Coils</SelectItem>
            <SelectItem value="16">16 - Write Multiple Registers</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Start Address</Label>
        <Input
          type="number"
          value={request.startAddress}
          onChange={(e) => onUpdate({ startAddress: parseInt(e.target.value) })}
          disabled={disabled}
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Label>Count</Label>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-4 w-4 text-gray-400" />
              </TooltipTrigger>
              <TooltipContent>
                <p>{getCountExplanation(request.function)}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <Input
          type="number"
          value={request.count}
          onChange={(e) => onUpdate({ count: parseInt(e.target.value) })}
          disabled={disabled}
        />
      </div>

      <div className="space-y-2">
        <Label>Slave ID</Label>
        <Input
          type="number"
          value={request.slaveId}
          onChange={(e) => onUpdate({ slaveId: parseInt(e.target.value) })}
          disabled={disabled}
        />
      </div>

      <div className="space-y-2">
        <Label>Cycles (empty for infinite)</Label>
        <Input
          type="number"
          value={request.cycles || ''}
          onChange={(e) => onUpdate({ cycles: e.target.value ? parseInt(e.target.value) : undefined })}
          disabled={disabled}
          min={1}
        />
      </div>

      <div className="space-y-2">
        <Label>Delay After Request (ms)</Label>
        <Input
          type="number"
          value={request.delay_after ? request.delay_after * 1000 : 100}
          onChange={(e) => onUpdate({ delay_after: parseInt(e.target.value) / 1000 })}
          disabled={disabled}
          min={0}
          max={10000}
        />
      </div>
    </div>
  );
};
