"""
Night Mode Orchestrator v3 - Adaptive Edition
Самообучающийся оркестратор с динамическим планированием
"""

import os
import sys
import subprocess
import time
import json
from datetime import datetime
from typing import Optional, Dict, Any, List
import threading

# Импорт наших компонентов
from task_manager import TaskManager, Task, TaskStatus, TaskPriority, create_initial_tasks
from result_analyzer import ResultAnalyzer
from context_builder import ProjectContext


class AdaptiveOrchestrator:
    """
    Адаптивный оркестратор - ключевая фича Night Mode v3
    
    Возможности:
    - Динамическое планирование задач
    - Анализ результатов выполнения
    - Автогенерация новых задач на основе проблем
    - Сбор контекста о проекте
    - Обучение на ходу
    """
    
    def __init__(self, project_dir: str, dry_run: bool = False):
        self.project_dir = project_dir
        self.dry_run = dry_run
        
        # Компоненты
        self.task_manager = TaskManager(".night-mode/task_queue.json")
        self.analyzer = ResultAnalyzer(project_dir)
        self.context = ProjectContext(project_dir)
        
        # Состояние
        self.session_id = datetime.now().strftime("%Y%m%d_%H%M%S")
        self.start_time = None
        self.end_time = None
        self.current_task: Optional[Task] = None
        
        # Логирование
        self.log_dir = ".night-mode/logs"
        os.makedirs(self.log_dir, exist_ok=True)
        self.log_file = os.path.join(self.log_dir, f"session_{self.session_id}.log")
        
        # Safety
        self.whitelist_file = ".night-mode/whitelist.txt"
        self.max_task_time = 3600  # 1 час на задачу
        self.max_total_time = 21600  # 6 часов на всю сессию
        
        # Статистика
        self.stats = {
            "tasks_completed": 0,
            "tasks_failed": 0,
            "tasks_generated": 0,
            "total_time": 0
        }
    
    def initialize(self) -> bool:
        """Инициализация оркестратора"""
        self.log("="*60, "INFO")
        self.log("ADAPTIVE NIGHT MODE V3 - INITIALIZING", "INFO")
        self.log("="*60, "INFO")
        self.log(f"Session ID: {self.session_id}", "INFO")
        self.log(f"Project: {self.project_dir}", "INFO")
        self.log(f"Dry run: {self.dry_run}", "INFO")
        
        # Создать структуру
        if not self._setup_directory():
            return False
        
        # Pre-flight checks
        if not self._preflight_checks():
            return False
        
        # Сканировать проект
        self.log("\n[INIT] Scanning project structure...", "INFO")
        self.context.scan_project()
        self.log(self.context.get_summary(), "INFO")
        
        # Загрузить задачи
        self.log("\n[INIT] Loading task queue...", "INFO")
        if not self.task_manager.tasks:
            # Создать начальные задачи
            initial_tasks = create_initial_tasks()
            self.task_manager.add_tasks(initial_tasks)
        
        stats = self.task_manager.get_statistics()
        self.log(f"Total tasks: {stats['total']}", "INFO")
        self.log(f"Pending: {stats['pending']}", "INFO")
        self.log(f"Completed: {stats['completed']}", "INFO")
        self.log(f"Auto-generated: {stats['auto_generated']}", "INFO")
        
        return True
    
    def run(self) -> bool:
        """
        Главный цикл выполнения
        
        Это адаптивный цикл:
        1. Взять следующую задачу
        2. Выполнить
        3. Проанализировать результат
        4. Сгенерировать новые задачи если нужно
        5. Обновить контекст
        6. Повторить
        """
        self.start_time = time.time()
        
        self.log("\n" + "="*60, "INFO")
        self.log("STARTING ADAPTIVE EXECUTION", "INFO")
        self.log("="*60, "INFO")
        
        iteration = 0
        max_iterations = 1000  # Защита от бесконечного цикла
        
        while iteration < max_iterations:
            iteration += 1
            
            # Проверить время
            elapsed = time.time() - self.start_time
            if elapsed > self.max_total_time:
                self.log(f"\n[STOP] Maximum time reached: {elapsed:.0f}s", "WARNING")
                break
            
            # Получить следующую задачу
            task = self.task_manager.get_next_task()
            
            if not task:
                # Нет больше задач
                self.log("\n[COMPLETE] No more tasks to execute", "INFO")
                break
            
            # Вывести прогресс
            stats = self.task_manager.get_statistics()
            self.log("\n" + "="*60, "INFO")
            self.log(f"ITERATION {iteration} | Progress: {stats['progress']}%", "INFO")
            self.log(f"Pending: {stats['pending']} | Completed: {stats['completed']} | Failed: {stats['failed']}", "INFO")
            self.log("="*60, "INFO")
            
            # Выполнить задачу
            success = self._execute_task(task)
            
            if success:
                self.stats["tasks_completed"] += 1
            else:
                self.stats["tasks_failed"] += 1
            
            # Небольшая пауза между задачами
            if not self.dry_run:
                time.sleep(2)
        
        self.end_time = time.time()
        self.stats["total_time"] = self.end_time - self.start_time
        
        # Финальный отчёт
        self._print_final_report()
        
        return self.stats["tasks_failed"] == 0
    
    def _execute_task(self, task: Task) -> bool:
        """
        Выполнить задачу
        
        Returns:
            True если успешно, False если провалилась
        """
        self.current_task = task
        
        self.log(f"\n[TASK] Starting: {task.id} - {task.name}", "INFO")
        self.log(f"[TASK] Phase: {task.phase}", "INFO")
        self.log(f"[TASK] Priority: {task.priority.name}", "INFO")
        self.log(f"[TASK] Est. time: {task.estimated_time}s", "INFO")
        
        if task.auto_generated:
            self.log(f"[TASK] Auto-generated by: {task.generated_by}", "INFO")
        
        # Отметить как выполняющуюся
        self.task_manager.mark_running(task.id)
        
        # Dry run
        if self.dry_run:
            self.log("[DRY RUN] Skipping actual execution", "INFO")
            time.sleep(0.5)
            self.task_manager.mark_completed(task.id, {"dry_run": True})
            return True
        
        # Git checkpoint
        checkpoint_created = self._create_checkpoint(task)
        
        # Выполнить действия
        task_start = time.time()
        success = True
        output_log = []
        
        try:
            for action in task.actions:
                action_type = action.get("type")
                
                self.log(f"[ACTION] {action_type}: {action}", "INFO")
                
                if action_type == "code_edit":
                    result = self._action_code_edit(action)
                elif action_type == "code_create":
                    result = self._action_code_create(action)
                elif action_type == "command":
                    result = self._action_command(action)
                elif action_type == "test":
                    result = self._action_test(action)
                elif action_type == "scan":
                    result = self._action_scan(action)
                elif action_type == "analyze":
                    result = self._action_analyze(action)
                elif action_type == "generate":
                    result = self._action_generate(action)
                else:
                    self.log(f"[WARNING] Unknown action type: {action_type}", "WARNING")
                    continue
                
                output_log.append(result["output"])
                
                if not result["success"]:
                    success = False
                    self.log(f"[ERROR] Action failed: {result['error']}", "ERROR")
                    break
        
        except Exception as e:
            success = False
            error_msg = f"Exception during task execution: {str(e)}"
            self.log(f"[ERROR] {error_msg}", "ERROR")
            output_log.append(error_msg)
        
        task_time = time.time() - task_start
        
        # Объединить вывод
        combined_output = "\n".join(output_log)
        
        # Отметить результат
        if success:
            self.log(f"[OK] Task completed in {task_time:.1f}s", "INFO")
            self.task_manager.mark_completed(task.id, {
                "time": task_time,
                "output": combined_output[:1000]  # Ограничить размер
            })
        else:
            self.log(f"[FAIL] Task failed after {task_time:.1f}s", "ERROR")
            self.task_manager.mark_failed(task.id, combined_output[:1000])
            
            # Rollback если был checkpoint
            if checkpoint_created:
                self._rollback_checkpoint(task)
        
        # АНАЛИЗ РЕЗУЛЬТАТА (ключевая фича!)
        self.log("\n[ANALYZE] Analyzing task result...", "INFO")
        analysis = self.analyzer.analyze_task_result(task, combined_output, 0 if success else 1)
        
        # Вывести анализ
        if analysis["issues"]:
            self.log(f"[ANALYZE] Found {len(analysis['issues'])} issues:", "WARNING")
            for issue in analysis["issues"][:5]:  # Максимум 5
                self.log(f"  - {issue}", "WARNING")
        
        if analysis["warnings"]:
            self.log(f"[ANALYZE] Found {len(analysis['warnings'])} warnings", "INFO")
        
        # ГЕНЕРАЦИЯ НОВЫХ ЗАДАЧ (ключевая фича!)
        if analysis["new_tasks"]:
            self.log(f"\n[TASK GEN] Generating {len(analysis['new_tasks'])} new tasks", "INFO")
            self.task_manager.generate_subtasks(task.id, analysis["new_tasks"])
            self.stats["tasks_generated"] += len(analysis["new_tasks"])
            
            for new_task in analysis["new_tasks"]:
                self.log(f"  → {new_task.id}: {new_task.name}", "INFO")
        
        # ОБНОВЛЕНИЕ КОНТЕКСТА (ключевая фича!)
        if analysis["context_updates"]:
            self.log(f"[CONTEXT] Updating project context", "INFO")
            self.context.update_from_task(task.id, analysis["context_updates"])
        
        return success
    
    def _create_checkpoint(self, task: Task) -> bool:
        """Создать Git checkpoint"""
        self.log(f"[GIT] Creating checkpoint: {task.id}", "INFO")
        
        if self.dry_run:
            return True
        
        try:
            # Проверить что есть изменения
            result = subprocess.run(
                ["git", "status", "--porcelain"],
                cwd=self.project_dir,
                capture_output=True,
                text=True,
                encoding='utf-8',
                timeout=30
            )
            
            if not result.stdout.strip():
                self.log("[GIT] No changes to commit", "INFO")
                return True
            
            # Добавить всё
            subprocess.run(
                ["git", "add", "-A"],
                cwd=self.project_dir,
                check=True,
                timeout=30
            )
            
            # Commit
            commit_msg = f"[night-mode-{self.session_id}] Checkpoint before task {task.id}: {task.name}"
            subprocess.run(
                ["git", "commit", "-m", commit_msg],
                cwd=self.project_dir,
                check=True,
                timeout=30
            )
            
            # Tag
            tag_name = f"night-mode-{task.id}"
            subprocess.run(
                ["git", "tag", "-f", tag_name],
                cwd=self.project_dir,
                check=True,
                timeout=30
            )
            
            self.log(f"[GIT] Checkpoint created: {tag_name}", "INFO")
            return True
        
        except subprocess.TimeoutExpired:
            self.log("[ERROR] Git command timed out", "ERROR")
            return False
        except subprocess.CalledProcessError as e:
            self.log(f"[ERROR] Git command failed: {e}", "ERROR")
            return False
        except Exception as e:
            self.log(f"[ERROR] Failed to create checkpoint: {e}", "ERROR")
            return False
    
    def _rollback_checkpoint(self, task: Task) -> bool:
        """Откатить к checkpoint"""
        self.log(f"[GIT] Rolling back to checkpoint: {task.id}", "WARNING")
        
        if self.dry_run:
            return True
        
        try:
            tag_name = f"night-mode-{task.id}"
            subprocess.run(
                ["git", "reset", "--hard", tag_name],
                cwd=self.project_dir,
                check=True,
                timeout=30
            )
            
            self.log(f"[GIT] Rolled back to: {tag_name}", "INFO")
            return True
        
        except Exception as e:
            self.log(f"[ERROR] Failed to rollback: {e}", "ERROR")
            return False
    # =========================================================================
    # ACTION IMPLEMENTATIONS
    # =========================================================================
    
    def _action_code_edit(self, action: Dict) -> Dict[str, Any]:
        """Редактировать код"""
        file_path = action.get("file")
        
        if not file_path:
            return {"success": False, "error": "No file specified", "output": ""}
        
        full_path = os.path.join(self.project_dir, file_path)
        
        if not os.path.exists(full_path):
            return {"success": False, "error": f"File not found: {file_path}", "output": ""}
        
        # Проверить whitelist
        if not self._check_whitelist(file_path):
            return {"success": False, "error": f"File not in whitelist: {file_path}", "output": ""}
        
        self.log(f"[CODE EDIT] {file_path}", "INFO")
        
        # TODO: Здесь будет реальное редактирование кода
        # Пока просто симуляция
        output = f"Edited file: {file_path}"
        
        return {"success": True, "error": None, "output": output}
    
    def _action_code_create(self, action: Dict) -> Dict[str, Any]:
        """Создать новый файл с кодом"""
        file_path = action.get("file")
        
        if not file_path:
            return {"success": False, "error": "No file specified", "output": ""}
        
        full_path = os.path.join(self.project_dir, file_path)
        
        # Проверить что папка существует
        dir_path = os.path.dirname(full_path)
        if not os.path.exists(dir_path):
            try:
                os.makedirs(dir_path)
            except Exception as e:
                return {"success": False, "error": f"Failed to create directory: {e}", "output": ""}
        
        # Проверить что файл не существует
        if os.path.exists(full_path):
            return {"success": False, "error": f"File already exists: {file_path}", "output": ""}
        
        self.log(f"[CODE CREATE] {file_path}", "INFO")
        
        # TODO: Здесь будет генерация кода
        # Пока создаём заглушку
        try:
            with open(full_path, 'w', encoding='utf-8') as f:
                f.write("# TODO: Generated file\n")
            
            output = f"Created file: {file_path}"
            return {"success": True, "error": None, "output": output}
        
        except Exception as e:
            return {"success": False, "error": str(e), "output": ""}
    
    def _action_command(self, action: Dict) -> Dict[str, Any]:
        """Выполнить команду"""
        cmd = action.get("cmd")
        
        if not cmd:
            return {"success": False, "error": "No command specified", "output": ""}
        
        self.log(f"[COMMAND] {cmd}", "INFO")
        
        try:
            # Определить рабочую директорию
            if "alembic" in cmd or "pytest" in cmd:
                cwd = os.path.join(self.project_dir, "backend")
            elif "npm" in cmd:
                cwd = os.path.join(self.project_dir, "frontend")
            else:
                cwd = self.project_dir
            
            # Выполнить через docker-compose exec если возможно
            if "alembic" in cmd or "pytest" in cmd or "python" in cmd:
                docker_cmd = f"docker-compose -f docker-compose.dev.yml exec -T backend {cmd}"
                result = subprocess.run(
                    docker_cmd,
                    shell=True,
                    cwd=self.project_dir,
                    capture_output=True,
                    text=True,
                    encoding='utf-8',
                    timeout=self.max_task_time
                )
            else:
                result = subprocess.run(
                    cmd,
                    shell=True,
                    cwd=cwd,
                    capture_output=True,
                    text=True,
                    encoding='utf-8',
                    timeout=self.max_task_time
                )
            
            output = result.stdout + result.stderr
            success = result.returncode == 0
            
            if not success:
                self.log(f"[ERROR] Command failed with exit code {result.returncode}", "ERROR")
            
            return {"success": success, "error": output if not success else None, "output": output}
        
        except subprocess.TimeoutExpired:
            return {"success": False, "error": "Command timed out", "output": ""}
        except Exception as e:
            return {"success": False, "error": str(e), "output": ""}
    
    def _action_test(self, action: Dict) -> Dict[str, Any]:
        """Запустить тесты"""
        target = action.get("target")
        
        self.log(f"[TEST] {target}", "INFO")
        
        if target == "inventory_endpoints":
            cmd = "pytest tests/test_inventory.py -v"
        elif target == "document_endpoints":
            cmd = "pytest tests/test_documents.py -v"
        elif target == "performance_endpoints":
            cmd = "pytest tests/test_performances.py -v"
        elif target == "schedule_endpoints":
            cmd = "pytest tests/test_schedule.py -v"
        elif target == "coverage_report":
            cmd = "pytest --cov=app --cov-report=term-missing"
        else:
            cmd = "pytest -v"
        
        return self._action_command({"cmd": cmd})
    
    def _action_scan(self, action: Dict) -> Dict[str, Any]:
        """Сканировать файлы"""
        pattern = action.get("pattern")
        
        if not pattern:
            return {"success": False, "error": "No pattern specified", "output": ""}
        
        self.log(f"[SCAN] {pattern}", "INFO")
        
        import glob
        
        search_path = os.path.join(self.project_dir, pattern)
        files = glob.glob(search_path, recursive=True)
        
        output = f"Found {len(files)} files matching {pattern}\n"
        output += "\n".join(files[:20])  # Максимум 20 файлов
        
        return {"success": True, "error": None, "output": output}
    
    def _action_analyze(self, action: Dict) -> Dict[str, Any]:
        """Анализ"""
        target = action.get("target")
        
        self.log(f"[ANALYZE] {target}", "INFO")
        
        if target == "database_schema":
            # Анализ схемы БД
            output = "Analyzing database schema...\n"
            output += f"Models: {len(self.context.context['backend']['models'])}\n"
            output += f"Tables: {len(self.context.context['database']['tables'])}\n"
        else:
            output = f"Analysis for {target} not implemented yet"
        
        return {"success": True, "error": None, "output": output}
    
    def _action_generate(self, action: Dict) -> Dict[str, Any]:
        """Генерация"""
        target = action.get("target")
        
        self.log(f"[GENERATE] {target}", "INFO")
        
        if target == "pdf_files":
            output = "Generating PDF files... (not implemented yet)"
        elif target == "images":
            output = "Generating images... (not implemented yet)"
        elif target == "api_docs":
            output = "Generating API docs... (not implemented yet)"
        elif target == "component_docs":
            output = "Generating component docs... (not implemented yet)"
        else:
            output = f"Generation for {target} not implemented yet"
        
        return {"success": True, "error": None, "output": output}
    
    # =========================================================================
    # HELPER METHODS
    # =========================================================================
    
    def _setup_directory(self) -> bool:
        """Создать структуру директорий"""
        try:
            dirs = [
                ".night-mode",
                ".night-mode/logs",
                ".night-mode/checkpoints",
                ".night-mode/backups"
            ]
            
            for dir_path in dirs:
                full_path = os.path.join(self.project_dir, dir_path)
                os.makedirs(full_path, exist_ok=True)
            
            # Создать whitelist если нет
            whitelist_path = os.path.join(self.project_dir, self.whitelist_file)
            if not os.path.exists(whitelist_path):
                with open(whitelist_path, 'w', encoding='utf-8') as f:
                    f.write("backend/app/**/*.py\n")
                    f.write("frontend/src/**/*.ts\n")
                    f.write("frontend/src/**/*.tsx\n")
                    f.write("backend/scripts/*.py\n")
                    f.write("backend/alembic/versions/*.py\n")
            
            return True
        except Exception as e:
            self.log(f"[ERROR] Failed to setup directory: {e}", "ERROR")
            return False
    
    def _preflight_checks(self) -> bool:
        """Pre-flight проверки"""
        self.log("\n[CHECK] Running pre-flight checks...", "INFO")
        
        # Проверить Docker
        try:
            result = subprocess.run(
                ["docker", "compose", "-f", "docker-compose.dev.yml", "ps"],
                cwd=self.project_dir,
                capture_output=True,
                timeout=10
            )
            
            if result.returncode != 0:
                self.log("[ERROR] Docker Compose not running", "ERROR")
                return False
            
            # Проверить что контейнеры запущены
            output = result.stdout.decode('utf-8', errors='ignore')
            if "theatre-backend" not in output or "theatre-frontend" not in output:
                self.log("[ERROR] Required containers not running", "ERROR")
                self.log("Please run: docker compose -f docker-compose.dev.yml up -d", "ERROR")
                return False
            
            self.log("[OK] Docker Compose running", "INFO")
        except Exception as e:
            self.log(f"[ERROR] Docker check failed: {e}", "ERROR")
            return False
        
        # Проверить Git
        try:
            subprocess.run(
                ["git", "status"],
                cwd=self.project_dir,
                capture_output=True,
                check=True,
                timeout=10
            )
            self.log("[OK] Git available", "INFO")
        except Exception as e:
            self.log(f"[ERROR] Git check failed: {e}", "ERROR")
            return False
        
        return True
    
    def _check_whitelist(self, file_path: str) -> bool:
        """Проверить файл в whitelist"""
        whitelist_path = os.path.join(self.project_dir, self.whitelist_file)
        
        if not os.path.exists(whitelist_path):
            return True  # Если нет whitelist - разрешить всё
        
        try:
            with open(whitelist_path, 'r', encoding='utf-8') as f:
                patterns = [line.strip() for line in f if line.strip() and not line.startswith('#')]
            
            import fnmatch
            
            for pattern in patterns:
                if fnmatch.fnmatch(file_path, pattern):
                    return True
            
            return False
        except Exception:
            return True
    
    def _print_final_report(self) -> None:
        """Вывести финальный отчёт"""
        self.log("\n" + "="*60, "INFO")
        self.log("FINAL REPORT", "INFO")
        self.log("="*60, "INFO")
        
        # Статистика задач
        stats = self.task_manager.get_statistics()
        self.log("\n[TASKS]", "INFO")
        self.log(f"  Total: {stats['total']}", "INFO")
        self.log(f"  Completed: {stats['completed']}", "INFO")
        self.log(f"  Failed: {stats['failed']}", "INFO")
        self.log(f"  Pending: {stats['pending']}", "INFO")
        self.log(f"  Auto-generated: {stats['auto_generated']}", "INFO")
        self.log(f"  Progress: {stats['progress']}%", "INFO")
        
        # Время
        self.log("\n[TIME]", "INFO")
        self.log(f"  Total: {self.stats['total_time']:.0f}s ({self.stats['total_time']/60:.1f} min)", "INFO")
        
        # Анализ
        analysis_summary = self.analyzer.get_analysis_summary()
        self.log("\n[ANALYSIS]", "INFO")
        self.log(f"  Issues found: {analysis_summary['total_issues']}", "INFO")
        self.log(f"  Warnings: {analysis_summary['total_warnings']}", "INFO")
        self.log(f"  Tasks generated: {analysis_summary['total_generated_tasks']}", "INFO")
        
        # Проваленные задачи
        failed_tasks = self.task_manager.get_failed_tasks()
        if failed_tasks:
            self.log("\n[FAILED TASKS]", "ERROR")
            for task in failed_tasks[:10]:
                self.log(f"  - {task.id}: {task.name}", "ERROR")
                if task.error:
                    self.log(f"    Error: {task.error[:100]}", "ERROR")
        
        # Контекст
        self.log("\n" + self.context.get_summary(), "INFO")
        
        self.log("\n" + "="*60, "INFO")
        self.log(f"Session log: {self.log_file}", "INFO")
        self.log("="*60, "INFO")
    
    def log(self, message: str, level: str = "INFO") -> None:
        """Логирование"""
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        log_line = f"[{timestamp}] [{level}] {message}"
        
        # Вывод в консоль
        print(log_line)
        
        # Запись в файл
        try:
            with open(self.log_file, 'a', encoding='utf-8') as f:
                f.write(log_line + "\n")
        except Exception:
            pass


# =============================================================================
# MAIN
# =============================================================================

def main():
    """Точка входа"""
    import argparse
    
    parser = argparse.ArgumentParser(description="Adaptive Night Mode v3")
    parser.add_argument("--project-dir", default=".", help="Project directory")
    parser.add_argument("--dry-run", action="store_true", help="Dry run mode")
    
    args = parser.parse_args()
    
    # Нормализовать путь
    project_dir = os.path.abspath(args.project_dir)
    
    # Создать оркестратор
    orchestrator = AdaptiveOrchestrator(project_dir, dry_run=args.dry_run)
    
    # Инициализация
    if not orchestrator.initialize():
        print("[ERROR] Initialization failed")
        sys.exit(1)
    
    # Запуск
    success = orchestrator.run()
    
    # Выход
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
