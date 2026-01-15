/**
 * Страница расписания — Modern Theatre Elegance v3
 */

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Plus,
  ChevronLeft,
  ChevronRight,
  Grid,
  List,
  RefreshCw,
  Clock,
  MapPin,
  Users,
  AlertCircle,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { Alert } from '@/components/ui/Alert';
import { cn } from '@/utils/helpers';
import { ROUTES } from '@/utils/constants';
import { scheduleService } from '@/services/schedule_service';
import type { ScheduleEvent, EventType, EventStatus } from '@/types/schedule_types';

const EVENT_TYPE_LABELS: Record<EventType, string> = {
  performance: 'Спектакль',
  rehearsal: 'Репетиция',
  technical: 'Техническая',
  meeting: 'Собрание',
  other: 'Другое',
};

const EVENT_TYPE_COLORS: Record<EventType, string> = {
  performance: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  rehearsal: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  technical: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  meeting: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  other: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
};

const DAYS_OF_WEEK = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
const MONTHS = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
];

export function SchedulePage() {
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());

  useEffect(() => {
    loadEvents();
  }, [currentDate]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      setError(null);

      const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

      const data = await scheduleService.getEvents({
        dateFrom: startDate.toISOString().split('T')[0],
        dateTo: endDate.toISOString().split('T')[0],
      });

      setEvents(data.items || []);
    } catch (err) {
      console.error('Failed to load events:', err);
      setError('Не удалось загрузить события расписания');
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    
    // Get day of week for first day (0 = Sunday, adjust for Monday start)
    let startDayOfWeek = firstDay.getDay() - 1;
    if (startDayOfWeek < 0) startDayOfWeek = 6;

    const days: (number | null)[] = [];
    
    // Add empty cells for days before first day
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    return days;
  };

  const getEventsForDay = (day: number) => {
    return events.filter((event) => {
      const eventDate = new Date(event.start_date);
      return (
        eventDate.getDate() === day &&
        eventDate.getMonth() === currentDate.getMonth() &&
        eventDate.getFullYear() === currentDate.getFullYear()
      );
    });
  };

  const goToPrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(new Date());
  };

  const isToday = (day: number) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear()
    );
  };

  const isSelected = (day: number) => {
    if (!selectedDate) return false;
    return (
      day === selectedDate.getDate() &&
      currentDate.getMonth() === selectedDate.getMonth() &&
      currentDate.getFullYear() === selectedDate.getFullYear()
    );
  };

  const selectedDayEvents = selectedDate
    ? getEventsForDay(selectedDate.getDate())
    : [];

  const formatTime = (timeString: string) => {
    return timeString.slice(0, 5);
  };

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-surface-light to-surface p-6 lg:p-8">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        
        <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <p className="text-amber-400 text-sm flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4" />
              Планирование и расписание
            </p>
            <h1 className="text-2xl lg:text-3xl font-display font-bold text-white mb-2">
              Расписание
            </h1>
            <p className="text-text-secondary">
              Спектакли, репетиции и технические мероприятия театра
            </p>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={loadEvents}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Обновить
            </Button>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Добавить событие
            </Button>
          </div>
        </div>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      {/* Calendar Header */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={goToPrevMonth}
              className="p-2 hover:bg-white/5 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-text-secondary" />
            </button>
            <h2 className="text-lg font-medium text-white min-w-[200px] text-center">
              {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            <button
              onClick={goToNextMonth}
              className="p-2 hover:bg-white/5 rounded-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-text-secondary" />
            </button>
            <Button variant="outline" size="sm" onClick={goToToday}>
              Сегодня
            </Button>
          </div>
          <div className="flex gap-1 border border-white/10 rounded-lg p-1">
            <button
              onClick={() => setViewMode('calendar')}
              className={cn(
                'p-2 rounded',
                viewMode === 'calendar' ? 'bg-white/10 text-white' : 'text-text-muted'
              )}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                'p-2 rounded',
                viewMode === 'list' ? 'bg-white/10 text-white' : 'text-text-muted'
              )}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Calendar Grid */}
        <div className="lg:col-span-3">
          <Card className="p-4">
            {loading ? (
              <Skeleton className="h-96" />
            ) : (
              <>
                {/* Days of week header */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {DAYS_OF_WEEK.map((day) => (
                    <div
                      key={day}
                      className="p-2 text-center text-sm font-medium text-text-muted"
                    >
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar days */}
                <div className="grid grid-cols-7 gap-1">
                  {getDaysInMonth().map((day, index) => {
                    if (day === null) {
                      return <div key={`empty-${index}`} className="p-2 h-24" />;
                    }

                    const dayEvents = getEventsForDay(day);

                    return (
                      <button
                        key={day}
                        onClick={() => setSelectedDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day))}
                        className={cn(
                          'p-2 h-24 rounded-lg border text-left transition-colors overflow-hidden',
                          isToday(day)
                            ? 'border-gold bg-gold/5'
                            : isSelected(day)
                            ? 'border-white/20 bg-white/5'
                            : 'border-transparent hover:bg-white/5'
                        )}
                      >
                        <span
                          className={cn(
                            'text-sm font-medium',
                            isToday(day) ? 'text-gold' : 'text-white'
                          )}
                        >
                          {day}
                        </span>
                        <div className="mt-1 space-y-1">
                          {dayEvents.slice(0, 2).map((event) => (
                            <div
                              key={event.id}
                              className={cn(
                                'text-xs px-1 py-0.5 rounded truncate',
                                EVENT_TYPE_COLORS[event.event_type]
                              )}
                            >
                              {event.title}
                            </div>
                          ))}
                          {dayEvents.length > 2 && (
                            <div className="text-xs text-text-muted">
                              +{dayEvents.length - 2} ещё
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </Card>
        </div>

        {/* Selected Day Events */}
        <div className="space-y-4">
          <Card className="p-4">
            <h3 className="font-medium text-white mb-4">
              {selectedDate?.toLocaleDateString('ru-RU', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })}
            </h3>

            {selectedDayEvents.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="w-10 h-10 text-text-muted mx-auto mb-3" />
                <p className="text-text-muted">Нет событий</p>
                <Button variant="outline" size="sm" className="mt-3">
                  <Plus className="w-4 h-4 mr-2" />
                  Добавить
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {selectedDayEvents.map((event) => (
                  <div
                    key={event.id}
                    className="p-3 rounded-lg bg-surface hover:bg-white/5 transition-colors cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <Badge className={EVENT_TYPE_COLORS[event.event_type]}>
                        {EVENT_TYPE_LABELS[event.event_type]}
                      </Badge>
                      {event.start_time && (
                        <span className="text-sm text-text-muted">
                          {formatTime(event.start_time)}
                        </span>
                      )}
                    </div>
                    <h4 className="font-medium text-white mb-1">{event.title}</h4>
                    {event.location && (
                      <div className="flex items-center gap-1 text-sm text-text-muted">
                        <MapPin className="w-3 h-3" />
                        {event.location}
                      </div>
                    )}
                    {event.duration_minutes && (
                      <div className="flex items-center gap-1 text-sm text-text-muted mt-1">
                        <Clock className="w-3 h-3" />
                        {event.duration_minutes} мин
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

export default SchedulePage;
