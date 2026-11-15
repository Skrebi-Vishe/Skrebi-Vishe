var GL=(document.documentElement.lang||'ru').slice(0,2)==='en';function T(ru,en){return GL?en:ru;}
(function () {
  var STEPS = ['s1','s2','s3','s4','s5','s6','s7','s8','s9','s10'];
  var TITLES = {}; document.querySelectorAll('.toc a[data-step]').forEach(function (a) { TITLES[a.dataset.step] = a.querySelector('.tt').textContent; });
  var KEY = 'slimevr-guide-done', done = {};
  try { done = JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { done = {}; }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(done)); } catch (e) {} }
  function render() {
    var n = 0;
    STEPS.forEach(function (id) {
      var on = !!done[id]; if (on) n++;
      var sec = document.getElementById(id); if (sec) sec.classList.toggle('is-done', on);
      document.querySelectorAll('[data-done="' + id + '"]').forEach(function (b) { b.setAttribute('aria-pressed', String(on)); b.querySelector('.dt-label').textContent = on ? T('Выполнено','Done') : T('Шаг выполнен','Mark step done'); });
      document.querySelectorAll('.toc a[data-step="' + id + '"]').forEach(function (a) { a.classList.toggle('done', on); });
    });
    var f = document.getElementById('tp-fill'), t = document.getElementById('tp-text');
    if (f) f.style.width = (n / STEPS.length * 100) + '%';
    if (t) t.textContent = T('Выполнено ' + n + ' из ' + STEPS.length, n + ' of ' + STEPS.length + ' steps done');
    var fd = document.getElementById('fab-done');
    if (fd) { fd.hidden = n === 0; fd.textContent = '✓ ' + n + '/' + STEPS.length; fd.title = T('Выполнено шагов: ' + n + ' из ' + STEPS.length, 'Steps done: ' + n + ' of ' + STEPS.length); }
    var hs = document.getElementById('hero-start');
    if (hs) {
      var next = STEPS.filter(function (id) { return !done[id]; })[0];
      if (n === 0) { hs.textContent = T('Начать с проверки','Start with the check'); hs.href = '#s1'; }
      else if (!next) { hs.textContent = T('Все шаги выполнены · памятка перед игрой','All steps done · before-play checklist'); hs.href = '#every'; }
      else { hs.textContent = T('Продолжить: шаг ','Continue: step ') + next.slice(1) + ' · ' + (TITLES[next] || ''); hs.href = '#' + next; }
    }
  }
  document.querySelectorAll('.done-toggle').forEach(function (b) {
    b.addEventListener('click', function () { var id = b.dataset.done; done[id] = !done[id]; save(); render(); });
  });
  var reset = document.getElementById('toc-reset');
  if (reset) reset.addEventListener('click', function () { done = {}; save(); render(); });
  render();

  // подсветка текущего шага
  var toc = document.getElementById('toc'), fab = document.getElementById('toc-fab'), fabStep = document.getElementById('fab-step');
  var ids = STEPS.concat(['every', 'help']), current = null;
  function setCurrent(id) {
    if (id === current) return; current = id;
    document.querySelectorAll('.toc a[data-step]').forEach(function (a) {
      if (a.dataset.step === id) a.setAttribute('aria-current', 'step'); else a.removeAttribute('aria-current');
    });
    if (fabStep) {
      var num = id && /^s\d+$/.test(id) ? T('Шаг ','Step ') + id.slice(1) + '/10' : '';
      var title = id ? TITLES[id] : T('Шаги','Steps');
      fabStep.replaceChildren();
      if (num) { var a1 = document.createElement('span'); a1.className = 'fab-num'; a1.textContent = num; fabStep.appendChild(a1);
        var s1 = document.createElement('span'); s1.className = 'fab-sep'; s1.textContent = ' · '; fabStep.appendChild(s1); }
      var t1 = document.createElement('span'); t1.className = num ? 'fab-title' : ''; t1.textContent = title; fabStep.appendChild(t1);
    }
  }
  function spy() {
    var y = window.innerHeight * 0.35, best = null;
    ids.forEach(function (id) { var el = document.getElementById(id); if (el && el.getBoundingClientRect().top <= y) best = id; });
    setCurrent(best);
    var h = document.documentElement, max = h.scrollHeight - h.clientHeight;
    var bar = document.getElementById('readbar'); if (bar) bar.style.width = (max > 0 ? h.scrollTop / max * 100 : 0) + '%';
  }
  var ticking = false;
  window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(function () { ticking = false; spy(); }); } }, { passive: true });
  window.addEventListener('resize', spy); spy();

  // мобильное оглавление
  function openToc(v) { if (!toc || !fab) return; toc.classList.toggle('open', v); fab.setAttribute('aria-expanded', String(v)); }
  if (fab) fab.addEventListener('click', function () { openToc(!toc.classList.contains('open')); });
  var close = document.getElementById('toc-close'); if (close) close.addEventListener('click', function () { openToc(false); fab.focus(); });
  document.querySelectorAll('.toc a').forEach(function (a) { a.addEventListener('click', function () { openToc(false); }); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && toc.classList.contains('open')) { openToc(false); fab.focus(); } });
})();

