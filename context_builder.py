"""
Context Builder - Сбор и обновление контекста о проекте
"""

import os
import json
from typing import Dict, List, Any, Optional
from datetime import datetime
import glob


class ProjectContext:
    """
    Хранит и обновляет контекст о проекте
    
    Контекст используется для принятия решений о новых задачах
    """
    
    def __init__(self, project_dir: str, state_file: str = ".night-mode/project_context.json"):
        self.project_dir = project_dir
        self.state_file = state_file
        
        # Структура контекста
        self.context = {
            "project_info": {
                "name": "Theatre Management System",
                "version": "0.1.0 MVP",
                "last_updated": datetime.now().isoformat()
            },
            "backend": {
                "models": [],
                "schemas": [],
                "repositories": [],
                "services": [],
                "api_endpoints": [],
                "migrations": []
            },
            "frontend": {
                "pages": [],
                "components": [],
                "services": [],
                "stores": [],
                "routes": []
            },
            "database": {
                "tables": [],
                "enums": [],
                "relationships": []
            },
            "testing": {
                "test_files": [],
                "coverage": 0.0,
                "last_test_run": None
            },
            "data": {
                "inventory_count": 0,
                "document_count": 0,
                "performance_count": 0,
                "schedule_event_count": 0,
                "user_count": 0
            },
            "issues": {
                "critical": [],
                "high": [],
                "medium": [],
                "low": []
            },
            "metrics": {
                "total_files": 0,
                "total_lines": 0,
                "backend_files": 0,
                "frontend_files": 0
            }
        }
        
        # Загрузить если есть
        self._load_context()
    
    def scan_project(self) -> None:
        """Полное сканирование проекта"""
        print("[CONTEXT] Scanning project structure...")
        
        self._scan_backend()
        self._scan_frontend()
        self._scan_database()
        self._calculate_metrics()
        
        self.context["project_info"]["last_updated"] = datetime.now().isoformat()
        self._save_context()
        
        print("[CONTEXT] Project scan complete")
    
    def update_from_task(self, task_id: str, updates: Dict[str, Any]) -> None:
        """Обновить контекст на основе результата задачи"""
        print(f"[CONTEXT] Updating from task {task_id}")
        
        # Применить обновления
        for key, value in updates.items():
            if key == "new_model_created":
                self._scan_backend()
            elif key == "created_records":
                for entity, count in value.items():
                    if entity in self.context["data"]:
                        self.context["data"][entity] += count
            elif key == "test_results":
                self.context["testing"]["last_test_run"] = {
                    "task_id": task_id,
                    "timestamp": datetime.now().isoformat(),
                    "results": value
                }
            elif key.startswith("new_"):
                # Добавить новую сущность
                category = key.replace("new_", "")
                if category in self.context:
                    if isinstance(self.context[category], list):
                        if value not in self.context[category]:
                            self.context[category].append(value)
        
        self._save_context()
    
    def add_issue(self, severity: str, description: str) -> None:
        """Добавить issue"""
        if severity in self.context["issues"]:
            issue = {
                "description": description,
                "timestamp": datetime.now().isoformat()
            }
            self.context["issues"][severity].append(issue)
            self._save_context()
    
    def get_summary(self) -> str:
        """Получить краткую сводку контекста"""
        summary = []
        summary.append("="*60)
        summary.append("PROJECT CONTEXT SUMMARY")
        summary.append("="*60)
        
        # Backend
        summary.append("\n[BACKEND]")
        summary.append(f"  Models: {len(self.context['backend']['models'])}")
        summary.append(f"  Schemas: {len(self.context['backend']['schemas'])}")
        summary.append(f"  Repositories: {len(self.context['backend']['repositories'])}")
        summary.append(f"  Services: {len(self.context['backend']['services'])}")
        summary.append(f"  API Endpoints: {len(self.context['backend']['api_endpoints'])}")
        
        # Frontend
        summary.append("\n[FRONTEND]")
        summary.append(f"  Pages: {len(self.context['frontend']['pages'])}")
        summary.append(f"  Components: {len(self.context['frontend']['components'])}")
        summary.append(f"  Services: {len(self.context['frontend']['services'])}")
        
        # Database
        summary.append("\n[DATABASE]")
        summary.append(f"  Tables: {len(self.context['database']['tables'])}")
        summary.append(f"  Migrations: {len(self.context['backend']['migrations'])}")
        
        # Data
        summary.append("\n[DATA]")
        for key, value in self.context["data"].items():
            summary.append(f"  {key}: {value}")
        
        # Issues
        summary.append("\n[ISSUES]")
        for severity in ["critical", "high", "medium", "low"]:
            count = len(self.context["issues"][severity])
            if count > 0:
                summary.append(f"  {severity.upper()}: {count}")
        
        # Metrics
        summary.append("\n[METRICS]")
        summary.append(f"  Total files: {self.context['metrics']['total_files']}")
        summary.append(f"  Backend files: {self.context['metrics']['backend_files']}")
        summary.append(f"  Frontend files: {self.context['metrics']['frontend_files']}")
        
        summary.append("\n" + "="*60)
        
        return "\n".join(summary)
    
    def _scan_backend(self) -> None:
        """Сканировать backend"""
        backend_dir = os.path.join(self.project_dir, "backend", "app")
        
        if not os.path.exists(backend_dir):
            return
        
        # Models
        models_dir = os.path.join(backend_dir, "models")
        if os.path.exists(models_dir):
            models = []
            for file in os.listdir(models_dir):
                if file.endswith(".py") and file != "__init__.py":
                    model_name = file.replace(".py", "")
                    models.append(model_name)
            self.context["backend"]["models"] = models
        
        # Schemas
        schemas_dir = os.path.join(backend_dir, "schemas")
        if os.path.exists(schemas_dir):
            schemas = []
            for file in os.listdir(schemas_dir):
                if file.endswith(".py") and file != "__init__.py":
                    schema_name = file.replace(".py", "")
                    schemas.append(schema_name)
            self.context["backend"]["schemas"] = schemas
        
        # Repositories
        repos_dir = os.path.join(backend_dir, "repositories")
        if os.path.exists(repos_dir):
            repositories = []
            for file in os.listdir(repos_dir):
                if file.endswith(".py") and file != "__init__.py":
                    repo_name = file.replace(".py", "")
                    repositories.append(repo_name)
            self.context["backend"]["repositories"] = repositories
        
        # Services
        services_dir = os.path.join(backend_dir, "services")
        if os.path.exists(services_dir):
            services = []
            for file in os.listdir(services_dir):
                if file.endswith(".py") and file != "__init__.py":
                    service_name = file.replace(".py", "")
                    services.append(service_name)
            self.context["backend"]["services"] = services
        
        # API endpoints
        api_dir = os.path.join(backend_dir, "api", "v1")
        if os.path.exists(api_dir):
            endpoints = []
            for file in os.listdir(api_dir):
                if file.endswith(".py") and file != "__init__.py" and file != "router.py":
                    endpoint_name = file.replace(".py", "")
                    endpoints.append(endpoint_name)
            self.context["backend"]["api_endpoints"] = endpoints
        
        # Migrations
        migrations_dir = os.path.join(self.project_dir, "backend", "alembic", "versions")
        if os.path.exists(migrations_dir):
            migrations = []
            for file in os.listdir(migrations_dir):
                if file.endswith(".py"):
                    migrations.append(file)
            self.context["backend"]["migrations"] = migrations
    
    def _scan_frontend(self) -> None:
        """Сканировать frontend"""
        frontend_dir = os.path.join(self.project_dir, "frontend", "src")
        
        if not os.path.exists(frontend_dir):
            return
        
        # Pages
        pages_dir = os.path.join(frontend_dir, "pages")
        if os.path.exists(pages_dir):
            pages = []
            for root, dirs, files in os.walk(pages_dir):
                for file in files:
                    if file.endswith("Page.tsx"):
                        page_name = file.replace("Page.tsx", "")
                        pages.append(page_name)
            self.context["frontend"]["pages"] = pages
        
        # Components
        components_dir = os.path.join(frontend_dir, "components")
        if os.path.exists(components_dir):
            components = []
            for root, dirs, files in os.walk(components_dir):
                for file in files:
                    if file.endswith(".tsx") and not file.startswith("index"):
                        component_name = file.replace(".tsx", "")
                        components.append(component_name)
            self.context["frontend"]["components"] = components
        
        # Services
        services_dir = os.path.join(frontend_dir, "services")
        if os.path.exists(services_dir):
            services = []
            for file in os.listdir(services_dir):
                if file.endswith("_service.ts"):
                    service_name = file.replace("_service.ts", "")
                    services.append(service_name)
            self.context["frontend"]["services"] = services
        
        # Stores
        store_dir = os.path.join(frontend_dir, "store")
        if os.path.exists(store_dir):
            stores = []
            for file in os.listdir(store_dir):
                if file.endswith("Store.ts"):
                    store_name = file.replace("Store.ts", "")
                    stores.append(store_name)
            self.context["frontend"]["stores"] = stores
    
    def _scan_database(self) -> None:
        """Сканировать структуру БД из моделей"""
        models_dir = os.path.join(self.project_dir, "backend", "app", "models")
        
        if not os.path.exists(models_dir):
            return
        
        tables = []
        
        # Простой парсинг моделей
        for file in os.listdir(models_dir):
            if file.endswith(".py") and file != "__init__.py":
                file_path = os.path.join(models_dir, file)
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                    
                    # Найти классы с __tablename__
                    import re
                    matches = re.findall(r'__tablename__\s*=\s*["\'](\w+)["\']', content)
                    tables.extend(matches)
                except Exception as e:
                    print(f"[WARNING] Failed to parse {file}: {e}")
        
        self.context["database"]["tables"] = tables
    
    def _calculate_metrics(self) -> None:
        """Рассчитать метрики проекта"""
        backend_dir = os.path.join(self.project_dir, "backend")
        frontend_dir = os.path.join(self.project_dir, "frontend", "src")
        
        # Подсчитать файлы
        backend_files = len(glob.glob(os.path.join(backend_dir, "**", "*.py"), recursive=True))
        frontend_files = len(glob.glob(os.path.join(frontend_dir, "**", "*.tsx"), recursive=True))
        frontend_files += len(glob.glob(os.path.join(frontend_dir, "**", "*.ts"), recursive=True))
        
        self.context["metrics"]["backend_files"] = backend_files
        self.context["metrics"]["frontend_files"] = frontend_files
        self.context["metrics"]["total_files"] = backend_files + frontend_files
    
    def _save_context(self) -> None:
        """Сохранить контекст"""
        os.makedirs(os.path.dirname(self.state_file), exist_ok=True)
        
        with open(self.state_file, 'w', encoding='utf-8') as f:
            json.dump(self.context, f, indent=2, ensure_ascii=False)
    
    def _load_context(self) -> None:
        """Загрузить контекст"""
        if not os.path.exists(self.state_file):
            return
        
        try:
            with open(self.state_file, 'r', encoding='utf-8') as f:
                loaded = json.load(f)
            
            # Обновить контекст
            self._merge_context(loaded)
            
            print(f"[CONTEXT] Loaded context from {self.state_file}")
        except Exception as e:
            print(f"[ERROR] Failed to load context: {e}")
    
    def _merge_context(self, loaded: Dict) -> None:
        """Слить загруженный контекст с текущим"""
        for key in loaded:
            if key in self.context:
                if isinstance(self.context[key], dict):
                    self.context[key].update(loaded[key])
                else:
                    self.context[key] = loaded[key]


if __name__ == "__main__":
    # Тест
    context = ProjectContext("C:\\Work\\projects\\theatre\\theatre_app_2026")
    
    print("Scanning project...")
    context.scan_project()
    
    print("\n" + context.get_summary())
    
    # Симуляция обновления
    print("\nSimulating task update...")
    context.update_from_task("2.2", {
        "new_model_created": True,
        "created_records": {
            "inventory_count": 15,
            "document_count": 5
        }
    })
    
    print("\n" + context.get_summary())
