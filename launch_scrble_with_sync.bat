@echo off
REM Launch Scrble Ink (UWP app)
echo [BAT] Launching Scrble Ink...
start "" "shell:AppsFolder\10511ClaudiaWey.inknotespro_9n0kwq747cbjy!App"

REM Launch monitor window (NOT minimized so you can see output)
echo [BAT] Launching monitor...
start "" cmd /c ^
"cd /d C:\Users\lone\Documents\fantastic-fiesta\dist ^
 && monitor_scrble_sync.exe"

echo [BAT] Setup complete. You can close this window.
timeout /t 3
