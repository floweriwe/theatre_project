# CI/CD Pipeline Documentation

## Overview

The Theatre Management System uses GitHub Actions for automated continuous integration and continuous deployment. The pipeline ensures code quality, tests functionality, and verifies builds before merging changes.

**File Location:** `.github/workflows/ci.yml`

---

## Pipeline Triggers

The CI pipeline runs automatically on:
- **Push** to `main` or `master` branches
- **Pull Requests** targeting `main` or `master` branches

---

## Pipeline Jobs

### 1. **Lint** (Code Quality)
**Duration:** ~3-5 minutes
**Dependencies:** None

Validates code style and quality standards:
- **Python:** Runs `ruff check` on backend code
- **TypeScript:** Runs ESLint on frontend code

**Success Criteria:**
- No linting errors
- Code follows project style guidelines

---

### 2. **Type Check** (Static Analysis)
**Duration:** ~3-5 minutes
**Dependencies:** None

Performs static type checking:
- **Python:** MyPy type checking (non-blocking)
- **TypeScript:** `tsc --noEmit` validation

**Success Criteria:**
- TypeScript builds without type errors
- MyPy warnings logged but don't block CI

---

### 3. **Backend Test** (Unit & Integration)
**Duration:** ~5-8 minutes
**Dependencies:** None

Runs comprehensive backend tests with coverage:

**Infrastructure:**
- PostgreSQL 16 (test database)
- Redis 7 (cache service)

**Test Execution:**
```bash
pytest tests/ -v --cov=app --cov-report=xml
```

**Coverage Reports:**
- Uploaded to Codecov (if configured)
- HTML report available as artifact
- Minimum coverage tracked

**Environment Variables:**
```bash
DATABASE_URL=postgresql+asyncpg://theatre_test:***@localhost:5432/theatre_test
REDIS_URL=redis://localhost:6379/0
JWT_SECRET_KEY=test-secret-key-for-ci-only
ENVIRONMENT=test
```

**Success Criteria:**
- All tests pass
- Coverage report generated
- No database connection issues

---

### 4. **Frontend Test** (Build & E2E)
**Duration:** ~5-8 minutes
**Dependencies:** None

Validates frontend build and runs E2E tests:

**Steps:**
1. TypeScript build (`npm run build`)
2. Install Playwright browsers (Chromium)
3. Run E2E tests (`npm run test:e2e`)

**Artifacts:**
- Playwright test report
- Build output validation

**Success Criteria:**
- TypeScript compiles without errors
- E2E tests pass (non-blocking for now)

---

### 5. **Build** (Docker Verification)
**Duration:** ~5-10 minutes
**Dependencies:** `lint`, `type-check`, `backend-test`

Verifies Docker builds work correctly:

**Backend Build:**
```bash
docker build -t theatre-backend:ci-${GITHUB_SHA} ./backend
```

**Frontend Build:**
```bash
docker build -t theatre-frontend:ci-${GITHUB_SHA} ./frontend
```

**Optimizations:**
- Uses Docker Buildx
- GitHub Actions cache (type=gha)
- BuildKit inline cache

**Success Criteria:**
- Both images build successfully
- Image sizes within reasonable limits
- No build errors

---

### 6. **Security Audit** (Vulnerability Scanning)
**Duration:** ~3-5 minutes
**Dependencies:** None

Scans dependencies for known vulnerabilities:

**Python:**
```bash
pip-audit --desc --skip-editable
```

**Node.js:**
```bash
npm audit --audit-level=moderate
```

**Success Criteria:**
- No critical vulnerabilities
- Moderate issues logged (non-blocking)

---

### 7. **CI Success** (Summary)
**Duration:** <1 minute
**Dependencies:** All previous jobs

Final job that runs only if all checks pass. Provides a clear success indicator.

---

## Caching Strategy

The pipeline uses multiple caching layers to improve performance:

### Dependency Caches
- **Python pip:** `actions/setup-python@v5` with `cache: 'pip'`
- **Node modules:** `actions/setup-node@v4` with `cache: 'npm'`
- **Docker layers:** GitHub Actions cache (`type=gha`)

### Cache Benefits
- **First run:** ~12-15 minutes
- **Cached runs:** ~8-10 minutes
- **Saves:** ~40% build time

---

## Environment Variables

Global variables used across jobs:

```yaml
PYTHON_VERSION: '3.12'
NODE_VERSION: '20'
POSTGRES_VERSION: '16'
REDIS_VERSION: '7'
```

---

## Artifacts & Reports

The pipeline generates several artifacts:

### Backend Coverage Report
- **Path:** `backend/htmlcov/`
- **Retention:** 7 days
- **Format:** HTML + XML

### Playwright E2E Report
- **Path:** `frontend/playwright-report/`
- **Retention:** 7 days
- **Format:** HTML with screenshots/videos

