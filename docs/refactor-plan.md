# Theatre MVP Refactoring Plan

> **BrainGrid Requirement:** REQ-1
> **Последнее обновление:** 2026-01-17
> **Текущая фаза:** Phase 8 завершена (Document Storage)
> **Общая готовность:** 100% MVP + Phases 6-8
> **Итоговый отчёт:** см. `docs/PHASE_1-4_SUMMARY.md`

---

## Executive Summary

**Цель:** Привести Theatre Management System к production-ready MVP состоянию.

| Метрика | Текущее | Цель |
|---------|---------|------|
| Готовность к MVP | 90% | 100% |
| Критических багов | 0 | 0 |
| Таблиц БД | 19/25 | 25/25 |
| Модулей завершено | 4/5 | 5/5 |

**Общие трудозатраты:** 91 час (~11-12 рабочих дней)

---

## Отчёты анализа

| Отчёт | Описание |
|-------|----------|
| `docs/analysis-backend.md` | Backend архитектура, критические баги |
| `docs/analysis-frontend.md` | Frontend, Design System v3 соответствие |
| `docs/analysis-global.md` | GAP-анализ архитектуры, roadmap |
| `docs/analysis-database.md` | GAP-анализ схемы БД |

---

## Phase 1: Critical Fixes (12 часов) ✅

**Цель:** Исправить блокирующие баги, система станет рабочей.
**Результат:** 45% → 60%

### P0 — Блокирующие баги

| # | Задача | Файл | Проблема | Оценка | Статус |
|---|--------|------|----------|--------|--------|
| 1.1 | BaseRepository.update() | `backend/app/repositories/base.py` | Ожидает instance, получает ID | 2h | ✅ |
| 1.2 | unique().scalars() порядок | `backend/app/repositories/inventory_repository.py:215` | Неправильный порядок вызовов | 1h | ✅ |
| 1.3 | Frontend race condition | `frontend/src/pages/inventory/InventoryItemPage.tsx` | Нет cleanup в useEffect | 1h | ✅ |
| 1.4 | ID validation | `frontend/src/pages/inventory/InventoryItemPage.tsx` | Нет проверки isNaN | 0.5h | ✅ |

### P0 — Критические таблицы БД

| # | Задача | Описание | Оценка | Статус |
|---|--------|----------|--------|--------|
| 1.5 | Модель Department | Цеха театра (свет, звук, механика...) | 1.5h | ✅ |
| 1.6 | Модель Venue | Площадки/залы (сейчас просто текст) | 1.5h | ✅ |
| 1.7 | Миграция departments + venues | Alembic миграция | 2h | ✅ |
| 1.8 | Обновить FK references | users.department_id, events.venue_id | 1.5h | ✅ |

### Критерии завершения Phase 1
- [x] GET /inventory/:id возвращает данные без ошибок
- [x] UPDATE операции работают во всех модулях
- [x] Таблицы departments и venues созданы
- [x] Unit-тесты для BaseRepository проходят

---

## Phase 2: Database Alignment (16 часов) ✅

**Цель:** Привести БД в соответствие с документацией.
**Результат:** 60% → 75%

### Недостающие таблицы (SHOULD HAVE)

| # | Таблица | Описание | Оценка | Статус |
|---|---------|----------|--------|--------|
| 2.1 | inventory_photos | Отдельная таблица для фото (вместо JSONB) | 2h | ✅ |
| 2.2 | performance_inventory | Связь спектакль ↔ реквизит | 2h | ✅ |
| 2.3 | performance_checklists | Чеклисты готовности к спектаклю | 2h | ✅ Phase 3 |
| 2.4 | checklist_items | Пункты чеклистов | 1.5h | ✅ Phase 3 |

### Недостающие поля

| # | Таблица | Поля | Оценка | Статус |
|---|---------|------|--------|--------|
| 2.5 | inventory_items | dimensions (w/h/d/weight), condition, deleted_at | 2h | ✅ |
| 2.6 | users | department_id FK, avatar_url | 1h | ⏳ Phase 4 |
| 2.7 | schedule_events | venue_id FK (вместо текста), stage_ready_time | 1.5h | ✅ Phase 1 |

### Недостающие ENUM типы

