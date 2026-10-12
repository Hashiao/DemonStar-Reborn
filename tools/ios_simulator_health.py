"""受限的 CI 模拟器控制服务恢复。 / Bounded CI simulator control-service recovery."""
import getpass
import json
import os
import pathlib
import platform
import subprocess
import time


def recover_service(root, reason):
    # 仅在专用 GitHub macOS 执行器重启当前用户服务，不改设备、运行时或应用断言。
    # Restart only this user's service on the dedicated GitHub macOS runner; preserve devices, runtimes and app assertions.
    # Service name reference: https://developer.apple.com/forums/thread/13718 (Apple Developer Tools Engineer).
    if os.environ.get('GITHUB_ACTIONS') != 'true' or platform.system() != 'Darwin':
        raise RuntimeError('Automatic simulator service recovery is restricted to GitHub macOS CI.')
    path = pathlib.Path(root) / 'artifacts/ios-simulator-recovery.json'
    history = json.loads(path.read_text()) if path.exists() else []
    if len(history) >= 3:
        raise RuntimeError('Simulator control service exceeded the three-recovery workflow limit.')
    stopped = subprocess.run(['/usr/bin/killall', '-9', '-u', getpass.getuser(), 'com.apple.CoreSimulator.CoreSimulatorService'], capture_output=True, text=True, timeout=15)
    if stopped.returncode not in (0, 1):
        raise RuntimeError('Unable to reset the CI simulator control service.')
    event = {'reason': reason, 'action': 'restart current-user CoreSimulatorService', 'kill_returncode': stopped.returncode}
    history.append(event)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(history, indent=2))
    print(json.dumps(event), flush=True)
    time.sleep(2)


def available_devices(root):
    command = ['xcrun', 'simctl', 'list', 'devices', 'available', '-j']
    try:
        text = subprocess.check_output(command, text=True, timeout=45)
    except subprocess.TimeoutExpired:
        recover_service(root, 'simctl list timed out')
        # 恢复后必须真的得到设备清单；再次失败直接终止，不循环掩盖失败。
        # Recovery must produce an actual device list; a second failure terminates instead of looping.
        text = subprocess.check_output(command, text=True, timeout=90)
    return json.loads(text)['devices']
