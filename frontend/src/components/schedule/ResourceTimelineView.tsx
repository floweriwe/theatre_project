/**
 * ResourceTimelineView - горизонтальный таймлайн ресурсов.
 *
 * Отображает:
 * - Ресурсы (площадки) по вертикали
 * - Временные слоты по горизонтали
 * - События как блоки на пересечении
 */
import { useState, useMemo, useRef } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TimeSlot {
  eventId: number;
  eventTitle: string;
  eventType: string;
  status: string;
  startTime: string;
  endTime: string | null;
  color: string | null;
  performanceId: number | null;
}

interface ResourceDay {
  date: string;
  totalHours: number;
  isFullyBooked: boolean;
  slots: TimeSlot[];
}

interface ResourceTimeline {
  resourceId: number;
  resourceType: string;
  resourceName: string;
  days: ResourceDay[];
}

interface ResourceTimelineViewProps {
  timelines: ResourceTimeline[];
  startDate: Date;
  endDate: Date;
  onEventClick?: (eventId: number, anchorEl: HTMLElement) => void;
  onSlotClick?: (resourceId: number, date: string, hour: number) => void;
  className?: string;
}

const HOURS = Array.from({ length: 16 }, (_, i) => i + 8); // 8:00 - 23:00
const HOUR_WIDTH = 60; // pixels per hour

const EVENT_TYPE_COLORS: Record<string, string> = {
  performance: '#8B5CF6',
  rehearsal: '#3B82F6',
  tech_rehearsal: '#F97316',
  dress_rehearsal: '#EC4899',
  meeting: '#22C55E',
  maintenance: '#94A3B8',
  other: '#64748B',
};

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
}

function parseTime(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours + minutes / 60;
}

function getEventPosition(startTime: string, endTime: string | null): { left: number; width: number } {
  const start = parseTime(startTime);
  const end = endTime ? parseTime(endTime) : 23;

  const startHour = Math.max(start, 8);
  const endHour = Math.min(end, 23);

  const left = (startHour - 8) * HOUR_WIDTH;
  const width = Math.max((endHour - startHour) * HOUR_WIDTH, 20);

  return { left, width };
}

