# Document Preview API Endpoint

Quick reference for using the document preview feature.

## Endpoint

```
GET /api/v1/documents/{document_id}/preview
```

## Authentication

Required. Include JWT token in Authorization header.

## Supported File Types

| File Type | Behavior |
|-----------|----------|
| PDF | Returns original file |
| DOCX | Converts to simplified PDF |
| DOC | Attempts conversion (limited support) |
| Other | Returns 400 Bad Request |

## Response

### Success (200 OK)
```
Content-Type: application/pdf
Content-Disposition: attachment; filename="preview_filename.pdf"

[PDF binary data]
```

### Errors

| Status | Reason |
|--------|--------|
| 400 | Preview not available for file type |
| 401 | Not authenticated |
| 404 | Document not found |
| 500 | Conversion failed |

## Examples

### cURL
```bash
# Request preview
curl -X GET http://localhost:8000/api/v1/documents/123/preview \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  --output preview.pdf

# Open in browser
open preview.pdf
```

### JavaScript (Frontend)
```javascript
// Fetch preview
async function previewDocument(documentId) {
  const response = await fetch(
    `/api/v1/documents/${documentId}/preview`,
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );

  if (!response.ok) {
    throw new Error('Preview not available');
  }

  // Get blob and create URL
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);

  // Display in iframe
  document.getElementById('pdf-viewer').src = url;
}
```

### React Component Example
```jsx
import { useState } from 'react';

function DocumentPreview({ documentId }) {
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadPreview = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/v1/documents/${documentId}/preview`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('Preview not available');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {!previewUrl && (
        <button onClick={loadPreview} disabled={loading}>
          {loading ? 'Loading...' : 'Show Preview'}
        </button>
      )}

      {error && <p style={{color: 'red'}}>{error}</p>}

      {previewUrl && (
        <iframe
          src={previewUrl}
          width="100%"
          height="600px"
          title="Document Preview"
        />
      )}
    </div>
  );
}
```

## Performance Notes

### First Request
- DOCX conversion: 0.5-2 seconds
- PDF passthrough: Instant

### Subsequent Requests
- All cached previews: Instant
- Preview PDFs stored in `/app/storage/previews/`

## Limitations (MVP)

Preview shows **plain text only** from DOCX:
- ❌ No bold/italic/colors
- ❌ No tables
- ❌ No images
- ❌ No headers/footers
- ✅ Plain text paragraphs
- ✅ Basic document structure

For full fidelity, use download endpoint:
```
GET /api/v1/documents/{document_id}/download
```

## Integration with UI

### Recommended UX Flow

1. **Document List View**
   ```
   [Document.docx] [Preview] [Download]
   ```

2. **On Preview Click**
   - Show loading spinner
   - Request preview endpoint
   - Display PDF in modal or new tab

3. **Error Handling**
   - If preview fails, show "Download original" button
   - Display helpful error message

### Example Button Component
```jsx
function PreviewButton({ document }) {
  const canPreview = ['application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword'
  ].includes(document.mimeType);

  if (!canPreview) {
    return (
      <Tooltip title="Preview not available for this file type">
        <Button disabled>Preview</Button>
      </Tooltip>
    );
  }

  return (
    <Button onClick={() => window.open(
      `/api/v1/documents/${document.id}/preview`,
      '_blank'
    )}>
      Preview
    </Button>
  );
}
```

## Testing

### Manual Test Script
```bash
# 1. Upload DOCX
DOC_ID=$(curl -X POST http://localhost:8000/api/v1/documents \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@test.docx" \
  -F "name=Test" \
  | jq -r '.id')

# 2. Request preview
curl -X GET http://localhost:8000/api/v1/documents/$DOC_ID/preview \
  -H "Authorization: Bearer $TOKEN" \
  --output test_preview.pdf

# 3. Verify PDF
file test_preview.pdf  # Should show "PDF document"

# 4. Test caching (should be instant)
time curl -X GET http://localhost:8000/api/v1/documents/$DOC_ID/preview \
  -H "Authorization: Bearer $TOKEN" \
  --output test_preview2.pdf
```

### Automated Tests
```python
# tests/test_document_preview.py
import pytest
from pathlib import Path

async def test_preview_pdf_returns_original(client, auth_headers, pdf_document):
    response = await client.get(
        f"/api/v1/documents/{pdf_document.id}/preview",
        headers=auth_headers
    )
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/pdf"

async def test_preview_docx_creates_pdf(client, auth_headers, docx_document):
    response = await client.get(
        f"/api/v1/documents/{docx_document.id}/preview",
        headers=auth_headers
    )
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/pdf"

    # Verify preview file was created
    preview_path = Path(f"/app/storage/previews/doc_{docx_document.id}_preview.pdf")
    assert preview_path.exists()

async def test_preview_unsupported_file_returns_400(client, auth_headers, image_document):
    response = await client.get(
        f"/api/v1/documents/{image_document.id}/preview",
        headers=auth_headers
    )
    assert response.status_code == 400
```

## Troubleshooting

### Preview returns 500 error
- Check if DOCX is corrupted
- Verify python-docx and reportlab are installed
- Check backend logs for conversion errors

### Preview shows garbled text
- Document might have encoding issues
- Try downloading original DOCX
- Report if consistent issue

### Preview is blank
- Document might be empty
- Check if DOCX has actual text content
- Verify not password-protected

## Future Improvements

Coming in Phase 2:
- High-fidelity conversion with LibreOffice
- Table and image support
- Better formatting preservation
- Excel and PowerPoint preview
- Thumbnail generation
