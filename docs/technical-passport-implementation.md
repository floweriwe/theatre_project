# Technical Passport Accordion Implementation

## Overview
Implemented a collapsible accordion UI for the Technical Passport feature in the Performances module. The accordion displays four department sections (Scenery, Lighting, Sound, Costume) with independent expand/collapse functionality and editable text fields.

## Files Created

### 1. Accordion Component (`frontend/src/components/ui/Accordion.tsx`)
Reusable accordion component with the following features:
- **Multiple sections open simultaneously** - uses Set to track open items
- **Smooth animations** - chevron rotation and fade-in effects
- **Dark theme styling** - matches theatre design system (#1A2332 background, #D4A574 gold accent)
- **Accessibility** - ARIA attributes and keyboard support
- **Context API** - manages accordion state across nested components

**Exported Components:**
- `Accordion` - Root container
- `AccordionItem` - Individual section wrapper
- `AccordionHeader` - Clickable header with icon and chevron
- `AccordionContent` - Collapsible content area

### 2. TechnicalPassport Component (`frontend/src/components/features/performances/TechnicalPassport.tsx`)
Performance-specific accordion implementation:
- **Four sections**: Scenery (Box icon), Lighting (Lightbulb), Sound (Volume2), Costume (Shirt)
- **Editable mode** - textarea with auto-save on blur
- **Read-only mode** - displays formatted content
- **Purple blur effect** - `bg-purple-500/5 blur-3xl` for module identity
- **Error handling** - displays alerts for failed API calls
- **Loading states** - skeleton loaders during data fetch

**Props:**
```typescript
interface TechnicalPassportProps {
  performanceId: number;
  editable?: boolean; // Toggle edit mode
  onSectionUpdate?: (sectionId: number, content: string) => void;
}
```

## Files Modified

### 3. UI Index (`frontend/src/components/ui/index.ts`)
Added accordion component exports:
```typescript
export {
  Accordion,
  AccordionItem,
  AccordionHeader,
  AccordionContent
} from './Accordion';
```

### 4. Performance Features Index (`frontend/src/components/features/performances/index.ts`)
Exported TechnicalPassport component:
```typescript
export { TechnicalPassport } from './TechnicalPassport';
```

### 5. PerformanceViewPage (`frontend/src/pages/performances/PerformanceViewPage.tsx`)
Replaced old sections display with new TechnicalPassport component:
- Removed old tabs-based section display
- Added TechnicalPassport card with editable=false
- Cleaned up unused imports (FileText, Tabs components, SECTION_ICONS)

**Before:**
```tsx
<Card className="p-6">
  <h2>Паспорт спектакля</h2>
  <Tabs>...</Tabs>
</Card>
```

**After:**
```tsx
<Card className="p-6">
  <h2>Технический паспорт</h2>
  <TechnicalPassport performanceId={performance.id} editable={false} />
</Card>
```

## Design System Compliance

### Colors
- Background: `#1A2332` (cards), `#0F1419` (textarea)
- Accent: `#D4A574` (gold) for icons and borders
- Text: `#F1F5F9` (primary), `#94A3B8` (secondary), `#64748B` (muted)
- Module blur: `purple-500/5` for performance module identity

### Fonts
- Headers: `font-['Inter']` medium weight
- Content: `font-['Inter']` for body text
- Placeholders: Muted color with italic style

### Spacing & Borders
- Padding: `px-6 py-4` for headers, `px-6 pb-6 pt-2` for content
- Border radius: `rounded-xl` (12px)
- Border: `border-[#D4A574]/10` for subtle gold accent

### Animations
- Chevron rotation: `transition-transform duration-200`
- Content reveal: `animate-fade-in` (0.2s ease-out)
- Hover effects: `hover:bg-[#243044]/50`

## API Integration

### Endpoints Used
- `GET /api/v1/performances/{id}/sections` - Load all sections
- `PATCH /api/v1/performances/sections/{sectionId}` - Update section content

### Data Flow
1. Component loads → fetch sections via `performanceService.getSections()`
2. User edits textarea → update local state (`editingContent`)
3. User blurs field → auto-save via `performanceService.updateSection()`
4. Success → update UI state, no reload needed
5. Error → restore previous value, log to console

## Accessibility Features
- **Semantic HTML** - `<button>` for headers, proper heading hierarchy
- **ARIA attributes** - `aria-expanded`, `role="region"`, `aria-labelledby`
- **Keyboard navigation** - buttons are focusable, Enter/Space to toggle
- **Focus states** - visible focus rings on interactive elements
- **Screen reader friendly** - descriptive labels and status indicators

## Performance Optimizations
- **Lazy rendering** - content only renders when section is open
- **Memoized state** - uses Set for O(1) lookup of open items
- **Debounced saves** - only saves on blur, not on every keystroke
- **Optimistic updates** - UI updates immediately, reverts on error

## Testing Checklist

### Visual Testing
- [ ] Accordion sections expand/collapse smoothly
- [ ] Gold accent colors match design system
- [ ] Purple blur effect visible on background
- [ ] Icons render correctly for all sections
- [ ] Skeleton loaders display during initial load
- [ ] Error alerts show red styling

### Functional Testing
- [ ] Multiple sections can be open simultaneously
- [ ] Textarea saves content on blur (editable mode)
- [ ] Read-only mode displays formatted content
- [ ] Empty sections show placeholder text
- [ ] API errors restore previous content
- [ ] Performance detail page displays passport correctly

### Responsive Testing
- [ ] Layout works on mobile (320px+)
- [ ] Textarea expands to full width
- [ ] Icons don't overlap text on small screens
- [ ] Touch interactions work on mobile devices

### Accessibility Testing
- [ ] Keyboard navigation works (Tab, Enter, Space)
- [ ] Screen reader announces section states
- [ ] Focus indicators are visible
- [ ] Color contrast meets WCAG AA standards

## Known Issues / Future Enhancements

### Current Limitations
- No rich text editing (plain textarea only)
- No section reordering in UI
- No versioning/history for content changes
- No validation for content length

### Future Improvements
1. **Rich text editor** - Replace textarea with TipTap or similar
2. **Drag-and-drop reordering** - Allow users to change section order
3. **Version history** - Show edit timestamps and previous versions
4. **Attachments** - Allow file uploads per section
5. **Collaborative editing** - Real-time multi-user editing
6. **Templates** - Pre-filled content for common performance types
7. **Print view** - Formatted PDF export of technical passport

## Usage Example

```tsx
// Read-only view (default)
<TechnicalPassport performanceId={123} />

// Editable mode
<TechnicalPassport 
  performanceId={123} 
  editable={true}
  onSectionUpdate={(sectionId, content) => {
    console.log(`Section ${sectionId} updated`);
  }}
/>
```

## Browser Support
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Dependencies
- React 18.x
- lucide-react (icons)
- Tailwind CSS 3.x
- TypeScript 5.x

## Related Files
- Types: `frontend/src/types/performance_types.ts`
- Service: `frontend/src/services/performance_service.ts`
- Utils: `frontend/src/utils/helpers.ts` (cn function)
- Config: `frontend/tailwind.config.js` (animations)

## Documentation
- Design system: `.claude/memory-bank/04_DESIGN_SYSTEM.md`
- API spec: `.claude/memory-bank/06_API_SPECIFICATION.md`
- Database schema: `.claude/memory-bank/03_DATABASE.md`