(function () {
  function read(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
    catch (e) { return fallback; }
  }
  function write(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); }
    catch (e) { /* Отметки работают до закрытия страницы. */ }
  }
  function element(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  }

  var prepKey = 'slimevr-guide-prep';
  var savedPrep = read(prepKey, {});
  var prep = typeof savedPrep === 'object' ? savedPrep : {};
  document.querySelectorAll('[data-prep]').forEach(function (input) {
    var id = input.dataset.prep;
    input.checked = prep[id] === true;
    input.addEventListener('change', function () {
      prep[id] = input.checked;
      write(prepKey, prep);
    });
  });

  var log = document.getElementById('tracker-log');
  var rows = document.getElementById('tracker-rows');
  var add = document.getElementById('tracker-add');
  var status = document.getElementById('tracker-count');
  var logKey = 'slimevr-guide-trackers';
  var stages = GL ? ['Axes', 'Temperature', 'Check'] : ['Оси', 'Температура', 'Проверка'];
  var savedTrackers = read(logKey, []);
  var trackers = Array.isArray(savedTrackers) ? savedTrackers.filter(function (row) {
    return row && typeof row.name === 'string' && Array.isArray(row.stages);
  }) : [];

  function updateStatus() {
    var ready = trackers.filter(function (tracker) {
      return stages.every(function (_, index) { return tracker.stages[index] === true; });
    }).length;
    status.textContent = trackers.length ? T('Готово ' + ready + ' из ' + trackers.length, ready + ' of ' + trackers.length + ' ready') : T('Не добавлены','None added');
  }
  function saveTrackers() {
    write(logKey, trackers);
    updateStatus();
  }
  function renderTrackers() {
    rows.replaceChildren();
    trackers.forEach(function (tracker, index) {
      var row = element('fieldset', 'tracker-row');
      row.append(element('legend', '', T('Трекер ','Tracker ') + (index + 1)));
      var name = element('input', 'tracker-name');
      name.type = 'text';
      name.maxLength = 60;
      name.value = tracker.name;
      name.placeholder = T('Например, левое бедро','e.g. left thigh');
      name.setAttribute('aria-label', T('Название трекера ','Tracker name ') + (index + 1));
      name.addEventListener('input', function () {
        tracker.name = name.value;
        saveTrackers();
      });
      var checks = element('div', 'tracker-stages');
      stages.forEach(function (stage, stageIndex) {
        var label = element('label', 'tracker-stage');
        var check = element('input');
        check.type = 'checkbox';
        check.checked = tracker.stages[stageIndex] === true;
        check.addEventListener('change', function () {
          tracker.stages[stageIndex] = check.checked;
          saveTrackers();
        });
        label.append(check, element('span', '', stage));
        checks.append(label);
      });
      var remove = element('button', 'quiet-button tracker-remove', T('Убрать','Remove'));
      remove.type = 'button';
      remove.setAttribute('aria-label', T('Убрать трекер ','Remove tracker ') + (index + 1));
      remove.addEventListener('click', function () {
        trackers.splice(index, 1);
        saveTrackers();
        renderTrackers();
        add.focus();
      });
      row.append(name, checks, remove);
      rows.append(row);
    });
    updateStatus();
  }
  add.addEventListener('click', function () {
    trackers.push({ name: '', stages: [false, false, false] });
    saveTrackers();
    renderTrackers();
    rows.lastElementChild.querySelector('.tracker-name').focus();
  });
  document.querySelectorAll('a[href="#tracker-log"]').forEach(function (link) {
    link.addEventListener('click', function () { log.open = true; });
  });
  if (location.hash === '#tracker-log') log.open = true;
  renderTrackers();

})();
// Просмотр картинок: нажатие на снимок открывает его на весь экран.
// Приближение: нажатие, колесо мыши, два пальца; перетаскивание приближенного снимка;
// листание стрелками, клавишами ← → и свайпом в пределах одного шага.
(function () {
  var dlg = document.createElement('dialog');
  if (typeof dlg.showModal !== 'function') return;

  var items = [];
  document.querySelectorAll('figure').forEach(function (fig) {
    if (fig.closest('.author, .three-wrap')) return;
    var list = fig.hasAttribute('data-zoom')
      ? [fig.querySelector('img, svg')].filter(Boolean)
      : Array.prototype.slice.call(fig.querySelectorAll('img'));
    list.forEach(function (g) {
      if (items.some(function (x) { return x.g === g; })) return;
      var cap = fig.querySelector(':scope > figcaption');
      var capText = '';
      if (cap) { var cc = cap.cloneNode(true); cc.querySelectorAll('.mobile-graph-note').forEach(function (n) { n.remove(); }); capText = cc.textContent.replace(/\s+/g, ' ').trim(); }
      var text = list.length === 1 && capText ? capText : (g.getAttribute('alt') || fig.dataset.zoom || '');
      items.push({ g: g, text: text, title: fig.dataset.zoom || g.getAttribute('alt') || text, group: g.closest('section') || document.body });
    });
  });
  if (!items.length) return;

  var ICON = {
    close: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    prev: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>',
    next: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>'
  };
  function btn(cls, label, icon) {
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'lb-btn ' + cls; b.setAttribute('aria-label', label); b.title = label; b.innerHTML = icon;
    return b;
  }
  dlg.className = 'lb';
  dlg.setAttribute('aria-label', T('Просмотр изображения', 'Image viewer'));
  var stage = document.createElement('div'); stage.className = 'lb-stage';
  var bar = document.createElement('div'); bar.className = 'lb-bar';
  var cap = document.createElement('p'); cap.className = 'lb-cap'; cap.id = 'lb-cap';
  var meta = document.createElement('p'); meta.className = 'lb-meta';
  var count = document.createElement('span'); count.className = 'lb-count';
  var hint = document.createElement('span'); hint.className = 'lb-hint';
  var touch = window.matchMedia('(pointer: coarse)').matches;
  hint.textContent = touch
    ? T('Нажмите или разведите пальцы, чтобы приблизить', 'Tap or pinch to zoom')
    : T('Нажмите на снимок или покрутите колесо, чтобы приблизить', 'Click the image or use the mouse wheel to zoom');
  meta.append(count, hint);
  bar.append(cap, meta);
  var bClose = btn('lb-close', T('Закрыть (Esc)', 'Close (Esc)'), ICON.close);
  var bPrev = btn('lb-prev', T('Предыдущий снимок', 'Previous image'), ICON.prev);
  var bNext = btn('lb-next', T('Следующий снимок', 'Next image'), ICON.next);
  dlg.setAttribute('aria-describedby', 'lb-cap');
  dlg.append(stage, bar, bPrev, bNext, bClose);
  document.body.append(dlg);

  var group = [], idx = 0, g = null, nw = 1, nh = 1, bw = 0, bh = 0, s = 1, tx = 0, ty = 0, maxS = 4, trigger = null;

  function cloneOf(src) {
    var c = src.cloneNode(true);
    ['class', 'tabindex', 'role', 'aria-label', 'loading', 'width', 'height', 'style'].forEach(function (a) { c.removeAttribute(a); });
    if (c.tagName === 'IMG') { c.src = src.currentSrc || src.src; c.decoding = 'async'; c.draggable = false; }
    else {
      var map = new Map();
      c.querySelectorAll('[id]').forEach(function (n) { map.set(n.id, 'lb-' + n.id); n.id = 'lb-' + n.id; });
      c.querySelectorAll('*').forEach(function (n) {
        Array.prototype.forEach.call(n.attributes, function (a) {
          var v = a.value.replace(/url\(#([^)]+)\)/g, function (m, id) { return map.has(id) ? 'url(#' + map.get(id) + ')' : m; });
          if (a.localName === 'href' && map.has(v.slice(1))) v = '#' + map.get(v.slice(1));
          if (v !== a.value) a.value = v;
        });
      });
      c.removeAttribute('id');
    }
    c.classList.add('lb-img');
    return c;
  }
  function area() {
    var cs = getComputedStyle(stage), r = stage.getBoundingClientRect();
    var l = parseFloat(cs.paddingLeft), t = parseFloat(cs.paddingTop);
    var w = stage.clientWidth - l - parseFloat(cs.paddingRight), h = stage.clientHeight - t - parseFloat(cs.paddingBottom);
    return { w: w, h: h, cx: r.left + l + w / 2, cy: r.top + t + h / 2 };
  }
  function layout() {
    if (!g) return;
    var a = area();
    var fit = Math.min(a.w / nw, a.h / nh);
    if (g.tagName === 'IMG') fit = Math.min(fit, 2);
    bw = Math.round(nw * fit); bh = Math.round(nh * fit);
    g.style.width = bw + 'px'; g.style.height = bh + 'px';
    var native = g.tagName === 'IMG' ? nw / bw : 1;
    maxS = Math.max(4, native * 2);
    setT(1, 0, 0, false);
  }
  function clampT() {
    var a = area();
    var mx = Math.max(0, (bw * s - a.w) / 2), my = Math.max(0, (bh * s - a.h) / 2);
    tx = Math.min(mx, Math.max(-mx, tx)); ty = Math.min(my, Math.max(-my, ty));
  }
  function setT(ns, nx, ny, anim) {
    s = Math.min(maxS, Math.max(1, ns)); tx = nx; ty = ny; clampT();
    if (!g) return;
    g.classList.toggle('lb-anim', !!anim);
    g.style.transform = 'translate(' + tx + 'px,' + ty + 'px) scale(' + s + ')';
    dlg.classList.toggle('lb-zoomed', s > 1.01);
  }
  function zoomAt(ns, x, y, anim) {
    var a = area();
    ns = Math.min(maxS, Math.max(1, ns));
    var k = ns / s;
    setT(ns, x - a.cx - (x - a.cx - tx) * k, y - a.cy - (y - a.cy - ty) * k, anim);
  }
  function toggleZoom(x, y) {
    if (s > 1.01) { setT(1, 0, 0, true); return; }
    var target = g.tagName === 'IMG' ? Math.max(2, nw / bw) : 2.5;
    zoomAt(Math.min(target, maxS), x, y, true);
  }

  function show(i) {
    idx = (i + group.length) % group.length;
    var it = group[idx];
    var c = cloneOf(it.g);
    if (c.tagName === 'IMG') {
      nw = it.g.naturalWidth || +it.g.getAttribute('width') || 800;
      nh = it.g.naturalHeight || +it.g.getAttribute('height') || 600;
      c.addEventListener('load', function () { if (g === c && (c.naturalWidth !== nw || c.naturalHeight !== nh)) { nw = c.naturalWidth; nh = c.naturalHeight; layout(); } });
      c.alt = it.g.alt || '';
    } else {
      var vb = it.g.viewBox && it.g.viewBox.baseVal, r = it.g.getBoundingClientRect();
      nw = (vb && vb.width) || r.width || 800; nh = (vb && vb.height) || r.height || 600;
      c.setAttribute('role', 'img');
    }
    stage.replaceChildren(c); g = c;
    cap.textContent = it.text;
    var many = group.length > 1;
    count.textContent = many ? (idx + 1) + ' / ' + group.length : '';
    count.hidden = !many; bPrev.hidden = bNext.hidden = !many;
    layout();
    if (many) [idx + 1, idx - 1].forEach(function (j) { var n = group[(j + group.length) % group.length].g; if (n.tagName === 'IMG') { var p = new Image(); p.src = n.currentSrc || n.src; } });
  }
  function open(it) {
    group = items.filter(function (x) { return x.group === it.group; });
    trigger = it.g;
    dlg.showModal();
    show(group.indexOf(it));
    bClose.focus({ preventScroll: true });
  }

  items.forEach(function (it) {
    var el = it.g;
    el.classList.add('zoomable');
    el.setAttribute('tabindex', '0');
    el.setAttribute('role', 'button');
    el.setAttribute('aria-label', T('Открыть крупно: ', 'Open larger: ') + it.title);
    el.addEventListener('click', function (e) { e.preventDefault(); open(it); });
    el.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(it); }
    });
  });

  bClose.addEventListener('click', function () { dlg.close(); });
  bPrev.addEventListener('click', function () { show(idx - 1); });
  bNext.addEventListener('click', function () { show(idx + 1); });
  dlg.addEventListener('close', function () {
    stage.replaceChildren(); g = null;
    if (trigger) trigger.focus({ preventScroll: true });
  });
  dlg.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowLeft' && group.length > 1) { e.preventDefault(); show(idx - 1); }
    else if (e.key === 'ArrowRight' && group.length > 1) { e.preventDefault(); show(idx + 1); }
    else if (e.key === '+' || e.key === '=') { var a = area(); zoomAt(s * 1.5, a.cx, a.cy, true); }
    else if (e.key === '-') { var b = area(); zoomAt(s / 1.5, b.cx, b.cy, true); }
    else if (e.key === '0') setT(1, 0, 0, true);
  });
  window.addEventListener('resize', function () { if (dlg.open) layout(); });

  stage.addEventListener('wheel', function (e) {
    if (!g) return;
    e.preventDefault();
    zoomAt(s * Math.exp(-e.deltaY * (e.deltaMode === 1 ? 0.05 : 0.0018)), e.clientX, e.clientY, false);
  }, { passive: false });

  var pts = new Map(), start = null, pinch = null;
  stage.addEventListener('pointerdown', function (e) {
    if (!g || e.button > 0) return;
    try { stage.setPointerCapture(e.pointerId); } catch (err) {}
    pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pts.size === 1) start = { x: e.clientX, y: e.clientY, tx: tx, ty: ty, t: Date.now(), moved: false };
    else if (pts.size === 2) {
      var p = Array.from(pts.values());
      pinch = { d: Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y), s: s };
      if (start) start.moved = true;
    }
  });
  stage.addEventListener('pointermove', function (e) {
    if (!pts.has(e.pointerId) || !g) return;
    pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pts.size === 2 && pinch) {
      var p = Array.from(pts.values());
      var d = Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y);
      zoomAt(pinch.s * d / pinch.d, (p[0].x + p[1].x) / 2, (p[0].y + p[1].y) / 2, false);
      return;
    }
    if (!start) return;
    var dx = e.clientX - start.x, dy = e.clientY - start.y;
    if (Math.abs(dx) + Math.abs(dy) > 6) start.moved = true;
    if (s > 1.01) { dlg.classList.add('lb-drag'); setT(s, start.tx + dx, start.ty + dy, false); }
  });
  function end(e) {
    if (!pts.has(e.pointerId)) return;
    pts.delete(e.pointerId);
    dlg.classList.remove('lb-drag');
    if (pts.size === 1) { var q = Array.from(pts.values())[0]; start = { x: q.x, y: q.y, tx: tx, ty: ty, t: Date.now(), moved: true }; pinch = null; return; }
    if (pts.size) return;
    pinch = null;
    var st = start; start = null;
    if (!st || e.type === 'pointercancel' || !g) return;
    var dx = e.clientX - st.x, dy = e.clientY - st.y;
    if (st.moved) {
      if (s <= 1.01 && group.length > 1 && Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5 && Date.now() - st.t < 700) show(idx + (dx < 0 ? 1 : -1));
      return;
    }
    var r = g.getBoundingClientRect();
    var onImg = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
    if (onImg) toggleZoom(e.clientX, e.clientY);
    else if (s > 1.01) setT(1, 0, 0, true);
    else dlg.close();
  }
  stage.addEventListener('pointerup', end);
  stage.addEventListener('pointercancel', end);
  bar.addEventListener('click', function (e) { if (e.target === bar && s <= 1.01) dlg.close(); });
})();

