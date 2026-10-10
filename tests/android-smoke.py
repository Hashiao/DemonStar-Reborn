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
start=node('start');assert '单人游戏' in (start.get('content-desc') or start.get('text',''))
capture('android-menu.png');tap('start');time.sleep(2)
capture('android-launch.png');time.sleep(7)
assert '关卡' in node('stage-label').get('text','')
first=capture('android-game-before.png');time.sleep(.7);second=capture('android-game.png');assert first!=second,'Game rendering did not advance'
stick=node('joystick');x1,y1,x2,y2=map(int,re.findall(r'\d+',stick.get('bounds')))
# Park at the left edge, outside the opening straight-flying enemies' lanes.
# UIAutomator dumps take real time; a parked ship in a carrier lane can die
# immediately after resume and legitimately reset the bomb inventory.
x=str(int(x1+(x2-x1)*.05));y=str((y1+y2)//2)
run('shell','input','swipe',x,y,x,y,'1500');capture('android-stick.png')
fire=node('fire');x1,y1,x2,y2=map(int,re.findall(r'\d+',fire.get('bounds')));x=str((x1+x2)//2);y=str((y1+y2)//2)
run('shell','input','swipe',x,y,x,y,'900');capture('android-fire.png')
tap('bomb');capture('android-after-bomb.png');bomb_node=node('bomb');assert '剩余 2 枚' in (bomb_node.get('text','')+bomb_node.get('content-desc',''))
tap('pause');assert node('dialog-title').get('text')=='暂时停靠'
# Rotate the same Activity while paused; it must preserve the session and inventory.
rotation=run('shell','settings','get','system','user_rotation');auto=run('shell','settings','get','system','accelerometer_rotation')
try:
    run('shell','settings','put','system','accelerometer_rotation','0');run('shell','settings','put','system','user_rotation','1');time.sleep(1)
    assert node('dialog-title').get('text')=='暂时停靠'
    run('shell','input','keyevent','4');time.sleep(.5)
    assert '剩余 2 枚' in (node('bomb').get('text','')+node('bomb').get('content-desc',''))
    data=subprocess.check_output(adb+['exec-out','screencap','-p'],timeout=20);(out/'android-landscape.png').write_bytes(data)
    import struct
    width,height=struct.unpack('>II',data[16:24]);assert width>height,(width,height)
    tap('pause')
finally:
    run('shell','settings','put','system','user_rotation',rotation if rotation!='null' else '0')
    run('shell','settings','put','system','accelerometer_rotation',auto if auto!='null' else '1');time.sleep(1)
# Native system back invokes the Android 33+ callback and resumes the paused game.
run('shell','input','keyevent','4');time.sleep(.7);assert node('pause') is not None;assert not any(n.get('resource-id')=='dialog-title' for n in ui())
run('shell','input','keyevent','3');time.sleep(.5);run('shell','am','start','-n','io.github.hashiao.demonstar/.MainActivity');time.sleep(.7)
assert node('dialog-title').get('text')=='暂时停靠';capture('android-background-paused.png')
pid=run('shell','pidof','io.github.hashiao.demonstar');assert pid
logs=run('logcat','-d','--pid='+pid,'-t','200');(out/'android-app.log').write_text(logs,encoding='utf-8')
assert 'FATAL EXCEPTION' not in logs
report={'status':'passed','serial':args.serial,'api':run('shell','getprop','ro.build.version.sdk'),'android':run('shell','getprop','ro.build.version.release'),'minimum_target':29,'minimum_version_tested':False,'checks':['release-install-launch','Chinese-menu','render-loop','joystick-hold-dispatched','A-hold-dispatched','B-consumes-one','pause','landscape-native-rotation-preserves-inventory','native-back','background-pause','no-fatal-exception'],'notes':['Joystick and A visual results saved for review; exact position is not read through a private bridge. Browser regression separately verifies real simultaneous contacts.','Existing AVD reused; no SDK, AVD or system image was downloaded.']}
(out/'android-verification.json').write_text(json.dumps(report,indent=2),encoding='utf-8');print(json.dumps(report))
