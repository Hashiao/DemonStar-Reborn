"""Extract numeric 4.04 weapon configuration, not executable instructions/assets.
Uses the maintainer's existing pefile/capstone; ordinary builds use saved JSON.
"""
import argparse,json,struct,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'.local/python'))
import pefile,capstone

def extract(path):
    pe=pefile.PE(str(path));decoder=capstone.Cs(capstone.CS_ARCH_X86,capstone.CS_MODE_32);decoder.detail=True
    regs={};memory={}
    def address(o):return regs.get(o.mem.base,0)+regs.get(o.mem.index,0)*o.mem.scale+o.mem.disp
    def value(o):
        if o.type==capstone.CS_OP_IMM:return o.imm
        if o.type==capstone.CS_OP_REG:return regs.get(o.reg,0)
        return memory.get(address(o),0)
    for i in decoder.disasm(pe.get_data(0x27050,0x518),0x427050):
        if i.mnemonic=='ret':break
        if i.mnemonic=='xor':regs[i.operands[0].reg]=0
        elif i.mnemonic=='mov':
            dst,src=i.operands;v=value(src)
            if dst.type==capstone.CS_OP_REG:regs[dst.reg]=v
            else:memory[address(dst)]=v
        elif i.mnemonic not in ('push','pop'):raise ValueError('Unexpected initialization instruction')
    slots=[]
    for weapon in range(5):
        base=0xac+weapon*0x14c
        levels=[[[memory.get(base+level*48+j*8,0),memory.get(base+level*48+j*8+4,0)] for j in range(memory.get(base+0x120+level*4,0))] for level in range(6)]
        slots.append({'cooldownTicks':memory[base+0x140],'levels':levels})
    damages={};regs={}
    for i in decoder.disasm(pe.get_data(0x2a660,0x21a0),0x42a660):
        if i.mnemonic=='mov':
            a,b=i.operands;v=b.imm if b.type==capstone.CS_OP_IMM else regs.get(b.reg) if b.type==capstone.CS_OP_REG else None
            if a.type==capstone.CS_OP_REG:regs[a.reg]=v
            elif a.type==capstone.CS_OP_MEM and a.mem.base==0 and a.mem.index==0:
                slot,offset=divmod(a.mem.disp-0x5ce320,72)
                if 0<=slot<62 and offset==20:damages[slot]=v
        elif i.mnemonic=='xor' and i.operands[0].reg==i.operands[1].reg:regs[i.operands[0].reg]=0
        elif i.mnemonic=='call':
            for n in ['EAX','ECX','EDX']:regs[getattr(capstone.x86_const,'X86_REG_'+n)]=None
    assert all(damages.get(i) is not None for i in range(15,40))
    alternate=[n for j in range(8) for n in (j*2,15-j*2)]
    permutation=list(struct.unpack('<16i',pe.get_data(0x3d2fc,64)))
    phases={kind:[(n-8)*step for n in order] for kind,step,order in [(32,4,alternate),(33,4,permutation),(34,5,alternate),(35,8,permutation),(36,17,alternate),(37,17,permutation)]}
    return {'sourceVersion':'DemonStar 4.04','muzzles':list(struct.iter_unpack('<ii',pe.get_data(0x3ce28,56))),'slots':slots,'damage':damages,'plasmaPhases':phases}

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('exe',type=Path);args=p.parse_args();data=extract(args.exe)
    (ROOT/'web/js/player-rules.js').write_text('/* Numeric weapon tables from local 4.04. See docs/DROPS_WEAPONS.md. */\nglobalThis.DemonStarPlayerRules='+json.dumps(data,separators=(',',':'))+';\n',encoding='utf-8')
    print('Imported 5 weapon slots, 6 enhancement levels, 7 muzzles and projectile damage constants.')
