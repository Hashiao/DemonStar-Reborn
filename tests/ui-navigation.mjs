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
export async function finishSetup(page){await page.locator('#new-run').click();await page.locator('#setup-start').click();}
export async function routedButton(page,name){
 const button=page.getByRole('button',{name,exact:true});
 for(let i=0;i<5&&!await button.count();i++)await page.keyboard.press('Escape');
 return button;
}
