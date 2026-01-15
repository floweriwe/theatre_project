"""
Task Manager - Управление очередью задач для Adaptive Night Mode v3
"""

import json
from typing import List, Dict, Optional, Any
from dataclasses import dataclass, asdict
from enum import Enum
from datetime import datetime
import os


class TaskStatus(Enum):
    """Статусы задач"""
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    SKIPPED = "skipped"
    BLOCKED = "blocked"


class TaskPriority(Enum):
    """Приоритеты задач"""
    CRITICAL = 0  # Блокирующие, должны быть выполнены
    HIGH = 1      # Важные
    MEDIUM = 2    # Обычные
    LOW = 3       # Можно отложить


@dataclass
class Task:
    """Задача для выполнения"""
    id: str
    name: str
    description: str
    phase: str
    priority: TaskPriority
    status: TaskStatus
    dependencies: List[str]  # ID задач, которые должны быть выполнены до этой
    actions: List[Dict[str, Any]]  # Список действий для выполнения
    estimated_time: int  # Оценочное время в секундах
    
    # Метаданные
    created_at: str = ""
    started_at: Optional[str] = None
    completed_at: Optional[str] = None
    error: Optional[str] = None
    result: Optional[Dict[str, Any]] = None
    
    # Генерация задач
    generated_by: Optional[str] = None  # ID задачи, которая сгенерировала эту
    auto_generated: bool = False
    
    def __post_init__(self):
        if not self.created_at:
            self.created_at = datetime.now().isoformat()
    
    def to_dict(self) -> Dict:
        """Конвертация в словарь"""
        data = asdict(self)
        data['priority'] = self.priority.value
        data['status'] = self.status.value
        return data
    
    @classmethod
    def from_dict(cls, data: Dict) -> 'Task':
        """Создание из словаря"""
        data['priority'] = TaskPriority(data['priority'])
        data['status'] = TaskStatus(data['status'])
        return cls(**data)


