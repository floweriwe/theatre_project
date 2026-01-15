#!/usr/bin/env python3
"""
Скрипт для создания плоского архива проекта с версионированием.
Собирает все исходные файлы и кодирует их пути в именах с префиксом версии.

Запуск: python flat_project.py
Результат: gnatospace_v2.5.4_YYYYMMDD_HHMMSS.zip

Файлы внутри: v2.5.29__backend__app__main.py
"""

import os
import zipfile
from datetime import datetime
from pathlib import Path

# ============================================================
# ВЕРСИЯ ПРОЕКТА - ИЗМЕНЯТЬ ЗДЕСЬ!
# ============================================================

PROJECT_VERSION = "0.0.1_mvp"  # ← Текущая версия проекта
PROJECT_NAME = "theatre"  # Имя проекта для архива

# ============================================================
# КОНФИГУРАЦИЯ - что исключаем из архива
# ============================================================

# Папки, которые полностью игнорируем
EXCLUDED_DIRS = {
    'node_modules',
    '__pycache__',
    '.git',
    '.vscode',
    '.idea',
    'dist',
    'build',
    'logs',
    'ssl',
    '.pytest_cache',
    '.venv',
    'venv',
    'env',
    '.cache',
    'coverage',
    '.nyc_output',
}

# Файлы по имени, которые игнорируем
EXCLUDED_FILES = {
    '.env',                    # Конфиденциальные данные
    '.env.local',
    '.env.production',
    'package-lock.json',       # Генерируется автоматически
    '.DS_Store',               # macOS системные
    'Thumbs.db',               # Windows системные
    '.gitkeep',                # Placeholder файлы
    'show_tree.py',            # Утилита для отображения дерева
    'flat_project.py',         # Сам этот скрипт
}

# Расширения файлов, которые игнорируем (медиа, бинарные)
EXCLUDED_EXTENSIONS = {
    # Изображения
    '.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.ico',
    '.bmp', '.tiff',
    # Видео
    '.mp4', '.webm', '.avi', '.mov', '.mkv',
    # Аудио
    '.mp3', '.wav', '.ogg', '.m4a',
    # Шрифты
    '.woff', '.woff2', '.ttf', '.otf', '.eot',
    # Компилированные/бинарные
    '.pyc', '.pyo', '.so', '.dll', '.exe',
    '.class', '.jar',
    # Архивы
    '.zip', '.tar', '.gz', '.rar', '.7z',
    # Прочие бинарные
    '.pdf', '.doc', '.docx', '.xls', '.xlsx',
}

# Паттерны в путях, которые игнорируем
EXCLUDED_PATH_PATTERNS = [
    '/images/',        # Папки с изображениями
    '/videos/',        # Папки с видео
    '/fonts/',         # Папки со шрифтами
    '/cases/',         # Папка с кейсами (медиа)
    '/certificates/',  # Папка с сертификатами (изображения)
    '/doctors/',       # Папка с фото врачей
    '/logo/',          # Папка с логотипами
    '/processes/',     # Папка с изображениями процессов
    '/reasons/',       # Папка с изображениями причин
]

# ============================================================
# ОСНОВНАЯ ЛОГИКА
# ============================================================

def should_exclude_file(filepath: Path, rel_path: str) -> bool:
    """
    Проверяет, нужно ли исключить файл из архива.
    
    Args:
        filepath: Полный путь к файлу
        rel_path: Относительный путь от корня проекта
        
    Returns:
        True если файл нужно исключить
    """
    # Проверяем имя файла
    if filepath.name in EXCLUDED_FILES:
        return True
    
    # Проверяем расширение
    if filepath.suffix.lower() in EXCLUDED_EXTENSIONS:
        return True
    
    # Проверяем паттерны в пути
    rel_path_normalized = '/' + rel_path.replace('\\', '/')
    for pattern in EXCLUDED_PATH_PATTERNS:
        if pattern in rel_path_normalized:
            return True
    
    return False


def should_exclude_dir(dirname: str) -> bool:
    """
    Проверяет, нужно ли пропустить директорию.
    
    Args:
        dirname: Имя директории
        
    Returns:
        True если директорию нужно пропустить
    """
    return dirname in EXCLUDED_DIRS or dirname.startswith('.')


