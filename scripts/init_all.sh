#!/bin/bash
#
# 🎭 Theatre Management System — Полная инициализация
#
# Этот скрипт выполняет:
# 1. Запуск Docker контейнеров
# 2. Ожидание готовности сервисов
# 3. Применение миграций БД
# 4. Генерацию seed data
# 5. Генерацию тестовых файлов (PDF, изображения)
#
# Использование:
#   chmod +x scripts/init_all.sh
#   ./scripts/init_all.sh
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

# Функции
log_info() { echo -e "${BLUE}ℹ${NC} $1"; }
log_success() { echo -e "${GREEN}✓${NC} $1"; }
log_warning() { echo -e "${YELLOW}⚠${NC} $1"; }
log_error() { echo -e "${RED}✗${NC} $1"; }
log_header() { echo -e "\n${BOLD}${CYAN}$1${NC}\n"; }

# Проверка Docker
check_docker() {
    if ! command -v docker &> /dev/null; then
        log_error "Docker не установлен"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        log_error "Docker Compose не установлен"
        exit 1
    fi
    
    log_success "Docker и Docker Compose доступны"
}

# Определение команды docker-compose
get_compose_cmd() {
    if docker compose version &> /dev/null 2>&1; then
        echo "docker compose"
    else
        echo "docker-compose"
    fi
}

# =============================================================================
# MAIN
# =============================================================================

echo ""
echo -e "${BOLD}${CYAN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BOLD}${CYAN}║         🎭 THEATRE MANAGEMENT SYSTEM                         ║${NC}"
echo -e "${BOLD}${CYAN}║            ПОЛНАЯ ИНИЦИАЛИЗАЦИЯ                              ║${NC}"
echo -e "${BOLD}${CYAN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Переходим в корень проекта
cd "$(dirname "$0")/.."
PROJECT_ROOT=$(pwd)
log_info "Директория проекта: $PROJECT_ROOT"

# Проверка Docker
log_header "1. Проверка Docker"
check_docker
COMPOSE_CMD=$(get_compose_cmd)
log_info "Используется: $COMPOSE_CMD"

# Выбор compose файла
COMPOSE_FILE="docker-compose.dev.yml"
if [ ! -f "$COMPOSE_FILE" ]; then
    COMPOSE_FILE="docker-compose.yml"
fi
log_info "Compose файл: $COMPOSE_FILE"

# Остановка старых контейнеров
log_header "2. Остановка старых контейнеров"
$COMPOSE_CMD -f $COMPOSE_FILE down --remove-orphans 2>/dev/null || true
log_success "Старые контейнеры остановлены"

# Запуск контейнеров
log_header "3. Запуск контейнеров"
$COMPOSE_CMD -f $COMPOSE_FILE up -d --build

# Ожидание готовности
log_header "4. Ожидание готовности сервисов"

# PostgreSQL
log_info "Ожидание PostgreSQL..."
for i in {1..30}; do
    if $COMPOSE_CMD -f $COMPOSE_FILE exec -T db pg_isready -U theatre -d theatre_db &>/dev/null; then
        log_success "PostgreSQL готов"
        break
    fi
    if [ $i -eq 30 ]; then
        log_error "PostgreSQL не запустился за 30 секунд"
        exit 1
    fi
    sleep 1
done

# Redis
log_info "Ожидание Redis..."
for i in {1..30}; do
    if $COMPOSE_CMD -f $COMPOSE_FILE exec -T redis redis-cli ping &>/dev/null; then
        log_success "Redis готов"
        break
    fi
    if [ $i -eq 30 ]; then
        log_error "Redis не запустился за 30 секунд"
        exit 1
    fi
    sleep 1
done

# Backend
log_info "Ожидание Backend..."
for i in {1..60}; do
    if curl -s http://localhost:8000/health &>/dev/null; then
        log_success "Backend готов"
        break
    fi
    if [ $i -eq 60 ]; then
        log_warning "Backend не отвечает на /health, продолжаем..."
        break
    fi
    sleep 1
done

# Применение миграций
log_header "5. Применение миграций Alembic"
$COMPOSE_CMD -f $COMPOSE_FILE exec -T backend alembic upgrade head
log_success "Миграции применены"

# Инициализация данных
log_header "6. Инициализация тестовых данных"
$COMPOSE_CMD -f $COMPOSE_FILE exec -T backend python -m scripts.init_db
log_success "Тестовые данные созданы"

# Генерация файлов
log_header "7. Генерация тестовых файлов"

# Установка зависимостей для генерации
$COMPOSE_CMD -f $COMPOSE_FILE exec -T backend pip install reportlab pillow --break-system-packages --quiet 2>/dev/null || true

# Генерация PDF и изображений
$COMPOSE_CMD -f $COMPOSE_FILE exec -T backend python << 'PYTHON_SCRIPT'
import sys
sys.path.insert(0, '/app')

from pathlib import Path

storage_path = Path("/app/storage")
documents_path = storage_path / "documents"
posters_path = storage_path / "posters"

documents_path.mkdir(parents=True, exist_ok=True)
posters_path.mkdir(parents=True, exist_ok=True)
(documents_path / "general").mkdir(exist_ok=True)

print("  Генерация документов...")