| # | ENUM | Значения | Оценка | Статус |
|---|------|----------|--------|--------|
| 2.8 | DepartmentType | sound, light, stage, costume, props, makeup, video | 0.5h | ✅ (Phase 1) |
| 2.9 | ItemCondition | excellent, good, fair, poor, needs_repair | 0.5h | ✅ |
| 2.10 | VenueType | main_stage, rehearsal, warehouse, workshop | 0.5h | ✅ (Phase 1) |

### Seed Data

| # | Задача | Описание | Оценка | Статус |
|---|--------|----------|--------|--------|
| 2.11 | init_db.py переписать | Новая структура с departments, venues | 2h | ✅ (Phase 1) |
| 2.12 | Seed departments | 6 цехов театра | 0.5h | ✅ (Phase 1) |
| 2.13 | Seed venues | 4 площадки | 0.5h | ✅ (Phase 1) |

### Дополнительно реализовано (REQ-5)

| # | Задача | Описание | Статус |
|---|--------|----------|--------|
| 2.14 | Photo API endpoints | Upload, list, delete photos | ✅ |
| 2.15 | Performance-inventory API | GET/POST/DELETE endpoints | ✅ |
| 2.16 | InventoryPhotoGallery UI | Галерея фото с загрузкой | ✅ |
| 2.17 | PhysicalSpecsSection UI | Отображение физ. характеристик | ✅ |
| 2.18 | PropsEquipmentTab UI | Таб реквизита на странице спектакля | ✅ |
| 2.19 | AddItemModal UI | Модальное окно привязки инвентаря | ✅ |

### Критерии завершения Phase 2
- [x] Все основные таблицы созданы (inventory_photos, performance_inventory)
- [x] Миграции применяются чисто
- [x] API endpoints для фото и привязки инвентаря работают
- [x] Frontend компоненты интегрированы

---

## Phase 3: Module Completion (33 часа) ✅

**BrainGrid:** REQ-6 (13 tasks)
**Ветка:** `feature/REQ-6-phase3-module-completion`
**Цель:** Довести все модули до MVP функциональности.
**Результат:** 75% → 90%

### Inventory (70% → 95%)

| # | Задача | Оценка | Статус |
|---|--------|--------|--------|
| TASK-1 | Фильтры (категория, локация, статус) | 3h | ✅ |
| TASK-2 | Поиск по названию и инв. номеру | 1.5h | ✅ |
| TASK-3 | MinIO сервис для загрузки фото | 3h | ✅ |
| TASK-4 | История перемещений API | 2h | ✅ |

### Documents (55% → 95%)

| # | Задача | Оценка | Статус |
|---|--------|--------|--------|
| TASK-5 | Фильтры по цехам (department_id FK) | 2h | ✅ |
| TASK-6 | Версионирование документов API | 3h | ✅ |
| TASK-7 | Превью PDF (react-pdf компонент) | 2h | ✅ |

### Performances (30% → 95%)

| # | Задача | Оценка | Статус |
|---|--------|--------|--------|
| TASK-8 | CRUD спектаклей | 2h | ✅ (было готово) |
| TASK-9 | Паспорт спектакля (аккордеон UI) | 4h | ✅ |
| TASK-10 | Чеклисты готовности (модель + API) | 3h | ✅ |

### Schedule (60% → 95%)

| # | Задача | Оценка | Статус |
|---|--------|--------|--------|
| TASK-11 | Привязка к venues (FK вместо текста) | 1.5h | ✅ (было готово) |
| TASK-12 | Календарь месяц/неделя/день (react-big-calendar) | 3h | ✅ |
| TASK-13 | Детектор конфликтов API | 2h | ✅ |

### Критерии завершения Phase 3
- [x] Все 4 модуля выполняют CRUD
- [x] Паспорта спектаклей работают (TechnicalPassport компонент)
- [x] Чеклисты готовности работают (performance_checklists + checklist_items)
- [x] Календарь отображает события корректно (CalendarView с ArtMechanics стилем)
- [x] MinIO сервис для загрузки файлов
- [x] PDF превью компонент

---

## Phase 4: Frontend Polish (18 часов) ✅