def encode_path_to_filename(rel_path: str, include_version: bool = True) -> str:
    """
    Кодирует относительный путь в имя файла с версией.
    Заменяет разделители путей на '__'.
    
    Пример: 
        'backend/app/main.py' -> 'v2.5.4__backend__app__main.py'
        'frontend/src/App.jsx' -> 'v2.5.4__frontend__src__App.jsx'
    
    Args:
        rel_path: Относительный путь файла
        include_version: Добавлять ли версию в начало
        
    Returns:
        Закодированное имя файла
    """
    # Нормализуем разделители путей
    normalized = rel_path.replace('\\', '/')
    # Заменяем / на __
    encoded = normalized.replace('/', '__')
    
    # Добавляем версию в начало
    if include_version:
        encoded = f"v{PROJECT_VERSION}__{encoded}"
    
    return encoded


def decode_filename_to_path(encoded_name: str) -> tuple[str, str]:
    """
    Декодирует имя файла обратно в путь и версию.
    
    Args:
        encoded_name: Закодированное имя файла
        
    Returns:
        Кортеж (версия, относительный_путь)
    """
    # Проверяем наличие версии
    if encoded_name.startswith('v') and '__' in encoded_name:
        parts = encoded_name.split('__', 1)
        version = parts[0][1:]  # Убираем 'v'
        path = parts[1].replace('__', '/') if len(parts) > 1 else ''
        return version, path
    else:
        # Без версии
        return None, encoded_name.replace('__', '/')


def collect_project_files(root_dir: Path) -> list[tuple[Path, str]]:
    """
    Собирает все файлы проекта для архивации.
    
    Args:
        root_dir: Корневая директория проекта
        
    Returns:
        Список кортежей (абсолютный_путь, относительный_путь)
    """
    files = []
    
    for dirpath, dirnames, filenames in os.walk(root_dir):
        # Фильтруем директории (модифицируем in-place для os.walk)
        dirnames[:] = [d for d in dirnames if not should_exclude_dir(d)]
        
        for filename in filenames:
            filepath = Path(dirpath) / filename
            rel_path = filepath.relative_to(root_dir)
            rel_path_str = str(rel_path)
            
            if not should_exclude_file(filepath, rel_path_str):
                files.append((filepath, rel_path_str))
    
    return files


def create_flat_archive(root_dir: Path, output_name: str = None, include_version: bool = True) -> str:
    """
    Создаёт плоский ZIP-архив со всеми файлами проекта.
    
    Args:
        root_dir: Корневая директория проекта
        output_name: Имя выходного файла (опционально)
        include_version: Добавлять версию в имена файлов
        
    Returns:
        Путь к созданному архиву
    """
    # Генерируем имя архива с версией и датой/временем
    if output_name is None:
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        output_name = f'{PROJECT_NAME}_v{PROJECT_VERSION}_{timestamp}.zip'
    
    # Собираем файлы
    print(f"📂 Сканирование директории: {root_dir}")
    print(f"🏷️  Версия проекта: v{PROJECT_VERSION}")
    files = collect_project_files(root_dir)
    
    if not files:
        print("⚠️  Не найдено файлов для архивации!")
        return None
    
    print(f"📄 Найдено файлов: {len(files)}")
    print()
    
    # Создаём архив
    output_path = root_dir / output_name
    
    with zipfile.ZipFile(output_path, 'w', zipfile.ZIP_DEFLATED) as zf:
        print("📦 Создание архива...")
        print("-" * 70)
        
        for filepath, rel_path in sorted(files, key=lambda x: x[1]):
            # Кодируем путь в имя файла с версией
            encoded_name = encode_path_to_filename(rel_path, include_version)
            
            # Добавляем в архив
            zf.write(filepath, encoded_name)
            
            # Выводим информацию
            size = filepath.stat().st_size
            size_str = format_size(size)
            print(f"  ✓ {rel_path}")
            print(f"    → {encoded_name} ({size_str})")
    
    # Итоговая статистика
    archive_size = output_path.stat().st_size
    print("-" * 70)
    print(f"\n✅ Архив создан: {output_name}")
    print(f"🏷️  Версия: v{PROJECT_VERSION}")
    print(f"📊 Размер архива: {format_size(archive_size)}")
    print(f"📄 Файлов в архиве: {len(files)}")
    
    return str(output_path)


def format_size(size_bytes: int) -> str:
    """Форматирует размер файла в читаемый вид."""
    for unit in ['B', 'KB', 'MB', 'GB']:
        if size_bytes < 1024:
            return f"{size_bytes:.1f} {unit}"
        size_bytes /= 1024
    return f"{size_bytes:.1f} TB"


