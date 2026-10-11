// 全难度及输入方式的穿屏目标；不改变敌人或世界时钟。
// Traversal targets across difficulties and inputs without changing enemies or the world clock.
import test from 'node:test';import assert from 'node:assert/strict';
import '../web/js/enemy-art.js';import '../web/js/campaign.js';import '../web/js/player-rules.js';import '../web/js/projectile-rules.js';import '../web/js/weapon-art.js';import '../web/js/original-rules.js';import '../web/js/input.js';import '../web/js/touch-controls.js';
const {Game,STEP}=StarfallCore,{Input,stickAxes}=DemonStarInput;
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} != ${b}`);
function arena(difficulty=1,count=1){const g=new Game(9);g.start(difficulty,1,false,{playerCount:count});g.recordEvents=[];for(const p of g.players){p.x=16;p.y=64;p.invincible=999;}return g;}
function controls(mode,x,y,g){const input=new Input(),pad={connected:true,axes:[0,0],buttons:[]};input.config.players[0].touch=mode;
 if(mode==='keyboard'){if(x)input.keys.add('key:KeyD');if(y)input.keys.add('key:KeyS');}
 if(['fixed','floating','dpad'].includes(mode)){const length=Math.hypot(x,y)||1,group={index:0,center:{x:0,y:0},stick:{getBoundingClientRect:()=>({width:100})},knob:{style:{}}};DemonStarTouchControls.prototype.move.call({input},group,{clientX:36*x/length,clientY:36*y/length});}
 if(mode==='gamepad'){input.sample([pad],g.players);const length=Math.hypot(x,y)||1;pad.axes=[x/length,y/length];}
 if(mode==='tilt')input.tiltAxes={x,y};
 if(mode==='mouse'){input.config.mousePlayer=1;input.mouseTarget={x:x?384:16,y:y?440:64};}
 if(mode==='point')input.point(0,x?384:16,y?440:64);
 return ()=>input.sample(mode==='gamepad'?[pad]:[],g.players);
}
for(const difficulty of [0,1,2,3])test(`difficulty ${difficulty}: every control reaches horizontal/vertical/diagonal travel targets`,()=>{
 for(const mode of ['keyboard','fixed','floating','dpad','gamepad','tilt','mouse','point'])for(const [x,y] of [[1,0],[0,1],[1,1]]){
  const g=arena(difficulty),sample=controls(mode,x,y,g);let hitX=0,hitY=0;
  for(let tick=1;tick<=50;tick++){g.update(STEP,sample());if(x&&!hitX&&g.player.x>=384-1e-8)hitX=tick;if(y&&!hitY&&g.player.y>=440-1e-8)hitY=tick;}
  if(x)assert.equal(hitX,48,mode+' horizontal');else close(g.player.x,16);
  if(y)assert.equal(hitY,50,mode+' vertical');else close(g.player.y,64);
  close(g.totalTime,1.75);close(g.scroll,50);
 }
});
test('circular analog inputs retain partial amplitude, dead zone and full-speed diagonals',()=>{
 for(const angle of [0,Math.PI/4,Math.PI/2,Math.PI,Math.PI*1.25])for(const radius of [.1,.5,1,2]){
  const raw={x:Math.cos(angle)*radius,y:Math.sin(angle)*radius},a=stickAxes(raw.x,raw.y);close(Math.max(Math.abs(a.x),Math.abs(a.y)),Math.min(radius,1));const b=stickAxes(raw.x,raw.y,.18);close(Math.max(Math.abs(b.x),Math.abs(b.y)),radius<=.18?0:(Math.min(radius,1)-.18)/.82);
 }assert.deepEqual(stickAxes(NaN,1),{x:0,y:0});
 const g=arena(),input=new Input();input.move(0,.5,.5);const before={...g.player};g.update(STEP,input.sample([],g.players));close(g.player.x-before.x,23/6);close(g.player.y-before.y,141/37);
});
test('local players retain independent full diagonal speed through pause difficulty changes and reload',()=>{
 const g=arena(0,2),input=new Input({count:2});input.keys.add('key:KeyD');input.keys.add('key:KeyS');input.move(1,1,1);
 for(const difficulty of [0,1,2,3]){g.pause();g.setDifficulty(difficulty);const before=g.players.map(p=>[p.x,p.y]);g.update(STEP,input.sample([],g.players));assert.deepEqual(g.players.map(p=>[p.x,p.y]),before);g.resume();g.update(STEP,input.sample([],g.players));for(const [i,p] of g.players.entries()){close(p.x-before[i][0],23/3);close(p.y-before[i][1],282/37);}}
 const cp=g.checkpoint();assert.ok(g.loadCheckpoint(cp));const before=g.player.x;g.update(STEP,{x:1});close(g.player.x-before,23/3);
});
test('mouse target override stops on key input and short target steps never overshoot',()=>{
 const g=arena(),input=new Input({mousePlayer:1});input.mouseTarget={x:16.1,y:64.2};g.update(STEP,input.sample([],g.players));close(g.player.x,16.1);close(g.player.y,64.2);input.key({code:'KeyD'},true);assert.equal(input.mouseTarget,null);g.update(STEP,input.sample([],g.players));close(g.player.x,16.1+23/3);
});
