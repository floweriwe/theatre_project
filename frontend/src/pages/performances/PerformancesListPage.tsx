/**
 * Страница списка спектаклей — Modern Theatre Elegance v3
 */

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Theater,
  Plus,
  Search,
  Grid,
  List,
  RefreshCw,
  Clock,
  Calendar,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { Alert } from '@/components/ui/Alert';
import { cn } from '@/utils/helpers';
import { ROUTES } from '@/utils/constants';
import { performanceService } from '@/services/performance_service';
import type { PerformanceListItem, PerformanceStatus, PerformanceStats } from '@/types/performance_types';

const STATUS_LABELS: Record<PerformanceStatus, string> = {
  preparation: 'В подготовке',
  in_repertoire: 'В репертуаре',
  paused: 'На паузе',
  archived: 'В архиве',
};

const STATUS_COLORS: Record<PerformanceStatus, string> = {
  preparation: 'bg-amber-500/10 text-amber-400',
  in_repertoire: 'bg-emerald-500/10 text-emerald-400',
  paused: 'bg-blue-500/10 text-blue-400',
  archived: 'bg-gray-500/10 text-gray-400',
};

export function PerformancesListPage() {
  const [performances, setPerformances] = useState<PerformanceListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [stats, setStats] = useState<PerformanceStats | null>(null);

  useEffect(() => {
    loadData();
  }, [selectedStatus]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [data, statsData] = await Promise.all([
        performanceService.getPerformances({
          status: selectedStatus as PerformanceStatus || undefined,
          search: search || undefined,
        }),
        performanceService.getStats(),
      ]);

      setPerformances(data.items || []);
      setStats(statsData);
    } catch (err) {
      console.error('Failed to load performances:', err);
      setError('Не удалось загрузить спектакли');
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours} ч ${mins > 0 ? mins + ' мин' : ''}`;
    }
    return `${mins} мин`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-surface-light to-surface p-6 lg:p-8">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        
        <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <p className="text-purple-400 text-sm flex items-center gap-2 mb-2">
              <Theater className="w-4 h-4" />
              Репертуар театра
            </p>
            <h1 className="text-2xl lg:text-3xl font-display font-bold text-white mb-2">
              Спектакли
            </h1>
            <p className="text-text-secondary">
              {stats?.totalPerformances || performances.length} спектаклей в репертуаре театра
            </p>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={loadData}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Обновить
            </Button>
            <Button asChild>
              <Link to={`${ROUTES.PERFORMANCES}/new`}>
                <Plus className="w-4 h-4 mr-2" />
                Добавить
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <p className="text-3xl font-bold text-white">{stats?.totalPerformances || performances.length}</p>
          <p className="text-text-muted">Всего</p>
        </Card>
        <Card className="p-4">
          <p className="text-3xl font-bold text-emerald-400">{stats?.inRepertoire || 0}</p>
          <p className="text-text-muted">В репертуаре</p>
        </Card>
        <Card className="p-4">
          <p className="text-3xl font-bold text-amber-400">{stats?.preparation || 0}</p>
          <p className="text-text-muted">В подготовке</p>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <Input
                placeholder="Поиск по названию, автору, режиссёру..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loadData()}
                className="pl-10"
              />
            </div>
          </div>
          <Select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full lg:w-48"
          >
            <option value="">Все статусы</option>
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
          <div className="flex gap-1 border border-white/10 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                'p-2 rounded',
                viewMode === 'grid' ? 'bg-white/10 text-white' : 'text-text-muted'
              )}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                'p-2 rounded',
                viewMode === 'list' ? 'bg-white/10 text-white' : 'text-text-muted'
              )}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </Card>

      {error && <Alert variant="error">{error}</Alert>}

      {/* Performances Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="p-4">
              <Skeleton className="h-32 mb-4" />
              <Skeleton className="h-6 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2" />
            </Card>
          ))}
        </div>
      ) : performances.length === 0 ? (
        <Card className="p-8 text-center">
          <Theater className="w-12 h-12 text-text-muted mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">Нет спектаклей</h3>
          <p className="text-text-muted mb-4">Спектакли не найдены</p>
          <Button asChild>
            <Link to={`${ROUTES.PERFORMANCES}/new`}>
              <Plus className="w-4 h-4 mr-2" />
              Добавить спектакль
            </Link>
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {performances.map((perf) => (
            <Link key={perf.id} to={`${ROUTES.PERFORMANCES}/${perf.id}`}>
              <Card className="p-4 hover:border-purple-500/30 transition-colors h-full">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-display text-lg font-semibold text-white mb-1">
                      {perf.title}
                    </h3>
                    {perf.subtitle && (
                      <p className="text-sm text-text-muted">{perf.subtitle}</p>
                    )}
                  </div>
                  <Badge className={STATUS_COLORS[perf.status]}>
                    {STATUS_LABELS[perf.status]}
                  </Badge>
                </div>

                <div className="space-y-2 mb-4">
                  {perf.author && (
                    <p className="text-sm text-text-secondary">{perf.author}</p>
                  )}
                  {perf.director && (
                    <p className="text-sm text-text-muted">Режиссёр: {perf.director}</p>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  {perf.genre && (
                    <Badge variant="default">{perf.genre}</Badge>
                  )}
                  {perf.ageRating && (
                    <Badge variant="default">{perf.ageRating}</Badge>
                  )}
                </div>

                <div className="flex items-center justify-between text-sm text-text-muted pt-3 border-t border-white/5">
                  {perf.durationMinutes && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {formatDuration(perf.durationMinutes)}
                    </span>
                  )}
                  {perf.premiereDate && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {formatDate(perf.premiereDate)}
                    </span>
                  )}
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default PerformancesListPage;
