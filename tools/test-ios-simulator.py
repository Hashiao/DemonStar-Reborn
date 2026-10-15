"""Build and run using an already installed Apple simulator; never download runtimes."""
import json, os, pathlib, plistlib, re, subprocess, time
from ios_simulator_health import available_devices, recover_service
root=pathlib.Path(__file__).resolve().parents[1]
out=root/'artifacts';out.mkdir(exist_ok=True)
# 对照当前资源清单逐项验收，新增图集不能沿用旧版固定数量。
# Verify the exact current manifest, so new atlases cannot inherit an obsolete fixed count.
expected_art_paths=sorted({asset for name in ['campaign-art','enemy-shots','boss-deaths'] for asset in json.loads((root/'web/js'/f'{name}.js').read_text(encoding='utf-8').split('=',1)[1].strip().rstrip(';'))['assets']})
def run(args,timeout=600): return subprocess.check_output(args,cwd=root,text=True,timeout=timeout).strip()

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
            # 新语言用例尚未启动；先恢复控制服务，再冷启同一设备，沿用全轮三次上限。
            # The new locale case has not started; recover the service before rebooting the same device, under the workflow-wide limit.
            recover_service(root, 'simulator reset/install timed out before probe launch')
            current=next(d for rows in available_devices(root).values() for d in rows if d['udid']==uid)
            if current['state']!='Shutdown':run(['xcrun','simctl','shutdown',uid])
            run(['xcrun','simctl','boot',uid]);run(['xcrun','simctl','bootstatus',uid,'-b'])
# 仅恢复无探针结果的系统启动超时；应用断言错误不得通过重试隐藏。
# Recover only a system launch timeout with no probe result; never retry away application assertion failures.
startup_recoveries=[]
def launch_probe(uid,language):
    for attempt in range(2):
        install_clean(uid)
        container=pathlib.Path(run(['xcrun','simctl','get_app_container',uid,'io.github.hashiao.demonstar','data']))
        result=container/'Documents/smoke.json'
        if result.exists():result.unlink()
        try:
            run(['xcrun','simctl','launch','--terminate-running-process',uid,'io.github.hashiao.demonstar','--smoke-test','-AppleLanguages','('+language+')'],timeout=120)
            return result
        except subprocess.TimeoutExpired:
            if attempt or result.exists():raise
            event={'device':uid,'language':language,'reason':'simctl launch timed out without a probe result','action':'reboot same simulator and reinstall once'}
            startup_recoveries.append(event)
            print(json.dumps(event),flush=True)
            recover_service(root, 'smoke launch timed out without a probe result')
            devices=available_devices(root)
            current=next(d for rows in devices.values() for d in rows if d['udid']==uid)
            if current['state']!='Booted':run(['xcrun','simctl','boot',uid],timeout=60)
            run(['xcrun','simctl','bootstatus',uid,'-b'],timeout=180)

