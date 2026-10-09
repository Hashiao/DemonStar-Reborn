"""Minimal GitHub API helper using the existing Git credential manager session."""
import json, os, subprocess, urllib.error, urllib.parse, urllib.request, concurrent.futures, re

def read_download(url, label='Download'):
    """Bounded parallel byte ranges for large, already-authorized package reads.

    No credential headers are forwarded. Each range and final length are checked;
    callers still validate archive contents or the complete SHA-256 digest.
    """
    probe=urllib.request.Request(url,headers={'Range':'bytes=0-0'})
    with urllib.request.urlopen(probe,timeout=120) as response:
        if response.status!=206:return response.read()
        match=re.fullmatch(r'bytes 0-0/(\d+)',response.headers.get('Content-Range',''))
        if not match:raise RuntimeError('Invalid download range response')
        size=int(match.group(1))
        if len(response.read())!=1:raise RuntimeError('Incomplete range probe')
    if size<=0:raise RuntimeError('Empty download')
    count=min(6,max(1,(size+8*1024*1024-1)//(8*1024*1024)));width=(size+count-1)//count
    def part(index):
        start=index*width;end=min(size-1,start+width-1)
        request=urllib.request.Request(url,headers={'Range':f'bytes={start}-{end}'})
        with urllib.request.urlopen(request,timeout=120) as response:
            if response.status!=206 or response.headers.get('Content-Range')!=f'bytes {start}-{end}/{size}':raise RuntimeError('Mismatched download range')
            data=response.read()
        if len(data)!=end-start+1:raise RuntimeError('Incomplete download range')
        return index,data
    chunks=[None]*count
    with concurrent.futures.ThreadPoolExecutor(max_workers=count) as pool:
        futures=[pool.submit(part,i) for i in range(count)]
        for done,future in enumerate(concurrent.futures.as_completed(futures),1):
            index,data=future.result();chunks[index]=data;print(f'{label}: {done}/{count} parts received',flush=True)
    data=b''.join(chunks)
    if len(data)!=size:raise RuntimeError('Incomplete download')
    return data

class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl): return None

class GitHub:
    def __init__(self):
        result=subprocess.run(['git','credential','fill'],input='protocol=https\nhost=github.com\nusername=Hashiao\n\n',text=True,capture_output=True,env={**os.environ,'GCM_INTERACTIVE':'never'},timeout=30)
        if result.returncode: raise RuntimeError('GitHub credential manager login is required.')
        credential=dict(line.split('=',1) for line in result.stdout.splitlines() if '=' in line)
        self._token=credential['password'];self._api=urllib.request.build_opener(NoRedirect())
    def request(self,path,method='GET',data=None,content_type='application/json'):
        url=path if path.startswith('https://') else 'https://api.github.com'+path
        if urllib.parse.urlparse(url).hostname not in ('api.github.com','uploads.github.com'):raise RuntimeError('Unexpected authenticated API destination')
        if data is not None and not isinstance(data,bytes):data=json.dumps(data).encode()
        request=urllib.request.Request(url,data=data,method=method,headers={'Authorization':'Bearer '+self._token,'User-Agent':'DemonStar-Reborn-release','Accept':'application/vnd.github+json','Content-Type':content_type,'X-GitHub-Api-Version':'2022-11-28'})
        with self._api.open(request,timeout=120) as response:return json.load(response)
    def download_artifact(self,path,destination):
        try:self.request(path)
        except urllib.error.HTTPError as e:
            if e.code!=302:raise
            # The GitHub signed storage URL is fetched without any Authorization header.
            url=e.headers['Location']
            destination.write_bytes(read_download(url,'CI artifact'))
