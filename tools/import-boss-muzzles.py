"""将重绘炮口配准至原作炮位，不修改图片或战斗表。
Register redrawn muzzles to source mounts without changing images or combat tables.
"""
from pathlib import Path
import hashlib,json
ROOT=Path(__file__).resolve().parents[1]

def registrations():
    manifest=json.loads((ROOT/'docs/boss-muzzle-registration.json').read_text(encoding='utf8'))['sprites']
    campaign=json.loads((ROOT/'web/js/campaign.js').read_text(encoding='utf8').split('=',1)[1].strip().rstrip(';'));result={}
    for name,s in manifest.items():
        assert hashlib.sha256((ROOT/'web'/s['asset']).read_bytes()).hexdigest()==s['asset_sha256']
        definition=next(d for d in campaign['definitions'] if d['id']==s['id']);mouths={}
        for m in s['mounts']:
            raw=definition['guns'][m['gun']];assert raw[2]==m['shotType'];assert [raw[0]-definition['width']/2,raw[1]-definition['height']/2]==m['originalOffset']
            x,y=m['art'];dx,dy=m['originalOffset'];assert x not in mouths or mouths[x]==[y,dx,dy];mouths[x]=[y,dx,dy]
        left,top,width,height=s['crop'];geo=s['source_geometry'];dl,dt,dr,db=geo['bounds'];dl-=geo['width']/2;dr-=geo['width']/2;dt-=geo['height']/2;db-=geo['height']/2
        xs=sorted(mouths);columns=[[left,mouths[xs[0]][0],dl,mouths[xs[0]][2]],*[[x,*mouths[x]] for x in xs],[left+width,mouths[xs[-1]][0],dr,mouths[xs[-1]][2]]]
        vertices=[]
        for x,y,dx,dy in columns:
            vertices.append([[x,top,dx,dt],[x,y,dx,dy],[x,top+height,dx,db]])
        patches=[]
        for col in range(len(columns)-1):
            for row in range(2):
                for p in [[vertices[col][row],vertices[col+1][row],vertices[col+1][row+1]],[vertices[col][row],vertices[col+1][row+1],vertices[col][row+1]]]:
                    (x0,y0,u0,v0),(x1,y1,u1,v1),(x2,y2,u2,v2)=p;den=(x1-x0)*(y2-y0)-(x2-x0)*(y1-y0)
                    assert abs(den)>1e-6,'Degenerate source triangle'
                    a=((u1-u0)*(y2-y0)-(u2-u0)*(y1-y0))/den;b=((v1-v0)*(y2-y0)-(v2-v0)*(y1-y0))/den
                    c=((u2-u0)*(x1-x0)-(u1-u0)*(x2-x0))/den;d=((v2-v0)*(x1-x0)-(v1-v0)*(x2-x0))/den
                    assert a*d-b*c>0,'Inverted registration triangle'
                    patches.append({'points':[u0,v0,u1,v1,u2,v2],'matrix':[a,b,c,d,u0-a*x0-c*y0,v0-b*x0-d*y0]})
        result[name]={'asset':s['asset'],'crop':s['crop'],'mounts':s['mounts'],'patches':patches}
    return result

if __name__=='__main__':
    path=ROOT/'web/js/enemy-art.js';text=path.read_text(encoding='utf8');prefix,payload=text.split('=',1);data=json.loads(payload.strip().rstrip(';'));data['bosses']=registrations();path.write_text(prefix+'='+json.dumps(data,separators=(',',':'))+';\n',encoding='utf8');print('Registered',len(data['bosses']),'laser Bosses; images and gun tables unchanged.')
