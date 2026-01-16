# FileViewer Components

Collection of file preview components for the Theatre Management System.

## Components

### SpreadsheetViewer

Displays Excel (.xlsx, .xls) and CSV files in a read-only table format using SheetJS library.

**Features:**
- Parses first sheet of workbook
- Displays up to 1000 rows for performance
- Sticky table headers for easy navigation
- Dark theme styling matching theatre app design system
- Russian locale number formatting
- Loading and error states

**Usage:**
```tsx
import { SpreadsheetViewer } from '@/components/FileViewer/SpreadsheetViewer';

function BudgetPreview() {
  return (
    <div className="h-[600px]">
      <SpreadsheetViewer fileUrl="/api/documents/budget_2024.xlsx" />
    </div>
  );
}
```

**Props:**
- `fileUrl` (string, required): URL or path to the spreadsheet file

**Supported Formats:**
- Excel: .xlsx, .xls
- CSV: .csv

**Performance Notes:**
- Only displays first 1000 rows
- Shows indicator when file has more rows
- Parses on client side (no backend processing needed)

### VideoPlayer

Displays video files with HTML5 video controls.

**Usage:**
```tsx
import { VideoPlayer } from '@/components/FileViewer/VideoPlayer';

<VideoPlayer
  fileUrl="/api/documents/performance_video.mp4"
  fileName="Репетиция 2024-01-15"
/>
```

### AudioPlayer

Displays audio files with HTML5 audio controls.

**Usage:**
```tsx
import { AudioPlayer } from '@/components/FileViewer/AudioPlayer';

<AudioPlayer
  fileUrl="/api/documents/sound_cue.mp3"
  fileName="Звуковой эффект #1"
/>
```

## Design System

All components follow the theatre app dark theme:

**Colors:**
- Background primary: `#0F1419`
- Background secondary: `#1A2332`
- Background tertiary: `#243044`
- Gold accent: `#D4A574`
- Gold light: `#E8C297`
- Text primary: `#F1F5F9`
- Text secondary: `#94A3B8`
- Text muted: `#64748B`

**Typography:**
- Headers: `font-['Cormorant_Garamond']`
- Body: `font-['Inter']`

## Dependencies

- `xlsx: ^0.18.5` - SheetJS library for spreadsheet parsing
- `react: ^18.3.1`
- `lucide-react` - Icons (if needed)

## Accessibility

- Semantic HTML table structure
- Proper ARIA labels
- Keyboard navigation support
- Focus indicators on interactive elements
- High contrast gold accent for better visibility

## Performance Optimizations

1. **Row Limiting**: Max 1000 rows to prevent browser performance issues
2. **Lazy Loading**: Components only load when rendered
3. **Memoization**: Consider wrapping in `React.memo()` for frequently re-rendered parent components
4. **Streaming**: Video/audio use HTML5 progressive download

## Future Enhancements

- [ ] Multi-sheet support for Excel files
- [ ] Export to CSV functionality
- [ ] Column sorting and filtering
- [ ] Cell formatting preservation (colors, fonts)
- [ ] Frozen rows/columns
- [ ] Search within spreadsheet
- [ ] PDF preview component
- [ ] Image viewer component with zoom
