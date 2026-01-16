# CI/CD Pipeline - Visual Architecture

## High-Level Flow

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                         GitHub Repository Event                               │
│                    (Push to main/master or Pull Request)                     │
└──────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                         GitHub Actions Workflow                               │
│                             (.github/workflows/ci.yml)                        │
└──────────────────────────────────────────────────────────────────────────────┘
                                      │
                    ┌─────────────────┼─────────────────┐
                    │                 │                 │
                    ▼                 ▼                 ▼
        ┌───────────────────┐ ┌──────────────┐ ┌──────────────────┐
        │  PARALLEL PHASE   │ │  PARALLEL    │ │   PARALLEL       │
        │   Job Group 1     │ │  Job Group 2 │ │   Job Group 3    │
        └───────────────────┘ └──────────────┘ └──────────────────┘
```

---

## Detailed Job Execution Flow

```
TRIGGER: git push origin main / Pull Request created
  │
  ├─► [PARALLEL EXECUTION] ──────────────────────────────────────────┐
  │                                                                   │
  │   ┌────────────────────────────────────────────────────┐         │
  │   │  JOB 1: LINT (2-4 min)                             │         │
  │   │  ├─ Checkout code                                  │         │
  │   │  ├─ Setup Python 3.12 (cache: pip)                 │         │
  │   │  ├─ Install Ruff                                   │         │
  │   │  ├─ Run: ruff check backend/                       │         │
  │   │  ├─ Setup Node.js 20 (cache: npm)                  │         │
  │   │  ├─ Install frontend deps                          │         │
  │   │  └─ Run: npm run lint                              │         │
  │   └────────────────────────────────────────────────────┘         │
  │                                                                   │
  │   ┌────────────────────────────────────────────────────┐         │
  │   │  JOB 2: TYPE-CHECK (3-5 min)                       │         │
  │   │  ├─ Checkout code                                  │         │
  │   │  ├─ Setup Python 3.12 + dev deps                   │         │
  │   │  ├─ Run: mypy app --show-error-codes               │         │
  │   │  ├─ Setup Node.js 20                               │         │
  │   │  ├─ Install frontend deps                          │         │
  │   │  └─ Run: npm run type-check                        │         │
  │   └────────────────────────────────────────────────────┘         │
  │                                                                   │
  │   ┌────────────────────────────────────────────────────┐         │
  │   │  JOB 3: BACKEND-TEST (5-8 min)                     │         │
  │   │  Services:                                         │         │
  │   │    ├─ PostgreSQL 16 (port 5432)                    │         │
  │   │    └─ Redis 7 (port 6379)                          │         │
  │   │  Steps:                                            │         │
  │   │  ├─ Checkout code                                  │         │
  │   │  ├─ Setup Python 3.12 + dev deps                   │         │
  │   │  ├─ Run: pytest tests/ -v --cov=app               │         │
  │   │  ├─ Generate coverage reports (XML + HTML)        │         │
  │   │  ├─ Upload to Codecov                             │         │
  │   │  └─ Upload HTML coverage artifact                 │         │
  │   └────────────────────────────────────────────────────┘         │
  │                                                                   │
  │   ┌────────────────────────────────────────────────────┐         │
  │   │  JOB 4: FRONTEND-TEST (5-8 min)                    │         │
  │   │  ├─ Checkout code                                  │         │
  │   │  ├─ Setup Node.js 20                               │         │
  │   │  ├─ Install dependencies                           │         │
  │   │  ├─ Run: npm run build                             │         │
  │   │  ├─ Install Playwright (Chromium)                  │         │
  │   │  ├─ Run: npm run test:e2e                          │         │
  │   │  └─ Upload Playwright report artifact              │         │
  │   └────────────────────────────────────────────────────┘         │
  │                                                                   │
  │   ┌────────────────────────────────────────────────────┐         │
  │   │  JOB 5: SECURITY-AUDIT (2-4 min)                   │         │
  │   │  ├─ Checkout code                                  │         │
  │   │  ├─ Setup Python 3.12                              │         │
  │   │  ├─ Install pip-audit                              │         │
  │   │  ├─ Run: pip-audit (Python deps)                   │         │
  │   │  ├─ Setup Node.js 20                               │         │
  │   │  └─ Run: npm audit (Node deps)                     │         │
  │   └────────────────────────────────────────────────────┘         │
  │                                                                   │
  └─► [WAIT FOR: lint, type-check, backend-test] ───────────────────┘
                                      │
                                      ▼
      ┌────────────────────────────────────────────────────┐
      │  JOB 6: BUILD (6-10 min)                           │
      │  Dependencies: lint, type-check, backend-test      │
      │  ├─ Checkout code                                  │
      │  ├─ Setup Docker Buildx                            │
      │  ├─ Build backend image (cache: GHA)               │
      │  ├─ Build frontend image (cache: GHA)              │
      │  └─ Verify image sizes                             │
      └────────────────────────────────────────────────────┘
                                      │
                                      ▼
      ┌────────────────────────────────────────────────────┐
      │  JOB 7: CI-SUCCESS (<1 min)                        │
      │  Dependencies: ALL previous jobs                   │
      │  └─ Print success message                          │
      └────────────────────────────────────────────────────┘
                                      │
                                      ▼
                              ✅ ALL CHECKS PASSED
                              Ready for merge/deploy
