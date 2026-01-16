# Documents Components

PDF preview functionality for the Theatre Management System Documents module.

## Components

### PDFViewer
Main PDF viewer component with navigation and zoom controls.

**Features:**
- Page navigation (previous/next)
- Zoom controls (+/-, fit to width)
- Responsive sizing
- Loading states with gold spinner
- Error handling
- Dark theme styling matching theatre design system

**Props:**
```typescript
interface PDFViewerProps {
  fileUrl: string;      // Presigned URL or download URL
  fileName?: string;    // Optional filename for error display
}
```

**Usage:**
```tsx
import { PDFViewer } from '@/components/documents/PDFViewer';

<PDFViewer
  fileUrl={documentService.getDownloadUrl(documentId)}
  fileName="document.pdf"
/>
```

### PDFPreviewModal
Modal wrapper for PDFViewer component.

**Props:**
```typescript
interface PDFPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileUrl: string;
  fileName: string;
}
```

**Usage:**
```tsx
import { PDFPreviewModal } from '@/components/documents/PDFPreviewModal';

const [showPreview, setShowPreview] = useState(false);

<PDFPreviewModal
  isOpen={showPreview}
  onClose={() => setShowPreview(false)}
  fileUrl={documentService.getDownloadUrl(document.id)}
  fileName={document.fileName}
/>
```

## Design System

### Colors
- Background: `#0F1419` (primary), `#1A2332` (cards), `#243044` (hover)
- Accent: `#D4A574` (gold), `#E8C297` (gold-light)
- Text: `#F1F5F9` (primary), `#94A3B8` (secondary), `#64748B` (muted)
- Border: `border-[#D4A574]/20`

### Typography
- Headings: `font-['Cormorant_Garamond']`
- Body: `font-['Inter']`

## Dependencies

- `react-pdf` - PDF rendering library
- `pdfjs-dist` - PDF.js library
- `@types/react-pdf` - TypeScript types (dev dependency)

## Implementation Notes

1. **PDF.js Worker**: Configured to use CDN-hosted worker from unpkg.com
   ```typescript
   pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
   ```

2. **File Type Detection**: Only shows preview button for PDF files (checks `mimeType === 'application/pdf'`)

3. **Download URLs**: Uses `documentService.getDownloadUrl(id)` to get file URL

4. **Responsive Design**:
   - Container width automatically adjusts on window resize
   - Zoom scale range: 0.5x to 3.0x
   - Default scale: 1.0x (fit to width)

5. **Accessibility**:
   - Text layer enabled for text selection
   - Annotation layer enabled for links
   - Keyboard navigation via arrow keys
   - Focus management in modal

## Integration with DocumentViewPage

Updated `DocumentViewPage.tsx` to include:
- "Preview" button (only for PDFs) in header actions
- Preview card in main content area
- Sidebar action button for PDF preview
- PDF preview modal at bottom of component

```tsx
// Check if document is PDF
const isPDF = document?.mimeType === 'application/pdf';

// Show preview button conditionally
{isPDF && (
  <Button variant="primary" onClick={handlePreviewClick}>
    <Eye className="w-4 h-4 mr-2" />
    Предпросмотр
  </Button>
)}

// Render modal
{isPDF && document && (
  <PDFPreviewModal
    isOpen={showPDFPreview}
    onClose={() => setShowPDFPreview(false)}
    fileUrl={documentService.getDownloadUrl(document.id)}
    fileName={document.fileName}
  />
)}
```

## Files Created

1. `frontend/src/components/documents/PDFViewer.tsx` - Main PDF viewer component
2. `frontend/src/components/documents/PDFViewer.css` - Custom styles for react-pdf
3. `frontend/src/components/documents/PDFPreviewModal.tsx` - Modal wrapper
4. `frontend/src/components/documents/index.ts` - Component exports

## Files Modified

1. `frontend/package.json` - Added react-pdf and pdfjs-dist dependencies
2. `frontend/src/pages/documents/DocumentViewPage.tsx` - Integrated PDF preview

## Testing Checklist

- [ ] PDF loads correctly in viewer
- [ ] Page navigation works (prev/next buttons)
- [ ] Zoom controls function properly (+/-, fit to width)
- [ ] Loading spinner shows while PDF is loading
- [ ] Error message displays for failed loads
- [ ] Modal opens and closes correctly
- [ ] Only PDF files show preview button
- [ ] Download button works for all file types
- [ ] Responsive design works on different screen sizes
- [ ] Dark theme colors match design system
- [ ] Text selection works in PDF
- [ ] Links in PDF are clickable