**BrainGrid:** REQ-7 (8 tasks completed)
**Ветка:** `feature/phase4-polish-optimization`
**Цель:** UI/UX доработки, консистентность Design System v3.
**Результат:** 90% → 95%

### Реализованные задачи

| # | Задача | Статус |
|---|--------|--------|
| 4.1 | React Query интеграция (inventory, performances, schedule hooks) | ✅ |
| 4.2 | Zod валидация форм | ✅ |
| 4.3 | Error Boundaries (PageErrorBoundary, ModuleErrorBoundary, withErrorBoundary HOC) | ✅ |
| 4.4 | Skeleton loading states (SkeletonCard, SkeletonTable, SkeletonList, SkeletonStats, SkeletonInventoryGrid) | ✅ |
| 4.5 | Keyboard navigation hooks (useArrowNavigation, useFocusTrap, useEscapeKey) | ✅ |
| 4.6 | SkipToContent accessibility component | ✅ |
| 4.7 | Toast notifications (ToastProvider, useToast, useToastHelpers) | ✅ |
| 4.8 | PDF Preview компонент (PDFViewer, PDFPreviewModal) | ✅ |

### Критерии завершения Phase 4
- [x] React Query для inventory, performances, schedule hooks
- [x] Skeleton loaders для всех типов контента
- [x] Error Boundaries на всех уровнях (Page, Module, Component)
- [x] Keyboard accessibility (arrow navigation, focus trap, escape key)
- [x] Toast notifications system

---

## Phase 5: Testing & QA (12 часов) ✅

**BrainGrid:** REQ-8 (10 tasks completed)
**Ветка:** `feature/phase5-testing-qa`
**Цель:** Обеспечить стабильность и готовность к production.
**Результат:** 95% → 100%

### Реализованные задачи

| # | Задача | Статус |
|---|--------|--------|
| TASK-1 | Backend Testing Infrastructure (pytest, conftest) | ✅ |
| TASK-2 | BaseRepository Unit Tests (18 tests) | ✅ |
| TASK-3 | Specific Repository Tests (29 tests) | ✅ |
| TASK-4 | Service Layer Tests (24 tests) | ✅ |
| TASK-5 | API Integration Tests (30 tests) | ✅ |
| TASK-6 | Performance Benchmarks (13 tests, p95 < 500ms) | ✅ |
| TASK-7 | TypeScript Strict Mode (0 errors) | ✅ |
| TASK-8 | Playwright E2E Tests (69 tests) | ✅ |
| TASK-9 | Security Audits (0 vulnerabilities) | ✅ |
| TASK-10 | GitHub Actions CI/CD (7 jobs pipeline) | ✅ |

### Критерии завершения Phase 5
- [x] pytest инфраструктура настроена
- [x] Backend coverage ≥ 80% (183+ тестов)
- [x] E2E critical flows (69 Playwright tests)
- [x] Performance: списки < 500ms (p95)
- [x] TypeScript strict mode
- [x] Security: 0 vulnerabilities
- [x] CI/CD pipeline (10-15 min)

---

## Phase 6: File Handling Enhancement (8 часов) ✅

**BrainGrid:** REQ-9 (9 tasks completed)
**Ветка:** `feature/phase6-file-handling`
**Цель:** Расширить возможности работы с файлами, добавить CRUD для departments/venues.
**Результат:** MVP Enhancements

### Backend (4 tasks)

| # | Задача | Статус |
|---|--------|--------|
| TASK-1 | Content-Type detection (python-magic) | ✅ |
| TASK-2 | DOCX→PDF preview conversion | ✅ |
| TASK-3 | Departments CRUD API | ✅ |
| TASK-4 | Venues CRUD API | ✅ |

### Frontend (5 tasks)

| # | Задача | Статус |
|---|--------|--------|
| TASK-5 | FileViewer dispatcher (MIME routing) | ✅ |
| TASK-6 | SpreadsheetViewer (SheetJS) | ✅ |
| TASK-7 | AudioPlayer (HTML5 audio) | ✅ |
| TASK-8 | VideoPlayer (HTML5 video) | ✅ |
| TASK-9 | FilePreviewModal integration | ✅ |

