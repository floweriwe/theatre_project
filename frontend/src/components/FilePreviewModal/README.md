# FilePreviewModal Component

Modal overlay interface for previewing documents with FileViewer integration. Provides a full-screen modal experience with file viewing capabilities for multiple document types.

## Features

- **Full-screen Modal**: Large, immersive preview experience
- **Multiple File Types**: PDF, DOCX, XLSX, images, audio, video
- **Presigned URLs**: Secure file access via backend
- **Loading States**: Elegant spinner with gold accent
- **Error Handling**: Graceful fallback with download option
- **Dark Theme**: Follows Modern Theatre Elegance v3 design system
- **Accessibility**: WCAG compliant, keyboard navigation, screen reader support
- **Download Fallback**: Always provides download option

## Usage

### Basic Example

```tsx
import { useState } from 'react';
import { FilePreviewModal } from '@/components/FilePreviewModal';
import { Button } from '@/components/ui/Button';

function DocumentPreview() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>
        Просмотреть документ
      </Button>

      <FilePreviewModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        documentId="123"
        fileName="contract.pdf"
        mimeType="application/pdf"
      />
    </>
  );
}
```

### With Document List

```tsx
import { useState } from 'react';
import { FilePreviewModal } from '@/components/FilePreviewModal';

interface Document {
  id: string;
  name: string;
  fileName: string;
  mimeType: string;
}

function DocumentList({ documents }: { documents: Document[] }) {
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);

  return (
    <>
      <div className="space-y-2">
        {documents.map((doc) => (
          <div key={doc.id} onClick={() => setSelectedDoc(doc)}>
            {doc.name}
          </div>
        ))}
      </div>

      {selectedDoc && (
        <FilePreviewModal
          isOpen={!!selectedDoc}
          onClose={() => setSelectedDoc(null)}
          documentId={selectedDoc.id}
          fileName={selectedDoc.fileName}
          mimeType={selectedDoc.mimeType}
        />
      )}
    </>
  );
}
```

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `isOpen` | `boolean` | Yes | Whether the modal is open |
| `onClose` | `() => void` | Yes | Callback when modal closes |
| `documentId` | `string` | Yes | Document ID for fetching presigned URL |
| `fileName` | `string` | Yes | Original file name to display |
| `mimeType` | `string` | Yes | MIME type for viewer routing |

## Supported File Types

### Documents
- **PDF**: `application/pdf`
- **Word**: `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
- **Word (Legacy)**: `application/msword`

### Spreadsheets
- **Excel**: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- **Excel (Legacy)**: `application/vnd.ms-excel`
- **CSV**: `text/csv`

### Images
- **JPEG**: `image/jpeg`
- **PNG**: `image/png`
- **GIF**: `image/gif`
- **SVG**: `image/svg+xml`

### Media
- **Audio**: `audio/mpeg`, `audio/wav`, `audio/ogg`
- **Video**: `video/mp4`, `video/webm`, `video/ogg`

## Component Architecture

```
FilePreviewModal
├── Modal (base component)
│   ├── Header (title + close button)
│   ├── Body (70vh height)
│   │   ├── LoadingState (spinner + text)
│   │   ├── ErrorState (error + download fallback)
│   │   └── FileViewer (dispatches to appropriate viewer)
│   │       ├── PDFViewer
│   │       ├── SpreadsheetViewer
│   │       ├── AudioPlayer
│   │       ├── VideoPlayer
│   │       └── ImageViewer
│   └── Footer (download button + close button)
```

## API Integration

The component fetches presigned URLs from the backend:

```typescript
GET /api/v1/documents/{documentId}/download
Authorization: Bearer {access_token}

Response:
{
  "url": "https://presigned-url-to-file"
}
```

### Backend Requirements

1. **Endpoint**: `GET /documents/{id}/download`
2. **Authorization**: Bearer token required
3. **Response Format**: JSON with `url` field
4. **URL Validity**: Presigned URL should be valid for reasonable time (e.g., 1 hour)
5. **CORS**: MinIO/S3 bucket must allow CORS for frontend domain

## States

### 1. Loading State
- Displays gold spinner
- Shows "Загрузка файла..." text
- Triggered when fetching presigned URL

### 2. Success State
- Renders FileViewer with presigned URL
- FileViewer dispatches to appropriate viewer based on MIME type
- Download button enabled

### 3. Error State
- Shows error icon and message
- Displays file name
- Provides download button as fallback
- User can still download file even if preview fails

## Styling

Follows **Modern Theatre Elegance v3** design system:

### Colors
```css
/* Background */
--bg-primary: #0F1419;
--bg-secondary: #1A2332;
--bg-tertiary: #243044;

