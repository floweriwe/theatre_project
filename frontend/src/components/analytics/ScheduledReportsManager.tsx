/**
 * Менеджер запланированных отчётов — Modern Theatre Elegance v3
 */

import { useQuery } from '@tanstack/react-query';
import {
  Calendar,
  Clock,
  Mail,
  AlertCircle,
  CheckCircle,
  XCircle,
  Pause,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { analyticsService } from '@/services/analytics_service';
import {
  SCHEDULE_FREQUENCY_LABELS,
  REPORT_FORMAT_LABELS,
  REPORT_CATEGORY_LABELS,
  type ScheduledReport,
} from '@/types/analytics';

function formatDate(dateString: string | null): string {
  if (!dateString) return '—';
  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateString));
}

function getStatusBadge(status: string | null) {
  switch (status) {
    case 'success':
      return (
        <Badge variant="success" size="sm">
          <CheckCircle className="w-3 h-3 mr-1" />
          Успешно
        </Badge>
      );
    case 'failed':
      return (
        <Badge variant="error" size="sm">
          <XCircle className="w-3 h-3 mr-1" />
          Ошибка
        </Badge>
      );
    case 'running':
      return (
        <Badge variant="warning" size="sm">
          <Clock className="w-3 h-3 mr-1" />
          Выполняется
        </Badge>
      );
    default:
      return (
        <Badge variant="default" size="sm">
          Ожидает
        </Badge>
      );
  }
}

export function ScheduledReportsManager() {
  const { data: reports, isLoading, error } = useQuery<ScheduledReport[]>({
    queryKey: ['scheduled-reports'],
    queryFn: () => analyticsService.getScheduledReports(),
    staleTime: 5 * 60 * 1000,
  });

  if (error) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-3 text-red-400">
          <AlertCircle className="w-5 h-5" />
          <span>Ошибка загрузки запланированных отчётов</span>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
            <Calendar className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h2 className="text-lg font-medium text-text-primary">Запланированные отчёты</h2>
            <p className="text-sm text-text-muted">
              {reports?.filter(r => r.isActive).length || 0} активных
            </p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : reports && reports.length > 0 ? (
        <div className="space-y-3">
          {reports.map((report) => (
            <div
              key={report.id}
              className={`p-4 rounded-lg border transition-colors ${
                report.isActive
                  ? 'bg-surface border-border/50'
                  : 'bg-surface/50 border-border/30 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium text-text-primary">{report.name}</h3>
                    {!report.isActive && (
                      <Badge variant="warning" size="sm">
                        <Pause className="w-3 h-3 mr-1" />
                        Приостановлен
                      </Badge>
                    )}
                  </div>
                  {report.description && (
                    <p className="text-sm text-text-muted mb-2">{report.description}</p>
                  )}
                </div>
                {getStatusBadge(report.lastRunStatus)}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-text-muted block">Частота</span>
                  <span className="text-text-primary">
                    {SCHEDULE_FREQUENCY_LABELS[report.frequency]}
                  </span>
                </div>
                <div>
                  <span className="text-text-muted block">Формат</span>
                  <span className="text-text-primary">
                    {REPORT_FORMAT_LABELS[report.format]}
                  </span>
                </div>
                <div>
                  <span className="text-text-muted block">Последний запуск</span>
                  <span className="text-text-primary">
                    {formatDate(report.lastRunAt)}
                  </span>
                </div>
                <div>
                  <span className="text-text-muted block">Следующий запуск</span>
                  <span className="text-text-primary">
                    {formatDate(report.nextRunAt)}
                  </span>
                </div>
              </div>

              {report.recipients.length > 0 && (
                <div className="mt-3 pt-3 border-t border-border/30">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="w-4 h-4 text-text-muted" />
                    <span className="text-text-muted">Получатели:</span>
                    <span className="text-text-secondary">
                      {report.recipients.slice(0, 3).join(', ')}
                      {report.recipients.length > 3 && ` +${report.recipients.length - 3}`}
                    </span>
                  </div>
                </div>
              )}

              {report.templateName && (
                <div className="mt-2 flex items-center gap-2">
                  <Badge variant="info" size="sm">
                    {report.templateName}
                  </Badge>
                  {report.templateCategory && (
                    <Badge variant="default" size="sm">
                      {REPORT_CATEGORY_LABELS[report.templateCategory]}
                    </Badge>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <Calendar className="w-12 h-12 text-text-muted mx-auto mb-3" />
          <p className="text-text-muted">Нет запланированных отчётов</p>
          <p className="text-text-muted text-sm mt-1">
            Создайте отчёт по расписанию для автоматической генерации
          </p>
        </div>
      )}
    </Card>
  );
}

export default ScheduledReportsManager;