```

---

## Service Container Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                    GitHub Actions Runner                      │
│                         (Ubuntu Latest)                       │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  Backend Test Job                                      │  │
│  │                                                        │  │
│  │  ┌──────────────┐      ┌──────────────┐              │  │
│  │  │  PostgreSQL  │      │    Redis     │              │  │
│  │  │  Container   │      │  Container   │              │  │
│  │  │              │      │              │              │  │
│  │  │  postgres:16 │      │  redis:7     │              │  │
│  │  │  Port: 5432  │      │  Port: 6379  │              │  │
│  │  │              │      │              │              │  │
│  │  │  Health:     │      │  Health:     │              │  │
│  │  │  pg_isready  │      │  redis-cli   │              │  │
│  │  └──────────────┘      └──────────────┘              │  │
│  │         ▲                     ▲                       │  │
│  │         │                     │                       │  │
│  │         └──────────┬──────────┘                       │  │
│  │                    │                                  │  │
│  │         ┌──────────▼──────────┐                       │  │
│  │         │  Test Runner        │                       │  │
│  │         │  (Python 3.12)      │                       │  │
│  │         │                     │                       │  │
│  │         │  pytest tests/      │                       │  │
│  │         │  --cov=app          │                       │  │
│  │         └─────────────────────┘                       │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

---

## Caching Strategy

```
┌─────────────────────────────────────────────────────────────┐
│                     First Run (Cold Cache)                   │
│                         ~15 minutes                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  Download    │  │  Download    │  │  Build       │     │
│  │  Python Deps │  │  Node Deps   │  │  Docker      │     │
│  │              │  │              │  │  Layers      │     │
│  │  ~2 min      │  │  ~3 min      │  │  ~8 min      │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│         │                 │                 │              │
│         └────────┬────────┴────────┬────────┘              │
│                  │                 │                        │
│                  ▼                 ▼                        │
│         ┌──────────────┐  ┌──────────────┐                │
│         │   Cache to   │  │   Cache to   │                │
│         │   GitHub     │  │   GitHub     │                │
│         │   Actions    │  │   Actions    │                │
│         └──────────────┘  └──────────────┘                │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  Subsequent Runs (Warm Cache)                │
│                         ~10 minutes                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  Restore     │  │  Restore     │  │  Restore     │     │
│  │  Python Deps │  │  Node Deps   │  │  Docker      │     │
│  │              │  │              │  │  Layers      │     │
│  │  ~30 sec     │  │  ~30 sec     │  │  ~2 min      │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                             │
│  ⚡ 40% faster!                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Artifact Generation & Upload

```
After Tests Complete:
  │
  ├─► Backend Coverage Report
  │     ├─ coverage.xml  ────────► Codecov.io (external)
  │     └─ htmlcov/      ────────► GitHub Artifacts (7 days)
  │
  └─► Frontend Test Report
        └─ playwright-report/ ──► GitHub Artifacts (7 days)
            ├─ index.html
            ├─ screenshots/
            └─ videos/

Access via: GitHub Actions → Workflow Run → Artifacts section
```

---

## Decision Flow: Merge/Block

```
CI Pipeline Complete
  │
  ├─► All jobs PASSED? ────────► YES ─► ✅ Allow Merge
  │                                      │
  │                                      ├─ Update PR status: ✓
  │                                      ├─ Show green checkmark
  │                                      └─ Enable "Merge" button
  │
  └─► Any job FAILED? ─────────► YES ─► ❌ Block Merge
                                         │
                                         ├─ Update PR status: ✗
                                         ├─ Show red X
                                         ├─ Disable "Merge" button
                                         └─ Show failed job details
```

