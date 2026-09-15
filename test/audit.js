const {chromium}=require('playwright');
const http=require('http'),fs=require('fs'),path=require('path');
const {pickBody,sse}=require('./mock');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'));
const srv=http.createServer((q,r)=>{r.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});r.end(html);});
const shots=[];
(async()=>{
srv.listen(8955);
const br=await chromium.launch({executablePath:process.env.PW_CHROME});
const ctx=await br.newContext({viewport:{width:393,height:852},deviceScaleFactor:2,isMobile:true,hasTouch:true});
const page=await ctx.newPage();
const errs=[]; page.on('pageerror',e=>errs.push(String(e)));
page.on('console',m=>{if(m.type()==='error')errs.push('console:'+m.text());});
await page.route('**/chat/completions',async route=>{
  const b=JSON.parse(route.request().postData());
  await route.fulfill({status:200,headers:{'Content-Type':'text/event-stream'},body:sse(pickBody(b.messages[b.messages.length-1].content))});
});
const snap=async(name,opt)=>{ await page.waitForTimeout(350); await page.screenshot(Object.assign({path:`/tmp/t/A_${name}.png`},opt||{})); shots.push(name); };

// 1 样张
await page.goto('http://localhost:8955/');
await page.waitForTimeout(500);
await snap('01_样张');
// 2 捏人
await page.evaluate(()=>{localStorage.setItem('wuxia_cfg',JSON.stringify({base:'https://api.deepseek.com',key:'sk-test',model:'m',think:false}));});
await page.reload(); await page.waitForTimeout(400);
await page.click('#btnNew').catch(()=>{});
await page.waitForSelector('#createMask.on');
await snap('02_捏人',{fullPage:true});
await page.click('#crFree button[data-v="free"]');
await page.click('#crGender button[data-v="男"]');
await page.waitForTimeout(200);
await page.click('#crAvatar .cell:nth-child(4)');
await page.click('#crStart');
await page.waitForSelector('#choices .opt',{timeout:15000});
// 3 正文
await snap('03_正文');
await page.evaluate(()=>{document.getElementById('story').scrollTop=99999;});
await snap('04_正文底部与选项');
// 4 面板
await page.click('#panelToggle');
await page.waitForTimeout(400);
await snap('05_面板上');
await page.evaluate(()=>{document.querySelector('.tabpane.on').scrollTop=99999;});
await snap('06_面板下');
await page.click('#tabs button[data-tab="bag"]'); await snap('07_行囊');
await page.click('#tabs button[data-tab="people"]'); await snap('08_人脉');
await page.click('#npcList .npc >> nth=0'); await snap('09_NPC详情');
await page.click('#npcTalkBtn'); await page.waitForTimeout(900); await snap('10_对话');
await page.keyboard.press('Escape'); await page.waitForTimeout(300);
await page.click('#tabs button[data-tab="world"]'); await snap('11_江湖');
await page.evaluate(()=>{document.querySelector('.tabpane.on').scrollTop=99999;});
await snap('12_江湖底部');
// 存档 / 设置
await page.click('#sideMask').catch(()=>{});
await page.click('#btnExport'); await page.waitForSelector('#saveMask.on'); await snap('13_存档阁');
await page.click('#svClose');
await page.click('#btnSettings'); await page.waitForSelector('#settingsMask.on'); await snap('14_设置',{fullPage:true});
await page.click('#cfgCancel');
// 比武
await page.evaluate(()=>{ const n=S.npcs.find(x=>x.alive); startDuel(n,{lethal:false,reason:'切磋',action:'比武',judge:{fate:10,check:null,worldEvent:null,months:1}}); });
await page.waitForSelector('#duelMask.on'); await snap('15_比武');
await page.click('#duelActions .stance[data-k="A"]'); await page.waitForTimeout(300);
await page.click('#duelActions .stance[data-k="X"]').catch(()=>{});
await page.waitForTimeout(300); await snap('16_比武中');
await page.evaluate(()=>{ duel.oHp=1; });
for(let i=0;i<12;i++){ const b=await page.$('#duelActions .stance[data-k="A"]:not([disabled])'); if(!b) break; await b.click(); await page.waitForTimeout(120); if(await page.$('#dSpare')) break; }
await snap('17_胜后处置');
await page.click('#dSpare').catch(()=>{});
await page.click('#duelGo').catch(()=>{});
await page.waitForSelector('#choices .opt',{timeout:15000});
await snap('18_比武续写');
// 结局
await page.evaluate(()=>{ S.freedom='strict'; });
await page.evaluate(()=>gameOverFlow('测试收尾'));
await page.waitForTimeout(2500);
await snap('19_立传');
console.log('shots:',shots.length);
console.log('errors:',errs.length?errs.slice(0,8):'无');
await br.close(); srv.close();
})().catch(e=>{console.error('FAIL',e.message);process.exit(1)});
