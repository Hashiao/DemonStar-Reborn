"""控制平面恢复边界，不重试应用断言。 / Control-plane recovery boundaries, never app-assertion retries."""
import ast
import json
import pathlib
import subprocess
import sys
import tempfile
import types
import unittest
from unittest.mock import patch

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / 'tools'))
import ios_simulator_health as health


class HealthTests(unittest.TestCase):
    def launch_namespace(self, folder, runner):
        source = pathlib.Path(__file__).resolve().parents[1] / 'tools/test-ios-simulator.py'
        function = next(n for n in ast.parse(source.read_text()).body if isinstance(n, ast.FunctionDef) and n.name == 'launch_probe')
        namespace = {'pathlib': pathlib, 'subprocess': subprocess, 'json': json, 'root': pathlib.Path(folder), 'startup_recoveries': [], 'run': runner, 'install_clean': unittest.mock.Mock(), 'recover_service': unittest.mock.Mock(), 'available_devices': lambda _: {'runtime': [{'udid': 'device', 'state': 'Shutdown'}]}}
        exec(compile(ast.Module(body=[function], type_ignores=[]), str(source), 'exec'), namespace)
        return namespace

    def test_missing_probe_launch_timeout_reinstalls_once(self):
        with tempfile.TemporaryDirectory() as folder:
            launches = []
            def run(command, timeout=600):
                if command[2] == 'get_app_container':
                    return folder
                if command[2] == 'launch':
                    launches.append(command)
                    if len(launches) == 1:
                        raise subprocess.TimeoutExpired(command, timeout)
                return 'ok'
            ns = self.launch_namespace(folder, run)
            self.assertEqual(ns['launch_probe']('device', 'en'), pathlib.Path(folder) / 'Documents/smoke.json')
            self.assertEqual(len(launches), 2)
            self.assertEqual(ns['install_clean'].call_count, 2)
            ns['recover_service'].assert_called_once()

    def test_launch_with_application_result_never_retries(self):
        with tempfile.TemporaryDirectory() as folder:
            result = pathlib.Path(folder) / 'Documents/smoke.json'
            result.parent.mkdir()
            def run(command, timeout=600):
                if command[2] == 'get_app_container':
                    return folder
                if command[2] == 'launch':
                    result.write_text('{"error":"application assertion failed"}')
                    raise subprocess.TimeoutExpired(command, timeout)
            ns = self.launch_namespace(folder, run)
            with self.assertRaises(subprocess.TimeoutExpired):
                ns['launch_probe']('device', 'en')
            ns['recover_service'].assert_not_called()
            self.assertIn('application assertion failed', result.read_text())

    def test_launch_non_timeout_is_not_retried(self):
        with tempfile.TemporaryDirectory() as folder:
            def run(command, timeout=600):
                if command[2] == 'get_app_container':
                    return folder
                raise subprocess.CalledProcessError(1, command)
            ns = self.launch_namespace(folder, run)
            with self.assertRaises(subprocess.CalledProcessError):
                ns['launch_probe']('device', 'en')
            ns['recover_service'].assert_not_called()

    def test_healthy_control_plane_never_restarts(self):
        with patch.object(health.subprocess, 'check_output', return_value='{"devices":{"runtime":[]}}'), patch.object(health, 'recover_service') as reset:
            self.assertEqual(health.available_devices('.'), {'runtime': []})
            reset.assert_not_called()

    def test_transport_timeout_gets_one_retry(self):
        with patch.object(health.subprocess, 'check_output', side_effect=[subprocess.TimeoutExpired('simctl', 45), '{"devices":{}}']) as call, patch.object(health, 'recover_service') as reset:
            self.assertEqual(health.available_devices('.'), {})
            self.assertEqual(call.call_count, 2)
            reset.assert_called_once()

    def test_second_timeout_is_not_reported_passed(self):
        with patch.object(health.subprocess, 'check_output', side_effect=subprocess.TimeoutExpired('simctl', 45)), patch.object(health, 'recover_service') as reset:
            with self.assertRaises(subprocess.TimeoutExpired):
                health.available_devices('.')
            reset.assert_called_once()

    def test_other_errors_are_not_retried(self):
        for error in [subprocess.CalledProcessError(1, 'simctl'), ValueError('invalid response')]:
            with patch.object(health.subprocess, 'check_output', side_effect=error), patch.object(health, 'recover_service') as reset:
                with self.assertRaises(type(error)):
                    health.available_devices('.')
                reset.assert_not_called()

    def test_local_machine_is_not_automatically_reset(self):
        with patch.dict(health.os.environ, {'GITHUB_ACTIONS': 'false'}), patch.object(health.subprocess, 'run') as call:
            with self.assertRaises(RuntimeError):
                health.recover_service('.', 'test')
            call.assert_not_called()

    def test_ci_reset_is_user_scoped_and_bounded(self):
        with tempfile.TemporaryDirectory() as folder, patch.dict(health.os.environ, {'GITHUB_ACTIONS': 'true'}), patch.object(health.platform, 'system', return_value='Darwin'), patch.object(health.getpass, 'getuser', return_value='runner'), patch.object(health.time, 'sleep'), patch.object(health.subprocess, 'run', return_value=types.SimpleNamespace(returncode=0)) as call:
            for _ in range(3):
                health.recover_service(folder, 'startup timeout')
            with self.assertRaises(RuntimeError):
                health.recover_service(folder, 'fourth timeout')
            self.assertEqual(call.call_count, 3)
            self.assertEqual(call.call_args.args[0], ['/usr/bin/killall', '-9', '-u', 'runner', 'com.apple.CoreSimulator.CoreSimulatorService'])
            self.assertEqual(len(json.loads((pathlib.Path(folder) / 'artifacts/ios-simulator-recovery.json').read_text())), 3)


if __name__ == '__main__':
    unittest.main()
