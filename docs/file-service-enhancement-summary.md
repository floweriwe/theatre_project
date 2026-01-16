# File Service Enhancement - Content Type Detection

## Overview
Enhanced the Theatre Management System's file service with automatic MIME type detection using python-magic library and added a new API endpoint for retrieving document download URLs with proper content type information.

## Changes Implemented

### 1. Dependencies Added (`backend/pyproject.toml`)

**Added python-magic libraries:**
```python
"python-magic>=0.4.27",
"python-magic-bin>=0.4.14; platform_system=='Windows'",
```

**Updated mypy configuration to ignore magic module:**
```python
[[tool.mypy.overrides]]
module = [
    # ... existing modules
    "magic.*",
]
```

### 2. Document Service Enhancements (`backend/app/services/document_service.py`)

**Added import:**
```python
import magic  # type: ignore
```

**New method for content type detection:**
```python
def _detect_content_type(self, file_bytes: bytes) -> str:
    """
    Определить MIME-тип файла по его содержимому.

    Использует python-magic для определения типа файла.

    Args:
        file_bytes: Содержимое файла

    Returns:
        MIME-тип (например, 'application/pdf', 'image/jpeg')
    """
    try:
        mime = magic.Magic(mime=True)
        detected_type = mime.from_buffer(file_bytes)
        return detected_type if detected_type else "application/octet-stream"
    except Exception:
        # Fallback на octet-stream если не удалось определить
        return "application/octet-stream"
```

**Updated `save_file` method:**
- Now uses `_detect_content_type()` to accurately determine MIME type from file content
- Falls back to Content-Type header or extension-based detection if magic detection returns generic type
- Ensures accurate MIME type storage in database

```python
# Определяем MIME тип с помощью python-magic
mime_type = self._detect_content_type(content)

# Fallback на заголовок Content-Type или расширение файла
if mime_type == "application/octet-stream":
    mime_type = file.content_type or mimetypes.guess_type(file.filename or "")[0] or "application/octet-stream"
```

### 3. New Schema (`backend/app/schemas/document.py`)

**Added DocumentPreviewUrlResponse:**
```python
class DocumentPreviewUrlResponse(BaseModel):
    """Ответ с URL для предпросмотра/скачивания документа."""

    url: str = Field(..., description="URL для доступа к файлу")
    file_name: str = Field(..., description="Имя файла")
    content_type: str = Field(..., description="MIME-тип файла")
    file_size: int = Field(..., description="Размер файла в байтах")
    expires_in: int = Field(3600, description="Время жизни URL в секундах")
```

### 4. New API Endpoint (`backend/app/api/v1/documents.py`)

**Added import:**
```python
DocumentPreviewUrlResponse,
```

**New endpoint: `GET /api/v1/documents/{document_id}/download-url`**

Returns document metadata with download URL and proper content_type:

```python
@router.get(
    "/{document_id}/download-url",
    response_model=DocumentPreviewUrlResponse,
    summary="Получить URL для скачивания документа",
)
async def get_document_download_url(
    document_id: int,
    current_user: CurrentUserDep,
    service: DocumentService = DocumentServiceDep,
):
    """
    Получить URL для скачивания документа с информацией о content_type.

    Возвращает URL и метаданные файла, включая корректный MIME-тип,
    определенный при загрузке с помощью python-magic.
    """
```

**Response Example:**
```json
{
  "url": "/api/v1/documents/123/download",
  "file_name": "contract.pdf",
  "content_type": "application/pdf",
  "file_size": 1048576,
  "expires_in": 3600
}
```

## Technical Details

### Content Type Detection Flow

1. **File Upload:**
   - File content is read into memory
   - `python-magic` analyzes file bytes to determine actual MIME type
   - Detected type is stored in database

2. **Fallback Strategy:**
   - If magic detection returns generic `application/octet-stream`
   - Falls back to HTTP Content-Type header
   - Finally falls back to extension-based detection via `mimetypes`

3. **Supported File Types:**
   - **PDF**: `application/pdf`
   - **Word Documents**: `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
   - **Excel Spreadsheets**: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
   - **Images**: `image/jpeg`, `image/png`, `image/gif`, etc.
   - **And more**: All MIME types detected by libmagic

### Benefits

1. **Accurate Type Detection:** Uses file content analysis rather than just file extension
2. **Security:** Prevents MIME type spoofing attacks
3. **Better Browser Handling:** Correct content_type ensures proper browser preview/download behavior
4. **Consistent API:** Similar to MinIO presigned URLs but adapted for file storage architecture

### Platform Notes

- **Windows:** Uses `python-magic-bin` which includes pre-compiled libmagic binaries
- **Linux/Mac:** Uses system libmagic (usually pre-installed)
- **Docker:** libmagic should be installed in container (add to Dockerfile if needed)

## API Documentation

### New Endpoint

**GET** `/api/v1/documents/{document_id}/download-url`

**Description:** Get download URL with metadata for a document

**Parameters:**
- `document_id` (path, required): Document ID

**Response:** `DocumentPreviewUrlResponse`
```typescript
{
  url: string;           // URL для доступа к файлу
  file_name: string;     // Имя файла
  content_type: string;  // MIME-тип
  file_size: number;     // Размер в байтах
  expires_in: number;    // Время жизни URL (секунды)
}
```

**Status Codes:**
- `200 OK`: Success
- `404 Not Found`: Document or file not found
- `401 Unauthorized`: Not authenticated

## Files Modified

1. `backend/pyproject.toml` - Added dependencies and mypy config
2. `backend/app/services/document_service.py` - Added content type detection
3. `backend/app/schemas/document.py` - Added response schema
4. `backend/app/api/v1/documents.py` - Added new endpoint

## Installation

To install the new dependencies:

```bash
cd backend
pip install python-magic python-magic-bin  # Windows
# or
pip install python-magic  # Linux/Mac
```

Or using pyproject.toml:
```bash
pip install -e .
```

## Testing

### Manual Testing

1. **Upload a document:**
```bash
curl -X POST http://localhost:8000/api/v1/documents \
  -H "Authorization: Bearer <token>" \
  -F "file=@test.pdf" \
  -F "name=Test Document"
```

2. **Get download URL:**
```bash
curl http://localhost:8000/api/v1/documents/1/download-url \
  -H "Authorization: Bearer <token>"
```

3. **Verify content_type:**
- Check that `content_type` matches actual file type
- Try with different file types (.pdf, .docx, .jpg)
- Verify renamed files (e.g., .txt renamed to .pdf) are detected correctly

### Expected Behavior

- PDF files should return `application/pdf`
- DOCX files should return `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
- JPEG images should return `image/jpeg`
- Files with wrong extensions should be detected by content, not extension

## Future Enhancements

1. **Async Detection:** Make magic detection async for large files
2. **Caching:** Cache detected MIME types to avoid re-detection
3. **Extended Metadata:** Add file hash, last modified time to response
4. **CDN Integration:** Generate CDN URLs for production environments
5. **Virus Scanning:** Integrate with ClamAV or similar for file scanning

## Notes

- The endpoint returns internal API URLs suitable for development
- In production, consider using CDN or nginx-served URLs
- Content type is detected once during upload and stored in database
- The `expires_in` field is set to 3600 seconds (1 hour) but URLs don't actually expire since this is file storage, not presigned URLs
- For true presigned URLs with expiration, consider migrating to MinIO/S3 for document storage

## Compatibility

- Python 3.12+
- FastAPI 0.115.0+
- Works with existing document storage system
- No database migrations required (uses existing mime_type field)
