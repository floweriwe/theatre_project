# Phase 6: File Handling Enhancement - Execution Plan

**Branch**: `feature/phase6-file-handling`
**BrainGrid Requirement**: REQ-9
**Status**: PLANNED
**Created**: 2026-01-17

## Overview

Phase 6 extends the Theatre Management System with comprehensive file preview capabilities:
- DOCX/DOC conversion to PDF for preview
- XLSX/CSV spreadsheet rendering
- Audio/video media playback
- Departments and Venues CRUD APIs
- Unified file viewer with modal integration

## Task Breakdown (from BrainGrid REQ-9)

| Task | Description | Agent | Dependencies |
|------|-------------|-------|--------------|
| 1 | Enhance File Service with Content Type Detection | backend-architect | None |
| 2 | Create Document Conversion Endpoint (DOCX→PDF) | backend-architect | None |
| 3 | Create Departments CRUD API | backend-architect | None |
| 4 | Create Venues CRUD API | backend-architect | None |
| 5 | Create Unified FileViewer Component | frontend-developer | Task 1 |
| 6 | Create SpreadsheetViewer (XLSX/CSV) | frontend-developer | Task 1 |
| 7 | Create AudioPlayer (MP3/WAV) | frontend-developer | Task 1 |
| 8 | Create VideoPlayer (MP4) | frontend-developer | Task 1 |
| 9 | Create File Preview Modal | frontend-developer | Tasks 5,6,7,8 |

## Execution Strategy

### Group 1: Backend Foundation (Parallel)
**Tasks**: 1, 2, 3, 4
**Agents**: `backend-architect` (4 parallel instances)

```
┌─────────────────────────────────────────────────────────────────┐
│                    GROUP 1 (Parallel)                           │
├─────────────────┬─────────────────┬──────────────┬──────────────┤
│ Task 1          │ Task 2          │ Task 3       │ Task 4       │
│ File Service    │ DOCX Conversion │ Departments  │ Venues       │
│ Content-Type    │ LibreOffice     │ CRUD API     │ CRUD API     │
│ Detection       │ Integration     │              │              │
└─────────────────┴─────────────────┴──────────────┴──────────────┘
```

**Task 1: File Service Enhancement**
- Add `content_type` detection using python-magic
- Add preview URL generation endpoint
- Files: `file_service.py`, `document_router.py`

**Task 2: DOCX→PDF Conversion**
- Install LibreOffice in Docker container
- Create `/documents/{id}/preview` endpoint
- Implement async conversion pipeline
- Files: `document_service.py`, `document_router.py`, `Dockerfile`

**Task 3: Departments CRUD**
- Pydantic schemas, service, router
- Tenant isolation (theater_id)
- Files: `schemas/department.py`, `services/department_service.py`, `endpoints/departments.py`

**Task 4: Venues CRUD**
- Pydantic schemas, service, router
- Capacity validation
- Files: `schemas/venue.py`, `services/venue_service.py`, `endpoints/venues.py`

### Group 2: Frontend Components (Parallel)
**Tasks**: 5, 6, 7, 8
**Agents**: `frontend-developer` (4 parallel instances)
**Blocked by**: Group 1 completion

```
┌─────────────────────────────────────────────────────────────────┐
│                    GROUP 2 (Parallel)                           │
├─────────────────┬─────────────────┬──────────────┬──────────────┤
│ Task 5          │ Task 6          │ Task 7       │ Task 8       │
│ FileViewer      │ Spreadsheet     │ AudioPlayer  │ VideoPlayer  │
│ Dispatcher      │ Viewer (SheetJS)│ (HTML5)      │ (HTML5)      │
└─────────────────┴─────────────────┴──────────────┴──────────────┘
```

**Task 5: FileViewer Component**
- MIME type routing dispatcher
- Loading/error states
- Files: `components/FileViewer/FileViewer.tsx`

**Task 6: SpreadsheetViewer**
- Install SheetJS (`xlsx` package)
- Render XLSX/CSV as HTML table
- Sticky headers, row limiting (1000)
- Files: `components/FileViewer/SpreadsheetViewer.tsx`

