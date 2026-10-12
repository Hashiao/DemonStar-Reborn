"""导入原作炮门几何与重绘裁切，不修改图片。 / Import shutter geometry and redraw crops without editing pixels."""
import argparse, hashlib, json, runpy
from pathlib import Path
from PIL import Image

ROOT=Path(__file__).resolve().parents[1]

def dividers(size,count,projection):
    result=[0]
    for i in range(1,count):
        expected=size*i/count;span=size/count*.18
        empty=[j for j in range(max(result[-1]+1,round(expected-span)),min(size,round(expected+span))) if not projection[j]]
        assert empty, 'No transparent gutter near an expected cell boundary'
        runs=[];start=last=empty[0]
        for j in empty[1:]:
            if j!=last+1:runs.append((start+last)//2);start=j
            last=j
        runs.append((start+last)//2);result.append(min(runs,key=lambda n:abs(n-expected)))
    return result+[size]

def ground_art(directory):
    api=runpy.run_path(str(ROOT/'tools/inspect-original.py'))
    entries=api['read_glb'](directory/'Game.glb')
    palette=[min(255,v*4) for v in next(e['data'] for e in entries if e['name']=='palette')]
    sprites,assets={},{}
    for path,columns,rows,families in [
        ('assets/ground-covers-hd.png',6,2,[('G_TNK2A',6),('G_TNK3A',6)]),
        ('assets/ground-shutters-hd.png',6,4,[('G_BTANK1A',20)]),
    ]:
        file=ROOT/'web'/path;im=Image.open(file);assert im.mode=='RGBA'
        alpha=im.getchannel('A');assert alpha.getextrema()==(0,255)
        mask=alpha.point(lambda a:255 if a>128 else 0);px,py=mask.getprojection()
        xs=dividers(im.width,columns,px);ys=dividers(im.height,rows,py)
        assets[path]={'sha256':hashlib.sha256(file.read_bytes()).hexdigest(),'size':list(im.size)}
        cell=0
        for name,count in families:
            first=next(i for i,e in enumerate(entries) if e['name']==name);frames=[]
            for entry in entries[first:first+count]:
                # 透明间隙定位重绘；显示尺寸/偏移逐帧取原作，避免开门时整机缩放。
                # Transparent gutters locate redraws; source frame sizes/offsets keep the chassis from scaling as doors move.
                x=xs[cell%columns];y=ys[cell//columns];right=xs[cell%columns+1];bottom=ys[cell//columns+1]
                bounds=mask.crop((x,y,right,bottom)).getbbox()
                assert bounds is not None
                a,b,c,d=bounds;assert a>0 and b>0 and c<right-x and d<bottom-y
                source=api['decode_sprite'](entry['data'],palette);l,t,r,z=source.getbbox()
                frames.append({'crop':[x+a,y+b,c-a,d-b],'offset':[(l+r-source.width)/2,(t+z-source.height)/2],'visible':[r-l,z-t]});cell+=1
            sprites[name]={'asset':path,**frames[0],'frames':frames}
    return sprites,assets

def refresh(directory):
    file=ROOT/'web/js/campaign-art.js';data=json.loads(file.read_text(encoding='utf-8').split('=',1)[1].strip().rstrip(';'))
    sprites,assets=ground_art(directory)
    for name,spec in sprites.items():data['sprites'][name].update(spec)
    data['assets'].update(assets)
    campaign=json.loads((ROOT/'web/js/campaign.js').read_text(encoding='utf-8').split('=',1)[1].strip().rstrip(';'))
    for stage in campaign['levels']:
        names={campaign['definitions'][campaign['byId'][str(r[2])]]['sprite'] for r in stage['events']}
        data['stageAssets'][str(stage['id'])]=sorted({data['sprites'][n]['asset'] for n in names if n in data['sprites'] and 'asset' in data['sprites'][n]})
    file.write_text('/* 全战役原型映射与重绘几何；无原作像素。Campaign mappings and redraw geometry; no original pixels. */\nglobalThis.DemonStarCampaignArt='+json.dumps(data,separators=(',',':'))+';\n',encoding='utf-8')
    coverage_file=ROOT/'docs/campaign-art-coverage.json';coverage=json.loads(coverage_file.read_text(encoding='utf-8'))
    coverage['assets'].update(assets)
    for name,spec in sprites.items():coverage['records'][name]['asset']=spec['asset']
    coverage_file.write_text(json.dumps(coverage,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')
    print('Imported 32 shutter frames across three original families; no original pixels exported.')

if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('directory',type=Path);refresh(parser.parse_args().directory)
