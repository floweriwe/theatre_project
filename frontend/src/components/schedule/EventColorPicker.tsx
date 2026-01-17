/**
 * EventColorPicker - выбор цвета события.
 *
 * Позволяет:
 * - Выбрать цвет по умолчанию для типа события
 * - Выбрать кастомный цвет
 * - Сбросить на цвет по умолчанию
 */
import { useState } from 'react';
import { Palette, RotateCcw, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { EventType, EVENT_TYPE_COLORS, EVENT_TYPE_LABELS } from '@/types/schedule_types';

interface EventColorPickerProps {
  eventType: EventType;
  value: string | null;
  onChange: (color: string | null) => void;
  className?: string;
}

// Preset color palette
const PRESET_COLORS = [
  '#8B5CF6', // Purple
  '#3B82F6', // Blue
  '#06B6D4', // Cyan
  '#10B981', // Emerald
  '#22C55E', // Green
  '#84CC16', // Lime
  '#EAB308', // Yellow
  '#F97316', // Orange
  '#EF4444', // Red
  '#EC4899', // Pink
  '#6366F1', // Indigo
  '#A855F7', // Violet
  '#64748B', // Slate
  '#78716C', // Stone
  '#D4A574', // Gold (theatre theme)
];

export function EventColorPicker({
  eventType,
  value,
  onChange,
  className,
}: EventColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const defaultColor = EVENT_TYPE_COLORS[eventType];
  const currentColor = value || defaultColor;
  const isCustom = value !== null && value !== defaultColor;

  const handleSelect = (color: string) => {
    if (color === defaultColor) {
      onChange(null); // Reset to default
    } else {
      onChange(color);
    }
    setIsOpen(false);
  };

  const handleReset = () => {
    onChange(null);
    setIsOpen(false);
  };

  return (
    <div className={cn('relative', className)}>
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-2 px-3 py-2 bg-[#243044] border border-[#334155] rounded-lg',
          'hover:border-[#475569] transition-colors',
          'focus:outline-none focus:border-[#D4A574]'
        )}
      >
        <div
          className="w-5 h-5 rounded border border-white/20"
          style={{ backgroundColor: currentColor }}
        />
        <span className="text-sm text-[#F1F5F9]">
          {isCustom ? 'Свой цвет' : 'По умолчанию'}
        </span>
        <Palette className="w-4 h-4 text-[#64748B]" />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 z-50 w-64 bg-[#1A2332] border border-[#334155] rounded-lg shadow-xl">
          {/* Default color for event type */}
          <div className="p-3 border-b border-[#334155]">
            <p className="text-xs text-[#64748B] mb-2">
              Цвет по умолчанию для «{EVENT_TYPE_LABELS[eventType]}»:
            </p>
            <button
              type="button"
              onClick={handleReset}
              className={cn(
                'flex items-center gap-2 w-full px-3 py-2 rounded-lg',
                'hover:bg-[#243044] transition-colors',
                !isCustom && 'bg-[#243044]'
              )}
            >
              <div
                className="w-5 h-5 rounded border border-white/20"
                style={{ backgroundColor: defaultColor }}
              />
              <span className="text-sm text-[#F1F5F9] flex-1 text-left">
                По умолчанию
              </span>
              {!isCustom && <Check className="w-4 h-4 text-[#D4A574]" />}
            </button>
          </div>

          {/* Custom colors */}
          <div className="p-3">
            <p className="text-xs text-[#64748B] mb-2">Выбрать цвет:</p>
            <div className="grid grid-cols-5 gap-2">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => handleSelect(color)}
                  className={cn(
                    'w-8 h-8 rounded transition-transform hover:scale-110',
                    currentColor === color && 'ring-2 ring-white ring-offset-2 ring-offset-[#1A2332]'
                  )}
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          </div>

          {/* Reset button */}
          {isCustom && (
            <div className="p-3 border-t border-[#334155]">
              <button
                type="button"
                onClick={handleReset}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-[#243044] rounded-lg transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                Сбросить на цвет по умолчанию
              </button>
            </div>
          )}
        </div>
      )}

      {/* Close on outside click */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}

export default EventColorPicker;