**Task 7: AudioPlayer**
- HTML5 `<audio>` element
- MP3/WAV support
- Files: `components/FileViewer/AudioPlayer.tsx`

**Task 8: VideoPlayer**
- HTML5 `<video>` element
- MP4 support, fullscreen
- Files: `components/FileViewer/VideoPlayer.tsx`

### Group 3: Integration (Sequential)
**Task**: 9
**Agent**: `frontend-developer`
**Blocked by**: Group 2 completion

```
┌─────────────────────────────────────────────────────────────────┐
│                    GROUP 3 (Sequential)                         │
├─────────────────────────────────────────────────────────────────┤
│ Task 9: File Preview Modal                                       │
│ - Modal wrapper with header (name, download, close)             │
│ - FileViewer integration                                        │
│ - Document list integration                                      │
└─────────────────────────────────────────────────────────────────┘
```

## Agent Assignments

| Agent | Tasks | Specialization |
|-------|-------|----------------|
| `backend-architect` | 1, 2, 3, 4 | Backend APIs, file processing, CRUD |
| `frontend-developer` | 5, 6, 7, 8, 9 | React components, viewers, modals |

## Success Criteria

### Backend (Tasks 1-4)
- [ ] Content-type detection returns correct MIME types
- [ ] DOCX/DOC files convert to PDF successfully
- [ ] Departments CRUD: all endpoints return correct status codes
- [ ] Venues CRUD: all endpoints with capacity validation
- [ ] Tenant isolation enforced on all endpoints

### Frontend (Tasks 5-9)
- [ ] FileViewer routes files to correct viewer component
- [ ] SpreadsheetViewer renders XLSX/CSV with sticky headers
- [ ] AudioPlayer plays MP3/WAV with controls
- [ ] VideoPlayer plays MP4 with fullscreen support
- [ ] Modal opens/closes correctly with keyboard support

## Technical Dependencies

### Backend
- `python-magic` - MIME type detection
- LibreOffice (headless) - DOCX→PDF conversion
- Docker image update for LibreOffice

### Frontend
- `xlsx` (SheetJS) - Spreadsheet parsing
- Existing HTML5 audio/video support

## Execution Commands

```bash
# Group 1: Backend tasks in parallel
# Use Task tool with 4 backend-architect agents

# Group 2: Frontend components in parallel
# Use Task tool with 4 frontend-developer agents

# Group 3: Modal integration
# Use Task tool with 1 frontend-developer agent

# Final: Tests and PR
npm run typecheck && npm run lint && npm run build
pytest tests/
gh pr create --title "Phase 6: File Handling Enhancement"
```

## Files to Create/Modify

### Backend (New Files)
- `backend/app/schemas/department.py`
- `backend/app/schemas/venue.py`
- `backend/app/services/department_service.py`
- `backend/app/services/venue_service.py`
- `backend/app/api/v1/endpoints/departments.py`
- `backend/app/api/v1/endpoints/venues.py`

### Backend (Modify)
- `backend/app/services/file_service.py`
- `backend/app/services/document_service.py`
- `backend/app/api/v1/endpoints/documents.py`
- `backend/app/api/v1/api.py`
- `backend/Dockerfile`
- `backend/requirements.txt`

### Frontend (New Files)
- `frontend/src/components/FileViewer/FileViewer.tsx`
- `frontend/src/components/FileViewer/SpreadsheetViewer.tsx`
- `frontend/src/components/FileViewer/AudioPlayer.tsx`
- `frontend/src/components/FileViewer/VideoPlayer.tsx`
- `frontend/src/components/FilePreviewModal/FilePreviewModal.tsx`

### Frontend (Modify)
- `frontend/package.json` (add xlsx)
- Document list/detail components

## Notes

- LibreOffice conversion may require Docker image rebuild
- Consider caching converted PDFs in MinIO for repeated access
- SheetJS community edition is sufficient for read-only preview
- HTML5 audio/video have native browser support, no external libraries needed
