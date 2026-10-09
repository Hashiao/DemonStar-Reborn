"""Publish an already-verified milestone with matching Android/iOS binaries.

Creates a draft first, validates every uploaded digest, then publishes. Never
replaces an asset or tag belonging to an existing published release.
"""
import argparse, hashlib, json, pathlib, plistlib, subprocess, sys, urllib.error, urllib.parse, urllib.request, zipfile
from github_api import GitHub

ROOT=pathlib.Path(__file__).resolve().parents[1]
REPO='Hashiao/DemonStar-Reborn'

def main():
    p=argparse.ArgumentParser();p.add_argument('--tag',required=True);p.add_argument('--build-sha',required=True);p.add_argument('--notes',type=pathlib.Path,required=True);args=p.parse_args()
    if subprocess.check_output(['git','status','--porcelain'],cwd=ROOT,text=True).strip():raise RuntimeError('Commit milestone source and documentation before publishing.')
    head=subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip()
    # Documentation/release tooling can be committed after the binary build.
    changed=subprocess.check_output(['git','diff','--name-only',args.build_sha,head,'--','web','android','ios','package.json','pnpm-lock.yaml','tools/sync.mjs','tools/generate-ios-project.py'],cwd=ROOT,text=True).strip()
    if changed:raise RuntimeError('Application source changed after the verified binary build.')
    paths=[ROOT/'artifacts/DemonStar-Reborn-release.apk',ROOT/'artifacts/DemonStar.ipa',ROOT/'artifacts/verification.json']
    if not all(p.is_file() for p in paths):raise RuntimeError('Both APK and IPA plus verification.json are required.')
    verification=json.loads(paths[2].read_text(encoding='utf-8'))
    if verification.get('status')!='passed' or verification.get('source_commit')!=args.build_sha:raise RuntimeError('Verification does not match the build commit.')
    with zipfile.ZipFile(paths[0]) as apk:
        if 'AndroidManifest.xml' not in apk.namelist():raise RuntimeError('Not an APK')
    with zipfile.ZipFile(paths[1]) as ipa:
        info=plistlib.loads(ipa.read('Payload/DemonStar.app/Info.plist'))
        if info.get('CFBundleSupportedPlatforms')!=['iPhoneOS'] or info.get('MinimumOSVersion')!='12.0':raise RuntimeError('IPA is not an iOS 12+ device build')
    checksum=ROOT/'artifacts/SHA256SUMS.txt'
    checksum.write_text(''.join(hashlib.sha256(p.read_bytes()).hexdigest()+'  '+p.name+'\n' for p in paths),encoding='ascii');paths.append(checksum)
    api=GitHub();base='/repos/'+REPO
    releases=api.request(base+'/releases?per_page=100');release=next((r for r in releases if r['tag_name']==args.tag),None)
    notes=args.notes.read_text(encoding='utf-8')+'\n\n源码提交：`'+head+'`\n构建与验收提交：`'+args.build_sha+'`\n'
    if release is None:release=api.request(base+'/releases','POST',{'tag_name':args.tag,'target_commitish':head,'name':'恶魔之星·重生 '+args.tag+' · M2.1 飞行与声音修正','body':notes,'draft':True,'prerelease':False})
    for file in paths:
        data=file.read_bytes();expected='sha256:'+hashlib.sha256(data).hexdigest();asset=next((a for a in release['assets'] if a['name']==file.name),None)
        if asset is None:
            if not release['draft']:raise RuntimeError('Published release is missing an asset; create a new version.')
            asset=api.request(release['upload_url'].split('{')[0]+'?name='+urllib.parse.quote(file.name),'POST',data,'application/octet-stream')
        if asset.get('size')!=len(data) or asset.get('digest')!=expected:raise RuntimeError('Asset verification failed: '+file.name)
    if release['draft']:release=api.request(base+'/releases/'+str(release['id']),'PATCH',{'draft':False,'body':notes,'make_latest':'true'})
    for file in paths:
        url='https://github.com/'+REPO+'/releases/download/'+args.tag+'/'+urllib.parse.quote(file.name)
        with urllib.request.urlopen(url,timeout=120) as response:actual=hashlib.file_digest(response,'sha256').hexdigest()
        if actual!=hashlib.sha256(file.read_bytes()).hexdigest():raise RuntimeError('Public download checksum mismatch: '+file.name)
    print(json.dumps({'release':release['html_url'],'assets':[p.name for p in paths]}))

if __name__=='__main__':
    try:main()
    except urllib.error.HTTPError as error:sys.exit('GitHub HTTP '+str(error.code)+'; credential and response body omitted')
