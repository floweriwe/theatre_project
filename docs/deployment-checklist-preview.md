# Deployment Checklist: Document Preview Feature

Step-by-step guide to deploy the document preview feature.

## Pre-Deployment

### 1. Code Review
- [ ] Review `backend/app/services/document_service.py` changes
- [ ] Review `backend/app/api/v1/documents.py` changes
- [ ] Review `backend/pyproject.toml` dependencies
- [ ] Check Python syntax: `python -m py_compile app/services/document_service.py`
- [ ] Check Python syntax: `python -m py_compile app/api/v1/documents.py`

### 2. Testing (Local)
- [ ] Install new dependencies: `pip install -e .`
- [ ] Start backend: `uvicorn app.main:app --reload`
- [ ] Upload test DOCX file
- [ ] Request preview endpoint
- [ ] Verify PDF is generated
- [ ] Test cache (2nd request should be instant)
- [ ] Test error cases (unsupported file, missing document)

### 3. Documentation Review
- [ ] Read `docs/document-conversion-mvp.md`
- [ ] Read `docs/task-2-summary.md`
- [ ] Read `docs/api-preview-endpoint.md`
- [ ] Understand limitations and trade-offs

## Deployment to Development

### 1. Update Dependencies
```bash
cd /c/Work/projects/theatre/theatre_app_2026/backend

# If using Docker
docker-compose -f docker-compose.dev.yml down
docker-compose -f docker-compose.dev.yml build backend
docker-compose -f docker-compose.dev.yml up -d

# If using local environment
pip install -e .
```

### 2. Verify Storage Directories
```bash
# Ensure storage directory exists
mkdir -p /app/storage/documents
mkdir -p /app/storage/previews

# Set permissions (if needed)
chmod 755 /app/storage/previews
```

### 3. Test Endpoints
```bash
# Set your token
TOKEN="your_jwt_token_here"

# Test 1: Upload DOCX
DOC_ID=$(curl -X POST http://localhost:8000/api/v1/documents \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@test.docx" \
  -F "name=Test Document" \
  -F "is_public=false" \
  | jq -r '.id')

echo "Created document ID: $DOC_ID"

# Test 2: Request preview (first time)
time curl -X GET "http://localhost:8000/api/v1/documents/$DOC_ID/preview" \
  -H "Authorization: Bearer $TOKEN" \
  --output preview1.pdf

# Should take 0.5-2 seconds
echo "First preview created"

# Test 3: Request preview (cached)
time curl -X GET "http://localhost:8000/api/v1/documents/$DOC_ID/preview" \
  -H "Authorization: Bearer $TOKEN" \
  --output preview2.pdf

# Should be instant
echo "Cached preview returned"

# Test 4: Verify PDFs
file preview1.pdf  # Should show "PDF document"
file preview2.pdf  # Should show "PDF document"

# Test 5: Check preview file created
ls -lh /app/storage/previews/doc_${DOC_ID}_preview.pdf
```

### 4. Test Error Cases
```bash
# Test non-existent document
curl -X GET "http://localhost:8000/api/v1/documents/99999/preview" \
  -H "Authorization: Bearer $TOKEN" \
  -v
# Expected: 404

# Test unauthorized access
curl -X GET "http://localhost:8000/api/v1/documents/$DOC_ID/preview" \
  -v
# Expected: 401

# Upload image and request preview
IMG_ID=$(curl -X POST http://localhost:8000/api/v1/documents \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@test.png" \
  -F "name=Test Image" \
  | jq -r '.id')

curl -X GET "http://localhost:8000/api/v1/documents/$IMG_ID/preview" \
  -H "Authorization: Bearer $TOKEN" \
  -v
# Expected: 400
```

### 5. Monitor Logs
```bash
# Watch backend logs for errors
docker-compose -f docker-compose.dev.yml logs -f backend

# Look for:
# - Conversion errors
# - File I/O errors
# - Python exceptions
```

## Deployment to Staging

### 1. Environment Setup
```bash
# Ensure environment variables are set
# .env or docker-compose.yml
STORAGE_PATH=/app/storage
```

### 2. Deploy Code
```bash
# Pull latest code
git checkout feature/document-preview
git pull origin feature/document-preview

# Build and deploy
docker-compose -f docker-compose.staging.yml build backend
docker-compose -f docker-compose.staging.yml up -d backend
```

### 3. Smoke Tests
```bash
# Run same tests as dev, but against staging URL
STAGING_URL="https://staging.theatre.example.com"
TOKEN="staging_token"

# Upload and preview
curl -X POST "$STAGING_URL/api/v1/documents" \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@test.docx" \
  -F "name=Staging Test" \
  | jq '.'

# Verify preview works
curl -X GET "$STAGING_URL/api/v1/documents/1/preview" \
  -H "Authorization: Bearer $TOKEN" \
  --output staging_preview.pdf

file staging_preview.pdf
```

### 4. Performance Testing
```bash
# Test concurrent requests
for i in {1..10}; do
  curl -X GET "$STAGING_URL/api/v1/documents/1/preview" \
    -H "Authorization: Bearer $TOKEN" \
    --output preview_${i}.pdf &
done
wait

# Check response times
# Should all be fast (cached)
```

## Deployment to Production

### 1. Pre-Production Checklist
- [ ] All staging tests passed
- [ ] Code reviewed and approved
- [ ] Documentation updated
- [ ] Rollback plan prepared
- [ ] Monitoring configured

