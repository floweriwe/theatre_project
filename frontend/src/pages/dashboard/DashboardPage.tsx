/**
 * Главная страница (Dashboard) — Modern Theatre Elegance v3
 */

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  FileText,
  Theater,
  Calendar,
  ArrowRight,
  Sparkles,
  User,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { ROUTES } from '@/utils/constants';
import { inventoryService } from '@/services/inventory_service';
import { documentService } from '@/services/document_service';
import { performanceService } from '@/services/performance_service';
import { useAuthStore } from '@/store/authStore';

interface DashboardStats {
  inventory: {
    total: number;
    inStock: number;
    reserved: number;
    inUse: number;
    repair: number;
    totalValue: number;
  };
  documents: {
    total: number;
    active: number;
    archived: number;
    totalSize: number;
  };
  performances: {
    total: number;
    inRepertoire: number;
    preparation: number;
    paused: number;
  };
  schedule: {
    total: number;
  };
}

export function DashboardPage() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      
      // Загружаем stats из отдельных endpoints
      const [inventoryStats, documentStats, performanceStats, scheduleStats] = await Promise.all([
        inventoryService.getStats(),
        documentService.getStats(),
        performanceService.getStats(),
        Promise.resolve({ totalEvents: 0, upcomingEvents: 0 }), // schedule stats - временно
      ]);

      setStats({
        inventory: {
          total: inventoryStats.totalItems || 0,
          inStock: inventoryStats.inStock || 0,
          reserved: inventoryStats.reserved || 0,
          inUse: inventoryStats.inUse || 0,
          repair: inventoryStats.inRepair || 0,
          totalValue: inventoryStats.totalValue || 0,
        },
        documents: {
          total: documentStats.totalDocuments || 0,
          active: documentStats.active || 0,
          archived: documentStats.archived || 0,
          totalSize: documentStats.totalSize || 0,
        },
        performances: {
          total: performanceStats.totalPerformances || 0,
          inRepertoire: performanceStats.inRepertoire || 0,
          preparation: performanceStats.preparation || 0,
          paused: performanceStats.paused || 0,
        },
        schedule: {
          total: scheduleStats.totalEvents || 0,
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
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Б';
    const k = 1024;
    const sizes = ['Б', 'КБ', 'МБ', 'ГБ'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const today = new Date();
  const dateString = today.toLocaleDateString('ru-RU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  const getGreeting = () => {
    const hour = today.getHours();
    if (hour < 12) return 'Доброе утро';
    if (hour < 18) return 'Добрый день';
    return 'Добрый вечер';
  };

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-surface-light to-surface p-6 lg:p-8">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gold/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        
        <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <p className="text-gold text-sm flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4" />
              {dateString}
            </p>
            <h1 className="text-2xl lg:text-3xl font-display font-bold text-white mb-2">
              {getGreeting()}, {user?.firstName || 'Администратор'}!
            </h1>
            <p className="text-text-secondary">
              Добро пожаловать в систему управления театром
            </p>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" asChild>
              <Link to={ROUTES.PERFORMANCES}>
                <Sparkles className="w-4 h-4 mr-2" />
                Афиша
              </Link>
            </Button>
            <Button asChild>
              <Link to={ROUTES.SCHEDULE}>
                <Calendar className="w-4 h-4 mr-2" />
                Расписание
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Inventory */}
        <Link to={ROUTES.INVENTORY}>
          <Card className="p-5 hover:border-blue-500/30 transition-colors cursor-pointer group">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <Package className="w-6 h-6 text-blue-400" />
              </div>
              {loading ? (
                <Skeleton className="w-12 h-8" />
              ) : (
                <span className="text-2xl font-bold text-white">
                  {stats?.inventory.total || 0}
                </span>
              )}
            </div>
            <h3 className="font-medium text-white mb-1">Инвентарь</h3>
            <p className="text-sm text-text-muted">Реквизит, костюмы, декорации</p>
          </Card>
        </Link>

        {/* Documents */}
        <Link to={ROUTES.DOCUMENTS}>
          <Card className="p-5 hover:border-emerald-500/30 transition-colors cursor-pointer group">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <FileText className="w-6 h-6 text-emerald-400" />
              </div>
              {loading ? (
                <Skeleton className="w-12 h-8" />
              ) : (
                <span className="text-2xl font-bold text-white">
                  {stats?.documents.total || 0}
                </span>
              )}
            </div>
            <h3 className="font-medium text-white mb-1">Документы</h3>
            <p className="text-sm text-text-muted">Документооборот театра</p>
          </Card>
        </Link>

        {/* Performances */}
        <Link to={ROUTES.PERFORMANCES}>
          <Card className="p-5 hover:border-purple-500/30 transition-colors cursor-pointer group">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
                <Theater className="w-6 h-6 text-purple-400" />
              </div>
              <div className="flex items-center gap-2">
                {loading ? (
                  <Skeleton className="w-12 h-8" />
                ) : (
                  <>
                    <span className="text-2xl font-bold text-white">
                      {stats?.performances.total || 0}
                    </span>
                    <span className="px-2 py-0.5 text-xs font-medium bg-gold/20 text-gold rounded">
                      Премьера
                    </span>
                  </>
                )}
              </div>
            </div>
            <h3 className="font-medium text-white mb-1">Спектакли</h3>
            <p className="text-sm text-text-muted">Репертуар и паспорта</p>
          </Card>
        </Link>

        {/* Schedule */}
        <Link to={ROUTES.SCHEDULE}>
          <Card className="p-5 hover:border-amber-500/30 transition-colors cursor-pointer group">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-amber-400" />
              </div>
              {loading ? (
                <Skeleton className="w-12 h-8" />
              ) : (
                <span className="text-2xl font-bold text-white">
                  {stats?.schedule.total || 0}
                </span>
              )}
            </div>
            <h3 className="font-medium text-white mb-1">Расписание</h3>
            <p className="text-sm text-text-muted">Календарь событий</p>
          </Card>
        </Link>
      </div>

      {/* Detail Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Inventory Details */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-blue-400" />
              <h3 className="font-medium text-white">Инвентарь</h3>
            </div>
            <Link
              to={ROUTES.INVENTORY}
              className="text-sm text-gold hover:text-gold-light flex items-center gap-1"
            >
              Подробнее <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <p className="text-sm text-text-muted mb-4">Текущее состояние</p>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-2xl font-bold text-blue-400">
                {loading ? <Skeleton className="w-12 h-8" /> : stats?.inventory.inStock || 0}
              </div>
              <p className="text-sm text-text-muted">На складе</p>
            </div>
            <div>
              <div className="text-2xl font-bold text-amber-400">
                {loading ? <Skeleton className="w-12 h-8" /> : stats?.inventory.reserved || 0}
              </div>
              <p className="text-sm text-text-muted">Зарезервировано</p>
            </div>
            <div>
              <div className="text-2xl font-bold text-emerald-400">
                {loading ? <Skeleton className="w-12 h-8" /> : stats?.inventory.inUse || 0}
              </div>
              <p className="text-sm text-text-muted">В использовании</p>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-400">
                {loading ? <Skeleton className="w-12 h-8" /> : stats?.inventory.repair || 0}
              </div>
              <p className="text-sm text-text-muted">На ремонте</p>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-white/5">
            <p className="text-sm text-text-muted">Общая стоимость</p>
            <div className="text-xl font-bold text-gold">
              {loading ? <Skeleton className="w-32 h-6" /> : formatCurrency(stats?.inventory.totalValue || 0)}
            </div>
          </div>
        </Card>

        {/* Documents Details */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-emerald-400" />
              <h3 className="font-medium text-white">Документы</h3>
            </div>
            <Link
              to={ROUTES.DOCUMENTS}
              className="text-sm text-gold hover:text-gold-light flex items-center gap-1"
            >
              Подробнее <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <p className="text-sm text-text-muted mb-4">Документооборот</p>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-2xl font-bold text-emerald-400">
                {loading ? <Skeleton className="w-12 h-8" /> : stats?.documents.total || 0}
              </div>
              <p className="text-sm text-text-muted">Всего</p>
            </div>
            <div>
              <div className="text-2xl font-bold text-emerald-400">
                {loading ? <Skeleton className="w-12 h-8" /> : stats?.documents.active || 0}
              </div>
              <p className="text-sm text-text-muted">Активных</p>
            </div>
            <div>
              <div className="text-2xl font-bold text-text-muted">
                {loading ? <Skeleton className="w-12 h-8" /> : stats?.documents.archived || 0}
              </div>
              <p className="text-sm text-text-muted">В архиве</p>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-400">
                {loading ? <Skeleton className="w-20 h-8" /> : formatBytes(stats?.documents.totalSize || 0)}
              </div>
              <p className="text-sm text-text-muted">Размер</p>
            </div>
          </div>
        </Card>

        {/* Performances Details */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Theater className="w-5 h-5 text-purple-400" />
              <h3 className="font-medium text-white">Репертуар</h3>
            </div>
            <Link
              to={ROUTES.PERFORMANCES}
              className="text-sm text-gold hover:text-gold-light flex items-center gap-1"
            >
              Подробнее <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <p className="text-sm text-text-muted mb-4">Спектакли театра</p>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="text-2xl font-bold text-purple-400">
                {loading ? <Skeleton className="w-8 h-8" /> : stats?.performances.inRepertoire || 0}
              </div>
              <p className="text-sm text-text-muted">В репертуаре</p>
            </div>
            <div>
              <div className="text-2xl font-bold text-amber-400">
                {loading ? <Skeleton className="w-8 h-8" /> : stats?.performances.preparation || 0}
              </div>
              <p className="text-sm text-text-muted">В подготовке</p>
            </div>
            <div>
              <div className="text-2xl font-bold text-text-muted">
                {loading ? <Skeleton className="w-8 h-8" /> : stats?.performances.paused || 0}
              </div>
              <p className="text-sm text-text-muted">На паузе</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Profile Card */}
      <Card className="p-5">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-gold/20 flex items-center justify-center">
            <User className="w-6 h-6 text-gold" />
          </div>
          <div>
            <h3 className="font-medium text-white">Ваш профиль</h3>
            <p className="text-sm text-text-muted">Информация об аккаунте</p>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default DashboardPage;
