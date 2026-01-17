# Theatre Management System — Roadmap & Deployment

## 🗺️ Roadmap разработки

> **Текущий статус:** MVP завершён (Phases 1-9), Extended MVP запланирован (Phases 10-15)
> **Общая готовность:** 100% MVP + Enhancements
> **Последнее обновление:** 2026-01-17
> **Итоговый отчёт:** см. `docs/PHASE_1-4_SUMMARY.md`
> **Расширенная спецификация:** см. `docs/MVP_PHASE_10_PLUS_SPECIFICATION.md`

### Phase 0: Стабилизация ✅

**Цель:** Исправить критические баги, обеспечить базовую работоспособность

| Задача | Приоритет | Статус |
|--------|-----------|--------|
| Исправить детальные страницы (/:id) | P0 | ✅ |
| Исправить загрузку расписания | P0 | ✅ |
| Убрать mock data, подключить реальный API | P0 | ✅ |
| Исправить белые модальные окна | P0 | ✅ |
| Исправить роутинг Users/Settings | P1 | ✅ |
| Проверить CRUD операции | P1 | ✅ |

### Phase 1: Seed Data + Critical Fixes ✅

**Цель:** Наполнить систему реалистичными данными, исправить блокирующие баги

| Задача | Статус |
|--------|--------|
| BaseRepository.update() fix | ✅ |
| unique().scalars() порядок | ✅ |
| Frontend race condition fix | ✅ |
| Модели Department и Venue | ✅ |
| Seed data с реальными данными | ✅ |

### Phase 2: Database Alignment ✅

**Цель:** Привести БД в соответствие с документацией

| Задача | Статус |
|--------|--------|
| inventory_photos таблица | ✅ |
| performance_inventory M2M | ✅ |
| Photo API endpoints | ✅ |
| Frontend галерея фото | ✅ |

### Phase 3: Module Completion ✅

**Цель:** Полностью реализовать 4 основных модуля
**BrainGrid:** REQ-6 (13 tasks completed)

#### Инвентарь (95%)
| Задача | Статус |
|--------|--------|
| Фильтры по категории, локации, статусу | ✅ |
| Поиск по названию и инв. номеру | ✅ |
| MinIO сервис для загрузки фото | ✅ |
| История перемещений API | ✅ |

#### Документы (95%)
| Задача | Статус |
|--------|--------|
| Фильтры по цехам (department_id FK) | ✅ |
| Версионирование документов API | ✅ |
| Превью PDF (react-pdf) | ✅ |

#### Спектакли (95%)
| Задача | Статус |
|--------|--------|
| CRUD спектаклей | ✅ |
| Паспорт спектакля (аккордеон) | ✅ |
| Чеклисты готовности | ✅ |

#### Расписание (95%)
| Задача | Статус |
|--------|--------|
| Календарь месяц/неделя/день (react-big-calendar) | ✅ |
| Привязка к venues (FK) | ✅ |
| Детектор конфликтов API | ✅ |
| АртМеханика стиль | ✅ |

### Phase 4: Frontend Polish ✅

**Цель:** Доведение до production-ready состояния
**BrainGrid:** REQ-7 (8 tasks completed)

| Задача | Статус |
|--------|--------|
| React Query интеграция (все модули) | ✅ |
| Zod валидация форм | ✅ |
| Error Boundaries (Page, Module, HOC) | ✅ |
| Skeleton loading states | ✅ |
| Keyboard navigation hooks | ✅ |
| Accessibility (Skip-to-content, focus rings) | ✅ |
| Toast notifications system | ✅ |
| PDF Preview компонент | ✅ |

### Phase 5: Testing & QA ✅

**Цель:** Покрытие тестами и QA проверка
**BrainGrid:** REQ-8 (10 tasks completed)

| Задача | Статус |
|--------|--------|
| Unit тесты backend (pytest) | ✅ 183+ тестов |
| Integration тесты API | ✅ 30 тестов |
| E2E тесты frontend (Playwright) | ✅ 69 тестов |
| Typecheck CI/CD | ✅ 0 errors |
| Performance тестирование | ✅ p95 < 500ms |
| Security audit | ✅ 0 vulnerabilities |

### Phase 6: File Handling Enhancement ✅

**Цель:** Расширенная работа с файлами
**BrainGrid:** REQ-9 (9 tasks completed)

| Задача | Статус |
|--------|--------|
| DOCX/DOC preview | ✅ |
| XLSX preview (SheetJS) | ✅ |
| Audio player (MP3/WAV) | ✅ |
| Video player (MP4) | ✅ |
| Departments CRUD API | ✅ |
| Venues CRUD API | ✅ |

### Phase 7-9: Document Management ✅

**Phases 7-9 завершены:**
- Phase 7: Document Templates & Generation (REQ-10)
- Phase 8: Performance Document Storage (REQ-11)
- Phase 9: Document Organization & Reports (REQ-12)

---

## 🚀 Extended MVP Roadmap (Phases 10-15)

> **Полная спецификация:** `docs/MVP_PHASE_10_PLUS_SPECIFICATION.md`

### Phase 10: Performance Management Hub ⏳

