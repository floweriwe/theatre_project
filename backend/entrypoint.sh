#!/bin/bash
set -e

# ═══════════════════════════════════════════════════════════════
# 🎭 Theatre Management System — Docker Entrypoint
# ═══════════════════════════════════════════════════════════════

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  🎭 THEATRE MANAGEMENT SYSTEM"
echo "═══════════════════════════════════════════════════════════"
echo ""

# Ждём PostgreSQL
echo "⏳ Ожидание PostgreSQL..."
while ! nc -z ${POSTGRES_HOST:-db} ${POSTGRES_PORT:-5432}; do
  sleep 1
done
echo "✅ PostgreSQL доступен"

# Ждём Redis
echo "⏳ Ожидание Redis..."
while ! nc -z ${REDIS_HOST:-redis} ${REDIS_PORT:-6379}; do
  sleep 1
done
echo "✅ Redis доступен"

echo ""

# Проверяем команду
case "$1" in
  init)
    echo "🚀 Запуск инициализации базы данных..."
    python -m scripts.init_db
    ;;
  dev)
    echo "🔧 Запуск в режиме разработки..."
    # Автоматическая инициализация при первом запуске
    if [ ! -f /tmp/.db_initialized ]; then
      echo "📦 Первый запуск — инициализация БД..."
      python -m scripts.init_db && touch /tmp/.db_initialized
    fi
    exec uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
    ;;
  prod)
    echo "🏭 Запуск в production режиме..."
    exec gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker -b 0.0.0.0:8000
    ;;
  migrate)
    echo "🗄️ Применение миграций..."
    alembic upgrade head
    ;;
  test)
    echo "🧪 Запуск тестов..."
    pytest
    ;;
  shell)
    echo "🐚 Запуск Python shell..."
    python
    ;;
  *)
    # По умолчанию выполняем переданную команду
    exec "$@"
    ;;
esac
