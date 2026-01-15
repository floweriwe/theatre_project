#!/bin/bash
# =============================================================================
# Theatre Management System - Database Backup Script
# =============================================================================
# Использование: ./backup.sh [backup|restore] [filename]
# =============================================================================

set -e

BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/theatre_backup_${DATE}.sql.gz"

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

backup() {
    log_info "Starting backup..."
    log_info "Database: ${POSTGRES_DB}"
    log_info "Output: ${BACKUP_FILE}"
    
    pg_dump -h db -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" | gzip > "${BACKUP_FILE}"
    
    if [ $? -eq 0 ]; then
        SIZE=$(du -h "${BACKUP_FILE}" | cut -f1)
        log_info "Backup completed successfully!"
        log_info "File size: ${SIZE}"
        
        # Удаляем старые бэкапы (старше 30 дней)
        find "${BACKUP_DIR}" -name "theatre_backup_*.sql.gz" -mtime +30 -delete
        log_info "Old backups cleaned up"
    else
        log_error "Backup failed!"
        exit 1
    fi
}

restore() {
    if [ -z "$1" ]; then
        log_error "Please specify backup file to restore"
        log_info "Available backups:"
        ls -la "${BACKUP_DIR}"/theatre_backup_*.sql.gz 2>/dev/null || echo "No backups found"
        exit 1
    fi
    
    RESTORE_FILE="${BACKUP_DIR}/$1"
    
    if [ ! -f "${RESTORE_FILE}" ]; then
        log_error "Backup file not found: ${RESTORE_FILE}"
        exit 1
    fi
    
    log_warn "This will OVERWRITE the current database!"
    log_warn "Database: ${POSTGRES_DB}"
    log_warn "Restore from: ${RESTORE_FILE}"
    read -p "Are you sure? (yes/no): " confirm
    
    if [ "$confirm" != "yes" ]; then
        log_info "Restore cancelled"
        exit 0
    fi
    
    log_info "Starting restore..."
    
    # Отключаем соединения и пересоздаём БД
    psql -h db -U "${POSTGRES_USER}" -d postgres -c "
        SELECT pg_terminate_backend(pg_stat_activity.pid)
        FROM pg_stat_activity
        WHERE pg_stat_activity.datname = '${POSTGRES_DB}'
        AND pid <> pg_backend_pid();
    "
    
    psql -h db -U "${POSTGRES_USER}" -d postgres -c "DROP DATABASE IF EXISTS ${POSTGRES_DB};"
    psql -h db -U "${POSTGRES_USER}" -d postgres -c "CREATE DATABASE ${POSTGRES_DB};"
    
    # Восстанавливаем из бэкапа
    gunzip -c "${RESTORE_FILE}" | psql -h db -U "${POSTGRES_USER}" -d "${POSTGRES_DB}"
    
    if [ $? -eq 0 ]; then
        log_info "Restore completed successfully!"
    else
        log_error "Restore failed!"
        exit 1
    fi
}

list() {
    log_info "Available backups:"
    ls -lah "${BACKUP_DIR}"/theatre_backup_*.sql.gz 2>/dev/null || echo "No backups found"
}

# Main
case "$1" in
    backup)
        backup
        ;;
    restore)
        restore "$2"
        ;;
    list)
        list
        ;;
    *)
        echo "Usage: $0 {backup|restore|list} [filename]"
        echo ""
        echo "Commands:"
        echo "  backup          Create a new backup"
        echo "  restore <file>  Restore from backup file"
        echo "  list            List available backups"
        exit 1
        ;;
esac
