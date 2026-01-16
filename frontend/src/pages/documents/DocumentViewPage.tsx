/**
 * Страница просмотра документа
 */

import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  FileText,
  ArrowLeft,
  Download,
  Edit,
  Trash2,
  Calendar,
  Eye,
  AlertCircle,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { Alert } from '@/components/ui/Alert';
import { ROUTES } from '@/utils/constants';
import { documentService } from '@/services/document_service';
import type { Document, DocumentStatus } from '@/types/document_types';

const STATUS_LABELS: Record<DocumentStatus, string> = {
  draft: 'Черновик',
  active: 'Активный',
  archived: 'В архиве',
};

const STATUS_COLORS: Record<DocumentStatus, string> = {
  draft: 'bg-amber-500/10 text-amber-400',
  active: 'bg-emerald-500/10 text-emerald-400',
  archived: 'bg-gray-500/10 text-gray-400',
};

export function DocumentViewPage() {
  const { id } = useParams<{ id: string }>();
  const [document, setDocument] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadDocument(parseInt(id));
    }
  }, [id]);

  const loadDocument = async (docId: number) => {
    try {
      setLoading(true);
      setError(null);
      const data = await documentService.getDocument(docId);
      setDocument(data);
    } catch (err) {
      console.error('Failed to load document:', err);
      setError('Не удалось загрузить документ');
    } finally {
      setLoading(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Б';
    const k = 1024;
    const sizes = ['Б', 'КБ', 'МБ', 'ГБ'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
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

  if (error || !document) {
    return (
      <div className="space-y-6">
        <Alert variant="error">
          <AlertCircle className="w-4 h-4" />
          {error || 'Документ не найден'}
        </Alert>
        <Button variant="outline" asChild>
          <Link to={ROUTES.DOCUMENTS}>
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
            <Link to={ROUTES.DOCUMENTS}>
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3 mb-2">
              <FileText className="w-8 h-8 text-emerald-400" />
              <div>
                <h1 className="text-2xl font-display font-bold text-white">{document.name}</h1>
                <p className="text-text-muted">{document.filePath?.split('/').pop()}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={STATUS_COLORS[document.status]}>
                {STATUS_LABELS[document.status]}
              </Badge>
              <span className="text-text-muted">•</span>
              <span className="text-text-muted">{formatBytes(document.fileSize || 0)}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Скачать
          </Button>
          <Button variant="outline" asChild>
            <Link to={`${ROUTES.DOCUMENTS}/${id}/edit`}>
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
          <Card className="p-6">
            <h2 className="text-lg font-medium text-white mb-4">Основная информация</h2>
            
            <div className="space-y-4">
              {document.description && (
                <div>
                  <p className="text-sm text-text-muted mb-1">Описание</p>
                  <p className="text-text-secondary">{document.description}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-text-muted mb-1">Тип файла</p>
                  <p className="text-white">{document.mimeType || 'application/pdf'}</p>
                </div>
                <div>
                  <p className="text-sm text-text-muted mb-1">Версия</p>
                  <p className="text-white">v{document.currentVersion}</p>
                </div>
                <div>
                  <p className="text-sm text-text-muted mb-1">Видимость</p>
                  <p className="text-white">{document.isPublic ? 'Публичный' : 'Приватный'}</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Preview */}
          <Card className="p-6">
            <h2 className="text-lg font-medium text-white mb-4">Предпросмотр</h2>
            <div className="bg-surface rounded-lg p-8 text-center">
              <FileText className="w-16 h-16 text-text-muted mx-auto mb-4" />
              <p className="text-text-muted">Предпросмотр недоступен</p>
              <Button variant="outline" className="mt-4">
                <Eye className="w-4 h-4 mr-2" />
                Открыть в новой вкладке
              </Button>
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="text-lg font-medium text-white mb-4">Действия</h2>
            <div className="space-y-2">
              <Button variant="outline" className="w-full justify-start">
                <Download className="w-4 h-4 mr-2" />
                Скачать файл
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Eye className="w-4 h-4 mr-2" />
                Открыть в браузере
              </Button>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-5 h-5 text-text-muted" />
              <h2 className="text-lg font-medium text-white">Даты</h2>
            </div>
            <div className="space-y-4">
              {document.createdAt && (
                <div>
                  <p className="text-sm text-text-muted mb-1">Создан</p>
                  <p className="text-white">{formatDate(document.createdAt)}</p>
                </div>
              )}
              {document.updatedAt && (
                <div>
                  <p className="text-sm text-text-muted mb-1">Обновлён</p>
                  <p className="text-white">{formatDate(document.updatedAt)}</p>
                </div>
              )}
            </div>
          </Card>

          {document.performanceId && (
            <Card className="p-6">
              <h2 className="text-lg font-medium text-white mb-4">Связанный спектакль</h2>
              <Link
                to={`${ROUTES.PERFORMANCES}/${document.performanceId}`}
                className="block p-3 bg-surface rounded-lg hover:bg-white/5 transition-colors"
              >
                <p className="font-medium text-white">Спектакль #{document.performanceId}</p>
              </Link>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

export default DocumentViewPage;
