"""Read the original resource loader; export symbolic bindings, never recordings."""
import sys,json,hashlib
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];sys.path.insert(0,str(ROOT/'.local/python'))
import pefile,capstone
p=pefile.PE(str(ROOT/'Deamon Star/ds.exe'));c=capstone.Cs(capstone.CS_ARCH_X86,capstone.CS_MODE_32);c.detail=True
resource=None;priority=None;waiting=False;lastSmall=None;rows=[]
for i in c.disasm(p.get_data(0x2c800,0x730),0x42c800):
    if i.mnemonic=='push' and i.operands[0].type==capstone.CS_OP_IMM:
        v=i.operands[0].imm
        if 0<=v<10:lastSmall=v
        elif 0x43a000<=v<0x440000:
            text=p.get_data(v-0x400000,40).split(b'\0')[0].decode('ascii',errors='replace')
            if text.startswith('W_'):resource=text;priority=lastSmall
    if i.mnemonic=='call' and i.op_str=='0x407cc0':waiting=(resource,priority)
    if waiting and i.mnemonic=='mov':
        a,b=i.operands
        if a.type==capstone.CS_OP_MEM and not a.mem.base and b.type==capstone.CS_OP_REG and i.reg_name(b.reg)=='eax':
            rows.append({'resource':waiting[0],'priority':waiting[1],'global':hex(a.mem.disp),'binding':hex(i.address)});waiting=False
supplied=json.loads((ROOT/'docs/audio-manifest.json').read_text(encoding='utf-8'))
available={e['resource'] for e in supplied['inventory']}
for row in rows:row['supplied']=row['resource'] in available
out={'source':'DemonStar 4.04 ds.exe 0x42c800 resource loader; cloned player-shot handles reuse the same recording. Priority 0 loops, positive priorities use the three-slot scheduler.','bindings':rows}
(ROOT/'docs/audio-bindings.json').write_text(json.dumps(out,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'bindings':len(rows),'missing':[r['resource'] for r in rows if not r['supplied']],'priorities':{r['resource']:r['priority'] for r in rows if r['supplied']}}))
