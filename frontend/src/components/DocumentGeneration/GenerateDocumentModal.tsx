/**
 * GenerateDocumentModal - модальное окно для генерации документа из шаблона.
 *
 * Функционал:
 * - Выбор шаблона
 * - Динамическая форма на основе переменных шаблона
 * - Автозаполнение из спектакля
 * - Подсказки для полей (актёры, сотрудники)
 * - Предпросмотр и генерация
 */

import { useState, useEffect } from 'react';
import { X, FileText, Download, Eye, Loader2, ChevronRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { templateService, documentGenerationService } from '@/services/template_service';
import type {
  DocumentTemplate,
  TemplateListItem,
  TemplateVariable,
  VariableValue,
  GeneratedDocumentResponse,
} from '@/types/template';
import { TEMPLATE_TYPE_LABELS } from '@/types/template';

interface GenerateDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  performanceId?: number;
  performanceName?: string;
  onDocumentGenerated?: (doc: GeneratedDocumentResponse) => void;
}

type Step = 'select' | 'fill' | 'preview' | 'success';

export function GenerateDocumentModal({
  isOpen,
  onClose,
  performanceId,
  performanceName,
  onDocumentGenerated,
}: GenerateDocumentModalProps) {
  // State
  const [step, setStep] = useState<Step>('select');
  const [templates, setTemplates] = useState<TemplateListItem[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<DocumentTemplate | null>(null);
  const [formValues, setFormValues] = useState<Record<string, string | number | string[]>>({});
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedDoc, setGeneratedDoc] = useState<GeneratedDocumentResponse | null>(null);
  const [outputFormat, setOutputFormat] = useState<'docx' | 'pdf'>('docx');

  // Load templates on open
  useEffect(() => {
    if (isOpen) {
      loadTemplates();
      // Reset state
      setStep('select');
      setSelectedTemplate(null);
      setFormValues({});
      setError(null);
      setGeneratedDoc(null);
    }
  }, [isOpen]);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const response = await templateService.getTemplates({ is_active: true });
      setTemplates(response.items);
    } catch (err) {
      setError('Не удалось загрузить шаблоны');
      console.error('Error loading templates:', err);
    } finally {
      setLoading(false);
    }
  };

  const selectTemplate = async (templateId: number) => {
    try {
      setLoading(true);
      setError(null);

      // Load full template with variables
      const template = await templateService.getTemplate(templateId);
      setSelectedTemplate(template);

      // Load autocomplete data
      if (performanceId) {
        const autocomplete = await documentGenerationService.getAutocomplete(
          templateId,
          performanceId
        );

        // Pre-fill form with auto-filled values
        const initialValues: Record<string, string | number | string[]> = {};
        for (const v of autocomplete.auto_filled_values) {
          initialValues[v.name] = v.value;
        }

        // Set defaults for non-auto-filled fields
        for (const variable of template.variables) {
          if (!(variable.name in initialValues) && variable.default_value) {
            initialValues[variable.name] = variable.default_value;
          }
        }

        setFormValues(initialValues);
      } else {
        // Just set defaults
        const initialValues: Record<string, string | number | string[]> = {};
        for (const variable of template.variables) {
          if (variable.default_value) {
            initialValues[variable.name] = variable.default_value;
          }
        }
        setFormValues(initialValues);
      }

      setOutputFormat(template.default_output_format as 'docx' | 'pdf');
      setStep('fill');
    } catch (err) {
      setError('Не удалось загрузить шаблон');
      console.error('Error loading template:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (name: string, value: string | number | string[]) => {
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = (): boolean => {
    if (!selectedTemplate) return false;

    for (const variable of selectedTemplate.variables) {
      if (variable.is_required) {
        const value = formValues[variable.name];
        if (value === undefined || value === '' || (Array.isArray(value) && value.length === 0)) {
          setError(`Поле "${variable.label}" обязательно для заполнения`);
          return false;
        }
      }
    }

    setError(null);
    return true;
  };

  const handleGenerate = async () => {
    if (!selectedTemplate || !validateForm()) return;

    try {
      setGenerating(true);
      setError(null);

      // Prepare variables
      const variables: VariableValue[] = Object.entries(formValues).map(([name, value]) => ({
        name,
        value,
      }));

      // Generate document
      const result = await documentGenerationService.generateDocument({
        template_id: selectedTemplate.id,
        performance_id: performanceId,
        variables,
        output_format: outputFormat,
        document_name: performanceName
          ? `${selectedTemplate.name} - ${performanceName}`
          : undefined,
      });

      setGeneratedDoc(result);
      setStep('success');
      onDocumentGenerated?.(result);
    } catch (err) {
      setError('Не удалось сгенерировать документ');
      console.error('Error generating document:', err);
    } finally {
      setGenerating(false);
    }
  };

  const handlePreview = async () => {
    if (!selectedTemplate || !validateForm()) return;

    try {
      setGenerating(true);
      setError(null);

      const variables: VariableValue[] = Object.entries(formValues).map(([name, value]) => ({
        name,
        value,
      }));

      const blob = await documentGenerationService.generatePreview(
        selectedTemplate.id,
        variables,
        performanceId
      );

      // Download preview file
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `preview_${selectedTemplate.code}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError('Не удалось создать предпросмотр');
      console.error('Error generating preview:', err);
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = () => {
    if (generatedDoc?.download_url) {
      window.open(generatedDoc.download_url, '_blank');
    }
  };

  const renderVariableInput = (variable: TemplateVariable) => {
    const value = formValues[variable.name] ?? '';

    switch (variable.variable_type) {
      case 'text':
      case 'performance_field':
      case 'user_field':
        return (
          <Input
            value={String(value)}
            onChange={(e) => handleInputChange(variable.name, e.target.value)}
            placeholder={variable.description || variable.label}
            className="bg-[#1A2332] border-[#D4A574]/20 text-[#F1F5F9]"
          />
        );

      case 'number':
        return (
          <Input
            type="number"
            value={String(value)}
            onChange={(e) => handleInputChange(variable.name, e.target.value)}
            placeholder={variable.description || variable.label}
            className="bg-[#1A2332] border-[#D4A574]/20 text-[#F1F5F9]"
          />
        );

      case 'date':
        return (
          <Input
            type="date"
            value={String(value)}
            onChange={(e) => handleInputChange(variable.name, e.target.value)}
            className="bg-[#1A2332] border-[#D4A574]/20 text-[#F1F5F9]"
          />
        );

      case 'choice':
        return (
          <select
            value={String(value)}
            onChange={(e) => handleInputChange(variable.name, e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-[#1A2332] border border-[#D4A574]/20 text-[#F1F5F9] focus:outline-none focus:border-[#D4A574]"
          >
            <option value="">Выберите...</option>
            {variable.choices?.map((choice, i) => (
              <option key={i} value={choice}>
                {choice}
              </option>
            ))}
          </select>
        );

      case 'actor_list':
      case 'staff_list':
        return (
          <textarea
            value={String(value)}
            onChange={(e) => handleInputChange(variable.name, e.target.value)}
            placeholder="Введите список через запятую"
            rows={3}
            className="w-full px-3 py-2 rounded-lg bg-[#1A2332] border border-[#D4A574]/20 text-[#F1F5F9] focus:outline-none focus:border-[#D4A574] resize-none"
          />
        );

      default:
        return (
          <Input
            value={String(value)}
            onChange={(e) => handleInputChange(variable.name, e.target.value)}
            className="bg-[#1A2332] border-[#D4A574]/20 text-[#F1F5F9]"
          />
        );
    }
  };

  // Group variables by group_name
  const groupedVariables = selectedTemplate?.variables.reduce(
    (acc, variable) => {
      const group = variable.group_name || 'Основные поля';
      if (!acc[group]) acc[group] = [];
      acc[group].push(variable);
      return acc;
    },
    {} as Record<string, TemplateVariable[]>
  );

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-[#0F1419] border border-[#D4A574]/20 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden animate-slideUp"
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#D4A574]/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#D4A574]/10 flex items-center justify-center">
              <FileText className="w-5 h-5 text-[#D4A574]" />
            </div>
            <div>
              <h2 className="text-lg font-['Cormorant_Garamond'] font-semibold text-[#F1F5F9]">
                Создать документ из шаблона
              </h2>
              {performanceName && (
                <p className="text-sm text-[#94A3B8]">
                  для спектакля «{performanceName}»
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-[#1A2332] text-[#94A3B8] hover:text-[#F1F5F9] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center px-6 py-3 bg-[#1A2332]/50 border-b border-[#D4A574]/10">
          {['select', 'fill', 'success'].map((s, i) => (
            <div key={s} className="flex items-center">
              {i > 0 && (
                <ChevronRight className="w-4 h-4 mx-2 text-[#64748B]" />
              )}
              <div
                className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm transition-colors ${
                  step === s
                    ? 'bg-[#D4A574]/20 text-[#D4A574]'
                    : i < ['select', 'fill', 'success'].indexOf(step)
                    ? 'text-[#D4A574]'
                    : 'text-[#64748B]'
                }`}
              >
                {i < ['select', 'fill', 'success'].indexOf(step) ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center text-xs">
                    {i + 1}
                  </span>
                )}
                <span>
                  {s === 'select' && 'Шаблон'}
                  {s === 'fill' && 'Заполнение'}
                  {s === 'success' && 'Готово'}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {/* Error message */}
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Step: Select Template */}
          {step === 'select' && (
            <div className="space-y-3">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-[#D4A574]" />
                </div>
              ) : templates.length === 0 ? (
                <p className="text-center text-[#94A3B8] py-8">
                  Нет доступных шаблонов
                </p>
              ) : (
                templates.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => selectTemplate(template.id)}
                    className="w-full p-4 bg-[#1A2332] hover:bg-[#243044] border border-[#D4A574]/10 hover:border-[#D4A574]/30 rounded-xl text-left transition-all hover:scale-[1.01] active:scale-[0.99]"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-medium text-[#F1F5F9]">
                          {template.name}
                        </h3>
                        <p className="text-sm text-[#94A3B8] mt-1">
                          {template.description || 'Без описания'}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="px-2 py-0.5 text-xs bg-[#D4A574]/10 text-[#D4A574] rounded">
                            {TEMPLATE_TYPE_LABELS[template.template_type]}
                          </span>
                          <span className="text-xs text-[#64748B]">
                            {template.variables_count} полей
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-[#64748B]" />
                    </div>
                  </button>
                ))
              )}
            </div>
          )}

          {/* Step: Fill Form */}
          {step === 'fill' && selectedTemplate && groupedVariables && (
            <div className="space-y-6">
              {Object.entries(groupedVariables).map(([groupName, variables]) => (
                <div key={groupName}>
                  <h3 className="text-sm font-medium text-[#D4A574] mb-3">
                    {groupName}
                  </h3>
                  <div className="space-y-4">
                    {variables.map((variable) => (
                      <div key={variable.id}>
                        <label className="block text-sm text-[#F1F5F9] mb-1">
                          {variable.label}
                          {variable.is_required && (
                            <span className="text-red-400 ml-1">*</span>
                          )}
                        </label>
                        {variable.description && (
                          <p className="text-xs text-[#64748B] mb-2">
                            {variable.description}
                          </p>
                        )}
                        {renderVariableInput(variable)}
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {/* Output format */}
              <div>
                <label className="block text-sm text-[#F1F5F9] mb-2">
                  Формат документа
                </label>
                <div className="flex gap-3">
                  <button
                    onClick={() => setOutputFormat('docx')}
                    className={`px-4 py-2 rounded-lg border transition-colors ${
                      outputFormat === 'docx'
                        ? 'bg-[#D4A574]/20 border-[#D4A574] text-[#D4A574]'
                        : 'border-[#D4A574]/20 text-[#94A3B8] hover:border-[#D4A574]/40'
                    }`}
                  >
                    DOCX
                  </button>
                  <button
                    onClick={() => setOutputFormat('pdf')}
                    className={`px-4 py-2 rounded-lg border transition-colors ${
                      outputFormat === 'pdf'
                        ? 'bg-[#D4A574]/20 border-[#D4A574] text-[#D4A574]'
                        : 'border-[#D4A574]/20 text-[#94A3B8] hover:border-[#D4A574]/40'
                    }`}
                  >
                    PDF
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Step: Success */}
          {step === 'success' && generatedDoc && (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center animate-scaleIn">
                <Check className="w-8 h-8 text-green-500" />
              </div>
              <h3 className="text-lg font-medium text-[#F1F5F9] mb-2">
                Документ создан!
              </h3>
              <p className="text-[#94A3B8] mb-6">
                {generatedDoc.document_name}
              </p>
              <Button
                onClick={handleDownload}
                className="bg-[#D4A574] hover:bg-[#E8C297] text-[#0F1419]"
              >
                <Download className="w-4 h-4 mr-2" />
                Скачать документ
              </Button>
            </div>
          )}
        </div>

        {/* Footer */}
        {step === 'fill' && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-[#D4A574]/20 bg-[#1A2332]/50">
            <Button
              variant="ghost"
              onClick={() => setStep('select')}
              className="text-[#94A3B8]"
            >
              Назад
            </Button>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handlePreview}
                disabled={generating}
                className="border-[#D4A574]/30 text-[#D4A574]"
              >
                {generating ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Eye className="w-4 h-4 mr-2" />
                )}
                Предпросмотр
              </Button>
              <Button
                onClick={handleGenerate}
                disabled={generating}
                className="bg-[#D4A574] hover:bg-[#E8C297] text-[#0F1419]"
              >
                {generating ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <FileText className="w-4 h-4 mr-2" />
                )}
                Создать документ
              </Button>
            </div>
          </div>
        )}

        {step === 'success' && (
          <div className="flex items-center justify-center px-6 py-4 border-t border-[#D4A574]/20 bg-[#1A2332]/50">
            <Button
              variant="outline"
              onClick={onClose}
              className="border-[#D4A574]/30 text-[#94A3B8]"
            >
              Закрыть
            </Button>
          </div>
        )}
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes scaleIn {
          from { transform: scale(0); }
          to { transform: scale(1); }
        }
        .animate-fadeIn { animation: fadeIn 0.2s ease-out; }
        .animate-slideUp { animation: slideUp 0.3s ease-out; }
        .animate-scaleIn { animation: scaleIn 0.3s ease-out; }
      `}</style>
    </div>
  );
}

export default GenerateDocumentModal;
