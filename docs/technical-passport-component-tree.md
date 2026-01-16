# Technical Passport Component Tree

## Component Hierarchy

```
PerformanceViewPage
│
├── Card (Main Content)
│   │
│   ├── Card Header
│   │   └── "Технический паспорт"
│   │
│   └── TechnicalPassport
│       │
│       ├── Purple blur effect (bg-purple-500/5)
│       │
│       └── Accordion (defaultValue: ['scenery'])
│           │
│           ├── AccordionItem (value: 'scenery')
│           │   ├── AccordionHeader
│           │   │   ├── Box icon (gold)
│           │   │   ├── "Декорации"
│           │   │   └── ChevronDown (rotates)
│           │   └── AccordionContent
│           │       └── textarea / read-only div
│           │
│           ├── AccordionItem (value: 'lighting')
│           │   ├── AccordionHeader
│           │   │   ├── Lightbulb icon (gold)
│           │   │   ├── "Свет"
│           │   │   └── ChevronDown
│           │   └── AccordionContent
│           │       └── textarea / read-only div
│           │
│           ├── AccordionItem (value: 'sound')
│           │   ├── AccordionHeader
│           │   │   ├── Volume2 icon (gold)
│           │   │   ├── "Звук"
│           │   │   └── ChevronDown
│           │   └── AccordionContent
│           │       └── textarea / read-only div
│           │
│           └── AccordionItem (value: 'costumes')
│               ├── AccordionHeader
│               │   ├── Shirt icon (gold)
│               │   ├── "Костюмы"
│               │   └── ChevronDown
│               └── AccordionContent
│                   └── textarea / read-only div
```

## State Management

### TechnicalPassport Component State
```typescript
{
  sections: PerformanceSection[],        // Loaded from API
  loading: boolean,                      // True during fetch
  error: string | null,                  // API error message
  editingContent: Record<number, string> // Local edits by section ID
}
```

### Accordion Component State
```typescript
{
  openItems: Set<string>,  // Set of open section values: ['scenery', 'lighting']
  variant: 'default' | 'ghost'
}
```

## Data Flow

### Read-Only Mode (editable=false)
```
1. Component Mount
   ↓
2. performanceService.getSections(performanceId)
   ↓
3. Display sections with content or "Содержимое не заполнено"
   ↓
4. User clicks AccordionHeader
   ↓
5. Accordion toggles openItems Set
   ↓
6. Content animates in/out
```

### Editable Mode (editable=true)
```
1. Component Mount
   ↓
2. performanceService.getSections(performanceId)
   ↓
3. Initialize editingContent state
   ↓
4. User clicks AccordionHeader → section expands
   ↓
5. User types in textarea
   ↓
6. onChange updates editingContent[sectionId]
   ↓
7. User blurs textarea
   ↓
8. onBlur triggers performanceService.updateSection()
   ↓
9. Success: Update sections state
   Error: Restore previous content
   ↓
10. Optional: Trigger onSectionUpdate callback
```

## Styling Layers

### Dark Theme Foundation
```css
Background Primary: #0F1419
Background Card:    #1A2332
Background Hover:   #243044
```

### Gold Accents
```css
Icon Color:         #D4A574 (text-[#D4A574])
Border:             #D4A574/10 (border-[#D4A574]/10)
Border Focus:       #D4A574 (border-[#D4A574])
Ring Focus:         #D4A574/50 (ring-[#D4A574]/50)
```

### Text Colors
```css
Primary Text:       #F1F5F9 (text-[#F1F5F9])
Secondary Text:     #94A3B8 (text-[#94A3B8])
Muted Text:         #64748B (text-[#64748B])
Placeholder:        #64748B (placeholder:text-[#64748B])
```

### Module Identity
```css
Purple Blur:        bg-purple-500/5 blur-3xl
```

## Responsive Breakpoints

### Mobile (320px - 640px)
- Full width accordion items
- Stacked layout
- Touch-friendly tap targets (44px min)
- Icons remain visible

### Tablet (641px - 1024px)
- Same as mobile, more padding
- Textarea min-height increases

### Desktop (1025px+)
- Max-width constrained by parent Card
- Hover effects enabled
- Larger text size

## Accessibility Attributes

### AccordionHeader
```html
<button
  type="button"
  aria-expanded="true|false"
  onClick={toggleItem}
>
```

### AccordionContent
```html
<div
  role="region"
  aria-labelledby="accordion-header-{value}"
>
```

### Textarea (Editable Mode)
```html
<textarea
  aria-label="Содержание секции"
  placeholder="Описание..."
  rows={6}
>
```

## Error Handling Scenarios

### 1. Failed to Load Sections
```tsx
<div className="flex items-center gap-3 p-4 bg-red-500/10">
  <AlertCircle />
  <span>Не удалось загрузить разделы паспорта</span>
</div>
```

### 2. Section Not Created
```tsx
<p className="text-[#64748B] italic">
  Раздел не создан. Обратитесь к администратору.
</p>
```

### 3. Failed to Save
```typescript
catch (err) {
  console.error('Failed to update section:', err);
  // Restore previous value
  setEditingContent(prev => ({
    ...prev,
    [sectionId]: section.content || ''
  }));
}
```

## Animation Timing

```css
Chevron Rotation:  200ms ease-in-out
Content Fade-in:   200ms ease-out
Hover Transition:  150ms ease-in-out
```

## File Sizes (Approximate)

```
Accordion.tsx:        ~7 KB (220 lines)
TechnicalPassport.tsx: ~7 KB (230 lines)
Total new code:        ~14 KB
```
