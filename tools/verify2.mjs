import { chromium } from '/Users/mac/.workbuddy/binaries/node/workspace/node_modules/playwright-core/index.mjs';
const EXE = '/Users/mac/Library/Caches/ms-playwright/chromium_headless_shell-1248/chrome-headless-shell-mac-x64/chrome-headless-shell';
const b = await chromium.launch({ headless: true, executablePath: EXE });
const p = await b.newPage({ viewport: { width: 1440, height: 1000 } });
await p.goto('file:///Volumes/work/workshop/FDE/fde-course/index.html', { waitUntil: 'load' });
await p.waitForTimeout(2500);

const r = await p.evaluate(() => {
  const cs = (sel, prop) => {
    const e = document.querySelector(sel);
    return e ? getComputedStyle(e)[prop] : null;
  };
  const imgs = [...document.images];
  const fig = document.querySelector('figure.shot-img img');
  const bb = fig ? fig.getBoundingClientRect() : null;
  const theme = document.querySelector('.html-course-theme');
  const accent = theme ? getComputedStyle(theme).getPropertyValue('--accent') : '';
  return {
    'theme --accent': accent.trim(),
    'h2.sec-title fontSize': cs('h2.sec-title', 'fontSize'),
    'h2.sec-title fontWeight': cs('h2.sec-title', 'fontWeight'),
    'h3.sub-title fontSize': cs('h3.sub-title', 'fontSize'),
    'kicker textTransform': cs('.kicker', 'textTransform'),
    'kicker letterSpacing': cs('.kicker', 'letterSpacing'),
    'callout bg': cs('.callout', 'backgroundColor'),
    'callout borderLeft': cs('.callout', 'borderLeftWidth'),
    'th borderBottom': cs('table th', 'borderBottomWidth'),
    'table fontSize': cs('table', 'fontSize'),
    'p fontSize': cs('.htmlLesson p', 'fontSize'),
    'p lineHeight': cs('.htmlLesson p', 'lineHeight'),
    'firstImgBox': bb ? Math.round(bb.width) + 'x' + Math.round(bb.height) : null,
    chapters: document.querySelectorAll('main.content > .htmlLesson').length,
    imgsTotal: imgs.length,
    imgsBroken: imgs.filter(i => !i.complete || i.naturalWidth === 0).length,
    docHeight: document.body.scrollHeight,
  };
});
console.log(JSON.stringify(r, null, 1));

await p.screenshot({ path: 'preview-top.png' });
await p.evaluate(() => document.querySelector('#ch3').scrollIntoView());
await p.waitForTimeout(900);
await p.screenshot({ path: 'preview-ch3.png' });
await p.evaluate(() => document.querySelector('#ch4').scrollIntoView());
await p.waitForTimeout(900);
await p.screenshot({ path: 'preview-ch4.png' });
await b.close();
