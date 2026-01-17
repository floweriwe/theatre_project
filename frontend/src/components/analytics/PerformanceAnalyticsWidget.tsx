/**
 * Виджет аналитики спектаклей — Modern Theatre Elegance v3
 */

import { useQuery } from '@tanstack/react-query';
import {
  Theater,
  Clock,
  ListChecks,
  TrendingUp,
  AlertCircle,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { analyticsService } from '@/services/analytics_service';
import type { PerformanceAnalytics } from '@/types/analytics';

interface ProgressBarProps {
  value: number;
  max?: number;
  color?: string;
  label?: string;
}

function ProgressBar({ value, max = 100, color = 'bg-purple-500', label }: ProgressBarProps) {
  const percentage = Math.min(Math.round((value / max) * 100), 100);
  return (
    <div className="w-full">
      {label && (
        <div className="flex justify-between text-sm mb-1">
          <span className="text-text-secondary">{label}</span>
          <span className="text-text-primary">{percentage}%</span>
        </div>
      )}
      <div className="h-2 bg-surface rounded-full overflow-hidden">
        <div
          className={`h-full ${color} transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

export function PerformanceAnalyticsWidget() {
  const { data: analytics, isLoading, error } = useQuery<PerformanceAnalytics>({
    queryKey: ['performance-analytics'],
    queryFn: () => analyticsService.getPerformanceAnalytics(),
    staleTime: 5 * 60 * 1000, // 5 минут
  });

  if (error) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-3 text-red-400">
          <AlertCircle className="w-5 h-5" />
          <span>Ошибка загрузки аналитики спектаклей</span>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
          <Theater className="w-5 h-5 text-purple-400" />
        </div>
        <div>
          <h2 className="text-lg font-medium text-text-primary">Аналитика спектаклей</h2>
          <p className="text-sm text-text-muted">Обзор репертуара и готовности</p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : analytics ? (
        <div className="space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 rounded-lg bg-surface">
              <p className="text-2xl font-bold text-text-primary">{analytics.totalPerformances}</p>
              <p className="text-xs text-text-muted">Всего</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-surface">
              <p className="text-2xl font-bold text-emerald-400">{analytics.activePerformances}</p>
              <p className="text-xs text-text-muted">Активных</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-surface">
              <p className="text-2xl font-bold text-text-secondary">{analytics.archivedPerformances}</p>
              <p className="text-xs text-text-muted">В архиве</p>
            </div>
          </div>

          {/* Average Readiness */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-text-muted" />
                <span className="text-sm text-text-secondary">Средняя готовность</span>
              </div>
              <span className="text-lg font-medium text-purple-400">
                {analytics.averageReadiness}%
              </span>
            </div>
            <ProgressBar value={analytics.averageReadiness} color="bg-purple-500" />
          </div>

          {/* Checklist Stats */}
          <div className="p-4 rounded-lg bg-surface">
            <div className="flex items-center gap-2 mb-3">
              <ListChecks className="w-4 h-4 text-text-muted" />
              <span className="text-sm font-medium text-text-primary">Чеклисты</span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-text-secondary text-sm">Выполнено</span>
              <span className="text-emerald-400 font-medium">
                {analytics.completedChecklists} / {analytics.totalChecklists}
              </span>
            </div>
            <ProgressBar
              value={analytics.checklistCompletionRate}
              color="bg-emerald-500"
            />
          </div>

          {/* Status Breakdown */}
          {Object.keys(analytics.statusBreakdown).length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-text-primary mb-3">По статусам</h3>
              <div className="space-y-2">
                {Object.entries(analytics.statusBreakdown).map(([status, count]) => (
                  <div key={status} className="flex justify-between items-center">
                    <span className="text-text-secondary text-sm capitalize">{status}</span>
                    <span className="text-text-primary font-medium">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Most Inventory Heavy */}
          {analytics.mostInventoryHeavy.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-text-primary mb-3">
                Больше всего реквизита
              </h3>
              <div className="space-y-2">
                {analytics.mostInventoryHeavy.slice(0, 3).map((item) => (
                  <div key={item.id} className="flex justify-between items-center p-2 rounded bg-surface">
                    <span className="text-text-secondary text-sm truncate flex-1">{item.title}</span>
                    <span className="text-blue-400 font-medium ml-2">{item.inventoryCount}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Most Scheduled */}
          {analytics.mostScheduled.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-text-primary mb-3">
                Чаще в расписании
              </h3>
              <div className="space-y-2">
                {analytics.mostScheduled.slice(0, 3).map((item) => (
                  <div key={item.id} className="flex justify-between items-center p-2 rounded bg-surface">
                    <span className="text-text-secondary text-sm truncate flex-1">{item.title}</span>
                    <div className="flex items-center gap-1 text-amber-400 ml-2">
                      <Clock className="w-3 h-3" />
                      <span className="font-medium">{item.eventCount}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : null}
    </Card>
  );
}

export default PerformanceAnalyticsWidget;
