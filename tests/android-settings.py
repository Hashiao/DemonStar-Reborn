"""通过原生 UI 验证分类与暂停操作。 / Verify categories and pause actions through native UI."""
import argparse,hashlib,json,pathlib,re,subprocess,time,xml.etree.ElementTree as ET
p=argparse.ArgumentParser();p.add_argument('--adb',required=True);p.add_argument('--serial',required=True);a=p.parse_args()
adb=[a.adb,'-s',a.serial];out=pathlib.Path('artifacts')
def run(*args):return subprocess.check_output(adb+list(args),timeout=40).decode('utf-8',errors='replace').strip()
def nodes():
 try:run('shell','uiautomator','dump','/sdcard/demonstar-settings.xml')
 except subprocess.CalledProcessError as e:
  if e.returncode!=137:raise
  if b'dumped to:' not in (e.output or b''):return []
 return list(ET.fromstring(run('shell','cat','/sdcard/demonstar-settings.xml')).iter('node'))
def label(n):return n.get('content-desc') or n.get('text','')
def node(id=None,text=None):
 for _ in range(7):
  for n in nodes():
   if id and n.get('resource-id')==id or text and label(n)==text:return n
  time.sleep(.3)
 raise AssertionError('Missing control: '+str(id or text))
def tap(id=None,text=None):
 n=node(id,text);x,y,r,b=map(int,re.findall(r'\d+',n.get('bounds')));assert r>x and b>y
 run('shell','input','tap',str((x+r)//2),str((y+b)//2));time.sleep(.3)
def back():run('shell','input','keyevent','4');time.sleep(.3)
run('shell','am','force-stop','io.github.hashiao.demonstar');run('shell','am','start','-n','io.github.hashiao.demonstar/.MainActivity');time.sleep(1)
tap('settings');assert all(node(id) is not None for id in ['settings-audio','control-settings','settings-display','settings-rules','settings-language'])
assert not any(n.get('resource-id') in ['save-settings','lan-room'] for n in nodes())
tap('settings-audio')
for id in ['music-toggle','sfx-toggle','haptic-toggle']:
 old=label(node(id));tap(id);assert label(node(id))!=old;tap(id);assert label(node(id))==old
assert node('sfx-volume') is not None and node('music-volume') is not None
back();tap('settings-display');assert '关闭' in label(node('health-toggle'));assert '开启' in label(node('boss-health-toggle'))
for id in ['health-toggle','boss-health-toggle']:
 old=label(node(id));tap(id);assert label(node(id))!=old;tap(id);assert label(node(id))==old
back();tap('settings-rules');assert '关闭' in label(node('retain-levels'));tap('retain-levels');back();back()
tap('start');tap('new-run');tap('setup-start');time.sleep(3);tap('pause');tap('pause-difficulty');tap('paused-difficulty');tap(text='疯狂');tap('apply-difficulty');assert '疯狂' in label(node('pause-difficulty-label'))
tap('pause-settings');tap('settings-rules');assert node('retain-levels').get('enabled')=='false';assert '开启' in label(node('retain-levels'));back();back();assert node('pause-difficulty') is not None
tap('pause-save')
# 存档按钮由 data 属性生成，通过可见文本选择首个手动槽位。
# Save buttons have data attributes; choose the first manual slot by its visible label.
tap(text='保存关卡');back();tap('pause-load');tap(text='读取');time.sleep(3);tap('pause');assert '一般' in label(node('pause-difficulty-label'))
(out/'m212-android-settings.png').write_bytes(subprocess.check_output(adb+['exec-out','screencap','-p'],timeout=20))
report={'status':'passed','checks':['five-native-settings-categories','native-settings-independent-health-toggles','native-default-boss-only','native-settings-BGM-toggle','independent-volume-controls','native-rule-selected-and-locked','native-paused-difficulty-change','native-pause-save-load-restores-entry-difficulty','native-nested-back-keeps-pause'],'api':run('shell','getprop','ro.build.version.sdk'),'source_commit':subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip(),'apk_sha256':hashlib.sha256((out/'DemonStar-Reborn-release.apk').read_bytes()).hexdigest()}
(out/'m212-android-settings.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8');print(json.dumps(report))
