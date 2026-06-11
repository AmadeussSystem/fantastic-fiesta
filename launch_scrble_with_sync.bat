@echo off
setlocal

REM ── Derive repo root from this batch file's location ──────────────────────
set "REPO_DIR=%~dp0"
REM Remove trailing backslash
if "%REPO_DIR:~-1%"=="\" set "REPO_DIR=%REPO_DIR:~0,-1%"

REM ── Launch Scrble Ink (UWP) ───────────────────────────────────────────────
echo Launching Scrble Ink...
start "" "shell:AppsFolder\10511ClaudiaWey.inknotespro_9n0kwq747cbjy!App"

REM ── Launch monitor — always prefer Python source over compiled .exe ───────
REM   The .exe is a PyInstaller snapshot that goes stale after code changes.
REM   Only use the .exe if Python is not available on this machine.
echo Starting sync monitor...

where python >nul 2>&1
if %ERRORLEVEL%==0 (
    REM Python is available — run from source (always up to date)
    REM Using cmd /k so the window stays open if the script crashes
    start "Scrble Sync Monitor" cmd /k python "%REPO_DIR%\monitor_scrble_sync.py"
) else if exist "%REPO_DIR%\dist\monitor_scrble_sync.exe" (
    REM Fallback: use compiled .exe if Python is not installed
    start "" /D "%REPO_DIR%\dist" monitor_scrble_sync.exe
) else (
    echo [ERROR] Neither Python nor monitor_scrble_sync.exe found.
    echo         Install Python or rebuild the .exe with PyInstaller.
    pause
    exit /b 1
)

echo Done. Check %REPO_DIR%\monitor.log for sync status.
endlocal