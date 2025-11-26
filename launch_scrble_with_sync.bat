@echo off
REM Launch Scrble Ink (UWP app)
start "" "shell:AppsFolder\10511ClaudiaWey.inknotespro_9n0kwq747cbjy!App"

REM Launch monitor in background, writing logs to monitor.log
REM /MIN = start minimized; remove it if you want to see the window
start "" /MIN cmd /c ^
"cd /d C:\Users\lone\Documents\fantastic-fiesta\dist ^
 && monitor_scrble_sync.exe >> C:\Users\lone\Documents\fantastic-fiesta\monitor.log 2>&1"

exit /b
