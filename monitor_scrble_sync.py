import subprocess
import psutil
import time
import os
import sys

# ─── Paths ─────────────────────────────────────────────────────────
SYNC_SCRIPT = r"C:\Users\lone\Documents\fantastic-fiesta\git_auto_sync.py"
PYTHON_PATH = r"C:\Users\lone\AppData\Local\Programs\Python\Python313\python.exe"

NOTE_APP_NAME = "Scrble Ink"
NOTE_APP_KEYWORD = "scrble"

sync_process = None


def is_note_app_running():
    """
    Return True if the Scrble Ink app seems to be running.
    Checks for the UWP app by looking for ApplicationFrameHost with the app package name,
    or for any process containing 'scrble' in its command line.
    """
    for proc in psutil.process_iter(["name", "cmdline"]):
        try:
            name = proc.info.get("name") or ""
            cmdline = proc.info.get("cmdline")
            cmd = " ".join(cmdline) if isinstance(cmdline, list) else ""
        except (psutil.NoSuchProcess, psutil.AccessDenied):
            continue

        # Check for ApplicationFrameHost (UWP host) with scrble/inknotespro in command line
        if name.lower() == "applicationframehost.exe" and ("scrble" in cmd.lower() or "inknotespro" in cmd.lower()):
            return True
        # Also check for direct process names containing 'scrble'
        if NOTE_APP_KEYWORD in name.lower():
            return True
        if NOTE_APP_KEYWORD in cmd.lower():
            return True
    return False


def main():
    global sync_process

    print("[Monitor] Waiting for Scrble Ink to launch...")
    print(f"[DEBUG] Python path: {PYTHON_PATH}")
    print(f"[DEBUG] Sync script: {SYNC_SCRIPT}")

    # Verify paths on startup
    if not os.path.exists(PYTHON_PATH):
        print(f"[ERROR] Python not found at: {PYTHON_PATH}")
        print("[ERROR] Please check the PYTHON_PATH in the script")
        return
    if not os.path.exists(SYNC_SCRIPT):
        print(f"[ERROR] Sync script not found at: {SYNC_SCRIPT}")
        print("[ERROR] Please check the SYNC_SCRIPT in the script")
        return

    while True:
        app_running = is_note_app_running()

        if app_running:
            # Start sync script if not running
            if sync_process is None or sync_process.poll() is not None:
                if sync_process is not None and sync_process.poll() is not None:
                    print("[Monitor] Sync script stopped. Restarting...")
                else:
                    print("[Monitor] Scrble Ink detected. Starting sync script...")

                command = [PYTHON_PATH, SYNC_SCRIPT]
                print("[DEBUG] Launching:", " ".join(command))

                try:
                    creationflags = 0
                    if sys.platform == "win32" and hasattr(subprocess, "CREATE_NO_WINDOW"):
                        creationflags = 0

                    sync_process = subprocess.Popen(
                        command,
                        shell=False,
                        cwd=os.path.dirname(SYNC_SCRIPT),
                        creationflags=creationflags,
                    )
                except Exception as e:
                    print("[ERROR] Failed to start sync script:", e)
                    sync_process = None

        else:
            # Scrble Ink closed -> stop sync script if still running
            if sync_process is not None and sync_process.poll() is None:
                print("[Monitor] Scrble Ink closed. Stopping sync script...")
                try:
                    sync_process.terminate()
                    sync_process.wait(timeout=10)
                except Exception:
                    try:
                        sync_process.kill()
                    except Exception:
                        pass
                sync_process = None

        time.sleep(5)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        if sync_process is not None and sync_process.poll() is None:
            sync_process.terminate()
            sync_process.wait()
