import { chromium } from '/Users/mac/.workbuddy/binaries/node/workspace/node_modules/playwright-core/index.mjs';
import fs from 'node:fs/promises';
const EXE='/Users/mac/Library/Caches/ms-playwright/chromium_headless_shell-1248/chrome-headless-shell-mac-x64/chrome-headless-shell';
const b=await chromium.launch({headless:true,executablePath:EXE});
const p=await b.newPage();
await p.goto('file:///Volumes/work/workshop/FDE/fde-course/index.html',{waitUntil:'load'});
await p.waitForTimeout(2500);
const md=await p.evaluate(()=>{
  const out=[];
  out.push('# 腾讯云 ADP 前沿部署工程师 (FDE) 认证课程\n');
  out.push('> 课程 ID 4742 · 4 章 19 节 · 由腾讯云培训认证在线课程页面提取\n');
  const clean=s=>s.replace(/\s+/g,' ').trim();
  for(const sec of document.querySelectorAll('main.content > .htmlLesson')){
    for(const el of sec.querySelectorAll('h2.sec-title,h3.sub-title,h4,p,li,figcaption,th,td,.callout-title,.ix-panel-title,.quiz-q,.quiz-feedback,.kicker')){
      const t=clean(el.innerText||'');
      if(!t) continue;
      if(el.matches('h2.sec-title')) out.push(`\n## ${t}\n`);
      else if(el.matches('h3.sub-title')) out.push(`\n### ${t}\n`);
      else if(el.matches('h4')) out.push(`\n#### ${t}\n`);
      else if(el.matches('.kicker')) out.push(`\n\`${t}\``);
      else if(el.matches('li')) out.push(`- ${t}`);
      else if(el.matches('th')) out.push(`| ${t} `);
      else if(el.matches('td')) out.push(`| ${t} `);
      else if(el.matches('figcaption')) out.push(`\n*${t}*\n`);
      else if(el.matches('.callout-title')) out.push(`\n**${t}**`);
      else if(el.matches('.ix-panel-title')) out.push(`\n**${t}**`);
      else if(el.matches('.quiz-q')) out.push(`\n**测验：**${t}`);
      else if(el.matches('.quiz-feedback')) out.push(`\n**答案：**${t}`);
      else out.push(`\n${t}\n`);
    }
    out.push('\n---\n');
  }
  return out.join('\n').replace(/\n{3,}/g,'\n\n');
});
await b.close();
await fs.writeFile('/Volumes/work/workshop/FDE/fde-course/course-fulltext.md', md, 'utf8');
console.log('markdown chars:', md.length);
