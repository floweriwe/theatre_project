#!/bin/bash
#
# 🎭 Theatre Management System — Полное тестирование
#
# Этот скрипт выполняет:
# 1. Проверку доступности сервисов
# 2. Тестирование аутентификации
# 3. Тестирование всех API endpoints
# 4. Тестирование CRUD операций
# 5. Проверку файлов и storage
#
# Использование:
#   chmod +x scripts/test_all.sh
#   ./scripts/test_all.sh
#

set -e

# Цвета
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

# Счётчики
PASSED=0
FAILED=0
WARNINGS=0

# Функции логирования
log_pass() { 
    ((PASSED++))
    echo -e "  ${GREEN}✓${NC} $1"
}
log_fail() { 
    ((FAILED++))
    echo -e "  ${RED}✗${NC} $1"
}
log_warn() { 
    ((WARNINGS++))
    echo -e "  ${YELLOW}⚠${NC} $1"
}
log_info() { echo -e "  ${BLUE}ℹ${NC} $1"; }
log_header() { echo -e "\n${BOLD}${CYAN}$1${NC}"; }

# Базовые URL
API_URL="http://localhost:8000/api/v1"
FRONTEND_URL="http://localhost:5173"

# Токен (будет заполнен после авторизации)
TOKEN=""

# =============================================================================
# Утилиты
# =============================================================================

# HTTP запрос с проверкой
api_test() {
    local method=$1
    local endpoint=$2
    local expected_code=$3
    local description=$4
    local data=$5
    
    local url="${API_URL}${endpoint}"
    local headers="-H 'Content-Type: application/json'"
    
    if [ -n "$TOKEN" ]; then
        headers="$headers -H 'Authorization: Bearer $TOKEN'"
    fi
    
    local response
    local http_code
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" "$url" 2>/dev/null)
    elif [ "$method" = "POST" ]; then
        response=$(curl -s -w "\n%{http_code}" -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" -d "$data" "$url" 2>/dev/null)
    elif [ "$method" = "PATCH" ]; then
        response=$(curl -s -w "\n%{http_code}" -X PATCH -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" -d "$data" "$url" 2>/dev/null)
    elif [ "$method" = "DELETE" ]; then
        response=$(curl -s -w "\n%{http_code}" -X DELETE -H "Authorization: Bearer $TOKEN" "$url" 2>/dev/null)
    fi
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" = "$expected_code" ]; then
        log_pass "$description (HTTP $http_code)"
        echo "$body"
        return 0
    else
        log_fail "$description (ожидался $expected_code, получен $http_code)"
        echo "$body"
        return 1
    fi
}

# =============================================================================
# MAIN
# =============================================================================

echo ""
echo -e "${BOLD}${CYAN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BOLD}${CYAN}║         🎭 THEATRE MANAGEMENT SYSTEM                         ║${NC}"
echo -e "${BOLD}${CYAN}║              ПОЛНОЕ ТЕСТИРОВАНИЕ                             ║${NC}"
echo -e "${BOLD}${CYAN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo "Дата: $(date '+%Y-%m-%d %H:%M:%S')"
echo ""

# =============================================================================
# 1. Проверка сервисов
# =============================================================================

log_header "1. ПРОВЕРКА СЕРВИСОВ"

# Backend
if curl -s "${API_URL}/auth/me" -o /dev/null 2>/dev/null || curl -s "http://localhost:8000/docs" -o /dev/null 2>/dev/null; then
    log_pass "Backend доступен (localhost:8000)"
else
    log_fail "Backend недоступен"
fi

# Frontend
if curl -s "$FRONTEND_URL" -o /dev/null 2>/dev/null; then
    log_pass "Frontend доступен (localhost:5173)"
else
    log_warn "Frontend недоступен (возможно, используется другой порт)"
fi

# API Docs
if curl -s "http://localhost:8000/docs" | grep -q "swagger" 2>/dev/null; then
    log_pass "API документация доступна (/docs)"
else
    log_warn "API документация не отвечает"
fi

# =============================================================================
# 2. Аутентификация
# =============================================================================

log_header "2. АУТЕНТИФИКАЦИЯ"

# Логин
log_info "Попытка входа как admin@theatre.test..."
LOGIN_RESPONSE=$(curl -s -X POST "${API_URL}/auth/login" \
    -H "Content-Type: application/x-www-form-urlencoded" \
    -d "username=admin@theatre.test&password=Theatre2024!" 2>/dev/null)

TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)

if [ -n "$TOKEN" ]; then
    log_pass "Авторизация успешна"
    log_info "Токен получен: ${TOKEN:0:20}..."
else
    log_fail "Авторизация не удалась"
    echo "Ответ: $LOGIN_RESPONSE"
    echo ""
    echo -e "${RED}Тестирование API невозможно без токена. Остановка.${NC}"
    exit 1
fi

# Проверка /auth/me
ME_RESPONSE=$(curl -s "${API_URL}/auth/me" -H "Authorization: Bearer $TOKEN" 2>/dev/null)
if echo "$ME_RESPONSE" | grep -q "admin@theatre.test"; then
    log_pass "GET /auth/me работает"
else
    log_fail "GET /auth/me не работает"
fi

# =============================================================================
# 3. Inventory API
# =============================================================================

log_header "3. INVENTORY API"

# Список
ITEMS_RESPONSE=$(curl -s "${API_URL}/inventory/items" -H "Authorization: Bearer $TOKEN" 2>/dev/null)
if echo "$ITEMS_RESPONSE" | grep -q '"items"'; then
    ITEMS_COUNT=$(echo "$ITEMS_RESPONSE" | grep -o '"total":[0-9]*' | cut -d':' -f2)
    log_pass "GET /inventory/items (найдено: $ITEMS_COUNT)"
else
    log_fail "GET /inventory/items"
fi

# Детали
ITEM_RESPONSE=$(curl -s "${API_URL}/inventory/items/1" -H "Authorization: Bearer $TOKEN" 2>/dev/null)
if echo "$ITEM_RESPONSE" | grep -q '"id":1'; then
    ITEM_NAME=$(echo "$ITEM_RESPONSE" | grep -o '"name":"[^"]*"' | head -1 | cut -d'"' -f4)
    log_pass "GET /inventory/items/1 ($ITEM_NAME)"
else
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "${API_URL}/inventory/items/1" -H "Authorization: Bearer $TOKEN")
    log_fail "GET /inventory/items/1 (HTTP $HTTP_CODE)"
