"""Minimal GitHub API helper using the existing Git credential manager session."""
import json, os, subprocess, urllib.error, urllib.parse, urllib.request

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
            with urllib.request.urlopen(url,timeout=120) as response:destination.write_bytes(response.read())

