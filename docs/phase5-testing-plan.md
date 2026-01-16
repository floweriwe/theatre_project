# Phase 5: Testing & QA - Execution Plan

> **BrainGrid Requirement:** REQ-8
> **Ветка:** `feature/phase5-testing-qa`
> **Цель:** Обеспечить стабильность и production-ready качество
> **Критерии успеха:** 80%+ coverage backend, все E2E тесты проходят, CI pipeline работает

---

## Сводка задач

| # | Задача | Агент | Скилл | Приоритет | Зависимости |
|---|--------|-------|-------|-----------|-------------|
| 1 | Configure Backend Testing Infrastructure | `tester` | - | P0 | - |
| 2 | Implement BaseRepository Unit Tests | `tester` | `python-pro` | P0 | 1 |
| 3 | Implement Specific Repository Unit Tests | `tester` | `python-pro` | P0 | 1 |
| 4 | Implement Service Layer Unit Tests | `tester` | `python-pro` | P0 | 1 |
| 5 | Implement API Integration Tests | `tester` | `python-pro` | P0 | 1 |
| 6 | Implement Performance Benchmarks | `tester` | `python-pro` | P1 | 1, 5 |
| 7 | Enable TypeScript Strict Mode | `frontend-developer` | `senior-frontend` | P0 | - |
| 8 | Implement Frontend E2E Tests | `frontend-developer` | `senior-frontend` | P1 | 7 |
| 9 | Run Security Audits | `security-auditor` | - | P1 | - |
| 10 | Configure GitHub Actions CI/CD | `devops-engineer` | - | P2 | 1,5,7,8,9 |

---

## Детальный план выполнения

### Группа 1: Инфраструктура тестирования (параллельно)

#### TASK-1: Configure Backend Testing Infrastructure
**Агент:** `tester`
**Файлы:**
- `backend/requirements.txt` (добавить зависимости)
- `backend/pytest.ini` (создать)
- `backend/conftest.py` (создать)
- `backend/tests/__init__.py` (создать структуру)

**Действия:**
```bash
# Зависимости
pytest>=7.0.0
pytest-asyncio>=0.21.0
pytest-mock>=3.10.0
pytest-cov>=4.0.0
httpx>=0.24.0
```

**Deliverables:**
- pytest.ini с asyncio_mode=auto
- conftest.py с fixtures: test_db, test_client, async_client
- Структура: tests/unit/, tests/integration/, tests/services/

---

#### TASK-7: Enable TypeScript Strict Mode (параллельно с TASK-1)
**Агент:** `frontend-developer`
**Скилл:** `senior-frontend`
**Файлы:**
- `frontend/tsconfig.json`
- Компоненты с ошибками типизации

**Действия:**
1. Включить `"strict": true` в tsconfig.json
2. Запустить `npm run typecheck` для списка ошибок
3. Исправить все `any` типы
4. Добавить null checks (optional chaining `?.`)
5. Типизировать все function параметры

---

#### TASK-9: Run Security Audits (параллельно с TASK-1)
**Агент:** `security-auditor`
**Файлы:**
- `backend/requirements.txt`
- `frontend/package.json`

**Действия:**
```bash
# Backend
pip install pip-audit
pip-audit

# Frontend
npm audit
npm audit fix
```

**Deliverables:**
- Отчёт об уязвимостях
- Обновлённые зависимости
- Документация митигаций

---

### Группа 2: Backend Unit Tests (после TASK-1)

#### TASK-2: BaseRepository Unit Tests
**Агент:** `tester`
**Скилл:** `python-pro`
**Файл:** `backend/tests/unit/test_base_repository.py`

**Тесты:**
- `test_create_entity()` - создание записи
- `test_get_by_id_success()` - получение по ID
- `test_get_by_id_not_found()` - несуществующий ID
- `test_get_all_with_pagination()` - пагинация
- `test_update_entity()` - обновление
- `test_delete_entity()` - удаление

---

#### TASK-3: Specific Repository Unit Tests (параллельно с TASK-2)
**Агент:** `tester`
**Скилл:** `python-pro`
**Файлы:**
- `backend/tests/unit/test_inventory_repository.py`
- `backend/tests/unit/test_performance_repository.py`
- `backend/tests/unit/test_document_repository.py`
- `backend/tests/unit/test_schedule_repository.py`

**Тесты примеры:**
- InventoryRepository: фильтрация по категории, stock level
- PerformanceRepository: date range queries, status filtering
- DocumentRepository: search, type filtering
- ScheduleRepository: conflict detection, venue availability

---

#### TASK-4: Service Layer Unit Tests (параллельно с TASK-2, TASK-3)
**Агент:** `tester`
**Скилл:** `python-pro`
**Файлы:**
- `backend/tests/services/test_inventory_service.py`
- `backend/tests/services/test_performance_service.py`
- `backend/tests/services/test_document_service.py`
- `backend/tests/services/test_schedule_service.py`
- `backend/tests/services/test_auth_service.py`

**Тесты примеры:**
- InventoryService: stock validation (negative stock)
- AuthService: JWT generation, password hashing (bcrypt)
- ScheduleService: conflict detection logic
- PerformanceService: status transitions

---

### Группа 3: Integration Tests (после TASK-1)

#### TASK-5: API Integration Tests
**Агент:** `tester`
**Скилл:** `python-pro`
**Файлы:**
- `backend/tests/integration/test_auth_api.py`
- `backend/tests/integration/test_inventory_api.py`
- `backend/tests/integration/test_performance_api.py`
- `backend/tests/integration/test_document_api.py`
- `backend/tests/integration/test_schedule_api.py`

**Сценарии для каждого endpoint:**
- ✅ Happy Path (200/201)
- ❌ Validation Error (422)
- 🔒 Auth Error (401)
- 🚫 Permission Error (403)
- 🔍 Not Found (404)

