import { chromium } from '/Users/mac/.workbuddy/binaries/node/workspace/node_modules/playwright-core/index.mjs';
import fs from 'node:fs/promises';
const EXE='/Users/mac/Library/Caches/ms-playwright/chromium_headless_shell-1248/chrome-headless-shell-mac-x64/chrome-headless-shell';
const b=await chromium.launch({headless:true,executablePath:EXE});
const p=await b.newPage();
await p.goto('file:///Volumes/work/workshop/FDE/fde-course/index.html',{waitUntil:'load'});
await p.waitForTimeout(2000);
const off=await p.evaluate(()=>[...document.querySelectorAll('main.content > .htmlLesson')].map(s=>{
  const c=s.cloneNode(true); c.querySelectorAll('.copy-btn').forEach(e=>e.remove()); return c.textContent;
}));
await b.close();
const decode=s=>s.replace(/&#(\d+);/g,(m,d)=>String.fromCodePoint(+d)).replace(/&#x([0-9a-f]+);/gi,(m,h)=>String.fromCodePoint(parseInt(h,16)))
  .replace(/&nbsp;/g,' ').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&apos;/g,"'").replace(/&#39;/g,"'");
const norm=s=>s.replace(/[\s\u00a0]+/g,'');
let allOk=true, totMiss=0, tot=0;
console.log('ch | 覆盖率 | 未命中');
for(const i of [1,2,3,4]){
  const h=await fs.readFile(`raw/ch${i}.html`,'utf8');
  // 移除 copy-btn 元素本身后再取文本，与离线口径一致
  const stripped=h.replace(/<button[^>]*class="copy-btn"[^>]*>[\s\S]*?<\/button>/g,'');
  const txt=norm(decode(stripped.replace(/<[^>]+>/g,' ')));
  const o=norm(off[i-1]);
  const sents=txt.split(/(?<=[。！？；：])/).map(x=>x.trim()).filter(x=>x.length>15);
  const miss=sents.filter(x=>!o.includes(x));
  const cov=sents.length?(sents.length-miss.length)/sents.length*100:100;
  totMiss+=miss.length; tot+=sents.length;
  if(cov<100) allOk=false;
  console.log(`ch${i} | ${cov.toFixed(2)}% | ${miss.length}/${sents.length}`);
  miss.slice(0,3).forEach(m=>console.log('     -',m.slice(0,80)));
}
console.log(`\n全部 100%: ${allOk} | 总未命中 ${totMiss}/${tot}`);
