# CI/CD Quick Reference Card

## 🚀 Local Testing Commands

### Before Pushing Code
```bash
# Backend checks
cd backend
ruff check .                    # Linting
mypy app                        # Type checking
pytest tests/ -v                # Run tests

# Frontend checks
cd frontend
npm run lint                    # ESLint
npm run type-check              # TypeScript
npm run build                   # Build verification
npm run test:e2e                # E2E tests (optional)
```

---

## 📊 CI Pipeline Jobs

| Job            | Duration | Blocks Merge | Purpose                        |
|----------------|----------|--------------|--------------------------------|
| Lint           | 2-4 min  | ✅ Yes       | Code style validation          |
| Type Check     | 3-5 min  | ⚠️ Partial   | Static type analysis           |
| Backend Test   | 5-8 min  | ✅ Yes       | Unit + integration tests       |
| Frontend Test  | 5-8 min  | ⚠️ Partial   | Build + E2E tests              |
| Build          | 6-10 min | ✅ Yes       | Docker image verification      |
| Security Audit | 2-4 min  | ⚠️ Partial   | Dependency vulnerabilities     |

**Total Time:** 10-15 minutes (parallel execution)

---

## 🔧 Fix Common Failures

### Linting Failed
```bash
# Auto-fix Python issues
ruff check --fix backend/

# Auto-fix JavaScript issues
cd frontend && npm run lint:fix
```

### Type Errors
```bash
# Check TypeScript errors
cd frontend && npm run type-check

# Check Python types
cd backend && mypy app --show-error-codes
```

### Test Failures
```bash
# Run specific test
pytest tests/test_auth.py -v

# Run with detailed output
pytest tests/ -vv --tb=long

# Run only failed tests
pytest --lf
```

### Docker Build Failed
```bash
# Test backend build
docker build -t test-backend ./backend

# Test frontend build
docker build -t test-frontend ./frontend

# Check for syntax errors
docker-compose config
```

---

## 📁 Generated Artifacts

Access via GitHub Actions → Run → Artifacts section

| Artifact Name            | Contains                     | Size    |
|--------------------------|------------------------------|---------|
| backend-coverage-report  | HTML coverage report         | ~2-5 MB |
| playwright-report        | E2E test results + videos    | ~10-50 MB |

**Retention:** 7 days

---

## 🔐 Environment Variables

### CI Environment
```bash
DATABASE_URL=postgresql+asyncpg://theatre_test:***@localhost:5432/theatre_test
REDIS_URL=redis://localhost:6379/0
JWT_SECRET_KEY=test-secret-key-for-ci-only
ENVIRONMENT=test
```

⚠️ **Never use CI credentials in production!**

---

## ⚡ Performance Tips

### Speed Up Local Development
```bash
# Run only unit tests (fast)
pytest tests/unit/ -v

# Skip slow tests
pytest -m "not slow"

# Parallel test execution
pytest -n auto
```

### Optimize Docker Builds
```bash
# Use BuildKit
export DOCKER_BUILDKIT=1

# Multi-stage builds
docker build --target production ./backend
```

---

## 📞 Getting Help

### Check CI Logs
1. Go to GitHub Actions tab
2. Click failed workflow run
3. Expand failed job
4. Read error messages

### Debug Locally
```bash
# Install act (GitHub Actions runner)
choco install act  # Windows
brew install act   # macOS

# Run specific job
act -j lint
act -j backend-test --container-architecture linux/amd64
```

### Common Issues

**"Module not found"**
→ Run `npm ci` or `pip install -e ".[dev]"`

**"Database connection failed"**
→ Start services: `docker-compose -f docker-compose.dev.yml up -d`

**"Port already in use"**
→ Stop conflicting services: `docker-compose down`

---

## 🎯 CI Success Checklist

Before creating a PR:

- [ ] All tests pass locally
- [ ] Linting passes (`ruff` + `eslint`)
- [ ] Type checking passes
- [ ] Docker builds successfully
- [ ] No new security vulnerabilities
- [ ] Code coverage maintained/improved
- [ ] Branch is up-to-date with main

---

## 📚 Related Documentation

- **Full CI/CD Guide:** `docs/ci-cd-pipeline.md`
- **Architecture:** `.claude/memory-bank/02_ARCHITECTURE.md`
- **Testing Guide:** (TBD)

---

**Last Updated:** 2026-01-17