// Свой сервер лайков и посетителей (src/visitor-counter/worker.mjs).
// Включается, когда при сборке задан адрес сервера и ключ Turnstile (tools/stats_config.json).
(async function () {
  const apiMeta = document.querySelector('meta[name="guide-stats-api"]');
  const keyMeta = document.querySelector('meta[name="guide-turnstile-sitekey"]');
  if (!apiMeta || !keyMeta || location.origin !== 'https://skrebi-vishe.github.io') return;
  const api = apiMeta.content.replace(/\/$/, '');
  if (!/^https:\/\/[a-z0-9.-]+$/i.test(api)) return;
  const locale = GL ? 'en-US' : 'ru-RU';
  const stats = document.getElementById('guide-public-stats');
  const frame = document.getElementById('guide-visit-frame');
  const visits = document.getElementById('guide-visit-status');
  const button = document.getElementById('guide-public-like');
  const label = document.getElementById('guide-public-likes');
  const box = document.getElementById('guide-turnstile');
  if (!stats || !button || !label || !visits || !box) return;

  async function request(method, path, body) {
    const response = await fetch(api + path, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : {},
      body: body ? JSON.stringify(body) : undefined,
      credentials: 'omit',
      signal: AbortSignal.timeout(10000),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) { const e = new Error(data.error || 'http'); e.status = response.status; throw e; }
    return data;
  }
  let liked = false;
  function show(data) {
    if (!Number.isSafeInteger(data.visitors) || !Number.isSafeInteger(data.likes)) throw new Error('bad data');
    if (frame) frame.hidden = true;
    visits.hidden = false;
    visits.textContent = data.visitors.toLocaleString(locale);
    label.textContent = T('Лайков: ', 'Likes: ') + data.likes.toLocaleString(locale);
    liked = data.liked === true;
    button.setAttribute('aria-pressed', String(liked));
    button.classList.toggle('liked', liked);
    button.textContent = liked ? T('♥ Спасибо!', '♥ Thank you!') : T('♡ Нравится', '♡ Like');
    button.title = liked ? T('Нажмите ещё раз, чтобы убрать лайк', 'Click again to remove your like') : '';
  }

  stats.hidden = false;
  try {
    let first = true;
    try { first = !sessionStorage.getItem('guide-visit-sent'); } catch (e) {}
    show(await request(first ? 'POST' : 'GET', first ? '/visit' : '/stats'));
    try { sessionStorage.setItem('guide-visit-sent', '1'); } catch (e) {}
    button.disabled = false;
  } catch (e) {
    visits.textContent = T('нет данных', 'no data');
    label.textContent = T('Лайки пока недоступны', 'Likes are unavailable right now');
    return;
  }

  let turnstileReady = null;
  function loadTurnstile() {
    if (window.turnstile) return Promise.resolve();
    if (!turnstileReady) {
      turnstileReady = new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
        s.async = true; s.onload = resolve; s.onerror = () => { turnstileReady = null; reject(new Error('turnstile')); };
        document.head.appendChild(s);
      });
    }
    return turnstileReady;
  }
  let widget = null;
  async function humanToken() {
    await loadTurnstile();
    return new Promise((resolve, reject) => {
      if (widget !== null) { try { window.turnstile.remove(widget); } catch (e) {} widget = null; }
      box.hidden = false;
      widget = window.turnstile.render(box, {
        sitekey: keyMeta.content, action: 'like', appearance: 'interaction-only',
        language: GL ? 'en' : 'ru', theme: 'auto',
        callback: (token) => { box.hidden = true; resolve(token); },
        'error-callback': () => { reject(new Error('captcha')); },
        'expired-callback': () => { reject(new Error('expired')); },
      });
    });
  }

  // скрипт проверки загружается заранее, когда карточка автора видна: лайк ставится быстрее
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      if (entries.some((x) => x.isIntersecting)) { io.disconnect(); loadTurnstile().catch(() => {}); }
    }, { rootMargin: '400px' });
    io.observe(stats);
  }

  button.addEventListener('click', async () => {
    button.disabled = true;
    if (!liked) button.textContent = T('Проверяем…', 'Checking…');
    try {
      if (liked) show(await request('DELETE', '/like'));
      else show(await request('POST', '/like', { token: await humanToken() }));
    } catch (e) {
      label.textContent = e.status === 429
        ? T('Слишком часто. Попробуйте через минуту.', 'Too many attempts. Try again in a minute.')
        : (e.message === 'captcha' || e.message === 'expired' || e.status === 403)
          ? T('Проверка не пройдена. Нажмите ещё раз', 'Check failed. Please try again')
          : T('Не удалось поставить лайк', 'Could not send your like');
      if (!liked) button.textContent = T('♡ Нравится', '♡ Like');
    } finally {
      button.disabled = false;
    }
  });
})();

