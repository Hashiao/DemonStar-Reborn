"""Create a project-specific local release key. Never outputs signing passwords."""
import argparse, os, pathlib, secrets, subprocess
root=pathlib.Path(__file__).resolve().parents[1]
parser=argparse.ArgumentParser();parser.add_argument('--keytool',required=True);args=parser.parse_args()
private=root/'.local';private.mkdir(exist_ok=True)
key=private/'demonstar-release.p12';props=private/'release-signing.properties'
if props.exists() and key.exists(): print('Existing project release key retained.');raise SystemExit(0)
if props.exists() or key.exists(): raise SystemExit('Incomplete existing signing material; refusing to overwrite.')
password=secrets.token_urlsafe(40)
result=subprocess.run([args.keytool,'-genkeypair','-keystore',str(key),'-storetype','PKCS12','-alias','demonstar','-storepass:env','DEMONSTAR_SIGNING_PASSWORD','-keypass:env','DEMONSTAR_SIGNING_PASSWORD','-dname','CN=DemonStar Reborn,OU=Open Source,O=Hashiao','-keyalg','RSA','-keysize','3072','-validity','10000'],env={**os.environ,'DEMONSTAR_SIGNING_PASSWORD':password},capture_output=True,text=True)
if result.returncode: raise SystemExit('Key generation failed; no credentials were printed.')
props.write_text('storeFile=../.local/demonstar-release.p12\nstorePassword='+password+'\nkeyPassword='+password+'\nkeyAlias=demonstar\n',encoding='utf-8')
print('Created independent DemonStar release key in ignored .local/. Back it up privately.')
