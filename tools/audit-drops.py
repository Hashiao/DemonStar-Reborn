"""Document every explicit and automatic drop placement across the 18 maps."""
import argparse,collections,json,runpy
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
def audit(directory):
    c=runpy.run_path(str(ROOT/'tools/import-campaign.py'))['import_campaign'](directory)
    rows=[];automatic=[]
    for stage in c['levels']:
        for record in stage['events']:
            d=c['definitions'][c['byId'][record[2]]]
            row={'stage':stage['id'],'x':record[0],'scroll':record[1],'definition':d['index'],'stableId':d['id'],'sprite':d['sprite'],'flags':d['flags'],'drop':record[5],'mainGunTarget':not bool(d['flags']&16)}
            if record[5]>=0:rows.append(row)
            if d['flags']&0x200:automatic.append(row)
    return {'explicitCount':len(rows),'explicitByDrop':dict(sorted(collections.Counter(r['drop'] for r in rows).items())),
            'automaticPlacementCount':len(automatic),'automaticDefinitions':len(set(r['definition'] for r in automatic)),
            'explicit':rows,'automatic':automatic}
if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('directory',type=Path);a=p.parse_args();d=audit(a.directory)
    (ROOT/'docs/drop-catalog.json').write_text(json.dumps(d,indent=2),encoding='utf-8')
    print(json.dumps({k:v for k,v in d.items() if k not in ('explicit','automatic')}))