fi

# Категории
CAT_RESPONSE=$(curl -s "${API_URL}/inventory/categories" -H "Authorization: Bearer $TOKEN" 2>/dev/null)
if echo "$CAT_RESPONSE" | grep -q '"id"'; then
    log_pass "GET /inventory/categories"
else
    log_fail "GET /inventory/categories"
fi

# Локации
LOC_RESPONSE=$(curl -s "${API_URL}/inventory/locations" -H "Authorization: Bearer $TOKEN" 2>/dev/null)
if echo "$LOC_RESPONSE" | grep -q '"id"'; then
    log_pass "GET /inventory/locations"
else
    log_fail "GET /inventory/locations"
fi

# =============================================================================
# 4. Documents API
# =============================================================================

log_header "4. DOCUMENTS API"

# Список
DOCS_RESPONSE=$(curl -s "${API_URL}/documents" -H "Authorization: Bearer $TOKEN" 2>/dev/null)
if echo "$DOCS_RESPONSE" | grep -q '"items"'; then
    DOCS_COUNT=$(echo "$DOCS_RESPONSE" | grep -o '"total":[0-9]*' | cut -d':' -f2)
    log_pass "GET /documents (найдено: $DOCS_COUNT)"
else
    log_fail "GET /documents"
fi

# Детали
DOC_RESPONSE=$(curl -s "${API_URL}/documents/1" -H "Authorization: Bearer $TOKEN" 2>/dev/null)
if echo "$DOC_RESPONSE" | grep -q '"id":1'; then
    DOC_NAME=$(echo "$DOC_RESPONSE" | grep -o '"name":"[^"]*"' | head -1 | cut -d'"' -f4)
    log_pass "GET /documents/1 ($DOC_NAME)"
else
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "${API_URL}/documents/1" -H "Authorization: Bearer $TOKEN")
    log_fail "GET /documents/1 (HTTP $HTTP_CODE)"
fi

