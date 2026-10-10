"""两台既有 iOS 模拟器的原生联机 / Native LAN on two existing iOS simulators."""
import json, pathlib, subprocess, time

ROOT = pathlib.Path(__file__).resolve().parents[1]
OUT = ROOT / 'artifacts'
PACKAGE = 'io.github.hashiao.demonstar'


def run(*args):
    return subprocess.check_output(['xcrun', 'simctl', *args], text=True, timeout=180).strip()


def wait_report(path, statuses, timeout=150):
    deadline = time.monotonic() + timeout
    while time.monotonic() < deadline:
        if path.exists():
            value = json.loads(path.read_text())
            if value.get('status') == 'error':
                raise RuntimeError(json.dumps(value))
            if value.get('status') in statuses:
                return value
        time.sleep(0.5)
    raise RuntimeError('LAN probe timed out: ' + str(path) + '; last=' + (path.read_text() if path.exists() else 'missing'))


def main():
    smoke = json.loads((OUT / 'ios-verification.json').read_text())
    available = json.loads(run('list', 'devices', 'available', '-j'))['devices']
    devices = [next(d for d in available[entry['runtime']] if d['name'] == entry['name']) for entry in smoke['devices']]
    assert len(devices) == 2
    containers, probes = [], []
    script = (ROOT / 'tools/ios-lan-probe.js').read_text()
    try:
        for device in devices:
            uid = device['udid']
            print('LAN: boot existing simulator '+device['name'],flush=True)
            if device['state'] != 'Booted':
                run('boot', uid)
            run('bootstatus', uid, '-b')
            folder = pathlib.Path(run('get_app_container', uid, PACKAGE, 'data')) / 'Documents'
            folder.mkdir(exist_ok=True)
            containers.append(folder)
            result = folder / 'lan-probe.json'
            result.unlink(missing_ok=True)
            probes.append(result)
        def launch(index, config):
            (containers[index] / 'lan-probe.js').write_text('window.lanProbeConfig=' + json.dumps(config) + ';\n' + script)
            # 常规验收已退出 App；避免把启动与终止合在一个容易卡住的冷启动命令中。
            # The standard probe already terminated the app; avoid a combined cold terminate/launch command.
            try:
                run('launch', devices[index]['udid'], PACKAGE, '--lan-probe')
            except subprocess.TimeoutExpired:
                # 新报告证明 App 已经运行时继续观察，不因命令响应超时重启测试。
                # A fresh report proves the app is running; keep observing instead of restarting on response timeout.
                if not probes[index].exists():
                    raise
                print('Launch response timed out, but a fresh app probe exists; continuing observation.',flush=True)
        launch(0, {'role': 'host'})
        print('LAN: waiting for native host lobby',flush=True)
        lobby = wait_report(probes[0], ['lobby'])
        launch(1, {'role': 'client', 'code': lobby['code']})
        print('LAN: waiting for two-player actions, reconnect and stage pause',flush=True)
        results = [wait_report(probe, ['passed']) for probe in probes]
        for index, result in enumerate(results):
            assert result['players'] == 2 and result['localSlot'] == index + 1, result
            assert result['platforms'] == ['ios', 'ios'], result
            assert result['actions']['shots'] >= 4 and result['actions']['bombs'] == 2 and result['actions']['moved'], result
            assert result['startupBGM'] and result['reconnected'], result
            assert result['stage'] == 2 and result['score'] == 12345 and result['rear'] == 4, result
        assert results[0]['pausedFrame'] == results[1]['pausedFrame'], results
        assert results[0]['finalFrame'] == results[1]['finalFrame'], results
        report = {'status': 'passed', 'devices': [{'name': d['name'], 'udid': d['udid']} for d in devices], 'probes': results,
                  'scope': 'Two native iOS simulator apps using Network.framework TCP over loopback. Physical hotspot, LAN permission prompts and Android-iOS hardware interoperability are not certified.'}
        (OUT / 'ios-lan-verification.json').write_text(json.dumps(report, indent=2))
        print(json.dumps(report))
    finally:
        for index, device in enumerate(devices):
            if index < len(probes) and probes[index].exists():
                (OUT / ('ios-lan-' + str(index + 1) + '.json')).write_text(probes[index].read_text())
            subprocess.run(['xcrun', 'simctl', 'shutdown', device['udid']], timeout=60, check=False)


if __name__ == '__main__':
    main()
