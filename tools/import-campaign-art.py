"""按原名生成全战役美术映射，只输出数值/重绘裁切。
Build campaign art mappings by original names; export numbers/redraw crops only.
"""
import argparse,hashlib,json,runpy
from pathlib import Path
from PIL import Image
import numpy as np
from scipy.ndimage import label,find_objects
ROOT=Path(__file__).resolve().parents[1]
api=runpy.run_path(str(ROOT/'tools/inspect-original.py'))

def atlas_crops(path,columns,rows,count):
    im=Image.open(ROOT/path).convert('RGBA');alpha=im.getchannel('A')
    if alpha.getextrema()[0]!=0:raise ValueError('Atlas must preserve transparency: '+path)
    occupancy=np.asarray(alpha)>160
    def dividers(size,n,projection):
        result=[0]
        for i in range(1,n):
            expected=size*i/n;span=size/n*.16;lo=max(result[-1]+1,round(expected-span));hi=min(size,round(expected+span))
            minimum=projection[lo:hi].min();candidates=np.flatnonzero(projection[lo:hi]==minimum)+lo
            runs=np.split(candidates,np.where(np.diff(candidates)>1)[0]+1)
            centers=[int((run[0]+run[-1])//2) for run in runs if len(run)]
            result.append(min(centers,key=lambda v:abs(v-expected)))
        return result+[size]
    xs=dividers(im.width,columns,occupancy.sum(axis=0));ys=dividers(im.height,rows,occupancy.sum(axis=1))
    cells=[]
    for i in range(count):
        x=xs[i%columns];y=ys[i//columns];right=xs[i%columns+1];bottom=ys[i//columns+1]
        mask=np.asarray(alpha.crop((x,y,right,bottom)))>160
        labels,count=label(mask);regions=find_objects(labels);areas=np.bincount(labels.ravel());largest=max(areas[1:],default=0)
        # 去掉切到单元边界的相邻零件碎条；主体越界则中止，让人工重新划区。
        # Discard clipped neighboring fragments at cell edges; a clipped main body requires manual partitioning.
        for component,region in enumerate(regions,1):
            if region is None:continue
            region_y,region_x=region
            if region_x.start==0 or region_y.start==0 or region_x.stop==mask.shape[1] or region_y.stop==mask.shape[0]:
                if areas[component]>largest*.2:raise ValueError(f'Main artwork crosses cell boundary: {path} #{i}')
                mask[labels==component]=False
        box=Image.fromarray(mask).getbbox()
        if box is None:raise ValueError(f'Empty atlas cell: {path} #{i}')
        a,b,c,d=box;cells.append([x+a,y+b,c-a,d-b])
    return im,cells

def generate(directory):
    campaign=json.loads((ROOT/'web/js/campaign.js').read_text(encoding='utf-8').split('=',1)[1].strip().rstrip(';'))
    existing=json.loads((ROOT/'web/js/enemy-art.js').read_text(encoding='utf-8').split('=',1)[1].strip().rstrip(';'))
    layout=json.loads((ROOT/'docs/campaign-art-layout.json').read_text(encoding='utf-8'))
    archives={name:api['read_glb'](directory/name) for name in ['Game.glb','game2.glb','Game3.glb']};lookup={}
    for arc,entries in archives.items():
        for entry in entries:lookup.setdefault(entry['name'],(arc,entry))
    palette=[min(255,x*4) for x in next(e['data'] for e in archives['Game.glb'] if e['name']=='palette')]
    def original(name):return api['decode_sprite'](lookup[name][1]['data'],palette)
    def geometry(name):
        im=original(name);l,t,r,b=im.getbbox() or (0,0,*im.size)
        return {'width':im.width,'height':im.height,'bounds':[l,t,r,b],'offset':[(l+r-im.width)/2,(t+b-im.height)/2],'visible':[r-l,b-t]}
    records={};routes={};sprites={};assets={}
    for definition in campaign['definitions']:
        name=definition['sprite'];record=records.setdefault(name,{**geometry(name),'definitions':[],'stages':[],'archive':lookup[name][0]})
        record['definitions'].append(definition['id'])
    for stage in campaign['levels']:
        for name in {campaign['definitions'][campaign['byId'][str(r[2])]]['sprite'] for r in stage['events']}:records[name]['stages'].append(stage['id'])
    for group in layout['groups']:
        path=group['asset'];im,crops=atlas_crops(path,group['columns'],group['rows'],len(group['names']))
        asset=path.removeprefix('web/');assets[asset]={'sha256':hashlib.sha256((ROOT/path).read_bytes()).hexdigest(),'size':list(im.size)}
        for i,name in enumerate(group['names']):
            defs=[d for d in campaign['definitions'] if d['sprite']==name]
            sprites[name]={**geometry(name),'asset':asset,'crop':crops[i],'directional':any(d['flags']&0x500 for d in defs)}
            routes[name]={'kind':'campaign'}
    # 保留已核验的多帧和关卡一素材；其他所有对象必须有显式新映射。
    # Retain verified frame atlases and stage-one art; every other object needs an explicit mapping.
    mission=['S_ENEMY14','S_ENEMY20','S_ENEMY21','S_ENEMY34A','S_ASTER1A','S_ASTER2A','S_ASTER3A','S_ENBON1','S_ENBON3','S_SPTNKRA','S_ENEMY22','S_ENEMY28A','S_PIPE1','S_PIPE2','S_PIPE3','S_BHOLE1A']
    for i,name in enumerate(mission):routes[name]={'kind':'mission1','index':i}
    for i,name in enumerate(['S_ENBON1','S_ENBON2','S_ENBON3','S_ENBON4']):routes[name]={'kind':'carrier','index':i}
    for name in existing['sprites']:routes[name]={'kind':'framed'}
    routes['S_ENEMY28A']={'kind':'spinner'}
    for d in campaign['definitions']:
        if not d['flags']&1:continue
        name=d['sprite']
        if name.startswith('S2_BOSS'):routes[name]={'kind':'boss2','index':int(name[7:].rstrip('A'))-1}
        elif name.startswith('S_BOSS'):routes[name]={'kind':'boss1','index':7+int(name[6:].rstrip('A'))}
        else:raise ValueError('Unmapped boss '+name)
    # 五种固定底座不随炮管旋转；枢轴从原作红/橙轴心及重绘轴心提取。
    # Five fixed bases stay still; derive pivots from original and redrawn red/orange hubs.
    names=['G_TUR1A','G_TNKSHT1A','S_STAT9A','S2_SHIP29A','S2_SHIP31A'];path='web/assets/fixed-turret-layers-hd.png';im=Image.open(ROOT/path).convert('RGBA');asset=path.removeprefix('web/');assets[asset]={'sha256':hashlib.sha256((ROOT/path).read_bytes()).hexdigest(),'size':list(im.size)}
    # 分层图集并非等高行；以审看的透明间隙分区，防止底座/邻件串入炮管。
    # Layered atlas rows are unequal; use reviewed transparent gaps to avoid adjacent-part contamination.
    edges=[0,320,760,1200,1610,im.width];crops=[]
    for top,bottom in [(0,480),(480,im.height)]:
        for left,right in zip(edges,edges[1:]):
            a,b,c,d=im.getchannel('A').crop((left,top,right,bottom)).point(lambda v:255 if v>160 else 0).getbbox();crops.append([left+a,top+b,c-a,d-b])
    # 原作首帧炮管外接框的人工像素核对；不是整底座的旋转差分。
    # Manually checked first-pose barrel bounds, not whole-base rotation differences.
    head_bounds=[[11,4,20,21],[20,12,29,28],[28,17,38,37],[27,21,36,36],[28,19,37,37]]
    def hub(image):
        points=[(x,y) for y in range(image.height) for x in range(image.width) if (lambda p:p[3]>160 and p[0]>70 and p[0]>p[1]*1.5 and p[0]>p[2]*1.4)(image.getpixel((x,y)))]
        if not points:raise ValueError('No turret hub')
        xs,ys=zip(*points);return ((min(xs)+max(xs)+1)/2,(min(ys)+max(ys)+1)/2,(min(xs),min(ys),max(xs)+1,max(ys)+1))
    for i,name in enumerate(names):
        src=original(name);hx,hy,_=hub(src);left,top,right,bottom=head_bounds[i]
        crop=crops[i+5];gx,gy,_=hub(im.crop((crop[0],crop[1],crop[0]+crop[2],crop[1]+crop[3])))
        sprites[name].update(asset=asset,crop=crops[i],directional=True,head={'crop':crop,'size':[right-left,bottom-top],'pivot':[gx/crop[2],gy/crop[3]],'offset':[hx-src.width/2,hy-src.height/2]})
    # 矿石以专用散点重绘，透明间隙不能变成通用实心地块；不导出原像素坐标。
    # Redraw ore as dedicated sparse flecks, not solid tiles; export no original pixel coordinates.
    polygons={'S_ORCPIC1':[[.22,.08],[.8,.13],[1,.5],[.79,.95],[.23,.86],[0,.45]],'S_ORCPIC2':[[.2,.03],[.82,.04],[1,.45],[.88,.9],[.5,1],[.02,.77],[0,.28]],'S_ORCPIC3':[[.43,0],[.94,.05],[1,.78],[.66,1],[0,.76],[.07,.5],[.35,.4]],'S_ORCPIC4':[[0,0],[.36,.13],[.65,.47],[1,.85],[.95,1],[.63,.79],[.3,.49],[.02,.18]]}
    for name,polygon in polygons.items():
        alpha=original(name).getchannel('A');count=sum(a>0 for a in alpha.getdata())
        sprites[name]={**geometry(name),'kind':'ore','polygon':polygon,'grains':min(1800,max(20,round(count/2))),'directional':False};routes[name]={'kind':'campaign'}
    missing=sorted(set(records)-set(routes))
    if missing:raise ValueError('Unmapped originals: '+','.join(missing))
    stage_assets={}
    for stage in campaign['levels']:
        names={campaign['definitions'][campaign['byId'][str(r[2])]]['sprite'] for r in stage['events']}
        stage_assets[stage['id']]=sorted({sprites[n]['asset'] for n in names if n in sprites and 'asset' in sprites[n]})
    result={'sprites':sprites,'routes':routes,'stageAssets':stage_assets,'assets':assets}
    (ROOT/'web/js/campaign-art.js').write_text('/* 全战役原型映射与重绘几何；无原作像素。Campaign mappings and redraw geometry; no original pixels. */\nglobalThis.DemonStarCampaignArt='+json.dumps(result,separators=(',',':'))+';\n',encoding='utf-8')
    coverage={'description':{'zh-Hans':'逐原型显式映射；生成基础外形覆盖不等于全部动画已逐帧还原。','en':'Explicit prototype mappings; base-art coverage is not complete animation fidelity.'},'definitions':len(campaign['definitions']),'usedDefinitions':len({r[2] for s in campaign['levels'] for r in s['events']}),'sprites':len(records),'usedSprites':sum(bool(r['stages']) for r in records.values()),'newMappedSprites':len(sprites),'missing':missing,'records':{n:{**r,'route':routes[n],**({'asset':sprites[n].get('asset'),'kind':sprites[n].get('kind','atlas')} if n in sprites else {})} for n,r in records.items()},'assets':assets}
    (ROOT/'docs/campaign-art-coverage.json').write_text(json.dumps(coverage,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')
    return coverage

def enemy_shots(directory):
    entries=api['read_glb'](directory/'Game.glb');palette=[min(255,x*4) for x in next(e['data'] for e in entries if e['name']=='palette')]
    groups=[[532,533,534,535,548,549,536,537,538,539,593,594,595,596,597,598],[550,551,552,553,585,586,587,588,507,503]];frames={};assets={}
    for number,indices in enumerate(groups,1):
        path=f'web/assets/enemy-projectiles-{number:02d}-hd.png';im,crops=atlas_crops(path,4,4,len(indices));asset=path.removeprefix('web/');assets[asset]={'sha256':hashlib.sha256((ROOT/path).read_bytes()).hexdigest(),'size':list(im.size)}
        for i,index in enumerate(indices):
            src=api['decode_sprite'](entries[index]['data'],palette);l,t,r,b=src.getbbox();frames[index]={'asset':asset,'crop':crops[i],'offset':[(l+r-src.width)/2,(t+b-src.height)/2],'size':[r-l,b-t]}
    ranges={0:[532,533],1:[534,535],2:[548,549],3:[548,549],7:[536,537],8:[538,539],10:[593,594,595,596,597],12:[534,535],40:[548,549],41:[550,551,552,553],42:[585,586,587,588],43:[507],44:[503]}
    shots={k:{'frames':[frames[i] for i in ids],'frameCount':len(ids),'kind':'red-beam' if k==10 else 'projectile'} for k,ids in ranges.items()};shots[10]['cap']=frames[598]
    shots[9]={'kind':'blue-beam','frameCount':4};shots[11]={'kind':'orange-star','frameCount':4}
    result={'shots':shots,'assets':assets}
    (ROOT/'web/js/enemy-shots.js').write_text('/* 原作敌弹帧映射；仅含数值与重绘裁切。Original enemy-shot frame mappings; numbers/redraw crops only. */\nglobalThis.DemonStarEnemyShots='+json.dumps(result,separators=(',',':'))+';\n',encoding='utf-8')
    return len(shots)

if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('directory',type=Path);args=parser.parse_args();coverage=generate(args.directory);count=enemy_shots(args.directory)
    print(json.dumps({'sprites':coverage['sprites'],'usedSprites':coverage['usedSprites'],'newMappedSprites':coverage['newMappedSprites'],'missing':coverage['missing'],'enemyShotTypes':count}))
