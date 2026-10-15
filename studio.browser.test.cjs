// Optional browser integration check. Requires Playwright and installed Edge.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try {
  const page=await browser.newPage({viewport:{width:1280,height:900}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  const base=process.env.STUDIO_TEST_URL||'http://127.0.0.1:8080/studio.html';
  await page.goto(base);await page.waitForFunction(()=>document.querySelector('#status').textContent.startsWith('Ready.'));
  assert.equal(await page.locator('.character').count(),2);
  const opponent=await page.locator('#art-1').innerHTML();
  await page.getByLabel('Nova skin',{exact:true}).selectOption('umber');
  await page.getByLabel('Nova style',{exact:true}).selectOption('ponytail');
  await page.getByLabel('Nova hair',{exact:true}).selectOption('silver');
  await page.getByLabel('Nova outfit',{exact:true}).selectOption('swimsuit');
  await page.locator('#character-0 [data-action="equipment"]').click();
  assert.equal(await page.locator('#equipped-0 [data-remove]').count(),3);
  assert.equal(await page.locator('#art-1').innerHTML(),opponent);
  await page.locator('#character-0 [data-action="clear"]').click();
  await page.locator('#item-0').selectOption('steel-wrists');await page.locator('#method-0').selectOption('double');
  await page.locator('#character-0 [data-action="fit"]').click();
  assert.match(await page.locator('#equipped-0').innerText(),/Double lock/);
  await page.locator('#item-0').selectOption('leather-wrists');await page.locator('#method-0').selectOption('padlock');
  await page.locator('#character-0 [data-action="fit"]').click();
  assert.equal(await page.locator('#equipped-0 [data-remove]').count(),1);
  await page.locator('#save').click();assert.match(await page.locator('#status').innerText(),/saved/);
  await page.reload();await page.waitForFunction(()=>document.querySelector('#status').textContent.startsWith('Ready.'));
  assert.equal(await page.getByLabel('Nova skin',{exact:true}).inputValue(),'umber');
  assert.equal(await page.getByLabel('Nova hair',{exact:true}).inputValue(),'silver');
  assert.equal(await page.getByLabel('Nova outfit',{exact:true}).inputValue(),'swimsuit');
  assert.match(await page.locator('#equipped-0').innerText(),/Padlock/);
  assert.equal(await page.locator('#art-1').innerHTML(),opponent);
  fs.mkdirSync('test-results',{recursive:true});
  await page.locator('#character-0 .stage').screenshot({path:'test-results/studio-swimsuit.png'});
  await page.locator('#character-1 .zoom').click();
  await page.locator('#character-1 .stage').screenshot({path:'test-results/studio-face.png'});
  await page.setViewportSize({width:390,height:844});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  await page.locator('#character-0').scrollIntoViewIfNeeded();
  await page.screenshot({path:'test-results/studio-mobile.png'});
  await page.locator('#character-0 [data-action="reset"]').click();
  assert.equal(await page.getByLabel('Nova outfit',{exact:true}).inputValue(),'streetwear');
  await page.locator('#character-0 .stage').screenshot({path:'test-results/studio-streetwear.png'});
  assert.deepEqual(errors,[]);
  console.log('PASS: outfit/skin/hair switching, independent characters, random/clear, replacement, methods, save/reload, zoom, reset, mobile overflow, no JS errors.');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
