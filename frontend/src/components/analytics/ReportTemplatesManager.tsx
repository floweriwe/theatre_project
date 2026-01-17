/**
 * Менеджер шаблонов отчётов — Modern Theatre Elegance v3
 */

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  FileText,
  Download,
  Filter,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { Modal } from '@/components/ui/Modal';
import { analyticsService } from '@/services/analytics_service';
import {
  REPORT_CATEGORY_LABELS,
  REPORT_FORMAT_LABELS,
  type ReportTemplate,
  type ReportCategory,
  type ReportFormat,
} from '@/types/analytics';

interface GenerateModalProps {
  template: ReportTemplate | null;
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (templateId: string, format: ReportFormat) => void;
  isGenerating: boolean;
}

function GenerateModal({ template, isOpen, onClose, onGenerate, isGenerating }: GenerateModalProps) {
  const [format, setFormat] = useState<ReportFormat>('pdf');

  if (!template) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Сгенерировать отчёт">
      <div className="space-y-4">
        <div>
          <p className="text-text-primary font-medium">{template.name}</p>
          {template.description && (
            <p className="text-text-muted text-sm mt-1">{template.description}</p>
          )}
        </div>

        <div>
          <label className="block text-sm text-text-secondary mb-2">Формат</label>
          <Select
            value={format}
            onChange={(e) => setFormat(e.target.value as ReportFormat)}
            className="w-full"
          >
            {Object.entries(REPORT_FORMAT_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </Select>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button variant="ghost" onClick={onClose} disabled={isGenerating}>
            Отмена
          </Button>
          <Button
            onClick={() => onGenerate(template.id, format)}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Генерация...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Сгенерировать
              </>
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export function ReportTemplatesManager() {
  const [categoryFilter, setCategoryFilter] = useState<ReportCategory | ''>('');
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(null);
  const [showGenerateModal, setShowGenerateModal] = useState(false);

  const { data: templates, isLoading, error } = useQuery<ReportTemplate[]>({
    queryKey: ['report-templates', categoryFilter],
    queryFn: () => analyticsService.getReportTemplates(categoryFilter || undefined),
    staleTime: 5 * 60 * 1000,
  });

  const generateMutation = useMutation({
    mutationFn: ({ templateId, format }: { templateId: string; format: ReportFormat }) =>
      analyticsService.generateReport({ templateId, format }),
    onSuccess: (data) => {
      if (data.downloadUrl) {
        window.open(data.downloadUrl, '_blank');
      }
      setShowGenerateModal(false);
      setSelectedTemplate(null);
    },
  });

  const handleGenerate = (templateId: string, format: ReportFormat) => {
    generateMutation.mutate({ templateId, format });
  };

  const openGenerateModal = (template: ReportTemplate) => {
    setSelectedTemplate(template);
    setShowGenerateModal(true);
  };

  if (error) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-3 text-red-400">
          <AlertCircle className="w-5 h-5" />
          <span>Ошибка загрузки шаблонов отчётов</span>
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <FileText className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-lg font-medium text-text-primary">Шаблоны отчётов</h2>
              <p className="text-sm text-text-muted">
                {templates?.length || 0} шаблонов
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-text-muted" />
              <Select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value as ReportCategory | '')}
                className="w-40"
              >
                <option value="">Все категории</option>
                {Object.entries(REPORT_CATEGORY_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </Select>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        ) : templates && templates.length > 0 ? (
          <div className="space-y-3">
            {templates.map((template) => (
              <div
                key={template.id}
                className="p-4 rounded-lg bg-surface border border-border/50 hover:border-border transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-text-primary">{template.name}</h3>
                      {template.isSystem && (
                        <Badge variant="info" size="sm">Системный</Badge>
                      )}
                    </div>
                    {template.description && (
                      <p className="text-sm text-text-muted mb-2">{template.description}</p>
                    )}
                    <div className="flex items-center gap-3 text-xs">
                      <Badge variant="default">
                        {REPORT_CATEGORY_LABELS[template.category]}
                      </Badge>
                      <span className="text-text-muted">
                        Формат: {REPORT_FORMAT_LABELS[template.defaultFormat]}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openGenerateModal(template)}
                    disabled={!template.isActive}
                  >
                    <Download className="w-4 h-4 mr-1" />
                    Создать
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <FileText className="w-12 h-12 text-text-muted mx-auto mb-3" />
            <p className="text-text-muted">Нет доступных шаблонов</p>
          </div>
        )}
      </Card>

      <GenerateModal
        template={selectedTemplate}
        isOpen={showGenerateModal}
        onClose={() => {
          setShowGenerateModal(false);
          setSelectedTemplate(null);
        }}
        onGenerate={handleGenerate}
        isGenerating={generateMutation.isPending}
      />
    </>
  );
}

export default ReportTemplatesManager;