### How to Access Artifacts
1. Go to GitHub Actions run
2. Scroll to "Artifacts" section
3. Download report zip files

---

## Workflow Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    PR/Push Trigger                       │
└─────────────────────────────────────────────────────────┘
                           │
          ┌────────────────┼────────────────┐
          │                │                │
          ▼                ▼                ▼
     ┌────────┐      ┌──────────┐     ┌────────────┐
     │  Lint  │      │Type Check│     │Backend Test│
     └────────┘      └──────────┘     └────────────┘
          │                │                │
          │                │                │
          └────────────────┼────────────────┘
                           │
                           ▼
                    ┌──────────┐
                    │  Build   │
                    └──────────┘
                           │
                           ▼
                  ┌────────────────┐
                  │  CI Success ✅  │
                  └────────────────┘
```

---

## Troubleshooting

### Common Issues

#### 1. **Linting Failures**
```bash
# Local fix
cd backend && ruff check . --fix
cd frontend && npm run lint:fix
```

#### 2. **Type Check Errors**
```bash
# Frontend
cd frontend && npm run type-check

# Backend
cd backend && mypy app
```

#### 3. **Test Failures**
```bash
# Run tests locally with same environment
docker-compose -f docker-compose.dev.yml up -d postgres redis
cd backend && pytest tests/ -v
```

#### 4. **Docker Build Issues**
```bash
# Test build locally
docker build -t test-backend ./backend
docker build -t test-frontend ./frontend
```

### Debug Mode

To debug CI issues locally:

```bash
# Install act (GitHub Actions local runner)
# https://github.com/nektos/act

# Run specific job
act -j lint
act -j backend-test
```

---

## Performance Benchmarks

Typical execution times:

| Job           | Cold Cache | Warm Cache | Notes                    |
|---------------|------------|------------|--------------------------|
| Lint          | 4 min      | 2 min      | Fast, parallel checks    |
| Type Check    | 5 min      | 3 min      | TypeScript compilation   |
| Backend Test  | 8 min      | 5 min      | Includes DB setup        |
| Frontend Test | 7 min      | 4 min      | Includes Playwright      |
| Build         | 10 min     | 6 min      | Docker layer caching     |
| Security      | 4 min      | 2 min      | Dependency scanning      |
| **Total**     | **15 min** | **10 min** | Parallel execution       |

---

## Security Considerations

### Secrets Management

Required secrets (configure in GitHub Settings → Secrets):

```yaml
# Optional - for Codecov integration
CODECOV_TOKEN: <your-token>

# Production deployments (future)
DOCKER_USERNAME: <registry-username>
DOCKER_PASSWORD: <registry-password>
AWS_ACCESS_KEY_ID: <aws-key>
AWS_SECRET_ACCESS_KEY: <aws-secret>
```

### Test Credentials

Test database credentials are **hardcoded** in CI config:
- User: `theatre_test`
- Password: `test_password_secure_123`
- Database: `theatre_test`

**⚠️ These are for CI only and should NEVER be used in production!**

---

## Future Enhancements

### Planned Improvements

1. **Deployment Automation**
   - Staging deployment on merge to `develop`
   - Production deployment on merge to `main`
   - Blue-green deployment strategy

2. **Enhanced Testing**
   - Visual regression testing
   - Performance benchmarking
   - Load testing integration

3. **Code Quality Gates**
   - Minimum coverage thresholds (80%)
   - Code duplication detection
   - Complexity metrics

4. **Notifications**
   - Slack/Discord integration
   - Email notifications on failures
   - Status badges in README

5. **Security**
   - Container image scanning (Trivy)
   - SAST/DAST tools
   - Dependency update automation (Dependabot)

---

## Best Practices

### For Developers

1. **Run checks locally before pushing:**
   ```bash
   # Backend
   cd backend
   ruff check .
   mypy app
   pytest tests/

   # Frontend
   cd frontend
   npm run lint
   npm run type-check
   npm run build
   ```

2. **Keep CI green:**
   - Don't push failing code
   - Fix CI breaks immediately
   - Monitor build times

3. **Review CI logs:**
   - Check warnings
   - Review coverage reports
   - Update dependencies regularly

### For Maintainers

1. **Monitor pipeline health:**
   - Track success rates
   - Optimize slow jobs
   - Update dependencies

2. **Security:**
   - Review security audit reports
   - Update vulnerable packages
   - Rotate secrets regularly

3. **Performance:**
   - Keep total runtime < 15 min
   - Use caching effectively
   - Parallelize jobs

---

## Contact

For CI/CD pipeline issues:
- Create an issue with label `ci/cd`
- Include workflow run URL
- Attach relevant logs

---

**Last Updated:** 2026-01-17
**Pipeline Version:** 1.0.0
**Maintained By:** Theatre DevOps Team