try:
    from reportlab.lib.pagesizes import A4
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
    from reportlab.lib.styles import getSampleStyleSheet
    from reportlab.lib.units import cm
    
    def create_pdf(path, title, content):
        doc = SimpleDocTemplate(str(path), pagesize=A4,
                               rightMargin=2*cm, leftMargin=2*cm,
                               topMargin=2*cm, bottomMargin=2*cm)
        styles = getSampleStyleSheet()
        story = [Paragraph(title, styles['Heading1']), Spacer(1, 20)]
        for line in content:
            story.append(Paragraph(line, styles['Normal']))
            story.append(Spacer(1, 5))
        doc.build(story)
        return path.stat().st_size
    
    # Устав
    path = documents_path / "general" / "ustav_teatra.pdf"
    size = create_pdf(path, "УСТАВ ТЕАТРА", [
        "ГЛАВА 1. ОБЩИЕ ПОЛОЖЕНИЯ",
        "1.1. Московский Драматический Театр является государственным учреждением культуры.",
        "1.2. Основная цель - создание и показ спектаклей.",
        "ГЛАВА 2. ДЕЯТЕЛЬНОСТЬ",
        "2.1. Театр осуществляет постановку спектаклей.",
        "2.2. Организует гастроли и фестивали.",
    ])
    print(f"    ✓ Устав театра: {size/1024:.1f} KB")
    
    # Штатное расписание
    path = documents_path / "general" / "staff_schedule.pdf"
    size = create_pdf(path, "ШТАТНОЕ РАСПИСАНИЕ", [
        "Художественный руководитель: 1 ед.",
        "Главный режиссёр: 1 ед.",
        "Артисты: 35 ед.",
        "Технический персонал: 20 ед.",
    ])
    print(f"    ✓ Штатное расписание: {size/1024:.1f} KB")
    
    # Бюджет
    path = documents_path / "general" / "budget_2025.pdf"
    size = create_pdf(path, "БЮДЖЕТ НА 2025 ГОД", [
        "ДОХОДЫ: Субсидия: 100 млн руб., Билеты: 40 млн руб.",
        "РАСХОДЫ: ФОТ: 60 млн руб., Постановки: 30 млн руб.",
    ])
    print(f"    ✓ Бюджет: {size/1024:.1f} KB")
    
    # Техрайдеры для спектаклей
    for perf_id in range(1, 6):
        perf_dir = documents_path / "performances" / str(perf_id)
        perf_dir.mkdir(parents=True, exist_ok=True)
        path = perf_dir / "tech_rider.pdf"
        size = create_pdf(path, f"ТЕХНИЧЕСКИЙ РАЙДЕР #{perf_id}", [
            "ТРЕБОВАНИЯ К СЦЕНЕ: Размер: 12м x 10м, Высота: 10м",
            "СВЕТ: Прожекторы: 30 шт., Пульт: GrandMA2",
            "ЗВУК: Линейный массив, 8 мониторов",
        ])
        print(f"    ✓ Техрайдер #{perf_id}: {size/1024:.1f} KB")

except ImportError as e:
    print(f"  ⚠ reportlab недоступен: {e}")

# Генерация постеров
print("\n  Генерация постеров...")

try:
    from PIL import Image, ImageDraw, ImageFont
    
    performances = [
        ("Вишнёвый сад", "#D4A574"),
        ("Три сестры", "#DC5050"),
        ("Гамлет", "#6496DC"),
        ("Ревизор", "#50B478"),
        ("Чайка", "#A064C8"),
    ]
    
    for i, (title, color) in enumerate(performances, 1):
        img = Image.new('RGB', (800, 1200), (15, 20, 25))
        draw = ImageDraw.Draw(img)
        
        r, g, b = int(color[1:3], 16), int(color[3:5], 16), int(color[5:7], 16)
        accent = (r, g, b)
        
        draw.rectangle([50, 100, 750, 105], fill=accent)
        draw.rectangle([50, 1050, 750, 1055], fill=accent)
        draw.rectangle([100, 400, 700, 800], outline=accent, width=2)
        
        try:
            font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 42)
        except:
            font = ImageFont.load_default()
        
        bbox = draw.textbbox((0, 0), title, font=font)
        x = (800 - (bbox[2] - bbox[0])) // 2
        draw.text((x, 550), title, fill=(241, 245, 249), font=font)
        
        path = posters_path / f"performance_{i}.jpg"
        img.save(str(path), "JPEG", quality=85)
        print(f"    ✓ Постер «{title}»: {path.stat().st_size/1024:.1f} KB")

except ImportError as e:
    print(f"  ⚠ pillow недоступен: {e}")

print("\n  ✅ Генерация файлов завершена")
PYTHON_SCRIPT

log_success "Тестовые файлы сгенерированы"

# Итог
log_header "8. ИНИЦИАЛИЗАЦИЯ ЗАВЕРШЕНА"

echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                    ✅ ГОТОВО!                                ║${NC}"
echo -e "${GREEN}╠══════════════════════════════════════════════════════════════╣${NC}"
echo -e "${GREEN}║                                                              ║${NC}"
echo -e "${GREEN}║  🌐 Frontend: http://localhost:5173                          ║${NC}"
echo -e "${GREEN}║  🔧 Backend:  http://localhost:8000                          ║${NC}"
echo -e "${GREEN}║  📚 API Docs: http://localhost:8000/docs                     ║${NC}"
echo -e "${GREEN}║                                                              ║${NC}"
echo -e "${GREEN}║  👤 Логин:    admin@theatre.test                             ║${NC}"
echo -e "${GREEN}║  🔑 Пароль:   Theatre2024!                                   ║${NC}"
echo -e "${GREEN}║                                                              ║${NC}"
echo -e "${GREEN}║  Для тестирования: ./scripts/test_all.sh                     ║${NC}"
echo -e "${GREEN}║                                                              ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""