### 2. Deployment Steps
```bash
# 1. Backup current system
docker-compose -f docker-compose.prod.yml exec backend \
  tar -czf /backup/storage_$(date +%Y%m%d).tar.gz /app/storage

# 2. Deploy new version
git checkout master
git merge feature/document-preview
git push origin master

# 3. Build and restart
docker-compose -f docker-compose.prod.yml build backend
docker-compose -f docker-compose.prod.yml up -d backend

# 4. Wait for health check
sleep 10
curl http://localhost:8000/health

# 5. Verify endpoint available
curl -I http://localhost:8000/api/v1/documents/1/preview \
  -H "Authorization: Bearer $PROD_TOKEN"
```

### 3. Post-Deployment Validation
```bash
# Test with real documents
# 1. PDF passthrough
# 2. DOCX conversion
# 3. Error handling

# Monitor metrics
# - Response times
# - Error rates
# - Conversion success rate
```

### 4. Monitoring Setup
```python
# Add to monitoring dashboard

# Metrics to track:
- preview_requests_total
- preview_requests_cached
- preview_conversion_duration_seconds
- preview_errors_total
- preview_storage_size_bytes

# Alerts to configure:
- Conversion failure rate > 5%
- Average response time > 3 seconds
- Storage size > 10GB
- Error rate spike
```

## Post-Deployment

### 1. User Communication
```markdown
**New Feature: Document Preview**

You can now preview DOCX documents directly in your browser without downloading.

How to use:
1. Go to Documents page
2. Click "Preview" button on any DOCX file
3. View in browser or download

Note: Preview shows plain text. Download original for full formatting.
```

### 2. Monitor First Week
- [ ] Check error logs daily
- [ ] Review conversion success rate
- [ ] Monitor storage growth
- [ ] Collect user feedback

### 3. Maintenance Plan
```bash
# Weekly: Check preview directory size
du -sh /app/storage/previews/

# Monthly: Clean old previews (if needed)
find /app/storage/previews -mtime +30 -delete

# Quarterly: Review and optimize
# - Check for common conversion failures
# - Update libraries if needed
# - Consider Phase 2 improvements
```

## Rollback Plan

If issues arise, follow this rollback procedure:

### 1. Immediate Rollback
```bash
# Revert to previous version
git revert HEAD
git push origin master

# Rebuild and redeploy
docker-compose -f docker-compose.prod.yml build backend
docker-compose -f docker-compose.prod.yml up -d backend

# Verify health
curl http://localhost:8000/health
```

### 2. Data Cleanup (if needed)
```bash
# Remove preview files if causing issues
rm -rf /app/storage/previews/*

# Restore from backup if needed
tar -xzf /backup/storage_YYYYMMDD.tar.gz -C /
```

### 3. Communication
```markdown
**Service Update**

Document preview feature has been temporarily disabled due to technical issues.
Documents can still be downloaded normally.

We're working on a fix and will restore the feature soon.
```

## Troubleshooting

### Issue: Preview returns 500 error

**Diagnosis:**
```bash
# Check backend logs
docker-compose -f docker-compose.prod.yml logs backend | grep ERROR

# Common causes:
# - Corrupted DOCX file
# - python-docx not installed
# - Storage directory not writable
```

**Fix:**
```bash
# Verify dependencies
docker-compose exec backend pip list | grep -E "(docx|reportlab)"

# Check permissions
docker-compose exec backend ls -la /app/storage/previews/

# Test conversion manually
docker-compose exec backend python -c "
from docx import Document
from reportlab.pdfgen import canvas
print('Libraries OK')
"
```

### Issue: Slow preview generation

**Diagnosis:**
```bash
# Check file sizes
du -sh /app/storage/documents/*

# Check system resources
docker stats backend
```

**Fix:**
```bash
# If documents are very large, consider:
# 1. Add timeout to conversion
# 2. Limit DOCX file size
# 3. Implement async conversion queue
```

### Issue: Storage filling up

**Diagnosis:**
```bash
# Check preview directory size
du -sh /app/storage/previews/
ls /app/storage/previews/ | wc -l
```

**Fix:**
```bash
# Clear old previews
find /app/storage/previews -mtime +7 -delete

# Implement automated cleanup
# Add to crontab:
0 2 * * * find /app/storage/previews -mtime +30 -delete
```

## Success Metrics

Track these KPIs:

1. **Feature Adoption**
   - Preview requests per day
   - Unique users using preview
   - Preview vs download ratio

2. **Performance**
   - Average conversion time: < 2 seconds
   - Cache hit rate: > 80%
   - Error rate: < 2%

3. **Storage**
   - Preview storage growth rate
   - Average preview file size
   - Storage efficiency (preview vs original)

## Next Steps

After successful deployment:

1. **Gather Feedback**
   - Survey users about preview quality
   - Collect common issues
   - Identify documents that fail conversion

2. **Plan Phase 2**
   - Evaluate need for LibreOffice
   - Consider async conversion
   - Plan for table/image support

3. **Optimize**
   - Profile conversion performance
   - Implement caching strategies
   - Add telemetry and metrics

## Contacts

For issues or questions:

- **Backend Lead**: [Contact info]
- **DevOps**: [Contact info]
- **Documentation**: `docs/document-conversion-mvp.md`
- **Architecture**: `docs/document-preview-architecture.md`
