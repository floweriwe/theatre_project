# PDF Preview Components - Visual Guide

## Component Tree

```
PDFPreviewModal
│
├─ Modal (from @/components/ui/Modal)
│  ├─ Overlay (dark backdrop with blur)
│  ├─ Header
│  │  ├─ Title: "Предпросмотр документа"
│  │  ├─ Subtitle: {fileName}
│  │  └─ Close Button (X)
│  │
│  └─ Body
│     └─ PDFViewer
│        │
│        ├─ Controls Bar
│        │  ├─ Page Navigation Section
│        │  │  ├─ Previous Button (<)
│        │  │  ├─ Page Counter ("Страница 1 из 10")
│        │  │  └─ Next Button (>)
│        │  │
│        │  └─ Zoom Controls Section
│        │     ├─ Zoom Out Button (-)
│        │     ├─ Scale Display ("100%")
│        │     ├─ Zoom In Button (+)
│        │     └─ Fit to Width Button
│        │
│        └─ PDF Content Area
│           ├─ Document Component (react-pdf)
│           │  └─ Page Component
│           │     ├─ Canvas Layer (PDF rendering)
│           │     ├─ Text Layer (selection)
│           │     └─ Annotation Layer (links)
│           │
│           ├─ Loading State
│           │  ├─ Gold Spinner
│           │  └─ "Загрузка PDF..." text
│           │
│           └─ Error State
│              ├─ Error Message
│              └─ File Name
```

## State Management

```typescript
PDFViewer {
  // State
  numPages: number = 0
  pageNumber: number = 1
  scale: number = 1.0
  loading: boolean = true
  error: string | null = null
  containerWidth: number = 800

  // Handlers
  onDocumentLoadSuccess() -> sets numPages, resets to page 1
  onDocumentLoadError() -> sets error message
  goToPrevPage() -> pageNumber - 1 (min: 1)
  goToNextPage() -> pageNumber + 1 (max: numPages)
  zoomIn() -> scale + 0.2 (max: 3.0)
  zoomOut() -> scale - 0.2 (min: 0.5)
  fitToWidth() -> scale = 1.0

  // Effects
  useEffect() -> updates containerWidth on resize
}
```

## Props Flow

```
DocumentViewPage
│
├─ document: Document (from API)
├─ showPDFPreview: boolean (state)
│
└─ PDFPreviewModal
   ├─ isOpen={showPDFPreview}
   ├─ onClose={() => setShowPDFPreview(false)}
   ├─ fileUrl={documentService.getDownloadUrl(document.id)}
   └─ fileName={document.fileName}
      │
      └─ PDFViewer
         ├─ fileUrl={fileUrl}
         └─ fileName={fileName}
```

## UI States

### Loading State
```
┌─────────────────────────────────────────┐
│ Controls Bar                            │
│ ┌─────┐  Загрузка...  ┌─────┐         │
│ │  <  │               │  >  │ [disabled]│
│ └─────┘               └─────┘          │
│                                         │
│        Zoom Controls [disabled]         │
└─────────────────────────────────────────┘
┌─────────────────────────────────────────┐
│                                         │
│           ◌  Загрузка PDF...           │
│                                         │
└─────────────────────────────────────────┘
```

### Loaded State (Page 1/5, 100%)
```
┌─────────────────────────────────────────┐
│ ┌─────┐  Страница 1 из 5  ┌─────┐     │
│ │  <  │                    │  >  │      │
│ └─────┘                    └─────┘      │
│                                         │
│ ┌───┐  100%  ┌───┐  │  ┌──────┐       │
│ │ - │        │ + │     │  ⛶   │       │
│ └───┘        └───┘     └──────┘        │
└─────────────────────────────────────────┘
┌─────────────────────────────────────────┐
│                                         │
│     ┌─────────────────────────┐        │
│     │                         │        │
│     │    PDF Page Content     │        │
│     │                         │        │
│     │                         │        │
│     └─────────────────────────┘        │
│                                         │
└─────────────────────────────────────────┘
```

