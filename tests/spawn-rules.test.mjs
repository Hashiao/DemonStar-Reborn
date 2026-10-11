import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import '../web/js/enemy-art.js';import '../web/js/campaign.js';import '../web/js/player-rules.js';import '../web/js/projectile-rules.js';import '../web/js/weapon-art.js';import '../web/js/original-rules.js';import '../web/js/network-state.js';

// 使用实施前按原程序恢复的清单作为独立金标，不在测试中重写准入公式。
// Use the pre-implementation native ledger, not a duplicated eligibility formula.
const ledger=readFileSync(new URL('../docs/original-stage-design/data/placements.jsonl',import.meta.url),'utf8').trim().split('\n').map(JSON.parse);
const {Game,STEP}=StarfallCore,C=DemonStarCampaign,N=DemonStarNetworkState;

for(let stage=1;stage<=18;stage++)for(let difficulty=0;difficulty<4;difficulty++)for(const players of [1,2]){
  test(`original spawn ledger: stage ${stage}, difficulty ${difficulty}, ${players} player(s)`,()=>{
    const rows=ledger.filter(r=>r.stage===stage),mask=players===1?'solo_ENHI':'two_active_ENHI';
    const expected=rows.filter(r=>r[mask][difficulty]==='1'),seen=[],g=new Game(17);
    g.start(difficulty,stage,false,{playerCount:players});
    assert.deepEqual(g.recordEvents,C.levels[stage-1].events);
    const byRecord=new Map(g.recordEvents.map((r,i)=>[r,rows[i]])),spawn=g.spawnRecord.bind(g);
    g.spawnRecord=(record,offset)=>{
      const row=byRecord.get(record);spawn(record,offset);const e=g.enemies.at(-1);
      assert.equal(g.scroll,row.trigger_scroll,row.record_id+' trigger');
      assert.deepEqual([e.x,e.y],[row.spawn_x,row.spawn_y],row.record_id+' position');
      if(row.first_path_target_x!==null)assert.deepEqual([e.pathX,e.pathY],[row.first_path_target_x,row.first_path_target_y],row.record_id+' first target');
      seen.push(row.record_id);g.enemies=[];
    };
    for(g.scroll=0;g.scroll<=rows.at(-1).trigger_scroll;g.scroll++)g.dispatchRecords();
    assert.deepEqual(seen,expected.map(r=>r.record_id));assert.equal(g.cursor,rows.length);
    g.dispatchRecords();assert.equal(seen.length,expected.length);
  });
}

test('third-stage formation enters as one batch at distinct original heights',()=>{
  const g=new Game(1);g.start(1,3);g.recordEvents=C.levels[2].events.slice(79,84);g.scroll=1191;
  g.dispatchRecords();assert.equal(g.enemies.length,0);g.scroll++;g.dispatchRecords();
  assert.equal(g.cursor,5);assert.deepEqual(g.enemies.map(e=>[e.x,e.y]),[[168,-192],[168,-224],[168,-256],[168,-288],[168,-320]]);
});

test('supply side follows fixed records, including right-only solo waves',()=>{
  const supply=(g,stage,ys)=>{g.recordEvents=C.levels[stage-1].events.filter(r=>ys.includes(r[1])&&C.definitions[C.byId[r[2]]].sprite.startsWith('S_ENBON'));g.scroll=Math.max(...ys);g.dispatchRecords();return g.enemies.map(e=>e.originX);};
  for(const difficulty of [0,1,2]){
    const first=new Game(1);first.start(difficulty,1);assert.deepEqual(supply(first,1,[1064,1080]),[136]);
    const right=new Game(1);right.start(difficulty,1);assert.deepEqual(supply(right,1,[2520,2544]),[336]);
    const third=new Game(1);third.start(difficulty,3);assert.deepEqual(supply(third,3,[1144,1184]),[280]);
  }
  const insane=new Game(1);insane.start(3,1);assert.deepEqual(supply(insane,1,[2520,2544]),[336,80]);
  const two=new Game(1);two.start(1,1,false,{playerCount:2});assert.deepEqual(supply(two,1,[2520,2544]),[336,80]);
});

test('active-player gates include respawning players but exclude elimination and disconnection',()=>{
  const g=new Game(1);g.start(1,1,false,{playerCount:2});g.recordEvents=[8,16,24,32].map(y=>[136,y,86,0,1,2,0,8]);
  const p=g.players[1];p.respawn=1;g.scroll=8;g.dispatchRecords();assert.equal(g.enemies.length,1);
  const original=g.enemies[0];p.lives=0;g.scroll=16;g.dispatchRecords();assert.equal(g.enemies.length,1);
  p.lives=4;p.connected=false;g.scroll=24;g.dispatchRecords();assert.equal(g.enemies.length,1);
  p.connected=true;g.scroll=32;g.dispatchRecords();assert.equal(g.enemies.length,2);assert.equal(g.enemies[0],original);assert.equal(g.cursor,4);
});

