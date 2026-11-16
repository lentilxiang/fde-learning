import { chromium } from '/Users/mac/.workbuddy/binaries/node/workspace/node_modules/playwright-core/index.mjs';
const EXE = '/Users/mac/Library/Caches/ms-playwright/chromium_headless_shell-1248/chrome-headless-shell-mac-x64/chrome-headless-shell';
const b = await chromium.launch({ headless: true, executablePath: EXE });
const p = await b.newPage({ viewport: { width: 1440, height: 1000 } });
const errors = [];
p.on('pageerror', e => errors.push(String(e).slice(0, 120)));
await p.goto('file:///Volumes/work/workshop/FDE/fde-course/index.html', { waitUntil: 'load' });
await p.waitForTimeout(2500);

const results = {};

// A. quiz 判题
const quiz = await p.evaluate(() => {
  const q = document.querySelector('.quiz');
  if (!q) return { err: 'no quiz' };
  const correct = q.getAttribute('data-correct');
  const opts = [...q.querySelectorAll('.quiz-opt')];
  // 点正确答案
  correct.split(',').forEach(L => {
    const o = opts.find(x => x.getAttribute('data-letter') === L.trim());
    if (o) o.click();
  });
  q.querySelector('.quiz-submit')?.click();
  return {
    correct,
    markedCorrect: opts.filter(o => o.classList.contains('correct')).map(o => o.getAttribute('data-letter')),
    feedbackShown: getComputedStyle(q.querySelector('.quiz-feedback')).display,
    disabled: opts.every(o => o.disabled),
  };
});
results.quiz = quiz;

// B. 排序：点上移，验证顺序变化 + 按钮可见
const sort = await p.evaluate(() => {
  const s = document.querySelector('.ix-sort');
  if (!s) return { err: 'no sort' };
  const items = () => [...s.querySelectorAll('.ix-sort-item')].map(i => i.getAttribute('data-order') + ':' + i.querySelector('span').textContent.trim());
  const before = items();
  const moves = s.querySelector('.ix-sort-item:nth-child(3) .ix-sort-moves');
  const visible = moves ? getComputedStyle(moves).display : 'none';
  moves?.querySelectorAll('button')[0]?.click();
  return { before, after: items(), movesVisible: visible };
});
results.sort = sort;

// C. 翻卡
const card = await p.evaluate(() => {
  const c = document.querySelector('.ix-card');
  if (!c) return { err: 'no card' };
  const before = c.className;
  c.click();
  return { before, after: c.className, flipped: c.classList.contains('flipped') };
});
results.card = card;

// D. 复制按钮存在与可点
const copy = await p.evaluate(() => {
  const btns = [...document.querySelectorAll('.copy-btn')];
  if (!btns.length) return { total: 0 };
  btns[0].click();
  return { total: btns.length, textAfterClick: btns[0].textContent };
});
results.copy = copy;

// E. 参考答案展开
const ans = await p.evaluate(() => {
  const t = document.querySelector('.ix-form-toggle');
  if (!t) return { err: 'none' };
  const box = t.parentElement.querySelector('.ix-form-answer');
  const d1 = getComputedStyle(box).display;
  t.click();
  return { initialLabel: t.textContent, displayBefore: d1, displayAfter: getComputedStyle(box).display };
});
results.answerBox = ans;

// F. 分栏 tab
const tab = await p.evaluate(() => {
  const tabs = [...document.querySelectorAll('.ix-tab')];
  if (!tabs.length) return { err: 'none' };
  tabs[tabs.length - 1].click();
  return { total: tabs.length, activeAfterClick: tabs[tabs.length - 1].classList.contains('active') };
});
results.tabs = tab;

results.pageErrors = errors;
console.log(JSON.stringify(results, null, 1));

// 截图三处供人工确认
await p.evaluate(() => document.querySelector('#ch1').scrollIntoView());
await p.waitForTimeout(700);
await p.screenshot({ path: 'preview-ch1.png' });
await p.evaluate(() => document.querySelector('.quiz').scrollIntoView({ block: 'center' }));
await p.waitForTimeout(500);
await p.screenshot({ path: 'preview-quiz.png' });
await b.close();
