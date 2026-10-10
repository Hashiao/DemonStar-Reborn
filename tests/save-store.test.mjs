import test from 'node:test';
import assert from 'node:assert/strict';
import '../web/js/enemy-art.js';import '../web/js/campaign.js';import '../web/js/player-rules.js';import '../web/js/projectile-rules.js';import '../web/js/weapon-art.js';import '../web/js/original-rules.js';import '../web/js/save-store.js';
function memory(){const map=new Map();return {getItem:k=>map.get(k),setItem:(k,v)=>map.set(k,v)};}
test('automatic and manual checkpoints survive a new store without sharing mutable state',()=>{
  const g=new StarfallCore.Game(5);g.start(2,8,false,{playerCount:4});const storage=memory(),store=new DemonStarSaveStore(storage);assert.ok(store.write('auto',g.checkpoint()));assert.ok(store.write('2',g.checkpoint()));const reopened=new DemonStarSaveStore(storage);assert.equal(reopened.get('2').checkpoint.stage,8);assert.equal(reopened.get('2').checkpoint.players.length,4);const copy=reopened.get('2');copy.checkpoint.stage=1;assert.equal(reopened.get('2').checkpoint.stage,8);
});
test('quota failure preserves existing saves and corrupt storage does not crash startup',()=>{
  const g=new StarfallCore.Game(1);g.start();const storage=memory(),store=new DemonStarSaveStore(storage);store.write('1',g.checkpoint());storage.setItem=()=>{throw new Error('quota');};g.loadStage(3);assert.equal(store.write('1',g.checkpoint()),false);assert.equal(store.get('1').checkpoint.stage,1);assert.equal(new DemonStarSaveStore({getItem:()=>'{'}).get('1'),null);
});
