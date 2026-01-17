/**
 * QuickEventPopover - всплывающее окно с информацией о событии.
 *
 * Показывает:
 * - Название и тип события
 * - Время и площадку
 * - Количество участников
 * - Быстрые действия (редактировать, удалить, изменить статус)
 */
import { useState, useRef, useEffect } from 'react';
import {
  X,
  Edit,
  Trash2,
  Calendar,
  Clock,
  MapPin,
  Users,
  CheckCircle,
  Play,
  XCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface EventData {
  id: number;
  title: string;
  eventType: string;
  status: string;
  startTime: string;
  endTime?: string | null;
  venueName?: string | null;
  color?: string | null;
  participantsCount?: number;
  performanceTitle?: string | null;
}

interface QuickEventPopoverProps {
  event: EventData;
  anchorEl: HTMLElement | null;
  position?: 'top' | 'bottom' | 'left' | 'right';
  onClose: () => void;
  onEdit?: (eventId: number) => void;
  onDelete?: (eventId: number) => void;
  onConfirm?: (eventId: number) => void;
  onStart?: (eventId: number) => void;
  onCancel?: (eventId: number) => void;
}

const EVENT_TYPE_LABELS: Record<string, string> = {
  performance: 'Спектакль',
  rehearsal: 'Репетиция',
  tech_rehearsal: 'Тех. прогон',
  dress_rehearsal: 'Генеральная',
  meeting: 'Совещание',
  maintenance: 'Тех. обслуживание',
  other: 'Прочее',
};

const STATUS_LABELS: Record<string, string> = {
  planned: 'Запланировано',
  confirmed: 'Подтверждено',
  in_progress: 'В процессе',
  completed: 'Завершено',
  cancelled: 'Отменено',
};

const STATUS_COLORS: Record<string, string> = {
  planned: 'text-amber-400',
  confirmed: 'text-emerald-400',
  in_progress: 'text-blue-400',
  completed: 'text-slate-400',
  cancelled: 'text-red-400',
};

export function QuickEventPopover({
  event,
  anchorEl,
  position = 'bottom',
  onClose,
  onEdit,
  onDelete,
  onConfirm,
  onStart,
  onCancel,
}: QuickEventPopoverProps) {
  const popoverRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState({ top: 0, left: 0 });

  // Calculate position based on anchor element
  useEffect(() => {
    if (!anchorEl || !popoverRef.current) return;

    const anchorRect = anchorEl.getBoundingClientRect();
    const popoverRect = popoverRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let top = 0;
    let left = 0;

    switch (position) {
      case 'bottom':
        top = anchorRect.bottom + 8;
        left = anchorRect.left + (anchorRect.width / 2) - (popoverRect.width / 2);
        break;
      case 'top':
        top = anchorRect.top - popoverRect.height - 8;
        left = anchorRect.left + (anchorRect.width / 2) - (popoverRect.width / 2);
        break;
      case 'left':
        top = anchorRect.top + (anchorRect.height / 2) - (popoverRect.height / 2);
        left = anchorRect.left - popoverRect.width - 8;
        break;
      case 'right':
        top = anchorRect.top + (anchorRect.height / 2) - (popoverRect.height / 2);
        left = anchorRect.right + 8;
        break;
    }

    // Keep within viewport
    if (left < 8) left = 8;
    if (left + popoverRect.width > viewportWidth - 8) {
      left = viewportWidth - popoverRect.width - 8;
    }
    if (top < 8) top = 8;
    if (top + popoverRect.height > viewportHeight - 8) {
      top = viewportHeight - popoverRect.height - 8;
    }

    setCoords({ top, left });
  }, [anchorEl, position]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  // Close on Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  if (!anchorEl) return null;

  const canConfirm = event.status === 'planned';
  const canStart = event.status === 'planned' || event.status === 'confirmed';
  const canCancel = event.status !== 'completed' && event.status !== 'cancelled';

  return (
    <div
      ref={popoverRef}
      className="fixed z-50 w-72 bg-[#1A2332] border border-[#334155] rounded-lg shadow-xl animate-in fade-in zoom-in-95 duration-150"
      style={{ top: coords.top, left: coords.left }}
    >
      {/* Header */}
      <div className="flex items-start justify-between p-3 border-b border-[#334155]">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div
            className="w-3 h-3 rounded-full flex-shrink-0"
            style={{ backgroundColor: event.color || '#64748B' }}
          />
          <div className="min-w-0">
            <h3 className="text-sm font-medium text-[#F1F5F9] truncate">
              {event.title}
            </h3>
            <span className="text-xs text-[#64748B]">
              {EVENT_TYPE_LABELS[event.eventType] || event.eventType}
            </span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1 text-[#64748B] hover:text-[#F1F5F9] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Content */}
      <div className="p-3 space-y-2">
        {/* Status */}
        <div className="flex items-center gap-2">
          <span className={cn('text-xs font-medium', STATUS_COLORS[event.status])}>
            {STATUS_LABELS[event.status] || event.status}
          </span>
        </div>

        {/* Time */}
        <div className="flex items-center gap-2 text-sm text-[#94A3B8]">
          <Clock className="w-4 h-4 text-[#64748B]" />
          <span>
            {event.startTime}
            {event.endTime && ` - ${event.endTime}`}
          </span>
        </div>

        {/* Venue */}
        {event.venueName && (
          <div className="flex items-center gap-2 text-sm text-[#94A3B8]">
            <MapPin className="w-4 h-4 text-[#64748B]" />
            <span>{event.venueName}</span>
          </div>
        )}

        {/* Performance */}
        {event.performanceTitle && (
          <div className="flex items-center gap-2 text-sm text-[#94A3B8]">
            <Calendar className="w-4 h-4 text-[#64748B]" />
            <span className="truncate">{event.performanceTitle}</span>
          </div>
        )}

        {/* Participants */}
        {event.participantsCount !== undefined && event.participantsCount > 0 && (
          <div className="flex items-center gap-2 text-sm text-[#94A3B8]">
            <Users className="w-4 h-4 text-[#64748B]" />
            <span>{event.participantsCount} участник(ов)</span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between p-2 border-t border-[#334155] bg-[#0F1419] rounded-b-lg">
        {/* Quick status actions */}
        <div className="flex items-center gap-1">
          {canConfirm && onConfirm && (
            <button
              onClick={() => onConfirm(event.id)}
              className="p-1.5 text-emerald-400 hover:bg-emerald-400/10 rounded transition-colors"
              title="Подтвердить"
            >
              <CheckCircle className="w-4 h-4" />
            </button>
          )}
          {canStart && onStart && (
            <button
              onClick={() => onStart(event.id)}
              className="p-1.5 text-blue-400 hover:bg-blue-400/10 rounded transition-colors"
              title="Начать"
            >
              <Play className="w-4 h-4" />
            </button>
          )}
          {canCancel && onCancel && (
            <button
              onClick={() => onCancel(event.id)}
              className="p-1.5 text-amber-400 hover:bg-amber-400/10 rounded transition-colors"
              title="Отменить"
            >
              <XCircle className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Edit/Delete */}
        <div className="flex items-center gap-1">
          {onEdit && (
            <button
              onClick={() => onEdit(event.id)}
              className="p-1.5 text-[#D4A574] hover:bg-[#D4A574]/10 rounded transition-colors"
              title="Редактировать"
            >
              <Edit className="w-4 h-4" />
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(event.id)}
              className="p-1.5 text-red-400 hover:bg-red-400/10 rounded transition-colors"
              title="Удалить"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default QuickEventPopover;