### Error State
```
┌─────────────────────────────────────────┐
│ Controls Bar [disabled]                 │
└─────────────────────────────────────────┘
┌─────────────────────────────────────────┐
│                                         │
│     ⚠  Не удалось загрузить PDF файл   │
│            document.pdf                 │
│                                         │
└─────────────────────────────────────────┘
```

## Color Palette

### Control Bar
- Background: `#1A2332`
- Border: `#D4A574` at 20% opacity
- Text: `#F1F5F9` (primary), `#94A3B8` (secondary)
- Accent: `#D4A574` (gold)

### Content Area
- Background: `#0F1419`
- Border: `#D4A574` at 20% opacity

### Buttons
- Text: `#FFFFFF`
- Hover: `#243044`
- Disabled: 50% opacity

### Spinner
- Color: `#D4A574` (gold)

## Responsive Behavior

### Desktop (> 1024px)
- Modal: max-width 1280px (size="full")
- PDF: scales to container width
- Controls: full layout

### Tablet (768px - 1024px)
- Modal: max-width 768px
- PDF: scales down proportionally
- Controls: compact layout

### Mobile (< 768px)
- Modal: full screen
- PDF: fits to screen width
- Controls: stacked layout
- Touch-friendly button sizes

## Keyboard Shortcuts (Future)

Potential keyboard shortcuts to implement:

- `Left Arrow` - Previous page
- `Right Arrow` - Next page
- `+` or `=` - Zoom in
- `-` - Zoom out
- `0` - Fit to width
- `Esc` - Close modal
- `f` - Fullscreen
- `Ctrl+F` - Search in PDF

## Accessibility Labels

```tsx
// Buttons
<Button aria-label="Предыдущая страница">
<Button aria-label="Следующая страница">
<Button aria-label="Увеличить масштаб">
<Button aria-label="Уменьшить масштаб">
<Button aria-label="По ширине окна">

// Modal
<Modal role="dialog" aria-modal="true" aria-labelledby="modal-title">

// PDF Content
<Document aria-label={`PDF документ: ${fileName}`}>
<Page aria-label={`Страница ${pageNumber} из ${numPages}`}>
```

## CSS Classes

### Custom Classes
```css
.react-pdf__Document      /* Container */
.react-pdf__Page          /* Page wrapper */
.react-pdf__Page__canvas  /* Canvas element */
.react-pdf__Page__textContent     /* Text layer */
.react-pdf__Page__annotations     /* Annotation layer */
```

### Tailwind Utility Classes
```tsx
// Control bar
className="flex items-center justify-between gap-4 mb-4 p-4
           bg-[#1A2332] rounded-lg border border-[#D4A574]/20"

// Buttons
className="text-white hover:bg-[#243044]"

// Text
className="text-sm text-[#F1F5F9]"
className="font-medium text-[#D4A574]"

// Content area
className="flex-1 overflow-auto bg-[#0F1419] rounded-lg
           border border-[#D4A574]/20"
```

## Performance Metrics

Expected performance:
- Initial load: 500-1500ms (depending on PDF size)
- Page navigation: <100ms
- Zoom operation: <50ms
- Container resize: <16ms (60fps)

## Browser DevTools Tips

### Debugging PDF Load Issues
```javascript
// In browser console
window.pdfjs = require('pdfjs-dist');
console.log('PDF.js version:', window.pdfjs.version);

// Check worker status
console.log('Worker source:', window.pdfjs.GlobalWorkerOptions.workerSrc);
```

### Performance Profiling
1. Open DevTools Performance tab
2. Start recording
3. Open PDF preview
4. Navigate pages
5. Zoom in/out
6. Stop recording
7. Analyze rendering times

### Network Analysis
1. Open DevTools Network tab
2. Filter: All or JS
3. Look for:
   - PDF file download (from presigned URL)
   - Worker script load (from unpkg.com)
   - Font files (if PDF uses custom fonts)

---

**Component Architecture**: React + TypeScript
**Styling**: Tailwind CSS + Custom CSS
**PDF Rendering**: react-pdf + PDF.js
**State Management**: React useState + useEffect