export function ResourceTimelineView({
  timelines,
  startDate,
  endDate,
  onEventClick,
  onSlotClick,
  className,
}: ResourceTimelineViewProps) {
  const [selectedDate, setSelectedDate] = useState<string>(
    startDate.toISOString().split('T')[0]
  );
  const containerRef = useRef<HTMLDivElement>(null);

  // Get all dates in range
  const dates = useMemo(() => {
    const result: string[] = [];
    const current = new Date(startDate);
    while (current <= endDate) {
      result.push(current.toISOString().split('T')[0]);
      current.setDate(current.getDate() + 1);
    }
    return result;
  }, [startDate, endDate]);

  // Navigate dates
  const goToPrevDay = () => {
    const idx = dates.indexOf(selectedDate);
    if (idx > 0) {
      setSelectedDate(dates[idx - 1]);
    }
  };

  const goToNextDay = () => {
    const idx = dates.indexOf(selectedDate);
    if (idx < dates.length - 1) {
      setSelectedDate(dates[idx + 1]);
    }
  };

  // Get day data for selected date
  const getDayData = (timeline: ResourceTimeline): ResourceDay | null => {
    return timeline.days.find(d => d.date === selectedDate) || null;
  };

  return (
    <div className={cn('bg-[#1A2332] rounded-xl border border-[#334155]', className)}>
      {/* Header with date navigation */}
      <div className="flex items-center justify-between p-4 border-b border-[#334155]">
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-5 h-5 text-[#D4A574]" />
          <h3 className="text-lg font-medium text-[#F1F5F9]">
            Таймлайн ресурсов
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={goToPrevDay}
            disabled={dates.indexOf(selectedDate) === 0}
            className="p-1.5 text-[#64748B] hover:text-[#F1F5F9] hover:bg-[#243044] rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <select
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-1.5 bg-[#243044] border border-[#334155] rounded text-sm text-[#F1F5F9] focus:outline-none focus:border-[#D4A574]"
          >
            {dates.map(d => (
              <option key={d} value={d}>
                {formatDate(d)}
              </option>
            ))}
          </select>

          <button
            onClick={goToNextDay}
            disabled={dates.indexOf(selectedDate) === dates.length - 1}
            className="p-1.5 text-[#64748B] hover:text-[#F1F5F9] hover:bg-[#243044] rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Timeline grid */}
      <div className="overflow-x-auto" ref={containerRef}>
        <div style={{ minWidth: HOURS.length * HOUR_WIDTH + 150 }}>
          {/* Hour headers */}
          <div className="flex border-b border-[#334155]">
            <div className="w-[150px] flex-shrink-0 p-2 text-xs text-[#64748B] font-medium">
              Площадка
            </div>
            {HOURS.map(hour => (
              <div
                key={hour}
                className="flex-shrink-0 p-2 text-xs text-[#64748B] text-center border-l border-[#334155]/50"
                style={{ width: HOUR_WIDTH }}
              >
                {hour}:00
              </div>
            ))}
          </div>

          {/* Resource rows */}
          {timelines.map(timeline => {
            const dayData = getDayData(timeline);

            return (
              <div
                key={timeline.resourceId}
                className="flex border-b border-[#334155]/50 hover:bg-[#243044]/30 transition-colors"
              >
                {/* Resource name */}
                <div className="w-[150px] flex-shrink-0 p-2 text-sm text-[#F1F5F9] font-medium truncate">
                  {timeline.resourceName}
                </div>

                {/* Timeline area */}
                <div
                  className="relative flex-1"
                  style={{
                    height: 48,
                    backgroundImage: `repeating-linear-gradient(
                      90deg,
                      transparent,
                      transparent ${HOUR_WIDTH - 1}px,
                      rgba(51, 65, 85, 0.3) ${HOUR_WIDTH - 1}px,
                      rgba(51, 65, 85, 0.3) ${HOUR_WIDTH}px
                    )`,
                  }}
                  onClick={(e) => {
                    if (onSlotClick) {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const x = e.clientX - rect.left;
                      const hour = Math.floor(x / HOUR_WIDTH) + 8;
                      onSlotClick(timeline.resourceId, selectedDate, hour);
                    }
                  }}
                >
                  {/* Event blocks */}
                  {dayData?.slots.map((slot, idx) => {
                    const { left, width } = getEventPosition(slot.startTime, slot.endTime);
                    const color = slot.color || EVENT_TYPE_COLORS[slot.eventType] || '#64748B';

                    return (
                      <div
                        key={idx}
                        className="absolute top-1 bottom-1 rounded cursor-pointer hover:brightness-110 transition-all overflow-hidden"
                        style={{
                          left,
                          width,
                          backgroundColor: color,
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onEventClick) {
                            onEventClick(slot.eventId, e.currentTarget);
                          }
                        }}
                        title={`${slot.eventTitle} (${slot.startTime} - ${slot.endTime || '...'})`}
                      >
                        <div className="px-1.5 py-0.5 text-xs text-white font-medium truncate">
                          {slot.eventTitle}
                        </div>
                      </div>
                    );
                  })}

                  {/* Empty state indicator */}
                  {(!dayData || dayData.slots.length === 0) && (
                    <div className="absolute inset-0 flex items-center justify-center text-xs text-[#64748B]">
                      Свободно
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Empty state */}
          {timelines.length === 0 && (
            <div className="p-8 text-center text-[#64748B]">
              Нет данных о ресурсах
            </div>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 p-4 border-t border-[#334155]">
        <span className="text-xs text-[#64748B]">Типы событий:</span>
        {Object.entries(EVENT_TYPE_COLORS).slice(0, 5).map(([type, color]) => (
          <div key={type} className="flex items-center gap-1.5">
            <div
              className="w-3 h-3 rounded"
              style={{ backgroundColor: color }}
            />
            <span className="text-xs text-[#94A3B8]">
              {type === 'performance' && 'Спектакль'}
              {type === 'rehearsal' && 'Репетиция'}
              {type === 'tech_rehearsal' && 'Тех. прогон'}
              {type === 'dress_rehearsal' && 'Генеральная'}
              {type === 'meeting' && 'Совещание'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ResourceTimelineView;
