"""
Result Analyzer - Анализ результатов выполнения и генерация новых задач
"""

import re
from typing import List, Dict, Any, Optional
from task_manager import Task, TaskPriority, TaskStatus


class ResultAnalyzer:
    """
    Анализирует результаты выполнения задач и генерирует новые задачи
    
    Это ключевой компонент адаптивного режима!
    """
    
    def __init__(self, project_dir: str):
        self.project_dir = project_dir
        self.analysis_history: List[Dict] = []
    
    def analyze_task_result(self, task: Task, output: str, exit_code: int) -> Dict[str, Any]:
        """
        Анализировать результат выполнения задачи
        
        Returns:
            {
                "success": bool,
                "issues": List[str],
                "warnings": List[str],
                "new_tasks": List[Task],
                "context_updates": Dict[str, Any]
            }
        """
        analysis = {
            "success": exit_code == 0,
            "issues": [],
            "warnings": [],
            "new_tasks": [],
            "context_updates": {}
        }
        
        # Анализ вывода
        self._analyze_output(output, analysis)
        
        # Специфичные анализаторы для разных типов задач
        if task.phase == "phase-2-database":
            self._analyze_database_task(task, output, analysis)
        elif task.phase == "phase-3-seed-data":
            self._analyze_seed_data_task(task, output, analysis)
        elif task.phase == "phase-4-testing":
            self._analyze_testing_task(task, output, analysis)
        elif task.phase == "phase-5-frontend":
            self._analyze_frontend_task(task, output, analysis)
        
        # Сохранить анализ
        self.analysis_history.append({
            "task_id": task.id,
            "timestamp": task.completed_at,
            "analysis": analysis
        })
        
        return analysis
    
    def _analyze_output(self, output: str, analysis: Dict) -> None:
        """Базовый анализ вывода"""
        
        # Ошибки
        error_patterns = [
            r"ERROR:",
            r"Error:",
            r"FAILED",
            r"Failed:",
            r"Exception:",
            r"Traceback",
            r"fatal:",
            r"npm ERR!",
            r"SyntaxError",
            r"TypeError",
            r"ImportError",
            r"ModuleNotFoundError"
        ]
        
        for pattern in error_patterns:
            matches = re.findall(f"({pattern}.*)", output, re.MULTILINE)
            for match in matches:
                if match not in analysis["issues"]:
                    analysis["issues"].append(match[:200])  # Ограничить длину
        
        # Предупреждения
        warning_patterns = [
            r"WARNING:",
            r"Warning:",
            r"WARN:",
            r"DeprecationWarning",
            r"FutureWarning"
        ]
        
        for pattern in warning_patterns:
            matches = re.findall(f"({pattern}.*)", output, re.MULTILINE)
            for match in matches:
                if match not in analysis["warnings"]:
                    analysis["warnings"].append(match[:200])
    
    def _analyze_database_task(self, task: Task, output: str, analysis: Dict) -> None:
        """Анализ задач по БД"""
        
        # Проверить миграции
        if "alembic" in task.name.lower():
            # Если миграция не применилась
            if "No changes detected" in output or "Target database is not up to date" in output:
                analysis["warnings"].append("Migration may need manual review")
            
            # Если есть конфликты
            if "Multiple head revisions" in output:
                analysis["issues"].append("Migration conflict detected")
                
                # Создать задачу на исправление
                new_task = Task(
                    id=f"{task.id}.fix-migration",
                    name="Fix migration conflict",
                    description="Resolve multiple head revisions",
                    phase=task.phase,
                    priority=TaskPriority.CRITICAL,
                    status=TaskStatus.PENDING,
                    dependencies=[task.id],
                    actions=[
                        {"type": "command", "cmd": "alembic heads"},
                        {"type": "command", "cmd": "alembic merge heads"}
                    ],
                    estimated_time=300,
                    generated_by=task.id,
                    auto_generated=True
                )
                analysis["new_tasks"].append(new_task)
        
        # Проверить модели
        if "model" in task.name.lower():
            # Если создана модель, нужно создать схемы
            if analysis["success"]:
                analysis["context_updates"]["new_model_created"] = True
                
                # Создать задачу на создание схем
                model_name = self._extract_model_name(task)
                if model_name:
                    new_task = Task(
                        id=f"{task.id}.create-schema",
                        name=f"Create Pydantic schemas for {model_name}",
                        description=f"Add request/response schemas for {model_name}",
                        phase=task.phase,
                        priority=TaskPriority.HIGH,
                        status=TaskStatus.PENDING,
                        dependencies=[task.id],
                        actions=[
                            {"type": "code_create", "file": f"backend/app/schemas/{model_name.lower()}.py"}
                        ],
                        estimated_time=300,
                        generated_by=task.id,
                        auto_generated=True
                    )
                    analysis["new_tasks"].append(new_task)
                    
                    # Создать задачу на создание repository
                    new_task = Task(
                        id=f"{task.id}.create-repository",
                        name=f"Create repository for {model_name}",
                        description=f"Add CRUD repository for {model_name}",
                        phase=task.phase,
                        priority=TaskPriority.HIGH,
                        status=TaskStatus.PENDING,
                        dependencies=[f"{task.id}.create-schema"],
                        actions=[
                            {"type": "code_create", "file": f"backend/app/repositories/{model_name.lower()}_repository.py"}
                        ],
                        estimated_time=600,
                        generated_by=task.id,
                        auto_generated=True
                    )
                    analysis["new_tasks"].append(new_task)
                    
                    # Создать задачу на создание service
                    new_task = Task(
                        id=f"{task.id}.create-service",
                        name=f"Create service for {model_name}",
                        description=f"Add business logic service for {model_name}",
                        phase=task.phase,
                        priority=TaskPriority.HIGH,
                        status=TaskStatus.PENDING,
                        dependencies=[f"{task.id}.create-repository"],
                        actions=[
                            {"type": "code_create", "file": f"backend/app/services/{model_name.lower()}_service.py"}
                        ],
                        estimated_time=600,
                        generated_by=task.id,
                        auto_generated=True
                    )
                    analysis["new_tasks"].append(new_task)
                    
                    # Создать задачу на создание API endpoints
                    new_task = Task(
                        id=f"{task.id}.create-api",
                        name=f"Create API endpoints for {model_name}",
                        description=f"Add REST endpoints for {model_name}",
                        phase=task.phase,
                        priority=TaskPriority.HIGH,
                        status=TaskStatus.PENDING,
                        dependencies=[f"{task.id}.create-service"],
                        actions=[
                            {"type": "code_create", "file": f"backend/app/api/v1/{model_name.lower()}s.py"}
                        ],
                        estimated_time=900,
                        generated_by=task.id,
                        auto_generated=True
                    )
                    analysis["new_tasks"].append(new_task)
    
    def _analyze_seed_data_task(self, task: Task, output: str, analysis: Dict) -> None:
        """Анализ задач по seed data"""
        
        # Проверить количество созданных записей
        created_counts = self._extract_created_counts(output)
        if created_counts:
            analysis["context_updates"]["created_records"] = created_counts
        
        # Если создано мало записей
        if "inventory" in task.name.lower():
            inventory_count = created_counts.get("inventory_items", 0)
            if inventory_count < 20:
                analysis["warnings"].append(f"Only {inventory_count} inventory items created, expected 50+")
                
                # Создать задачу на добавление записей
                new_task = Task(
                    id=f"{task.id}.add-more-items",
                    name="Add more inventory items",
                    description=f"Increase inventory items from {inventory_count} to 50+",
                    phase=task.phase,
                    priority=TaskPriority.MEDIUM,
                    status=TaskStatus.PENDING,
                    dependencies=[task.id],
                    actions=[
                        {"type": "code_edit", "file": "backend/scripts/seed_data.py"}
                    ],
                    estimated_time=300,
                    generated_by=task.id,
                    auto_generated=True
                )
                analysis["new_tasks"].append(new_task)
        
        # Проверить файлы
        if "pdf" in task.name.lower() or "document" in task.name.lower():
            pdf_count = self._count_generated_files("*.pdf")
            if pdf_count == 0:
                analysis["issues"].append("No PDF files were generated")
                
                # Создать задачу на генерацию PDFs
                new_task = Task(
                    id=f"{task.id}.generate-pdfs",
                    name="Generate PDF files",
                    description="Create PDF files for documents",
                    phase=task.phase,
                    priority=TaskPriority.HIGH,
                    status=TaskStatus.PENDING,
                    dependencies=[task.id],
                    actions=[
                        {"type": "generate", "target": "pdf_files"},
                        {"type": "code_edit", "file": "backend/scripts/generate_pdfs.py"}
                    ],
                    estimated_time=600,
                    generated_by=task.id,
                    auto_generated=True
                )
                analysis["new_tasks"].append(new_task)
    
    def _analyze_testing_task(self, task: Task, output: str, analysis: Dict) -> None:
        """Анализ тестовых задач"""
        
        # Подсчитать результаты тестов
        test_results = self._parse_test_results(output)
        if test_results:
            analysis["context_updates"]["test_results"] = test_results
        
        # Если есть упавшие тесты
        if test_results.get("failed", 0) > 0:
            failed_tests = self._extract_failed_test_names(output)
            
            for test_name in failed_tests:
                # Создать задачу на исправление
                new_task = Task(
                    id=f"{task.id}.fix-{test_name}",
                    name=f"Fix failing test: {test_name}",
                    description=f"Investigate and fix {test_name}",
                    phase=task.phase,
                    priority=TaskPriority.HIGH,
                    status=TaskStatus.PENDING,
                    dependencies=[task.id],
                    actions=[
                        {"type": "analyze", "target": f"test:{test_name}"},
                        {"type": "code_edit", "file": "auto-detect"}
                    ],
                    estimated_time=600,
                    generated_by=task.id,
                    auto_generated=True
                )
                analysis["new_tasks"].append(new_task)
        
        # Если покрытие низкое
        coverage = self._extract_coverage(output)
        if coverage and coverage < 70:
            analysis["warnings"].append(f"Test coverage is low: {coverage}%")
            
            # Создать задачу на улучшение покрытия
            new_task = Task(
                id=f"{task.id}.improve-coverage",
                name="Improve test coverage",
                description=f"Increase test coverage from {coverage}% to 70%+",
                phase=task.phase,
                priority=TaskPriority.MEDIUM,
                status=TaskStatus.PENDING,
                dependencies=[task.id],
                actions=[
                    {"type": "test", "target": "coverage_report"},
                    {"type": "code_create", "file": "tests/test_additional.py"}
                ],
                estimated_time=1800,
                generated_by=task.id,
                auto_generated=True
            )
            analysis["new_tasks"].append(new_task)
    
    def _analyze_frontend_task(self, task: Task, output: str, analysis: Dict) -> None:
        """Анализ фронтенд задач"""
        
        # Проверить TypeScript ошибки
        if "tsc" in output or "TypeScript" in output:
            ts_errors = self._extract_typescript_errors(output)
            if ts_errors:
                analysis["issues"].extend(ts_errors)
                
                # Создать задачи на исправление
                for error in ts_errors[:3]:  # Максимум 3 задачи
                    new_task = Task(
                        id=f"{task.id}.fix-ts-{len(analysis['new_tasks'])+1}",
                        name=f"Fix TypeScript error",
                        description=f"Fix: {error[:100]}",
                        phase=task.phase,
                        priority=TaskPriority.HIGH,
                        status=TaskStatus.PENDING,
                        dependencies=[task.id],
                        actions=[
                            {"type": "code_edit", "file": "auto-detect"}
                        ],
                        estimated_time=300,
                        generated_by=task.id,
                        auto_generated=True
                    )
                    analysis["new_tasks"].append(new_task)
        
        # Проверить ESLint warnings
        eslint_warnings = self._extract_eslint_warnings(output)
        if len(eslint_warnings) > 10:
            analysis["warnings"].append(f"{len(eslint_warnings)} ESLint warnings found")
    
    # =========================================================================
    # Helper методы для извлечения данных
    # =========================================================================
    
    def _extract_model_name(self, task: Task) -> Optional[str]:
        """Извлечь имя модели из задачи"""
        # Пример: "Create Department model" → "Department"
        match = re.search(r"Create (\w+) model", task.name)
        if match:
            return match.group(1)
        return None
    
    def _extract_created_counts(self, output: str) -> Dict[str, int]:
        """Извлечь количество созданных записей"""
        counts = {}
        
        # Шаблоны: "Created 15 inventory items", "Added 20 documents", etc.
        patterns = [
            r"Created (\d+) ([\w\s]+)",
            r"Added (\d+) ([\w\s]+)",
            r"Generated (\d+) ([\w\s]+)",
            r"Inserted (\d+) ([\w\s]+)"
        ]
        
        for pattern in patterns:
            matches = re.findall(pattern, output, re.IGNORECASE)
            for count, entity in matches:
                entity = entity.strip().lower().replace(" ", "_")
                counts[entity] = int(count)
        
        return counts
    
    def _count_generated_files(self, pattern: str) -> int:
        """Подсчитать сгенерированные файлы"""
        import glob
        import os
        
        search_path = os.path.join(self.project_dir, "storage", "**", pattern)
        files = glob.glob(search_path, recursive=True)
        return len(files)
    
    def _parse_test_results(self, output: str) -> Optional[Dict[str, int]]:
        """Разобрать результаты pytest"""
        # Шаблон: "5 passed, 2 failed, 1 skipped in 10.5s"
        match = re.search(r"(\d+) passed.*?(\d+) failed.*?(\d+) skipped", output)
        if match:
            return {
                "passed": int(match.group(1)),
                "failed": int(match.group(2)),
                "skipped": int(match.group(3))
            }
        
        # Альтернативный формат
        match = re.search(r"(\d+) passed", output)
        if match:
            return {"passed": int(match.group(1)), "failed": 0, "skipped": 0}
        
        return None
    
    def _extract_failed_test_names(self, output: str) -> List[str]:
        """Извлечь имена упавших тестов"""
        failed = []
        
        # Шаблон: "FAILED tests/test_inventory.py::test_create_item"
        matches = re.findall(r"FAILED ([\w/._:]+)", output)
        failed.extend(matches)
        
        return failed[:5]  # Максимум 5
    
    def _extract_coverage(self, output: str) -> Optional[float]:
        """Извлечь процент покрытия"""
        # Шаблон: "TOTAL 145 32 78%"
        match = re.search(r"TOTAL\s+\d+\s+\d+\s+(\d+)%", output)
        if match:
            return float(match.group(1))
        
        return None
    
    def _extract_typescript_errors(self, output: str) -> List[str]:
        """Извлечь TypeScript ошибки"""
        errors = []
        
        # Шаблон: "src/file.ts(10,5): error TS2345: ..."
        matches = re.findall(r"([\w/._]+\.tsx?)\((\d+),(\d+)\): error (TS\d+): (.+)", output)
        for file, line, col, code, message in matches:
            errors.append(f"{file}:{line} - {code}: {message[:100]}")
        
        return errors[:10]  # Максимум 10
    
    def _extract_eslint_warnings(self, output: str) -> List[str]:
        """Извлечь ESLint warnings"""
        warnings = []
        
        # Шаблон: "warning  'React' is defined but never used  @typescript-eslint/no-unused-vars"
        matches = re.findall(r"warning\s+(.+)", output)
        warnings.extend(matches)
        
        return warnings
    
    def get_analysis_summary(self) -> Dict[str, Any]:
        """Получить сводку по анализу"""
        total_analyses = len(self.analysis_history)
        total_issues = sum(len(a["analysis"]["issues"]) for a in self.analysis_history)
        total_warnings = sum(len(a["analysis"]["warnings"]) for a in self.analysis_history)
        total_generated_tasks = sum(len(a["analysis"]["new_tasks"]) for a in self.analysis_history)
        
        return {
            "total_analyses": total_analyses,
            "total_issues": total_issues,
            "total_warnings": total_warnings,
            "total_generated_tasks": total_generated_tasks
        }


