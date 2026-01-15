# Theatre Management System — Структура файлов для Claude Project

## Как использовать

Скопируйте содержимое файлов из архива в Claude Project Files.
Имена файлов содержат путь с разделителем `__` вместо `/`.

Пример: `backend__app__main.py` = `backend/app/main.py`

---

## Список файлов (168 файлов)

### Корневые файлы
- PROJECT_INSTRUCTIONS.md
- QUICKSTART.md
- README_NEW.md (переименовать в README.md)
- docker-compose.yml
- docker-compose.dev.yml
- docker-compose_prod.yml

### Документация (docs/)
- docs__DESIGN_SYSTEM.md
- docs__PROJECT_STATUS.md
- docs__api__README.md
- docs__architecture__README.md
- docs__deployment__README.md

### Backend — Конфигурация
- backend__Dockerfile
- backend__Dockerfile.dev
- backend__Dockerfile.prod
- backend__pyproject.toml
- backend__README.md

### Backend — Alembic миграции
- backend__alembic__env.py
- backend__alembic__versions__20250101_0000_001_initial_initial_migration.py
- backend__alembic__versions__20250101_0001_002_inventory_inventory_module.py
- backend__alembic__versions__20250101_0001b_002b_performances_performances_module.py
- backend__alembic__versions__20250101_0002_003_documents_documents_module.py
- backend__alembic__versions__20250101_0003_004_schedule_schedule_module.py

### Backend — App Core
- backend__app____init__.py
- backend__app__main.py
- backend__app__config.py
- backend__app__core____init__.py
- backend__app__core__constants.py
- backend__app__core__exceptions.py
- backend__app__core__permissions.py
- backend__app__core__security.py

### Backend — Database
- backend__app__database____init__.py
- backend__app__database__base.py
- backend__app__database__session.py

### Backend — Models
- backend__app__models____init__.py
- backend__app__models__user.py
- backend__app__models__theater.py
- backend__app__models__inventory.py
- backend__app__models__document.py
- backend__app__models__performance.py
- backend__app__models__schedule.py

### Backend — Schemas
- backend__app__schemas____init__.py
- backend__app__schemas__base.py
- backend__app__schemas__auth.py
- backend__app__schemas__user.py
- backend__app__schemas__inventory.py
- backend__app__schemas__document.py
- backend__app__schemas__performance.py
- backend__app__schemas__schedule.py

### Backend — API
- backend__app__api____init__.py
- backend__app__api__deps.py
- backend__app__api__v1____init__.py
- backend__app__api__v1__router.py
- backend__app__api__v1__auth.py
- backend__app__api__v1__inventory.py
- backend__app__api__v1__documents.py
- backend__app__api__v1__performances.py
- backend__app__api__v1__schedule.py

### Backend — Services
- backend__app__services____init__.py
- backend__app__services__auth_service.py
- backend__app__services__inventory_service.py
- backend__app__services__document_service.py
- backend__app__services__performance_service.py
- backend__app__services__schedule_service.py
- backend__app__services__redis_service.py

### Backend — Repositories
- backend__app__repositories____init__.py
- backend__app__repositories__base.py
- backend__app__repositories__user_repository.py
- backend__app__repositories__inventory_repository.py
- backend__app__repositories__document_repository.py
- backend__app__repositories__performance_repository.py
- backend__app__repositories__schedule_repository.py

### Backend — Utils & Scripts
- backend__app__utils____init__.py
- backend__scripts____init__.py
- backend__scripts__init_db.py
- backend__scripts__seed_data.py
- backend__scripts__create_superuser.py
- backend__scripts__create_test_user.py

### Frontend — Конфигурация
- frontend__Dockerfile.dev
- frontend__Dockerfile.prod
- frontend__package.json
- frontend__tsconfig.json
- frontend__tsconfig.node.json
- frontend__vite.config.ts
- frontend__README.md

### Frontend — App Entry
- frontend__src__main.tsx
- frontend__src__App.tsx
- frontend__src__vite-env_d.ts

### Frontend — Styles
- frontend__src__styles__globals.css

### Frontend — Store
- frontend__src__store__index.ts
- frontend__src__store__authStore.ts

### Frontend — Hooks
- frontend__src__hooks__index.ts
- frontend__src__hooks__useAuth.ts

### Frontend — Utils
- frontend__src__utils__index.ts
- frontend__src__utils__cn.ts
- frontend__src__utils__constants.ts
- frontend__src__utils__helpers.ts