**BrainGrid:** REQ-13
**Цель:** Центр управления спектаклем

| Модуль | Описание |
|--------|----------|
| PerformanceHubPage | Multi-tab интерфейс управления |
| ChecklistManager | Drag-drop чеклисты с прогрессом |
| InventoryAssignment | Привязка реквизита к спектаклю |
| PersonnelSchedule | Расписание персонала |
| TimelineView | Горизонтальная шкала событий |

### Phase 11: Advanced Analytics & Reporting ⏳

**BrainGrid:** REQ-15
**Цель:** Аналитика и генерация отчётов

| Модуль | Описание |
|--------|----------|
| AnalyticsDashboard | Widget-based dashboard |
| ReportBuilder | Визуальный конструктор отчётов |
| ScheduledReports | Автоматическая генерация по расписанию |
| InventoryUsageChart | Графики использования инвентаря |
| IdleEquipmentReport | Отчёт о простаивающем оборудовании |

### Phase 12: UI/UX Overhaul ⏳

**BrainGrid:** REQ-18
**Цель:** Полная переработка интерфейса

| Модуль | Описание |
|--------|----------|
| Design System v3 | Tailwind tokens, typography |
| MultiSelect with Tags | Компонент множественного выбора |
| VirtualizedTable | Таблица с виртуализацией (1000+ строк) |
| Command Center | Глобальный поиск (Cmd+K) |
| KanbanBoard | Kanban-доска для задач |

### Phase 13: Inventory & Equipment Enhancement ⏳

**BrainGrid:** REQ-14
**Цель:** Визуальный каталог инвентаря

| Модуль | Описание |
|--------|----------|
| Visual Catalog | Grid/List/Table/Gallery views |
| Multi-image Upload | Crop, rotate, drag-drop |
| BulkOperations | Массовые операции с инвентарём |
| TagSystem | Теги с цветами и иерархией |
| QRCodePrint | Печать QR-кодов |

### Phase 14: Schedule & Calendar Pro ⏳

**BrainGrid:** REQ-16
**Цель:** Продвинутый календарь

| Модуль | Описание |
|--------|----------|
| EventTypes | 6 типов событий с цветовым кодированием |
| ResourceCalendar | Просмотр по ресурсам (venues, staff) |
| RecurrenceSupport | Повторяющиеся события (RFC 5545) |
| ConflictDetection v2 | Улучшенное определение конфликтов |
| DragDropScheduling | Перетаскивание событий |

### Phase 15: System Polish & Branding ⏳

**BrainGrid:** REQ-17
**Цель:** Финальная полировка

| Модуль | Описание |
|--------|----------|
| Branding Assets | Логотипы, иконки, цветовая схема |
| LoginPage Redesign | Новый дизайн страницы входа |
| DashboardWidgets | Персонализированная главная страница |
| KeyboardShortcuts | Система горячих клавиш |
| OnboardingTooltips | Подсказки для новых пользователей |

---

## 🚀 Deployment Guide

### Требования к серверу

**Минимальные требования (development/testing):**
- CPU: 2 cores
- RAM: 4 GB
- Storage: 20 GB SSD
- OS: Ubuntu 22.04+ / Debian 12+

**Рекомендуемые требования (production):**
- CPU: 4+ cores
- RAM: 8+ GB
- Storage: 100+ GB SSD
- OS: Ubuntu 22.04 LTS

### Development Setup

```bash
# 1. Клонировать репозиторий
git clone https://github.com/theatre/theatre-management-system.git
cd theatre-management-system

# 2. Создать .env файл
cp .env.example .env
# Отредактировать .env при необходимости

# 3. Запустить Docker Compose
docker-compose -f docker-compose.dev.yml up -d

# 4. Проверить статус контейнеров
docker-compose -f docker-compose.dev.yml ps

# 5. Дождаться healthy статуса PostgreSQL
docker-compose -f docker-compose.dev.yml logs -f postgres

# 6. Инициализировать БД с тестовыми данными
docker-compose -f docker-compose.dev.yml exec backend python -m scripts.init_db

# 7. Открыть приложение
open http://localhost:5173
```

### Production Setup

```bash
# 1. Подготовить сервер
sudo apt update && sudo apt upgrade -y
sudo apt install -y docker.io docker-compose

# 2. Настроить firewall
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# 3. Клонировать репозиторий
git clone https://github.com/theatre/theatre-management-system.git
cd theatre-management-system

# 4. Создать production .env
cp .env.example .env.prod
nano .env.prod

# Обязательно изменить:
# - DATABASE_URL (secure password)
# - JWT_SECRET_KEY (random 64+ chars)
# - MINIO_ROOT_PASSWORD
# - CORS_ORIGINS

# 5. SSL сертификаты (Let's Encrypt)
sudo apt install -y certbot
sudo certbot certonly --standalone -d theatre.example.com
# Скопировать сертификаты в ./ssl/

# 6. Запустить production
docker-compose -f docker-compose.prod.yml --env-file .env.prod up -d

# 7. Инициализировать БД
docker-compose -f docker-compose.prod.yml exec backend python -m scripts.init_db

# 8. Создать суперпользователя
docker-compose -f docker-compose.prod.yml exec backend python -m scripts.create_superuser
```

