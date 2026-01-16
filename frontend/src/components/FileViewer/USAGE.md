# FileViewer Component Usage Guide

## Overview

The `FileViewer` component is a unified file preview dispatcher that automatically routes different file types to their appropriate viewer components based on MIME type.

## Supported File Types

### PDF Documents
- **MIME Type**: `application/pdf`
- **Viewer**: `PDFViewer`
- **Features**: Navigation, zoom controls, page browsing

### Microsoft Word Documents
- **MIME Types**:
  - `application/vnd.openxmlformats-officedocument.wordprocessingml.document` (.docx)
  - `application/msword` (.doc)
- **Viewer**: Backend conversion to PDF preview (fallback to download)
- **Note**: Requires backend API endpoint for document conversion

### Spreadsheets
- **MIME Types**:
  - `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` (.xlsx)
  - `application/vnd.ms-excel` (.xls)
  - `text/csv` (.csv)
- **Viewer**: `SpreadsheetViewer`
- **Features**: Table view with sticky headers, displays up to 1000 rows

### Audio Files
- **MIME Types**: All `audio/*` types (mp3, wav, ogg, etc.)
- **Viewer**: `AudioPlayer`
- **Features**: Play/pause, seek, volume control, time display

### Video Files
- **MIME Types**: All `video/*` types (mp4, webm, etc.)
- **Viewer**: `VideoPlayer`
- **Features**: HTML5 video controls, adaptive sizing

### Images
- **MIME Types**: All `image/*` types (png, jpg, gif, svg, etc.)
- **Viewer**: `ImageViewer`
- **Features**: Responsive image display with error handling

### Unsupported Files
For any other file types, displays a fallback UI with download button.

## Basic Usage

```tsx
import { FileViewer } from '@/components/FileViewer';

function DocumentPreview({ document }) {
  return (
    <FileViewer
      fileUrl={document.fileUrl}
      mimeType={document.mimeType}
      fileName={document.fileName}
      documentId={document.id}
    />
  );
}
```

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `fileUrl` | `string` | Yes | URL to the file to preview |
| `mimeType` | `string` | Yes | MIME type of the file (determines which viewer to use) |
| `fileName` | `string` | No | Display name of the file (shown in some viewers) |
| `documentId` | `string` | No | Document ID for backend preview conversion (DOCX/DOC) |

## Integration with Document Service

```tsx
import { FileViewer } from '@/components/FileViewer';
import { documentService } from '@/services/document_service';

function DocumentDetailPage({ documentId }) {
  const [document, setDocument] = useState(null);

  useEffect(() => {
    documentService.getDocument(documentId).then(setDocument);
  }, [documentId]);

  if (!document) return <Spinner />;

  return (
    <div className="container mx-auto p-4">
      <h1>{document.name}</h1>
      <FileViewer
        fileUrl={documentService.getDownloadUrl(document.id)}
        mimeType={document.mimeType}
        fileName={document.fileName}
        documentId={String(document.id)}
      />
    </div>
  );
}
```

## Modal Preview Example

```tsx
import { Dialog } from '@/components/ui/Dialog';
import { FileViewer } from '@/components/FileViewer';

function QuickPreviewModal({ isOpen, onClose, document }) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <Dialog.Content className="max-w-6xl h-[80vh]">
        <Dialog.Header>
          <Dialog.Title>{document.name}</Dialog.Title>
        </Dialog.Header>
        <div className="flex-1 overflow-auto">
          <FileViewer
            fileUrl={document.fileUrl}
            mimeType={document.mimeType}
            fileName={document.fileName}
          />
        </div>
      </Dialog.Content>
    </Dialog>
  );
}
```

## Design System

All viewers follow the theatre app design system:

- **Background**: `#0F1419` (primary), `#1A2332` (secondary), `#243044` (hover)
- **Accent**: `#D4A574` (gold)
- **Text**: `#F1F5F9` (primary), `#94A3B8` (secondary), `#64748B` (muted)
- **Borders**: `border-[#D4A574]/20`

## Error Handling

Each viewer implements its own error handling:
- **Loading states**: Displays spinner with gold accent
- **Error states**: Shows error message with download fallback
- **Empty states**: Appropriate "no content" message

## Performance Considerations

- **Spreadsheets**: Limited to 1000 rows for performance
- **PDFs**: Lazy loads pages as user navigates
- **Images**: Uses browser native lazy loading
- **Audio/Video**: Uses HTML5 preload="metadata" for faster initial load

## Accessibility

- Semantic HTML structure
- ARIA labels on interactive controls
- Keyboard navigation support
- Focus indicators following design system

## Future Enhancements

- Backend API for DOCX/DOC to PDF conversion
- Support for more file formats (PSD, AI, CAD files)
- Side-by-side comparison mode
- Annotation and markup tools
- Print preview mode
