# Night Mode

Isolated folder for automated night development.

## Usage

```cmd
REM Start orchestrator
python scripts\night_orchestrator_v2_windows.py

REM Monitor progress
python scripts\night_monitor_windows.py

REM Check status
type reports\current_status.md
```

## Checkpoints

All changes saved as git tags:
- night-mode-step-1.1
- night-mode-step-1.2

Rollback:
```cmd
git reset --hard night-mode-step-1.1
```
