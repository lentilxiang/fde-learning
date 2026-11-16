import { chromium } from '/Users/mac/.workbuddy/binaries/node/workspace/node_modules/playwright-core/index.mjs';
const EXE='/Users/mac/Library/Caches/ms-playwright/chromium_headless_shell-1248/chrome-headless-shell-mac-x64/chrome-headless-shell';
const b=await chromium.launch({headless:true,executablePath:EXE});
const p=await b.newPage({viewport:{width:1440,height:1000}});
const errs=[];
p.on('requestfailed',r=>errs.push(r.url().slice(0,110)));
await p.goto('file:///Volumes/work/workshop/FDE/fde-course/index.html',{waitUntil:'load'});
await p.waitForTimeout(3000);
const stat=await p.evaluate(()=>{
  const imgs=[...document.images];
  return {
    textLen: document.body.innerText.length,
    chapters: document.querySelectorAll('.chapter-block').length,
    imgsTotal: imgs.length,
    imgsBroken: imgs.filter(i=>!i.complete||i.naturalWidth===0).length,
    firstH2: document.querySelector('h2.sec-title')?.innerText.trim()||'',
    tables: document.querySelectorAll('table').length,
    callouts: document.querySelectorAll('.callout').length,
  };
});
console.log(JSON.stringify(stat,null,1));
console.log('failed requests:', errs.length); errs.slice(0,5).forEach(e=>console.log('  ',e));
await p.screenshot({path:'preview-top.png'});
await p.evaluate(()=>window.scrollTo(0,3000)); await p.waitForTimeout(600);
await p.screenshot({path:'preview-mid.png'});
await b.close();