---

## Performance Optimization Layers

```
┌─────────────────────────────────────────────────────────────┐
│  Layer 1: Parallel Execution                                 │
│  ├─ Run 5 jobs simultaneously                                │
│  └─ Time saved: ~8 minutes (vs sequential)                   │
├─────────────────────────────────────────────────────────────┤
│  Layer 2: Dependency Caching                                 │
│  ├─ Python pip cache (setup-python@v5)                       │
│  ├─ Node npm cache (setup-node@v4)                           │
│  └─ Time saved: ~5 minutes per run                           │
├─────────────────────────────────────────────────────────────┤
│  Layer 3: Docker Build Cache                                 │
│  ├─ GitHub Actions cache (type=gha)                          │
│  ├─ BuildKit inline cache                                    │
│  └─ Time saved: ~6 minutes per build                         │
├─────────────────────────────────────────────────────────────┤
│  Layer 4: Smart Job Dependencies                             │
│  ├─ Build job waits for critical checks only                 │
│  ├─ Security audit runs in parallel                          │
│  └─ Time saved: ~3 minutes                                   │
└─────────────────────────────────────────────────────────────┘

Total Optimization: ~22 minutes saved (15 min vs 37 min sequential)
```

---

## Security Scanning Flow

```
Security Audit Job
  │
  ├─► Python Dependencies
  │     └─ pip-audit --desc --skip-editable
  │         ├─ Check against CVE database
  │         ├─ Report vulnerabilities
  │         └─ Non-blocking (warnings only)
  │
  └─► Node.js Dependencies
        └─ npm audit --audit-level=moderate
            ├─ Check npm registry
            ├─ Report moderate+ severity
            └─ Non-blocking (warnings only)

Output: Security report in job logs
Action: Manual review required for vulnerabilities
```

---

## Workflow File Structure

```
.github/workflows/ci.yml
├─ name: CI
├─ on: [push, pull_request]
├─ env: Global variables
│   ├─ PYTHON_VERSION: 3.12
│   ├─ NODE_VERSION: 20
│   ├─ POSTGRES_VERSION: 16
│   └─ REDIS_VERSION: 7
│
└─ jobs:
    ├─ lint (2-4 min)
    │   ├─ Python: Ruff
    │   └─ TypeScript: ESLint
    │
    ├─ type-check (3-5 min)
    │   ├─ Python: MyPy
    │   └─ TypeScript: tsc
    │
    ├─ backend-test (5-8 min)
    │   ├─ Services: PostgreSQL + Redis
    │   ├─ Tests: pytest
    │   └─ Coverage: Upload reports
    │
    ├─ frontend-test (5-8 min)
    │   ├─ Build: npm run build
    │   ├─ E2E: Playwright
    │   └─ Artifacts: Test report
    │
    ├─ security-audit (2-4 min)
    │   ├─ Python: pip-audit
    │   └─ Node: npm audit
    │
    ├─ build (6-10 min)
    │   ├─ Depends: [lint, type-check, backend-test]
    │   ├─ Backend: Docker build
    │   └─ Frontend: Docker build
    │
    └─ ci-success (<1 min)
        └─ Depends: All jobs
```

---

## Timeline Visualization

```
Time (min)  │  Job Execution
────────────┼────────────────────────────────────────────────────
     0      │  ■ Start all parallel jobs
            │  ├─ lint
            │  ├─ type-check
            │  ├─ backend-test
            │  ├─ frontend-test
            │  └─ security-audit
            │
     2      │  ■ lint complete ✓
            │
     3      │  ■ security-audit complete ✓
            │
     4      │  ■ type-check complete ✓
            │
     6      │  ■ backend-test complete ✓
            │  ■ Start build job (dependency met)
            │
     7      │  ■ frontend-test complete ✓
            │
    12      │  ■ build complete ✓
            │  ■ Start ci-success job
            │
    13      │  ■ ci-success complete ✓
            │  ✅ ALL JOBS PASSED
```

---

**Legend:**
- ■ Job start/complete
- ✓ Success
- ✗ Failure
- → Sequential dependency
- ├─ Parallel execution

**Total Runtime:** 10-15 minutes (warm cache)
**Jobs:** 7 total (5 parallel + 2 sequential)
**Success Rate Target:** >95%
