import React from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Square } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { SavedModbusRequest } from '@/lib/storage';

interface GlobalStats {
  totalRequests: number;
  completedRequests: number;
  timeoutRequests: number;
  errorRequests: number;
  remainingRequests: number;
  isPolling: boolean;
}

interface GlobalQueueStatisticsProps {
  stats: GlobalStats;
  onStartPolling: () => void;
  onStopPolling: () => void;
  disabled?: boolean;
  requests: SavedModbusRequest[];
  selectedRequests: string[];
  onRequestSelectionChange: (requestId: string, selected: boolean) => void;
}

export const GlobalQueueStatistics = ({ 
  stats, 
  onStartPolling, 
  onStopPolling,
  disabled,
  requests,
  selectedRequests,
  onRequestSelectionChange
}: GlobalQueueStatisticsProps) => {
  console.log("Current stats:", stats);
  console.log("Selected requests:", selectedRequests);

  return (
    <Card className="p-6 bg-gray-800/50 space-y-4 w-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
          Статистика очереди запросов
        </h2>
        <Button
          className={`${stats.isPolling ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'} min-w-[120px]`}
          onClick={stats.isPolling ? onStopPolling : onStartPolling}
          disabled={disabled || selectedRequests.length === 0}
        >
          {stats.isPolling ? (
            <>
              <Square className="mr-2 h-4 w-4" />
              Стоп
            </>
          ) : (
            <>
              <Play className="mr-2 h-4 w-4" />
              Старт
            </>
          )}
        </Button>
      </div>

      <div className="grid grid-cols-5 gap-4 mb-4">
        <div className="bg-gray-700/30 p-4 rounded-lg">
          <div className="text-gray-400 text-sm mb-1">Всего запросов</div>
          <div className="text-2xl font-bold text-white">{stats.totalRequests}</div>
        </div>
        <div className="bg-gray-700/30 p-4 rounded-lg">
          <div className="text-gray-400 text-sm mb-1">Успешных</div>
          <div className="text-2xl font-bold text-green-400">{stats.completedRequests}</div>
        </div>
        <div className="bg-gray-700/30 p-4 rounded-lg">
          <div className="text-gray-400 text-sm mb-1">Таймауты</div>
          <div className="text-2xl font-bold text-yellow-400">{stats.timeoutRequests}</div>
        </div>
        <div className="bg-gray-700/30 p-4 rounded-lg">
          <div className="text-gray-400 text-sm mb-1">Ошибки</div>
          <div className="text-2xl font-bold text-red-400">{stats.errorRequests}</div>
        </div>
        <div className="bg-gray-700/30 p-4 rounded-lg">
          <div className="text-gray-400 text-sm mb-1">В очереди</div>
          <div className="text-2xl font-bold text-blue-400">{stats.remainingRequests}</div>
        </div>
      </div>

      <div className="bg-gray-700/30 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-3">Выбор запросов для очереди</h3>
        <div className="space-y-2">
          {requests.map((request) => (
            <div key={request.id} className="flex items-center space-x-2">
              <Checkbox
                id={request.id}
                checked={selectedRequests.includes(request.id)}
                onCheckedChange={(checked) => onRequestSelectionChange(request.id, checked === true)}
              />
              <label htmlFor={request.id} className="text-sm text-gray-300">
                {request.name} ({request.function}, адрес: {request.startAddress})
              </label>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};