/**
 * CalendarView Component - Modern Theatre Elegance v3
 *
 * Advanced calendar with Month, Week, Day views using react-big-calendar.
 * ArtMechanics style with golden accents and dark theatre theme.
 *
 * Phase 14 enhancements:
 * - Drag-and-drop event moving
 * - Event resizing
 * - QuickEventPopover for event preview
 * - Custom event colors support
 */

import { useState, useMemo, useCallback } from 'react';
import { Calendar as BigCalendar, Views, dateFnsLocalizer, View } from 'react-big-calendar';
import withDragAndDrop, { EventInteractionArgs } from 'react-big-calendar/lib/addons/dragAndDrop';
import type { ToolbarProps } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { ru } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Calendar, MapPin } from 'lucide-react';
import { cn } from '@/utils/helpers';
import type { ScheduleEvent, EventType } from '@/types/schedule_types';
import { QuickEventPopover } from './QuickEventPopover';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';
import '@/styles/calendar.css';

// Calendar event interface (must be defined before DnDCalendar)
interface CalendarEvent {
  id: number;
  title: string;
  start: Date;
  end: Date;
  resource: ScheduleEvent;
}

// Create DnD-enabled calendar
// Using any to work around react-big-calendar DnD typing issues
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const DnDCalendar = withDragAndDrop<CalendarEvent, object>(BigCalendar as any);

// Configure date-fns localizer
const locales = {
  'ru': ru,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { locale: ru }),
  getDay,
  locales,
});

// Event type color mapping
const EVENT_COLORS: Record<EventType, { bg: string; border: string; text: string }> = {
  performance: {
    bg: 'rgba(139, 92, 246, 0.15)',
    border: '#8B5CF6',
    text: '#A78BFA'
  },
  rehearsal: {
    bg: 'rgba(59, 130, 246, 0.15)',
    border: '#3B82F6',
    text: '#60A5FA'
  },
  tech_rehearsal: {
    bg: 'rgba(251, 146, 60, 0.15)',
    border: '#FB923C',
    text: '#FB923C'
  },
  dress_rehearsal: {
    bg: 'rgba(236, 72, 153, 0.15)',
    border: '#EC4899',
    text: '#F472B6'
  },
  meeting: {
    bg: 'rgba(16, 185, 129, 0.15)',
    border: '#10B981',
    text: '#34D399'
  },
  maintenance: {
    bg: 'rgba(245, 158, 11, 0.15)',
    border: '#F59E0B',
    text: '#FBBF24'
  },
  other: {
    bg: 'rgba(107, 114, 128, 0.15)',
    border: '#6B7280',
    text: '#9CA3AF'
  },
};

interface CalendarViewProps {
  events: ScheduleEvent[];
  onSelectEvent?: (event: ScheduleEvent) => void;
  onSelectSlot?: (slotInfo: { start: Date; end: Date }) => void;
  onNavigate?: (date: Date) => void;
  onEventDrop?: (eventId: number, start: Date, end: Date) => void;
  onEventResize?: (eventId: number, start: Date, end: Date) => void;
  onEventEdit?: (eventId: number) => void;
  onEventDelete?: (eventId: number) => void;
  onEventStatusChange?: (eventId: number, status: 'confirmed' | 'in_progress' | 'cancelled') => void;
  loading?: boolean;
  draggable?: boolean;
}

