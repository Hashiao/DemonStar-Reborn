import { cp, mkdir, readdir, readFile, writeFile, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { transform } from 'esbuild';
const root=new URL('../',import.meta.url);
const targets=['android/app/src/main/assets/','ios/DemonStar/Web/'];
const dist=new URL('dist/',root);
await mkdir(dist,{recursive:true});await cp(new URL('web/',root),dist,{recursive:true});
for(const name of await readdir(new URL('js/',dist))){if(!name.endsWith('.js'))continue;const url=new URL('js/'+name,dist);const source=await readFile(url,'utf8');const result=await transform(source,{target:['safari12','chrome74'],charset:'utf8',legalComments:'inline'});await writeFile(url,result.code);}
for(const target of targets){const absolute=fileURLToPath(new URL(target,root));if(!absolute.startsWith(fileURLToPath(root)))throw new Error('Refusing to modify a path outside this project');await rm(absolute,{recursive:true,force:true});await mkdir(absolute,{recursive:true});await cp(dist,absolute,{recursive:true});console.log('Synced iOS 12 compatible bundle: '+target);}
