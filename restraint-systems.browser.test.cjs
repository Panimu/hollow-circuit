const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
const R=require('./restraints');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1050}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
  await page.addInitScript(()=>{Math.random=()=>0;});
  await page.goto(process.env.SYSTEMS_TEST_URL||'http://127.0.0.1:8080/restraint-systems.html');
  await page.waitForFunction(()=>document.querySelector('#status').textContent.startsWith('Ready.'));
  for(const slot of R.slots){
   await page.locator(`[data-slot="${slot}"]`).click();
   assert.equal(await page.locator('#catalog [data-item]').count(),3);
   for(const material of ['rope','leather','steel']){
    await page.locator('#refill').click();
    const id=`${material}-${slot}`;
    await page.locator(`[data-item="${id}"]`).click();
    await page.locator('#apply').click();
    assert.equal(await page.locator(`[data-active="${id}"]`).count(),1);
    assert.equal(await page.locator('#apply').isDisabled(),true);
    await page.locator('#action').selectOption(R.slotRules[slot].action);
    assert.equal(await page.locator('#attempt-action').isDisabled(),true);
    assert.match(await page.locator('#action-status').innerText(),/blocked by/);
    await page.locator(`[data-release="${id}"]`).click();
    assert.equal(await page.locator('#action-status').getAttribute('data-blocked'),'false');
   }
  }
  await page.locator('#refill').click();await page.locator('[data-slot="wrists"]').click();await page.locator('[data-item="leather-wrists"]').click();await page.locator('#apply').click();
  await page.locator('[data-secure="leather-wrists"][data-method="padlock"]').click();
  assert.match(await page.locator('[data-active="leather-wrists"] .location').innerText(),/Padlock/);
  assert.match(await page.locator('#ap').innerText(),/3 \/ 6 AP/);
  await page.locator('[data-target="0"]').click();assert.equal(await page.locator('[data-active]').count(),0);
  await page.locator('[data-slot="mouth"]').click();await page.locator('#apply').click();
  await page.locator('#action').selectOption('spoken');assert.equal(await page.locator('#attempt-action').isDisabled(),true);
  await page.locator('#refill').click();await page.locator('#action').selectOption('pulse');await page.locator('#attempt-action').click();
  assert.match(await page.locator('#ap').innerText(),/5 \/ 6 AP/);
  await page.locator('#save').click();await page.reload();
  assert.equal(await page.locator('[data-active="leather-wrists"]').count(),1);
  await page.locator('[data-target="0"]').click();assert.equal(await page.locator('[data-active="rope-mouth"]').count(),1);
  await page.locator('[data-escape="rope-mouth"]').click();assert.equal(await page.locator('[data-active]').count(),0);
  await page.locator('summary').filter({hasText:'Multi-slot assemblies'}).click();
  await page.locator('#assembly').selectOption('leather-boot-wrap');await page.locator('#apply').click();
  assert.equal(await page.locator('[data-slot][data-occupied="true"]').count(),4);
  await page.locator('[data-slot="ankles"]').click();assert.equal(await page.locator('#apply').isDisabled(),true);
  await page.locator('[data-release="leather-boot-wrap"]').click();assert.equal(await page.locator('[data-slot][data-occupied="true"]').count(),0);
  await page.locator('#refill').click();await page.evaluate(()=>{Math.random=()=>.99999;});await page.locator('#apply').click();
  assert.equal(await page.locator('[data-active]').count(),0);assert.match(await page.locator('#log li').first().innerText(),/failed/);assert.match(await page.locator('#ap').innerText(),/4 \/ 6 AP/);
  await page.locator('[data-target="1"]').click();await page.locator('[data-slot="wrists"]').click();
  fs.mkdirSync('test-results',{recursive:true});await page.screenshot({path:'test-results/restraint-systems-desktop.png',fullPage:true});
  await page.setViewportSize({width:390,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  await page.screenshot({path:'test-results/restraint-systems-mobile.png',fullPage:true});
  assert.deepEqual(errors,[]);
  console.log('PASS: 54 applications across 18 slots, restrictions and restoration, closure upgrade, AP, separate targets, spoken/nonverbal actions, saves, escape, assemblies, failures, mobile and asset loading.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
