#!/usr/bin/env python3
"""
Night Mode Monitor - Windows Edition
Real-time progress viewer для Windows CMD

Usage:
    python night_monitor_windows.py
"""

import sys
import json
import time
from pathlib import Path
from datetime import datetime
import os

class Colors:
    HEADER = '\033[95m'
    OKBLUE = '\033[94m'
    OKGREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'

class NightMonitor:
    def __init__(self, project_dir: str = None):
        if project_dir is None:
            project_dir = r"C:\Work\projects\theatre\theatre_app_2026"
        
        self.project_dir = Path(project_dir)
        self.night_mode_dir = self.project_dir / ".night-mode"
        self.progress_file = self.night_mode_dir / "logs" / "progress.json"
        self.status_file = self.night_mode_dir / "reports" / "current_status.md"
        self.current_log = self.night_mode_dir / "logs" / "current_run.log"
        
        if not self.progress_file.exists():
            print(f"{Colors.FAIL}Error: Night mode not running{Colors.ENDC}")
            print(f"Expected file: {self.progress_file}")
            sys.exit(1)
    
    def clear_screen(self):
        """Очистить экран (Windows)"""
        os.system('cls')
    
    def read_progress(self) -> dict:
        """Прочитать progress.json"""
        try:
            with open(self.progress_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            return {"error": str(e)}
    
    def read_last_log_lines(self, n: int = 10) -> list:
        """Прочитать последние N строк"""
        try:
            with open(self.current_log, 'r', encoding='utf-8') as f:
                lines = f.readlines()
                return lines[-n:] if len(lines) > n else lines
        except Exception:
            return []
    
    def format_progress_bar(self, percent: int, width: int = 50) -> str:
        """ASCII progress bar"""
        filled = int(width * percent / 100)
        bar = '█' * filled + '░' * (width - filled)
        return f"[{bar}] {percent}%"
    
    def format_duration(self, start_time_str: str) -> str:
        """Форматировать длительность"""
        try:
            start = datetime.fromisoformat(start_time_str)
            duration = datetime.now() - start
            hours = int(duration.total_seconds() // 3600)
            minutes = int((duration.total_seconds() % 3600) // 60)
            seconds = int(duration.total_seconds() % 60)
            return f"{hours:02d}:{minutes:02d}:{seconds:02d}"
        except:
            return "N/A"
    
    def render_dashboard(self):
        """Отрисовать dashboard"""
        progress = self.read_progress()
        
        if "error" in progress:
            print(f"{Colors.FAIL}Error reading progress: {progress['error']}{Colors.ENDC}")
            return
        
        self.clear_screen()
        
        # Header
        print(f"{Colors.HEADER}{'=' * 80}{Colors.ENDC}")
        print(f"{Colors.HEADER}Night Mode Monitor (Windows) - Real-time Progress{Colors.ENDC}")
        print(f"{Colors.HEADER}{'=' * 80}{Colors.ENDC}")
        print()
        
        # Session info
        print(f"{Colors.BOLD}Session ID:{Colors.ENDC} {progress.get('session_id', 'N/A')}")
        print(f"{Colors.BOLD}Status:{Colors.ENDC} ", end="")
        
        status = progress.get('status', 'unknown')
        if status == 'running':
            print(f"{Colors.OKGREEN}RUNNING{Colors.ENDC}")
        elif status == 'completed':
            print(f"{Colors.OKBLUE}COMPLETED{Colors.ENDC}")
        elif status == 'failed':
            print(f"{Colors.FAIL}FAILED{Colors.ENDC}")
        else:
            print(f"{Colors.WARNING}{status.upper()}{Colors.ENDC}")
        
        started_at = progress.get('started_at', 'N/A')
        duration = self.format_duration(started_at)
        print(f"{Colors.BOLD}Started:{Colors.ENDC} {started_at}")
        print(f"{Colors.BOLD}Duration:{Colors.ENDC} {duration}")
        print()
        
        # Progress bar
        percent = progress.get('progress_percent', 0)
        print(f"{Colors.BOLD}Overall Progress:{Colors.ENDC}")
        print(self.format_progress_bar(percent))
        print()
        
        # Current step
        current_step = progress.get('current_step')
        if current_step:
            step_name = progress.get('current_step_name', 'N/A')
            print(f"{Colors.BOLD}Current Step:{Colors.ENDC} {Colors.WARNING}{current_step} - {step_name}{Colors.ENDC}")
        else:
            print(f"{Colors.BOLD}Current Step:{Colors.ENDC} None")
        print()
        
        # Steps
        steps_completed = progress.get('steps_completed', [])
        steps_total = progress.get('steps_total', 7)
        
        print(f"{Colors.BOLD}Steps:{Colors.ENDC} {len(steps_completed)}/{steps_total} completed")
        print()
        
        if steps_completed:
            print(f"{Colors.OKGREEN}Completed:{Colors.ENDC}")
            for step in steps_completed:
                print(f"   [x] {step}")
            print()
        
        # Recent log
        print(f"{Colors.BOLD}Recent Activity:{Colors.ENDC}")
        print(f"{Colors.OKBLUE}{'-' * 80}{Colors.ENDC}")
        
        log_lines = self.read_last_log_lines(8)
        for line in log_lines:
            line = line.strip()
            if '[ERROR]' in line:
                print(f"{Colors.FAIL}{line}{Colors.ENDC}")
            elif '[WARNING]' in line:
                print(f"{Colors.WARNING}{line}{Colors.ENDC}")
            elif '[SUCCESS]' in line:
                print(f"{Colors.OKGREEN}{line}{Colors.ENDC}")
            else:
                print(line)
        
        print(f"{Colors.OKBLUE}{'-' * 80}{Colors.ENDC}")
        print()
        
        # Footer
        print(f"{Colors.OKBLUE}Press Ctrl+C to exit monitor{Colors.ENDC}")
        print(f"{Colors.OKBLUE}Refreshing every 5 seconds...{Colors.ENDC}")
    
    def watch(self, interval: int = 5):
        """Запустить мониторинг"""
        print(f"{Colors.OKGREEN}Starting monitor...{Colors.ENDC}")
        time.sleep(1)
        
        try:
            while True:
                self.render_dashboard()
                
                # Проверить статус
                progress = self.read_progress()
                if progress.get('status') in ['completed', 'failed']:
                    print()
                    print(f"{Colors.HEADER}{'=' * 80}{Colors.ENDC}")
                    
                    if progress.get('status') == 'completed':
                        print(f"{Colors.OKGREEN}Night session completed!{Colors.ENDC}")
                        print(f"{Colors.OKGREEN}Check: {self.night_mode_dir}\\reports\\morning_briefing.md{Colors.ENDC}")
                    else:
                        print(f"{Colors.FAIL}Night session failed{Colors.ENDC}")
                        print(f"{Colors.FAIL}Check: {self.night_mode_dir}\\logs\\errors.log{Colors.ENDC}")
                    
                    print(f"{Colors.HEADER}{'=' * 80}{Colors.ENDC}")
                    break
                
                time.sleep(interval)
                
        except KeyboardInterrupt:
            print()
            print(f"{Colors.WARNING}Monitor stopped{Colors.ENDC}")
            sys.exit(0)

def main():
    import argparse
    
    parser = argparse.ArgumentParser(description='Night Mode Monitor (Windows)')
    parser.add_argument('--project-dir', default=r"C:\Work\projects\theatre\theatre_app_2026")
    parser.add_argument('--interval', type=int, default=5)
    parser.add_argument('--once', action='store_true')
    
    args = parser.parse_args()
    
    monitor = NightMonitor(project_dir=args.project_dir)
    
    if args.once:
        monitor.render_dashboard()
    else:
        monitor.watch(interval=args.interval)

if __name__ == '__main__':
    main()
