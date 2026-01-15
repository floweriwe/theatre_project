import os

# Папки и файлы, которые будем игнорировать
EXCLUDE_DIRS = {'.venv', '__pycache__', '.git', '.idea', '.vscode', 'node_modules'}
EXCLUDE_EXTS = {'.pyc', '.pyo', '.log', '.tmp', '.bak'}

def print_tree(start_path: str, prefix: str = ''):
    """Рекурсивно печатает структуру проекта"""
    try:
        items = sorted(os.listdir(start_path))
    except PermissionError:
        print(prefix + '🚫 [Нет доступа]')
        return

    # Фильтруем игнорируемые папки/файлы
    items = [
        i for i in items
        if i not in EXCLUDE_DIRS and not os.path.splitext(i)[1].lower() in EXCLUDE_EXTS
    ]

    for index, name in enumerate(items):
        path = os.path.join(start_path, name)
        connector = '└── ' if index == len(items) - 1 else '├── '
        print(prefix + connector + name)
        if os.path.isdir(path):
            new_prefix = prefix + ('    ' if index == len(items) - 1 else '│   ')
            print_tree(path, new_prefix)

if __name__ == '__main__':
    root = os.getcwd()
    print(f'📁 Структура проекта: {root}\n')
    print_tree(root)
