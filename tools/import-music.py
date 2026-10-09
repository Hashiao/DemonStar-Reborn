"""Audit the original song switch and copy user-supplied BGM without transcoding."""
import hashlib,json,re,struct,sys
from pathlib import Path
import shutil
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'.local/python'))
import pefile,capstone
p=pefile.PE(str(ROOT/'Deamon Star/ds.exe'));decoder=capstone.Cs(capstone.CS_ARCH_X86,capstone.CS_MODE_32)
mapping=(ROOT/'audio/背景音乐文件名对照表.txt').read_text(encoding='utf-8')
entries=[dict(resource=m[1],renderedResource=m[2],filename=m[3],seconds=float(m[4])) for m in re.finditer(r'^(MDS_\w+)\t(MID_\w+)\t([^\t\r\n]+\.mp3)\t([\d.]+)',mapping,re.M)]
assert len(entries)==20
names=[]
for va in struct.unpack('<18I',p.get_data(0x1fa70,72)):
    candidates=[]
    for i in decoder.disasm(p.get_data(va-0x400000,46),va):
        if i.mnemonic=='push' and i.op_str.startswith('0x43'):
            value=int(i.op_str,16);name=p.get_data(value-0x400000,32).split(b'\0')[0].decode('ascii')
            if name.startswith('MDS_'):candidates.append(name)
    assert len(candidates)==1
    names.append(candidates[0])
jumps=struct.unpack('<17I',p.get_data(0x256b4,68));stages=[]
for stage in range(1,19):
    case=stage-2
    va=jumps[case] if 0<=case<17 else 0x425694
    instruction=next(decoder.disasm(p.get_data(va-0x400000,5),va));assert instruction.mnemonic=='push'
    index=int(instruction.op_str,0);stages.append({'stage':stage,'songIndex':index,'resource':names[index],'branch':hex(va)})
output=ROOT/'web/assets/music';output.mkdir(parents=True,exist_ok=True);assets={};hashes={}
for entry in entries:
    source=ROOT/'audio'/entry['filename'];data=source.read_bytes();digest=hashlib.sha256(data).hexdigest()
    asset=hashes.get(digest)
    if not asset:asset='assets/music/'+entry['resource']+'.mp3';shutil.copyfile(source,ROOT/'web'/asset);hashes[digest]=asset
    assets[entry['resource']]=asset;entry.update(sha256=digest,bytes=len(data),asset='web/'+asset)
bank={'tracks':assets,'stages':[s['resource'] for s in stages],'menu':'MDS_INTRO','results':'MDS_8GALVAMP'}
(ROOT/'web/js/music-bank.js').write_text('/* User-supplied BGM; original stage switch at 0x42564a. See docs/MUSIC.md. */\nglobalThis.DemonStarMusic='+json.dumps(bank,separators=(',',':'))+';\n',encoding='utf-8')
report={'provenance':'User supplied additional BGM MP3s and explicitly requested their use on 2026-10-09. Source renderer/GM soundfont disclosure is preserved in docs/MUSIC.md.','sourceExeSha256':hashlib.sha256((ROOT/'Deamon Star/ds.exe').read_bytes()).hexdigest(),'songTable':names,'stages':stages,'inventory':entries}
(ROOT/'docs/music-manifest.json').write_text(json.dumps(report,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')
print(json.dumps({'stages':stages,'files':len(hashes),'bytes':sum((ROOT/'web'/a).stat().st_size for a in hashes.values())}))
