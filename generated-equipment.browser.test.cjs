const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1280,height:1000}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
  await page.goto(process.env.STUDIO_TEST_URL||'http://127.0.0.1:8080/studio.html');
  await page.waitForFunction(()=>document.querySelector('#status').textContent.startsWith('Ready.'),null,{timeout:120000});
  const other=await page.locator('#art-1').innerHTML();
  fs.mkdirSync('test-results',{recursive:true});
  await page.locator('#character-0 [data-action="gearzoom"]').click();
  for(const [n,material] of ['rope','leather','steel'].entries()){
   await page.locator('#character-0 [data-action="clear"]').click();
   for(const id of [`${material}-upper-leg`,`${material}-lower-leg`,`gear-hands-${n+1}`,`gear-knees-${n+1}`]){
    await page.locator('#item-0').selectOption(id);
    await page.locator('#character-0 [data-action="fit"]').click();
    assert.equal(await page.locator(`#art-0 [data-item="${id}"][data-renderer="generated"]`).count(),1);
   }
   for(const outfit of ['streetwear','swimsuit','catsuit']){
    await page.getByLabel('Nova outfit',{exact:true}).selectOption(outfit);
    await page.locator('#character-0 .stage').screenshot({path:`test-results/generated-${n+1}-${outfit}.png`});
   }
   await page.locator('#equipment-detail-0 summary').click();
   assert.equal(await page.locator('#equipment-detail-0 img').evaluate(img=>img.complete&&img.naturalWidth===1254),true);
  }
  await page.locator('#save').click();await page.reload();
  await page.waitForFunction(()=>document.querySelector('#status').textContent.startsWith('Ready.'),null,{timeout:120000});
  assert.equal(await page.locator('#art-0 [data-item][data-renderer="generated"]').count(),4);
  await page.getByLabel('Nova outfit',{exact:true}).selectOption('streetwear');
  await page.locator('#item-0').selectOption('rope-upper-leg');
  await page.locator('#character-0 [data-action="fit"]').click();
  await page.locator('#character-0 .stage').screenshot({path:'test-results/generated-full.png'});
  await page.setViewportSize({width:390,height:844});
  await page.locator('#character-0 [data-action="gearzoom"]').click();
  await page.locator('#character-0 .stage').screenshot({path:'test-results/generated-mobile.png'});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  assert.equal(await page.locator('#art-1').innerHTML(),other);
  assert.deepEqual(errors,[]);
  console.log('PASS: 12 generated pairs, three outfits, detail images, save/reload, mobile close-up, independent characters, no failed assets.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
