(function () {
  var btn = document.getElementById('dl-models'), st = document.getElementById('dl-status');
  if (!btn || !window.MODELS_ZIP) return;
  function blob() {
    var raw = atob(window.MODELS_ZIP), u = new Uint8Array(raw.length);
    for (var i = 0; i < raw.length; i++) u[i] = raw.charCodeAt(i);
    return new Blob([u], { type: 'application/zip' });
  }
  var dlPromise = (window.claude && window.claude.use) ? window.claude.use('downloads') : Promise.resolve(null);
  btn.addEventListener('click', function () {
    dlPromise.then(function (downloads) {
      if (downloads) {
        return downloads.save({ filename: 'SlimeVR_Hyperion_models.zip', data: blob() }).then(function () { st.textContent = 'Готово.'; }, function (e) {
          st.textContent = e && e.code === 'declined' ? 'Скачивание отменено.' : 'Скачать здесь не получилось. Откройте HTML‑файл гайда в браузере и нажмите кнопку там.';
        });
      }
      var url = URL.createObjectURL(blob()), a = document.createElement('a');
      a.href = url; a.download = 'SlimeVR_Hyperion_models.zip'; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
    });
  });
})();

(function(){var b=document.getElementById('dc-copy'),h=document.getElementById('dc-hint');if(!b)return;
b.addEventListener('click',function(){var t='skrebi_vishe_';var ok=function(){h.textContent='Скопировано';setTimeout(function(){h.textContent='Скопировать';},1800);};
try{navigator.clipboard.writeText(t).then(ok,function(){h.textContent='Ник: '+t;});}catch(e){h.textContent='Ник: '+t;}});})();
