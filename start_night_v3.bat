@echo off
REM =============================================================================
REM Adaptive Night Mode v3 - Windows Launcher
REM =============================================================================

setlocal enabledelayedexpansion

set PROJECT_DIR=C:\Work\projects\theatre\theatre_app_2026
set SCRIPT_DIR=%~dp0

echo.
echo =========================================
echo  ADAPTIVE NIGHT MODE V3
echo  Self-Learning Orchestrator
echo =========================================
echo.

cd /d "%PROJECT_DIR%"

REM Проверка Python
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python not found!
    pause
    exit /b 1
)

REM Проверка Docker
docker --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker not found!
    pause
    exit /b 1
)

REM Меню
echo Select mode:
echo.
echo   1^) DRY RUN - Simulate execution
echo   2^) FULL RUN - Execute all tasks
echo   3^) CONTINUE - Resume from checkpoint
echo   4^) STATUS - Show current state
echo   5^) RESET - Clean all state
echo.
set /p choice="Enter choice [1-5]: "

if "%choice%"=="1" goto dry_run
if "%choice%"=="2" goto full_run
if "%choice%"=="3" goto continue_run
if "%choice%"=="4" goto status
if "%choice%"=="5" goto reset
goto invalid

:dry_run
echo.
echo =========================================
echo  DRY RUN MODE
echo =========================================
echo.
echo This will simulate execution without making changes.
echo.
pause

python "%SCRIPT_DIR%night_orchestrator_v3_adaptive.py" --project-dir "%PROJECT_DIR%" --dry-run
goto end

:full_run
echo.
echo =========================================
echo  FULL RUN MODE
echo =========================================
echo.
echo This will execute ALL tasks and may take 4-6 hours!
echo.
echo IMPORTANT:
echo - Ensure Docker is running
echo - Commit any important changes
echo - System will create automatic checkpoints
echo.
set /p confirm="Continue? (yes/no): "

if not "%confirm%"=="yes" (
    echo Cancelled
    pause
    exit /b 0
)

echo.
echo Starting adaptive orchestrator...
echo.

python "%SCRIPT_DIR%night_orchestrator_v3_adaptive.py" --project-dir "%PROJECT_DIR%"
goto end

:continue_run
echo.
echo =========================================
echo  CONTINUE MODE
echo =========================================
echo.
echo This will resume from last checkpoint.
echo.

REM Проверить что есть state
if not exist "%PROJECT_DIR%\.night-mode\task_queue.json" (
    echo [ERROR] No checkpoint found!
    echo Run FULL RUN first.
    pause
    exit /b 1
)

python "%SCRIPT_DIR%night_orchestrator_v3_adaptive.py" --project-dir "%PROJECT_DIR%"
goto end

:status
echo.
echo =========================================
echo  CURRENT STATUS
echo =========================================
echo.

REM Показать статистику
if exist "%PROJECT_DIR%\.night-mode\task_queue.json" (
    python -c "import json; data=json.load(open('.night-mode/task_queue.json','r',encoding='utf-8')); tasks=data.get('tasks',[]); pending=sum(1 for t in tasks if t['status']=='pending'); completed=sum(1 for t in tasks if t['status']=='completed'); failed=sum(1 for t in tasks if t['status']=='failed'); print(f'Total tasks: {len(tasks)}'); print(f'Pending: {pending}'); print(f'Completed: {completed}'); print(f'Failed: {failed}'); print(f'Progress: {completed/len(tasks)*100:.1f}%%' if len(tasks)>0 else 'N/A')"
) else (
    echo No state file found.
    echo Run FULL RUN to start.
)

echo.

REM Показать контекст
if exist "%PROJECT_DIR%\.night-mode\project_context.json" (
    echo.
    echo Project Context:
    python -c "import json; ctx=json.load(open('.night-mode/project_context.json','r',encoding='utf-8')); print(f'Models: {len(ctx[\"backend\"][\"models\"])}'); print(f'Schemas: {len(ctx[\"backend\"][\"schemas\"])}'); print(f'API Endpoints: {len(ctx[\"backend\"][\"api_endpoints\"])}'); print(f'Pages: {len(ctx[\"frontend\"][\"pages\"])}'); print(f'Components: {len(ctx[\"frontend\"][\"components\"])}')"
)

echo.
pause
exit /b 0

:reset
echo.
echo =========================================
echo  RESET MODE
echo =========================================
echo.
echo WARNING: This will DELETE all state!
echo - Task queue
echo - Project context
echo - Logs
echo - Checkpoints
echo.
set /p confirm="Are you SURE? Type 'yes' to confirm: "

if not "%confirm%"=="yes" (
    echo Cancelled
    pause
    exit /b 0
)

echo.
echo Cleaning state...

REM Удалить state files
if exist "%PROJECT_DIR%\.night-mode\task_queue.json" del /f "%PROJECT_DIR%\.night-mode\task_queue.json"
if exist "%PROJECT_DIR%\.night-mode\project_context.json" del /f "%PROJECT_DIR%\.night-mode\project_context.json"
if exist "%PROJECT_DIR%\.night-mode\logs" rmdir /s /q "%PROJECT_DIR%\.night-mode\logs"
if exist "%PROJECT_DIR%\.night-mode\checkpoints" rmdir /s /q "%PROJECT_DIR%\.night-mode\checkpoints"

echo.
echo [OK] State cleaned
echo.
pause
exit /b 0

:invalid
echo Invalid choice
pause
exit /b 1

:end
echo.
echo =========================================
echo  EXECUTION COMPLETE
echo =========================================
echo.
echo Check logs in: .night-mode\logs\
echo.

REM Показать финальную статистику
if exist "%PROJECT_DIR%\.night-mode\task_queue.json" (
    echo Final statistics:
    python -c "import json; data=json.load(open('.night-mode/task_queue.json','r',encoding='utf-8')); tasks=data.get('tasks',[]); completed=sum(1 for t in tasks if t['status']=='completed'); failed=sum(1 for t in tasks if t['status']=='failed'); auto_gen=sum(1 for t in tasks if t.get('auto_generated',False)); print(f'Completed: {completed}'); print(f'Failed: {failed}'); print(f'Auto-generated: {auto_gen}')"
)

echo.
pause
exit /b 0
