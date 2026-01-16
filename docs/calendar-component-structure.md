# Calendar Component Structure

## Component Hierarchy

```
SchedulePage
├── Hero Section (with golden blur effect)
│   ├── Title & Description
│   └── Action Buttons (Refresh, Add Event)
│
├── Error Alert (conditional)
│
├── CalendarView ⭐ [NEW COMPONENT]
│   ├── Custom Toolbar
│   │   ├── Navigation Controls (◀ Today ▶)
│   │   ├── Date Label
│   │   └── View Switcher (Month | Week | Day)
│   │
│   ├── Calendar Grid (react-big-calendar)
│   │   ├── Month View
│   │   │   ├── Day Headers
│   │   │   ├── Date Cells
│   │   │   └── Event Items (color-coded)
│   │   │
│   │   ├── Week View
│   │   │   ├── Time Gutter (hours)
│   │   │   ├── Day Columns
│   │   │   ├── Current Time Indicator
│   │   │   └── Event Blocks
│   │   │
│   │   └── Day View
│   │       ├── Time Slots (30min intervals)
│   │       └── Event Details
│   │
│   └── Event Overlays
│       └── "Show More" Popup
│
└── Selected Event Details Panel (conditional)
    ├── Event Header (title, type badge)
    ├── Description
    ├── Date & Time Info
    ├── Venue Info
    └── Participants List
```

## Data Flow

```
┌─────────────────┐
│  SchedulePage   │
│   (Container)   │
└────────┬────────┘
         │
         │ loadEvents()
         ↓
┌─────────────────────────────┐
│  scheduleService            │
│  .getEventsForPeriod()      │
└────────┬────────────────────┘
         │
         │ API Call
         ↓
┌─────────────────────────────┐
│  Backend API                │
│  GET /api/v1/schedule       │
└────────┬────────────────────┘
         │
         │ ScheduleEvent[]
         ↓
┌─────────────────────────────┐
│  CalendarView               │
│  (Presentation)             │
└────────┬────────────────────┘
         │
         │ Transform to CalendarEvent
         ↓
┌─────────────────────────────┐
│  react-big-calendar         │
│  (External Library)         │
└─────────────────────────────┘
```

## Event Handlers

```
User Interaction → Handler → Action

Click Event
  └─→ onSelectEvent(event)
      └─→ setSelectedEvent(event)
          └─→ Show event details panel

Click Empty Slot
  └─→ onSelectSlot({ start, end })
      └─→ Open create event modal (TODO)

Navigate Date
  └─→ onNavigate(date)
      └─→ setCurrentDate(date)
          └─→ loadEvents() with new range

Switch View
  └─→ setView('month' | 'week' | 'day')
      └─→ React Big Calendar updates display
```

## File Organization

```
frontend/src/
│
├── components/schedule/        [NEW DIRECTORY]
│   ├── CalendarView.tsx         ⭐ Main calendar component (330 lines)
│   ├── index.ts                 Export file
│   └── README.md                Component documentation
│
├── pages/schedule/
│   └── SchedulePage.tsx         Updated to use CalendarView
│
├── services/
│   └── schedule_service.ts      API service (existing)
│
├── styles/                      [NEW DIRECTORY]
│   └── calendar.css             ⭐ Dark theme styles (350 lines)
│
└── types/
    └── schedule_types.ts        Type definitions (existing)
```

## CSS Class Structure

```
.calendar-container                    [Dark background wrapper]
  └── .rbc-calendar                    [react-big-calendar root]
      ├── .rbc-toolbar                 [Hidden - Custom toolbar used]
      │
      ├── .rbc-month-view              [Month view container]
      │   ├── .rbc-header              [Day name headers]
      │   ├── .rbc-month-row           [Week rows]
      │   └── .rbc-day-bg              [Individual date cells]
      │       ├── .rbc-today           [Today highlight - gold]
      │       ├── .rbc-off-range       [Other month dates - muted]
      │       └── .rbc-event           [Event items - color coded]
      │
      ├── .rbc-time-view               [Week/Day view container]
      │   ├── .rbc-time-header         [Top date headers]
      │   ├── .rbc-time-gutter         [Left time column]
      │   ├── .rbc-time-content        [Main schedule area]
      │   │   ├── .rbc-timeslot-group  [Hour blocks]
      │   │   └── .rbc-event           [Event blocks]
      │   └── .rbc-current-time-indicator [Gold line for now]
      │
      └── .rbc-overlay                 [Popup for "Show More"]
          └── .rbc-overlay-header      [Popup title]
```

## State Management

```typescript
// SchedulePage.tsx
const [events, setEvents] = useState<ScheduleEvent[]>([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);
const [currentDate, setCurrentDate] = useState(new Date());
const [selectedEvent, setSelectedEvent] = useState<ScheduleEvent | null>(null);

// CalendarView.tsx
const [view, setView] = useState<View>(Views.MONTH);
const [date, setDate] = useState(new Date());

// Memoized data
const calendarEvents = useMemo(() =>
  transformEvents(events),
  [events]
);
```

## Type Definitions

