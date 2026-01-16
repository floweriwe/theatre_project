/**
 * Форма загрузки/редактирования документа — Modern Theatre Elegance v3.
 * 
 * Поддерживает загрузку нового документа и редактирование существующего.
 * Тёмная тема.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  FileText,
  Upload,
  X,
  File,
  FileImage,
  FileSpreadsheet,
  AlertCircle,
  Plus,
  Eye,
  EyeOff,
} from 'lucide-react';
import { Button, Input, Card, Alert, ContainerSpinner, Select, Badge } from '@/components/ui';
import { documentService } from '@/services/document_service';
import { ROUTES } from '@/utils/constants';
import { cn } from '@/utils/helpers';
import type { Document, DocumentCategory } from '@/types';

// =============================================================================
// Types
// =============================================================================

interface FormData {
  name: string;
  description: string;
  categoryId: string;
  isPublic: boolean;
}

interface FormErrors {
  [key: string]: string;
}

// =============================================================================
// Initial Values
// =============================================================================

const initialFormData: FormData = {
  name: '',
  description: '',
  categoryId: '',
  isPublic: false,
};

// =============================================================================
// File Type Icons
// =============================================================================

const getFileIcon = (fileName: string) => {
  const ext = fileName.split('.').pop()?.toLowerCase();
  
  if (['pdf'].includes(ext || '')) {
    return <FileText className="w-8 h-8 text-red-400" />;
  }
  if (['doc', 'docx', 'odt', 'rtf'].includes(ext || '')) {
    return <FileText className="w-8 h-8 text-blue-400" />;
  }
  if (['xls', 'xlsx', 'ods', 'csv'].includes(ext || '')) {
    return <FileSpreadsheet className="w-8 h-8 text-green-400" />;
  }
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext || '')) {
    return <FileImage className="w-8 h-8 text-purple-400" />;
  }
  return <File className="w-8 h-8 text-text-muted" />;
};

// =============================================================================
// Main Component
// =============================================================================

export function DocumentFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = !!id && id !== 'new';
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Form state
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Set<string>>(new Set());
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [existingDocument, setExistingDocument] = useState<Document | null>(null);
  
  // Reference data
  const [categories, setCategories] = useState<DocumentCategory[]>([]);
  
  // UI state
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Load reference data and existing document
  const loadData = useCallback(async () => {
    try {
      const categoriesData = await documentService.getCategories();
      setCategories(categoriesData);

      if (isEditing) {
        setLoading(true);
        const doc = await documentService.getDocument(Number(id));
        setExistingDocument(doc);
        setFormData({
          name: doc.name,
          description: doc.description || '',
          categoryId: doc.categoryId?.toString() || '',
          isPublic: doc.isPublic,
        });
      }
    } catch (err: any) {
      console.error('Failed to load data:', err);
      setError('Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  }, [id, isEditing]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Validate form
  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Название обязательно';
    }
    
    if (!isEditing && !selectedFile) {
      newErrors.file = 'Выберите файл для загрузки';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle input change
  const handleChange = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setTouched(prev => new Set(prev).add(field));
    
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      
      // Auto-fill name from filename if empty
      if (!formData.name) {
        const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
        setFormData(prev => ({ ...prev, name: nameWithoutExt }));
      }
      
      // Clear file error
      if (errors.file) {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors.file;
          return newErrors;
        });
      }
    }
  };

  // Handle file drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setSelectedFile(file);
      if (!formData.name) {
        const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
        setFormData(prev => ({ ...prev, name: nameWithoutExt }));
      }
    }
  };

  // Remove selected file
  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setTouched(new Set(Object.keys(formData)));
    
    if (!validate()) {
      return;
    }
    
    setSaving(true);
    setError(null);
    
    try {
      if (isEditing) {
        await documentService.updateDocument(
          Number(id),
          {
            name: formData.name,
            description: formData.description || undefined,
            categoryId: formData.categoryId ? Number(formData.categoryId) : undefined,
            isPublic: formData.isPublic,
          },
          selectedFile || undefined
        );
        setSuccess('Документ успешно обновлён');
        
        setTimeout(() => {
          navigate(`${ROUTES.DOCUMENTS}/${id}`);
        }, 1000);
      } else {
        if (!selectedFile) return;
        
        const newDoc = await documentService.uploadDocument(selectedFile, {
          name: formData.name,
          description: formData.description || undefined,
          categoryId: formData.categoryId ? Number(formData.categoryId) : undefined,
          isPublic: formData.isPublic,
        });
        setSuccess('Документ успешно загружен');
        
        setTimeout(() => {
          navigate(`${ROUTES.DOCUMENTS}/${newDoc.id}`);
        }, 1000);
      }
    } catch (err: any) {
      console.error('Failed to save:', err);
      setError('Ошибка сохранения. Попробуйте ещё раз.');
    } finally {
      setSaving(false);
    }
  };

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} Б`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} КБ`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`;
  };

  // Build category options
  const categoryOptions = [
    { value: '', label: 'Без категории' },
    ...categories.map(c => ({ value: c.id.toString(), label: c.name })),
  ];

  if (loading) {
    return <ContainerSpinner />;
  }

  return (
    <div className="animate-fade-in space-y-6 max-w-4xl mx-auto">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-bg-elevated via-bg-elevated to-bg-surface p-8">
        {/* Декоративные элементы */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-gold-300/5 rounded-full blur-2xl translate-y-1/2 -translate-x-1/3" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-4">
            <Link to={isEditing ? `${ROUTES.DOCUMENTS}/${id}` : ROUTES.DOCUMENTS}>
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            
            <div>
              <div className="flex items-center gap-2 mb-1">
                <FileText className="w-5 h-5 text-gold-300" />
                <span className="text-sm text-gold-300 font-medium">Документы</span>
              </div>
              <h1 className="font-display text-2xl lg:text-3xl font-bold text-text-primary">
                {isEditing ? 'Редактирование документа' : 'Загрузка документа'}
              </h1>
            </div>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <Alert variant="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert variant="success">
          {success}
        </Alert>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <Card>
          <div className="space-y-6">
            {/* File Upload */}
            <div>
              <h2 className="font-display text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
                <Upload className="w-5 h-5 text-gold-300" />
                {isEditing ? 'Заменить файл (опционально)' : 'Файл *'}
              </h2>
              
              {/* Current file (edit mode) */}
              {isEditing && existingDocument && !selectedFile && (
                <div className="mb-4 p-4 bg-bg-surface-hover rounded-xl border border-border-subtle">
                  <div className="flex items-center gap-3">
                    {getFileIcon(existingDocument.fileName)}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-text-primary truncate">{existingDocument.fileName}</p>
                      <p className="text-sm text-text-muted">
                        {formatFileSize(existingDocument.fileSize)} • v{existingDocument.currentVersion}
                      </p>
                    </div>
                    <Badge variant="info">Текущий файл</Badge>
                  </div>
                </div>
              )}
              
              {/* Selected file */}
              {selectedFile && (
                <div className="mb-4 p-4 bg-bg-surface-hover rounded-xl border border-gold-300/30">
                  <div className="flex items-center gap-3">
                    {getFileIcon(selectedFile.name)}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-text-primary truncate">{selectedFile.name}</p>
                      <p className="text-sm text-text-muted">{formatFileSize(selectedFile.size)}</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={handleRemoveFile}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
              
              {/* Drop zone */}
              <div
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  'border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all',
                  errors.file 
                    ? 'border-error bg-error/5' 
                    : 'border-border-subtle hover:border-gold-300/50 hover:bg-bg-surface-hover'
                )}
              >
                <Upload className="w-10 h-10 text-text-muted mx-auto mb-3" />
                <p className="text-text-primary font-medium mb-1">
                  Нажмите для выбора или перетащите файл
                </p>
                <p className="text-sm text-text-muted">
                  PDF, DOC, XLS, изображения и другие форматы
                </p>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={handleFileSelect}
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.webp"
                />
              </div>
              
              {errors.file && (
                <p className="mt-2 text-sm text-error flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.file}
                </p>
              )}
            </div>

            {/* Basic Info */}
            <div className="pt-6 border-t border-border-subtle">
              <h2 className="font-display text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-gold-300" />
                Информация
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Название *"
                  placeholder="Введите название документа"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  error={touched.has('name') ? errors.name : undefined}
                  leftIcon={<FileText className="w-4 h-4" />}
                />
                
                <Select
                  label="Категория"
                  options={categoryOptions}
                  value={formData.categoryId}
                  onChange={(e) => handleChange('categoryId', e.target.value)}
                />
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-text-secondary mb-1.5">
                    Описание
                  </label>
                  <textarea
                    placeholder="Введите описание документа"
                    value={formData.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 bg-bg-surface-hover border border-border-subtle rounded-xl 
                      text-text-primary placeholder:text-text-muted
                      focus:outline-none focus:ring-2 focus:ring-gold-300/50 focus:border-gold-300/50
                      transition-all resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Visibility */}
            <div className="pt-6 border-t border-border-subtle">
              <h2 className="font-display text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
                {formData.isPublic ? <Eye className="w-5 h-5 text-gold-300" /> : <EyeOff className="w-5 h-5 text-gold-300" />}
                Видимость
              </h2>
              
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => handleChange('isPublic', false)}
                  className={cn(
                    'flex-1 p-4 rounded-xl border-2 transition-all text-left',
                    !formData.isPublic
                      ? 'border-gold-300 bg-gold-300/10'
                      : 'border-border-subtle bg-bg-surface hover:border-border-default'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <EyeOff className={cn('w-5 h-5', !formData.isPublic ? 'text-gold-300' : 'text-text-muted')} />
                    <div>
                      <p className={cn('font-medium', !formData.isPublic ? 'text-gold-300' : 'text-text-primary')}>
                        Приватный
                      </p>
                      <p className="text-xs text-text-muted">Виден только авторизованным</p>
                    </div>
                  </div>
                </button>
                
                <button
                  type="button"
                  onClick={() => handleChange('isPublic', true)}
                  className={cn(
                    'flex-1 p-4 rounded-xl border-2 transition-all text-left',
                    formData.isPublic
                      ? 'border-gold-300 bg-gold-300/10'
                      : 'border-border-subtle bg-bg-surface hover:border-border-default'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Eye className={cn('w-5 h-5', formData.isPublic ? 'text-gold-300' : 'text-text-muted')} />
                    <div>
                      <p className={cn('font-medium', formData.isPublic ? 'text-gold-300' : 'text-text-primary')}>
                        Публичный
                      </p>
                      <p className="text-xs text-text-muted">Доступен всем пользователям</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-6 border-t border-border-subtle flex flex-col sm:flex-row gap-3 justify-end">
              <Link to={isEditing ? `${ROUTES.DOCUMENTS}/${id}` : ROUTES.DOCUMENTS}>
                <Button variant="secondary" className="w-full sm:w-auto">
                  Отмена
                </Button>
              </Link>
              
              <Button 
                type="submit" 
                variant="primary"
                loading={saving}
                leftIcon={isEditing ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              >
                {isEditing ? 'Сохранить изменения' : 'Загрузить документ'}
              </Button>
            </div>
          </div>
        </Card>
      </form>
    </div>
  );
}