### Frontend — Types
- frontend__src__types__index.ts
- frontend__src__types__auth_types.ts
- frontend__src__types__common_types.ts
- frontend__src__types__inventory_types.ts
- frontend__src__types__document_types.ts
- frontend__src__types__performance_types.ts
- frontend__src__types__schedule_types.ts

### Frontend — Services (API Clients)
- frontend__src__services__index.ts
- frontend__src__services__api.ts
- frontend__src__services__auth_service.ts
- frontend__src__services__inventory_service.ts
- frontend__src__services__document_service.ts
- frontend__src__services__performance_service.ts
- frontend__src__services__schedule_service.ts

### Frontend — UI Components
- frontend__src__components__ui__index.ts
- frontend__src__components__ui__Alert.tsx
- frontend__src__components__ui__Badge.tsx
- frontend__src__components__ui__Button.tsx
- frontend__src__components__ui__Card.tsx
- frontend__src__components__ui__Dropdown.tsx
- frontend__src__components__ui__Input.tsx
- frontend__src__components__ui__Modal.tsx
- frontend__src__components__ui__Select.tsx
- frontend__src__components__ui__Skeleton.tsx
- frontend__src__components__ui__Spinner.tsx
- frontend__src__components__ui__Table.tsx
- frontend__src__components__ui__Tabs.tsx
- frontend__src__components__ui__Toast.tsx

### Frontend — Layout Components
- frontend__src__components__layout__index.ts
- frontend__src__components__layout__Header.tsx
- frontend__src__components__layout__Sidebar.tsx
- frontend__src__components__layout__MainLayout.tsx

### Frontend — Feature Components
- frontend__src__components__features__notifications__index.ts
- frontend__src__components__features__notifications__NotificationCenter.tsx
- frontend__src__components__features__schedule__index.ts
- frontend__src__components__features__schedule__EventFormModal.tsx

### Frontend — Pages: Auth
- frontend__src__pages__auth__index.ts
- frontend__src__pages__auth__LoginPage.tsx
- frontend__src__pages__auth__RegisterPage.tsx
- frontend__src__pages__auth__ForgotPasswordPage.tsx
- frontend__src__pages__auth__ResetPasswordPage.tsx
- frontend__src__pages__auth__VerifyEmailPage.tsx

### Frontend — Pages: Dashboard
- frontend__src__pages__dashboard__index.ts
- frontend__src__pages__dashboard__DashboardPage.tsx

### Frontend — Pages: Inventory
- frontend__src__pages__inventory__index.ts
- frontend__src__pages__inventory__InventoryListPage.tsx
- frontend__src__pages__inventory__InventoryItemPage.tsx
- frontend__src__pages__inventory__InventoryFormPage.tsx

### Frontend — Pages: Documents
- frontend__src__pages__documents__index.ts
- frontend__src__pages__documents__DocumentsListPage.tsx
- frontend__src__pages__documents__DocumentViewPage.tsx
- frontend__src__pages__documents__DocumentFormPage.tsx

### Frontend — Pages: Performances
- frontend__src__pages__performances__index.ts
- frontend__src__pages__performances__PerformancesListPage.tsx
- frontend__src__pages__performances__PerformanceViewPage.tsx
- frontend__src__pages__performances__PerformanceFormPage.tsx

### Frontend — Pages: Schedule
- frontend__src__pages__schedule__index.ts
- frontend__src__pages__schedule__SchedulePage.tsx

### Frontend — Pages: Admin
- frontend__src__pages__admin__index.ts
- frontend__src__pages__admin__UsersListPage.tsx
- frontend__src__pages__admin__UserDetailPage.tsx
- frontend__src__pages__admin__CategoriesPage.tsx
- frontend__src__pages__admin__AuditLogPage.tsx

### Frontend — Pages: Other
- frontend__src__pages__settings__index.ts
- frontend__src__pages__settings__SettingsPage.tsx
- frontend__src__pages__profile__index.ts
- frontend__src__pages__profile__ProfilePage.tsx
- frontend__src__pages__reports__index.ts
- frontend__src__pages__reports__ReportsPage.tsx
- frontend__src__pages__help__index.ts
- frontend__src__pages__help__HelpPage.tsx
- frontend__src__pages__error__index.ts
- frontend__src__pages__error__NotFoundPage.tsx

---

## Приоритетные файлы для понимания проекта

1. **PROJECT_INSTRUCTIONS.md** — главные инструкции
2. **docs__PROJECT_STATUS.md** — текущий статус и проблемы
3. **backend__app__main.py** — точка входа FastAPI
4. **frontend__src__App.tsx** — роутинг React
5. **backend__scripts__init_db.py** — seed data
6. **docker-compose.dev.yml** — конфигурация Docker