test('paused difficulty changes affect future batches without replaying skipped rows',()=>{
  const g=new Game(1);g.start(1,1);g.recordEvents=[[136,8,86,0,1,2,0,4],[280,16,86,0,1,6,0,4]];
  g.scroll=8;g.dispatchRecords();assert.equal(g.cursor,1);assert.equal(g.enemies.length,0);
  g.pause();assert.ok(g.setDifficulty(2));g.resume();g.scroll=16;g.dispatchRecords();
  assert.equal(g.enemies.length,1);assert.equal(g.enemies[0].originX,280);assert.equal(g.cursor,2);
});

test('all twelve difficulty transitions preserve existing enemies and evaluate the next wave live',()=>{
  for(const players of [1,2])for(const flags of [0,4,8,12])for(let from=0;from<4;from++)for(let to=0;to<4;to++){
    if(from===to)continue;
    const reference=ledger.find(r=>r.stage===1&&r.event_flags===flags),mask=reference[players===1?'solo_ENHI':'two_active_ENHI'];
    const g=new Game(1);g.start(from,1,false,{playerCount:players});
    g.recordEvents=[8,16].map(y=>[reference.x,y,reference.definition_id,0,1,reference.explicit_drop_id,0,flags]);
    g.scroll=8;g.dispatchRecords();const before=g.enemies.slice();assert.equal(before.length,Number(mask[from]));
    g.pause();assert.ok(g.setDifficulty(to));assert.equal(g.cursor,1);assert.equal(g.scroll,8);assert.equal(g.checkpoint().difficulty,from);g.resume();
    for(let n=0;n<8;n++)g.update(STEP);
    assert.equal(g.enemies.length,before.length+Number(mask[to]),`${players}p flags ${flags}: ${from}->${to}`);
    for(const e of before)assert.ok(g.enemies.includes(e));assert.equal(g.cursor,2);
  }
});

test('side-entry modes reach the battlefield and ground carriers continue scrolling',()=>{
  for(const mode of [3,6])for(const x of [80,320]){
    const d=C.definitions.find(d=>d.mode===mode&&!((d.flags&16)||(d.flags&1))),g=new Game(1);g.start();g.recordEvents=[];
    g.spawnRecord([x,0,d.id,0,1,-1,0,0]);const e=g.enemies[0];let entered=false;
    for(let n=0;n<550;n++){g.moveEnemy(e,STEP);g.updateEnemyState(e);entered||=e.entered===true;}
    assert.ok(entered,`mode ${mode}, side ${x}`);
  }
  const g=new Game(1);g.start(1,2);g.spawnRecord([104,0,87,0,1,10,0,0]);const e=g.enemies[0];
  for(let n=0;n<350;n++)g.moveEnemy(e,STEP);assert.equal(e.y,-192+350);assert.ok(e.y>e.def.height/2+42);
});

test('first path target mirrors separately from later nodes; original records stay intact',()=>{
  const original=JSON.stringify(C),g=new Game(1);g.start();g.spawnRecord(C.levels[0].events[18]);const e=g.enemies[0];
  assert.equal(e.pathX,117);const next=e.def.path[1];g.setPath(e);assert.equal(e.pathX,117-next[0]);assert.equal(JSON.stringify(C),original);
});

test('boss presence does not suppress later map batches; pause still freezes dispatch',()=>{
  const g=new Game(1);g.start(1,2);g.player.invincible=999;g.scroll=5110;g.cursor=g.recordEvents.findIndex(r=>r[1]>=5112);
  for(let i=0;i<4;i++)g.update(STEP);assert.ok(g.bossSpawned);const cursor=g.cursor;
  g.pause();g.update(.25);assert.equal(g.cursor,cursor);g.resume();
  for(let i=0;i<1280;i++){g.player.invincible=999;g.update(STEP);}
  assert.equal(g.cursor,C.levels[1].events.length);assert.ok(g.scroll>5112);
});

test('checkpoint reload resets raw scheduler and authoritative snapshots retain grouped positions',()=>{
  const host=new Game(1);host.start(2,3,false,{playerCount:2,mode:'lan'});const save=host.checkpoint();
  host.scroll=1192;host.dispatchRecords();assert.ok(host.cursor>0);assert.ok(host.loadCheckpoint(save,false));
  assert.equal(host.cursor,0);assert.equal(host.scroll,0);assert.equal(host.difficulty,2);assert.deepEqual(host.recordEvents,C.levels[2].events);
  host.recordEvents=C.levels[2].events.slice(79,84);host.dispatchRecords();assert.equal(host.enemies.length,0);
  host.scroll=1192;host.dispatchRecords();const client=new Game(9);assert.ok(N.apply(client,N.encode(host),false));
  assert.deepEqual(client.enemies.map(e=>[e.def.id,e.x,e.y]),host.enemies.map(e=>[e.def.id,e.x,e.y]));
  host.phase='cleared';assert.ok(host.nextStage());assert.equal(host.cursor,0);assert.equal(host.stage.id,4);assert.deepEqual(host.recordEvents,C.levels[3].events);
});
