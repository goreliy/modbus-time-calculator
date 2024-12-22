import React from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Square } from "lucide-react";

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
}

export const GlobalQueueStatistics = ({ 
  stats, 
  onStartPolling, 
  onStopPolling,
  disabled 
}: GlobalQueueStatisticsProps) => {
  return (
    <Card className="p-6 bg-gray-800/50 space-y-4 w-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
          Статистика очереди запросов
        </h2>
        <Button
          className={`${stats.isPolling ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'} min-w-[120px]`}
          onClick={stats.isPolling ? onStopPolling : onStartPolling}
          disabled={disabled}
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

      <div className="grid grid-cols-5 gap-4">
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
    </Card>
  );
};