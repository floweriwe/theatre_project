/**
 * Модальное окно создания/редактирования события — Modern Theatre Elegance v3
 */

import { useState } from 'react';
import { X, Calendar, Clock, MapPin, Users, Theater } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { cn } from '@/utils/helpers';

interface EventFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: EventFormData) => void;
  initialData?: Partial<EventFormData>;
  selectedDate?: Date;
}

interface EventFormData {
  title: string;
  eventType: string;
  date: string;
  startTime: string;
  endTime: string;
  venue: string;
  performanceId?: number;
  description: string;
}

const EVENT_TYPES = [
  { value: 'performance', label: 'Спектакль' },
  { value: 'rehearsal', label: 'Репетиция' },
  { value: 'tech_rehearsal', label: 'Технический прогон' },
  { value: 'dress_rehearsal', label: 'Генеральная репетиция' },
  { value: 'meeting', label: 'Собрание' },
  { value: 'maintenance', label: 'Техническое обслуживание' },
  { value: 'other', label: 'Другое' },
];

const VENUES = [
  'Большая сцена',
  'Малая сцена',
  'Репетиционный зал 1',
  'Репетиционный зал 2',
  'Конференц-зал',
  'Фойе',
];

export function EventFormModal({
  isOpen,
  onClose,
  onSave,
  initialData,
  selectedDate,
}: EventFormModalProps) {
  const [formData, setFormData] = useState<EventFormData>({
    title: initialData?.title || '',
    eventType: initialData?.eventType || 'rehearsal',
    date: initialData?.date || selectedDate?.toISOString().split('T')[0] || '',
    startTime: initialData?.startTime || '10:00',
    endTime: initialData?.endTime || '13:00',
    venue: initialData?.venue || '',
    performanceId: initialData?.performanceId,
    description: initialData?.description || '',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof EventFormData, string>>>({});

  const handleChange = (field: keyof EventFormData, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof EventFormData, string>> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Введите название события';
    }
    if (!formData.date) {
      newErrors.date = 'Выберите дату';
    }
    if (!formData.startTime) {
      newErrors.startTime = 'Укажите время начала';
    }
    if (!formData.venue) {
      newErrors.venue = 'Выберите место проведения';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSave(formData);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg mx-4 bg-surface border border-white/10 rounded-2xl shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/5">
          <h2 className="text-lg font-medium text-white">
            {initialData ? 'Редактировать событие' : 'Новое событие'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-text-muted hover:text-white transition-colors rounded-lg hover:bg-white/5"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm text-text-muted mb-2">
              Название события *
            </label>
            <Input
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder="Например: Репетиция 'Вишнёвый сад'"
              className={cn(errors.title && 'border-red-500')}
            />
            {errors.title && (
              <p className="text-sm text-red-400 mt-1">{errors.title}</p>
            )}
          </div>

          {/* Event Type */}
          <div>
            <label className="block text-sm text-text-muted mb-2">
              Тип события
            </label>
            <Select
              value={formData.eventType}
              onChange={(e) => handleChange('eventType', e.target.value)}
            >
              {EVENT_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </Select>
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-text-muted mb-2">
                Дата *
              </label>
              <Input
                type="date"
                value={formData.date}
                onChange={(e) => handleChange('date', e.target.value)}
                className={cn(errors.date && 'border-red-500')}
              />
            </div>
            <div>
              <label className="block text-sm text-text-muted mb-2">
                Начало *
              </label>
              <Input
                type="time"
                value={formData.startTime}
                onChange={(e) => handleChange('startTime', e.target.value)}
                className={cn(errors.startTime && 'border-red-500')}
              />
            </div>
            <div>
              <label className="block text-sm text-text-muted mb-2">
                Окончание
              </label>
              <Input
                type="time"
                value={formData.endTime}
                onChange={(e) => handleChange('endTime', e.target.value)}
              />
            </div>
          </div>

          {/* Venue */}
          <div>
            <label className="block text-sm text-text-muted mb-2">
              Место проведения *
            </label>
            <Select
              value={formData.venue}
              onChange={(e) => handleChange('venue', e.target.value)}
              className={cn(errors.venue && 'border-red-500')}
            >
              <option value="">Выберите место</option>
              {VENUES.map((venue) => (
                <option key={venue} value={venue}>
                  {venue}
                </option>
              ))}
            </Select>
            {errors.venue && (
              <p className="text-sm text-red-400 mt-1">{errors.venue}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm text-text-muted mb-2">
              Описание
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Дополнительная информация о событии..."
              rows={3}
              className="w-full px-4 py-2 bg-surface-light border border-white/10 rounded-lg text-white placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold resize-none"
            />
          </div>
        </form>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-4 border-t border-white/5">
          <Button variant="outline" onClick={onClose}>
            Отмена
          </Button>
          <Button onClick={handleSubmit}>
            {initialData ? 'Сохранить' : 'Создать'}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default EventFormModal;