class TaskManager:
    """Менеджер задач с динамическим планированием"""
    
    def __init__(self, state_file: str = ".night-mode/task_queue.json"):
        self.state_file = state_file
        self.tasks: List[Task] = []
        self.completed_count = 0
        self.failed_count = 0
        
        # Загрузить состояние если есть
        self._load_state()
    
    def add_task(self, task: Task) -> None:
        """Добавить задачу в очередь"""
        # Проверить что задачи с таким ID ещё нет
        if any(t.id == task.id for t in self.tasks):
            print(f"[WARNING] Task {task.id} already exists, skipping")
            return
        
        self.tasks.append(task)
        print(f"[TASK] Added: {task.id} - {task.name} (Priority: {task.priority.name})")
        self._save_state()
    
    def add_tasks(self, tasks: List[Task]) -> None:
        """Добавить несколько задач"""
        for task in tasks:
            self.add_task(task)
    
    def get_next_task(self) -> Optional[Task]:
        """
        Получить следующую задачу для выполнения
        
        Логика выбора:
        1. Фильтруем PENDING задачи
        2. Проверяем зависимости
        3. Сортируем по приоритету
        4. Возвращаем первую
        """
        # Получить все невыполненные задачи
        pending_tasks = [t for t in self.tasks if t.status == TaskStatus.PENDING]
        
        if not pending_tasks:
            return None
        
        # Отфильтровать задачи с невыполненными зависимостями
        ready_tasks = []
        for task in pending_tasks:
            if self._check_dependencies(task):
                ready_tasks.append(task)
            else:
                # Проверить не заблокирована ли задача
                if self._is_blocked(task):
                    task.status = TaskStatus.BLOCKED
        
        if not ready_tasks:
            return None
        
        # Сортировать по приоритету (меньше = выше приоритет)
        ready_tasks.sort(key=lambda t: t.priority.value)
        
        return ready_tasks[0]
    
    def mark_running(self, task_id: str) -> None:
        """Отметить задачу как выполняющуюся"""
        task = self._get_task(task_id)
        if task:
            task.status = TaskStatus.RUNNING
            task.started_at = datetime.now().isoformat()
            self._save_state()
    
    def mark_completed(self, task_id: str, result: Optional[Dict] = None) -> None:
        """Отметить задачу как выполненную"""
        task = self._get_task(task_id)
        if task:
            task.status = TaskStatus.COMPLETED
            task.completed_at = datetime.now().isoformat()
            task.result = result
            self.completed_count += 1
            self._save_state()
            
            # Проверить заблокированные задачи
            self._unblock_dependencies(task_id)
    
    def mark_failed(self, task_id: str, error: str) -> None:
        """Отметить задачу как проваленную"""
        task = self._get_task(task_id)
        if task:
            task.status = TaskStatus.FAILED
            task.completed_at = datetime.now().isoformat()
            task.error = error
            self.failed_count += 1
            self._save_state()
    
    def mark_skipped(self, task_id: str, reason: str) -> None:
        """Пропустить задачу"""
        task = self._get_task(task_id)
        if task:
            task.status = TaskStatus.SKIPPED
            task.completed_at = datetime.now().isoformat()
            task.error = f"Skipped: {reason}"
            self._save_state()
    
    def generate_subtasks(self, parent_id: str, subtasks: List[Task]) -> None:
        """
        Сгенерировать подзадачи на основе результата выполнения
        
        Это ключевая фича адаптивного режима!
        """
        parent_task = self._get_task(parent_id)
        if not parent_task:
            return
        
        print(f"\n[TASK GEN] Generating {len(subtasks)} subtasks from {parent_id}")
        
        for subtask in subtasks:
            subtask.generated_by = parent_id
            subtask.auto_generated = True
            # Добавить зависимость от родительской задачи
            if parent_id not in subtask.dependencies:
                subtask.dependencies.append(parent_id)
            self.add_task(subtask)
        
        print(f"[TASK GEN] Generated subtasks: {', '.join(t.id for t in subtasks)}")
    
    def get_statistics(self) -> Dict[str, Any]:
        """Получить статистику"""
        total = len(self.tasks)
        pending = len([t for t in self.tasks if t.status == TaskStatus.PENDING])
        running = len([t for t in self.tasks if t.status == TaskStatus.RUNNING])
        completed = len([t for t in self.tasks if t.status == TaskStatus.COMPLETED])
        failed = len([t for t in self.tasks if t.status == TaskStatus.FAILED])
        blocked = len([t for t in self.tasks if t.status == TaskStatus.BLOCKED])
        skipped = len([t for t in self.tasks if t.status == TaskStatus.SKIPPED])
        
        # Автогенерированные задачи
        auto_generated = len([t for t in self.tasks if t.auto_generated])
        
        return {
            "total": total,
            "pending": pending,
            "running": running,
            "completed": completed,
            "failed": failed,
            "blocked": blocked,
            "skipped": skipped,
            "auto_generated": auto_generated,
            "progress": round((completed / total * 100) if total > 0 else 0, 1)
        }
    
    def get_tasks_by_phase(self, phase: str) -> List[Task]:
        """Получить задачи по фазе"""
        return [t for t in self.tasks if t.phase == phase]
    
    def get_failed_tasks(self) -> List[Task]:
        """Получить проваленные задачи"""
        return [t for t in self.tasks if t.status == TaskStatus.FAILED]
    
    def has_pending_tasks(self) -> bool:
        """Есть ли ещё задачи для выполнения"""
        return any(t.status == TaskStatus.PENDING for t in self.tasks)
    
    def _check_dependencies(self, task: Task) -> bool:
        """Проверить что все зависимости выполнены"""
        if not task.dependencies:
            return True
        
        for dep_id in task.dependencies:
            dep_task = self._get_task(dep_id)
            if not dep_task:
                print(f"[WARNING] Dependency {dep_id} not found for task {task.id}")
                continue
            
            if dep_task.status != TaskStatus.COMPLETED:
                return False
        
        return True
    
    def _is_blocked(self, task: Task) -> bool:
        """Проверить заблокирована ли задача"""
        if not task.dependencies:
            return False
        
        for dep_id in task.dependencies:
            dep_task = self._get_task(dep_id)
            if dep_task and dep_task.status == TaskStatus.FAILED:
                return True
        
        return False
    
    def _unblock_dependencies(self, completed_task_id: str) -> None:
        """Разблокировать зависимые задачи"""
        for task in self.tasks:
            if task.status == TaskStatus.BLOCKED and completed_task_id in task.dependencies:
                # Проверить остальные зависимости
                if self._check_dependencies(task):
                    task.status = TaskStatus.PENDING
                    print(f"[TASK] Unblocked: {task.id}")
    
    def _get_task(self, task_id: str) -> Optional[Task]:
        """Найти задачу по ID"""
        for task in self.tasks:
            if task.id == task_id:
                return task
        return None
    
    def _save_state(self) -> None:
        """Сохранить состояние в файл"""
        os.makedirs(os.path.dirname(self.state_file), exist_ok=True)
        
        with open(self.state_file, 'w', encoding='utf-8') as f:
            json.dump({
                'tasks': [t.to_dict() for t in self.tasks],
                'completed_count': self.completed_count,
                'failed_count': self.failed_count
            }, f, indent=2, ensure_ascii=False)
    
    def _load_state(self) -> None:
        """Загрузить состояние из файла"""
        if not os.path.exists(self.state_file):
            return
        
        try:
            with open(self.state_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            self.tasks = [Task.from_dict(t) for t in data.get('tasks', [])]
            self.completed_count = data.get('completed_count', 0)
            self.failed_count = data.get('failed_count', 0)
            
            print(f"[TASK] Loaded {len(self.tasks)} tasks from state file")
        except Exception as e:
            print(f"[ERROR] Failed to load task state: {e}")


def create_initial_tasks() -> List[Task]:
    """
    Создать начальный набор задач
    
    Это seed tasks - остальные будут генерироваться динамически
    """
    tasks = []
    
    # =========================================================================
    # PHASE 1: Critical Fixes (уже выполнены, но добавим для полноты)
    # =========================================================================
    
    tasks.append(Task(
        id="1.1",
        name="Add BaseRepository.update() method",
        description="Add missing update() method to BaseRepository",
        phase="phase-1-critical",
        priority=TaskPriority.CRITICAL,
        status=TaskStatus.COMPLETED,  # Уже выполнено
        dependencies=[],
        actions=[
            {"type": "code_edit", "file": "backend/app/repositories/base.py"}
        ],
        estimated_time=60
    ))
    
    tasks.append(Task(
        id="1.2",
        name="Fix unique().scalars() order",
        description="Fix SQLAlchemy query order in inventory repository",
        phase="phase-1-critical",
        priority=TaskPriority.CRITICAL,
        status=TaskStatus.COMPLETED,  # Уже выполнено
        dependencies=[],
        actions=[
            {"type": "code_edit", "file": "backend/app/repositories/inventory_repository.py"}
        ],
        estimated_time=30
    ))
    
    tasks.append(Task(
        id="1.3",
        name="Fix frontend race condition",
        description="Add ID validation and useEffect cleanup",
        phase="phase-1-critical",
        priority=TaskPriority.CRITICAL,
        status=TaskStatus.COMPLETED,  # Уже выполнено
        dependencies=[],
        actions=[
            {"type": "code_edit", "file": "frontend/src/pages/inventory/InventoryItemPage.tsx"}
        ],
        estimated_time=60
    ))
    
    # =========================================================================
    # PHASE 2: Database Expansion
    # =========================================================================
    
    tasks.append(Task(
        id="2.1",
        name="Analyze current database schema",
        description="Scan all models and understand current structure",
        phase="phase-2-database",
        priority=TaskPriority.HIGH,
        status=TaskStatus.PENDING,
        dependencies=["1.1", "1.2", "1.3"],
        actions=[
            {"type": "scan", "pattern": "backend/app/models/*.py"},
            {"type": "analyze", "target": "database_schema"}
        ],
        estimated_time=120
    ))
    
    tasks.append(Task(
        id="2.2",
        name="Create Department model",
        description="Add Department model with relationships to User",
        phase="phase-2-database",
        priority=TaskPriority.HIGH,
        status=TaskStatus.PENDING,
        dependencies=["2.1"],
        actions=[
            {"type": "code_create", "file": "backend/app/models/department.py"},
            {"type": "code_edit", "file": "backend/app/models/user.py"}
        ],
        estimated_time=300
    ))
    
    tasks.append(Task(
        id="2.3",
        name="Create Venue model",
        description="Add Venue model for performance locations",
        phase="phase-2-database",
        priority=TaskPriority.HIGH,
        status=TaskStatus.PENDING,
        dependencies=["2.1"],
        actions=[
            {"type": "code_create", "file": "backend/app/models/venue.py"}
        ],
        estimated_time=300
    ))
    
    tasks.append(Task(
        id="2.4",
        name="Create Alembic migration for new models",
        description="Generate and apply migration for Department and Venue",
        phase="phase-2-database",
        priority=TaskPriority.HIGH,
        status=TaskStatus.PENDING,
        dependencies=["2.2", "2.3"],
        actions=[
            {"type": "command", "cmd": "alembic revision --autogenerate"},
            {"type": "command", "cmd": "alembic upgrade head"}
        ],
        estimated_time=180
    ))
    
    tasks.append(Task(
        id="2.5",
        name="Generate seed data for new models",
        description="Add departments and venues to seed_data.py",
        phase="phase-2-database",
        priority=TaskPriority.MEDIUM,
        status=TaskStatus.PENDING,
        dependencies=["2.4"],
        actions=[
            {"type": "code_edit", "file": "backend/scripts/seed_data.py"},
            {"type": "command", "cmd": "python -m scripts.seed_data"}
        ],
        estimated_time=300
    ))
    
    # =========================================================================
    # PHASE 3: Seed Data Generation
    # =========================================================================
    
    tasks.append(Task(
        id="3.1",
        name="Generate realistic inventory items",
        description="Create 50+ inventory items with realistic data",
        phase="phase-3-seed-data",
        priority=TaskPriority.MEDIUM,
        status=TaskStatus.PENDING,
        dependencies=["2.5"],
        actions=[
            {"type": "code_edit", "file": "backend/scripts/seed_data.py"}
        ],
        estimated_time=600
    ))
    
    tasks.append(Task(
        id="3.2",
        name="Generate documents with PDFs",
        description="Create 20+ documents and generate PDF files",
        phase="phase-3-seed-data",
        priority=TaskPriority.MEDIUM,
        status=TaskStatus.PENDING,
        dependencies=["2.5"],
        actions=[
            {"type": "code_edit", "file": "backend/scripts/seed_data.py"},
            {"type": "generate", "target": "pdf_files"}
        ],
        estimated_time=900
    ))
    
    tasks.append(Task(
        id="3.3",
        name="Generate performances with images",
        description="Create 15+ performances with poster images",
        phase="phase-3-seed-data",
        priority=TaskPriority.MEDIUM,
        status=TaskStatus.PENDING,
        dependencies=["2.5"],
        actions=[
            {"type": "code_edit", "file": "backend/scripts/seed_data.py"},
            {"type": "generate", "target": "images"}
        ],
        estimated_time=900
    ))
    
    tasks.append(Task(
        id="3.4",
        name="Generate schedule events",
        description="Create 100+ schedule events with realistic dates",
        phase="phase-3-seed-data",
        priority=TaskPriority.MEDIUM,
        status=TaskStatus.PENDING,
        dependencies=["3.3"],
        actions=[
            {"type": "code_edit", "file": "backend/scripts/seed_data.py"}
        ],
        estimated_time=600
    ))
    
    # =========================================================================
    # PHASE 4: API Testing
    # =========================================================================
    
    tasks.append(Task(
        id="4.1",
        name="Test inventory CRUD endpoints",
        description="Test all inventory API endpoints",
        phase="phase-4-testing",
        priority=TaskPriority.HIGH,
        status=TaskStatus.PENDING,
        dependencies=["3.1"],
        actions=[
            {"type": "test", "target": "inventory_endpoints"}
        ],
        estimated_time=600
    ))
    
    tasks.append(Task(
        id="4.2",
        name="Test document endpoints",
        description="Test document API with file uploads",
        phase="phase-4-testing",
        priority=TaskPriority.HIGH,
        status=TaskStatus.PENDING,
        dependencies=["3.2"],
        actions=[
            {"type": "test", "target": "document_endpoints"}
        ],
        estimated_time=600
    ))
    
    tasks.append(Task(
        id="4.3",
        name="Test performance endpoints",
        description="Test performance API endpoints",
        phase="phase-4-testing",
        priority=TaskPriority.HIGH,
        status=TaskStatus.PENDING,
        dependencies=["3.3"],
        actions=[
            {"type": "test", "target": "performance_endpoints"}
        ],
        estimated_time=600
    ))
    
    tasks.append(Task(
        id="4.4",
        name="Test schedule endpoints",
        description="Test schedule API endpoints",
        phase="phase-4-testing",
        priority=TaskPriority.HIGH,
        status=TaskStatus.PENDING,
        dependencies=["3.4"],
        actions=[
            {"type": "test", "target": "schedule_endpoints"}
        ],
        estimated_time=600
    ))
    
    # =========================================================================
    # PHASE 5: Frontend Enhancement
    # =========================================================================
    
    tasks.append(Task(
        id="5.1",
        name="Add loading skeletons",
        description="Add skeleton loaders to all list pages",
        phase="phase-5-frontend",
        priority=TaskPriority.MEDIUM,
        status=TaskStatus.PENDING,
        dependencies=["4.1", "4.2", "4.3"],
        actions=[
            {"type": "code_edit", "file": "frontend/src/components/ui/Skeleton.tsx"},
            {"type": "scan", "pattern": "frontend/src/pages/**/*ListPage.tsx"}
        ],
        estimated_time=1200
    ))
    
    tasks.append(Task(
        id="5.2",
        name="Add error boundaries",
        description="Add error boundaries to prevent crashes",
        phase="phase-5-frontend",
        priority=TaskPriority.HIGH,
        status=TaskStatus.PENDING,
        dependencies=["4.1"],
        actions=[
            {"type": "code_create", "file": "frontend/src/components/ErrorBoundary.tsx"}
        ],
        estimated_time=600
    ))
    
    # =========================================================================
    # PHASE 6: Documentation
    # =========================================================================
    
    tasks.append(Task(
        id="6.1",
        name="Update API documentation",
        description="Generate OpenAPI docs and update README",
        phase="phase-6-docs",
        priority=TaskPriority.LOW,
        status=TaskStatus.PENDING,
        dependencies=["4.1", "4.2", "4.3", "4.4"],
        actions=[
            {"type": "generate", "target": "api_docs"},
            {"type": "code_edit", "file": "docs/api/README.md"}
        ],
        estimated_time=900
    ))
    
    tasks.append(Task(
        id="6.2",
        name="Update component documentation",
        description="Document all React components",
        phase="phase-6-docs",
        priority=TaskPriority.LOW,
        status=TaskStatus.PENDING,
        dependencies=["5.1", "5.2"],
        actions=[
            {"type": "scan", "pattern": "frontend/src/components/**/*.tsx"},
            {"type": "generate", "target": "component_docs"}
        ],
        estimated_time=900
    ))
    
    return tasks


if __name__ == "__main__":
    # Тест
    manager = TaskManager(".night-mode/test_queue.json")
    tasks = create_initial_tasks()
    manager.add_tasks(tasks)
    
    print("\n" + "="*60)
    print("TASK QUEUE INITIALIZED")
    print("="*60)
    
    stats = manager.get_statistics()
    print(f"\nTotal tasks: {stats['total']}")
    print(f"Pending: {stats['pending']}")
    print(f"Completed: {stats['completed']}")
    print(f"Progress: {stats['progress']}%")
    
    print("\n" + "="*60)
    print("NEXT TASKS TO EXECUTE")
    print("="*60)
    
    for i in range(5):
        task = manager.get_next_task()
        if task:
            print(f"\n{i+1}. {task.id}: {task.name}")
            print(f"   Priority: {task.priority.name}")
            print(f"   Phase: {task.phase}")
            print(f"   Est. time: {task.estimated_time}s")
