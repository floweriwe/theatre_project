# 🚀 Deployment Guide

Руководство по развёртыванию Theatre Management System.

## Содержание

- [Требования](#требования)
- [Development](#development-development)
- [Staging](#staging)
- [Production](#production)
- [SSL сертификаты](#ssl-сертификаты)
- [Резервное копирование](#резервное-копирование)
- [Мониторинг](#мониторинг)
- [Обновление](#обновление)
- [Откат](#откат)

---

## Требования

### Development (Windows/macOS/Linux)

| Компонент | Версия |
|-----------|--------|
| Docker Desktop | 4.x+ |
| Git | 2.x+ |
| (Опционально) Node.js | 20+ |
| (Опционально) Python | 3.12+ |

### Production (Linux Server)

| Компонент | Минимум | Рекомендуется |
|-----------|---------|---------------|
| CPU | 2 cores | 4+ cores |
| RAM | 4 GB | 8+ GB |
| SSD | 20 GB | 50+ GB |
| OS | Ubuntu 22.04 | Ubuntu 24.04 |
| Docker | 24+ | Latest |
| Docker Compose | 2.x+ | Latest |

---

## Development (Development)

### Первоначальная настройка

```bash
# Клонирование
git clone https://github.com/your-org/theatre.git
cd theatre

# Конфигурация
cp .env.example .env

# Запуск
docker-compose -f docker-compose.dev.yml up -d

# Инициализация БД
docker-compose -f docker-compose.dev.yml exec backend alembic upgrade head
docker-compose -f docker-compose.dev.yml exec backend python -m scripts.create_test_user
docker-compose -f docker-compose.dev.yml exec backend python -m scripts.seed_data
```

### Доступ

| Сервис | URL |
|--------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000 |
| Swagger UI | http://localhost:8000/docs |
| PostgreSQL | localhost:5432 |
| Redis | localhost:6379 |

### Hot Reload

- **Backend**: Изменения в `backend/app/` автоматически перезагружают сервер
- **Frontend**: Изменения в `frontend/src/` обновляют браузер через HMR

---

## Staging

### Настройка сервера

```bash
# Установка Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# Установка Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Создание директории
sudo mkdir -p /opt/theatre-staging
sudo chown $USER:$USER /opt/theatre-staging
cd /opt/theatre-staging

# Клонирование
git clone https://github.com/your-org/theatre.git .
git checkout develop
```

### Конфигурация

```bash
cat > .env << 'EOF'
ENVIRONMENT=staging
DEBUG=true

SECRET_KEY=$(openssl rand -hex 32)

POSTGRES_USER=theatre_staging
POSTGRES_PASSWORD=$(openssl rand -base64 24)
POSTGRES_DB=theatre_staging

REDIS_PASSWORD=$(openssl rand -base64 24)

CORS_ORIGINS=https://staging.theatre.example.com
VERSION=latest
EOF
```

### Запуск

```bash
docker-compose -f docker-compose.prod.yml up -d
docker-compose -f docker-compose.prod.yml exec backend alembic upgrade head
```

---

## Production

### Подготовка сервера

```bash
# Обновление системы
sudo apt update && sudo apt upgrade -y

# Установка необходимых пакетов
sudo apt install -y curl git htop

# Настройка firewall
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# Установка Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# Перелогин для применения группы docker
exit
# ... login again ...

# Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### Настройка приложения

```bash
# Создание директории
sudo mkdir -p /opt/theatre
sudo chown $USER:$USER /opt/theatre
cd /opt/theatre

# Клонирование
git clone https://github.com/your-org/theatre.git .
```

### Production конфигурация

```bash
# Генерация безопасных паролей
SECRET_KEY=$(openssl rand -hex 32)
POSTGRES_PASSWORD=$(openssl rand -base64 32 | tr -dc 'a-zA-Z0-9' | head -c 32)
REDIS_PASSWORD=$(openssl rand -base64 32 | tr -dc 'a-zA-Z0-9' | head -c 32)

cat > .env << EOF
ENVIRONMENT=production
DEBUG=false

SECRET_KEY=${SECRET_KEY}

POSTGRES_USER=theatre_prod
POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
POSTGRES_DB=theatre_production

REDIS_PASSWORD=${REDIS_PASSWORD}

CORS_ORIGINS=https://theatre.example.com
BACKEND_WORKERS=4
VERSION=latest
EOF

# Защита файла
chmod 600 .env
```

### Настройка systemd

```bash
sudo cat > /etc/systemd/system/theatre.service << 'EOF'
[Unit]
Description=Theatre Management System
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/opt/theatre
ExecStart=/usr/local/bin/docker-compose -f docker-compose.prod.yml up -d
ExecStop=/usr/local/bin/docker-compose -f docker-compose.prod.yml down
ExecReload=/usr/local/bin/docker-compose -f docker-compose.prod.yml up -d --no-deps
TimeoutStartSec=0
User=root

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable theatre
```

### Первый запуск

```bash
# Запуск
sudo systemctl start theatre

# Проверка
docker-compose -f docker-compose.prod.yml ps

# Миграции
docker-compose -f docker-compose.prod.yml exec backend alembic upgrade head

# Создание администратора
docker-compose -f docker-compose.prod.yml exec backend python -m scripts.create_test_user
```

---

## SSL сертификаты

### Let's Encrypt (рекомендуется)

```bash
# Создание директорий
mkdir -p certbot/conf certbot/www

# Временный nginx для получения сертификата
# Убедитесь, что в nginx.conf закомментирован HTTPS блок

# Запуск nginx
docker-compose -f docker-compose.prod.yml up -d nginx

# Получение сертификата
docker run -it --rm \
  -v $(pwd)/certbot/conf:/etc/letsencrypt \
  -v $(pwd)/certbot/www:/var/www/certbot \
  certbot/certbot certonly \
  --webroot \
  --webroot-path=/var/www/certbot \
  --email admin@theatre.example.com \
  --agree-tos \
  --no-eff-email \
  -d theatre.example.com

# Раскомментируйте HTTPS блок в nginx/nginx.conf
# Перезапустите nginx
docker-compose -f docker-compose.prod.yml restart nginx
```

### Автообновление сертификатов

Certbot контейнер автоматически обновляет сертификаты каждые 12 часов.

```bash
# Принудительное обновление
docker-compose -f docker-compose.prod.yml exec certbot certbot renew --force-renewal
docker-compose -f docker-compose.prod.yml exec nginx nginx -s reload
```

---

## Резервное копирование

### Ручной backup

```bash
# Backup БД
docker-compose -f docker-compose.prod.yml --profile backup run --rm backup /backup.sh backup

# Список backup'ов
docker-compose -f docker-compose.prod.yml --profile backup run --rm backup /backup.sh list
```

### Автоматический backup (cron)

```bash
# Открыть crontab
crontab -e

# Добавить задачу (ежедневно в 3:00)
0 3 * * * cd /opt/theatre && docker-compose -f docker-compose.prod.yml --profile backup run --rm backup /backup.sh backup >> /var/log/theatre-backup.log 2>&1

# Еженедельная очистка старых backup'ов
0 4 * * 0 find /opt/theatre/backups -name "*.sql.gz" -mtime +30 -delete
```

### Восстановление

```bash
# Список доступных backup'ов
docker-compose -f docker-compose.prod.yml --profile backup run --rm backup /backup.sh list

# Восстановление
docker-compose -f docker-compose.prod.yml --profile backup run --rm backup /backup.sh restore theatre_backup_20250115_030000.sql.gz

# Перезапуск приложения
docker-compose -f docker-compose.prod.yml restart backend
```

### Backup файлового хранилища

```bash
# Backup файлов
tar -czf storage_backup_$(date +%Y%m%d).tar.gz storage/

# Восстановление
tar -xzf storage_backup_20250115.tar.gz
```

---

## Мониторинг

### Health checks

```bash
# Проверка всех сервисов
docker-compose -f docker-compose.prod.yml ps

# Health endpoint
curl -f https://theatre.example.com/health

# API health
curl -f https://theatre.example.com/api/v1/health
```

### Логи

```bash
# Все логи
docker-compose -f docker-compose.prod.yml logs -f

# Только backend
docker-compose -f docker-compose.prod.yml logs -f backend

# Только ошибки
docker-compose -f docker-compose.prod.yml logs -f backend 2>&1 | grep -E "ERROR|CRITICAL"

# Nginx access log
docker-compose -f docker-compose.prod.yml exec nginx tail -f /var/log/nginx/access.log
```

### Ресурсы

```bash
# Docker stats
docker stats

# Использование диска
df -h
du -sh /opt/theatre/*

# Размер БД
docker-compose -f docker-compose.prod.yml exec db psql -U theatre_prod -d theatre_production -c "SELECT pg_size_pretty(pg_database_size('theatre_production'));"
```

### Prometheus метрики (опционально)

Добавьте в `docker-compose.prod.yml`:

```yaml
prometheus:
  image: prom/prometheus:latest
  volumes:
    - ./prometheus.yml:/etc/prometheus/prometheus.yml
  ports:
    - "9090:9090"

grafana:
  image: grafana/grafana:latest
  ports:
    - "3001:3000"
  volumes:
    - grafana_data:/var/lib/grafana
```

---

## Обновление

### Стандартное обновление

```bash
cd /opt/theatre

# Получить изменения
git fetch origin
git pull origin main

# Пересобрать образы
docker-compose -f docker-compose.prod.yml build

# Zero-downtime обновление
docker-compose -f docker-compose.prod.yml up -d --no-deps backend
sleep 30

# Миграции
docker-compose -f docker-compose.prod.yml exec -T backend alembic upgrade head

# Обновить frontend
docker-compose -f docker-compose.prod.yml up -d --no-deps frontend
sleep 10

# Перезагрузить nginx
docker-compose -f docker-compose.prod.yml exec -T nginx nginx -s reload

# Проверка
curl -f https://theatre.example.com/health
```

### Обновление с downtime

```bash
# Остановка
docker-compose -f docker-compose.prod.yml down

# Обновление
git pull origin main
docker-compose -f docker-compose.prod.yml build

# Запуск
docker-compose -f docker-compose.prod.yml up -d

# Миграции
docker-compose -f docker-compose.prod.yml exec backend alembic upgrade head
```

---

## Откат

### Откат на предыдущую версию

```bash
cd /opt/theatre

# Посмотреть историю
git log --oneline -10

# Откат на конкретный коммит
git checkout <commit-hash>

# Пересборка и перезапуск
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d --no-deps backend frontend
```

### Откат миграций БД

```bash
# Посмотреть текущую версию
docker-compose -f docker-compose.prod.yml exec backend alembic current

# История миграций
docker-compose -f docker-compose.prod.yml exec backend alembic history

# Откат на одну миграцию
docker-compose -f docker-compose.prod.yml exec backend alembic downgrade -1

# Откат на конкретную версию
docker-compose -f docker-compose.prod.yml exec backend alembic downgrade <revision>
```

### Полное восстановление из backup

```bash
# Остановка
docker-compose -f docker-compose.prod.yml down

# Откат кода
git checkout <stable-commit>

# Восстановление БД
docker-compose -f docker-compose.prod.yml up -d db redis
sleep 10
docker-compose -f docker-compose.prod.yml --profile backup run --rm backup /backup.sh restore theatre_backup_YYYYMMDD_HHMMSS.sql.gz

# Восстановление файлов
tar -xzf storage_backup_YYYYMMDD.tar.gz

# Полный запуск
docker-compose -f docker-compose.prod.yml up -d
```

---

## Troubleshooting

### Контейнер не запускается

```bash
# Логи конкретного контейнера
docker-compose -f docker-compose.prod.yml logs backend

# Перезапуск с пересборкой
docker-compose -f docker-compose.prod.yml up -d --build --force-recreate backend
```

### Ошибки подключения к БД

```bash
# Проверка PostgreSQL
docker-compose -f docker-compose.prod.yml exec db pg_isready -U theatre_prod

# Проверка подключения из backend
docker-compose -f docker-compose.prod.yml exec backend python -c "from app.database.session import engine; print('OK')"
```

### Нехватка места на диске

```bash
# Очистка Docker
docker system prune -af --volumes

# Очистка старых образов
docker image prune -af

# Очистка логов
sudo truncate -s 0 /var/lib/docker/containers/*/*-json.log
```

### Высокая нагрузка

```bash
# Увеличить workers
# В .env: BACKEND_WORKERS=8
docker-compose -f docker-compose.prod.yml up -d backend

# Проверить slow queries
docker-compose -f docker-compose.prod.yml exec db psql -U theatre_prod -d theatre_production -c "SELECT * FROM pg_stat_activity WHERE state = 'active';"
```
