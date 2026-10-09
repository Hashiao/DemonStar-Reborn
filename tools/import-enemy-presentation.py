"""Import numeric animation/bounding-box metadata; never copy original pixels.

Reads a local 4.04 installation and the three already generated HD atlases.
Requires the maintainer's existing Pillow. See docs/ART_M2_4.md.
"""
import argparse,json,runpy,struct
from pathlib import Path
from PIL import Image

ROOT=Path(__file__).resolve().parents[1]
api=runpy.run_path(str(Path(__file__).with_name('inspect-original.py')))

def extract(directory):
    entries=api['read_glb'](directory/'Game.glb')
    palette=[min(255,v*4) for v in next(e['data'] for e in entries if e['name']=='palette')]
    specs=[('S_ENEMY1A','fighter-motion-hd.png',3,2,[e for e in entries if e['name'] in ['S_ENEMY1'+c for c in 'ABCDEF']]),
           ('S_ASTSHT1B','turret-directions-hd.png',8,4,[e for e in entries if e['name']=='S_ASTSHT1B'][:32]),
           ('S_ASTER1A','asteroid-motion-hd.png',6,4,[e for e in entries if e['name'].startswith('S_ASTER1')])]
    sprites={}
    for name,file,cols,rows,frames in specs:
        assert len(frames)==cols*rows
        atlas=Image.open(ROOT/'web/assets'/file)
        assert atlas.mode=='RGBA' and atlas.getchannel('A').getextrema()[0]==0
        crops=[]
        for i,entry in enumerate(frames):
            original=api['decode_sprite'](entry['data'],palette)
            left,top,right,bottom=original.getchannel('A').getbbox()
            x=round(i%cols*atlas.width/cols);y=round(i//cols*atlas.height/rows)
            x2=round((i%cols+1)*atlas.width/cols);y2=round((i//cols+1)*atlas.height/rows)
            bounds=atlas.getchannel('A').crop((x,y,x2,y2)).point(lambda a:255 if a>128 else 0).getbbox()
            assert bounds is not None
            a,b,c,d=bounds
            # Display maps the generated opaque silhouette to the original
            # visible extent, never the square atlas cell to a tall rectangle.
            crops.append([x+a,y+b,c-a,d-b,(left+right-original.width)/2,(top+bottom-original.height)/2,right-left,bottom-top])
        sprites[name]={'asset':'assets/'+file,'directional':name=='S_ASTSHT1B','frames':crops}
    data=next(e['data'] for e in entries if e['name']=='SHIPDEFS_DAT');animations={}
    for i in range(struct.unpack_from('<I',data)[0]):
        rec=data[4+i*2688:4+(i+1)*2688];name=rec[:16].split(b'\0')[0].decode()
        if name not in sprites:continue
        s16=lambda off:struct.unpack_from('<h',rec,off)[0]
        animations[struct.unpack_from('<I',rec,16)[0]]={'interval':s16(64),'pause':s16(66),'loopFrames':s16(68),'cycles':s16(70),'start':s16(72),'pauseEnd':s16(82),'pauseStart':s16(84),'pingPong':bool(struct.unpack_from('<I',rec,40)[0]&0x10000)}
    return {'sprites':sprites,'animations':animations}

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('directory',type=Path);args=p.parse_args()
    result=extract(args.directory)
    (ROOT/'web/js/enemy-art.js').write_text('/* Numeric frame geometry and generated atlas crops. See docs/ART_M2_4.md. */\nglobalThis.DemonStarEnemyArt='+json.dumps(result,separators=(',',':'))+';\n',encoding='utf-8')
    print('Imported',len(result['sprites']),'sprite families and',len(result['animations']),'animation definitions; no original pixels exported.')
