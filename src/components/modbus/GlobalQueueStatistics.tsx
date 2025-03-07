
import React, { useEffect, useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Square, StopCircle, Server } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { SavedModbusRequest } from '@/lib/storage';
import { ModbusService } from '@/lib/modbusService';
import { toast } from 'sonner';
import { Input } from "@/components/ui/input";

interface GlobalStats {
  totalRequests: number;
  completedRequests: number;
  timeoutRequests: number;
  errorRequests: number;
  remainingRequests: number;
  startedRequests: number;
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
  const [isServerAvailable, setIsServerAvailable] = useState(true);

  useEffect(() => {
    const checkPollingStatus = async () => {
      try {
        const status = await ModbusService.getInstance().getPollingStatus();
        if (status && status.is_polling) {
          stats.isPolling = true;
          if (status.selected_requests) {
            status.selected_requests.forEach((requestName: string) => {
              const request = requests.find(r => r.name === requestName);
              if (request && !selectedRequests.includes(request.id)) {
                onRequestSelectionChange(request.id, true);
              }
            });
          }
          setIsServerAvailable(true);
        }
      } catch (error) {
        console.error('Error checking polling status:', error);
        setIsServerAvailable(false);
      }
    };

    checkPollingStatus();
  }, []);

  const handleStopTimeout = async () => {
    try {
      await ModbusService.getInstance().stopCurrentTimeout();
      toast.success('Текущий таймаут остановлен');
    } catch (error) {
      console.error('Error stopping timeout:', error);
      toast.error('Ошибка при остановке таймаута');
    }
  };

  return (
    <Card className="p-6 bg-gray-800/50 space-y-4 w-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
          Статистика очереди запросов
        </h2>
        <div className="flex gap-2 items-center">
          {!isServerAvailable && (
            <div className="px-3 py-1 bg-red-800/50 rounded-lg text-red-300 flex items-center gap-1 text-sm">
              <Server size={16} />
              Сервер недоступен
            </div>
          )}
          <Button
            variant="outline"
            onClick={handleStopTimeout}
            disabled={disabled || !stats.isPolling || !isServerAvailable}
            className="bg-yellow-500 hover:bg-yellow-600 text-white"
          >
            <StopCircle className="mr-2 h-4 w-4" />
            Стоп таймаут
          </Button>
          <Button
            className={`${stats.isPolling ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'} min-w-[120px]`}
            onClick={stats.isPolling ? onStopPolling : onStartPolling}
            disabled={disabled || selectedRequests.length === 0 || !isServerAvailable}
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
      </div>

      <div className="grid grid-cols-6 gap-4 mb-4">
        <div className="bg-gray-700/30 p-4 rounded-lg">
          <div className="text-gray-400 text-sm mb-1">Всего запросов</div>
          <div className="text-2xl font-bold text-white">{stats.totalRequests}</div>
        </div>
        <div className="bg-gray-700/30 p-4 rounded-lg">
          <div className="text-gray-400 text-sm mb-1">Стартовало</div>
          <div className="text-2xl font-bold text-purple-400">{stats.startedRequests}</div>
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
            <div key={request.id} className="flex items-center space-x-4">
              <Checkbox
                id={request.id}
                checked={selectedRequests.includes(request.id)}
                onCheckedChange={(checked) => onRequestSelectionChange(request.id, checked === true)}
                disabled={stats.isPolling}
              />
              <label htmlFor={request.id} className="text-sm text-gray-300 flex-grow">
                {request.name} ({request.function}, адрес: {request.startAddress})
              </label>
              <Input
                type="number"
                min="1"
                placeholder="Количество циклов"
                className="w-32"
                onChange={(e) => {
                  const cycles = parseInt(e.target.value);
                  request.cycles = cycles > 0 ? cycles : undefined;
                }}
                disabled={stats.isPolling}
              />
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};
