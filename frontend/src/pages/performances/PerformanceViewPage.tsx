/**
 * Страница просмотра спектакля
 */

import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Edit,
  Trash2,
  Clock,
  Calendar,
  AlertCircle,
  Box,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { Alert } from '@/components/ui/Alert';
import { ROUTES } from '@/utils/constants';
import { performanceService } from '@/services/performance_service';
import { PropsEquipmentTab, TechnicalPassport } from '@/components/features/performances';
import type { Performance, PerformanceStatus } from '@/types/performance_types';

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

export function PerformanceViewPage() {
  const { id } = useParams<{ id: string }>();
  const [performance, setPerformance] = useState<Performance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadPerformance(parseInt(id));
    }
  }, [id]);

  const loadPerformance = async (perfId: number) => {
    try {
      setLoading(true);
      setError(null);
      const data = await performanceService.getPerformance(perfId);
      setPerformance(data);
    } catch (err) {
      console.error('Failed to load performance:', err);
      setError('Не удалось загрузить спектакль');
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours} ч ${mins} мин`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Card className="p-6">
          <Skeleton className="h-64" />
        </Card>
      </div>
    );
  }

  if (error || !performance) {
    return (
      <div className="space-y-6">
        <Alert variant="error">
          <AlertCircle className="w-4 h-4" />
          {error || 'Спектакль не найден'}
        </Alert>
        <Button variant="outline" asChild>
          <Link to={ROUTES.PERFORMANCES}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Вернуться к списку
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link to={ROUTES.PERFORMANCES}>
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Badge className={STATUS_COLORS[performance.status]}>
                {STATUS_LABELS[performance.status]}
              </Badge>
              {performance.ageRating && (
                <Badge variant="default">{performance.ageRating}</Badge>
              )}
            </div>
            <h1 className="text-2xl lg:text-3xl font-display font-bold text-white">
              {performance.title}
            </h1>
            {performance.subtitle && (
              <p className="text-text-secondary mt-1">{performance.subtitle}</p>
            )}
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" asChild>
            <Link to={`${ROUTES.PERFORMANCES}/${id}/edit`}>
              <Edit className="w-4 h-4 mr-2" />
              Редактировать
            </Link>
          </Button>
          <Button variant="danger">
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Info Card */}
          <Card className="p-6">
            <h2 className="text-lg font-medium text-white mb-4">Основная информация</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {performance.author && (
                <div>
                  <p className="text-sm text-text-muted mb-1">Автор</p>
                  <p className="text-white font-medium">{performance.author}</p>
                </div>
              )}
              {performance.director && (
                <div>
                  <p className="text-sm text-text-muted mb-1">Режиссёр</p>
                  <p className="text-white">{performance.director}</p>
                </div>
              )}
              {performance.composer && (
                <div>
                  <p className="text-sm text-text-muted mb-1">Композитор</p>
                  <p className="text-white">{performance.composer}</p>
                </div>
              )}
              {performance.choreographer && (
                <div>
                  <p className="text-sm text-text-muted mb-1">Хореограф</p>
                  <p className="text-white">{performance.choreographer}</p>
                </div>
              )}
              {performance.genre && (
                <div>
                  <p className="text-sm text-text-muted mb-1">Жанр</p>
                  <p className="text-white">{performance.genre}</p>
                </div>
              )}
              {performance.durationMinutes && (
                <div>
                  <p className="text-sm text-text-muted mb-1">Продолжительность</p>
                  <p className="text-white">{formatDuration(performance.durationMinutes)}</p>
                </div>
              )}
            </div>

            {performance.description && (
              <div className="mt-6 pt-6 border-t border-white/5">
                <p className="text-sm text-text-muted mb-2">Описание</p>
                <p className="text-text-secondary">{performance.description}</p>
              </div>
            )}
          </Card>

          {/* Technical Passport */}
          <Card className="p-6">
            <h2 className="text-lg font-medium text-white mb-4">Технический паспорт</h2>
            <TechnicalPassport performanceId={performance.id} editable={false} />
          </Card>

          {/* Props & Equipment */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Box className="w-5 h-5 text-text-muted" />
              <h2 className="text-lg font-medium text-white">Реквизит и оборудование</h2>
            </div>
            <PropsEquipmentTab performanceId={performance.id} />
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Info */}
          <Card className="p-6">
            <h2 className="text-lg font-medium text-white mb-4">Информация</h2>
            <div className="space-y-4">
              {performance.premiereDate && (
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-text-muted" />
                  <div>
                    <p className="text-sm text-text-muted">Премьера</p>
                    <p className="text-white">{formatDate(performance.premiereDate)}</p>
                  </div>
                </div>
              )}
              {performance.durationMinutes && (
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-text-muted" />
                  <div>
                    <p className="text-sm text-text-muted">Продолжительность</p>
                    <p className="text-white">{formatDuration(performance.durationMinutes)}</p>
                  </div>
                </div>
              )}
              {performance.intermissions !== undefined && (
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-text-muted" />
                  <div>
                    <p className="text-sm text-text-muted">Антракты</p>
                    <p className="text-white">{performance.intermissions}</p>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Documents */}
          <Card className="p-6">
            <h2 className="text-lg font-medium text-white mb-4">Документы</h2>
            <p className="text-text-muted text-center py-4">Нет связанных документов</p>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default PerformanceViewPage;