if __name__ == "__main__":
    # Тест
    analyzer = ResultAnalyzer("C:\\Work\\projects\\theatre\\theatre_app_2026")
    
    # Симуляция задачи
    from task_manager import Task, TaskPriority, TaskStatus
    
    test_task = Task(
        id="2.2",
        name="Create Department model",
        description="Add Department model with relationships to User",
        phase="phase-2-database",
        priority=TaskPriority.HIGH,
        status=TaskStatus.COMPLETED,
        dependencies=["2.1"],
        actions=[],
        estimated_time=300
    )
    
    test_output = """
    [INFO] Creating Department model
    [INFO] Model created successfully
    [INFO] Adding relationships to User model
    [OK] Department model ready
    """
    
    analysis = analyzer.analyze_task_result(test_task, test_output, 0)
    
    print("="*60)
    print("ANALYSIS RESULT")
    print("="*60)
    print(f"Success: {analysis['success']}")
    print(f"Issues: {len(analysis['issues'])}")
    print(f"Warnings: {len(analysis['warnings'])}")
    print(f"New tasks generated: {len(analysis['new_tasks'])}")
    
    if analysis['new_tasks']:
        print("\nGenerated tasks:")
        for task in analysis['new_tasks']:
            print(f"  - {task.id}: {task.name}")
