-- =============================================================================
-- Theatre Management System - Database Initialization
-- =============================================================================
-- Этот скрипт выполняется автоматически при первом запуске PostgreSQL контейнера
-- =============================================================================

-- Устанавливаем кодировку клиента
SET client_encoding = 'UTF8';

-- Создаём расширения
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- Для полнотекстового поиска

-- Информационное сообщение
DO $$
BEGIN
    RAISE NOTICE 'Theatre database initialized successfully with UTF-8 encoding!';
END
$$;