### Критерии завершения Phase 6
- [x] Departments CRUD API работает
- [x] Venues CRUD API с валидацией capacity
- [x] FileViewer роутит файлы по MIME типу
- [x] SpreadsheetViewer отображает XLSX/CSV
- [x] AudioPlayer воспроизводит MP3/WAV
- [x] VideoPlayer воспроизводит MP4
- [x] FilePreviewModal с download кнопкой

---

## Сводка по фазам

| Phase | Название | Часы | Результат | Статус |
|-------|----------|------|-----------|--------|
| 1 | Critical Fixes | 12h | 45% → 60% | ✅ Готово |
| 2 | Database Alignment | 16h | 60% → 75% | ✅ Готово |
| 3 | Module Completion | 33h | 75% → 90% | ✅ Готово |
| 4 | Frontend Polish | 18h | 90% → 95% | ✅ Готово |
| 5 | Testing & QA | 12h | 95% → 100% | ✅ Готово |
| 6 | File Handling | 8h | Enhancement | ✅ Готово |
| **Σ** | **ИТОГО** | **99h** | **100% + Enh** | **MVP + PHASE 6** |

---

## Риски

| Риск | Вероятность | Влияние | Митигация |
|------|-------------|---------|-----------|
| MinIO интеграция сложнее | Средняя | Средний | Fallback на локальное хранение |
| Миграции ломают данные | Низкая | Высокий | Бэкапы перед каждой миграцией |
| React Query рефакторинг | Средняя | Низкий | Инкрементальное внедрение |

---

## Лог прогресса

### 2026-01-17 (Phase 8 завершена - Document Storage & Upload)
**Phase 8 Performance Document Storage & Upload завершена:**
- Реализованы все 6 задач из REQ-11
- **Backend:**
  - PerformanceDocument model с section/category enums
  - Migration 013_performance_documents
  - PerformanceDocumentStorageService для MinIO
  - DocumentCategorizationService (автокатегоризация по имени файла)
  - API endpoints: GET/POST/PATCH/DELETE /performances/{id}/documents
  - Pydantic schemas для документов
- **Frontend:**
  - TypeScript types для документов спектакля
  - React Query hooks (usePerformanceDocuments)
  - DocumentUploader (drag-n-drop, multiple files)
  - DocumentCard (preview, download, delete)
  - PerformanceDocumentsTab (grouped by sections)
- **Особенности:**
  - Документы группируются по разделам паспорта (1.0-4.0)
  - 26 категорий документов на основе реального анализа
  - Автоопределение категории по ключевым словам и расширениям
- **Статистика:**
  - 19 файлов изменено
  - +3,755 строк кода
- **PR:** https://github.com/floweriwe/theatre_project/pull/6

### 2026-01-17 (Phase 7 завершена - Document Templates)
**Phase 7 Document Templates & Generation завершена:**
- Модели DocumentTemplate и DocumentTemplateVariable
- API для шаблонов и генерации DOCX
- Frontend компонент GenerateDocumentModal
- **PR:** https://github.com/floweriwe/theatre_project/pull/5

### 2026-01-17 (Phase 6 завершена - File Handling Enhancement)
**Phase 6 File Handling Enhancement завершена:**
- Реализованы все 9 задач из REQ-9
- **Backend (4 tasks):**
  - Content-Type detection с python-magic
  - DOCX→PDF preview conversion
  - Departments CRUD API с tenant isolation
  - Venues CRUD API с capacity validation
- **Frontend (5 tasks):**
  - FileViewer dispatcher (MIME type routing)
  - SpreadsheetViewer (SheetJS для XLSX/CSV)
  - AudioPlayer (HTML5 audio с custom controls)
  - VideoPlayer (HTML5 video с fullscreen)
  - FilePreviewModal интеграция
- **Статистика:**
  - 42 файла изменено
  - +8,459 строк кода
  - TypeScript check: passed
  - Build: successful
- **PR:** https://github.com/floweriwe/theatre_project/pull/4

### 2026-01-17 (Phase 5 завершена - MVP COMPLETE)
**Phase 5 Testing & QA завершена:**
- Реализованы все 10 задач из REQ-8
- **Backend Testing:**
  - pytest infrastructure (conftest.py, fixtures)
  - BaseRepository tests (18)
  - Specific repository tests (29)
  - Service layer tests (24)
  - API integration tests (30)
  - Performance benchmarks (13)
