var GL=(document.documentElement.lang||'ru').slice(0,2)==='en';function T(ru,en){return GL?en:ru;}
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
        return downloads.save({ filename: 'SlimeVR_Hyperion_models.zip', data: blob() }).then(function () { st.textContent = T('Готово.','Done.'); }, function (e) {
          st.textContent = e && e.code === 'declined' ? T('Скачивание отменено.','Download cancelled.') : T('Скачать здесь не получилось. Откройте HTML‑файл гайда в браузере и нажмите кнопку там.','Download is not possible here. Open the guide HTML file in a browser and press the button there.');
        });
      }
      var url = URL.createObjectURL(blob()), a = document.createElement('a');
      a.href = url; a.download = 'SlimeVR_Hyperion_models.zip'; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
    });
  });
})();

(function(){var b=document.getElementById('dc-copy'),h=document.getElementById('dc-hint');if(!b)return;
b.addEventListener('click',function(){var t='skrebi_vishe_';var ok=function(){h.textContent=T('Скопировано','Copied');setTimeout(function(){h.textContent=T('Скопировать ник','Copy nickname');},1800);};
try{navigator.clipboard.writeText(t).then(ok,function(){h.textContent=T('Ник: ','Nickname: ')+t;});}catch(e){h.textContent=T('Ник: ','Nickname: ')+t;}});})();

// Аватар и рамка (украшение аватара) из Discord через Lanyard. Работает, если автор
// состоит на сервере Lanyard. Иначе остаётся локальное фото и рамки нет.
(function(){var img=document.querySelector('.author-avatar');if(!img||!window.fetch)return;
var deco=document.querySelector('.author-deco'),ID='339711054256930828';
fetch('https://api.lanyard.rest/v1/users/'+ID).then(function(r){return r.json();}).then(function(j){
  if(!j||!j.success||!j.data||!j.data.discord_user)return;var u=j.data.discord_user;
  if(u.avatar){var t=new Image();t.onload=function(){if(t.naturalWidth>0)img.src=t.src;};
    t.src='https://cdn.discordapp.com/avatars/'+ID+'/'+u.avatar+(u.avatar.indexOf('a_')===0?'.gif':'.png')+'?size=128';}
  var dd=u.avatar_decoration_data;
  if(deco&&dd&&dd.asset){deco.onload=function(){deco.hidden=false;};
    deco.src='https://cdn.discordapp.com/avatar-decoration-presets/'+dd.asset+'.png?size=160&passthrough=true';}
})['catch'](function(){});})();
