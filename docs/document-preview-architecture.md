# Document Preview Architecture

Visual documentation of the document conversion system.

## System Overview

```
┌─────────────┐
│   Frontend  │
│  (React)    │
└──────┬──────┘
       │ GET /api/v1/documents/{id}/preview
       ↓
┌──────────────────────────────────────────────────┐
│           FastAPI Backend                        │
│                                                  │
│  ┌────────────────────────────────────────┐     │
│  │  documents.py (Router)                 │     │
│  │  preview_document()                    │     │
│  └─────────────┬──────────────────────────┘     │
│                ↓                                 │
│  ┌────────────────────────────────────────┐     │
│  │  DocumentService                       │     │
│  │  get_document_preview_url()            │     │
│  │    ├─ _get_preview_path()             │     │
│  │    └─ _convert_docx_to_pdf()          │     │
│  └─────────────┬──────────────────────────┘     │
│                ↓                                 │
│  ┌────────────────────────────────────────┐     │
│  │  Conversion Logic                      │     │
│  │  - python-docx: Read DOCX              │     │
│  │  - reportlab: Generate PDF             │     │
│  └─────────────┬──────────────────────────┘     │
└────────────────┼──────────────────────────────┘
                 ↓
    ┌────────────────────────────┐
    │  File System Storage       │
    │  /app/storage/             │
    │    ├─ documents/           │
    │    │    └─ original.docx   │
    │    └─ previews/            │
    │         └─ doc_1_preview.pdf│
    └────────────────────────────┘
```

## Request Flow

### First Preview Request (Cache Miss)

```
1. User clicks "Preview" button
   │
   ↓
2. Frontend: GET /documents/123/preview
   │
   ↓
3. Router validates auth + document access
   │
   ↓
4. Service checks document MIME type
   │
   ├─ PDF? → Return original file
   │
   └─ DOCX? → Continue to conversion
      │
      ↓
5. Check if preview exists in /previews/
   │
   └─ Not found → Create preview
      │
      ↓
6. Read DOCX from /documents/
   │
   ↓
7. Extract paragraphs (python-docx)
   │
   ↓
8. Generate PDF (reportlab)
   │
   ↓
9. Save to /previews/doc_123_preview.pdf
   │
   ↓
10. Return PDF file to frontend
    │
    ↓
11. Frontend displays in PDF viewer
```

### Subsequent Requests (Cache Hit)

```
1. User clicks "Preview" button
   │
   ↓
2. Frontend: GET /documents/123/preview
   │
   ↓
3. Router validates auth + document access
   │
   ↓
4. Service checks document MIME type
   │
   ↓
5. Check if preview exists in /previews/
   │
   └─ Found! → Skip conversion
      │
      ↓
6. Return cached PDF file (instant)
```

## Component Responsibilities

### API Layer (`documents.py`)
- Authentication & authorization
- Request validation
- Response formatting
- Error handling (400, 404, 500)

### Service Layer (`document_service.py`)
- Business logic
- File type detection
- Preview caching logic
- Conversion orchestration
- File path management

### Conversion Layer
**python-docx:**
- Parse DOCX structure
- Extract text paragraphs
- Handle document metadata

**reportlab:**
- Create PDF document
- Apply text styling
- Layout management
- Generate binary PDF

### Storage Layer
```
/app/storage/
├── documents/               # Original uploads
│   ├── 1/
│   │   └── 2026/
│   │       └── 01/
│   │           └── 20260117_143022_file.docx
│   └── ...
│
└── previews/                # Generated PDFs
    ├── doc_1_preview.pdf
    ├── doc_2_preview.pdf
    └── ...
```

## Data Flow Diagram

```
┌──────────────┐
│   Document   │
│   Model      │
│ ┌──────────┐ │
│ │ id: 123  │ │
│ │ file_path│ │
│ │ mime_type│ │
│ └──────────┘ │
└──────┬───────┘
       │
       ↓
┌──────────────────────────────────┐
│   get_document_preview_url()     │
│                                  │
│   if mime_type == "pdf":         │
│     return original_url          │
│                                  │
│   if mime_type == "docx":        │
│     check_preview_cache()        │
│     if not cached:               │
│       convert_to_pdf()           │
│     return preview_url           │
│                                  │
│   else:                          │
│     return None                  │
└──────────────────────────────────┘
```

## File Naming Convention

### Original Documents
```
Pattern: {theater_id}/{year}/{month}/{timestamp}_{filename}
Example: 1/2026/01/20260117_143022_report.docx
```

### Preview PDFs
```
Pattern: doc_{document_id}_preview.pdf
Example: doc_123_preview.pdf
```

**Benefits:**
- Unique per document
- Easy to identify source document
- Simple cache invalidation (delete by ID)
- No collision risk

## Error Handling Flow

```
┌─────────────────┐
│ Preview Request │
└────────┬────────┘
         │
         ↓
    ┌────────────┐
    │ Document   │
    │ exists?    │
    └─┬────────┬─┘
      │        │
    NO│        │YES
      │        │
      ↓        ↓
   ┌─────┐  ┌──────────┐
   │ 404 │  │ MIME     │
   └─────┘  │ Type OK? │
            └─┬──────┬─┘
              │      │
            NO│      │YES
              │      │
              ↓      ↓
           ┌─────┐ ┌──────────┐
           │ 400 │ │ Convert  │
           └─────┘ └─┬──────┬─┘
                     │      │
                  OK │      │ FAIL
                     │      │
                     ↓      ↓
                  ┌─────┐ ┌─────┐
                  │ 200 │ │ 500 │
                  └─────┘ └─────┘
```

