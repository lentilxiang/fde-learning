import { chromium } from '/Users/mac/.workbuddy/binaries/node/workspace/node_modules/playwright-core/index.mjs';
import fs from 'node:fs/promises';
import path from 'node:path';

const EXE = '/Users/mac/Library/Caches/ms-playwright/chromium_headless_shell-1248/chrome-headless-shell-mac-x64/chrome-headless-shell';
const COURSE_URL = 'https://cloud.tencent.com/edu/learning/course-4742-84527-84531';
const COS = 'https://cert-private-1255893580.cos.accelerate.myqcloud.com/html-course/resource/test/4742/v4/content/';
const OUT = path.resolve('.');

const log = (...a) => console.log('[scrape]', ...a);

// ---------- 1. 打开页面，抓取章节源码 ----------
const browser = await chromium.launch({ headless: true, executablePath: EXE });
const page = await browser.newPage();

// 收集所有内联样式（课程样式在页面 inline <style> 里）
await page.goto(COURSE_URL, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(7000);

const meta = await page.evaluate(() => ({
  title: document.title,
  course: document.querySelector('.htmlContentHeader h2, aside')?.innerText?.split('\n')[0] || '',
}));
log('page title:', meta.title);

// 目录树（章节标题 + contentId）
const toc = await page.evaluate(() => {
  const groups = [...document.querySelectorAll('aside > div > div, aside div')];
  return null;
});

// 通过页面内 fetch 调接口，拿每个 chapter 的签名 URL 并下载源码
const chapters = await page.evaluate(async (COS) => {
  const out = {};
  for (const i of [1, 2, 3, 4]) {
    const r = await fetch('/edu/learning/api/newCourse/getHtmlChapterDownloadUrl', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'getHtmlChapterDownloadUrl',
        payload: { url: COS + i + '.html', requestId: 'r' + i + Date.now() },
      }),
    });
    const j = await r.json();
    const d = (j && j.data) || j;
    const url = typeof d === 'string' ? d : (d && d.url);
    if (!url) { out[i] = { err: JSON.stringify(j).slice(0, 300) }; continue; }
    const html = await (await fetch(url)).text();
    out[i] = { html };
  }
  return out;
}, COS);

// 收集内联样式
const inlineCss = await page.evaluate(() =>
  [...document.querySelectorAll('style')].map(s => s.textContent).join('\n')
);

// 抓目录（侧栏章节标题）
const sidebar = await page.evaluate(() =>
  [...document.querySelectorAll('aside div, aside span, aside p')]
    .map(e => e.innerText.trim())
    .filter(t => /^\d+\.\d+/.test(t))
);

await browser.close();

await fs.mkdir(path.join(OUT, 'raw'), { recursive: true });
let totalChars = 0;
for (const [i, v] of Object.entries(chapters)) {
  if (v.err) { log('chapter', i, 'ERR', v.err); continue; }
  await fs.writeFile(path.join(OUT, 'raw', `ch${i}.html`), v.html, 'utf8');
  totalChars += v.html.length;
  log('chapter', i, 'ok', v.html.length, 'chars');
}
await fs.writeFile(path.join(OUT, 'toc.json'), JSON.stringify(sidebar, null, 2), 'utf8');
log('sidebar items:', sidebar.length);

// ---------- 2. 收集并下载图片 / 视频 ----------
const imgs = new Set();
const medias = new Set(); // 视频与封面
for (const [i, v] of Object.entries(chapters)) {
  if (v.err) continue;
  for (const m of v.html.matchAll(/<img[^>]+src="([^"]+)"/g)) imgs.add(m[1]);
  for (const m of v.html.matchAll(/<video[^>]+src="([^"]+)"/g)) medias.add(m[1]);
  for (const m of v.html.matchAll(/poster="([^"]+)"/g)) medias.add(m[1]);
  for (const m of v.html.matchAll(/<source[^>]+src="([^"]+)"/g)) medias.add(m[1]);
}
log('images found:', imgs.size, '| media found:', medias.size);

const imgDir = path.join(OUT, 'assets', 'images');
const mediaDir = path.join(OUT, 'assets', 'media');
await fs.mkdir(imgDir, { recursive: true });
await fs.mkdir(mediaDir, { recursive: true });

const mapping = {};
let okCount = 0, failCount = 0;

async function download(url, dest, relPath) {
  if (mapping[url]) return;
  mapping[url] = relPath;
  try {
    const r = await fetch(url);
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const buf = Buffer.from(await r.arrayBuffer());
    await fs.writeFile(dest, buf);
    okCount++;
  } catch (e) {
    failCount++;
    log('fail', path.basename(dest), String(e).slice(0, 80));
  }
}

