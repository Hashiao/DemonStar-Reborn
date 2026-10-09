"""Build and run using an already installed Apple simulator; never download runtimes."""
import json, os, pathlib, plistlib, re, subprocess, time
root=pathlib.Path(__file__).resolve().parents[1]
out=root/'artifacts';out.mkdir(exist_ok=True)
def run(args): return subprocess.check_output(args,cwd=root,text=True,timeout=600).strip()
device_app=root/'.local/ios-device/Build/Products/Release-iphoneos/DemonStar.app'
info=plistlib.loads((device_app/'Info.plist').read_bytes())
assert info['MinimumOSVersion']=='12.0',info['MinimumOSVersion']
assert info['CFBundleSupportedPlatforms']==['iPhoneOS']
commands=run(['xcrun','otool','-l',str(device_app/'DemonStar')])
assert re.search(r'\bminos 12\.0\b',commands) or re.search(r'\bversion 12\.0\b',commands)
report={'minimum_os':'12.0','device_build':'passed','signed':False,'physical_device_tested':False,'devices':[]}
base=['xcodebuild','-project','ios/DemonStar.xcodeproj','-scheme','DemonStar','-configuration','Release','-sdk','iphonesimulator','-destination','generic/platform=iOS Simulator','-derivedDataPath','.local/ios-simulator','CODE_SIGNING_ALLOWED=NO','build']
with (root/'.local/simulator-build.log').open('w') as log: subprocess.run(base,cwd=root,stdout=log,stderr=subprocess.STDOUT,check=True,timeout=900)
available=json.loads(run(['xcrun','simctl','list','devices','available','-j']))['devices']
sdk=tuple(map(int,run(['xcrun','--sdk','iphonesimulator','--show-sdk-version']).split('.')[:2]))
options=[(runtime,d) for runtime,devices in available.items() if 'iOS' in runtime and tuple(map(int,re.findall(r'\d+',runtime)))[:2]<=sdk for d in devices if d.get('isAvailable')]
for family in ('iPhone','iPad'):
    choices=[p for p in options if family in p[1]['name']]
    if not choices: raise RuntimeError('No existing '+family+' simulator')
    runtime,device=max(choices,key=lambda p:tuple(map(int,re.findall(r'\d+',p[0]))))
    uid=device['udid']
    if device.get('state')!='Booted':run(['xcrun','simctl','boot',uid])
    run(['xcrun','simctl','bootstatus',uid,'-b'])
    run(['xcrun','simctl','install',uid,str(root/'.local/ios-simulator/Build/Products/Release-iphonesimulator/DemonStar.app')])
    run(['xcrun','simctl','launch',uid,'io.github.hashiao.demonstar','--smoke-test'])
    container=pathlib.Path(run(['xcrun','simctl','get_app_container',uid,'io.github.hashiao.demonstar','data']))
    result=container/'Documents/smoke.json'
    for _ in range(40):
        if result.exists():break
        time.sleep(1)
    if not result.exists():raise RuntimeError('WKWebView did not complete functional probe')
    probe=json.loads(result.read_text());assert probe.get('phase')=='playing',probe;assert probe.get('assetsReady'),probe;assert probe.get('score',0)>=0,probe
    assert probe.get('shotsFired',0)>=2 and probe.get('playerX',0)>200,probe
    assert probe.get('bombs')==2 and probe.get('lives')==4 and probe.get('energy')==16,probe
    assert probe.get('releaseStops'),probe
    assert probe.get('motionReady') and probe.get('carriersReady') and probe.get('soundbankReady') and probe.get('bankAfterRelease')==8,probe
    run(['xcrun','simctl','io',uid,'screenshot',str(out/(family+'.png'))])
    report['devices'].append({'family':family,'name':device['name'],'runtime':runtime,'wkwebview_probe':probe,'status':'passed'})
    run(['xcrun','simctl','shutdown',uid])
(out/'ios-verification.json').write_text(json.dumps(report,indent=2))
print(json.dumps(report,indent=2))
