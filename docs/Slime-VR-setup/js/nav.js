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

  var viewer = document.createElement('dialog');
  if (typeof viewer.showModal !== 'function') return;
  viewer.className = 'image-viewer';
  viewer.setAttribute('aria-labelledby', 'image-viewer-title');
  var toolbar = element('div', 'viewer-toolbar');
  var title = element('h2');
  title.id = 'image-viewer-title';
  var actions = element('div', 'viewer-actions');
  var scale = element('button', 'quiet-button', T('Крупнее','Larger'));
  var close = element('button', 'quiet-button', T('Закрыть','Close'));
  scale.type = close.type = 'button';
  close.autofocus = true;
  var hint = element('p', 'viewer-hint', T('Прокрутите изображение, чтобы увидеть остальное.','Scroll the image to see the rest.'));
  hint.hidden = true;
  var content = element('div', 'viewer-content');
  content.tabIndex = 0;
  content.setAttribute('role', 'region');
  content.setAttribute('aria-label', T('Изображение','Image'));
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
    var button = element('button', 'quiet-button zoom-trigger', T('Увеличить','Enlarge'));
    button.type = 'button';
    button.setAttribute('aria-label', T('Увеличить: ','Enlarge: ') + figure.dataset.zoom);
    figure.append(button);
    function open() {
      trigger = button;
      title.textContent = figure.dataset.zoom;
      content.replaceChildren(cloneGraphic(graphic));
      content.classList.remove('viewer-enlarged');
      scale.textContent = T('Крупнее','Larger');
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
    scale.textContent = enlarged ? T('Меньше','Smaller') : T('Крупнее','Larger');
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
(async function () {
  const counter = document.querySelector('meta[name="guide-visitor-api"]');
  if (!counter || location.origin !== 'https://skrebi-vishe.github.io') return;

  const stats = document.getElementById('guide-stats');
  const visitors = document.getElementById('visitor-total');
  const button = document.getElementById('guide-like');
  const likes = document.getElementById('guide-likes');
  const status = document.getElementById('guide-stats-error');
  const authorMode = document.getElementById('guide-author-mode');
  const authorForm = document.getElementById('guide-author-form');
  const authorInput = document.getElementById('guide-author-key');
  const authorExit = document.getElementById('guide-author-exit');
  const authorStatus = document.getElementById('guide-author-status');
  const authorStorage = 'slimevr-guide-owner-key';
  let ownerKey = null;
  let id = null;
  try {
    ownerKey = localStorage.getItem(authorStorage);
    const key = 'slimevr-guide-browser-id';
    const getId = () => {
      const saved = localStorage.getItem(key) || crypto.randomUUID();
      localStorage.setItem(key, saved);
      return saved;
    };
    id = navigator.locks ? await navigator.locks.request(key, getId) : getId();
  } catch (error) {
    // A browser without persistent storage can only read the count.
  }

  const headers = id ? { 'X-Visitor-Id': id } : {};
  async function request(url, method, key) {
    const requestHeaders = key ? { Authorization: 'Bearer ' + key } : headers;
    const response = await fetch(url, { method, headers: requestHeaders, credentials: 'omit', signal: AbortSignal.timeout(8000) });
    if (response.status === 429 && method === 'POST') return request(url, 'GET');
    if (!response.ok) throw Object.assign(new Error('Statistics request failed'), { status: response.status });
    return response.json();
  }
  function render(data) {
    if (![data.total, data.likes].every(value => Number.isSafeInteger(value) && value >= 0)) {
      throw new Error('Invalid statistics');
    }
    visitors.textContent = T('Уникальных браузеров: ','Unique browsers: ') + data.total.toLocaleString(GL ? 'en-US' : 'ru-RU');
    likes.textContent = T('Лайков: ','Likes: ') + data.likes.toLocaleString(GL ? 'en-US' : 'ru-RU');
    button.setAttribute('aria-pressed', String(data.liked === true));
    button.textContent = data.liked ? T('♥ Нравится','♥ Like') : T('♡ Нравится','♡ Like');
    button.disabled = !id || !data.registered || data.owner === true;
    stats.hidden = false;
    if (data.owner === true) {
      authorMode.hidden = false;
      authorForm.hidden = true;
      authorExit.hidden = false;
      authorStatus.textContent = T('Вы — автор гайда.','You are the guide author.');
    }
  }
  function openAuthorForm() {
    authorMode.hidden = false;
    authorMode.scrollIntoView({ block: 'center' });
  }
  authorForm.addEventListener('submit', async event => {
    event.preventDefault();
    const key = authorInput.value.trim();
    authorInput.value = '';
    const submit = authorForm.querySelector('button');
    submit.disabled = true;
    try {
      const data = await request(counter.content, 'GET', key);
      if (data.owner !== true) throw new Error('Owner verification failed');
      localStorage.setItem(authorStorage, key);
      render(data);
    } catch (error) {
      authorStatus.textContent = error.status === 401 ? T('Ключ не подошёл.','Wrong key.') : T('Не удалось включить режим автора.','Could not enable author mode.');
    } finally {
      submit.disabled = false;
    }
  });
  authorExit.addEventListener('click', () => {
    localStorage.removeItem(authorStorage);
    location.hash = 'author-mode';
    location.reload();
  });
  if (location.hash === '#author-mode') openAuthorForm();
  window.addEventListener('hashchange', () => {
    if (location.hash === '#author-mode') openAuthorForm();
  });
  try {
    const authorPage = location.hash === '#author-mode';
    render(await request(counter.content, !authorPage && !ownerKey && id ? 'POST' : 'GET', ownerKey));
  } catch (error) {
    if (ownerKey && error.status === 401) {
      openAuthorForm();
      authorStatus.textContent = T('Ключ изменился. Введите новый.','The key has changed. Enter the new one.');
    }
  }
  button.addEventListener('click', async () => {
    button.disabled = true;
    status.textContent = '';
    try {
      const method = button.getAttribute('aria-pressed') === 'true' ? 'DELETE' : 'PUT';
      render(await request(new URL('/likes', counter.content), method));
    } catch (error) {
      status.textContent = T('Не удалось сохранить отметку. Попробуйте ещё раз.','Could not save. Please try again.');
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
  const slug = '/slime-vr-setup';
  const votedKey = 'slimevr-guide-iine-voted';
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
    showCount((await send('get_hits', { page_slugs: [slug] }))[slug]);
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
      showCount((await send('get_hits', { page_slugs: [slug] }))[slug]);
    } catch {
      label.textContent = T('Число лайков пока недоступно','Like count is unavailable right now');
    }
  });
})();
