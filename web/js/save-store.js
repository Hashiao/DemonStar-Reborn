/* SPDX-License-Identifier: MIT. 版本化本地关卡档 / Versioned local stage saves. */
(() => {
  const KEY='demonstar-stage-saves-v1';
  class SaveStore {
    constructor(storage){this.storage=storage;this.error=null;this.slots={};try{const data=JSON.parse(storage.getItem(KEY)||'null');if(data?.version===1)for(const id of ['auto','1','2','3']){const slot=data.slots?.[id];if(slot&&StarfallCore.validCheckpoint(slot.checkpoint))this.slots[id]=slot;}}catch{this.error='read';}}
    get(id){return this.slots[id]?JSON.parse(JSON.stringify(this.slots[id])):null;}
    write(id,checkpoint){
      if(!['auto','1','2','3'].includes(String(id))||!StarfallCore.validCheckpoint(checkpoint))return false;
      const next={...this.slots,[id]:{savedAt:new Date().toISOString(),checkpoint:JSON.parse(JSON.stringify(checkpoint))}};
      try{this.storage.setItem(KEY,JSON.stringify({version:1,slots:next}));this.slots=next;this.error=null;return true;}catch{this.error='write';return false;}
    }
  }
  globalThis.DemonStarSaveStore=SaveStore;
})();
