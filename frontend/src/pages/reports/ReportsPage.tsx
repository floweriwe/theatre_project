/**
 * Страница аналитики и отчётов — Modern Theatre Elegance v3
 */

import { useEffect, useState } from 'react';
import {
  BarChart3,
  Package,
  FileText,
  Calendar,
  RefreshCw,
  Theater,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import { inventoryService } from '@/services/inventory_service';
import { documentService } from '@/services/document_service';
import { performanceService } from '@/services/performance_service';
import { scheduleService } from '@/services/schedule_service';

interface ReportStats {
  inventory: {
    total: number;
    inStock: number;
    reserved: number;
    inUse: number;
    totalValue: number;
  };
  documents: {
    total: number;
    active: number;
    totalSize: number;
  };
  performances: {
    total: number;
    inRepertoire: number;
    preparation: number;
  };
  schedule: {
    total: number;
    upcoming: number;
  };
}

export function ReportsPage() {
  const [period, setPeriod] = useState('month');
  const [stats, setStats] = useState<ReportStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const [inventoryStats, documentStats, performanceStats, scheduleStats] = await Promise.all([
        inventoryService.getStats(),
        documentService.getStats(),
        performanceService.getStats(),
        scheduleService.getStats().catch(() => ({ totalEvents: 0, upcomingEvents: 0 })),
      ]);

      setStats({
        inventory: {
          total: inventoryStats.totalItems,
          inStock: inventoryStats.inStock,
          reserved: inventoryStats.reserved,
          inUse: inventoryStats.inUse,
          totalValue: inventoryStats.totalValue,
        },
        documents: {
          total: documentStats.totalDocuments,
          active: documentStats.active,
          totalSize: documentStats.totalSize,
        },
        performances: {
          total: performanceStats.totalPerformances,
          inRepertoire: performanceStats.inRepertoire,
          preparation: performanceStats.preparation,
        },
        schedule: {
          total: scheduleStats.totalEvents || 0,
          upcoming: scheduleStats.upcomingEvents || 0,
        },
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Б';
    const k = 1024;
    const sizes = ['Б', 'КБ', 'МБ', 'ГБ'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-surface-light to-surface p-6 lg:p-8">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        
        <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <p className="text-purple-400 text-sm flex items-center gap-2 mb-2">
              <BarChart3 className="w-4 h-4" />
              Аналитика и статистика
            </p>
            <h1 className="text-2xl lg:text-3xl font-display font-bold text-white mb-2">
              Отчёты
            </h1>
            <p className="text-text-secondary">
              Статистика и аналитика работы театра
            </p>
          </div>

          <div className="flex gap-3">
            <Select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="w-40"
            >
              <option value="week">За неделю</option>
              <option value="month">За месяц</option>
              <option value="quarter">За квартал</option>
              <option value="year">За год</option>
            </Select>
            <Button variant="outline" onClick={loadStats}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Обновить
            </Button>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <Package className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              {loading ? (
                <Skeleton className="h-8 w-16 mb-1" />
              ) : (
                <p className="text-2xl font-bold text-white">{stats?.inventory.total || 0}</p>
              )}
              <p className="text-sm text-text-muted">Единиц инвентаря</p>
            </div>
          </div>
          <div className="mt-3 text-sm text-text-muted">
            Стоимость: {loading ? '...' : formatCurrency(stats?.inventory.totalValue || 0)}
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <FileText className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              {loading ? (
                <Skeleton className="h-8 w-16 mb-1" />
              ) : (
                <p className="text-2xl font-bold text-white">{stats?.documents.total || 0}</p>
              )}
              <p className="text-sm text-text-muted">Документов</p>
            </div>
          </div>
          <div className="mt-3 text-sm text-text-muted">
            Размер: {loading ? '...' : formatFileSize(stats?.documents.totalSize || 0)}
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
              <Theater className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              {loading ? (
                <Skeleton className="h-8 w-16 mb-1" />
              ) : (
                <p className="text-2xl font-bold text-white">{stats?.performances.total || 0}</p>
              )}
              <p className="text-sm text-text-muted">Спектаклей</p>
            </div>
          </div>
          <div className="mt-3 text-sm text-text-muted">
            В репертуаре: {loading ? '...' : stats?.performances.inRepertoire || 0}
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <Calendar className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              {loading ? (
                <Skeleton className="h-8 w-16 mb-1" />
              ) : (
                <p className="text-2xl font-bold text-white">{stats?.schedule.total || 0}</p>
              )}
              <p className="text-sm text-text-muted">Событий</p>
            </div>
          </div>
          <div className="mt-3 text-sm text-text-muted">
            Предстоящих: {loading ? '...' : stats?.schedule.upcoming || 0}
          </div>
        </Card>
      </div>

      {/* Detailed Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="text-lg font-medium text-white mb-4">Инвентарь по статусам</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-text-secondary">На складе</span>
              <span className="text-white font-medium">{loading ? '...' : stats?.inventory.inStock || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-text-secondary">Зарезервировано</span>
              <span className="text-white font-medium">{loading ? '...' : stats?.inventory.reserved || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-text-secondary">В использовании</span>
              <span className="text-white font-medium">{loading ? '...' : stats?.inventory.inUse || 0}</span>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-medium text-white mb-4">Спектакли по статусам</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-text-secondary">В репертуаре</span>
              <span className="text-emerald-400 font-medium">{loading ? '...' : stats?.performances.inRepertoire || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-text-secondary">В подготовке</span>
              <span className="text-amber-400 font-medium">{loading ? '...' : stats?.performances.preparation || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-text-secondary">Всего</span>
              <span className="text-white font-medium">{loading ? '...' : stats?.performances.total || 0}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Charts Placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="text-lg font-medium text-white mb-4">Использование инвентаря</h2>
          <div className="h-48 flex items-center justify-center bg-surface rounded-lg">
            <div className="text-center">
              <BarChart3 className="w-10 h-10 text-text-muted mx-auto mb-2" />
              <p className="text-text-muted text-sm">Графики в разработке</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-medium text-white mb-4">Активность по документам</h2>
          <div className="h-48 flex items-center justify-center bg-surface rounded-lg">
            <div className="text-center">
              <BarChart3 className="w-10 h-10 text-text-muted mx-auto mb-2" />
              <p className="text-text-muted text-sm">Графики в разработке</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default ReportsPage;
