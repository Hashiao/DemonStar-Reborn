/* Original projectile dimensions; generated atlas crop metadata. See docs/ART_EFFECTS.md. */
globalThis.DemonStarCombatVisuals={
 // Newly redrawn atlas; original six-frame rotor and type 11/type 9 shots.
 // Fixed rotor crops keep the central spindle stable while side drums orbit.
 attackCells:[[42,70,240,228],[339,70,240,228],[619,70,240,228],[915,70,240,228],[1198,70,240,228],[1500,70,240,228],[66,348,192,192],[353,348,192,192],[644,348,192,192],[932,348,192,192],[1297,368,59,140],[1591,368,50,140],[135,661,54,115],[435,661,38,115],[677,668,126,109],[975,669,117,103],[1273,675,106,92],[1573,682,87,81]],
 cells:[[130, 109, 26, 95], [409, 83, 28, 141], [687, 55, 30, 194], [974, 95, 16, 129], [1243, 89, 35, 144], [123, 357, 41, 149], [389, 351, 69, 158], [659, 347, 86, 165], [929, 347, 105, 165], [1142, 394, 229, 79], [58, 632, 168, 164], [303, 592, 236, 229], [602, 592, 202, 224], [872, 593, 206, 223], [1153, 592, 207, 226], [45, 863, 195, 219], [389, 897, 64, 165], [659, 878, 93, 193], [887, 882, 182, 189], [1177, 901, 160, 157]],
 shot(type){
  if(type>=26&&type<=28)return {cell:type-26,width:4.5,height:[12,18,24][type-26]};
  const tier=[29,30,31,48,49,50].indexOf(type);
  if(tier>=0)return {cell:3+tier,width:[1.5,4.5,7.5,13.5,16.5,19.5][tier],height:tier===0?21:24};
  if(type>=32&&type<=37)return {cell:4,width:4.5,height:6};
  if(type===61)return {cell:12,width:40,height:48};
  return null;
 }
};
