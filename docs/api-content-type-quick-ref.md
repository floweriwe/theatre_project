# Content Type Detection API - Quick Reference

## New Endpoint

### Get Document Download URL
```
GET /api/v1/documents/{document_id}/download-url
```

**Returns:** URL and metadata with accurate content_type

**Response:**
```json
{
  "url": "/api/v1/documents/123/download",
  "file_name": "contract.pdf",
  "content_type": "application/pdf",
  "file_size": 1048576,
  "expires_in": 3600
}
```

## Usage Examples

### Python (httpx)
```python
import httpx

async with httpx.AsyncClient() as client:
    # Get download URL
    response = await client.get(
        f'http://localhost:8000/api/v1/documents/{doc_id}/download-url',
        headers={'Authorization': f'Bearer {token}'}
    )
    info = response.json()

    # Download file
    file_response = await client.get(
        f'http://localhost:8000{info["url"]}',
        headers={'Authorization': f'Bearer {token}'}
    )

    # Save with correct type
    with open(info['file_name'], 'wb') as f:
        f.write(file_response.content)
```

### JavaScript (fetch)
```javascript
// Get download URL
const response = await fetch(
  `http://localhost:8000/api/v1/documents/${docId}/download-url`,
  {
    headers: { 'Authorization': `Bearer ${token}` }
  }
);
const info = await response.json();

// Download file
const fileResponse = await fetch(
  `http://localhost:8000${info.url}`,
  {
    headers: { 'Authorization': `Bearer ${token}` }
  }
);
const blob = await fileResponse.blob();

// Create download link
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = info.file_name;
a.click();
```

### cURL
```bash
# Get download URL
curl -X GET "http://localhost:8000/api/v1/documents/123/download-url" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Download file using returned URL
curl -X GET "http://localhost:8000/api/v1/documents/123/download" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -o "downloaded_file.pdf"
```

## Common MIME Types

| File Extension | Content Type |
|----------------|--------------|
| .pdf | application/pdf |
| .docx | application/vnd.openxmlformats-officedocument.wordprocessingml.document |
| .doc | application/msword |
| .xlsx | application/vnd.openxmlformats-officedocument.spreadsheetml.sheet |
| .xls | application/vnd.ms-excel |
| .jpg, .jpeg | image/jpeg |
| .png | image/png |
| .gif | image/gif |
| .txt | text/plain |
| .zip | application/zip |

## Error Responses

| Status | Meaning |
|--------|---------|
| 200 | Success |
| 401 | Unauthorized - invalid or missing token |
| 404 | Document not found or file missing |
| 500 | Server error |

## Benefits

✅ **Accurate MIME Types** - Detected from file content, not extension
✅ **Security** - Prevents MIME type spoofing
✅ **Browser Compatibility** - Proper content type for preview/download
✅ **Consistent API** - Similar to presigned URL pattern

## Implementation Notes

- Content type is detected during upload using python-magic
- Detection analyzes file content, not just extension
- Fallback to extension-based detection if content analysis fails
- MIME type is stored in database and reused for downloads
- URLs don't actually expire (file storage, not presigned)
- In production, consider using CDN or nginx for serving files

## Related Endpoints

```
POST   /api/v1/documents              - Upload document
GET    /api/v1/documents/{id}         - Get document details
GET    /api/v1/documents/{id}/download - Download file directly
GET    /api/v1/documents/{id}/download-url - Get download URL (NEW)
PATCH  /api/v1/documents/{id}         - Update document
DELETE /api/v1/documents/{id}         - Delete document
```

## Frontend Integration

### React Example
```typescript
import { useState } from 'react';

interface DownloadUrlResponse {
  url: string;
  file_name: string;
  content_type: string;
  file_size: number;
  expires_in: number;
}

async function downloadDocument(documentId: number) {
  // Get download URL
  const urlResponse = await fetch(
    `/api/v1/documents/${documentId}/download-url`,
    {
      headers: { 'Authorization': `Bearer ${token}` }
    }
  );
  const urlInfo: DownloadUrlResponse = await urlResponse.json();

  // Download file
  const fileResponse = await fetch(urlInfo.url, {
    headers: { 'Authorization': `Bearer ${token}` }
  });

  // Create download
  const blob = await fileResponse.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = urlInfo.file_name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
```

### TypeScript Types
```typescript
export interface DocumentPreviewUrlResponse {
  url: string;
  file_name: string;
  content_type: string;
  file_size: number;
  expires_in: number;
}

export async function getDocumentDownloadUrl(
  documentId: number,
  token: string
): Promise<DocumentPreviewUrlResponse> {
  const response = await fetch(
    `/api/v1/documents/${documentId}/download-url`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }
  );

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
}
```

## Testing

### Test Upload with Content Detection
```bash
# Upload a PDF
curl -X POST "http://localhost:8000/api/v1/documents" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@test.pdf" \
  -F "name=Test Document"

# Check response - should have accurate mime_type
```

### Test Download URL
```bash
# Get URL info
curl "http://localhost:8000/api/v1/documents/123/download-url" \
  -H "Authorization: Bearer YOUR_TOKEN" | jq

# Expected output:
# {
#   "url": "/api/v1/documents/123/download",
#   "file_name": "test.pdf",
#   "content_type": "application/pdf",
#   "file_size": 12345,
#   "expires_in": 3600
# }
```

## Configuration

No additional configuration required. Uses existing settings:

```python
# backend/app/config.py
STORAGE_PATH = "/path/to/storage"  # Where files are stored
```

## Dependencies

```toml
# backend/pyproject.toml
dependencies = [
    "python-magic>=0.4.27",
    "python-magic-bin>=0.4.14; platform_system=='Windows'",
]
```

Install:
```bash
pip install python-magic python-magic-bin
```

## Support

For issues or questions:
- Check logs: `docker-compose -f docker-compose.dev.yml logs backend`
- API docs: `http://localhost:8000/docs`
- Error responses include detail messages
