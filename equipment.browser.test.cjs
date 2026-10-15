const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const E=require('./dungeon-equipment');
const R=require('./restraints');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1280,height:1000}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(process.env.STUDIO_TEST_URL||'http://127.0.0.1:8080/studio.html');
  await page.waitForFunction(()=>document.querySelector('#status').textContent.startsWith('Ready.'));
  const other=await page.locator('#art-1').innerHTML();
  for(const slot of R.slots){
   await page.getByLabel('Nova equipment slot',{exact:true}).selectOption(slot);
   const options=await page.locator('#item-0 option').evaluateAll(nodes=>nodes.map(n=>n.value));
   assert.ok(options.length>=3,slot);
   assert.ok(await page.locator('#item-0').inputValue());
  }
  fs.mkdirSync('test-results',{recursive:true});
  for(const variant of [1,2,3]){
   await page.locator('#character-0 [data-action="clear"]').click();
   for(const slot of [...new Set(E.catalog.map(i=>i.slot))]){
    await page.getByLabel('Nova equipment slot',{exact:true}).selectOption(slot);
    await page.locator('#item-0').selectOption(`gear-${slot}-${variant}`);
    await page.locator('#method-0').selectOption('calibrate');
    await page.locator('#character-0 [data-action="fit"]').click();
    assert.equal(await page.locator(`#art-0 [data-item="gear-${slot}-${variant}"]`).count(),1);
   }
   assert.equal(await page.locator('#equipped-0 [data-remove]').count(),11);
   for(const outfit of ['streetwear','swimsuit','catsuit']){
    await page.getByLabel('Nova outfit',{exact:true}).selectOption(outfit);
    await page.locator('#character-0 .stage').screenshot({path:`test-results/gear-${variant}-${outfit}.png`});
   }
   await page.locator('#save').click();await page.reload();
   await page.waitForFunction(()=>document.querySelector('#status').textContent.startsWith('Ready.'));
   assert.equal(await page.locator('#equipped-0 [data-remove]').count(),11);
  }
  await page.getByLabel('Nova equipment slot',{exact:true}).selectOption('head');
  await page.locator('#item-0').selectOption('gear-head-3');
  await page.locator('#equipment-detail-0 summary').click();
  await page.locator('#equipment-detail-0').screenshot({path:'test-results/gear-detail.png'});
  // Quick presets must remain usable even when a different slot is filtered.
  await page.locator('#character-0 [data-preset="arcane-null-visor"]').click();
  assert.equal(await page.getByLabel('Nova equipment slot',{exact:true}).inputValue(),'all');
  assert.equal(await page.locator('#art-0 [data-item="gear-face-3"]').count(),0);
  assert.match(await page.locator('#casting-state-0').innerText(),/SILENCED/);
  await page.getByLabel('Nova equipment slot',{exact:true}).selectOption('face');
  await page.locator('#item-0').selectOption('gear-face-1');
  await page.locator('#character-0 [data-action="fit"]').click();
  assert.match(await page.locator('#casting-state-0').innerText(),/VOICE READY/);
  await page.setViewportSize({width:390,height:844});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  await page.locator('#character-0 .slot-browser').screenshot({path:'test-results/slot-browser-mobile.png'});
  assert.equal(await page.locator('#art-1').innerHTML(),other);
  assert.deepEqual(errors,[]);
  console.log('PASS: all 18 slot filters, all 33 new items, 3 outfits, persisted setups, inspect detail, multi-slot replacement, silence restoration, independent avatars, mobile overflow.');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
