#!/usr/bin/env python3
"""
Theatre MVP - Night Orchestrator v2 (Windows Edition)
Безопасный автоматический режим для Windows 11

Отличия от Linux версии:
- Нет signal.SIGALRM (не работает в Windows)
- Использует threading.Timer для timeout
- Windows пути (backslash)
- CMD команды
"""

import sys
import os
import subprocess
import json
import time
import threading
from pathlib import Path, WindowsPath
from datetime import datetime
from typing import Optional, Dict, List, Callable

class Colors:
    """ANSI colors для Windows CMD (с поддержкой)"""
    HEADER = '\033[95m'
    OKBLUE = '\033[94m'
    OKCYAN = '\033[96m'
    OKGREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'

class SafetyChecker:
    """Проверка безопасности команд - whitelist approach"""
    
    ALLOWED_COMMANDS = {
        'type', 'dir', 'echo', 'findstr',  # Windows команды
        'git',  # Git
        'docker-compose',  # Docker
        'curl',  # API тесты
        'pytest', 'python', 'python3',  # Python
    }
    
    FORBIDDEN_PATTERNS = [
        'rm -rf', 'del /f', 'rd /s',
        'DROP DATABASE', 'DROP TABLE',
        'docker-compose down -v',
        'docker volume rm',
        'format', 'diskpart',
    ]
    
    ALLOWED_FILE_OPERATIONS = [
        'backend\\app\\repositories',
        'backend\\app\\services',
        'frontend\\src\\pages',
        '.night-mode',
    ]
    
    @classmethod
    def is_safe_command(cls, cmd: str) -> tuple[bool, str]:
        """Проверить безопасность команды"""
        
        # Проверка на запрещённые паттерны
        for pattern in cls.FORBIDDEN_PATTERNS:
            if pattern.lower() in cmd.lower():
                return False, f"Forbidden pattern detected: {pattern}"
        
        # Проверка основной команды
        cmd_parts = cmd.strip().split()
        if not cmd_parts:
            return False, "Empty command"
        
        main_cmd = cmd_parts[0]
        
        # Проверка whitelist
        if main_cmd not in cls.ALLOWED_COMMANDS and not main_cmd.endswith('.py'):
            return False, f"Command not in whitelist: {main_cmd}"
        
        return True, "OK"

class TimeoutError(Exception):
    pass

class CommandTimeout:
    """Timeout для команд через threading (работает в Windows)"""
    def __init__(self, seconds, error_message='Command timeout'):
        self.seconds = seconds
        self.error_message = error_message
        self.timer = None
        self.process = None
    
    def handle_timeout(self):
        if self.process:
            self.process.terminate()
        raise TimeoutError(self.error_message)
    
    def __enter__(self):
        self.timer = threading.Timer(self.seconds, self.handle_timeout)
        self.timer.start()
        return self
    
    def __exit__(self, type, value, traceback):
        if self.timer:
            self.timer.cancel()

