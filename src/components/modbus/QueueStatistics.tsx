import React from 'react';
import { Card } from "@/components/ui/card";

interface QueueStats {
  total: number;
  completed: number;
  timeouts: number;
  errors: number;
  remaining: number;
}

interface QueueStatisticsProps {
  stats: QueueStats;
  requestName: string;
}

export const QueueStatistics = ({ stats, requestName }: QueueStatisticsProps) => {
  return (
    <Card className="p-4 bg-gray-800/50 space-y-2">
      <h3 className="text-lg font-semibold text-white mb-4">
        Статистика запроса: {requestName}
      </h3>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-300">Всего запросов:</span>
            <span className="font-semibold text-white">{stats.total}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-300">Успешных ответов:</span>
            <span className="font-semibold text-green-400">{stats.completed}</span>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-300">Таймауты:</span>
            <span className="font-semibold text-yellow-400">{stats.timeouts}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-300">Ошибки:</span>
            <span className="font-semibold text-red-400">{stats.errors}</span>
          </div>
        </div>
      </div>
      <div className="mt-4 flex justify-between border-t border-gray-700 pt-2">
        <span className="text-gray-300">Осталось в очереди:</span>
        <span className="font-semibold text-blue-400">{stats.remaining}</span>
      </div>
    </Card>
  );
};