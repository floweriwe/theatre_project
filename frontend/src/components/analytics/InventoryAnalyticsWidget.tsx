/**
 * Виджет аналитики инвентаря — Modern Theatre Elegance v3
 */

import { useQuery } from '@tanstack/react-query';
import {
  Package,
  Wrench,
  AlertTriangle,
  TrendingDown,
  BarChart3,
  AlertCircle,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { analyticsService } from '@/services/analytics_service';
import type { InventoryAnalytics } from '@/types/analytics';

interface ProgressBarProps {
  value: number;
  max?: number;
  color?: string;
}

function ProgressBar({ value, max = 100, color = 'bg-blue-500' }: ProgressBarProps) {
  const percentage = Math.min(Math.round((value / max) * 100), 100);
  return (
    <div className="h-2 bg-surface rounded-full overflow-hidden">
      <div
        className={`h-full ${color} transition-all duration-500`}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}

function formatCurrency(value: number | null): string {
  if (value === null) return '—';
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function InventoryAnalyticsWidget() {
  const { data: analytics, isLoading, error } = useQuery<InventoryAnalytics>({
    queryKey: ['inventory-analytics'],
    queryFn: () => analyticsService.getInventoryAnalytics(),
    staleTime: 5 * 60 * 1000, // 5 минут
  });

  if (error) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-3 text-red-400">
          <AlertCircle className="w-5 h-5" />
          <span>Ошибка загрузки аналитики инвентаря</span>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
          <Package className="w-5 h-5 text-blue-400" />
        </div>
        <div>
          <h2 className="text-lg font-medium text-text-primary">Аналитика инвентаря</h2>
          <p className="text-sm text-text-muted">Состояние и использование</p>
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
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 rounded-lg bg-surface">
              <p className="text-2xl font-bold text-text-primary">{analytics.totalItems}</p>
              <p className="text-xs text-text-muted">Позиций</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-surface">
              <p className="text-2xl font-bold text-text-primary">{analytics.totalQuantity}</p>
              <p className="text-xs text-text-muted">Единиц</p>
            </div>
          </div>

          {/* Total Value */}
          <div className="p-4 rounded-lg bg-gradient-to-r from-gold/10 to-transparent border border-gold/20">
            <div className="flex items-center justify-between">
              <span className="text-text-secondary">Общая стоимость</span>
              <span className="text-xl font-bold text-gold">
                {formatCurrency(analytics.totalValue)}
              </span>
            </div>
          </div>

          {/* Availability Status */}
          <div>
            <h3 className="text-sm font-medium text-text-primary mb-3">Доступность</h3>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-emerald-400">Доступно</span>
                  <span className="text-text-primary">{analytics.itemsAvailable}</span>
                </div>
                <ProgressBar
                  value={analytics.itemsAvailable}
                  max={analytics.totalItems}
                  color="bg-emerald-500"
                />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-amber-400">Зарезервировано</span>
                  <span className="text-text-primary">{analytics.itemsReserved}</span>
                </div>
                <ProgressBar
                  value={analytics.itemsReserved}
                  max={analytics.totalItems}
                  color="bg-amber-500"
                />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-blue-400">В использовании</span>
                  <span className="text-text-primary">{analytics.itemsInUse}</span>
                </div>
                <ProgressBar
                  value={analytics.itemsInUse}
                  max={analytics.totalItems}
                  color="bg-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Items Needing Repair */}
          {analytics.itemsNeedingRepair > 0 && (
            <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
              <div className="flex items-center gap-3">
                <Wrench className="w-5 h-5 text-red-400" />
                <div>
                  <p className="text-sm font-medium text-red-400">Требуют ремонта</p>
                  <p className="text-xl font-bold text-text-primary">{analytics.itemsNeedingRepair}</p>
                </div>
              </div>
            </div>
          )}

          {/* Category Breakdown */}
          {analytics.categoryBreakdown.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-text-primary mb-3 flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                По категориям
              </h3>
              <div className="space-y-2">
                {analytics.categoryBreakdown.slice(0, 5).map((cat) => (
                  <div key={cat.categoryId} className="flex justify-between items-center p-2 rounded bg-surface">
                    <span className="text-text-secondary text-sm truncate flex-1">{cat.name}</span>
                    <div className="flex items-center gap-3 ml-2">
                      <span className="text-text-primary font-medium">{cat.count}</span>
                      {cat.value > 0 && (
                        <span className="text-text-muted text-xs">{formatCurrency(cat.value)}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Low Stock Items */}
          {analytics.lowStockItems.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-text-primary mb-3 flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-amber-400" />
                Заканчивается
              </h3>
              <div className="space-y-2">
                {analytics.lowStockItems.slice(0, 3).map((item) => (
                  <div key={item.id} className="flex justify-between items-center p-2 rounded bg-amber-500/10 border border-amber-500/20">
                    <span className="text-text-secondary text-sm truncate flex-1">{item.name}</span>
                    <div className="flex items-center gap-1 text-amber-400 ml-2">
                      <AlertTriangle className="w-3 h-3" />
                      <span className="font-medium">{item.quantity}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Condition Breakdown */}
          {Object.keys(analytics.conditionBreakdown).length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-text-primary mb-3">По состоянию</h3>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(analytics.conditionBreakdown).map(([condition, count]) => (
                  <div key={condition} className="p-2 rounded bg-surface text-center">
                    <p className="text-lg font-medium text-text-primary">{count}</p>
                    <p className="text-xs text-text-muted capitalize">{condition}</p>
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

export default InventoryAnalyticsWidget;
