"""只导出弹型数值，不输出原作像素。 / Export projectile numbers, never original pixels.
复用现有 pefile/capstone。 / Reuses existing pefile/capstone.
"""
from pathlib import Path
import sys,runpy,struct,json
root=Path(__file__).resolve().parents[1];sys.path.insert(0,str(root/'.local/python'))
import pefile,capstone
directory=Path(sys.argv[1]) if len(sys.argv)>1 else root/'Deamon Star'
api=runpy.run_path(str(root/'tools/inspect-original.py'));entries=api['read_glb'](directory/'Game.glb');byname={}
for e in entries:byname.setdefault(e['name'],e['index'])
pe=pefile.PE(str(directory/'ds.exe'));cs=capstone.Cs(capstone.CS_ARCH_X86,capstone.CS_MODE_32);cs.detail=True
reg={capstone.x86_const.X86_REG_ESP:0x1000000};mem={};R=capstone.x86_const
def signed(v):return (v&0x7fffffff)-(v&0x80000000)
def addr(o):return reg.get(o.mem.base,0)+reg.get(o.mem.index,0)*o.mem.scale+o.mem.disp
def val(o):
 if o.type==capstone.CS_OP_IMM:return o.imm
 if o.type==capstone.CS_OP_REG:return reg.get(o.reg,0)
 return mem.get(addr(o),0)
def put(o,v):
 if o.type==capstone.CS_OP_REG:reg[o.reg]=signed(v)
 else:mem[addr(o)]=signed(v)
for ins in cs.disasm(pe.get_data(0x2a660,0x21a0),0x42a660):
 if ins.address>=0x42c7cc:break
 o=ins.operands;m=ins.mnemonic
 if m=='ret':break
 if m=='push':reg[R.X86_REG_ESP]-=4;mem[reg[R.X86_REG_ESP]]=val(o[0])
 elif m=='pop':put(o[0],mem.get(reg[R.X86_REG_ESP],0));reg[R.X86_REG_ESP]+=4
 elif m=='mov':put(o[0],val(o[1]))
 elif m=='lea':put(o[0],addr(o[1]))
 elif m=='xor':put(o[0],val(o[0])^val(o[1]))
 elif m=='or':put(o[0],val(o[0])|val(o[1]))
 elif m=='add':put(o[0],val(o[0])+val(o[1]))
 elif m=='sub':put(o[0],val(o[0])-val(o[1]))
 elif m=='sar':put(o[0],val(o[0])>>val(o[1]))
 elif m=='cdq':reg[R.X86_REG_EDX]=-1 if reg.get(R.X86_REG_EAX,0)<0 else 0
 elif m=='rep stosd':
  for off in range(reg[R.X86_REG_ECX]):mem[reg[R.X86_REG_EDI]+off*4]=reg[R.X86_REG_EAX]
 elif m=='call':
  target=o[0].imm
  if target==0x415660:
   arg=mem[reg[R.X86_REG_ESP]];name=pe.get_data(arg-0x400000,32).split(b'\0')[0].decode();reg[R.X86_REG_EAX]=byname[name]
  elif target==0x4157a0:
   index=mem[reg[R.X86_REG_ESP]];w,h=struct.unpack_from('<II',entries[index]['data']);ptr=0x2000000+index*16;mem[ptr]=w;mem[ptr+4]=h;reg[R.X86_REG_EAX]=ptr
  elif target not in [0x42a5a0,0x428580]:raise ValueError(hex(target))
 elif m!='nop':raise ValueError((hex(ins.address),m))

import hashlib
shots={}
for i in list(range(15,40))+[48,49,50]:
 base=0x5ce320+i*72;index=mem[base];w,h=struct.unpack_from('<II',entries[index]['data'])
 speed=24 if i<=25 else 16 if i<=31 or i>=48 else {32:20,33:20,34:21,35:22,36:24,37:24,38:9,39:8}[i]
 shots[i]={'sprite':entries[index]['name'],'width':w,'height':h,'speed':speed,'acceleration':mem.get(base+56,0),'minimumSpeed':mem.get(base+60,0),'carryTicks':0 if i==38 else 1 if i==39 else 2,'impact':mem.get(base+44,0)}
result={'sourceVersion':'DemonStar 4.04','sourceSha256':hashlib.sha256((directory/'ds.exe').read_bytes()).hexdigest(),'shots':shots,'homing':{'turnStep':64,'snapThreshold':64,'lifetimeTicks':101,'directions':16}}
(root/'web/js/projectile-rules.js').write_text('/* 原作弹型数值；无原始图像。Original projectile numbers; no original pixels. See docs/M2_8_RESEARCH.md. */\nglobalThis.DemonStarProjectileRules='+json.dumps(result,separators=(',',':'))+';\n',encoding='utf-8')
print('Imported 28 player projectile templates / 已导入 28 种主机弹型')