(async function () {
  if (!document.querySelector('meta[name="guide-hosted-stats"]') ||
      location.origin !== 'https://skrebi-vishe.github.io') return;

  const stats = document.getElementById('guide-public-stats');
  const frame = document.getElementById('guide-visit-frame');
  const button = document.getElementById('guide-public-like');
  const label = document.getElementById('guide-public-likes');
  const slug = '/slime-vr-setup-v2';  // 15.11: счётчик обнулён после накрутки
  const votedKey = 'slimevr-guide-iine-voted-v2';
  const api = 'https://vhiweeypifbwacashxjz.supabase.co/rest/v1/rpc/';
  const apiKey = 'sb_publishable_EoB7MFJhCmb6PiAk-GPJ4w_PGhQ44Ru';

  async function send(action, data) {
    const response = await fetch(api + action, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: apiKey },
      body: JSON.stringify(data),
      credentials: 'omit',
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) throw new Error('Like service unavailable');
    return response.json();
  }

  function showCount(count) {
    if (!Number.isSafeInteger(count) || count < 0) throw new Error('Invalid like count');
    label.textContent = T('Лайков: ','Likes: ') + count.toLocaleString(GL ? 'en-US' : 'ru-RU');
  }

  stats.hidden = false;
  const visitStatus = document.getElementById('guide-visit-status');
  const unavailable = () => {
    frame.hidden = true;
    visitStatus.textContent = T('нет данных','no data');
    visitStatus.hidden = false;
  };
  const visitTimeout = setTimeout(unavailable, 8000);
  frame.addEventListener('load', () => {
    if (frame.contentDocument?.URL === 'about:blank') return;
    clearTimeout(visitTimeout);
    const digits = frame.contentDocument?.querySelector('img');
    if (!digits?.naturalWidth || !digits.naturalHeight) {
      unavailable();
      return;
    }
    frame.width = String(Math.ceil(16 * digits.naturalWidth / digits.naturalHeight));
    frame.hidden = false;
    visitStatus.hidden = true;
  });
  frame.src = (document.documentElement.getAttribute('data-base') || '') + 'visits.html';

  let voted;
  try {
    showCount((await send('get_hits', { page_slugs: [slug] }))[slug] ?? 0);
    voted = localStorage.getItem(votedKey) === '1';
    button.disabled = voted;
    if (voted) { button.textContent = T('♥ Спасибо!','♥ Thank you!'); button.classList.add('liked'); }
  } catch {
    label.textContent = T('Лайки пока недоступны','Likes are unavailable right now');
    return;
  }

  async function vote() {
    if (localStorage.getItem(votedKey) === '1') return;
    // Check that the browser can remember this action before sending it.
    localStorage.setItem(votedKey, '1');
    try {
      await send('increment_hits', { page_slug: slug });
    } catch (error) {
      localStorage.removeItem(votedKey);
      throw error;
    }
  }

  button.addEventListener('click', async () => {
    button.disabled = true;
    try {
      if (navigator.locks) await navigator.locks.request(votedKey, vote);
      else await vote();
      button.textContent = T('♥ Спасибо!','♥ Thank you!');
      button.classList.add('liked');
    } catch {
      label.textContent = T('Не удалось поставить лайк','Could not send your like');
      button.disabled = false;
      return;
    }
    try {
      showCount((await send('get_hits', { page_slugs: [slug] }))[slug] ?? 0);
    } catch {
      label.textContent = T('Число лайков пока недоступно','Like count is unavailable right now');
    }
  });
})();