const queue = [...imgs].map(u => ({ u, kind: 'img' }));
queue.push(...[...medias].map(u => ({ u, kind: 'media' })));
async function worker() {
  while (queue.length) {
    const { u, kind } = queue.shift();
    if (kind === 'img') {
      const rel = decodeURIComponent(u.split('/images/')[1] || path.basename(u));
      const safe = rel.replace(/\//g, '__');
      await download(u, path.join(imgDir, safe), 'assets/images/' + encodeURIComponent(safe));
    } else {
      const safe = decodeURIComponent(u.split('/').pop());
      await download(u, path.join(mediaDir, safe), 'assets/media/' + encodeURIComponent(safe));
    }
  }
}
await Promise.all(Array.from({ length: 12 }, worker));
log(`assets: ok=${okCount} fail=${failCount}`);

await fs.writeFile(path.join(OUT, 'img-map.json'), JSON.stringify(mapping, null, 2), 'utf8');

// ---------- 3. 生成离线 HTML ----------
const NAV = [
  { ch: 1, title: 'AI 和 Agent 基础', lessons: ['1.1 AI 基础', '1.2 大语言模型的进化之路：从“会接龙”到“会做事”', '1.3 智能体（Agent）基础'] },
  { ch: 2, title: 'ADP 产品能力', lessons: ['2.1 ADP 是什么：企业级智能体开发平台', '2.2 上 基础能力：应用、模型、角色指令、变量与长期记忆', '2.2 中 知识与连接能力：知识库、工具、连接器与 Skills', '2.2 下 任务执行与编排能力：Workflow、Multi-Agent 与 Claw', '2.3 从开发到上线：ADP 应用的完整使用流程'] },
  { ch: 3, title: '使用 ADP 开发智能体', lessons: ['3.1 方案设计方法', '3.2 标准模式实战：知识助手', '3.3 单工作流模式实战：客服助手', '3.4 Multi-Agent 模式实战：内容创作助手', '3.5 Claw 模式实战', '3.6 智能工作台实战'] },
  { ch: 4, title: '评测与优化智能体', lessons: ['4.1 智能体调试与评测基础', '4.2 Prompt 调优', '4.3 知识库质量与 RAG 调优', '4.4 Workflow 调优', '4.5 Multi-Agent 调优'] },
];

let body = '';
for (const [i, v] of Object.entries(chapters)) {
  if (v.err) continue;
  let html = v.html;
  // 图片/视频改本地相对路径
  html = html.replace(/(src|poster)="([^"]+)"/g, (m, attr, u) => mapping[u] ? `${attr}="${mapping[u]}"` : m);
  // 用裸 <section> 承载，匹配 CSS 中的 `section > .kicker-group:first-child` 等规则
  body += `<section class="htmlLesson" id="ch${i}">\n${html}\n</section>\n`;
}