# Категории документов
DCAT_RESPONSE=$(curl -s "${API_URL}/documents/categories" -H "Authorization: Bearer $TOKEN" 2>/dev/null)
if echo "$DCAT_RESPONSE" | grep -q '"id"'; then
    log_pass "GET /documents/categories"
else
    log_fail "GET /documents/categories"
fi

# =============================================================================
# 5. Performances API
# =============================================================================

log_header "5. PERFORMANCES API"

# Список
PERFS_RESPONSE=$(curl -s "${API_URL}/performances" -H "Authorization: Bearer $TOKEN" 2>/dev/null)
if echo "$PERFS_RESPONSE" | grep -q '"items"'; then
    PERFS_COUNT=$(echo "$PERFS_RESPONSE" | grep -o '"total":[0-9]*' | cut -d':' -f2)
    log_pass "GET /performances (найдено: $PERFS_COUNT)"
else
    log_fail "GET /performances"
fi

# Детали
PERF_RESPONSE=$(curl -s "${API_URL}/performances/1" -H "Authorization: Bearer $TOKEN" 2>/dev/null)
if echo "$PERF_RESPONSE" | grep -q '"id":1'; then
    PERF_TITLE=$(echo "$PERF_RESPONSE" | grep -o '"title":"[^"]*"' | head -1 | cut -d'"' -f4)
    log_pass "GET /performances/1 ($PERF_TITLE)"
else
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "${API_URL}/performances/1" -H "Authorization: Bearer $TOKEN")
    log_fail "GET /performances/1 (HTTP $HTTP_CODE)"
fi

# Репертуар
REP_RESPONSE=$(curl -s "${API_URL}/performances/repertoire" -H "Authorization: Bearer $TOKEN" 2>/dev/null)
if echo "$REP_RESPONSE" | grep -q '"id"' || [ "$REP_RESPONSE" = "[]" ]; then
    log_pass "GET /performances/repertoire"
else
    log_fail "GET /performances/repertoire"
fi

# =============================================================================
# 6. Schedule API
# =============================================================================

log_header "6. SCHEDULE API"

# Список
EVENTS_RESPONSE=$(curl -s "${API_URL}/schedule" -H "Authorization: Bearer $TOKEN" 2>/dev/null)
if echo "$EVENTS_RESPONSE" | grep -q '"items"'; then
    EVENTS_COUNT=$(echo "$EVENTS_RESPONSE" | grep -o '"total":[0-9]*' | cut -d':' -f2)
    log_pass "GET /schedule (найдено: $EVENTS_COUNT)"
else
    log_fail "GET /schedule"
fi

# Детали события
EVENT_RESPONSE=$(curl -s "${API_URL}/schedule/1" -H "Authorization: Bearer $TOKEN" 2>/dev/null)
if echo "$EVENT_RESPONSE" | grep -q '"id":1'; then
    EVENT_TITLE=$(echo "$EVENT_RESPONSE" | grep -o '"title":"[^"]*"' | head -1 | cut -d'"' -f4)
    log_pass "GET /schedule/1 ($EVENT_TITLE)"
else
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "${API_URL}/schedule/1" -H "Authorization: Bearer $TOKEN")
    log_warn "GET /schedule/1 (HTTP $HTTP_CODE)"
fi

# Предстоящие события
UPCOMING_RESPONSE=$(curl -s "${API_URL}/schedule/upcoming?days=30" -H "Authorization: Bearer $TOKEN" 2>/dev/null)
if echo "$UPCOMING_RESPONSE" | grep -q '"id"' || [ "$UPCOMING_RESPONSE" = "[]" ]; then
    log_pass "GET /schedule/upcoming"
else
    log_warn "GET /schedule/upcoming"
fi

# =============================================================================
# 7. CRUD тесты (Create, Update, Delete)
# =============================================================================

log_header "7. CRUD ОПЕРАЦИИ"

# Создание категории инвентаря
log_info "Создание тестовой категории..."
CREATE_CAT=$(curl -s -X POST "${API_URL}/inventory/categories" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"name":"Тест категория","code":"TEST","description":"Тестовая категория"}' 2>/dev/null)

