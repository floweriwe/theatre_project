/**
 * Форма создания/редактирования спектакля — Modern Theatre Elegance v3.
 * 
 * Поддерживает создание нового спектакля и редактирование существующего.
 * Тёмная тема.
 */

import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  Clapperboard,
  Theater,
  Clock,
  Calendar,
  FileText,
  Plus,
} from 'lucide-react';
import { Button, Input, Card, Alert, ContainerSpinner, Select } from '@/components/ui';
import { performanceService } from '@/services/performance_service';
import { ROUTES } from '@/utils/constants';
import type { PerformanceStatus } from '@/types';

// =============================================================================
// Types
// =============================================================================

interface FormData {
  title: string;
  subtitle: string;
  description: string;
  genre: string;
  ageRating: string;
  durationMinutes: number;
  status: PerformanceStatus;
  premiereDate: string;
}

interface FormErrors {
  [key: string]: string;
}

// =============================================================================
// Initial Values
// =============================================================================

const initialFormData: FormData = {
  title: '',
  subtitle: '',
  description: '',
  genre: '',
  ageRating: '',
  durationMinutes: 120,
  status: 'preparation',
  premiereDate: '',
};

// =============================================================================
// Options
// =============================================================================

const STATUS_OPTIONS = [
  { value: 'preparation', label: 'Подготовка' },
  { value: 'in_repertoire', label: 'В репертуаре' },
  { value: 'paused', label: 'На паузе' },
  { value: 'archived', label: 'В архиве' },
];

const GENRE_OPTIONS = [
  { value: '', label: 'Выберите жанр' },
  { value: 'Драма', label: 'Драма' },
  { value: 'Комедия', label: 'Комедия' },
  { value: 'Трагедия', label: 'Трагедия' },
  { value: 'Мюзикл', label: 'Мюзикл' },
  { value: 'Балет', label: 'Балет' },
  { value: 'Опера', label: 'Опера' },
  { value: 'Оперетта', label: 'Оперетта' },
  { value: 'Водевиль', label: 'Водевиль' },
  { value: 'Фарс', label: 'Фарс' },
  { value: 'Детский спектакль', label: 'Детский спектакль' },
  { value: 'Экспериментальный', label: 'Экспериментальный' },
];

const AGE_RATING_OPTIONS = [
  { value: '', label: 'Выберите возраст' },
  { value: '0+', label: '0+' },
  { value: '6+', label: '6+' },
  { value: '12+', label: '12+' },
  { value: '16+', label: '16+' },
  { value: '18+', label: '18+' },
];

// =============================================================================
// Main Component
// =============================================================================

