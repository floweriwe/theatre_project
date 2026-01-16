/**
 * Страница расписания — Modern Theatre Elegance v3
 *
 * Enhanced with CalendarView component supporting Month, Week, and Day views.
 */

import { useEffect, useState } from 'react';
import {
  Calendar,
  Plus,
  RefreshCw,
  MapPin,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Alert } from '@/components/ui/Alert';
import { cn } from '@/utils/helpers';
import { scheduleService } from '@/services/schedule_service';
import { CalendarView } from '@/components/schedule';
import type { ScheduleEvent, EventType } from '@/types/schedule_types';

const EVENT_TYPE_LABELS: Record<EventType, string> = {
  performance: 'Спектакль',
  rehearsal: 'Репетиция',
  tech_rehearsal: 'Техническая',
  dress_rehearsal: 'Генеральная',
  meeting: 'Собрание',
  maintenance: 'Техобслуживание',
  other: 'Другое',
};

const EVENT_TYPE_COLORS: Record<EventType, string> = {
  performance: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  rehearsal: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  tech_rehearsal: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  dress_rehearsal: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
  meeting: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  maintenance: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
  other: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
};

export function SchedulePage() {
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<ScheduleEvent | null>(null);

  useEffect(() => {
    loadEvents();
  }, [currentDate]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      setError(null);

      // Calculate date range: +/- 2 months for better navigation experience
      const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 2, 1);
      const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 3, 0);

      const data = await scheduleService.getEventsForPeriod({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });

      setEvents(data);
    } catch (err) {
      console.error('Failed to load events:', err);
      setError('Не удалось загрузить события расписания');
    } finally {
      setLoading(false);
    }
  };

  // Event handlers
  const handleSelectEvent = (event: ScheduleEvent) => {
    setSelectedEvent(event);
    console.log('Selected event:', event);
    // TODO: Open event detail modal or navigate to event details page
  };

  const handleSelectSlot = (slotInfo: { start: Date; end: Date }) => {
    console.log('Selected slot:', slotInfo);
    // TODO: Open create event modal with pre-filled date/time
  };

  const handleNavigate = (date: Date) => {
    setCurrentDate(date);
  };

  const formatTime = (timeString: string) => {
    return timeString.slice(0, 5);
  };

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-surface-light to-surface p-6 lg:p-8">
        {/* Golden blur effect - ArtMechanics style */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

        <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <p className="text-amber-400 text-sm flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4" />
              Планирование и расписание
            </p>
            <h1 className="text-2xl lg:text-3xl font-display font-bold text-white mb-2">
              Расписание театра
            </h1>
            <p className="text-text-secondary">
              Спектакли, репетиции и технические мероприятия. Месяц, неделя или день.
            </p>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={loadEvents} disabled={loading}>
              <RefreshCw className={cn("w-4 h-4 mr-2", loading && "animate-spin")} />
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

      {/* Calendar View */}
      <CalendarView
        events={events}
        onSelectEvent={handleSelectEvent}
        onSelectSlot={handleSelectSlot}
        onNavigate={handleNavigate}
        loading={loading}
      />

      {/* Selected Event Details (if any) */}
      {selectedEvent && (
        <Card className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <Badge className={EVENT_TYPE_COLORS[selectedEvent.eventType]}>
                {EVENT_TYPE_LABELS[selectedEvent.eventType]}
              </Badge>
              <h2 className="text-xl font-display font-semibold text-white mt-2">
                {selectedEvent.title}
              </h2>
            </div>
            <button
              onClick={() => setSelectedEvent(null)}
              className="text-text-muted hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>

          {selectedEvent.description && (
            <p className="text-text-secondary mb-4">{selectedEvent.description}</p>
          )}

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-text-muted">Дата</span>
              <p className="text-white font-medium">
                {new Date(selectedEvent.eventDate).toLocaleDateString('ru-RU', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
            </div>
            <div>
              <span className="text-text-muted">Время</span>
              <p className="text-white font-medium">
                {formatTime(selectedEvent.startTime)}
                {selectedEvent.endTime && ` — ${formatTime(selectedEvent.endTime)}`}
              </p>
            </div>
            {selectedEvent.venue && (
              <div>
                <span className="text-text-muted">Место</span>
                <p className="text-white font-medium flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  {selectedEvent.venue}
                </p>
              </div>
            )}
            {selectedEvent.performanceTitle && (
              <div>
                <span className="text-text-muted">Спектакль</span>
                <p className="text-white font-medium">{selectedEvent.performanceTitle}</p>
              </div>
            )}
          </div>

          {selectedEvent.participants && selectedEvent.participants.length > 0 && (
            <div className="mt-4">
              <h3 className="text-sm text-text-muted mb-2">
                Участники ({selectedEvent.participants.length})
              </h3>
              <div className="space-y-2">
                {selectedEvent.participants.map((participant) => (
                  <div key={participant.id} className="flex items-center justify-between text-sm">
                    <span className="text-white">{participant.userName || `User #${participant.userId}`}</span>
                    <Badge className="bg-white/5 text-text-secondary border-white/10">
                      {participant.role}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

export default SchedulePage;
