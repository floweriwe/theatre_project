# Schedule Calendar Components

Advanced calendar components for the Theatre Management System, featuring Month, Week, and Day views with ArtMechanics aesthetic.

## Components

### CalendarView

Main calendar component using `react-big-calendar` with dark theatre theme and golden accents.

**Features:**
- Three view modes: Month, Week, Day
- Event color coding by type (performance, rehearsal, meeting, etc.)
- Drag-to-select time slots for creating events
- Click events to view details
- Russian localization with date-fns
- Responsive design
- Custom dark theme styling

**Usage:**

```tsx
import { CalendarView } from '@/components/schedule';

function SchedulePage() {
  const [events, setEvents] = useState<ScheduleEvent[]>([]);

  const handleSelectEvent = (event: ScheduleEvent) => {
    // Open event detail modal or navigate to event page
    console.log('Selected event:', event);
  };

  const handleSelectSlot = (slotInfo: { start: Date; end: Date }) => {
    // Open create event modal with pre-filled dates
    console.log('Selected slot:', slotInfo);
  };

  const handleNavigate = (date: Date) => {
    // Reload events for the new date range
    loadEvents(date);
  };

  return (
    <CalendarView
      events={events}
      onSelectEvent={handleSelectEvent}
      onSelectSlot={handleSelectSlot}
      onNavigate={handleNavigate}
      loading={false}
    />
  );
}
```

**Props:**

| Prop | Type | Description |
|------|------|-------------|
| `events` | `ScheduleEvent[]` | Array of events to display |
| `onSelectEvent` | `(event: ScheduleEvent) => void` | Callback when event is clicked |
| `onSelectSlot` | `(slotInfo) => void` | Callback when empty time slot is selected |
| `onNavigate` | `(date: Date) => void` | Callback when calendar navigates to new date |
| `loading` | `boolean` | Show loading state |

## Event Type Colors

Events are color-coded by type following the design system:

- **Performance** (`purple`): Main theatre performances
- **Rehearsal** (`blue`): Regular rehearsals
- **Tech Rehearsal** (`orange`): Technical run-throughs
- **Dress Rehearsal** (`pink`): Final dress rehearsals
- **Meeting** (`green`): Staff meetings and gatherings
- **Maintenance** (`amber`): Equipment and facility maintenance
- **Other** (`gray`): Miscellaneous events

## Design System

The calendar follows the Theatre Dark Theme:

- **Background**: `#0F1419` (primary), `#1A2332` (cards)
- **Accent**: `#D4A574` (gold) - for today's date and highlights
- **Text**: `#F1F5F9` (primary), `#94A3B8` (secondary)
- **Blur Effect**: `amber-500/10` for schedule module

## Styling

Custom styles are defined in `@/styles/calendar.css`. The CSS overrides react-big-calendar defaults to match the dark theatre aesthetic.

**Key style features:**
- Dark backgrounds with subtle borders
- Golden accent for current day
- Smooth hover transitions
- Custom scrollbars
- Proper event spacing and truncation
- Responsive design for mobile

## Integration with Backend

The component expects events in the `ScheduleEvent` format from the API:

```typescript
interface ScheduleEvent {
  id: number;
  title: string;
  eventType: EventType;
  eventDate: string; // ISO date string
  startTime: string; // HH:MM:SS format
  endTime: string | null;
  venue: string | null;
  performanceTitle: string | null;
  // ... other fields
}
```

The component automatically converts these to the calendar's internal format with proper Date objects.

## Accessibility

- Keyboard navigation supported
- Focus indicators on all interactive elements
- ARIA labels for buttons
- Screen reader friendly

## Performance

- Memoized callbacks to prevent unnecessary re-renders
- Efficient event transformation with `useMemo`
- Only renders visible date ranges
- Smooth animations with CSS transitions

## Future Enhancements

- [ ] Drag and drop to reschedule events
- [ ] Event resizing
- [ ] Multi-event selection
- [ ] Export to calendar formats (iCal, etc.)
- [ ] Event conflict detection
- [ ] Recurring events support
- [ ] Print view