// ---------- 3. 提取课程 CSS ----------
// 原站所有课程样式都以 .html-course-theme 为作用域根，CSS 变量也定义在该类上。
// 因此保留：以 .html-course-theme 开头的规则、变量容器、以及含课程类名的规则。
function extractRelevantCss(css) {
  const COURSE_CLASSES = /(shot-img|sec-title|sub-title|chapter-meta|callout|prompt-box|table-wrap|parallel-table|case-flow|quiz|ix-|kicker|standfirst|lead\b|copy-btn|htmlLesson|htmlCourse|htmlChapter|htmlContent|doc-content|rno-markdown|attachment|side-|course-)/;
  const out = [];
  let depth = 0, buf = '';
  for (let i = 0; i < css.length; i++) {
    const c = css[i];
    buf += c;
    if (c === '{') depth++;
    else if (c === '}') {
      depth--;
      if (depth === 0) {
        const sel = buf.slice(0, buf.indexOf('{'));
        if (/@(media|supports)/.test(sel)) {
          const inner = extractRelevantCss(buf.slice(buf.indexOf('{') + 1, -1));
          if (inner.trim()) out.push(sel + '{' + inner + '}');
        } else if (sel.includes('.html-course-theme') || sel.includes(':root') || COURSE_CLASSES.test(sel)) {
          out.push(buf);
        }
        buf = '';
      }
    }
  }
  return out.join('\n');
}
const courseCss = extractRelevantCss(inlineCss);
log('css extracted:', courseCss.length, 'chars of', inlineCss.length);
// 安全检查：提取结果不应含裸 body / * 等全局规则
const globalHits = [...courseCss.matchAll(/(^|})\s*(body|html|\*)\s*(,[^{]*)?\{/g)].map(m => m[2]);
log('global selectors in extracted css:', globalHits.length ? globalHits.join(',') : 'none');

// 目录导航（人工校对过的章节结构）
const navHtml = NAV.map(n => `
  <div class="nav-chapter">
    <a class="nav-chapter-title" href="#ch${n.ch}">第 ${n.ch} 章 · ${n.title}</a>
    <ul>${n.lessons.map((l, k) => `<li><a href="#ch${n.ch}">${l}</a></li>`).join('')}</ul>
  </div>`).join('\n');

const PAGE = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>腾讯云 ADP 前沿部署工程师 (FDE) 认证课程 · 完整课件</title>
<style>
/* ===== 离线外壳：仅补充侧栏与章节分隔，布局宽度交给原站 .layout 网格 ===== */
html{scroll-behavior:smooth}
body{margin:0;background:#f7f9fc}
.offline-toc{position:sticky;top:0;align-self:flex-start;height:100vh;overflow-y:auto;padding:26px 18px 40px 0;font-family:-apple-system,"PingFang SC","Microsoft YaHei",system-ui,sans-serif;box-sizing:border-box}
.offline-toc h1{font-size:15px;margin:0 0 6px;line-height:1.55;color:#0d1b33;font-family:inherit}
.offline-toc .sub{font-size:11px;color:#8fa3c2;font-family:ui-monospace,Menlo,monospace;letter-spacing:.16em;margin-bottom:20px}
.offline-toc .nav-chapter{margin-bottom:16px}
.offline-toc .nav-chapter-title{display:block;font-weight:700;font-size:13.5px;color:#0d1b33;text-decoration:none;padding:7px 0;border-bottom:1px solid #e3e8f0}
.offline-toc .nav-chapter-title:hover{color:#0052D9}
.offline-toc .nav-chapter ul{list-style:none;margin:8px 0 0;padding:0}
.offline-toc .nav-chapter li{font-size:12.5px;padding:3px 0 3px 10px;border-left:2px solid transparent;color:#4a5b78;line-height:1.6}
.offline-toc .nav-chapter li a{color:inherit;text-decoration:none}
.offline-toc .nav-chapter li:hover{border-left-color:#0052D9;color:#0d1b33}
/* 文档头 */
.offline-head{max-width:1320px;margin:0 auto;padding:30px 24px 6px;box-sizing:border-box}
.offline-head h1{font-size:27px;margin:0 0 8px;color:#0d1b33;line-height:1.35;font-family:-apple-system,"PingFang SC",system-ui,sans-serif}
.offline-head .meta{font-size:12px;color:#8fa3c2;font-family:ui-monospace,Menlo,monospace;letter-spacing:.08em}
/* 章节分隔与留白（节内排版完全交给课程样式） */
.html-course-theme main.content > .htmlLesson + .htmlLesson{border-top:1px solid #e8eef7}
.html-course-theme main.content{padding-bottom:80px}
.html-course-theme main.content img{height:auto}
@media (max-width:1024px){
  .offline-toc{display:none}
  .html-course-theme .layout{grid-template-columns:1fr}
}
</style>
<style>
/* ===== 原站课程样式（提取自课程主题作用域，含全部 CSS 变量） ===== */
${courseCss}
</style>
</head>
<body>
<div class="offline-head">
  <h1>腾讯云 ADP 前沿部署工程师 (FDE) 认证课程</h1>
  <div class="meta">课程 ID 4742 · 4 章 19 节 · ${imgs.size} 张配图${medias.size ? ` · ${medias.size} 个视频文件` : ''} · 离线存档</div>
</div>
<!-- 复刻原站 DOM 层级：.htmlCourseDetailPage > .html-course-theme > .layout > main.content
     使 .html-course-theme 作用域下的全部课程样式与 grid 布局正确命中 -->
<div class="htmlCourseDetailPage html-course-theme">
  <div class="layout">
    <nav class="offline-toc">
      <h1>腾讯云 ADP 前沿部署工程师 (FDE) 认证课程</h1>
      <div class="sub">COURSE 4742 · 完整课件</div>
      ${navHtml}
    </nav>
    <main class="content" id="doc">
${body}
    </main>
  </div>
</div>
<script src="offline-interactive.js"></script>
</body>
</html>`;

await fs.writeFile(path.join(OUT, 'index.html'), PAGE, 'utf8');
log('index.html written:', PAGE.length, 'chars');
log('DONE. chapters=', Object.keys(chapters).length, 'imgs=', imgs.size);
