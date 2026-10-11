"""现有 iPhone/iPad 上的 XCTest 系统长按。 / XCTest long presses on existing iPhone/iPad simulators."""
import json, pathlib, subprocess
root=pathlib.Path(__file__).resolve().parents[1];out=root/'artifacts'
def run(args):return subprocess.check_output(args,cwd=root,text=True,timeout=90).strip()
available=json.loads(run(['xcrun','simctl','list','devices','available','-j']))['devices']
standard=json.loads((out/'ios-verification.json').read_text());reports=[]
tested_ids=[next(d['udid'] for d in available[t['runtime']] if d['name']==t['name']) for t in standard['devices']]
for tested in standard['devices']:
 device=next(d for d in available[tested['runtime']] if d['name']==tested['name']);uid=device['udid'];family=tested['family']
 # 逐台隔离模拟器/测试宿主状态以排查 iPad Runner 启动卡住；不重试断言。
 # Isolate each simulator/test-host state when diagnosing iPad Runner stalls; never retry assertions.
 live=json.loads(run(['xcrun','simctl','list','devices','available','-j']))['devices']
 for devices in live.values():
  for other in devices:
   if other['udid'] in tested_ids and other.get('state')!='Shutdown':run(['xcrun','simctl','shutdown',other['udid']])
 run(['xcrun','simctl','boot',uid])
 run(['xcrun','simctl','bootstatus',uid,'-b'])
 print('System long-press UI checks: '+family,flush=True)
 with (root/f'.local/ios-touch-{family}-build.log').open('w') as log:
  subprocess.run(['xcodebuild','-project','ios/DemonStar.xcodeproj','-scheme','DemonStarTouchTests','-configuration','Release','-destination','id='+uid,'-derivedDataPath','.local/ios-simulator','-parallel-testing-enabled','NO','-resultBundlePath',str(out/f'ios-touch-{family}.xcresult'),'CODE_SIGNING_ALLOWED=NO','test'],cwd=root,stdout=log,stderr=subprocess.STDOUT,check=True,timeout=600)
 container=pathlib.Path(run(['xcrun','simctl','get_app_container',uid,'io.github.hashiao.demonstar','data']))
 for count in [1,2]:
  data=json.loads((container/f'Documents/touch-probe-{count}.json').read_text())
  assert data['selected'] is False and data['guard']=='none' and len(data['players'])==count,data
  for index in range(count):
   suffix='-2' if index else ''
   assert all(data['holds'].get(key+suffix,0)>=1.3 for key in ['fire','bomb','joystick']),data
   assert data['players'][index]['shots']>8 and data['players'][index]['bombs']==2,data
   assert data['players'][index]['fireMode']=='toggle' and data['players'][index]['touch']=='floating' and data['players'][index]['latched'] is False,data
  reports.append({'family':family,'runtime':tested['runtime'],'players':count,'probe':data})
 # LAN 在所有单设备检查完成后才启动双机，避免后台 Runner 累积。
 # Start the LAN pair only after single-device checks, avoiding accumulated background runners.
 run(['xcrun','simctl','shutdown',uid])
result={'status':'passed','input':'XCTest system 1.6-second presses, floating-stick drag and fire re-tap; not DOM event injection','devices':reports,'physical_device_tested':False}
(out/'ios-touch-verification.json').write_text(json.dumps(result,indent=2));print(json.dumps(result))