if echo "$CREATE_CAT" | grep -q '"id"'; then
    TEST_CAT_ID=$(echo "$CREATE_CAT" | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
    log_pass "POST /inventory/categories (создан ID: $TEST_CAT_ID)"
    
    # Обновление
    UPDATE_CAT=$(curl -s -X PATCH "${API_URL}/inventory/categories/$TEST_CAT_ID" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d '{"name":"Тест обновлён"}' 2>/dev/null)
    
    if echo "$UPDATE_CAT" | grep -q "Тест обновлён"; then
        log_pass "PATCH /inventory/categories/$TEST_CAT_ID"
    else
        log_fail "PATCH /inventory/categories/$TEST_CAT_ID"
    fi
    
    # Удаление
    DELETE_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE \
        "${API_URL}/inventory/categories/$TEST_CAT_ID" \
        -H "Authorization: Bearer $TOKEN" 2>/dev/null)
    
    if [ "$DELETE_CODE" = "204" ] || [ "$DELETE_CODE" = "200" ]; then
        log_pass "DELETE /inventory/categories/$TEST_CAT_ID"
    else
        log_fail "DELETE /inventory/categories/$TEST_CAT_ID (HTTP $DELETE_CODE)"
    fi
else
    log_fail "POST /inventory/categories"
fi

# =============================================================================
# 8. Проверка storage
# =============================================================================

log_header "8. ПРОВЕРКА STORAGE"

# Используем docker-compose для проверки файлов
COMPOSE_CMD="docker-compose"
if docker compose version &>/dev/null 2>&1; then
    COMPOSE_CMD="docker compose"
fi

COMPOSE_FILE="docker-compose.dev.yml"
if [ ! -f "$COMPOSE_FILE" ]; then
    COMPOSE_FILE="docker-compose.yml"
fi

# Проверка документов
DOC_COUNT=$($COMPOSE_CMD -f $COMPOSE_FILE exec -T backend find /app/storage/documents -type f 2>/dev/null | wc -l || echo "0")
if [ "$DOC_COUNT" -gt "0" ]; then
    log_pass "Документы в storage: $DOC_COUNT файлов"
else
    log_warn "Документы в storage: нет файлов"
fi

# Проверка постеров
POSTER_COUNT=$($COMPOSE_CMD -f $COMPOSE_FILE exec -T backend find /app/storage/posters -type f 2>/dev/null | wc -l || echo "0")
if [ "$POSTER_COUNT" -gt "0" ]; then
    log_pass "Постеры в storage: $POSTER_COUNT файлов"
else
    log_warn "Постеры в storage: нет файлов"
fi

# =============================================================================
# ИТОГИ
# =============================================================================

echo ""
echo -e "${BOLD}${CYAN}══════════════════════════════════════════════════════════════${NC}"
echo -e "${BOLD}${CYAN}                        ИТОГИ                                 ${NC}"
echo -e "${BOLD}${CYAN}══════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "  ${GREEN}✓ Пройдено:${NC}      $PASSED"
echo -e "  ${RED}✗ Ошибок:${NC}        $FAILED"
echo -e "  ${YELLOW}⚠ Предупреждений:${NC} $WARNINGS"
echo ""

TOTAL=$((PASSED + FAILED))
if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}╔══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║              🎉 ВСЕ ТЕСТЫ ПРОЙДЕНЫ!                          ║${NC}"
    echo -e "${GREEN}╚══════════════════════════════════════════════════════════════╝${NC}"
    EXIT_CODE=0
elif [ $FAILED -le 2 ]; then
    echo -e "${YELLOW}╔══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${YELLOW}║          ⚠️  ЕСТЬ НЕБОЛЬШИЕ ПРОБЛЕМЫ                         ║${NC}"
    echo -e "${YELLOW}╚══════════════════════════════════════════════════════════════╝${NC}"
    EXIT_CODE=0
else
    echo -e "${RED}╔══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║          ❌ ОБНАРУЖЕНЫ КРИТИЧЕСКИЕ ОШИБКИ                    ║${NC}"
    echo -e "${RED}╚══════════════════════════════════════════════════════════════╝${NC}"
    EXIT_CODE=1
fi

echo ""
echo "Дата завершения: $(date '+%Y-%m-%d %H:%M:%S')"
echo ""

exit $EXIT_CODE
