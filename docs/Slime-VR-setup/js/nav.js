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
      fabStep.innerHTML = '';
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
  var close = document.getElementById('toc-close'); if (close) close.addEventListener('click', function () { openToc(false); });
  document.querySelectorAll('.toc a').forEach(function (a) { a.addEventListener('click', function () { openToc(false); }); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') openToc(false); });
})();
