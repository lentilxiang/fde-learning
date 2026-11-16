import { chromium } from '/Users/mac/.workbuddy/binaries/node/workspace/node_modules/playwright-core/index.mjs';
const EXE = '/Users/mac/Library/Caches/ms-playwright/chromium_headless_shell-1248/chrome-headless-shell-mac-x64/chrome-headless-shell';

const PROBE = () => {
  const cs = (sel, prop) => {
    const e = document.querySelector(sel);
    return e ? getComputedStyle(e)[prop] : null;
  };
  return {
    'h2.sec-title': [cs('h2.sec-title', 'fontSize'), cs('h2.sec-title', 'fontWeight'), cs('h2.sec-title', 'letterSpacing')].join(' / '),
    'h3.sub-title': [cs('h3.sub-title', 'fontSize'), cs('h3.sub-title', 'fontWeight')].join(' / '),
    'h3.sub-sub': [cs('h3.sub-sub', 'fontSize'), cs('h3.sub-sub', 'fontWeight')].join(' / '),
    'p.body': [cs('.htmlLesson p', 'fontSize'), cs('.htmlLesson p', 'lineHeight'), cs('.htmlLesson p', 'marginBottom')].join(' / '),
    'p.lead': [cs('.lead', 'fontSize'), cs('.lead', 'lineHeight')].join(' / '),
    'p.standfirst': [cs('.standfirst', 'fontSize'), cs('.standfirst', 'color')].join(' / '),
    'kicker': [cs('.kicker', 'fontSize'), cs('.kicker', 'letterSpacing'), cs('.kicker', 'color')].join(' / '),
    'callout': [cs('.callout', 'padding'), cs('.callout', 'borderLeftWidth'), cs('.callout', 'borderRadius')].join(' / '),
    'callout-title': [cs('.callout-title', 'fontSize'), cs('.callout-title', 'fontWeight'), cs('.callout-title', 'color')].join(' / '),
    'table': [cs('table', 'fontSize'), cs('table', 'borderCollapse')].join(' / '),
    'th': [cs('table th', 'background'), cs('table th', 'padding')].join(' / '),
    'td': [cs('table td', 'padding'), cs('table td', 'borderBottom')].join(' / '),
    'li': [cs('.htmlLesson li', 'fontSize'), cs('.htmlLesson li', 'lineHeight')].join(' / '),
    'shot-img img': (() => { const i = document.querySelector('figure.shot-img img'); if (!i) return null; const b = i.getBoundingClientRect(); return Math.round(b.width) + 'x' + Math.round(b.height) + ' / maxW=' + getComputedStyle(i).maxWidth; })(),
    'prompt-box': [cs('.prompt-box', 'background'), cs('.prompt-box', 'padding'), cs('.prompt-box', 'fontFamily')].join(' / '),
    'chapter-meta': [cs('.chapter-meta', 'background'), cs('.chapter-meta', 'padding')].join(' / '),
    'bodyFont': cs('.htmlLesson p', 'fontFamily'),
  };
};

const b = await chromium.launch({ headless: true, executablePath: EXE });

// 原站
const p1 = await b.newPage({ viewport: { width: 1440, height: 1000 } });
await p1.goto('https://cloud.tencent.com/edu/learning/course-4742-84527-84531', { waitUntil: 'domcontentloaded' });
await p1.waitForTimeout(8000);
const live = await p1.evaluate(PROBE);
await p1.screenshot({ path: 'ref-live.png' });

// 离线
const p2 = await b.newPage({ viewport: { width: 1440, height: 1000 } });
await p2.goto('file:///Volumes/work/workshop/FDE/fde-course/index.html', { waitUntil: 'load' });
await p2.waitForTimeout(2500);
const off = await p2.evaluate(PROBE);

await b.close();

const keys = Object.keys(live);
let same = 0, diff = 0;
console.log('SEL'.padEnd(16), '| LIVE'.padEnd(42), '| OFFLINE');
console.log('-'.repeat(110));
for (const k of keys) {
  const a = String(live[k]), c = String(off[k]);
  const eq = a === c;
  if (eq) same++; else diff++;
  console.log((eq ? '  ' : '≠ ') + k.padEnd(16), '|', a.padEnd(42), '|', c);
}
console.log(`\nmatch=${same} diff=${diff} total=${keys.length}`);
