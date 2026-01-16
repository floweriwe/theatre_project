# CI/CD Status Badges

Add these badges to your README.md to show CI status:

## GitHub Actions Workflow Badge

```markdown
[![CI Pipeline](https://github.com/USERNAME/REPO/workflows/CI/badge.svg)](https://github.com/USERNAME/REPO/actions/workflows/ci.yml)
```

## Coverage Badge (Codecov)

First, set up Codecov:
1. Go to https://codecov.io/
2. Connect your GitHub repository
3. Add `CODECOV_TOKEN` to GitHub Secrets
4. Add badge to README:

```markdown
[![codecov](https://codecov.io/gh/USERNAME/REPO/branch/main/graph/badge.svg)](https://codecov.io/gh/USERNAME/REPO)
```

## Custom Status Shields

### Build Status
```markdown
![Build](https://img.shields.io/github/actions/workflow/status/USERNAME/REPO/ci.yml?label=build&logo=github)
```

### Test Coverage
```markdown
![Coverage](https://img.shields.io/codecov/c/github/USERNAME/REPO?logo=codecov)
```

### Last Commit
```markdown
![Last Commit](https://img.shields.io/github/last-commit/USERNAME/REPO?logo=github)
```

### License
```markdown
![License](https://img.shields.io/badge/license-Proprietary-red)
```

### Python Version
```markdown
![Python](https://img.shields.io/badge/python-3.12-blue?logo=python)
```

### Node Version
```markdown
![Node](https://img.shields.io/badge/node-20-green?logo=node.js)
```

---

## Example README Header

```markdown
# Theatre Management System

[![CI Pipeline](https://github.com/USERNAME/REPO/workflows/CI/badge.svg)](https://github.com/USERNAME/REPO/actions)
[![codecov](https://codecov.io/gh/USERNAME/REPO/branch/main/graph/badge.svg)](https://codecov.io/gh/USERNAME/REPO)
![Python](https://img.shields.io/badge/python-3.12-blue?logo=python)
![Node](https://img.shields.io/badge/node-20-green?logo=node.js)

> Информационная система автоматизации театра | MVP v0.1.0

## Tech Stack

- **Backend:** FastAPI + PostgreSQL + SQLAlchemy
- **Frontend:** React + TypeScript + Vite
- **Infrastructure:** Docker + Redis + MinIO
- **CI/CD:** GitHub Actions

## Quick Start

\`\`\`bash
# Clone repository
git clone https://github.com/USERNAME/REPO.git
cd theatre_app_2026

# Start development environment
docker-compose -f docker-compose.dev.yml up -d

# Initialize database
docker-compose -f docker-compose.dev.yml exec backend python -m scripts.init_db
\`\`\`

## Development

See [Documentation](./.claude/memory-bank/) for detailed guides.

**Pre-commit checks:**
\`\`\`bash
./scripts/validate-ci.sh
\`\`\`

## CI/CD

The project uses GitHub Actions for continuous integration:

- ✅ Automated linting (Ruff, ESLint)
- ✅ Type checking (MyPy, TypeScript)
- ✅ Unit & integration tests
- ✅ Docker build verification
- ✅ Security auditing

See [CI/CD Documentation](./docs/ci-cd-pipeline.md) for details.
```

---

## Status Page Examples

### Shields.io Custom Badges

Create custom badges for any metric:

```markdown
<!-- Build Time -->
![Build Time](https://img.shields.io/badge/build%20time-10--15%20min-blue)

<!-- Test Coverage -->
![Coverage](https://img.shields.io/badge/coverage-85%25-brightgreen)

<!-- Backend Tests -->
![Backend Tests](https://img.shields.io/badge/tests-142%20passing-success)

<!-- Dependencies -->
![Dependencies](https://img.shields.io/badge/dependencies-up%20to%20date-success)
```

---

## GitHub Actions Workflow Visualization

Add this to your README to show the workflow:

```markdown
## CI/CD Pipeline

\`\`\`
Push/PR → [Lint] → [Type Check] → [Tests] → [Build] → ✅ Merge
            ↓           ↓            ↓          ↓
         Ruff       MyPy+TSC     Pytest    Docker
         ESLint                  Playwright
\`\`\`

**Runtime:** 10-15 minutes (parallel execution)
**Jobs:** 7 (lint, type-check, backend-test, frontend-test, build, security-audit, success)
```

---

## Usage Instructions

1. **Replace placeholders:**
   - `USERNAME` → Your GitHub username or organization
   - `REPO` → Repository name (e.g., `theatre_app_2026`)

2. **Add to README.md:**
   - Copy desired badges to top of README
   - Commit and push changes

3. **Verify badges:**
   - Check README on GitHub
   - Badges update automatically on each CI run

4. **Optional - Setup Codecov:**
   - Visit https://codecov.io/
   - Connect GitHub account
   - Add repository
   - Copy CODECOV_TOKEN to GitHub Secrets
   - Badge will show coverage percentage

---

## Advanced: Custom Shields

Create completely custom shields at https://shields.io/

Example:
```
https://img.shields.io/badge/<LABEL>-<MESSAGE>-<COLOR>
```

```markdown
![Custom](https://img.shields.io/badge/theatre-production%20ready-gold?style=for-the-badge)
```

Styles:
- `?style=flat` (default)
- `?style=flat-square`
- `?style=for-the-badge`
- `?style=plastic`
- `?style=social`

Colors:
- Named: `green`, `blue`, `red`, `gold`, `purple`
- Hex: `?color=D4A574` (Theatre gold)

---

**Note:** Badges are served via CDN and cached. Allow 5-10 minutes for updates to appear.