**Coverage:** 95 endpoints

---

#### TASK-6: Performance Benchmarks (после TASK-5)
**Агент:** `tester`
**Скилл:** `python-pro`
**Файл:** `backend/tests/integration/test_performance_benchmarks.py`

**Тесты:**
- GET /inventory с 1000 записями → p95 < 500ms
- GET /performances с 1000 записями → p95 < 500ms
- GET /documents с 1000 записями → p95 < 500ms
- GET /schedule с 1000 записями → p95 < 500ms

---

### Группа 4: Frontend E2E Tests (после TASK-7)

#### TASK-8: Implement Frontend E2E Tests
**Агент:** `frontend-developer`
**Скилл:** `senior-frontend`
**Файлы:**
- `frontend/playwright.config.ts`
- `frontend/tests/e2e/auth.spec.ts`
- `frontend/tests/e2e/inventory.spec.ts`
- `frontend/tests/e2e/performance.spec.ts`
- `frontend/tests/e2e/calendar.spec.ts`
- `frontend/tests/e2e/documents.spec.ts`

**Critical Flows:**
1. **Auth:** login → logout → token refresh → redirect on expiry
2. **Inventory:** create → verify list → edit → delete
3. **Performance:** navigate → add section → save
4. **Calendar:** view → switch views → click event
5. **Documents:** upload → verify success → list update

---

### Группа 5: CI/CD (после всех)

#### TASK-10: Configure GitHub Actions CI/CD
**Агент:** `devops-engineer`
**Файл:** `.github/workflows/ci.yml`

**Pipeline Steps:**
1. **Lint:** ruff (backend), eslint (frontend)
2. **Type Check:** mypy (backend), tsc --noEmit (frontend)
3. **Backend Tests:** pytest с coverage
4. **E2E Tests:** Playwright headless
5. **Build:** docker build verification

**Triggers:** push to main, pull_request to main
**Timeout:** 10 minutes

---

## Порядок выполнения

```
┌─────────────────────────────────────────────────────────────────┐
│                         PHASE 5                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Параллельно (Группа 1):                                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                       │
│  │ TASK-1   │  │ TASK-7   │  │ TASK-9   │                       │
│  │ Backend  │  │ TS Strict│  │ Security │                       │
│  │ Infra    │  │ Mode     │  │ Audit    │                       │
│  └────┬─────┘  └────┬─────┘  └──────────┘                       │
│       │             │                                            │
│       ▼             ▼                                            │
│  Группа 2:      Группа 4:                                        │
│  ┌──────────┐  ┌──────────┐                                      │
│  │TASK-2,3,4│  │ TASK-8   │                                      │
│  │Unit Tests│  │ E2E Tests│                                      │
│  └────┬─────┘  └──────────┘                                      │
│       │                                                          │
│       ▼                                                          │
│  Группа 3:                                                       │
│  ┌──────────┐                                                    │
│  │ TASK-5   │                                                    │
│  │ API Tests│                                                    │
│  └────┬─────┘                                                    │
│       │                                                          │
│       ▼                                                          │
│  ┌──────────┐                                                    │
│  │ TASK-6   │                                                    │
│  │Benchmarks│                                                    │
│  └────┬─────┘                                                    │
│       │                                                          │
│       ▼                                                          │
│  Группа 5:                                                       │
│  ┌──────────┐                                                    │
│  │ TASK-10  │                                                    │
│  │ CI/CD    │                                                    │
│  └──────────┘                                                    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Агенты и их роли

### `tester`
**Задачи:** TASK-1, TASK-2, TASK-3, TASK-4, TASK-5, TASK-6
**Инструменты:** Read, Bash (pytest)
**Ответственность:** Запуск и анализ тестов, фикстуры

### `python-pro`
**Задачи:** TASK-2, TASK-3, TASK-4, TASK-5, TASK-6
**Инструменты:** Read, Write, Edit, Bash
**Ответственность:** Написание Python тест-кода, pytest fixtures

### `frontend-developer`
**Задачи:** TASK-7, TASK-8
**Инструменты:** Read, Write, Edit, Bash
**Ответственность:** TypeScript, Playwright тесты

### `security-auditor`
**Задачи:** TASK-9
**Инструменты:** Read, Write, Edit, Bash, Grep
**Ответственность:** pip-audit, npm audit, уязвимости

### `devops-engineer`
**Задачи:** TASK-10
**Инструменты:** Read, Write, Edit, Bash
**Ответственность:** GitHub Actions, CI/CD pipeline

---

## Критерии завершения Phase 5

- [ ] pytest инфраструктура настроена (TASK-1)
- [ ] BaseRepository покрыт тестами ≥80% (TASK-2)
- [ ] Specific repositories покрыты тестами (TASK-3)
- [ ] Services покрыты тестами ≥80% (TASK-4)
- [ ] Все 95 endpoints имеют integration tests (TASK-5)
- [ ] List endpoints < 500ms p95 (TASK-6)
- [ ] TypeScript strict mode без ошибок (TASK-7)
- [ ] E2E critical flows проходят (TASK-8)
- [ ] Нет High/Critical уязвимостей (TASK-9)
- [ ] CI pipeline работает < 10 минут (TASK-10)

---

## Команды для запуска

```bash
# Backend tests
cd backend
pytest tests/unit -v --cov=app --cov-report=html
pytest tests/integration -v
pytest tests/services -v

# Frontend typecheck
cd frontend
npm run typecheck

# Frontend E2E
cd frontend
npx playwright test

# Security
pip-audit
npm audit

# Full CI locally
act -j test  # если установлен act
```

---

*Документ создан: 2026-01-16*
*BrainGrid REQ-8: 10 tasks*
