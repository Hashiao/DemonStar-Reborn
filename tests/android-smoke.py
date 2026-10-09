"""Test an installed release APK on an existing AVD/device; never creates an AVD."""
import argparse, hashlib, json, pathlib, re, subprocess, time, xml.etree.ElementTree as ET
p=argparse.ArgumentParser();p.add_argument('--adb',required=True);p.add_argument('--serial',required=True);args=p.parse_args()
adb=[args.adb,'-s',args.serial];out=pathlib.Path('artifacts');out.mkdir(exist_ok=True)
def run(*a):return subprocess.check_output(adb+list(a),timeout=30).decode('utf-8',errors='replace').strip()
def capture(name):
    data=subprocess.check_output(adb+['exec-out','screencap','-p'],timeout=20);(out/name).write_bytes(data);return hashlib.sha256(data).hexdigest()
def ui():
    try:run('shell','uiautomator','dump','/sdcard/demonstar-test.xml')
    except subprocess.CalledProcessError as e:
        if e.returncode==137:return []
        raise
    raw=run('shell','cat','/sdcard/demonstar-test.xml');return list(ET.fromstring(raw).iter('node'))
def node(identifier):
    for attempt in range(7):
        for n in ui():
            if n.get('resource-id')==identifier:return n
        time.sleep(.5)
    raise AssertionError('UI element missing: '+identifier)
def tap(identifier):
    n=node(identifier);x1,y1,x2,y2=map(int,re.findall(r'\d+',n.get('bounds')));run('shell','input','tap',str((x1+x2)//2),str((y1+y2)//2));time.sleep(.6)
run('shell','am','force-stop','io.github.hashiao.demonstar')
run('shell','am','start','-n','io.github.hashiao.demonstar/.MainActivity');time.sleep(2)
assert '开始游戏' in node('start').get('text','')
capture('android-menu.png');tap('start');time.sleep(2)
assert '关卡' in node('stage-label').get('text','')
first=capture('android-game-before.png');time.sleep(.7);second=capture('android-game.png');assert first!=second,'Game rendering did not advance'
run('shell','input','swipe','450','1650','740','1420','350');capture('android-drag.png')
tap('bomb');capture('android-after-bomb.png');bomb_node=node('bomb');assert '剩余 2 枚' in (bomb_node.get('text','')+bomb_node.get('content-desc',''))
tap('pause');assert node('dialog-title').get('text')=='暂时停靠'
# Native system back invokes the Android 33+ callback and resumes the paused game.
run('shell','input','keyevent','4');time.sleep(.7);assert node('pause') is not None;assert not any(n.get('resource-id')=='dialog-title' for n in ui())
run('shell','input','keyevent','3');time.sleep(.5);run('shell','am','start','-n','io.github.hashiao.demonstar/.MainActivity');time.sleep(.7)
assert node('dialog-title').get('text')=='暂时停靠';capture('android-background-paused.png')
pid=run('shell','pidof','io.github.hashiao.demonstar');assert pid
logs=run('logcat','-d','--pid='+pid,'-t','200');(out/'android-app.log').write_text(logs,encoding='utf-8')
assert 'FATAL EXCEPTION' not in logs
report={'status':'passed','serial':args.serial,'api':run('shell','getprop','ro.build.version.sdk'),'android':run('shell','getprop','ro.build.version.release'),'minimum_target':29,'minimum_version_tested':False,'checks':['release-install-launch','Chinese-menu','render-loop','drag-input-dispatched','bomb-consumption','pause','native-back','background-pause','no-fatal-exception'],'notes':['Drag visual result saved for review; exact position is not read through a private bridge.','AVD reused in read-only mode; host GPU used to avoid software-renderer freeze.']}
(out/'android-verification.json').write_text(json.dumps(report,indent=2),encoding='utf-8');print(json.dumps(report))
