# FileViewer - Quick Reference Card

## Import

```typescript
import { FileViewer } from '@/components/FileViewer';
```

## Basic Usage

```tsx
<FileViewer
  fileUrl="/api/documents/123/download"
  mimeType="application/pdf"
  fileName="contract.pdf"
/>
```

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `fileUrl` | string | ✅ Yes | URL to the file |
| `mimeType` | string | ✅ Yes | MIME type (routing key) |
| `fileName` | string | ❌ No | Display name |
| `documentId` | string | ❌ No | For DOCX conversion |

## Supported MIME Types

```typescript
// PDF - Direct preview
'application/pdf'

// Word - Via backend conversion (TODO)
'application/vnd.openxmlformats-officedocument.wordprocessingml.document' // .docx
'application/msword' // .doc

// Spreadsheets - Table preview
'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' // .xlsx
'application/vnd.ms-excel' // .xls
'text/csv' // .csv

// Audio - Custom player
'audio/mpeg' // .mp3
'audio/wav'
'audio/ogg'
// ... all audio/* types

// Video - HTML5 player
'video/mp4'
'video/webm'
'video/ogg'
// ... all video/* types

// Images - Direct display
'image/jpeg'
'image/png'
'image/gif'
'image/svg+xml'
// ... all image/* types

// Unknown - Download fallback
// ... all other types
```

## Common Patterns

### With Document Service

```tsx
import { FileViewer } from '@/components/FileViewer';
import { documentService } from '@/services/document_service';

function PreviewDocument({ documentId }) {
  const [doc, setDoc] = useState(null);

  useEffect(() => {
    documentService.getDocument(documentId).then(setDoc);
  }, [documentId]);

  if (!doc) return <Spinner />;

  return (
    <FileViewer
      fileUrl={documentService.getDownloadUrl(doc.id)}
      mimeType={doc.mimeType}
      fileName={doc.fileName}
    />
  );
}
```

### In Modal

```tsx
<Dialog open={isOpen} onClose={handleClose}>
  <Dialog.Content className="max-w-6xl h-[80vh]">
    <FileViewer
      fileUrl={file.url}
      mimeType={file.mimeType}
      fileName={file.name}
    />
  </Dialog.Content>
</Dialog>
```

### Full Page Preview

```tsx
<div className="h-screen p-4">
  <FileViewer
    fileUrl={document.url}
    mimeType={document.mimeType}
    fileName={document.name}
  />
</div>
```

## Styling

Component uses design system colors:
- Background: `#0F1419`, `#1A2332`, `#243044`
- Accent: `#D4A574` (gold)
- Text: `#F1F5F9`, `#94A3B8`, `#64748B`

All viewers maintain consistent styling automatically.

## Error Handling

FileViewer handles errors gracefully:
- Network errors → Shows error message + download button
- Unsupported types → Shows info + download button
- Load failures → Fallback to download

No additional error handling needed in parent components.

## Performance Tips

1. **Lazy Load**: Import FileViewer only when needed
2. **Container Height**: Set explicit height on parent container
3. **Large Files**: Consider adding file size warning
4. **Mobile**: Test on small screens (all viewers are responsive)

## Accessibility

FileViewer is WCAG compliant:
- ✅ Keyboard navigation
- ✅ Screen reader friendly
- ✅ Focus indicators
- ✅ Semantic HTML

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

Requires ES6 support.

## Troubleshooting

### File doesn't load
- Check CORS headers on fileUrl
- Verify MIME type is correct
- Check browser console for errors

### Wrong viewer appears
- Verify mimeType prop is accurate
- Server must send correct Content-Type header

### DOCX preview fails
- Backend conversion endpoint not yet implemented
- Falls back to download button (expected behavior)

## Related Components

```typescript
// Individual viewers (can be used standalone)
import { AudioPlayer } from '@/components/FileViewer';
import { VideoPlayer } from '@/components/FileViewer';
import { SpreadsheetViewer } from '@/components/FileViewer';
import { PDFViewer } from '@/components/documents/PDFViewer';
```

## File Locations

```
C:\Work\projects\theatre\theatre_app_2026\frontend\src\components\FileViewer\
├── FileViewer.tsx       ← Main component
├── AudioPlayer.tsx
├── VideoPlayer.tsx
├── SpreadsheetViewer.tsx
└── index.ts             ← Exports
```

## Type Definitions

```typescript
interface FileViewerProps {
  fileUrl: string;
  mimeType: string;
  fileName?: string;
  documentId?: string;
}

// Usage in parent component
const props: FileViewerProps = {
  fileUrl: '/api/files/123',
  mimeType: 'application/pdf',
  fileName: 'document.pdf'
};
```

## Quick Checklist

Before using FileViewer:
- [ ] Have valid file URL
- [ ] Know MIME type of file
- [ ] Set explicit height on parent container
- [ ] Consider mobile/responsive layout
- [ ] Test error handling (invalid URLs)

## Need Help?

- 📖 Full docs: `USAGE.md`
- 🏗 Architecture: `ARCHITECTURE.md`
- 📋 Implementation details: `IMPLEMENTATION_SUMMARY.md`
