import test from 'node:test';
import assert from 'node:assert/strict';
import '../web/js/input.js';
const {Input,preferences}=DemonStarInput;
const key=code=>({code});
test('cooperative defaults do not share directional keys and cap diagonal speed',()=>{
  const i=new Input({count:4});i.key(key('KeyW'),true);i.key(key('KeyD'),true);i.key(key('ArrowLeft'),true);const s=i.sample();assert.ok(Math.abs(Math.hypot(s.players[0].x,s.players[0].y)-1)<1e-9);assert.equal(s.players[1].x,-1);assert.equal(s.players[2].x,0);assert.equal(s.players[3].x,0);
});
test('short fire and bomb taps survive release until the next simulation step',()=>{
  const i=new Input();i.key(key('KeyZ'),true);i.key(key('KeyZ'),false);i.key(key('KeyX'),true);i.key(key('KeyX'),false);const a=i.sample().players[0];assert.ok(a.fire);assert.ok(a.bomb>0);assert.equal(i.sample().players[0].bomb,a.bomb);i.commit();assert.equal(i.sample().players[0].fire,false);assert.equal(i.sample().players[0].bomb,0);
});
test('keyboard, mouse and gamepad bindings persist independently and conflicts are rejected',()=>{
  const i=new Input({count:2});assert.ok(i.bind(0,'fire','key:KeyF'));assert.ok(i.bind(0,'bomb','mouse:1'));assert.ok(i.bind(1,'fire','pad:2'));assert.equal(i.bind(1,'left','key:KeyF'),false);assert.equal(i.bind(0,'bomb','key:Escape'),false);
  const restored=new Input(i.export());assert.ok(restored.bindings(0).fire.includes('key:KeyF'));assert.ok(restored.bindings(0).fire.includes('pad:0'));assert.ok(restored.bindings(0).bomb.includes('mouse:1'));assert.ok(restored.bindings(1).fire.includes('pad:2'));
});
test('controller dead zone, disconnect and focus release do not leave stuck inputs',()=>{
  const i=new Input({count:2}),pad={connected:true,axes:[0,0],buttons:Array.from({length:16},()=>({pressed:false,value:0}))};i.sample([pad]);pad.axes=[.1,.1];assert.equal(i.sample([pad]).players[0].x,0);pad.axes=[1,0];pad.buttons[0].pressed=true;assert.equal(i.sample([pad]).players[0].fire,true);assert.equal(i.sample([]).players[0].fire,false);
  i.clear();assert.equal(i.sample([pad]).players[0].fire,false);pad.axes=[0,0];pad.buttons[0].pressed=false;i.sample([pad]);pad.buttons[0].pressed=true;assert.equal(i.sample([pad]).players[0].fire,true);
});
test('two touch players retain independent sticks, fire contacts and bomb commands',()=>{
  const i=new Input({count:2});i.move(0,1,0);i.move(1,-1,0);i.touchFire(0,11,true);i.touchFire(1,22,true);i.pulse(0,'bomb');i.pulse(1,'bomb');let s=i.sample();assert.equal(s.players[0].x,1);assert.equal(s.players[1].x,-1);assert.ok(s.players.every(p=>p.fire&&p.bomb));assert.notEqual(s.players[0].bomb,s.players[1].bomb);
  i.commit();i.touchFire(0,11,false);i.move(0,0,0);s=i.sample();assert.equal(s.players[0].fire,false);assert.equal(s.players[1].fire,true);assert.equal(s.players[1].x,-1);
});
test('mouse follows at bounded velocity and disables after keyboard or lifecycle reset',()=>{
  const i=new Input({mousePlayer:1});i.mouseTarget={x:400,y:0};const players=[{x:200,y:300}];let p=i.sample([],players).players[0];assert.ok(Math.hypot(p.x,p.y)<=1.000001);i.key(key('KeyA'),true);assert.equal(i.mouseTarget,null);i.clear();assert.equal(i.sample([],players).players[0].x,0);
});
test('invalid preferences recover while intentional disabled controller remains disabled',()=>{
  const p=preferences({count:200,players:[{touch:'invalid',pad:-1,bindings:{fire:['bad','key:KeyF',null]},size:-5}]});assert.equal(p.count,4);assert.equal(p.players[0].pad,-1);assert.equal(p.players[0].touch,'fixed');assert.equal(p.players[0].size,.75);assert.deepEqual(p.players[0].bindings.fire,['key:KeyF']);
});
test('configuring a not-yet-active second player still rejects its own action conflicts',()=>{const i=new Input({count:1});assert.equal(i.bind(1,'fire','key:KeyR'),true);assert.equal(i.bind(1,'bomb','key:KeyR'),false);assert.equal(i.bind(99,'fire','key:KeyR'),false);});
test('enabling two players preserves the solo controller and disables a duplicate second assignment',()=>{const i=new Input({count:1,players:[{pad:1},{pad:1}]});assert.equal(i.config.players[1].pad,1);assert.deepEqual(i.setCount(2),[1]);assert.equal(i.config.players[0].pad,1);assert.equal(i.config.players[1].pad,-1);const loaded=new Input({count:2,players:[{pad:0},{pad:0}]});assert.equal(loaded.config.players[1].pad,-1);});
test('mouse ownership includes P2 defaults and maps a LAN device to its sole local stream',()=>{const i=new Input({count:2,mousePlayer:2});i.mouse.add(0);i.mouse.add(2);let s=i.sample();assert.equal(s.players[0].fire,false);assert.equal(s.players[0].bomb,0);assert.equal(s.players[1].fire,true);assert.ok(s.players[1].bomb);i.localOnly=true;i.setCount(1);i.mouse.add(0);i.mouse.add(2);i.mouseTarget={x:350,y:100};s=i.sample([],[{id:2,x:200,y:300}]);assert.equal(i.mouseOwner,1);assert.ok(s.players[0].fire&&s.players[0].bomb&&s.players[0].x>0&&s.players[0].y<0);assert.equal(i.export().mousePlayer,2);i.localOnly=false;assert.equal(i.mouseOwner,2);});
test('legacy P2 keyboard remaps gain missing mouse defaults without replacing deliberate mappings',()=>{const i=new Input({version:1,count:2,players:[{},{bindings:{fire:['key:KeyR','pad:0'],bomb:['key:KeyT','pad:1']}}]});assert.equal(i.export().version,2);assert.ok(i.bindings(1).fire.includes('mouse:0'));assert.ok(i.bindings(1).bomb.includes('mouse:2'));assert.ok(i.bindings(1).fire.includes('key:KeyR'));const custom=new Input({version:1,players:[{},{bindings:{fire:['mouse:3'],bomb:[]}}]});assert.deepEqual(custom.bindings(1).fire,['mouse:3']);assert.deepEqual(custom.bindings(1).bomb,[]);assert.deepEqual(new Input(i.export()).export(),i.export());});