device_app=root/'.local/ios-device/Build/Products/Release-iphoneos/DemonStar.app'
info=plistlib.loads((device_app/'Info.plist').read_bytes())
assert info['MinimumOSVersion']=='12.0',info['MinimumOSVersion']
assert info['CFBundleSupportedPlatforms']==['iPhoneOS']
commands=run(['xcrun','otool','-l',str(device_app/'DemonStar')])
assert re.search(r'\bminos 12\.0\b',commands) or re.search(r'\bversion 12\.0\b',commands)
report={'minimum_os':'12.0','device_build':'passed','signed':False,'physical_device_tested':False,'devices':[],'startup_recoveries':startup_recoveries}
base=['xcodebuild','-project','ios/DemonStar.xcodeproj','-scheme','DemonStar','-configuration','Release','-sdk','iphonesimulator','-destination','generic/platform=iOS Simulator','-derivedDataPath','.local/ios-simulator','CODE_SIGNING_ALLOWED=NO','build']
with (root/'.local/simulator-build.log').open('w') as log: subprocess.run(base,cwd=root,stdout=log,stderr=subprocess.STDOUT,check=True,timeout=900)
available=available_devices(root)
sdk=tuple(map(int,run(['xcrun','--sdk','iphonesimulator','--show-sdk-version']).split('.')[:2]))
options=[(runtime,d) for runtime,devices in available.items() if 'iOS' in runtime and tuple(map(int,re.findall(r'\d+',runtime)))[:2]<=sdk for d in devices if d.get('isAvailable')]
for family in ('iPhone','iPad'):
    choices=[p for p in options if family in p[1]['name']]
    if not choices: raise RuntimeError('No existing '+family+' simulator')
    # 恢复上次完整通过的既有设备选择，避免比较时同时变更机型。
    # Restore the last fully passing existing-device selection, avoiding a simultaneous model change.
    runtime,device=max(choices,key=lambda p:tuple(map(int,re.findall(r'\d+',p[0]))))
    uid=device['udid']
    if device.get('state')!='Booted':run(['xcrun','simctl','boot',uid])
    run(['xcrun','simctl','bootstatus',uid,'-b'])
    locale_cases=[]
    cases=[('zh-Hans-CN','zh-Hans'),('zh-Hant-TW','zh-Hant'),('fr-FR','en')] if family=='iPhone' else [('zh-Hant-HK','zh-Hant')]
    for language,expected in cases:
        print(f'{family} {language}: reset/install existing simulator',flush=True)
        result=launch_probe(uid,language)
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
        assert sorted(probe.get('campaignArt',{}).get('decoded',[]))==expected_art_paths and probe['campaignArt']['prototypeRoutes']==251 and probe['campaignArt']['enemyTypes']==15 and probe['campaignArt']['bossDeathRoutes']==9,probe
        assert 'assets/snake-deaths-hd.png' in probe['campaignArt']['decoded'],probe
        assert probe.get('weaponArtReady') and probe.get('weaponSizes')=={'homing':[4,8],'red':[1,3,5,9,11,13],'blue':[8,12,16]},probe
        assert probe.get('phase')=='playing',probe;assert probe.get('assetsReady'),probe;assert probe.get('score',0)>=0,probe
        assert probe.get('shotsFired',0)>=2 and probe.get('playerX',0)>200,probe
        assert probe.get('bombs')==2 and probe.get('lives')==4 and probe.get('energy')==16,probe
        assert probe.get('releaseStops'),probe
        assert all(probe.get('advancedControls',{}).get(k) for k in ['pointArrived','followReleaseStops','doubleTapBomb','motionRequestCompleted','floatingFallback']),probe
        assert probe.get('fireModeChecks')=={'toggleSurvivesRelease':True,'pausedSwitchToHoldStops':True,'switchBackToToggleStaysOff':True,'floatingDefault':True},probe
        assert probe.get('musicReady') and probe.get('musicTime',0)>0 and probe.get('musicTrack')=='MDS_PHASER' and not probe.get('musicError') and probe.get('effectsReady') and probe.get('attacksReady') and probe.get('enemyArtReady'),probe
        assert probe.get('musicBackend')=='ios-native' and probe['startupMusic']['backend']=='ios-native' and probe['startupMusic']['currentTime']>0 and not probe['startupMusic']['paused'],probe
        assert probe.get('nativeMusicChecks')=={'backend':'ios-native','pauseClockStable':True,'resumeClockAdvanced':True,'muteRespected':True,'volumeRespected':True,'zeroVolumeRespected':True},probe
        assert probe.get('iosAudio')=={'nativeAdapters':True,'releaseTail':True,'pausedSettingsSilent':True},probe
        assert probe.get('sharedAudio')=={'sharedScheduler':True,'shotsAccepted':20},probe
        assert probe.get('laserWarning')=={'harmless':True,'firstHit':True,'pauseDifficulty':True,'network':True,'players':2},probe
        assert probe.get('overflowShutters')=={'cases':96,'hostileDamagePreserved':True,'shutterFrames':[6,6,20],'network':True,'cadenceCases':12},probe
        assert probe.get('speedSettings')=={'defaultSpeed':'medium','independentSpeeds':True},probe
        muzzle=probe.get('muzzleWarning',{});assert muzzle.get('types')==2 and all(muzzle.get(k) is True for k in ['colorMatched','muzzleOnly','growingPulse','accelerating','emissionRestored']),probe
        assert probe.get('mobility')=={'difficulties':4,'speedCases':12,'defaultSpeed':'medium','tiers':{'slow':[72,74],'medium':[58,60],'fast':[48,50]},'horizontalTicks':48,'verticalTicks':50,'diagonalAxesRetainSpeed':True},probe
        assert probe.get('motionReady') and probe.get('carriersReady') and probe.get('soundbankReady') and probe.get('bankAfterRelease')==8,probe
        run(['xcrun','simctl','io',uid,'screenshot',str(out/(family+'.png'))])
        locale_cases.append({'preferred':language,'expected':expected,'probe':probe,'status':'passed'})
    report['devices'].append({'family':family,'name':device['name'],'runtime':runtime,'wkwebview_probe':probe,'locale_cases':locale_cases,'status':'passed'})
    # 退出 App 释放音频与 WebKit，保留已就绪的模拟器直接进行下一步 LAN。
    # Terminate the app to release audio/WebKit, keeping the warmed simulator ready for the following LAN step.
    run(['xcrun','simctl','terminate',uid,'io.github.hashiao.demonstar'])
(out/'ios-verification.json').write_text(json.dumps(report,indent=2))
print(json.dumps(report,indent=2))
