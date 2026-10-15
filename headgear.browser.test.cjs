const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
const H=require('./head-equipment');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1280,height:1000}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(process.env.STUDIO_TEST_URL||'http://127.0.0.1:8080/studio.html');
  await page.waitForFunction(()=>document.querySelector('#status').textContent.startsWith('Ready.'));
  const other=await page.locator('#art-1').innerHTML();
  fs.mkdirSync('test-results',{recursive:true});
  await page.getByLabel('Nova style',{exact:true}).selectOption('ponytail');
  await page.getByLabel('Nova hair',{exact:true}).selectOption('violet');
  await page.locator('#character-0 [data-action="headzoom"]').click();
  for(const item of H.catalog){
   await page.getByLabel('Nova equipment slot',{exact:true}).selectOption(item.slot);
   await page.locator('#item-0').selectOption(item.id);
   await page.locator('#method-0').selectOption('sync');
   await page.locator('#character-0 [data-action="fit"]').click();
   assert.equal(await page.locator('#equipped-0 [data-remove]').count(),1);
   assert.equal(await page.locator('#art-0 [data-avatar-hair]').count(),item.hidesHair?0:1);
   await page.locator('#character-0 [data-action="cast"]').click();
   assert.match(await page.locator('#cast-result-0').innerText(),item.blocksVerbal?/blocked/:/passes/);
   await page.locator('#character-0 .stage').screenshot({path:`test-results/${item.id}.png`});
  }
  await page.locator('#character-0 [data-preset="head-sentinel-helmet"]').click();
  await page.locator('#save').click();await page.reload();
  await page.waitForFunction(()=>document.querySelector('#status').textContent.startsWith('Ready.'));
  assert.equal(await page.locator('#art-0 [data-avatar-hair]').count(),0);
  assert.equal(await page.getByLabel('Nova style',{exact:true}).inputValue(),'ponytail');
  await page.locator('#character-0 [data-action="cast"]').click();assert.match(await page.locator('#cast-result-0').innerText(),/blocked/);
  await page.locator('#character-0 [data-remove="head-sentinel-helmet"]').click();
  assert.equal(await page.locator('#art-0 [data-avatar-hair]').count(),1);
  await page.locator('#character-0 [data-action="cast"]').click();assert.match(await page.locator('#cast-result-0').innerText(),/passes/);
  assert.equal(await page.locator('#art-1').innerHTML(),other);
  await page.setViewportSize({width:390,height:844});
  await page.locator('#character-0 [data-preset="head-scout-mask"]').click();
  await page.locator('#character-0 [data-action="headzoom"]').click();
  await page.locator('#character-0 .stage').screenshot({path:'test-results/headgear-mobile.png'});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  await page.locator('#character-0 [data-action="headzoom"]').click();
  assert.equal(await page.locator('#art-0>svg').getAttribute('viewBox'),'155 0 730 1518');
  assert.deepEqual(errors,[]);
  console.log('PASS: 9 headgear designs, coverage replacement, casting gates, hair concealment/restoration, save/reload, head close-up, independent avatars and mobile layout.');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
