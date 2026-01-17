@echo off
echo Launching Scrble Ink and monitor...

REM Launch Scrble Ink
start "" "shell:AppsFolder\10511ClaudiaWey.inknotespro_9n0kwq747cbjy!App"
echo Scrble Ink launched.

REM Launch monitor with correct working directory and log output
start "" /D "C:\Users\FSOS\Documents\fantastic-fiesta\dist" monitor_scrble_sync.exe > "C:\Users\FSOS\Documents\fantastic-fiesta\monitor.log" 2>&1

REM Optional: pause  # Uncomment for testing to keep window open