/* Accent */
--gold: #D4A574;
--gold-light: #E8C297;

/* Text */
--text-primary: #F1F5F9;
--text-secondary: #94A3B8;
--text-muted: #64748B;

/* Error */
--error: #EF4444;
```

### Tailwind Classes
```tsx
// Modal content height
className="h-[70vh]"

// Loading spinner
className="text-[#D4A574]" // gold accent

// Error state border
className="border border-red-400/20"

// Background colors
className="bg-[#1A2332]" // secondary background
```

## Accessibility

### Keyboard Navigation
- **Escape**: Close modal
- **Tab**: Navigate between buttons
- **Enter/Space**: Activate buttons

### ARIA Attributes
```tsx
<Modal
  role="dialog"
  aria-modal="true"
  aria-labelledby="modal-title"
>
```

### Screen Reader Support
- All buttons have descriptive labels
- Error messages are properly announced
- Loading states are indicated
- File name is announced in title

### Focus Management
- Focus trapped within modal when open
- Focus returns to trigger element on close
- Tab order follows logical flow

### Color Contrast
- Text meets WCAG AA standards (4.5:1 for normal text)
- Error states use red with sufficient contrast
- Interactive elements clearly visible against background

## Performance Considerations

### 1. Lazy Loading
- FileViewer components load only when modal opens
- Presigned URL fetched only when needed
- No unnecessary API calls when modal is closed

### 2. State Management
- Local state reset on modal close to prevent memory leaks
- Auth token accessed directly from Zustand store
- No prop drilling for authentication

### 3. Network Efficiency
- Single API call per modal open
- No polling or continuous requests
- Presigned URL cached during modal session

### 4. Error Recovery
- Graceful fallback for failed URL fetches
- Download button always available as backup
- Clear error messages for debugging

### 5. Resource Cleanup
- Effect cleanup when modal closes
- No event listeners left attached
- No memory leaks from unmounted components

## Testing

### Unit Tests
```tsx
describe('FilePreviewModal', () => {
  it('renders loading state initially', () => {
    // Test loading spinner appears
  });

  it('fetches presigned URL on open', () => {
    // Test API call is made with correct params
  });

  it('renders FileViewer with presigned URL', () => {
    // Test FileViewer receives correct props
  });

  it('shows error state on fetch failure', () => {
    // Test error message and download fallback
  });

  it('closes on Escape key', () => {
    // Test keyboard accessibility
  });

  it('enables download button', () => {
    // Test download functionality
  });
});
```

### Integration Tests
```tsx
describe('FilePreviewModal Integration', () => {
  it('opens modal and previews PDF', async () => {
    // Test full user flow for PDF
  });

  it('handles unauthorized access', () => {
    // Test 401 error handling
  });

  it('downloads file on error', () => {
    // Test fallback download
  });
});
```

## Troubleshooting

### Modal doesn't open
- Check `isOpen` prop is set to `true`
- Verify parent component state management
- Check console for JavaScript errors

### File doesn't load
- Verify backend endpoint returns presigned URL
- Check network tab for API call status
- Verify auth token is valid
- Check CORS configuration on MinIO/S3

### Download button doesn't work
- Verify `documentService.getDownloadUrl()` returns valid URL
- Check backend download endpoint is accessible
- Verify browser allows pop-ups from your domain

### Preview shows wrong viewer
- Verify `mimeType` prop is correct
- Check FileViewer MIME type routing logic
- Ensure backend returns correct Content-Type header

### Styling issues
- Verify Tailwind CSS is configured correctly
- Check design system variables are defined
- Ensure no CSS conflicts from parent components

## Dependencies

- `react` - Core React library
- `lucide-react` - Icons (Download, AlertCircle)
- `@/components/ui/Modal` - Base modal component
- `@/components/ui/Button` - Button component
- `@/components/ui/Spinner` - Loading spinner
- `@/components/FileViewer/FileViewer` - File viewer dispatcher
- `@/services/document_service` - Document API service
- `@/store/authStore` - Authentication state

## Future Enhancements

- [ ] Add file rotation for images
- [ ] Add zoom controls for PDFs
- [ ] Add print button
- [ ] Add share functionality
- [ ] Cache presigned URLs for session
- [ ] Add keyboard shortcuts (P for print, D for download)
- [ ] Add breadcrumb navigation for multi-file preview
- [ ] Add previous/next navigation for document lists
- [ ] Add thumbnail strip for multi-page documents
- [ ] Add annotations and comments support