- **Frontend Testing:**
  - TypeScript strict mode (0 errors)
  - Playwright E2E tests (69)
- **Security:**
  - npm audit: 0 vulnerabilities
  - pip-audit: clean (ecdsa not exploitable)
- **CI/CD:**
  - GitHub Actions workflow (7 jobs)
  - 10-15 min pipeline
  - PostgreSQL + Redis services
  - Multi-layer caching
- **Итого тестов:** 183+
- **PR:** pending merge to master

### 2026-01-16 (утро - Phase 4 завершена)
**Phase 4 завершена:**
- Реализованы все 8 задач из REQ-7
- **React Query:**
  - Inventory hooks (12): useInventoryItems, useCreateInventoryItem, etc.
  - Performance hooks (10): usePerformances, useRepertoire, etc.
  - Schedule hooks (10): useScheduleEvents, useCalendar, etc.
- **Error Boundaries:**
  - PageErrorBoundary с retry функцией
  - ModuleErrorBoundary для изолированных модулей
  - withErrorBoundary HOC
- **Skeleton loaders:**
  - SkeletonCard, SkeletonTable, SkeletonList
  - SkeletonStats, SkeletonInventoryGrid
- **Accessibility:**
  - useArrowNavigation hook
  - useFocusTrap hook
  - useEscapeKey hook
  - SkipToContent component
  - focusRingClasses utilities
- **Toast system:**
  - ToastProvider
  - useToast, useToastHelpers hooks
- **PR:** https://github.com/floweriwe/theatre_project/pull/2
- Создан итоговый отчёт: `docs/PHASE_1-4_SUMMARY.md`

### 2026-01-16 (поздний вечер)
**Phase 3 завершена:**
- Реализованы все 13 задач из REQ-6
- **Backend (10 tasks):**
  - Inventory: фильтры, поиск, MinIO сервис, история перемещений
  - Documents: department_id FK, версионирование API
  - Performances: чеклисты готовности (модель + API)
  - Schedule: детектор конфликтов API
- **Frontend (3 tasks):**
  - PDFViewer + PDFPreviewModal (react-pdf)
  - TechnicalPassport + Accordion (Context API)
  - CalendarView (react-big-calendar, ArtMechanics style)
- Исправлены баги: route ordering, schema imports
- Добавлены зависимости: react-pdf, react-big-calendar, date-fns
- Ветка слита в master, создана ветка Phase 4

### 2026-01-16 (ночь)
**Phase 2 завершена, Phase 3 запланирована:**
- Исправлены все 84 TypeScript ошибки во frontend
- Слиты ветки Phase 1 и Phase 2 в master
- Создан REQ-6 для Phase 3 (Module Completion)
- Разбит на 13 задач через BrainGrid
- Создана ветка `feature/REQ-6-phase3-module-completion`

### 2026-01-16 (вечер)
**Phase 1 (REQ-4) завершена:**
- Исправлен BaseRepository.update()
- Исправлен unique().scalars() порядок
- Добавлен cleanup в useEffect (race condition fix)
- Добавлена ID validation
- Созданы модели Department и Venue
- Созданы миграции и seed data
- Обновлены FK references

**Phase 2 (REQ-5) завершена:**
- Создана таблица inventory_photos с миграцией
- Создана таблица performance_inventory (M2M)
- Добавлены физические свойства к inventory_items
- Реализованы API endpoints для фото (upload/list/delete)
- Реализованы API endpoints для привязки инвентаря
- Создан компонент InventoryPhotoGallery
- Создан компонент PhysicalSpecsSection
- Создан компонент PropsEquipmentTab
- Создан компонент AddItemModal
- **PR:** https://github.com/floweriwe/theatre_project/pull/1

### 2026-01-16
- Создан REQ-1 в BrainGrid
- Завершён анализ backend (`docs/analysis-backend.md`)
- Завершён анализ frontend (`docs/analysis-frontend.md`)
- Завершён глобальный GAP-анализ (`docs/analysis-global.md`)
- Завершён анализ БД (`docs/analysis-database.md`)
- Обновлён план переработки

---

## Легенда

- ⏳ Ожидает
- 🔄 В работе
- ✅ Готово
- ❌ Отменено/отложено
