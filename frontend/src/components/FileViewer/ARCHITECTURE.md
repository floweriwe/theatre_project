# FileViewer Architecture

## Component Hierarchy

```
FileViewer (Main Dispatcher)
│
├── Props
│   ├── fileUrl: string (required)
│   ├── mimeType: string (required)
│   ├── fileName?: string (optional)
│   └── documentId?: string (optional for DOCX conversion)
│
├── State Management
│   ├── loading: boolean
│   ├── error: string | null
│   └── previewUrl: string | null (for DOCX conversion)
│
├── MIME Type Detection (Helper Functions)
│   ├── isDocxOrDoc() → boolean
│   ├── isSpreadsheet() → boolean
│   ├── isAudio() → boolean
│   ├── isVideo() → boolean
│   └── isImage() → boolean
│
├── Render Logic (switch/case by MIME type)
│   │
│   ├── application/pdf
│   │   └── <PDFViewer /> (existing component)
│   │       └── Features: zoom, pagination, controls
│   │
│   ├── application/vnd.openxmlformats-officedocument.wordprocessingml.document
│   │   application/msword
│   │   └── <PDFViewer /> (via backend conversion)
│   │       OR <UnsupportedType /> (if conversion fails)
│   │
│   ├── application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
│   │   application/vnd.ms-excel
│   │   text/csv
│   │   └── <SpreadsheetViewer />
│   │       └── Features: table view, sticky headers, 1000 row limit
│   │
│   ├── audio/*
│   │   └── <AudioPlayer />
│   │       └── Features: play/pause, seek, volume, time display
│   │
│   ├── video/*
│   │   └── <VideoPlayer />
│   │       └── Features: HTML5 controls, adaptive sizing
│   │
│   ├── image/*
│   │   └── <ImageViewer /> (internal component)
│   │       └── Features: responsive display, loading state
│   │
│   └── default (unknown types)
│       └── <UnsupportedType /> (internal component)
│           └── Features: error message, download button
│
└── Internal Sub-Components
    ├── <LoadingState />
    │   └── Spinner + "Загрузка превью..."
    │
    ├── <ErrorState />
    │   └── Error message + download button
    │
    ├── <ImageViewer />
    │   └── Responsive image with error handling
    │
    └── <UnsupportedType />
        └── Icon + message + download button
```

## Data Flow Diagram

```
User/Parent Component
        │
        ├── fileUrl
        ├── mimeType
        ├── fileName (optional)
        └── documentId (optional)
        │
        ▼
   FileViewer Component
        │
        ├── Detect MIME type
        │   └── Route decision
        │
        ├── IF loading
        │   └── Show LoadingState
        │
        ├── IF error
        │   └── Show ErrorState
        │
        └── ELSE render appropriate viewer
            │
            ├── PDF → PDFViewer
            ├── DOCX/DOC → Fetch preview → PDFViewer or UnsupportedType
            ├── Spreadsheet → SpreadsheetViewer
            ├── Audio → AudioPlayer
            ├── Video → VideoPlayer
            ├── Image → ImageViewer
            └── Unknown → UnsupportedType
```

## State Machine

```
                    [Initial Mount]
                          │
                          ▼
                   ┌──────────────┐
                   │   Idle       │
                   └──────┬───────┘
                          │
         ┌────────────────┼────────────────┐
         │                │                │
         ▼                ▼                ▼
    ┌────────┐      ┌─────────┐      ┌──────────┐
    │ PDF    │      │ DOCX/DOC│      │  Other   │
    │ Direct │      │ Convert │      │  Types   │
    └───┬────┘      └────┬────┘      └────┬─────┘
        │                │                 │
        │                ▼                 │
        │         ┌──────────────┐         │
        │         │   Loading    │         │
        │         └──────┬───────┘         │
        │                │                 │
        │         ┌──────┴──────┐          │
        │         ▼             ▼          │
        │    ┌─────────┐   ┌───────┐      │
        │    │ Success │   │ Error │      │
        │    └─────────┘   └───────┘      │
        │                                  │
        └──────────────┬───────────────────┘
                       │
                       ▼
                ┌──────────────┐
                │   Rendered   │
                │   Viewer     │
                └──────────────┘
```

## Integration Points

### External Dependencies