### Environment Variables

```bash
# .env.prod example

# Database
DATABASE_URL=postgresql+asyncpg://theatre:SECURE_PASSWORD@postgres:5432/theatre_main
POSTGRES_USER=theatre
POSTGRES_PASSWORD=SECURE_PASSWORD
POSTGRES_DB=theatre_main

# Redis
REDIS_URL=redis://redis:6379/0

# MinIO
MINIO_ENDPOINT=minio:9000
MINIO_ACCESS_KEY=theatre_admin
MINIO_SECRET_KEY=SECURE_MINIO_PASSWORD
MINIO_ROOT_USER=theatre_admin
MINIO_ROOT_PASSWORD=SECURE_MINIO_PASSWORD

# JWT
JWT_SECRET_KEY=your-super-secret-key-at-least-64-characters-long-change-this-in-production
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=15
JWT_REFRESH_TOKEN_EXPIRE_DAYS=7

# CORS
CORS_ORIGINS=https://theatre.example.com

# App
APP_ENV=production
DEBUG=false
```

### Nginx Configuration

```nginx
# /etc/nginx/sites-available/theatre

upstream backend {
    server backend:8000;
}

server {
    listen 80;
    server_name theatre.example.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name theatre.example.com;

    ssl_certificate /etc/nginx/ssl/fullchain.pem;
    ssl_certificate_key /etc/nginx/ssl/privkey.pem;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
    ssl_prefer_server_ciphers off;

    # Frontend
    location / {
        root /usr/share/nginx/html;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # API
    location /api/ {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # File uploads
    client_max_body_size 50M;

    # Gzip
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
}
```

### Backup Strategy

```bash
#!/bin/bash
# backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR=/backups

# PostgreSQL
docker-compose exec -T postgres pg_dump -U theatre theatre_main > $BACKUP_DIR/db_$DATE.sql

# MinIO (files)
docker run --rm -v minio_data:/data -v $BACKUP_DIR:/backup alpine tar czf /backup/files_$DATE.tar.gz /data

# Cleanup old backups (keep 7 days)
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
```

### Monitoring

```yaml
# docker-compose.monitoring.yml (optional)
version: '3.8'

services:
  prometheus:
    image: prom/prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml

  grafana:
    image: grafana/grafana
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - grafana_data:/var/lib/grafana

volumes:
  grafana_data:
```

---

## 🔄 CI/CD Pipeline (рекомендуемый)

```yaml
# .github/workflows/deploy.yml

name: Deploy

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Run backend tests
        run: |
          docker-compose -f docker-compose.test.yml up -d
          docker-compose exec -T backend pytest
          
      - name: Run frontend tests
        run: |
          cd frontend
          npm ci
          npm run test

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to server
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SSH_KEY }}
          script: |
            cd /opt/theatre
            git pull
            docker-compose -f docker-compose.prod.yml pull
            docker-compose -f docker-compose.prod.yml up -d
            docker-compose exec -T backend alembic upgrade head
```

---

## 📋 Checklist перед релизом

### Backend
- [ ] Все миграции применены
- [ ] Seed data загружены
- [ ] JWT_SECRET_KEY изменён
- [ ] CORS настроен правильно
- [ ] Rate limiting включен
- [ ] Логирование настроено

### Frontend
- [ ] Production build успешен
- [ ] Все API endpoints работают
- [ ] Нет console.log в production
- [ ] Favicon и meta tags настроены
- [ ] PWA manifest (опционально)

### Infrastructure
- [ ] SSL сертификаты установлены
- [ ] Nginx настроен
- [ ] Firewall настроен
- [ ] Backup скрипты работают
- [ ] Мониторинг настроен

### Security
- [ ] Все пароли изменены с дефолтных
- [ ] .env файлы не в репозитории
- [ ] Минимальные права доступа к БД
- [ ] HTTPS везде

---

## 🆘 Troubleshooting

### Backend не стартует

```bash
# Проверить логи
docker-compose logs backend

# Проверить подключение к БД
docker-compose exec backend python -c "from app.database.session import engine; print('OK')"

# Пересоздать контейнер
docker-compose down backend
docker-compose up -d backend
```

### Frontend не загружается

```bash
# Проверить логи
docker-compose logs frontend

# Проверить VITE_API_URL
docker-compose exec frontend env | grep VITE

# Пересобрать
docker-compose build frontend --no-cache
```

### Миграции не применяются

```bash
# Проверить текущую версию
docker-compose exec backend alembic current

# Применить принудительно
docker-compose exec backend alembic upgrade head

# Откатить и применить заново
docker-compose exec backend alembic downgrade -1
docker-compose exec backend alembic upgrade head
```

### MinIO не работает

```bash
# Проверить бакеты
docker-compose exec minio mc alias set local http://localhost:9000 minioadmin minioadmin
docker-compose exec minio mc ls local

# Создать бакеты вручную
docker-compose exec minio mc mb local/theatre-photos
docker-compose exec minio mc mb local/theatre-documents
```

---

*Документ обновлён: Январь 2026*
*Версия: 1.0*
