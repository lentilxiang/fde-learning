import { chromium } from '/Users/mac/.workbuddy/binaries/node/workspace/node_modules/playwright-core/index.mjs';
const EXE='/Users/mac/Library/Caches/ms-playwright/chromium_headless_shell-1248/chrome-headless-shell-mac-x64/chrome-headless-shell';
const b=await chromium.launch({headless:true,executablePath:EXE});
const p=await b.newPage({viewport:{width:1440,height:1000}});
await p.goto('https://cloud.tencent.com/edu/learning/course-4742-84527-84531',{waitUntil:'domcontentloaded'});
await p.waitForTimeout(7000);
const chain=await p.evaluate(()=>{
  const lesson=document.querySelector('.htmlLesson');
  if(!lesson) return 'no lesson';
  const chain=[];
  let n=lesson;
  while(n && n.tagName!=='BODY'){
    chain.push(n.tagName.toLowerCase()+'.'+String(n.className||'').trim().split(/\s+/).join('.'));
    n=n.parentElement;
  }
  chain.push('body');
  // 也看看 .content 的位置
  const content=document.querySelector('.content');
  const cchain=[]; let m=content;
  while(m && m.tagName!=='BODY'){cchain.push(m.tagName.toLowerCase()+'.'+String(m.className||'').trim().split(/\s+/).join('.'));m=m.parentElement;}
  return {lessonChain: chain.reverse(), contentChain: cchain.reverse()};
});
console.log(JSON.stringify(chain,null,1));
// CSS 变量定义位置
const varSrc=await p.evaluate(()=>{
  const out={};
  for(const ss of document.styleSheets){
    try{
      for(const r of ss.cssRules||[]){
        if(r.selectorText && /:root|html\b|\.mod-codebuddy-course/.test(r.selectorText) && /--serif|--mono|--text/.test(r.cssText)) out[r.selectorText]=(out[r.selectorText]||'')+r.cssText.slice(0,300);
      }
    }catch(e){}
  }
  return out;
});
console.log('VAR SOURCES:', JSON.stringify(varSrc,null,1).slice(0,1500));
await b.close();
