"""Fetch an exact successful CI build without forwarding credentials to storage."""
import argparse, json, pathlib, shutil, sys, urllib.error, zipfile
from github_api import GitHub
ROOT=pathlib.Path(__file__).resolve().parents[1]
def main():
    p=argparse.ArgumentParser();p.add_argument('--run',type=int,required=True);p.add_argument('--sha',required=True);args=p.parse_args()
    api=GitHub();base='/repos/Hashiao/DemonStar-Reborn';run=api.request(base+'/actions/runs/'+str(args.run))
    if run['conclusion']!='success' or run['head_sha']!=args.sha:raise RuntimeError('CI build is not a successful build of the requested commit.')
    artifacts=api.request(base+'/actions/runs/'+str(args.run)+'/artifacts')['artifacts'];artifact=next(a for a in artifacts if a['name']=='DemonStar-Reborn-iOS' and not a['expired'])
    destination=ROOT/'.local'/('ios-ci-'+str(args.run));destination.mkdir(parents=True,exist_ok=True);archive=destination/'artifact.zip'
    api.download_artifact(base+'/actions/artifacts/'+str(artifact['id'])+'/zip',archive)
    with zipfile.ZipFile(archive) as z:
        for item in z.infolist():
            if not (destination/item.filename).resolve().is_relative_to(destination.resolve()):raise RuntimeError('Unsafe archive path')
        z.extractall(destination)
    output=ROOT/'artifacts';output.mkdir(exist_ok=True)
    for name in ['DemonStar-Reborn-iOS-unsigned.ipa','ios-verification.json','iPhone.png','iPad.png']:
        files=list(destination.rglob(name))
        if len(files)!=1:raise RuntimeError('Missing or ambiguous artifact: '+name)
        shutil.copyfile(files[0],output/name)
    info=json.loads((output/'ios-verification.json').read_text())
    info.update({'workflow_run':args.run,'source_commit':args.sha,'workflow_url':run['html_url']})
    (output/'ios-verification.json').write_text(json.dumps(info,indent=2),encoding='utf-8')
    print(json.dumps(info,indent=2))
if __name__=='__main__':
    try:main()
    except urllib.error.HTTPError as e:sys.exit('GitHub HTTP '+str(e.code)+'; credentials omitted')