def print_file_manifest(root_dir: Path):
    """
    Выводит список файлов, которые будут включены в архив.
    Полезно для предварительного просмотра.
    """
    files = collect_project_files(root_dir)
    
    print(f"\n📋 МАНИФЕСТ ФАЙЛОВ — v{PROJECT_VERSION}")
    print("=" * 70)
    
    # Группируем по директориям верхнего уровня
    by_dir = {}
    for filepath, rel_path in files:
        top_dir = rel_path.split('/')[0] if '/' in rel_path.replace('\\', '/') else '.'
        if top_dir not in by_dir:
            by_dir[top_dir] = []
        by_dir[top_dir].append(rel_path)
    
    total_size = 0
    for dir_name in sorted(by_dir.keys()):
        print(f"\n📁 {dir_name}/")
        for rel_path in sorted(by_dir[dir_name]):
            filepath = root_dir / rel_path
            size = filepath.stat().st_size
            total_size += size
            encoded = encode_path_to_filename(rel_path)
            print(f"   • {rel_path}")
            print(f"     → {encoded} ({format_size(size)})")
    
    print("\n" + "=" * 70)
    print(f"🏷️  Версия: v{PROJECT_VERSION}")
    print(f"📊 Всего файлов: {len(files)}")
    print(f"📊 Общий размер: {format_size(total_size)}")


def print_version_history():
    """
    Выводит информацию о версии.
    """
    print(f"""
╔══════════════════════════════════════════════════════════════════╗
║  {PROJECT_NAME.upper()} — Версионирование проекта
╠══════════════════════════════════════════════════════════════════╣
║  Текущая версия: v{PROJECT_VERSION}
║  
║  Формат версии: MAJOR.MINOR.PATCH
║  • MAJOR — крупные изменения, несовместимые с предыдущими
║  • MINOR — новый функционал, обратно совместимый  
║  • PATCH — исправления багов
║
║  Формат имени файла в архиве:
║  v{PROJECT_VERSION}__<путь>__<файл>.расширение
║
║  Пример:
║  v{PROJECT_VERSION}__backend__app__main.py
║  v{PROJECT_VERSION}__frontend__src__components__Header.jsx
╚══════════════════════════════════════════════════════════════════╝
""")


# ============================================================
# ТОЧКА ВХОДА
# ============================================================

if __name__ == '__main__':
    import argparse
    
    parser = argparse.ArgumentParser(
        description='Создание плоского архива проекта с версионированием',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=f"""
Примеры использования:
  python flat_project.py                    # Создать архив с версией v{PROJECT_VERSION}
  python flat_project.py -m                 # Показать список файлов
  python flat_project.py --no-version       # Архив без версии в именах
  python flat_project.py -v                 # Показать информацию о версии

Текущая версия: v{PROJECT_VERSION}
Измените PROJECT_VERSION в начале файла для смены версии.
        """
    )
    parser.add_argument(
        '--manifest', '-m',
        action='store_true',
        help='Только показать список файлов без создания архива'
    )
    parser.add_argument(
        '--version-info', '-v',
        action='store_true',
        help='Показать информацию о версионировании'
    )
    parser.add_argument(
        '--no-version',
        action='store_true',
        help='Не добавлять версию в имена файлов'
    )
    parser.add_argument(
        '--output', '-o',
        type=str,
        default=None,
        help='Имя выходного архива (по умолчанию: gnatospace_vX.X.X_TIMESTAMP.zip)'
    )
    parser.add_argument(
        '--dir', '-d',
        type=str,
        default='.',
        help='Директория проекта (по умолчанию: текущая)'
    )
    
    args = parser.parse_args()
    
    # Показать информацию о версии
    if args.version_info:
        print_version_history()
        exit(0)
    
    # Определяем корневую директорию
    root_dir = Path(args.dir).resolve()
    
    if not root_dir.exists():
        print(f"❌ Директория не найдена: {root_dir}")
        exit(1)
    
    print("=" * 70)
    print(f"🔧 FLATTEN PROJECT v{PROJECT_VERSION} — Создание плоского архива")
    print("=" * 70)
    
    if args.manifest:
        # Только показываем манифест
        print_file_manifest(root_dir)
    else:
        # Создаём архив
        include_version = not args.no_version
        create_flat_archive(root_dir, args.output, include_version)
