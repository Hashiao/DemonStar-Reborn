"""仅限现有模拟器语言验收。 / Locale verification on an existing emulator only."""
import argparse,json,pathlib,re,subprocess,time,xml.etree.ElementTree as ET
p=argparse.ArgumentParser();p.add_argument('--adb',required=True);p.add_argument('--serial',required=True);args=p.parse_args()
assert args.serial.startswith('emulator-'),'Emulator required / 仅允许模拟器'
adb=[args.adb,'-s',args.serial];package='io.github.hashiao.demonstar';out=pathlib.Path('artifacts')
def run(*a):return subprocess.check_output(adb+list(a),timeout=40).decode('utf-8',errors='replace').strip()
def nodes():
 try:run('shell','uiautomator','dump','/sdcard/demonstar-locale-test.xml')
 except subprocess.CalledProcessError as error:
  if error.returncode!=137:raise
  # 仅在已确认输出完成时读取本次文件，否则交给查找循环重试。
  # Read only a confirmed completed dump; otherwise let the bounded lookup retry.
  if b'dumped to:' not in (error.output or b''):return []
 return list(ET.fromstring(run('shell','cat','/sdcard/demonstar-locale-test.xml')).iter('node'))

# 显式 aria-label 在 WebView 中可映射到 content-desc，而非可见 text。
# WebView can expose explicit aria-label through content-desc rather than visible text.
def label(node):return node.get('content-desc') or node.get('text','')
def find(identifier=None,text=None):
 for _ in range(5):
  for n in nodes():
   if (identifier and n.get('resource-id')==identifier) or (text and label(n)==text):return n
  time.sleep(.3)
 raise AssertionError('Missing localized control: '+str(identifier or text))
def tap(identifier=None,text=None):
 n=find(identifier,text);x,y,r,b=map(int,re.findall(r'\d+',n.get('bounds')));run('shell','input','tap',str((x+r)//2),str((y+b)//2));time.sleep(.3)
def launch():run('shell','am','start','-n',package+'/.MainActivity');time.sleep(1.2)
cases=[]
for native,expected in [('zh-CN','设置'),('zh-TW','設定'),('zh-HK','設定'),('fr-FR','Settings')]:
 # 只重置本 App；调用者复用只读 AVD。 / Reset only this app on the caller's read-only AVD.
 run('shell','am','force-stop',package);run('shell','pm','clear',package)
 run('shell','cmd','locale','set-app-locales',package,'--user','0','--locales',native);launch()
 actual=label(find('settings'));assert actual==expected,(native,actual)
 (out/('android-locale-'+native+'.png')).write_bytes(subprocess.check_output(adb+['exec-out','screencap','-p'],timeout=30))
 cases.append({'native_preference':native,'settings':actual,'passed':True})
tap('settings')
for option,title in [('简体中文','游戏设置'),('繁體中文','遊戲設定'),('English','Game settings')]:
 tap('language');tap(text=option);assert find('dialog-title').get('text')==title
run('shell','am','force-stop',package)
run('shell','cmd','locale','set-app-locales',package,'--user','0','--locales','zh-CN');launch()
assert label(find('settings'))=='Settings'
tap('settings');tap('language');tap(text='简体中文');tap(text='返回机库')
report={'status':'passed','cases':cases,'manual_switch_three_languages':True,'cold_restart_preserves_override':True,'native_preference_change_does_not_replace_override':True,'serial':args.serial,'api':run('shell','getprop','ro.build.version.sdk')}
(out/'android-localization-verification.json').write_text(json.dumps(report,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')
print('Android language checks passed / Android 三语检查通过')