export function PerformanceFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = !!id && id !== 'new';
  
  // Form state
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Set<string>>(new Set());
  
  // UI state
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Load existing performance
  const loadData = useCallback(async () => {
    if (!isEditing) return;
    
    try {
      setLoading(true);
      const perf = await performanceService.getPerformance(Number(id));
      setFormData({
        title: perf.title,
        subtitle: perf.subtitle || '',
        description: perf.description || '',
        genre: perf.genre || '',
        ageRating: perf.ageRating || '',
        durationMinutes: perf.durationMinutes || 120,
        status: perf.status,
        premiereDate: perf.premiereDate || '',
      });
    } catch (err: any) {
      console.error('Failed to load performance:', err);
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
    
    if (!formData.title.trim()) {
      newErrors.title = 'Название обязательно';
    }
    
    if (formData.durationMinutes < 1) {
      newErrors.durationMinutes = 'Продолжительность должна быть больше 0';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle input change
  const handleChange = (field: keyof FormData, value: string | number) => {
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
      const data = {
        title: formData.title,
        subtitle: formData.subtitle || undefined,
        description: formData.description || undefined,
        genre: formData.genre || undefined,
        ageRating: formData.ageRating || undefined,
        durationMinutes: formData.durationMinutes,
        status: formData.status,
        premiereDate: formData.premiereDate || undefined,
      };
      
      if (isEditing) {
        await performanceService.updatePerformance(Number(id), data);
        setSuccess('Спектакль успешно обновлён');
        
        setTimeout(() => {
          navigate(`${ROUTES.PERFORMANCES}/${id}`);
        }, 1000);
      } else {
        const newPerf = await performanceService.createPerformance(data);
        setSuccess('Спектакль успешно создан');
        
        setTimeout(() => {
          navigate(`${ROUTES.PERFORMANCES}/${newPerf.id}`);
        }, 1000);
      }
    } catch (err: any) {
      console.error('Failed to save:', err);
      setError('Ошибка сохранения. Попробуйте ещё раз.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <ContainerSpinner />;
  }

  return (
    <div className="animate-fade-in space-y-6 max-w-4xl mx-auto">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-bg-elevated via-bg-elevated to-bg-surface p-8">
        {/* Декоративные элементы */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-gold-300/5 rounded-full blur-2xl translate-y-1/2 -translate-x-1/3" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-4">
            <Link to={isEditing ? `${ROUTES.PERFORMANCES}/${id}` : ROUTES.PERFORMANCES}>
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Clapperboard className="w-5 h-5 text-gold-300" />
                <span className="text-sm text-gold-300 font-medium">Репертуар</span>
              </div>
              <h1 className="font-display text-2xl lg:text-3xl font-bold text-white">
                {isEditing ? 'Редактирование спектакля' : 'Новый спектакль'}
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
            {/* Basic Info */}
            <div>
              <h2 className="font-display text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Clapperboard className="w-5 h-5 text-gold-300" />
                Основная информация
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Название *"
                  placeholder="Введите название спектакля"
                  value={formData.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  error={touched.has('title') ? errors.title : undefined}
                  leftIcon={<Clapperboard className="w-4 h-4" />}
                />
                
                <Input
                  label="Подзаголовок"
                  placeholder="Например: Комедия в двух действиях"
                  value={formData.subtitle}
                  onChange={(e) => handleChange('subtitle', e.target.value)}
                  leftIcon={<FileText className="w-4 h-4" />}
                />
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-text-secondary mb-1.5">
                    Описание
                  </label>
                  <textarea
                    placeholder="Введите описание спектакля, сюжет, особенности постановки..."
                    value={formData.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 bg-bg-surface-hover border border-border-subtle rounded-xl 
                      text-white placeholder:text-text-muted
                      focus:outline-none focus:ring-2 focus:ring-gold-300/50 focus:border-gold-300/50
                      transition-all resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Classification */}
            <div className="pt-6 border-t border-border-subtle">
              <h2 className="font-display text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Theater className="w-5 h-5 text-gold-300" />
                Классификация
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Select
                  label="Жанр"
                  options={GENRE_OPTIONS}
                  value={formData.genre}
                  onChange={(e) => handleChange('genre', e.target.value)}
                />
                
                <Select
                  label="Возрастной рейтинг"
                  options={AGE_RATING_OPTIONS}
                  value={formData.ageRating}
                  onChange={(e) => handleChange('ageRating', e.target.value)}
                />
                
                {isEditing && (
                  <Select
                    label="Статус"
                    options={STATUS_OPTIONS}
                    value={formData.status}
                    onChange={(e) => handleChange('status', e.target.value as PerformanceStatus)}
                  />
                )}
              </div>
            </div>

            {/* Timing */}
            <div className="pt-6 border-t border-border-subtle">
              <h2 className="font-display text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-gold-300" />
                Время и даты
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Продолжительность (минуты) *"
                  type="number"
                  min={1}
                  value={formData.durationMinutes}
                  onChange={(e) => handleChange('durationMinutes', parseInt(e.target.value) || 0)}
                  error={touched.has('durationMinutes') ? errors.durationMinutes : undefined}
                  leftIcon={<Clock className="w-4 h-4" />}
                />
                
                <Input
                  label="Дата премьеры"
                  type="date"
                  value={formData.premiereDate}
                  onChange={(e) => handleChange('premiereDate', e.target.value)}
                  leftIcon={<Calendar className="w-4 h-4" />}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="pt-6 border-t border-border-subtle flex flex-col sm:flex-row gap-3 justify-end">
              <Link to={isEditing ? `${ROUTES.PERFORMANCES}/${id}` : ROUTES.PERFORMANCES}>
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
                {isEditing ? 'Сохранить изменения' : 'Создать спектакль'}
              </Button>
            </div>
          </div>
        </Card>
      </form>
    </div>
  );
}
