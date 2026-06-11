@echo off
setlocal

REM ── Derive repo root from this batch file's location ──────────────────────
set "REPO_DIR=%~dp0"
REM Remove trailing backslash
if "%REPO_DIR:~-1%"=="\" set "REPO_DIR=%REPO_DIR:~0,-1%"

set "LOG_FILE=%REPO_DIR%\launch.log"

REM Log everything from this bat to launch.log
echo [%date% %time%] === Launch script started === >> "%LOG_FILE%" 2>&1

REM ── Launch Scrble Ink (UWP) ───────────────────────────────────────────────
echo [%date% %time%] Launching Scrble Ink... >> "%LOG_FILE%" 2>&1
start "" "shell:AppsFolder\10511ClaudiaWey.inknotespro_9n0kwq747cbjy!App"

REM ── Launch monitor — always prefer Python source over compiled .exe ───────
echo [%date% %time%] Starting sync monitor... >> "%LOG_FILE%" 2>&1

where python >nul 2>&1
if %ERRORLEVEL%==0 (
    echo [%date% %time%] Python found. Running from source. >> "%LOG_FILE%" 2>&1
    REM Run monitor with stdout+stderr piped to monitor.log
    start "Scrble Sync Monitor" cmd /k python "%REPO_DIR%\monitor_scrble_sync.py"
    echo [%date% %time%] Monitor started via Python. >> "%LOG_FILE%" 2>&1
) else if exist "%REPO_DIR%\dist\monitor_scrble_sync.exe" (
    echo [%date% %time%] Python not found. Using compiled .exe fallback. >> "%LOG_FILE%" 2>&1
    start "" /D "%REPO_DIR%\dist" monitor_scrble_sync.exe
    echo [%date% %time%] Monitor started via .exe. >> "%LOG_FILE%" 2>&1
) else (
    echo [%date% %time%] [ERROR] Neither Python nor .exe found. >> "%LOG_FILE%" 2>&1
    pause
    exit /b 1
)

echo [%date% %time%] Done. Monitor log: %REPO_DIR%\monitor.log >> "%LOG_FILE%" 2>&1
endlocal