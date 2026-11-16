/* 离线课件交互层：让判题/翻卡/排序/复制/参考答案在无后端时可用。
   不改变静态排版——所有正文默认平铺可见，本脚本只增加交互能力。 */
(function () {
  'use strict';
  var root = document.querySelector('main.content') || document;

  /* ---------- 1. 复制按钮 ---------- */
  root.querySelectorAll('.copy-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var box = btn.closest('.prompt-box') || btn.closest('.callout') || btn.parentElement;
      var text = box ? (box.innerText || '').replace(/复制\s*$/, '').trim() : '';
      var reset = function () { setTimeout(function () { btn.textContent = '复制'; }, 1400); };
      var ok = function () { btn.textContent = '已复制'; reset(); };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(ok, fallback);
      } else { fallback(); }
      function fallback() {
        try {
          var ta = document.createElement('textarea');
          ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
          document.body.appendChild(ta); ta.select();
          document.execCommand('copy'); document.body.removeChild(ta); ok();
        } catch (e) { btn.textContent = '复制失败'; reset(); }
      }
    });
  });

  /* ---------- 2. 单选/多选题 ---------- */
  root.querySelectorAll('.quiz').forEach(function (quiz) {
    var correct = (quiz.getAttribute('data-correct') || '')
      .split(',').map(function (s) { return s.trim(); }).filter(Boolean);
    var multi = quiz.getAttribute('data-multi') === 'true';
    var opts = Array.prototype.slice.call(quiz.querySelectorAll('.quiz-opt'));
    var submit = quiz.querySelector('.quiz-submit');
    var feedback = quiz.querySelector('.quiz-feedback, .quiz-answer');
    var picked = [];

    var judge = function () {
      opts.forEach(function (o) {
        var L = o.getAttribute('data-letter');
        o.disabled = true;
        o.classList.remove('selected');
        if (correct.indexOf(L) >= 0) o.classList.add('correct');
        else if (picked.indexOf(L) >= 0) o.classList.add('wrong');
      });
      if (feedback) feedback.classList.add('show');
      if (submit) submit.disabled = true;
    };

    opts.forEach(function (o) {
      o.addEventListener('click', function () {
        if (o.disabled) return;
        var L = o.getAttribute('data-letter');
        if (multi) {
          var i = picked.indexOf(L);
          if (i >= 0) { picked.splice(i, 1); o.classList.remove('selected'); }
          else { picked.push(L); o.classList.add('selected'); }
        } else {
          picked = [L];
          opts.forEach(function (x) { x.classList.remove('selected'); });
          o.classList.add('selected');
          if (!submit) judge();
        }
      });
    });
    if (submit) submit.addEventListener('click', function () { if (picked.length) judge(); });
  });

  /* ---------- 3. 翻卡 ---------- */
  root.querySelectorAll('.ix-card').forEach(function (card) {
    card.addEventListener('click', function () { card.classList.toggle('flipped'); });
  });

  /* ---------- 4. 排序（上移/下移）---------- */
  root.querySelectorAll('.ix-sort-moves').forEach(function (m) { m.style.display = 'inline-flex'; });
  root.querySelectorAll('.ix-sort').forEach(function (sort) {
    var resort = function () {
      Array.prototype.slice.call(sort.querySelectorAll('.ix-sort-item'))
        .sort(function (a, b) { return (+a.getAttribute('data-order') || 0) - (+b.getAttribute('data-order') || 0); })
        .forEach(function (it) { sort.appendChild(it); });
    };
    var swap = function (a, b) {
      var x = a.getAttribute('data-order'), y = b.getAttribute('data-order');
      a.setAttribute('data-order', y); b.setAttribute('data-order', x); resort();
    };
    sort.querySelectorAll('.ix-sort-item').forEach(function (item) {
      var moves = item.querySelector('.ix-sort-moves');
      if (!moves) return;
      var btns = moves.querySelectorAll('button');
      if (btns[0]) btns[0].addEventListener('click', function (e) {
        e.preventDefault(); var p = item.previousElementSibling; if (p) swap(item, p);
      });
      if (btns[1]) btns[1].addEventListener('click', function (e) {
        e.preventDefault(); var n = item.nextElementSibling; if (n) swap(item, n);
      });
    });
  });

  /* ---------- 5. 参考答案（默认展开，可收起）---------- */
  root.querySelectorAll('.ix-form-toggle').forEach(function (btn) {
    var ans = btn.parentElement ? btn.parentElement.querySelector('.ix-form-answer') : null;
    if (!ans) return;
    btn.textContent = '收起参考答案';
    btn.addEventListener('click', function () {
      var open = ans.style.display !== 'none';
      ans.style.display = open ? 'none' : 'block';
      btn.textContent = open ? '查看参考答案' : '收起参考答案';
    });
  });

  /* ---------- 6. 选项卡：高亮并滚动到对应面板（面板本身平铺可见）---------- */
  root.querySelectorAll('.ix-app').forEach(function (app) {
    var tabs = Array.prototype.slice.call(app.querySelectorAll('.ix-tab'));
    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        tabs.forEach(function (t) { t.classList.remove('active'); });
        tab.classList.add('active');
        var key = tab.getAttribute('data-key');
        var panel = Array.prototype.slice.call(app.querySelectorAll('.ix-panel'))
          .filter(function (p) { return p.getAttribute('data-key') === key; })[0];
        if (panel && panel.scrollIntoView) panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      });
    });
  });

  /* ---------- 7. 侧栏当前章节高亮 ---------- */
  var links = Array.prototype.slice.call(document.querySelectorAll('.offline-toc a[href^="#ch"]'));
  var secs = Array.prototype.slice.call(document.querySelectorAll('main.content > .htmlLesson'));
  if (links.length && secs.length && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var id = en.target.id;
        links.forEach(function (a) { a.style.fontWeight = a.getAttribute('href') === '#' + id ? '700' : ''; });
      });
    }, { rootMargin: '-10% 0px -70% 0px' });
    secs.forEach(function (s) { io.observe(s); });
  }
})();
