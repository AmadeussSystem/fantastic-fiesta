import subprocess
import psutil
import time
import os
import sys

# ─── Paths ─────────────────────────────────────────────────────────
SYNC_SCRIPT = r"C:\Users\lone\Documents\fantastic-fiesta\git_auto_sync.py"  # Update if needed
PYTHON_PATH = r"C:\Users\lone\AppData\Local\Programs\Python\Python313\python.exe"

NOTE_APP_NAME = "Scrble Ink"
NOTE_APP_KEYWORD = "scrble"
sync_process = None

def is_note_app_running():
    for proc in psutil.process_iter(['name', 'cmdline']):
        name = proc.info.get('name', '') or ''
        cmdline = proc.info.get('cmdline')
        cmd = " ".join(cmdline) if isinstance(cmdline, list) else ""
        if NOTE_APP_NAME.lower() in name.lower() or NOTE_APP_KEYWORD in cmd.lower():
            return True
    return False

try:
    print("[Monitor] Waiting for Scrble Ink to launch...")
    while True:
        app_running = is_note_app_running()
        
        if app_running:
            if sync_process is None or sync_process.poll() is not None:
                if sync_process and sync_process.poll() is not None:
                    print("[Monitor] Sync script stopped unexpectedly. Restarting...")
                else:
                    print("[Monitor] Scrble Ink detected! Starting sync script...")

                # ✅ Verify paths
                if not os.path.exists(PYTHON_PATH):
                    print(f"[ERROR] Python not found: {PYTHON_PATH}")
                    break
                if not os.path.exists(SYNC_SCRIPT):
                    print(f"[ERROR] Sync script not found: {SYNC_SCRIPT}")
                    break

                # Launch sync script
                command = [PYTHON_PATH, SYNC_SCRIPT]
                print(f"[DEBUG] Launching: {' '.join(command)}")

                try:
                    sync_process = subprocess.Popen(
                        command,
                        shell=False,
                        cwd=os.path.dirname(SYNC_SCRIPT),
                        stdout=subprocess.PIPE,
                        stderr=subprocess.PIPE,
                        creationflags=subprocess.CREATE_NO_WINDOW if sys.platform == "win32" else 0
                    )
                    # Check for immediate errors (non-blocking peek)
                    time.sleep(0.5)  # Brief wait to capture startup errors
                    if sync_process.poll() is not None:
                        err_output = sync_process.stderr.read().decode().strip()
                        if err_output:
                            print(f"[SUBPROCESS ERROR] {err_output}")
                        sync_process = None
                except Exception as e:
                    print(f"[ERROR] Failed to start sync script: {e}")
                    sync_process = None
        else:
            if sync_process and sync_process.poll() is None:
                print("[Monitor] Scrble Ink closed. Stopping sync script...")
                sync_process.terminate()
                sync_process.wait()  # Ensure termination
                sync_process = None

        time.sleep(5)

except KeyboardInterrupt:
    if sync_process and sync_process.poll() is None:
        sync_process.terminate()
        sync_process.wait()