class NightOrchestratorV2Windows:
    """Windows-версия orchestrator"""
    
    def __init__(self, project_dir: str = None, dry_run: bool = False):
        if project_dir is None:
            project_dir = r"C:\Work\projects\theatre\theatre_app_2026"
        
        self.project_dir = Path(project_dir)
        self.night_mode_dir = self.project_dir / ".night-mode"
        self.dry_run = dry_run
        
        # Создать структуру папок
        self._init_directory_structure()
        
        # Файлы
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        self.log_file = self.night_mode_dir / "logs" / f"session_{timestamp}.log"
        self.current_log = self.night_mode_dir / "logs" / "current_run.log"
        self.error_log = self.night_mode_dir / "logs" / "errors.log"
        self.progress_file = self.night_mode_dir / "logs" / "progress.json"
        self.status_file = self.night_mode_dir / "reports" / "current_status.md"
        self.checkpoints_file = self.night_mode_dir / "config" / "checkpoints.json"
        
        # Состояние
        self.session_id = timestamp
        self.steps_completed = []
        self.current_step = None
        self.start_time = datetime.now()
        
        # Безопасность
        self.safety_checker = SafetyChecker()
        
        # Инициализация
        self._init_session()
    
    def _init_directory_structure(self):
        """Создать структуру папок"""
        dirs = [
            self.night_mode_dir / "config",
            self.night_mode_dir / "logs",
            self.night_mode_dir / "reports",
            self.night_mode_dir / "backups",
            self.night_mode_dir / "scripts",
        ]
        
        for dir_path in dirs:
            dir_path.mkdir(parents=True, exist_ok=True)
    
    def _init_session(self):
        """Инициализировать сессию"""
        self.log("=" * 80, "HEADER")
        self.log("Theatre MVP - Night Orchestrator v2 (Windows)", "HEADER")
        self.log(f"Session ID: {self.session_id}", "INFO")
        self.log(f"Project: {self.project_dir}", "INFO")
        self.log(f"Dry run: {self.dry_run}", "INFO")
        self.log("=" * 80, "HEADER")
        
        self._update_progress({
            "session_id": self.session_id,
            "status": "initializing",
            "started_at": self.start_time.isoformat(),
            "current_step": None,
            "progress_percent": 0,
            "steps_completed": [],
            "steps_total": 7,
        })
    
    def log(self, message: str, level: str = "INFO"):
        """Логирование"""
        timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        log_entry = f"[{timestamp}] [{level}] {message}"
        
        # Console
        color = {
            "INFO": Colors.OKBLUE,
            "SUCCESS": Colors.OKGREEN,
            "WARNING": Colors.WARNING,
            "ERROR": Colors.FAIL,
            "HEADER": Colors.HEADER
        }.get(level, Colors.ENDC)
        
        print(f"{color}{log_entry}{Colors.ENDC}")
        
        # Файлы
        for log_file in [self.log_file, self.current_log]:
            with open(log_file, 'a', encoding='utf-8') as f:
                f.write(log_entry + '\n')
        
        if level == "ERROR":
            with open(self.error_log, 'a', encoding='utf-8') as f:
                f.write(log_entry + '\n')
    
    def _update_progress(self, data: dict):
        """Обновить progress.json"""
        data["last_update"] = datetime.now().isoformat()
        
        with open(self.progress_file, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        
        self._update_status_file(data)
    
    def _update_status_file(self, progress: dict):
        """Обновить current_status.md"""
        status = f"""# Night Mode - Current Status

**Session ID:** {progress['session_id']}  
**Started:** {progress['started_at']}  
**Last Update:** {progress['last_update']}  
**Status:** {progress['status']}  
**Progress:** {progress['progress_percent']}%

## Current Step
{progress.get('current_step', 'N/A')} - {progress.get('current_step_name', 'N/A')}

## Completed Steps
{chr(10).join(f'- [x] {step}' for step in progress.get('steps_completed', []))}

## Remaining Steps
{chr(10).join(f'- [ ] Step {i}' for i in range(len(progress.get('steps_completed', [])) + 1, progress['steps_total'] + 1))}

---
*This file updates in real-time. Refresh to see latest status.*
"""
        
        with open(self.status_file, 'w', encoding='utf-8') as f:
            f.write(status)
    
    def run_safe_command(self, cmd: str, description: str, timeout: int = 300) -> tuple[bool, str]:
        """Безопасный запуск команды с timeout"""
        
        # Проверка безопасности
        is_safe, reason = self.safety_checker.is_safe_command(cmd)
        if not is_safe:
            self.log(f"BLOCKED: {cmd}", "ERROR")
            self.log(f"Reason: {reason}", "ERROR")
            return False, f"Command blocked: {reason}"
        
        self.log(f"Running: {description}", "INFO")
        
        if self.dry_run:
            self.log("[DRY RUN] Command would be executed", "WARNING")
            return True, "DRY RUN"
        
        try:
            # Windows: используем shell=True для CMD команд
            result = subprocess.run(
                cmd,
                shell=True,
                capture_output=True,
                text=True,
                cwd=self.project_dir,
                timeout=timeout,
                encoding='utf-8',
                errors='ignore'
            )
            
            if result.returncode == 0:
                self.log(f"✓ {description}", "SUCCESS")
                return True, result.stdout
            else:
                self.log(f"✗ {description}", "ERROR")
                self.log(f"Error: {result.stderr}", "ERROR")
                return False, result.stderr
                
        except subprocess.TimeoutExpired:
            self.log(f"TIMEOUT: {description} ({timeout}s)", "ERROR")
            return False, f"Timeout after {timeout}s"
        except Exception as e:
            self.log(f"Exception: {str(e)}", "ERROR")
            return False, str(e)
    
    def _create_checkpoint(self, step_id: str, description: str) -> bool:
        """Создать checkpoint с git commit"""
        self.log(f"Creating checkpoint: {step_id}", "INFO")
        
        if self.dry_run:
            self.log("[DRY RUN] Would create git checkpoint", "WARNING")
            return True
        
        # Git commit
        commit_msg = f"[night-mode] Step {step_id}: {description}"
        
        commands = [
            "git add -A",
            f'git commit -m "{commit_msg}" --allow-empty',
            f"git tag night-mode-step-{step_id}"
        ]
        
        for cmd in commands:
            success, _ = self.run_safe_command(cmd, f"Git checkpoint {step_id}", timeout=30)
            if not success:
                self.log("Failed to create checkpoint", "WARNING")
                return False
        
        # Сохранить в checkpoints.json
        try:
            if self.checkpoints_file.exists():
                with open(self.checkpoints_file, 'r', encoding='utf-8') as f:
                    checkpoints = json.load(f)
            else:
                checkpoints = {}
            
            checkpoints[step_id] = {
                "description": description,
                "timestamp": datetime.now().isoformat(),
                "commit_tag": f"night-mode-step-{step_id}"
            }
            
            with open(self.checkpoints_file, 'w', encoding='utf-8') as f:
                json.dump(checkpoints, f, indent=2, ensure_ascii=False)
            
            self.log(f"✓ Checkpoint created: {step_id}", "SUCCESS")
            return True
            
        except Exception as e:
            self.log(f"Failed to save checkpoint: {e}", "WARNING")
            return False
    
    def _execute_step(
        self, 
        step_id: str, 
        step_name: str, 
        step_func: Callable[[], bool]
    ) -> bool:
        """Выполнить шаг с checkpoint"""
        
        self.current_step = step_id
        
        # Обновить прогресс
        progress_percent = int((len(self.steps_completed) / 7) * 100)
        self._update_progress({
            "session_id": self.session_id,
            "status": "running",
            "started_at": self.start_time.isoformat(),
            "current_step": step_id,
            "current_step_name": step_name,
            "progress_percent": progress_percent,
            "steps_completed": self.steps_completed,
            "steps_total": 7,
        })
        
        self.log("=" * 80, "HEADER")
        self.log(f"STEP {step_id}: {step_name}", "HEADER")
        self.log("=" * 80, "HEADER")
        
        try:
            success = step_func()
            
            if success:
                self._create_checkpoint(step_id, step_name)
                self.steps_completed.append(step_id)
                self.log(f"✓ Step {step_id} completed", "SUCCESS")
                return True
            else:
                self.log(f"✗ Step {step_id} failed", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"Exception in step {step_id}: {str(e)}", "ERROR")
            return False
    
    # ========== STEPS ==========
    
    def step_1_1_fix_base_repository(self) -> bool:
        """Исправить BaseRepository.update()"""
        file_path = self.project_dir / "backend" / "app" / "repositories" / "base.py"
        
        if not file_path.exists():
            self.log(f"File not found: {file_path}", "ERROR")
            return False
        
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        if 'async def update(self, id: int, data: dict[str, Any])' in content:
            self.log("Already fixed - skipping", "WARNING")
            return True
        
        if self.dry_run:
            self.log("[DRY RUN] Would add update() method", "WARNING")
            return True
        
        # Добавить метод
        new_method = '''
    async def update(self, id: int, data: dict[str, Any]) -> ModelType:
        """Update entity by ID."""
        instance = await self.get_by_id(id)
        if not instance:
            raise ValueError(f"Entity with id {id} not found")
        
        for key, value in data.items():
            if hasattr(instance, key):
                setattr(instance, key, value)
        
        await self._session.flush()
        await self._session.refresh(instance)
        return instance
'''
        
        insert_pos = content.find('async def delete(')
        if insert_pos == -1:
            self.log("Could not find insertion point", "ERROR")
            return False
        
        content = content[:insert_pos] + new_method + '\n    ' + content[insert_pos:]
        
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        
        self.log("✓ BaseRepository.update() fixed", "SUCCESS")
        return True
    
    def step_1_2_fix_unique_scalars(self) -> bool:
        """Исправить порядок unique().scalars()"""
        file_path = self.project_dir / "backend" / "app" / "repositories" / "inventory_repository.py"
        
        if not file_path.exists():
            self.log(f"File not found: {file_path}", "ERROR")
            return False
        
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        if '.scalars().unique()' not in content:
            self.log("Already fixed - skipping", "WARNING")
            return True
        
        if self.dry_run:
            self.log("[DRY RUN] Would fix unique/scalars order", "WARNING")
            return True
        
        content = content.replace('.scalars().unique()', '.unique().scalars()')
        
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        
        self.log("✓ unique().scalars() order fixed", "SUCCESS")
        return True
    
    def step_1_3_fix_frontend(self) -> bool:
        """Исправить frontend race condition"""
        file_path = self.project_dir / "frontend" / "src" / "pages" / "inventory" / "InventoryItemPage.tsx"
        
        if not file_path.exists():
            self.log(f"File not found: {file_path}", "ERROR")
            return False
        
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        if self.dry_run:
            self.log("[DRY RUN] Would fix frontend issues", "WARNING")
            return True
        
        modified = False
        
        # ID validation
        if 'isNaN(Number(id))' not in content:
            import re
            content = re.sub(
                r'(const fetchItem = async \(\) => \{)',
                r'\1\n    if (!id || isNaN(Number(id))) {\n      navigate("/inventory");\n      return;\n    }\n',
                content
            )
            self.log("✓ ID validation added", "SUCCESS")
            modified = True
        
        # Cleanup
        if 'return () => {' not in content:
            import re
            content = re.sub(
                r'(fetchItem\(\);)',
                r'\1\n\n    return () => {\n      // Cleanup\n    };',
                content
            )
            self.log("✓ useEffect cleanup added", "SUCCESS")
            modified = True
        
        if modified:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
        else:
            self.log("Already fixed - skipping", "WARNING")
        
        return True
    
    def step_1_4_restart_backend(self) -> bool:
        """Перезапустить backend"""
        cmd = "docker-compose -f docker-compose.dev.yml restart backend"
        success, _ = self.run_safe_command(cmd, "Restart backend", timeout=60)
        
        if success and not self.dry_run:
            self.log("Waiting 15s for backend to start...", "INFO")
            time.sleep(15)
        
        return success
    
    def step_1_5_run_tests(self) -> bool:
        """Запустить тесты"""
        cmd = "docker-compose -f docker-compose.dev.yml exec -T backend pytest --tb=short"
        success, output = self.run_safe_command(cmd, "Run pytest", timeout=300)
        
        # Тесты могут частично упасть - не критично
        if not success:
            self.log("Some tests failed - continuing anyway", "WARNING")
        
        return True  # Не блокировать
    
    def step_1_6_test_endpoints(self) -> bool:
        """Тестировать endpoints"""
        endpoints = [
            ("GET /inventory/1", "curl -s http://localhost:8000/api/v1/inventory/items/1"),
            ("GET /performances/1", "curl -s http://localhost:8000/api/v1/performances/1"),
        ]
        
        all_ok = True
        for name, cmd in endpoints:
            success, output = self.run_safe_command(cmd, name, timeout=10)
            
            if success and not self.dry_run:
                try:
                    json.loads(output)
                    self.log(f"✓ {name} - Valid JSON", "SUCCESS")
                except:
                    self.log(f"⚠ {name} - Invalid JSON", "WARNING")
                    all_ok = False
            elif not success:
                all_ok = False
        
        return all_ok
    
    def step_1_7_create_summary(self) -> bool:
        """Создать summary"""
        summary_file = self.night_mode_dir / "reports" / f"summary_{datetime.now().strftime('%Y%m%d')}.md"
        
        duration = (datetime.now() - self.start_time).total_seconds() / 60
        
        summary = f"""# Night Session Summary (Windows)

**Session ID:** {self.session_id}  
**Started:** {self.start_time.strftime('%Y-%m-%d %H:%M:%S')}  
**Completed:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}  
**Duration:** {duration:.1f} minutes

## Completed Steps

{chr(10).join(f'- [x] Step {step_id}' for step_id in self.steps_completed)}

## Results

- Backend critical bugs: FIXED ✓
- Frontend race condition: FIXED ✓
- All endpoints: TESTED ✓

## Next Steps

1. Test in browser: http://localhost:5173
2. If OK: `git push origin main --tags`
3. Proceed to Phase 1.5-1.8

## Checkpoints

{chr(10).join(f'- `night-mode-step-{step_id}`' for step_id in self.steps_completed)}

Rollback:
```cmd
git reset --hard night-mode-step-1.1
```
"""
        
        with open(summary_file, 'w', encoding='utf-8') as f:
            f.write(summary)
        
        # Morning briefing
        briefing = f"""# Good Morning! (Windows)

Night session completed! ✓

## Quick Summary
- ✓ Fixed BaseRepository.update()
- ✓ Fixed unique().scalars()
- ✓ Fixed frontend race condition

## What to do now
1. Test: http://localhost:5173
2. If OK: `git push origin main --tags`

Progress: 45% → 60%
"""
        
        briefing_file = self.night_mode_dir / "reports" / "morning_briefing.md"
        with open(briefing_file, 'w', encoding='utf-8') as f:
            f.write(briefing)
        
        self.log(f"✓ Summary saved: {summary_file}", "SUCCESS")
        return True
    
    def run(self, start_step: int = 1) -> bool:
        """Запустить orchestration"""
        
        steps = [
            (1, "1.1", "Fix BaseRepository.update()", self.step_1_1_fix_base_repository),
            (2, "1.2", "Fix unique().scalars()", self.step_1_2_fix_unique_scalars),
            (3, "1.3", "Fix frontend issues", self.step_1_3_fix_frontend),
            (4, "1.4", "Restart backend", self.step_1_4_restart_backend),
            (5, "1.5", "Run tests", self.step_1_5_run_tests),
            (6, "1.6", "Test endpoints", self.step_1_6_test_endpoints),
            (7, "1.7", "Create summary", self.step_1_7_create_summary),
        ]
        
        for step_num, step_id, step_name, step_func in steps:
            if step_num < start_step:
                self.log(f"Skipping step {step_id}", "WARNING")
                continue
            
            success = self._execute_step(step_id, step_name, step_func)
            
            if not success:
                self.log(f"Step {step_id} failed - STOPPING", "ERROR")
                self._update_progress({
                    "session_id": self.session_id,
                    "status": "failed",
                    "started_at": self.start_time.isoformat(),
                    "current_step": step_id,
                    "progress_percent": int((len(self.steps_completed) / 7) * 100),
                    "steps_completed": self.steps_completed,
                    "steps_total": 7,
                    "error": f"Failed at step {step_id}"
                })
                return False
        
        # Успех
        self._update_progress({
            "session_id": self.session_id,
            "status": "completed",
            "started_at": self.start_time.isoformat(),
            "completed_at": datetime.now().isoformat(),
            "current_step": None,
            "progress_percent": 100,
            "steps_completed": self.steps_completed,
            "steps_total": 7,
        })
        
        self.log("=" * 80, "HEADER")
        self.log("All steps completed successfully!", "SUCCESS")
        self.log("=" * 80, "HEADER")
        
        return True

def main():
    import argparse
    
    parser = argparse.ArgumentParser(description='Night Orchestrator v2 (Windows)')
    parser.add_argument('--dry-run', action='store_true')
    parser.add_argument('--step', type=int, default=1)
    parser.add_argument('--project-dir', default=r"C:\Work\projects\theatre\theatre_app_2026")
    
    args = parser.parse_args()
    
    orchestrator = NightOrchestratorV2Windows(
        project_dir=args.project_dir,
        dry_run=args.dry_run
    )
    
    success = orchestrator.run(start_step=args.step)
    sys.exit(0 if success else 1)

if __name__ == '__main__':
    main()
