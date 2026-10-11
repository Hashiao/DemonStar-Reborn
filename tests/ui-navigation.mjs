// 测试通过实际按钮走分类菜单；不绕过应用路由。 / Tests navigate real category buttons, without bypassing app routing.
const categories={'language':'language','music-toggle':'audio','music-volume':'audio','sfx-toggle':'audio','sfx-volume':'audio','haptic-toggle':'audio','health-toggle':'display','boss-health-toggle':'display','retain-levels':'rules'};
export async function setting(page,id){
 for(let i=0;i<6;i++){
  if(await page.locator('#'+id).count())return page.locator('#'+id);
  const category=categories[id];
  if(category&&await page.locator('#settings-'+category).count()){await page.locator('#settings-'+category).click();continue;}
  if(await page.locator('#pause-settings').count()){await page.locator('#pause-settings').click();continue;}
  if(!await page.locator('#dialog').isVisible()){await page.locator('#settings').click();continue;}
  await page.keyboard.press('Escape');
 }
 throw new Error('Setting not reachable: '+id);
}
// 既有按住/固定摇杆用例显式选择兼容模式；新默认由独立回归覆盖。 / Legacy hold/fixed regressions opt in; separate tests cover the new defaults.
export async function finishSetup(page,{fixed=false}={}){await page.evaluate(fixed=>{for(let i=0;i<2;i++){StarfallApp.input.setFireMode(i,'hold');if(fixed)StarfallApp.input.config.players[i].touch='fixed';}},fixed);await page.locator('#setup-start').click();}
export async function routedButton(page,name){
 const button=page.getByRole('button',{name,exact:true});
 for(let i=0;i<5&&!await button.count();i++)await page.keyboard.press('Escape');
 return button;
}