export function CalendarView({
  events,
  onSelectEvent,
  onSelectSlot,
  onNavigate,
  onEventDrop,
  onEventResize,
  onEventEdit,
  onEventDelete,
  onEventStatusChange,
  loading = false,
  draggable = true,
}: CalendarViewProps) {
  const [view, setView] = useState<View>(Views.MONTH);
  const [date, setDate] = useState(new Date());

  // Popover state
  const [popoverEvent, setPopoverEvent] = useState<ScheduleEvent | null>(null);
  const [popoverAnchor, setPopoverAnchor] = useState<HTMLElement | null>(null);

  // Transform events to calendar format
  const calendarEvents: CalendarEvent[] = useMemo(() => {
    return events.map((event) => {
      const eventDate = new Date(event.eventDate);
      const [startHour, startMinute] = event.startTime.split(':').map(Number);

      const start = new Date(eventDate);
      start.setHours(startHour, startMinute, 0, 0);

      let end = new Date(start);
      if (event.endTime) {
        const [endHour, endMinute] = event.endTime.split(':').map(Number);
        end = new Date(eventDate);
        end.setHours(endHour, endMinute, 0, 0);
      } else {
        // Default 2 hour duration if no end time
        end.setHours(start.getHours() + 2);
      }

      return {
        id: event.id,
        title: event.title,
        start,
        end,
        resource: event,
      };
    });
  }, [events]);

  // Handle view change
  const handleViewChange = useCallback((newView: View) => {
    setView(newView);
  }, []);

  // Handle date navigation
  const handleNavigate = useCallback((newDate: Date) => {
    setDate(newDate);
    onNavigate?.(newDate);
  }, [onNavigate]);

  // Handle event selection - show popover
  const handleSelectEvent = useCallback((event: object, e: React.SyntheticEvent<HTMLElement>) => {
    const calEvent = event as CalendarEvent;
    setPopoverEvent(calEvent.resource);
    setPopoverAnchor(e.currentTarget as HTMLElement);
  }, []);

  // Handle event click (for onSelectEvent callback)
  const handleEventDoubleClick = useCallback((event: object) => {
    const calEvent = event as CalendarEvent;
    onSelectEvent?.(calEvent.resource);
  }, [onSelectEvent]);

  // Close popover
  const handleClosePopover = useCallback(() => {
    setPopoverEvent(null);
    setPopoverAnchor(null);
  }, []);

  // Handle drag-and-drop event move
  const handleEventDrop = useCallback((args: EventInteractionArgs<object>) => {
    const calEvent = args.event as CalendarEvent;
    if (onEventDrop) {
      const startDate = args.start instanceof Date ? args.start : new Date(args.start);
      const endDate = args.end instanceof Date ? args.end : new Date(args.end);
      onEventDrop(calEvent.id, startDate, endDate);
    }
  }, [onEventDrop]);

  // Handle event resize
  const handleEventResize = useCallback((args: EventInteractionArgs<object>) => {
    const calEvent = args.event as CalendarEvent;
    if (onEventResize) {
      const startDate = args.start instanceof Date ? args.start : new Date(args.start);
      const endDate = args.end instanceof Date ? args.end : new Date(args.end);
      onEventResize(calEvent.id, startDate, endDate);
    }
  }, [onEventResize]);

  // Handle status changes from popover
  const handleConfirm = useCallback((eventId: number) => {
    onEventStatusChange?.(eventId, 'confirmed');
    handleClosePopover();
  }, [onEventStatusChange, handleClosePopover]);

  const handleStart = useCallback((eventId: number) => {
    onEventStatusChange?.(eventId, 'in_progress');
    handleClosePopover();
  }, [onEventStatusChange, handleClosePopover]);

  const handleCancel = useCallback((eventId: number) => {
    onEventStatusChange?.(eventId, 'cancelled');
    handleClosePopover();
  }, [onEventStatusChange, handleClosePopover]);

  const handleEdit = useCallback((eventId: number) => {
    handleClosePopover();
    onEventEdit?.(eventId);
  }, [onEventEdit, handleClosePopover]);

  const handleDelete = useCallback((eventId: number) => {
    handleClosePopover();
    onEventDelete?.(eventId);
  }, [onEventDelete, handleClosePopover]);

  // Handle slot selection (empty time slot)
  const handleSelectSlot = useCallback((slotInfo: { start: Date; end: Date }) => {
    onSelectSlot?.(slotInfo);
  }, [onSelectSlot]);

  // Custom event style getter - supports custom colors per event
  const eventStyleGetter = useCallback((event: object) => {
    const calEvent = event as CalendarEvent;
    // Use custom color if available, otherwise fall back to type-based color
    const customColor = calEvent.resource.color;

    if (customColor) {
      // Create translucent background from custom color
      return {
        style: {
          backgroundColor: `${customColor}25`, // 15% opacity
          borderLeft: `3px solid ${customColor}`,
          color: customColor,
          borderRadius: '4px',
          border: 'none',
          fontSize: '0.875rem',
          padding: '2px 8px',
          cursor: draggable ? 'grab' : 'pointer',
        },
      };
    }

    // Fall back to type-based colors
    const colors = EVENT_COLORS[calEvent.resource.eventType] || EVENT_COLORS.other;

    return {
      style: {
        backgroundColor: colors.bg,
        borderLeft: `3px solid ${colors.border}`,
        color: colors.text,
        borderRadius: '4px',
        border: 'none',
        fontSize: '0.875rem',
        padding: '2px 8px',
        cursor: draggable ? 'grab' : 'pointer',
      },
    };
  }, [draggable]);

  // Custom toolbar component
  const CustomToolbar = useCallback((props: ToolbarProps<CalendarEvent, object>) => {
    const { label, onNavigate, onView, view } = props;
    return (
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        {/* Navigation */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('PREV')}
            className="p-2 hover:bg-white/5 rounded-lg transition-colors"
            aria-label="Previous"
          >
            <ChevronLeft className="w-5 h-5 text-text-secondary" />
          </button>

          <button
            onClick={() => onNavigate('TODAY')}
            className="px-4 py-2 hover:bg-white/5 rounded-lg transition-colors text-sm font-medium text-text-primary"
          >
            Сегодня
          </button>

          <button
            onClick={() => onNavigate('NEXT')}
            className="p-2 hover:bg-white/5 rounded-lg transition-colors"
            aria-label="Next"
          >
            <ChevronRight className="w-5 h-5 text-text-secondary" />
          </button>

          <div className="text-lg font-display font-semibold text-text-primary ml-4">
            {label}
          </div>
        </div>

        {/* View Switcher */}
        <div className="flex gap-1 border border-white/10 rounded-lg p-1 bg-surface-light">
          <button
            onClick={() => onView(Views.MONTH)}
            className={cn(
              'px-4 py-2 rounded text-sm font-medium transition-colors',
              view === Views.MONTH
                ? 'bg-gold/20 text-gold border border-gold/30'
                : 'text-text-secondary hover:text-text-primary hover:bg-white/5'
            )}
          >
            Месяц
          </button>
          <button
            onClick={() => onView(Views.WEEK)}
            className={cn(
              'px-4 py-2 rounded text-sm font-medium transition-colors',
              view === Views.WEEK
                ? 'bg-gold/20 text-gold border border-gold/30'
                : 'text-text-secondary hover:text-text-primary hover:bg-white/5'
            )}
          >
            Неделя
          </button>
          <button
            onClick={() => onView(Views.DAY)}
            className={cn(
              'px-4 py-2 rounded text-sm font-medium transition-colors',
              view === Views.DAY
                ? 'bg-gold/20 text-gold border border-gold/30'
                : 'text-text-secondary hover:text-text-primary hover:bg-white/5'
            )}
          >
            День
          </button>
        </div>
      </div>
    );
  }, []);

  // Custom event component for better styling
  const CustomEvent = useCallback(({ event }: { event: object }) => {
    const calEvent = event as CalendarEvent;
    return (
      <div className="flex flex-col h-full">
        <div className="font-medium truncate">{calEvent.title}</div>
        {calEvent.resource.venue && (
          <div className="flex items-center gap-1 text-xs opacity-80 truncate">
            <MapPin className="w-3 h-3 flex-shrink-0" />
            <span>{calEvent.resource.venue}</span>
          </div>
        )}
      </div>
    );
  }, []);

  // Custom day header
  const CustomDayHeader = useCallback(({ label }: { label: string }) => {
    return (
      <div className="text-text-muted font-medium text-sm py-2">
        {label}
      </div>
    );
  }, []);

  if (loading) {
    return (
      <div className="h-[600px] bg-surface-light rounded-xl border border-white/10 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Calendar className="w-8 h-8 text-gold animate-pulse" />
          <p className="text-text-secondary">Загрузка расписания...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="calendar-container bg-surface-light rounded-xl border border-white/10 p-6">
      <DnDCalendar
        localizer={localizer}
        events={calendarEvents}
        view={view}
        date={date}
        onView={handleViewChange}
        onNavigate={handleNavigate}
        onSelectEvent={handleSelectEvent}
        onDoubleClickEvent={handleEventDoubleClick}
        onSelectSlot={handleSelectSlot}
        onEventDrop={handleEventDrop}
        onEventResize={handleEventResize}
        selectable
        resizable={draggable}
        draggableAccessor={() => draggable}
        popup
        eventPropGetter={eventStyleGetter}
        components={{
          toolbar: CustomToolbar,
          event: CustomEvent,
          month: {
            dateHeader: CustomDayHeader,
          },
        }}
        messages={{
          today: 'Сегодня',
          previous: 'Назад',
          next: 'Вперёд',
          month: 'Месяц',
          week: 'Неделя',
          day: 'День',
          agenda: 'Список',
          date: 'Дата',
          time: 'Время',
          event: 'Событие',
          noEventsInRange: 'Нет событий в этом диапазоне',
          showMore: (total: number) => `+${total} ещё`,
        }}
        formats={{
          dayHeaderFormat: (date: Date) => format(date, 'EEEE', { locale: ru }),
          dayRangeHeaderFormat: ({ start, end }: { start: Date; end: Date }) =>
            `${format(start, 'd MMMM', { locale: ru })} — ${format(end, 'd MMMM yyyy', { locale: ru })}`,
          monthHeaderFormat: (date: Date) => format(date, 'LLLL yyyy', { locale: ru }),
          weekdayFormat: (date: Date) => format(date, 'EEE', { locale: ru }),
          timeGutterFormat: (date: Date) => format(date, 'HH:mm', { locale: ru }),
          eventTimeRangeFormat: ({ start, end }: { start: Date; end: Date }) =>
            `${format(start, 'HH:mm', { locale: ru })} — ${format(end, 'HH:mm', { locale: ru })}`,
          agendaTimeRangeFormat: ({ start, end }: { start: Date; end: Date }) =>
            `${format(start, 'HH:mm', { locale: ru })} — ${format(end, 'HH:mm', { locale: ru })}`,
          agendaDateFormat: (date: Date) => format(date, 'd MMMM', { locale: ru }),
          dayFormat: (date: Date) => format(date, 'd', { locale: ru }),
        }}
        style={{ height: 600 }}
        culture="ru"
      />

      {/* Quick Event Popover */}
      {popoverEvent && (
        <QuickEventPopover
          event={{
            id: popoverEvent.id,
            title: popoverEvent.title,
            eventType: popoverEvent.eventType,
            status: popoverEvent.status,
            startTime: popoverEvent.startTime,
            endTime: popoverEvent.endTime,
            venueName: popoverEvent.venue,
            color: popoverEvent.color,
            participantsCount: popoverEvent.participants?.length,
            performanceTitle: popoverEvent.performanceTitle,
          }}
          anchorEl={popoverAnchor}
          onClose={handleClosePopover}
          onEdit={onEventEdit ? handleEdit : undefined}
          onDelete={onEventDelete ? handleDelete : undefined}
          onConfirm={onEventStatusChange ? handleConfirm : undefined}
          onStart={onEventStatusChange ? handleStart : undefined}
          onCancel={onEventStatusChange ? handleCancel : undefined}
        />
      )}
    </div>
  );
}

export default CalendarView;
