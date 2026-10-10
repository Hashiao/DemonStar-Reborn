"""Build and run using an already installed Apple simulator; never download runtimes."""
import json, os, pathlib, plistlib, re, subprocess, time
root=pathlib.Path(__file__).resolve().parents[1]
out=root/'artifacts';out.mkdir(exist_ok=True)
def run(args): return subprocess.check_output(args,cwd=root,text=True,timeout=600).strip()

def install_clean(uid):
    # 冷启动的 CoreSimulator 偶有卸载超时；只对超时重启同一模拟器并重试一次。
    # A cold CoreSimulator can time out during uninstall; reboot this same device once on timeout only.
    for attempt in range(2):
        try:
            existing=subprocess.run(['xcrun','simctl','get_app_container',uid,'io.github.hashiao.demonstar','data'],capture_output=True,text=True,timeout=60)
            if existing.returncode==0:
                subprocess.run(['xcrun','simctl','terminate',uid,'io.github.hashiao.demonstar'],capture_output=True,timeout=60)
                subprocess.run(['xcrun','simctl','uninstall',uid,'io.github.hashiao.demonstar'],check=True,timeout=120)
            run(['xcrun','simctl','install',uid,str(root/'.local/ios-simulator/Build/Products/Release-iphonesimulator/DemonStar.app')])
            return
        except subprocess.TimeoutExpired:
            if attempt: raise
            print('Simulator install/reset timed out; rebooting the existing device once: '+uid,flush=True)
            run(['xcrun','simctl','shutdown',uid]);run(['xcrun','simctl','boot',uid]);run(['xcrun','simctl','bootstatus',uid,'-b'])
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
    locale_cases=[]
    cases=[('zh-Hans-CN','zh-Hans'),('zh-Hant-TW','zh-Hant'),('fr-FR','en')] if family=='iPhone' else [('zh-Hant-HK','zh-Hant')]
    for language,expected in cases:
        print(f'{family} {language}: reset/install existing simulator',flush=True)
        install_clean(uid)
        container=pathlib.Path(run(['xcrun','simctl','get_app_container',uid,'io.github.hashiao.demonstar','data']))
        result=container/'Documents/smoke.json'
        if result.exists():result.unlink()
        # Launch handles both a stopped app and an existing process in one operation.
        run(['xcrun','simctl','launch','--terminate-running-process',uid,'io.github.hashiao.demonstar','--smoke-test','-AppleLanguages','('+language+')'])
        for _ in range(120):
            if result.exists():break
            time.sleep(1)
        if not result.exists():raise RuntimeError('WKWebView did not complete functional probe')
        probe=json.loads(result.read_text())
        (out/(family+'-'+expected+'-probe.json')).write_text(json.dumps(probe,indent=2))
        run(['xcrun','simctl','io',uid,'screenshot',str(out/(family+'.png'))])
        assert probe.get('initialLocale')==expected,probe
        assert probe.get('healthBarDefaults')=={'regular':False,'boss':True} and probe.get('independentHealthBarSwitches'),probe
        assert probe.get('languagePreservesCombat') and all(c['passed'] for c in probe['languageChecks']) and len(probe['languageChecks'])==3,probe
        assert probe.get('launchSeen') and probe.get('presentationReady'),probe
        assert len(probe.get('campaignArt',{}).get('decoded',[]))==18 and probe['campaignArt']['prototypeRoutes']==251 and probe['campaignArt']['enemyTypes']==15,probe
        assert probe.get('weaponArtReady') and probe.get('weaponSizes')=={'homing':[4,8],'red':[1,3,5,9,11,13],'blue':[8,12,16]},probe
        assert probe.get('phase')=='playing',probe;assert probe.get('assetsReady'),probe;assert probe.get('score',0)>=0,probe
        assert probe.get('shotsFired',0)>=2 and probe.get('playerX',0)>200,probe
        assert probe.get('bombs')==2 and probe.get('lives')==4 and probe.get('energy')==16,probe
        assert probe.get('releaseStops'),probe
        assert probe.get('musicReady') and probe.get('musicTime',0)>0 and probe.get('musicTrack')=='MDS_PHASER' and not probe.get('musicError') and probe.get('effectsReady') and probe.get('attacksReady') and probe.get('enemyArtReady'),probe
        assert probe.get('motionReady') and probe.get('carriersReady') and probe.get('soundbankReady') and probe.get('bankAfterRelease')==8,probe
        run(['xcrun','simctl','io',uid,'screenshot',str(out/(family+'.png'))])
        locale_cases.append({'preferred':language,'expected':expected,'probe':probe,'status':'passed'})
    report['devices'].append({'family':family,'name':device['name'],'runtime':runtime,'wkwebview_probe':probe,'locale_cases':locale_cases,'status':'passed'})
    run(['xcrun','simctl','shutdown',uid])
(out/'ios-verification.json').write_text(json.dumps(report,indent=2))
print(json.dumps(report,indent=2))
