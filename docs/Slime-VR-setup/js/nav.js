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
      document.querySelectorAll('[data-done="' + id + '"]').forEach(function (b) { b.setAttribute('aria-pressed', String(on)); b.querySelector('.dt-label').textContent = on ? 'Выполнено' : 'Шаг выполнен'; });
      document.querySelectorAll('.toc a[data-step="' + id + '"]').forEach(function (a) { a.classList.toggle('done', on); });
    });
    var f = document.getElementById('tp-fill'), t = document.getElementById('tp-text');
    if (f) f.style.width = (n / STEPS.length * 100) + '%';
    if (t) t.textContent = 'Выполнено ' + n + ' из ' + STEPS.length;
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
      var num = id && /^s\d+$/.test(id) ? 'Шаг ' + id.slice(1) + '/10' : '';
      var title = id ? TITLES[id] : 'Шаги';
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
  var stages = ['Оси', 'Температура', 'Проверка'];
  var savedTrackers = read(logKey, []);
  var trackers = Array.isArray(savedTrackers) ? savedTrackers.filter(function (row) {
    return row && typeof row.name === 'string' && Array.isArray(row.stages);
  }) : [];

  function updateStatus() {
    var ready = trackers.filter(function (tracker) {
      return stages.every(function (_, index) { return tracker.stages[index] === true; });
    }).length;
    status.textContent = trackers.length ? 'Готово ' + ready + ' из ' + trackers.length : 'Не добавлены';
  }
  function saveTrackers() {
    write(logKey, trackers);
    updateStatus();
  }
  function renderTrackers() {
    rows.replaceChildren();
    trackers.forEach(function (tracker, index) {
      var row = element('fieldset', 'tracker-row');
      row.append(element('legend', '', 'Трекер ' + (index + 1)));
      var name = element('input', 'tracker-name');
      name.type = 'text';
      name.maxLength = 60;
      name.value = tracker.name;
      name.placeholder = 'Например, левое бедро';
      name.setAttribute('aria-label', 'Название трекера ' + (index + 1));
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
      var remove = element('button', 'quiet-button tracker-remove', 'Убрать');
      remove.type = 'button';
      remove.setAttribute('aria-label', 'Убрать трекер ' + (index + 1));
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

  var viewer = document.createElement('dialog');
  if (typeof viewer.showModal !== 'function') return;
  viewer.className = 'image-viewer';
  viewer.setAttribute('aria-labelledby', 'image-viewer-title');
  var toolbar = element('div', 'viewer-toolbar');
  var title = element('h2');
  title.id = 'image-viewer-title';
  var actions = element('div', 'viewer-actions');
  var scale = element('button', 'quiet-button', 'Крупнее');
  var close = element('button', 'quiet-button', 'Закрыть');
  scale.type = close.type = 'button';
  close.autofocus = true;
  var hint = element('p', 'viewer-hint', 'Прокрутите изображение, чтобы увидеть остальное.');
  hint.hidden = true;
  var content = element('div', 'viewer-content');
  content.tabIndex = 0;
  content.setAttribute('role', 'region');
  content.setAttribute('aria-label', 'Изображение');
  actions.append(scale, close);
  toolbar.append(title, actions, hint);
  viewer.append(toolbar, content);
  document.body.append(viewer);

  var trigger;
  function cloneGraphic(graphic) {
    var copy = graphic.cloneNode(true);
    if (copy.tagName === 'IMG') copy.loading = 'eager';
    // Сохраняем связи с градиентами и масками внутри копии SVG.
    var ids = new Map();
    copy.querySelectorAll('[id]').forEach(function (node) {
      ids.set(node.id, 'zoom-' + node.id);
      node.id = ids.get(node.id);
    });
    copy.querySelectorAll('*').forEach(function (node) {
      Array.from(node.attributes).forEach(function (attr) {
        var value = attr.value.replace(/url\(#([^)]+)\)/g, function (match, id) {
          return ids.has(id) ? 'url(#' + ids.get(id) + ')' : match;
        });
        if (attr.localName === 'href' && ids.has(value.slice(1))) value = '#' + ids.get(value.slice(1));
        if (value !== attr.value) attr.value = value;
      });
    });
    return copy;
  }
  document.querySelectorAll('[data-zoom]').forEach(function (figure) {
    var graphic = figure.querySelector('img, svg');
    if (!graphic) return;
    var button = element('button', 'quiet-button zoom-trigger', 'Увеличить');
    button.type = 'button';
    button.setAttribute('aria-label', 'Увеличить: ' + figure.dataset.zoom);
    figure.append(button);
    function open() {
      trigger = button;
      title.textContent = figure.dataset.zoom;
      content.replaceChildren(cloneGraphic(graphic));
      content.classList.remove('viewer-enlarged');
      scale.textContent = 'Крупнее';
      scale.setAttribute('aria-pressed', 'false');
      viewer.showModal();
      hint.hidden = content.scrollWidth <= content.clientWidth;
      content.scrollTo(0, 0);
      close.focus();
    }
    button.addEventListener('click', open);
    graphic.classList.add('zoomable');
    graphic.addEventListener('click', open);
  });
  scale.addEventListener('click', function () {
    var enlarged = content.classList.toggle('viewer-enlarged');
    scale.textContent = enlarged ? 'Меньше' : 'Крупнее';
    hint.hidden = content.scrollWidth <= content.clientWidth;
    scale.setAttribute('aria-pressed', String(enlarged));
  });
  close.addEventListener('click', function () { viewer.close(); });
  viewer.addEventListener('click', function (event) {
    if (event.target === viewer) viewer.close();
  });
  viewer.addEventListener('close', function () {
    content.replaceChildren();
    if (trigger) trigger.focus({ preventScroll: true });
  });
})();
