import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import '../web/js/i18n.js';
const I=DemonStarI18n;
test('first-run locale distinguishes script, region and non-Chinese languages',()=>{
  for(const [tag,want] of [['zh-CN','zh-Hans'],['zh-SG','zh-Hans'],['zh','zh-Hans'],['zh_TW','zh-Hant'],['zh-HK','zh-Hant'],['zh-MO','zh-Hant'],['zh-Hant','zh-Hant'],['zh-Hans-HK','zh-Hans'],['zh-Hant-CN','zh-Hant'],['en-US','en'],['ja-JP','en'],['fr-FR','en'],['','en']])assert.equal(I.detect(tag),want,tag);
});
test('valid saved language wins over later system changes; corrupt values recover',()=>{
  assert.equal(I.resolve('en','zh-TW'),'en');assert.equal(I.resolve('zh-Hant','en-US'),'zh-Hant');assert.equal(I.resolve('invalid','zh-CN'),'zh-Hans');assert.equal(I.resolve(null,'zh-HK'),'zh-Hant');
  I.select('zh-Hant');assert.equal(I.select('bad'),false);assert.equal(I.locale,'zh-Hant');
});
test('native local URL preference wins over WebView default, while browser uses its first preference',()=>{
  const code=readFileSync(new URL('../web/js/i18n.js',import.meta.url),'utf8');
  const preferred=(hash,languages)=>{const c=vm.createContext({location:{hash},navigator:{languages,language:'en-US'}});vm.runInContext(code,c);return c.DemonStarI18n.preferred();};
  assert.equal(preferred('#system-language=zh-Hant-HK',['en-US']),'zh-Hant-HK');assert.equal(preferred('',['fr-FR','zh-TW']),'fr-FR');assert.equal(preferred('#system-language=%EA',['zh-CN']),'zh-CN');
});
test('three catalogs have complete matching keys and interpolation placeholders',()=>{
  const keys=Object.keys(I.messages.en);assert.ok(keys.length>100);
  for(const locale of I.locales){assert.deepEqual(Object.keys(I.messages[locale]),keys);for(const key of keys){assert.ok(I.messages[locale][key].trim(),key);assert.deepEqual((I.messages[locale][key].match(/\{\w+\}/g)||[]).sort(),(I.messages.en[key].match(/\{\w+\}/g)||[]).sort(),locale+':'+key);}}
});
test('Traditional Chinese uses local game terminology and rewrites instructions',()=>{
  I.select('zh-Hant');assert.equal(I.t('settings'),'設定');assert.equal(I.t('weapon2'),'電漿砲');assert.equal(I.t('gearMissile',{n:50}),'飛彈 50');assert.match(I.t('guideHtml'),/空白鍵/);assert.match(I.t('guideHtml'),/連吃同色能量球/);assert.equal(I.t('quitTitle'),'結束這次出擊？');
});
test('localized text interpolates numbers without changing gameplay values',()=>{
  for(const locale of I.locales){I.select(locale);assert.ok(I.t('bombAria',{n:3}).includes('3'));assert.ok(I.t('weaponLevel',{name:I.t('weapon2'),n:6}).includes('6'));assert.equal(I.t('bonusBombs',{n:3}).includes('1000'),true);}
});
test('all HTML localization markers reference real catalog entries',()=>{
  const html=readFileSync(new URL('../web/index.html',import.meta.url),'utf8');for(const [,key] of html.matchAll(/data-i18n(?:-html|-aria)?="([^"]+)"/g))assert.ok(I.messages.en[key],key);assert.ok(html.includes('js/i18n.js'));assert.ok(!/[\u4e00-\u9fff]/.test(html));
});
