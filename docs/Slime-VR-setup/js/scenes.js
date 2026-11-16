var GLANG=document.documentElement.lang||'ru',GL=GLANG!=='ru';function TR(ru,en){if(!GL)return ru;var d=window.GUIDE_I18N;return d&&d[en]||en;}
(function () {
  var wraps = document.querySelectorAll('.three-wrap');
  if (!window.THREE || !window.HYP) { wraps.forEach(function (w) { w.classList.add('nogl'); }); return; }
  var T = window.THREE;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Коробка, см: снаружи 20.3 × 10.3 × 6.0, все стенки и дно одной толщины 6 мм → внутри 19.1 × 9.1 × 5.4
  var W = 20.3, D = 10.3, H = 6.0, WALL = 0.6, TE = WALL, TL = WALL, TB = WALL;
  var floorTop = -H / 2 + TB;
  var PORT_X = -1.64;                      // разъём USB‑C трекера напротив выреза
  var SLOT_X = PORT_X, SLOT_W = 1.5, SLOT_FLOOR = 0.45;
  var trY = floorTop + 0.14 + HYP.h[2] * 0.1;
  var PORT_Z = 2.04;                       // штекер вставлен до упора: металл в гнезде, корпус штекера касается стенки трекера (стенка z = 2.05)
  var PORT_Y = trY + 0.045;
  var RELIEF_END = PORT_Z + 2.85;          // конец хвостовика штекера внутри выреза

  // Детерминированный генератор случайных чисел: текстуры одинаковые при каждой пересборке сцены
  function rng(seed) { return function () { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; }; }

  // Дерево: бесшовная текстура (повторяется без стыков), волокна вдоль оси u.
  // Один размер в сантиметрах на все детали, поэтому рисунок нигде не растягивается.
  var WOOD_CM = 14;
  function woodTexture() {
    var N = 512, c = document.createElement('canvas'); c.width = c.height = N;
    var g = c.getContext('2d'), R = rng(20251116), TAU = Math.PI * 2;
    var img = g.createImageData(N, N), d = img.data;
    for (var y = 0; y < N; y++) {
      for (var x = 0; x < N; x++) {
        var t = y / N, sx = x / N;
        // широкие тёплые полосы годовых колец, слегка волнистые; все функции периодичны — швов нет
        var band = Math.sin(TAU * (t * 9 + 0.18 * Math.sin(TAU * sx) + 0.07 * Math.sin(TAU * (sx * 2 + t)))) * 0.5 + 0.5;
        var slow = Math.sin(TAU * (t * 2 + sx)) * 0.5 + 0.5;
        var k = 0.55 * band + 0.25 * slow;
        var i = (y * N + x) * 4;
        d[i] = 222 - 30 * k; d[i + 1] = 187 - 34 * k; d[i + 2] = 142 - 36 * k; d[i + 3] = 255;
      }
    }
    for (var n = 0; n < d.length; n += 4) { var j = (R() - 0.5) * 10; d[n] += j; d[n + 1] += j; d[n + 2] += j; }
    g.putImageData(img, 0, 0);
    // тонкие волокна: периодичны по горизонтали, по вертикали дублируются со сдвигом на высоту — бесшовно
    for (var l = 0; l < 140; l++) {
      var y0 = R() * N, amp = 1 + R() * 3, ph = R() * TAU, k2 = 1 + Math.floor(R() * 2);
      g.strokeStyle = 'rgba(128,82,40,' + (0.05 + R() * 0.13).toFixed(3) + ')';
      g.lineWidth = 0.5 + R() * 1.4;
      for (var off = -N; off <= N; off += N) {
        g.beginPath();
        for (var x2 = 0; x2 <= N; x2 += 8) {
          var yy = y0 + off + amp * Math.sin(TAU * k2 * x2 / N + ph);
          if (x2) g.lineTo(x2, yy); else g.moveTo(x2, yy);
        }
        g.stroke();
      }
    }
    var tex = new T.CanvasTexture(c);
    tex.encoding = T.sRGBEncoding;
    tex.wrapS = tex.wrapT = T.RepeatWrapping;
    tex.anisotropy = 4;
    return tex;
  }
  var WOOD = null;
  function woodMat() { return WOOD || (WOOD = new T.MeshStandardMaterial({ map: woodTexture(), roughness: 0.82 })); }
  // Развёртка доски по её реальным размерам: волокна вдоль самой длинной стороны, масштаб везде один.
  function woodUV(geo, w, h, d, cx, cy, cz) {
    var pos = geo.attributes.position, nor = geo.attributes.normal, uv = geo.attributes.uv;
    var size = [w, h, d], c = [cx, cy, cz];
    var grain = size.indexOf(Math.max(w, h, d));
    for (var i = 0; i < pos.count; i++) {
      var n = [Math.abs(nor.getX(i)), Math.abs(nor.getY(i)), Math.abs(nor.getZ(i))];
      var na = n.indexOf(Math.max(n[0], n[1], n[2]));
      var axes = [0, 1, 2].filter(function (a) { return a !== na; });
      var ua = axes.indexOf(grain) >= 0 ? grain : (size[axes[0]] >= size[axes[1]] ? axes[0] : axes[1]);
      var va = axes[0] === ua ? axes[1] : axes[0];
      var p = [pos.getX(i) + c[0], pos.getY(i) + c[1], pos.getZ(i) + c[2]];
      uv.setXY(i, p[ua] / WOOD_CM + 0.37 * ua, p[va] / WOOD_CM + 0.21 * va);
    }
    uv.needsUpdate = true;
  }

  // Чёрный пластик 3D‑печати: тонкие линии слоёв (по бокам — горизонтальные, сверху — диагональные, как на фото)
  function printTexture() {
    var N = 256, c = document.createElement('canvas'); c.width = c.height = N;
    var g = c.getContext('2d'), R = rng(77);
    g.fillStyle = '#808080'; g.fillRect(0, 0, N, N);
    for (var y = 0; y < N; y += 4) {
      g.fillStyle = 'rgba(255,255,255,0.32)'; g.fillRect(0, y, N, 2);
      g.fillStyle = 'rgba(0,0,0,0.22)'; g.fillRect(0, y + 2, N, 1);
    }
    var img = g.getImageData(0, 0, N, N), d = img.data;
    for (var n = 0; n < d.length; n += 4) { var j = (R() - 0.5) * 26; d[n] += j; d[n + 1] += j; d[n + 2] += j; }
    g.putImageData(img, 0, 0);
    var t = new T.CanvasTexture(c); t.wrapS = t.wrapT = T.RepeatWrapping; t.anisotropy = 4; return t;
  }
  var PLASTIC = null;
  function plasticMat() {
    if (PLASTIC) return PLASTIC;
    var bump = printTexture();
    PLASTIC = new T.MeshStandardMaterial({ color: 0x141317, roughness: 0.78, metalness: 0.0, roughnessMap: bump, bumpMap: bump, bumpScale: 0.03 });
    return PLASTIC;
  }
  var LAYER_CM = 4;                       // один повтор текстуры = 4 см (64 линии, шаг ≈ 0.6 мм — видно, но без ряби)
  function plasticUV(geo) {
    var pos = geo.attributes.position, nor = geo.attributes.normal, uv = new Float32Array(pos.count * 2), s = 1 / LAYER_CM;
    for (var i = 0; i < pos.count; i++) {
      var x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
      if (Math.abs(nor.getY(i)) > 0.7) { uv[2 * i] = (x + z) * 0.7071 * s; uv[2 * i + 1] = (x - z) * 0.7071 * s; }
      else { uv[2 * i] = (x + z) * s; uv[2 * i + 1] = y * s; }
    }
    geo.setAttribute('uv', new T.BufferAttribute(uv, 2));
  }
  function braidTexture() {
    var c = document.createElement('canvas'); c.width = 64; c.height = 64;
    var g = c.getContext('2d');
    g.fillStyle = '#26252b'; g.fillRect(0, 0, 64, 64);
    g.strokeStyle = 'rgba(150,146,160,0.55)'; g.lineWidth = 3;
    for (var i = -64; i < 128; i += 12) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i + 64, 64); g.stroke(); }
    g.strokeStyle = 'rgba(0,0,0,0.45)'; g.lineWidth = 2;
    for (var j = -64; j < 128; j += 12) { g.beginPath(); g.moveTo(j + 64, 0); g.lineTo(j, 64); g.stroke(); }
    var t = new T.CanvasTexture(c); t.encoding = T.sRGBEncoding;
    t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(60, 2); return t;
  }
  var cableMat = new T.MeshStandardMaterial({ map: braidTexture(), roughness: 0.75 });

  // Подпись грани: ось и знак относительно трекера (X+ — куда смотрит стрелка, Y− — сторона с Type‑C, Z+ — вверх)
  var LETTERS = {};
  function letterTexture(txt) {
    if (LETTERS[txt]) return LETTERS[txt];
    var c = document.createElement('canvas'); c.width = 256; c.height = 128;
    var g = c.getContext('2d');
    g.fillStyle = 'rgba(52,40,32,0.9)';
    g.font = '600 96px Arial, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(txt, 128, 70);
    var t = new T.CanvasTexture(c); t.anisotropy = 4;
    return (LETTERS[txt] = t);
  }
  function roundedRect(w, h, r) {
    var s = new T.Shape(), x = -w / 2, y = -h / 2;
    s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
    s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
    s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
    return s;
  }

  // Штекер USB‑C: металлический наконечник, корпус, гибкий хвостовик. Ось вдоль +z.
  function buildPlug() {
    var p = new T.Group();
    var metal = new T.MeshStandardMaterial({ color: 0xc9ccd4, metalness: 0.9, roughness: 0.25 });
    var shell = new T.Mesh(new T.ExtrudeGeometry(roundedRect(0.84, 0.26, 0.12), { depth: 0.45, bevelEnabled: false }), metal);
    shell.position.z = -0.35; p.add(shell);
    var housing = new T.Mesh(new T.ExtrudeGeometry(roundedRect(1.12, 0.62, 0.28), { depth: 1.7, bevelEnabled: true, bevelThickness: 0.08, bevelSize: 0.06, bevelSegments: 3 }),
      new T.MeshStandardMaterial({ color: 0x2c2b31, roughness: 0.35, metalness: 0.1 }));
    housing.position.z = 0.1; housing.castShadow = true; p.add(housing);
    var band = new T.Mesh(new T.ExtrudeGeometry(roundedRect(1.16, 0.66, 0.3), { depth: 0.12, bevelEnabled: false }), metal);
    band.position.z = 0.12; p.add(band);
    var relief = new T.Mesh(new T.CylinderGeometry(0.24, 0.33, 0.95, 20), new T.MeshStandardMaterial({ color: 0x1f1e23, roughness: 0.6 }));
    relief.rotation.x = Math.PI / 2; relief.position.z = 1.9 + 0.47; relief.castShadow = true; p.add(relief);
    return p;
  }
  function tube(points, old) {
    var curve = new T.CatmullRomCurve3(points, false, 'centripetal');
    var g = new T.TubeGeometry(curve, 200, 0.2, 12, false);
    if (old) { old.geometry.dispose(); old.geometry = g; return old; }
    var m = new T.Mesh(g, cableMat); m.castShadow = true; return m;
  }

  var GEO = {};
  function hypGeo(key, b64, half) {
    if (GEO[key]) return GEO[key];
    var raw = atob(b64), n = raw.length / 2, out = new Float32Array(n), tmp = [0, 0, 0];
    for (var i = 0; i < n; i++) {
      var v = raw.charCodeAt(2 * i) | (raw.charCodeAt(2 * i + 1) << 8); if (v > 32767) v -= 65536;
      tmp[i % 3] = v / 32767 * half[i % 3] * 0.1;
      if (i % 3 === 2) { out[i - 2] = tmp[0]; out[i - 1] = tmp[2]; out[i] = -tmp[1]; }
    }
    var g = new T.BufferGeometry(); g.setAttribute('position', new T.BufferAttribute(out, 3)); g.computeVertexNormals();
    plasticUV(g); g.userData.keep = true;
    return (GEO[key] = g);
  }
  function keep(g) { g.userData.keep = true; return g; }

  // Доска коробочки. Коробочка выглядит цельной: скругляются только рёбра на её внешнем контуре
  // (вертикальные углы, нижние рёбра, внешний край верха стенок). Стыки досок и внутренние рёбра остаются прямыми.
  // outer[a] = [мин. сторона, макс. сторона] оси a лежит на внешней поверхности коробочки.
  var ROUND_CM = 0.28;                     // ≈3 мм на всех внешних рёбрах (меньше половины толщины стенки 6 мм — радиус везде одинаковый)
  function roundedBoxGeo(w, h, d, r, outer) {
    var K = 4, n = 2 * K + 1, half = [w / 2, h / 2, d / 2];
    r = Math.min(r, Math.min(w, h, d) * 0.5);
    var g = new T.BoxGeometry(w, h, d, n, n, n), pos = g.attributes.position, nor = g.attributes.normal;
    var v = new T.Vector3(), inner = new T.Vector3(), dlt = new T.Vector3();
    for (var i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i);
      for (var a = 0; a < 3; a++) {
        var hh = half[a], x = v.getComponent(a), idx = Math.round((x + hh) / (2 * hh) * n);
        var lo = outer[a][0] ? -hh + r : -hh, hi = outer[a][1] ? hh - r : hh;
        // сетка сгущается только у скругляемых сторон; остальное — ровная грань
        var q = x;
        if (outer[a][0] && idx <= K) q = -hh + r * idx / K;
        else if (outer[a][1] && idx >= n - K) q = hh - r * (n - idx) / K;
        v.setComponent(a, q);
        inner.setComponent(a, Math.max(lo, Math.min(hi, q)));
      }
      dlt.subVectors(v, inner);
      if (dlt.lengthSq() > 1e-12) {
        dlt.normalize(); v.copy(inner).addScaledVector(dlt, r);
        nor.setXYZ(i, dlt.x, dlt.y, dlt.z);
      }
      pos.setXYZ(i, v.x, v.y, v.z);
    }
    pos.needsUpdate = nor.needsUpdate = true;
    return g;
  }

  function buildBox(withAux) {
    var group = new T.Group(), wood = woodMat();
    function slab(w, h, d, x, y, z) {
      var e = 1e-3, outer = [[x - w / 2 < -W / 2 + e, x + w / 2 > W / 2 - e], [y - h / 2 < -H / 2 + e, y + h / 2 > H / 2 - e], [z - d / 2 < -D / 2 + e, z + d / 2 > D / 2 - e]];
      var g = roundedBoxGeo(w, h, d, ROUND_CM, outer); woodUV(g, w, h, d, x, y, z);
      var m = new T.Mesh(g, wood);
      m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; group.add(m); return m;
    }
    var wallH = H - TB, wallY = floorTop + wallH / 2;
    slab(W, TB, D, 0, -H / 2 + TB / 2, 0);
    slab(TE, wallH, D, -W / 2 + TE / 2, wallY, 0);
    slab(TE, wallH, D, W / 2 - TE / 2, wallY, 0);
    slab(W - 2 * TE, wallH, TL, 0, wallY, -D / 2 + TL / 2);
    var x0 = -W / 2 + TE, x1 = W / 2 - TE, s0 = SLOT_X - SLOT_W / 2, s1 = SLOT_X + SLOT_W / 2;
    slab(s0 - x0, wallH, TL, (x0 + s0) / 2, wallY, D / 2 - TL / 2);
    slab(x1 - s1, wallH, TL, (s1 + x1) / 2, wallY, D / 2 - TL / 2);
    slab(SLOT_W, SLOT_FLOOR, TL, SLOT_X, floorTop + SLOT_FLOOR / 2, D / 2 - TL / 2);

    var foam = new T.MeshStandardMaterial({ color: 0x1d1c20, roughness: 0.95 });
    var tape = new T.Mesh(new T.BoxGeometry(7.2, 0.14, 3.7), foam);
    tape.position.set(0, floorTop + 0.07, 0); tape.receiveShadow = true; group.add(tape);

    // трекер в корпусе Hyperion (модель Guide_models1), разъёмом к вырезу; рельефная стрелка на крышке модели смотрит в +x (X+)
    var plastic = plasticMat();
    function part(geo, y) { var m = new T.Mesh(geo, plastic); m.castShadow = true; m.receiveShadow = true; m.rotation.y = Math.PI; m.position.set(0, y, 0); group.add(m); return m; }
    part(hypGeo('case', HYP.caseB64, HYP.h), trY);
    var topY = trY + HYP.h[2] * 0.1;
    if (withAux) {
      var tape2 = new T.Mesh(new T.BoxGeometry(3.6, 0.14, 3.0), foam);
      tape2.position.set(0, topY + 0.07, 0); group.add(tape2);
      var auxY = topY + 0.14 + HYP.auxH[2] * 0.1;
      part(hypGeo('aux', HYP.auxB64, HYP.auxH), auxY);
      auxCable(group, auxY, topY);
    }

    // штекер в разъёме трекера, хвостовик уходит в вырез
    var plug = buildPlug(); plug.position.set(PORT_X, PORT_Y, PORT_Z); group.add(plug);

    function letter(txt, pos, rot) {
      var m = new T.Mesh(GEO.letter || (GEO.letter = keep(new T.PlaneGeometry(3.4, 1.7))), new T.MeshBasicMaterial({ map: letterTexture(txt), transparent: true, depthWrite: false }));
      m.position.copy(pos); m.rotation.set(rot[0], rot[1], rot[2]); group.add(m);
    }
    // Знаки осей относительно трекера: X+ — по стрелке, Y− — стенка с вырезом (там Type‑C), Z+ — вверх из коробочки
    letter('Z+', new T.Vector3(-6.4, floorTop + 0.01, -2.4), [-Math.PI / 2, 0, 0]);
    letter('Z\u2212', new T.Vector3(0, -H / 2 - 0.01, 0), [Math.PI / 2, 0, 0]);
    letter('X+', new T.Vector3(W / 2 + 0.01, 0, 0), [0, Math.PI / 2, 0]);
    letter('X\u2212', new T.Vector3(-W / 2 - 0.01, 0, 0), [0, -Math.PI / 2, 0]);
    letter('Y+', new T.Vector3(5.5, 0, -D / 2 - 0.01), [0, Math.PI, 0]);
    letter('Y\u2212', new T.Vector3(5.5, 0, D / 2 + 0.01), [0, 0, 0]);
    return group;
  }
  // Кабель ответвления: один цельный кабель в плотной чёрной оплётке, как на настоящем трекере.
  // Выходит из белого разъёма на торце ответвления (сторона X+), огибает край основного корпуса
  // и входит в белый разъём в гнезде посередине стороны Y+ основного трекера (напротив Type‑C).
  var WIRE_MATS = null, SLEEVE_MAT = null, CONN_GEO = {};
  function auxCable(group, auxY, topY) {
    if (!WIRE_MATS) WIRE_MATS = [0x1b1a1e].map(function (c) { return new T.MeshStandardMaterial({ color: c, roughness: 0.45 }); });
    var connMat = new T.MeshStandardMaterial({ color: 0xf1eee6, roughness: 0.5 });
    var ax = HYP.auxH[0] * 0.1, mz = 2.05;
    var CX = 0.35, CY = trY + 0.48;         // гнездо разъёма посередине стороны Y+ основного корпуса (глубокое отверстие в модели)
    // разъём на торце ответвления
    var c1 = new T.Mesh(CONN_GEO.x || (CONN_GEO.x = keep(new T.BoxGeometry(0.45, 0.42, 0.85))), connMat); c1.position.set(ax - 0.05, auxY + 0.15, 0); c1.castShadow = true; group.add(c1);   // в гнезде на торце ответвления, наружу ~2 мм
    // разъём на боку основного корпуса
    var c2 = new T.Mesh(CONN_GEO.z || (CONN_GEO.z = keep(new T.BoxGeometry(0.85, 0.42, 0.45))), connMat); c2.position.set(CX, CY, -mz + 0.05); c2.castShadow = true; group.add(c2);   // такой же разъём, как на ответвлении, и так же утоплен
    // Длина ≈13–14 см, как у настоящего кабеля: петля ложится на дно коробочки за торцом трекера
    // и возвращается к разъёму вдоль стороны Y+, не задевая скотч и ремешки корпуса.
    var fy = floorTop + 0.26;
    var path = new T.CatmullRomCurve3([
      new T.Vector3(ax + 0.17, auxY + 0.15, 0),
      new T.Vector3(ax + 1.1, auxY + 0.1, 0.05),
      new T.Vector3(4.9, topY + 0.05, 0.35),
      new T.Vector3(6.2, fy + 0.15, 0.9),
      new T.Vector3(7.5, fy, -0.3),
      new T.Vector3(7.4, fy, -2.6),
      new T.Vector3(5.6, fy, -3.8),
      new T.Vector3(3.4, fy, -3.75),
      new T.Vector3(1.4, fy + 0.15, -3.55),
      new T.Vector3(0.55, CY - 0.1, -3.2),
      new T.Vector3(CX, CY, -mz - 0.17)
    ], false, 'centripetal');
    var L = path.getLength();
    // плотная чёрная оплётка по всей длине, вплотную к обоим разъёмам: цветных жил не видно
    var u0 = 0.02 / L, u1 = 1 - 0.02 / L, sp = [];
    for (var k = 0; k <= 120; k++) sp.push(path.getPointAt(u0 + (u1 - u0) * k / 120));
    if (!SLEEVE_MAT) {
      var bt = braidTexture(); bt.repeat.set(1, 1);
      SLEEVE_MAT = new T.MeshStandardMaterial({ map: bt, roughness: 0.8 });
    }
    var sleeveGeo = new T.TubeGeometry(new T.CatmullRomCurve3(sp), 160, 0.21, 14, false);
    var uv = sleeveGeo.attributes.uv, rep = (u1 - u0) * L * 3.2;   // шаг плетения одинаковый при любой длине
    for (var j = 0; j < uv.count; j++) uv.setXY(j, uv.getX(j) * rep, uv.getY(j) * 2);
    var sleeve = new T.Mesh(sleeveGeo, SLEEVE_MAT); sleeve.castShadow = true; sleeve.receiveShadow = true; group.add(sleeve);
    // термоусадка на концах оплётки
    [0.2 / L, 1 - 0.2 / L].forEach(function (uu) {
      var c = path.getPointAt(uu), tg = path.getTangentAt(uu);
      var ring = new T.Mesh(new T.CylinderGeometry(0.245, 0.245, 0.35, 16), WIRE_MATS[0]);
      ring.position.copy(c); ring.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), tg); ring.castShadow = true; group.add(ring);
    });
  }
  // Убрать старую коробку из сцены и освободить память (общие текстуры и модели не трогаем)
  function disposeBox(g) {
    g.traverse(function (o) {
      if (o.geometry && !o.geometry.userData.keep) o.geometry.dispose();
      if (o.material && o.material !== WOOD && o.material !== PLASTIC && !o.material.map && !(WIRE_MATS && WIRE_MATS.indexOf(o.material) >= 0) && o.material !== SLEEVE_MAT) o.material.dispose();
      if (o.material && o.material.map && o.material.transparent) o.material.dispose();
    });
  }

  // Кабель: ближняя часть задана в координатах коробки, хвост ложится на стол к компьютеру.
  var STRAIGHT = { near: [[PORT_X, PORT_Y, RELIEF_END], [PORT_X, PORT_Y, 6.2], [PORT_X, PORT_Y, 7.4]], out: [0, 0, 1] };
  var BENT = { near: [[PORT_X, PORT_Y, RELIEF_END], [PORT_X, PORT_Y + 0.6, 4.86], [PORT_X, PORT_Y + 1.6, 4.86], [PORT_X, H / 2 + 0.4, 4.86], [PORT_X, H / 2 + 1.6, 4.86]], out: [0, 1, 0] };
  function cablePoints(box, route, far, tableY) {
    box.updateMatrixWorld(true);
    var pts = route.near.map(function (p) { return new T.Vector3(p[0], p[1], p[2]).applyMatrix4(box.matrixWorld); });
    var end = pts[pts.length - 1];
    var u = new T.Vector3(route.out[0], route.out[1], route.out[2]).transformDirection(box.matrixWorld);
    var bb = new T.Box3().setFromObject(box);
    var c = bb.getCenter(new T.Vector3()), size = bb.getSize(new T.Vector3());
    var h = new T.Vector3(far.x - c.x, 0, far.z - c.z).normalize();
    var low = tableY + 0.22, extra = [];
    if (u.y > 0.5) {                       // кабель выходит вверх: перекинуть через край и опустить на стол
      var rad = Math.sqrt(size.x * size.x + size.z * size.z) / 2 + 1.2;
      var top = end.clone().addScaledVector(u, 1.2);
      var over = new T.Vector3(c.x + h.x * rad, top.y, c.z + h.z * rad);
      extra = [top, over, new T.Vector3(over.x + h.x * 1.2, (top.y + low) / 2, over.z + h.z * 1.2), new T.Vector3(over.x + h.x * 2.4, low, over.z + h.z * 2.4)];
    } else {                               // выходит вбок: прямо из выреза и плавно на стол
      var p1 = end.clone().addScaledVector(u, 1.0);
      var p2 = end.clone().addScaledVector(u, 2.4); p2.y = (p1.y + low) / 2;
      var p3 = end.clone().addScaledVector(u, 3.6); p3.y = low;
      extra = [p1, p2, p3];
    }
    var last = extra[extra.length - 1];
    var bend = new T.Vector3((last.x + far.x) / 2 + h.z * 2, low, (last.z + far.z) / 2 - h.x * 2);
    var raw = pts.concat(extra, [bend, new T.Vector3(far.x, low, far.z)]);
    var curve = new T.CatmullRomCurve3(raw, false, 'centripetal');
    var sampled = curve.getPoints(160).map(function (p) { if (p.y < low) p.y = low; return p; });
    return sampled;
  }

  function makeScene(canvas, opts) {
    var renderer = new T.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = T.PCFSoftShadowMap;
    renderer.outputEncoding = T.sRGBEncoding;
    var scene = new T.Scene();
    var camera = new T.PerspectiveCamera(opts.fov || 34, 1, 0.1, 400);
    scene.add(new T.HemisphereLight(0xffffff, 0x8f8470, 0.6));
    var sun = new T.DirectionalLight(0xfff6ea, 0.75);
    sun.position.set(14, 26, 18); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
    var sc = sun.shadow.camera; sc.left = -30; sc.right = 30; sc.top = 30; sc.bottom = -30; sc.near = 1; sc.far = 90;
    sun.shadow.bias = -0.0005; scene.add(sun);
    var ground = new T.Mesh(new T.PlaneGeometry(200, 200), new T.ShadowMaterial({ opacity: 0.18 }));
    ground.rotation.x = -Math.PI / 2; ground.position.y = opts.groundY; ground.receiveShadow = true; scene.add(ground);

    var st = { theta: opts.theta, phi: opts.phi, r: opts.r, fit: 1, target: opts.target, auto: !reduce && opts.auto, dirty: true };
    function placeCamera() {
      var t = st.target, r = st.r * st.fit;
      camera.position.set(t.x + r * Math.sin(st.phi) * Math.sin(st.theta), t.y + r * Math.cos(st.phi), t.z + r * Math.sin(st.phi) * Math.cos(st.theta));
      camera.lookAt(t);
    }
    // Управление камерой как во вьюпорте Blender:
    //   зажатое колёсико — вращение, Shift + колёсико — сдвиг, Ctrl + колёсико — масштаб;
    //   прокрутка колёсика — масштаб (страница при этом не листается);
    //   левая кнопка — вращение, Shift + левая — сдвиг (для тачпада и мыши без колёсика);
    //   NumPad 1/3/7 — вид спереди/справа/сверху (с Ctrl — с обратной стороны), 2/4/6/8 — поворот на 15°,
    //   9 — вид с обратной стороны, NumPad «.» или Home — исходный вид, +/− — масштаб.
    var home = { theta: st.theta, phi: st.phi, r: st.r, target: st.target.clone() };
    var PHI_MIN = 0.02, PHI_MAX = Math.PI - 0.02, R_MIN = opts.r * 0.25, R_MAX = opts.r * 3;
    function zoom(k) { st.r = Math.min(R_MAX, Math.max(R_MIN, st.r * k)); st.auto = false; st.dirty = true; }
    function pan(dx, dy) {
      var h = canvas.clientHeight || 1, dist = st.r * st.fit;
      var k = 2 * dist * Math.tan(camera.fov * Math.PI / 360) / h;
      camera.updateMatrixWorld();
      var right = new T.Vector3().setFromMatrixColumn(camera.matrixWorld, 0), up = new T.Vector3().setFromMatrixColumn(camera.matrixWorld, 1);
      st.target.addScaledVector(right, -dx * k).addScaledVector(up, dy * k);
      st.auto = false; st.dirty = true;
    }
    function orbit(dx, dy) {
      st.theta -= dx * 0.008;
      st.phi = Math.min(PHI_MAX, Math.max(PHI_MIN, st.phi - dy * 0.006));
      st.auto = false; st.dirty = true;
    }
    function view(theta, phi) { st.theta = theta; st.phi = Math.min(PHI_MAX, Math.max(PHI_MIN, phi)); st.auto = false; st.dirty = true; }
    function resetView() { st.theta = home.theta; st.phi = home.phi; st.r = home.r; st.target.copy(home.target); st.auto = false; st.dirty = true; }

    var drag = null, hover = false;
    canvas.addEventListener('pointerenter', function () { hover = true; });
    canvas.addEventListener('pointerleave', function () { hover = false; });
    canvas.addEventListener('pointerdown', function (e) {
      if (e.pointerType === 'mouse' && e.button === 2) return;
      if (e.button === 1) e.preventDefault();          // без «автопрокрутки» страницы от колёсика
      var mode = 'orbit';
      if (e.shiftKey) mode = 'pan';
      else if (e.ctrlKey && e.button === 1) mode = 'zoom';
      drag = { x: e.clientX, y: e.clientY, mode: mode, id: e.pointerId };
      st.auto = false;
      try { canvas.setPointerCapture(e.pointerId); } catch (x) {}
    });
    canvas.addEventListener('mousedown', function (e) { if (e.button === 1) e.preventDefault(); });
    canvas.addEventListener('auxclick', function (e) { if (e.button === 1) e.preventDefault(); });
    canvas.addEventListener('pointermove', function (e) {
      if (!drag || e.pointerId !== drag.id) return;
      var dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      drag.x = e.clientX; drag.y = e.clientY;
      if (drag.mode === 'pan') pan(dx, dy);
      else if (drag.mode === 'zoom') zoom(Math.exp(dy * 0.005));
      else if (e.pointerType === 'touch') orbit(dx, 0);     // на телефоне вертикальный жест листает страницу
      else orbit(dx, dy);
    });
    function end() { drag = null; }
    canvas.addEventListener('pointerup', end); canvas.addEventListener('pointercancel', end);
    // колёсико над сценой: масштаб (страница не листается); вне сцены страница листается как обычно
    canvas.addEventListener('wheel', function (e) {
      e.preventDefault();
      var d = e.deltaY * (e.deltaMode === 1 ? 33 : e.deltaMode === 2 ? 400 : 1);
      if (e.shiftKey && !e.ctrlKey) pan(0, -d * 0.5);
      else zoom(Math.exp(d * (e.ctrlKey ? 0.01 : 0.0012)));
    }, { passive: false });
    canvas.addEventListener('contextmenu', function (e) { if (drag) e.preventDefault(); });
    canvas.addEventListener('dblclick', resetView);
    canvas.tabIndex = 0;
    document.addEventListener('keydown', function (e) {
      if (!hover && document.activeElement !== canvas) return;
      var c = e.code, step = Math.PI / 12, back = e.ctrlKey;
      if (c === 'Numpad1') view(back ? Math.PI : 0, Math.PI / 2);
      else if (c === 'Numpad3') view(back ? -Math.PI / 2 : Math.PI / 2, Math.PI / 2);
      else if (c === 'Numpad7') view(back ? Math.PI : 0, back ? PHI_MAX : PHI_MIN);
      else if (c === 'Numpad9') view(st.theta + Math.PI, Math.PI - st.phi);
      else if (c === 'Numpad4') view(st.theta + step, st.phi);
      else if (c === 'Numpad6') view(st.theta - step, st.phi);
      else if (c === 'Numpad8') view(st.theta, st.phi - step);
      else if (c === 'Numpad2') view(st.theta, st.phi + step);
      else if (c === 'NumpadAdd' || (c === 'Equal' && document.activeElement === canvas)) zoom(1 / 1.2);
      else if (c === 'NumpadSubtract' || (c === 'Minus' && document.activeElement === canvas)) zoom(1.2);
      else if (c === 'NumpadDecimal' || c === 'Home') resetView();
      else return;
      e.preventDefault();
    });
    // кнопка «Вернуть вид» под сценой: видна всем, не только тем, кто знает про NumPad «.» и двойной щелчок
    var stage = canvas.parentElement;
    if (stage && stage.parentElement) {
      var bar = document.createElement('div'); bar.className = 'three-tools';
      var rb = document.createElement('button'); rb.type = 'button'; rb.className = 'three-reset';
      var ic = document.createElement('span'); ic.setAttribute('aria-hidden', 'true'); ic.textContent = '\u27F2';
      rb.appendChild(ic); rb.appendChild(document.createTextNode(' ' + TR('Вернуть вид', 'Reset view')));
      rb.title = TR('Вернуть камеру к коробочке (NumPad «.»)', 'Bring the camera back to the box (NumPad “.”)');
      rb.addEventListener('click', resetView);
      bar.appendChild(rb); stage.insertAdjacentElement('afterend', bar);
    }
    // подсказка: на компьютере — как управлять, на телефоне остаётся «Потяните, чтобы повернуть»
    var hint = canvas.parentElement && canvas.parentElement.querySelector('.three-hint');
    if (hint && window.matchMedia && window.matchMedia('(pointer: fine)').matches)
      hint.textContent = TR('Колёсико: масштаб · зажать колёсико: вращать, с Shift — сдвигать · двойной щелчок: сброс', 'Wheel: zoom · hold wheel: orbit, with Shift: pan · double-click: reset');
    function resize() {
      var w = canvas.clientWidth, h = canvas.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false); camera.aspect = w / h;
      // узкий экран (телефон): камера отъезжает, чтобы коробочка целиком помещалась по ширине, а не обрезалась
      st.fit = Math.max(1, (opts.fitAspect || 0) / camera.aspect);
      camera.updateProjectionMatrix(); st.dirty = true;
    }
    if (window.ResizeObserver) new ResizeObserver(resize).observe(canvas); else window.addEventListener('resize', resize);
    resize();
    var visible = true;
    if (window.IntersectionObserver) new IntersectionObserver(function (en) { visible = en[0].isIntersecting; }).observe(canvas);
    var last = performance.now();
    function frame(now) {
      var dt = Math.min(0.05, (now - last) / 1000); last = now;
      if (visible) {
        if (st.auto) { st.theta += dt * 0.25; st.dirty = true; }
        if (opts.tick && opts.tick(dt)) st.dirty = true;
        if (st.dirty) { placeCamera(); renderer.render(scene, camera); st.dirty = false; }
      }
      requestAnimationFrame(frame);
    }
    placeCamera();
    return { scene: scene, state: st, start: function () { renderer.render(scene, camera); requestAnimationFrame(frame); } };
  }

  var withAux = false, rebuilders = [];
  function basis(x, y, z) {
    var m = new T.Matrix4().makeBasis(new T.Vector3().fromArray(x), new T.Vector3().fromArray(y), new T.Vector3().fromArray(z));
    return new T.Quaternion().setFromRotationMatrix(m);
  }
  try {
    // Сцена 1: коробочка крупно, кабель ровно уходит в вырез
    var c1 = document.getElementById('box3d');
    if (c1) {
      var s1 = makeScene(c1, { theta: 0.38, phi: 0.74, r: 29, target: new T.Vector3(0, -1.2, 2.5), groundY: -H / 2, auto: true, fitAspect: 1.45 });
      var box1 = null, cable1 = null;
      var build1 = function () {
        if (box1) { s1.scene.remove(box1); disposeBox(box1); }
        box1 = buildBox(withAux); s1.scene.add(box1);
        var first = !cable1;
        cable1 = tube(cablePoints(box1, STRAIGHT, new T.Vector3(-16, 0, 16), -H / 2), cable1);
        if (first) s1.scene.add(cable1);
        s1.state.dirty = true;
      };
      build1(); rebuilders.push(build1);
      s1.start();
    }

    // Сцена 2: шесть положений у упора, как в видео, кабель уложен в каждом
    var c2 = document.getElementById('pos3d');
    if (c2) {
      var STOP_Z = -9, LEFT = new T.Vector3(-28, 0, 12), RIGHT = new T.Vector3(28, 0, 12);
      // Оси коробки: X вдоль длины, Y к открытой стороне, Z к стенке с вырезом
      var poses = [
        { d: 'Z+', q: basis([0, 0, -1], [0, -1, 0], [-1, 0, 0]), c: STRAIGHT, f: LEFT, t: TR('Старт. Коробочка вверх ногами, торцом прижата к упору, вырез с кабелем слева. Теперь перезагрузите трекер.', 'Start. Box upside down, end pressed against the stop, cable cut-out on the left. Now restart the tracker.') },
        { d: 'Z\u2212', q: basis([0, 0, 1], [0, 1, 0], [-1, 0, 0]), c: STRAIGHT, f: LEFT, t: TR('Положение 1. Дном вниз, торец прижат к упору. Выключатель и кабель слева, кабель выходит из выреза прямо. Консоль: «Waiting for position 1».', 'Position 1. Bottom down, end pressed against the stop. Switch and cable on the left, the cable goes straight out of the cut-out. Console: «Waiting for position 1».') },
        { d: 'X+', q: basis([0, -1, 0], [0, 0, 1], [-1, 0, 0]), c: STRAIGHT, f: LEFT, t: TR('Положение 2. Стоя на торце, дном к упору, открытой стороной к вам. Кабель выходит слева и ложится на стол.', 'Position 2. Standing on its end, bottom against the stop, open side facing you. The cable comes out on the left and lies on the table.') },
        { d: 'Z+', q: basis([0, 0, -1], [0, -1, 0], [-1, 0, 0]), c: STRAIGHT, f: LEFT, t: TR('Положение 3. Вверх ногами, торцом к упору. Скотч держит трекер, кабель слева.', 'Position 3. Upside down, end against the stop. The tape holds the tracker, cable on the left.') },
        { d: 'X\u2212', q: basis([0, 1, 0], [0, 0, 1], [1, 0, 0]), c: STRAIGHT, f: RIGHT, t: TR('Положение 4. Стоя на другом торце, дном к упору. Кабель теперь выходит справа.', 'Position 4. Standing on the other end, bottom against the stop. The cable now comes out on the right.') },
        { d: 'Y+', q: basis([-1, 0, 0], [0, 0, 1], [0, 1, 0]), c: STRAIGHT, f: LEFT, t: TR('Положение 5. На длинном боку, дном к упору, вырез сверху. Кабель уходит вверх и мягко спускается на стол, не натягивая коробочку.', 'Position 5. On its long side, bottom against the stop, cut-out on top. The cable goes up and gently drops to the table without pulling the box.') },
        { d: 'Y\u2212', q: basis([1, 0, 0], [0, 0, 1], [0, -1, 0]), c: BENT, f: LEFT, t: TR('Положение 6. На другом длинном боку, вырез снизу. Подогните кабель внутри выреза и выведите через открытую сторону к себе, чтобы он не приподнимал коробочку. После этого консоль напишет «Calibration data gathered».', 'Position 6. On the other long side, cut-out at the bottom. Bend the cable inside the cut-out and lead it out through the open side towards you so it does not lift the box. The console will then print «Calibration data gathered».') }
      ];
      var box = null, cable = null, anim = null, current = 0;
      var tmp = new T.Box3();
      var settle = function (lift) {
        box.position.set(0, 0, 0); box.updateMatrixWorld(true);
        tmp.setFromObject(box);
        box.position.set(-(tmp.min.x + tmp.max.x) / 2, -tmp.min.y + lift, STOP_Z + 0.9 - tmp.min.z);
      };
      var updateCable = function (pose) { var first = !cable; cable = tube(cablePoints(box, pose.c, pose.f, 0), cable); if (first) s2.scene.add(cable); };
      var s2 = makeScene(c2, {
        theta: 0.3, phi: 0.95, r: 58, target: new T.Vector3(-3, 4, -2), groundY: -1.02, auto: false, fitAspect: 1.35,
        tick: function (dt) {
          if (!anim) return false;
          anim.k = Math.min(1, anim.k + dt / (reduce ? 0.01 : 0.9));
          var e = anim.k < 0.5 ? 2 * anim.k * anim.k : 1 - Math.pow(-2 * anim.k + 2, 2) / 2;
          box.quaternion.copy(anim.from).slerp(anim.to, e);
          settle(Math.sin(Math.PI * e) * 3);
          updateCable(e < 0.5 ? anim.fromPose : anim.toPose);
          if (anim.k >= 1) anim = null;
          return true;
        }
      });
      var build2 = function () {
        var q = box ? box.quaternion.clone() : poses[0].q.clone();
        if (box) { s2.scene.remove(box); disposeBox(box); }
        box = buildBox(withAux); box.quaternion.copy(q); settle(0); s2.scene.add(box);
        updateCable(poses[current]); s2.state.dirty = true;
      };
      build2(); rebuilders.push(build2);
      var stop = new T.Mesh(new T.BoxGeometry(44, 5, 1.8), new T.MeshStandardMaterial({ color: 0x6d6878, roughness: 0.8 }));
      stop.position.set(0, 2.5, STOP_Z - 0.15); stop.castShadow = true; stop.receiveShadow = true; s2.scene.add(stop);
      var table = new T.Mesh(new T.BoxGeometry(80, 1, 46), new T.MeshStandardMaterial({ color: 0xb9b3c4, roughness: 0.9 }));
      table.position.set(0, -0.5, 4); table.receiveShadow = true; s2.scene.add(table);
      s2.start();

      var caption = document.getElementById('pos-caption');
      var buttons = document.querySelectorAll('.pos-buttons button');
      var capText = function (i) { return poses[i].t + ' ' + TR('Вниз смотрит грань', 'Face down:') + ' ' + poses[i].d + '.'; };
      caption.textContent = capText(0);
      var go = function (i) {
        if (i === current && !anim) return;
        anim = { from: box.quaternion.clone(), to: poses[i].q, k: 0, fromPose: poses[current], toPose: poses[i] };
        current = i; caption.textContent = capText(i);
        try { localStorage.setItem('slimevr-guide-pose', String(i)); } catch (e) {}
        buttons.forEach(function (b) { b.setAttribute('aria-pressed', String(+b.dataset.pos === i)); });
        s2.state.dirty = true;
      };
      buttons.forEach(function (b) { b.addEventListener('click', function () { go(+b.dataset.pos); }); });
      // после обновления страницы показать то положение, которое было выбрано (без анимации)
      var savedPose = 0;
      try { savedPose = +localStorage.getItem('slimevr-guide-pose') || 0; } catch (e) {}
      if (!(savedPose >= 0 && savedPose < poses.length)) savedPose = 0;
      current = savedPose;
      box.quaternion.copy(poses[current].q); settle(0); updateCable(poses[current]);
      caption.textContent = capText(current);
      buttons.forEach(function (b) { b.setAttribute('aria-pressed', String(+b.dataset.pos === current)); });
      s2.state.dirty = true;
    }

    // Переключатель «без ответвления / с ответвлением» для обеих сцен
    var toggles = document.querySelectorAll('input[name="aux-mode"], .aux-toggle input');
    var setAux = function (on, save) {
      withAux = on;
      document.querySelectorAll('.aux-toggle input').forEach(function (o) { o.checked = (o.value === (on ? 'aux' : 'main')); });
      document.querySelectorAll('.aux-note').forEach(function (n) { n.hidden = !withAux; });
      rebuilders.forEach(function (fn) { fn(); });
      if (save) { try { localStorage.setItem('slimevr-guide-aux', on ? 'aux' : 'main'); } catch (e) {} }
    };
    document.querySelectorAll('.aux-toggle input').forEach(function (inp) {
      inp.addEventListener('change', function () { setAux(inp.value === 'aux', true); });
    });
    // после обновления страницы: сохранённый выбор (браузер может сам восстановить отметку — сцена должна совпадать с ней)
    var savedAux = null;
    try { savedAux = localStorage.getItem('slimevr-guide-aux'); } catch (e) {}
    var checkedAux = document.querySelector('.aux-toggle input[value="aux"]:checked');
    setAux(savedAux ? savedAux === 'aux' : !!checkedAux, false);
  } catch (err) {
    console.error(err);
    wraps.forEach(function (w) { w.classList.add('nogl'); });
  }
})();