## Conversion Process Detail

```
┌──────────────────────────────────────┐
│  _convert_docx_to_pdf()              │
│                                      │
│  1. Read DOCX                        │
│     DocxDocument(docx_path)          │
│          ↓                           │
│  2. Create PDF Canvas                │
│     SimpleDocTemplate()              │
│          ↓                           │
│  3. Extract Paragraphs               │
│     for para in doc.paragraphs:      │
│          ↓                           │
│  4. Clean Text                       │
│     text.replace('<', '&lt;')        │
│          ↓                           │
│  5. Create PDF Elements              │
│     Paragraph(text, style)           │
│          ↓                           │
│  6. Build PDF                        │
│     pdf.build(story)                 │
│          ↓                           │
│  7. Write to Disk                    │
│     with open(pdf_path, 'wb')        │
│          ↓                           │
│  8. Return Success                   │
│     return True                      │
└──────────────────────────────────────┘
```

## Caching Strategy

### Cache Key
```python
preview_path = f"previews/doc_{document_id}_preview.pdf"
```

### Cache Validation
```python
if preview_path.exists():
    # Cache hit - return existing file
    return preview_path
else:
    # Cache miss - create preview
    convert_and_save()
    return preview_path
```

### Cache Invalidation
**Automatic:** None (previews persist)

**Manual:**
```python
# When document is updated/deleted
service.delete_document_preview(document_id)
```

**Future:** Consider adding:
- TTL-based expiration
- Storage limit (FIFO eviction)
- Cleanup cron job

## Performance Characteristics

### Timing Breakdown

**First Request (DOCX):**
```
Total: 0.5 - 2.0 seconds
├─ Auth check:        ~5ms
├─ DB query:          ~10ms
├─ DOCX parsing:      200-800ms
├─ PDF generation:    200-800ms
├─ File I/O:          50-200ms
└─ HTTP transfer:     ~100ms
```

**Cached Request:**
```
Total: 50 - 200ms
├─ Auth check:        ~5ms
├─ DB query:          ~10ms
├─ File exists check: ~1ms
├─ File I/O:          30-100ms
└─ HTTP transfer:     ~100ms
```

### Scalability Considerations

**Current (MVP):**
- Synchronous conversion (blocks request)
- No queue system
- Local filesystem storage
- Single instance

**Phase 2 Options:**
1. **Async Conversion with Celery**
   ```
   Request → Queue Task → Return 202 Accepted
   Poll endpoint until ready
   ```

2. **Pre-generation on Upload**
   ```
   Upload → Background Task → Create Preview
   Preview already ready when requested
   ```

3. **External Service**
   ```
   Request → CloudConvert API → Return URL
   No local processing needed
   ```

## Security Model

```
┌────────────────────────────────────┐
│  Security Layers                   │
│                                    │
│  1. Authentication                 │
│     ├─ JWT token required          │
│     └─ User session valid          │
│                                    │
│  2. Authorization                  │
│     ├─ User owns document?         │
│     └─ Document is_public?         │
│                                    │
│  3. File Validation                │
│     ├─ MIME type whitelist         │
│     ├─ File extension check        │
│     └─ Size limits                 │
│                                    │
│  4. Path Safety                    │
│     ├─ No user input in paths      │
│     ├─ Server-generated names      │
│     └─ Relative path validation    │
│                                    │
│  5. Error Handling                 │
│     ├─ No internal error exposure  │
│     └─ Generic error messages      │
└────────────────────────────────────┘
```

## Storage Management

### Current State
- Previews persist indefinitely
- No automatic cleanup
- Manual deletion on document update/delete

### Future Recommendations

**Option 1: Time-based Cleanup**
```python
# Cron job: Delete previews older than 30 days
find /app/storage/previews -mtime +30 -delete
```

**Option 2: Size-based Cleanup**
```python
# Cron job: Keep only 1000 most recent previews
ls -t /app/storage/previews | tail -n +1001 | xargs rm
```

**Option 3: On-demand Regeneration**
```python
# Delete on document update, recreate on next request
async def update_document():
    delete_document_preview(doc_id)
    # Next preview request will regenerate
```

## Monitoring Points

Key metrics to track:

1. **Conversion Success Rate**
   ```python
   conversions_total
   conversions_successful
   conversions_failed
   ```

2. **Performance**
   ```python
   conversion_duration_seconds
   cache_hit_rate
   preview_file_size_bytes
   ```

3. **Storage**
   ```python
   preview_directory_size_bytes
   preview_files_count
   oldest_preview_age_days
   ```

4. **Errors**
   ```python
   preview_errors_by_type
   preview_404_count
   preview_500_count
   ```

## Maintenance Tasks

### Regular
- Monitor preview directory size
- Check conversion error logs
- Validate cache hit rate

### Periodic
- Clear old previews (monthly)
- Update conversion libraries
- Test with various DOCX samples

### On Incident
- Delete corrupted previews
- Regenerate failed conversions
- Review error patterns
