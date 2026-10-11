// 开火模式和实体输入独立，覆盖暂停、死亡、设置与多设备边沿。 / Separate latched and physical input across pause, death, settings and devices.
import test from 'node:test';import assert from 'node:assert/strict';import '../web/js/input.js';
const {Input,preferences}=DemonStarInput,key=code=>({code});
test('fresh and all pre-v3 players default to floating/toggle without losing bindings',()=>{
 const p=preferences({version:2,count:2,players:[{touch:'fixed',bindings:{fire:['key:KeyF']}},{touch:'dpad'}]});assert.ok(p.players.every(p=>p.touch==='floating'&&p.fireMode==='toggle'));assert.deepEqual(p.players[0].bindings.fire,['key:KeyF']);p.players[0].touch='fixed';p.players[1].fireMode='hold';assert.deepEqual(preferences(p),p);assert.ok(preferences().players.every(p=>p.touch==='floating'&&p.fireMode==='toggle'));
});
test('keyboard repeat and release do not retoggle; a second distinct press stops firing',()=>{
 const i=new Input();i.key(key('KeyZ'),true);for(let n=0;n<10;n++){i.key(key('KeyZ'),true);i.sample();i.commit();}i.key(key('KeyZ'),false);assert.equal(i.sample().players[0].fire,true);i.key(key('KeyZ'),true);i.key(key('KeyZ'),false);assert.equal(i.sample().players[0].fire,false);
});
test('touch and mouse share each player’s toggle while players remain independent',()=>{
 const i=new Input({count:2,mousePlayer:1});i.touchFire(0,1,true);i.touchFire(0,1,true);i.touchFire(0,1,false);i.touchFire(1,2,true);i.touchFire(1,2,false);assert.ok(i.sample().players.every(p=>p.fire));i.mouseButton(0,true);i.mouseButton(0,true);i.mouseButton(0,false);assert.deepEqual(i.sample().players.map(p=>p.fire),[false,true]);i.mouseButton(0,true);i.mouseButton(0,false);assert.ok(i.sample().players.every(p=>p.fire));
});
test('pause preserves toggles; changing either direction clears the old request and held inputs',()=>{
 const i=new Input();i.touchFire(0,1,true);i.touchFire(0,1,false);i.clear(true);assert.equal(i.sample([],[],false).players[0].fire,true);assert.equal(i.sample().players[0].fire,true);i.setFireMode(0,'hold');assert.equal(i.sample().players[0].fire,false);i.key(key('KeyZ'),true);assert.equal(i.sample().players[0].fire,true);i.setFireMode(0,'toggle');assert.equal(i.sample().players[0].fire,false);i.clear();assert.equal(i.firing(0),false);assert.equal(new Input(i.export()).firing(0),false);
});
test('death clears only its owner, blocks respawn activation, and a new stage clears all',()=>{
 const i=new Input({count:2}),players=[{lives:4,respawn:0},{lives:4,respawn:0}];i.sample([],players);i.pulse(0,'fire');i.pulse(1,'fire');players[1].lives--;players[1].respawn=1;i.sample([],players);i.pulse(1,'fire');assert.deepEqual(i.sample([],players).players.map(p=>p.fire),[true,false]);players[1].respawn=0;i.sample([],players);assert.equal(i.firing(1),false);i.pulse(1,'fire');assert.equal(i.firing(1),true);i.clear();assert.ok(i.sample([],players).players.every(p=>!p.fire));
});
test('gamepad button edges toggle once, ignore menus and require release after a mode change',()=>{
 const i=new Input(),pad={connected:true,axes:[0,0],buttons:Array.from({length:16},()=>({pressed:false}))};i.sample([pad]);pad.buttons[0].pressed=true;for(let n=0;n<10;n++)assert.equal(i.sample([pad]).players[0].fire,true);pad.buttons[0].pressed=false;i.sample([pad]);assert.equal(i.firing(0),true);i.setFireMode(0,'hold');pad.buttons[0].pressed=true;assert.equal(i.sample([pad]).players[0].fire,false);pad.buttons[0].pressed=false;i.sample([pad]);pad.buttons[0].pressed=true;assert.equal(i.sample([pad]).players[0].fire,true);i.setFireMode(0,'toggle');pad.buttons[0].pressed=false;i.sample([pad],[],false);pad.buttons[0].pressed=true;i.sample([pad],[],false);assert.equal(i.firing(0),false);i.sample([pad]);assert.equal(i.firing(0),false);
});
