"""现有 iPhone/iPad 上的 XCTest 系统长按。 / XCTest long presses on existing iPhone/iPad simulators."""
import json, pathlib, subprocess
root=pathlib.Path(__file__).resolve().parents[1];out=root/'artifacts'
def run(args):return subprocess.check_output(args,cwd=root,text=True,timeout=90).strip()
available=json.loads(run(['xcrun','simctl','list','devices','available','-j']))['devices']
standard=json.loads((out/'ios-verification.json').read_text());reports=[]
for tested in standard['devices']:
 device=next(d for d in available[tested['runtime']] if d['name']==tested['name']);uid=device['udid'];family=tested['family']
 if device.get('state')!='Booted':run(['xcrun','simctl','boot',uid])
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
  reports.append({'family':family,'runtime':tested['runtime'],'players':count,'probe':data})
result={'status':'passed','input':'XCTest system press(forDuration: 1.6), not DOM event injection','devices':reports,'physical_device_tested':False}
(out/'ios-touch-verification.json').write_text(json.dumps(result,indent=2));print(json.dumps(result))
