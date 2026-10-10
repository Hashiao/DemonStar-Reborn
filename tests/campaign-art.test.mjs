// 全战役覆盖与红色光束回归。 / Campaign coverage and red-beam regressions.
import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {createHash} from 'node:crypto';
import '../web/js/campaign.js';import '../web/js/campaign-art.js';import '../web/js/enemy-art.js';import '../web/js/enemy-shots.js';import '../web/js/player-rules.js';import '../web/js/projectile-rules.js';import '../web/js/original-rules.js';
const C=DemonStarCampaign,A=DemonStarCampaignArt,S=DemonStarEnemyShots,{Game,Gun,STEP}=StarfallCore;
test('all 387 definitions and 18 campaign maps resolve explicitly',()=>{
 assert.equal(C.definitions.length,387);assert.equal(Object.keys(A.routes).length,251);assert.equal(Object.keys(A.sprites).length,213);
 const names=new Set();for(const stage of C.levels)for(const row of stage.events){const name=C.definitions[C.byId[row[2]]].sprite;names.add(name);assert.ok(A.routes[name],`stage ${stage.id}: ${name}`);const asset=A.sprites[name]?.asset;if(asset)assert.ok(A.stageAssets[stage.id].includes(asset));}
 assert.equal(names.size,244);for(const d of C.definitions)assert.ok(A.routes[d.sprite]);
});
test('redraw hashes and crop bounds match packaged atlases',()=>{
 const assets={...A.assets,...S.assets};for(const [path,s] of Object.entries(assets)){const bytes=readFileSync(new URL('../web/'+path,import.meta.url));assert.equal(createHash('sha256').update(bytes).digest('hex'),s.sha256);assert.deepEqual([bytes.readUInt32BE(16),bytes.readUInt32BE(20)],s.size);}
 const check=(asset,crop)=>{const [w,h]=assets[asset].size,[x,y,cw,ch]=crop;assert.ok(x>=0&&y>=0&&cw>0&&ch>0&&x+cw<=w&&y+ch<=h);};
 for(const s of Object.values(A.sprites))if(s.asset){check(s.asset,s.crop);if(s.head){check(s.asset,s.head.crop);assert.ok(s.head.pivot.every(v=>v>=0&&v<=1));}}
 for(const s of Object.values(S.shots)){for(const f of s.frames||[])check(f.asset,f.crop);if(s.cap)check(s.cap.asset,s.cap.crop);}
});
test('all 15 used enemy shot types have specific art, including diagonal missiles',()=>{
 const used=[...new Set(C.definitions.flatMap(d=>d.guns.map(g=>g[2])))].sort((a,b)=>a-b);assert.deepEqual(used,[0,1,2,3,7,8,9,10,11,12,40,41,42,43,44]);for(const t of used)assert.ok(S.shots[t]);assert.equal(S.shots[10].frameCount,5);assert.notDeepEqual(S.shots[43].frames,S.shots[44].frames);
});
test('stage-two ground silhouettes and five stationary bases cannot route to generic planes',()=>{
 for(const name of ['G_STAT1A','G_STAT2A','G_TNK1A','G_TNK2A','G_TNKSHT1A','G_TUR1A','G_RADAR1A'])assert.equal(A.routes[name].kind,'campaign');
 assert.deepEqual(Object.keys(A.sprites).filter(n=>A.sprites[n].head).sort(),['G_TUR1A','G_TNKSHT1A','S_STAT9A','S2_SHIP29A','S2_SHIP31A'].sort());
 for(const name of ['S_ORCPIC1','S_ORCPIC2','S_ORCPIC3','S_ORCPIC4'])assert.equal(A.sprites[name].kind,'ore');
});
test('red laser follows its muzzle for five frames and keeps original damage',()=>{
 const g=new Game(19);g.start();g.recordEvents=[];g.player.invincible=999;const d=C.definitions.find(d=>d.guns.some(r=>r[2]===10));g.spawnRecord([200,0,d.id,0,1,-1,0,0]);const e=g.enemies.at(-1);Object.assign(e,{x:200,y:80,entered:true,pathFinished:true,exitX:0,exitY:0,guns:[]});
 const raw=d.guns.find(r=>r[2]===10).slice();raw[4]=raw[5]=0;new Gun(raw).tick(e,g);const b=g.bullets[0];assert.ok(b?.beam);assert.equal(b.beamFrames,5);assert.equal(b.damage,DemonStarPlayerRules.damage[10]);assert.equal(b.damage,16);
 e.x+=20;g.update(STEP);assert.equal(b.x,e.x+b.offsetX);for(let i=0;i<3;i++){g.update(STEP);assert.ok(g.bullets.includes(b));}g.update(STEP);assert.ok(!g.bullets.includes(b));
});