```
FileViewer
    │
    ├── UI Components
    │   ├── @/components/ui/Spinner
    │   └── @/components/ui/Button
    │
    ├── Viewer Components
    │   ├── @/components/documents/PDFViewer
    │   ├── @/components/FileViewer/AudioPlayer
    │   ├── @/components/FileViewer/VideoPlayer
    │   └── @/components/FileViewer/SpreadsheetViewer
    │
    ├── Icons
    │   └── lucide-react (Download, FileQuestion)
    │
    └── Backend API (Future)
        └── /api/documents/{id}/preview (for DOCX conversion)
```

### Export Structure

```
index.ts
    │
    ├── export { FileViewer } from './FileViewer'
    ├── export { AudioPlayer } from './AudioPlayer'
    ├── export { VideoPlayer } from './VideoPlayer'
    └── export { SpreadsheetViewer } from './SpreadsheetViewer'
```

## MIME Type Routing Table

| Input MIME Type | Detection Function | Output Component | Fallback |
|----------------|-------------------|------------------|----------|
| `application/pdf` | Direct match | PDFViewer | None needed |
| `application/vnd.openxmlformats-officedocument.wordprocessingml.document` | `isDocxOrDoc()` | PDFViewer (via conversion) | UnsupportedType |
| `application/msword` | `isDocxOrDoc()` | PDFViewer (via conversion) | UnsupportedType |
| `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` | `isSpreadsheet()` | SpreadsheetViewer | None needed |
| `application/vnd.ms-excel` | `isSpreadsheet()` | SpreadsheetViewer | None needed |
| `text/csv` | `isSpreadsheet()` | SpreadsheetViewer | None needed |
| `audio/mp3`, `audio/wav`, etc. | `isAudio()` | AudioPlayer | None needed |
| `video/mp4`, `video/webm`, etc. | `isVideo()` | VideoPlayer | None needed |
| `image/png`, `image/jpeg`, etc. | `isImage()` | ImageViewer | Download link |
| All others | Default case | UnsupportedType | Download button |

## Error Handling Strategy

```
┌─────────────────────────────────────┐
│  FileViewer Error Boundaries        │
└─────────────────┬───────────────────┘
                  │
    ┌─────────────┼─────────────┐
    │             │             │
    ▼             ▼             ▼
┌────────┐  ┌─────────┐  ┌──────────┐
│Network │  │ Parse   │  │Component │
│Errors  │  │ Errors  │  │  Errors  │
└───┬────┘  └────┬────┘  └────┬─────┘
    │            │            │
    └────────────┼────────────┘
                 │
                 ▼
         ┌───────────────┐
         │  ErrorState   │
         │  Component    │
         │  with         │
         │  Download     │
         │  Fallback     │
         └───────────────┘
```

## Performance Optimization

```
FileViewer
    │
    ├── Code Splitting
    │   └── Each viewer component lazy-loadable
    │
    ├── Conditional Rendering
    │   └── Only mount required viewer component
    │
    ├── Memory Management
    │   ├── useEffect cleanup for fetch operations
    │   └── Proper state cleanup on unmount
    │
    └── Loading States
        └── Prevent layout shift with min-height
```

## Design System Tokens

```css
/* Color Palette */
--bg-primary: #0F1419      /* Main background */
--bg-secondary: #1A2332    /* Card/panel background */
--bg-tertiary: #243044     /* Hover states */

--gold: #D4A574            /* Primary accent */
--gold-light: #E8C297      /* Accent hover */

--text-primary: #F1F5F9    /* Main text */
--text-secondary: #94A3B8  /* Supporting text */
--text-muted: #64748B      /* Disabled/meta text */

--border: #D4A574/20       /* Border with opacity */
--error: #EF4444           /* Error state */

/* Typography */
--font-heading: 'Cormorant_Garamond'
--font-body: 'Inter'
```

## Accessibility Tree

```
div[role="main"] (FileViewer root)
    │
    ├── [IF loading]
    │   └── div[role="status"]
    │       └── "Загрузка превью..."
    │
    ├── [IF error]
    │   └── div[role="alert"]
    │       └── Error message + download link
    │
    └── [ELSE viewer component]
        └── Appropriate semantic structure
            ├── PDFViewer → article
            ├── AudioPlayer → audio + controls
            ├── VideoPlayer → video + controls
            ├── SpreadsheetViewer → table
            ├── ImageViewer → img with alt
            └── UnsupportedType → article + download
```

## Testing Strategy

```
Unit Tests
    ├── MIME type detection functions
    ├── Component rendering logic
    ├── State management
    └── Error handling

Integration Tests
    ├── File service integration
    ├── Viewer component integration
    └── User interaction flows

E2E Tests
    ├── Complete file preview flows
    ├── Error scenarios
    └── Accessibility compliance
```