```typescript
// Main event type from backend
interface ScheduleEvent {
  id: number;
  title: string;
  eventType: EventType;
  eventDate: string;        // ISO date string
  startTime: string;        // HH:MM:SS
  endTime: string | null;
  venue: string | null;
  performanceTitle: string | null;
  participants: EventParticipant[];
}

// Transformed for calendar library
interface CalendarEvent {
  id: number;
  title: string;
  start: Date;              // JavaScript Date
  end: Date;                // JavaScript Date
  resource: ScheduleEvent;  // Reference to original
}

// Event types
type EventType =
  | 'performance'
  | 'rehearsal'
  | 'tech_rehearsal'
  | 'dress_rehearsal'
  | 'meeting'
  | 'maintenance'
  | 'other';
```

## Styling Layers

```
1. Base Styles (react-big-calendar)
   └── node_modules/react-big-calendar/lib/css/react-big-calendar.css

2. Theme Overrides (custom)
   └── src/styles/calendar.css
       ├── Dark backgrounds
       ├── Golden accents
       ├── Event colors
       └── Responsive adjustments

3. Inline Styles (dynamic)
   └── eventStyleGetter() in CalendarView.tsx
       └── Background & border colors per event type

4. Tailwind Utilities (layout)
   └── Container, spacing, responsiveness
```

## Accessibility Tree

```
<main>                              [Main content]
  <div role="region">               [Calendar section]
    <nav>                           [Custom toolbar]
      <button aria-label="Previous">[← Navigation]
      <button>Today</button>
      <button aria-label="Next">   [→ Navigation]
      <div role="radiogroup">      [View switcher]
        <button role="radio">Month</button>
        <button role="radio">Week</button>
        <button role="radio">Day</button>
      </div>
    </nav>

    <div role="grid">               [Calendar grid]
      <div role="row">              [Week row]
        <div role="gridcell"        [Date cell]
             aria-label="Date">
          <button>                  [Event]
            <span>Event Title</span>
          </button>
        </div>
      </div>
    </div>
  </div>

  <aside>                           [Event details panel]
    <article>
      <h2>Event Title</h2>
      <p>Description...</p>
    </article>
  </aside>
</main>
```

## Performance Optimization Points

```
1. Memoization
   └── useMemo() for event transformation
   └── useCallback() for all handlers
   └── React.memo() candidates (future)

2. Data Loading
   └── Limited date range (±2 months)
   └── Pagination (limit: 100 events)
   └── Lazy load on navigation

3. Rendering
   └── Virtual scrolling (built into library)
   └── Event truncation in month view
   └── Conditional rendering of details panel

4. CSS
   └── Hardware acceleration (transform, opacity)
   └── will-change for animations
   └── Efficient selectors

5. Bundle
   └── Code splitting by route
   └── Tree shaking unused library features
   └── CSS minification
```

## Integration Points

```
┌──────────────────────────────────────┐
│         SchedulePage                 │
│  ┌────────────────────────────────┐  │
│  │      CalendarView              │  │
│  │                                │  │
│  │  Props:                        │  │
│  │  • events[] ←─────────────────┼──┼─── scheduleService API
│  │  • loading ←──────────────────┼──┼─── Loading state
│  │  • onSelectEvent() ───────────┼──┼──→ Show details panel
│  │  • onSelectSlot() ────────────┼──┼──→ Create event modal (TODO)
│  │  • onNavigate() ──────────────┼──┼──→ Load new date range
│  │                                │  │
│  └────────────────────────────────┘  │
│                                      │
│  Event Details Panel ←───────────────┼─── selectedEvent state
│                                      │
└──────────────────────────────────────┘
```

## Color Mapping Reference

```typescript
// Event type → Color
const EVENT_COLORS = {
  performance: {
    bg: 'rgba(139, 92, 246, 0.15)',    // Purple with transparency
    border: '#8B5CF6',                  // Solid purple
    text: '#A78BFA'                     // Light purple
  },
  rehearsal: {
    bg: 'rgba(59, 130, 246, 0.15)',    // Blue with transparency
    border: '#3B82F6',
    text: '#60A5FA'
  },
  // ... etc for all event types
};

// Applied dynamically in eventStyleGetter()
```

## Responsive Breakpoints

```css
/* Mobile First Approach */

/* Base: 320px+ (mobile) */
- Single column layout
- Simplified month view
- Larger touch targets

/* Tablet: 768px+ */
@media (max-width: 768px) {
  - Stacked toolbar
  - Smaller fonts
  - Adjusted spacing
}

/* Desktop: 1024px+ */
- Full calendar width
- Side event details
- Comfortable spacing

/* Large: 1440px+ */
- Maximum width constraint
- Optimal readability
```

## Component Lifecycle

```
1. Mount
   ├── Initialize state (view=MONTH, date=today)
   └── Transform events → calendar format

2. User Navigates
   ├── onNavigate(newDate) called
   ├── Parent updates currentDate
   ├── Parent calls loadEvents(newDate)
   └── New events trigger re-render

3. User Selects Event
   ├── onSelectEvent(event) called
   ├── Parent sets selectedEvent
   └── Details panel appears

4. User Changes View
   ├── View button clicked
   ├── setView(newView) updates state
   └── Calendar re-renders in new view

5. Unmount
   └── Cleanup (none needed - no subscriptions)
```

---

This structure provides a clear overview of how all components fit together and interact.
