var GL=(document.documentElement.lang||'ru').slice(0,2)==='en';
(function () {
  var wraps = document.querySelectorAll('.three-wrap');
  if (!window.THREE || !window.HYP) { wraps.forEach(function (w) { w.classList.add('nogl'); }); return; }
  var T = window.THREE;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Коробка, см: снаружи 20.3 × 10.3 × 6.0, внутри 18.2 × 9.1 × 5.3
  var W = 20.3, D = 10.3, H = 6.0, TE = (20.3 - 18.2) / 2, TL = (10.3 - 9.1) / 2, TB = 6.0 - 5.3;
  var floorTop = -H / 2 + TB;
  var PORT_X = -1.64;                      // разъём USB‑C трекера напротив выреза
  var SLOT_X = PORT_X, SLOT_W = 1.5, SLOT_FLOOR = 0.45;
  var trY = floorTop + 0.14 + HYP.h[2] * 0.1;
  var PORT_Z = 2.48;                       // боковая стенка корпуса с разъёмом
  var PORT_Y = trY + 0.045;
  var RELIEF_END = 5.0;                    // конец хвостовика штекера внутри выреза

  function woodTexture(vertical) {
    var c = document.createElement('canvas'); c.width = 512; c.height = 256;
    var g = c.getContext('2d');
    g.fillStyle = '#d8b383'; g.fillRect(0, 0, 512, 256);
    for (var i = 0; i < 70; i++) {
      var y = Math.random() * 256, a = 0.08 + Math.random() * 0.18;
      g.strokeStyle = 'rgba(150,96,48,' + a + ')';
      g.lineWidth = 0.6 + Math.random() * 2.2;
      g.beginPath(); g.moveTo(0, y);
      for (var x = 0; x <= 512; x += 32) g.lineTo(x, y + Math.sin(x / 90 + i) * 2.5);
      g.stroke();
    }
    var tex = new T.CanvasTexture(c);
    tex.encoding = T.sRGBEncoding;
    tex.wrapS = tex.wrapT = T.RepeatWrapping;
    if (vertical) tex.rotation = Math.PI / 2;
    return tex;
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

  function letterTexture(ch) {
    var c = document.createElement('canvas'); c.width = 128; c.height = 128;
    var g = c.getContext('2d');
    g.fillStyle = 'rgba(70,60,55,0.75)';
    g.font = '300 92px Arial, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(ch, 64, 68);
    return new T.CanvasTexture(c);
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

  function buildBox(withAux) {
    var group = new T.Group();
    var wood = new T.MeshStandardMaterial({ map: woodTexture(false), roughness: 0.85 });
    var woodV = new T.MeshStandardMaterial({ map: woodTexture(true), roughness: 0.85 });
    function slab(w, h, d, x, y, z, mat) {
      var m = new T.Mesh(new T.BoxGeometry(w, h, d), mat || wood);
      m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; group.add(m); return m;
    }
    var wallH = H - TB, wallY = floorTop + wallH / 2;
    slab(W, TB, D, 0, -H / 2 + TB / 2, 0);
    slab(TE, wallH, D, -W / 2 + TE / 2, wallY, 0, woodV);
    slab(TE, wallH, D, W / 2 - TE / 2, wallY, 0, woodV);
    slab(W - 2 * TE, wallH, TL, 0, wallY, -D / 2 + TL / 2);
    var x0 = -W / 2 + TE, x1 = W / 2 - TE, s0 = SLOT_X - SLOT_W / 2, s1 = SLOT_X + SLOT_W / 2;
    slab(s0 - x0, wallH, TL, (x0 + s0) / 2, wallY, D / 2 - TL / 2);
    slab(x1 - s1, wallH, TL, (s1 + x1) / 2, wallY, D / 2 - TL / 2);
    slab(SLOT_W, SLOT_FLOOR, TL, SLOT_X, floorTop + SLOT_FLOOR / 2, D / 2 - TL / 2);

    var tape = new T.Mesh(new T.BoxGeometry(7.2, 0.14, 3.7), new T.MeshStandardMaterial({ color: 0x1d1c20, roughness: 0.95 }));
    tape.position.set(0, floorTop + 0.07, 0); tape.receiveShadow = true; group.add(tape);

    // трекер в корпусе Hyperion (модель Guide_models1), разъёмом к вырезу
    function hypMesh(b64, half, mat) {
      var raw = atob(b64), n = raw.length / 2, out = new Float32Array(n), tmp = [0, 0, 0];
      for (var i = 0; i < n; i++) {
        var v = raw.charCodeAt(2 * i) | (raw.charCodeAt(2 * i + 1) << 8); if (v > 32767) v -= 65536;
        tmp[i % 3] = v / 32767 * half[i % 3] * 0.1;
        if (i % 3 === 2) { out[i - 2] = tmp[0]; out[i - 1] = tmp[2]; out[i] = -tmp[1]; }
      }
      var g = new T.BufferGeometry(); g.setAttribute('position', new T.BufferAttribute(out, 3)); g.computeVertexNormals();
      var m = new T.Mesh(g, mat); m.castShadow = true; m.receiveShadow = true; return m;
    }
    var tr = new T.Group();
    tr.add(hypMesh(HYP.caseB64, HYP.h, new T.MeshStandardMaterial({ color: 0x34323b, roughness: 0.55 })));
    tr.rotation.y = Math.PI; tr.position.set(0, trY, 0); group.add(tr);
    if (withAux) {
      var topY = trY + HYP.h[2] * 0.1;
      var tape2 = new T.Mesh(new T.BoxGeometry(3.6, 0.14, 3.0), new T.MeshStandardMaterial({ color: 0x1d1c20, roughness: 0.95 }));
      tape2.position.set(0, topY + 0.07, 0); group.add(tape2);
      var aux = new T.Group();
      aux.add(hypMesh(HYP.auxB64, HYP.auxH, new T.MeshStandardMaterial({ color: 0x5e8f7a, roughness: 0.55 })));
      aux.rotation.y = Math.PI; aux.position.set(0, topY + 0.14 + HYP.auxH[2] * 0.1, 0); group.add(aux);
    }

    // штекер в разъёме трекера, хвостовик уходит в вырез
    var plug = buildPlug(); plug.position.set(PORT_X, PORT_Y, PORT_Z); group.add(plug);

    function letter(ch, pos, rot) {
      var m = new T.Mesh(new T.PlaneGeometry(1.6, 1.6), new T.MeshBasicMaterial({ map: letterTexture(ch), transparent: true, depthWrite: false }));
      m.position.copy(pos); m.rotation.set(rot[0], rot[1], rot[2]); group.add(m);
    }
    letter('Z', new T.Vector3(6.6, floorTop + 0.01, -2.4), [-Math.PI / 2, 0, 0]);
    letter('X', new T.Vector3(W / 2 + 0.01, 0, 0), [0, Math.PI / 2, 0]);
    letter('X', new T.Vector3(-W / 2 - 0.01, 0, 0), [0, -Math.PI / 2, 0]);
    letter('Y', new T.Vector3(5.5, 0, -D / 2 - 0.01), [0, Math.PI, 0]);
    letter('Y', new T.Vector3(5.5, 0, D / 2 + 0.01), [0, 0, 0]);
    return group;
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

    var st = { theta: opts.theta, phi: opts.phi, r: opts.r, target: opts.target, auto: !reduce && opts.auto, dirty: true };
    function placeCamera() {
      var t = st.target;
      camera.position.set(t.x + st.r * Math.sin(st.phi) * Math.sin(st.theta), t.y + st.r * Math.cos(st.phi), t.z + st.r * Math.sin(st.phi) * Math.cos(st.theta));
      camera.lookAt(t);
    }
    var drag = null;
    canvas.addEventListener('pointerdown', function (e) { drag = { x: e.clientX, y: e.clientY }; st.auto = false; canvas.setPointerCapture(e.pointerId); });
    canvas.addEventListener('pointermove', function (e) {
      if (!drag) return;
      st.theta -= (e.clientX - drag.x) * 0.008;
      st.phi = Math.min(1.45, Math.max(0.25, st.phi - (e.clientY - drag.y) * 0.006));
      drag = { x: e.clientX, y: e.clientY }; st.dirty = true;
    });
    function end() { drag = null; }
    canvas.addEventListener('pointerup', end); canvas.addEventListener('pointercancel', end);
    function resize() {
      var w = canvas.clientWidth, h = canvas.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false); camera.aspect = w / h;
      camera.fov = (opts.fov || 34) * (w < 520 ? 1.35 : 1);
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
      var s1 = makeScene(c1, { theta: 0.38, phi: 0.74, r: 29, target: new T.Vector3(0, -1.2, 2.5), groundY: -H / 2, auto: true });
      var box1 = null, cable1 = null;
      var build1 = function () {
        if (box1) s1.scene.remove(box1);
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
        { q: basis([0, 0, -1], [0, -1, 0], [-1, 0, 0]), c: STRAIGHT, f: LEFT, t: GL ? 'Start. Box upside down, end pressed against the stop, cable cut-out on the left. Now restart the tracker.' : 'Старт. Коробочка вверх ногами, торцом прижата к упору, вырез с кабелем слева. Теперь перезагрузите трекер.' },
        { q: basis([0, 0, 1], [0, 1, 0], [-1, 0, 0]), c: STRAIGHT, f: LEFT, t: GL ? 'Position 1. Bottom down, end pressed against the stop. Switch and cable on the left, the cable goes straight out of the cut-out. Console: «Waiting for position 1».' : 'Положение 1. Дном вниз, торец прижат к упору. Выключатель и кабель слева, кабель выходит из выреза прямо. Консоль: «Waiting for position 1».' },
        { q: basis([0, -1, 0], [0, 0, 1], [-1, 0, 0]), c: STRAIGHT, f: LEFT, t: GL ? 'Position 2. Standing on its end, bottom against the stop, open side facing you. The cable comes out on the left and lies on the table.' : 'Положение 2. Стоя на торце, дном к упору, открытой стороной к вам. Кабель выходит слева и ложится на стол.' },
        { q: basis([0, 0, -1], [0, -1, 0], [-1, 0, 0]), c: STRAIGHT, f: LEFT, t: GL ? 'Position 3. Upside down, end against the stop. The tape holds the tracker, cable on the left.' : 'Положение 3. Вверх ногами, торцом к упору. Скотч держит трекер, кабель слева.' },
        { q: basis([0, 1, 0], [0, 0, 1], [1, 0, 0]), c: STRAIGHT, f: RIGHT, t: GL ? 'Position 4. Standing on the other end, bottom against the stop. The cable now comes out on the right.' : 'Положение 4. Стоя на другом торце, дном к упору. Кабель теперь выходит справа.' },
        { q: basis([-1, 0, 0], [0, 0, 1], [0, 1, 0]), c: STRAIGHT, f: LEFT, t: GL ? 'Position 5. On its long side, bottom against the stop, cut-out on top. The cable goes up and gently drops to the table without pulling the box.' : 'Положение 5. На длинном боку, дном к упору, вырез сверху. Кабель уходит вверх и мягко спускается на стол, не натягивая коробочку.' },
        { q: basis([1, 0, 0], [0, 0, 1], [0, -1, 0]), c: BENT, f: LEFT, t: GL ? 'Position 6. On the other long side, cut-out at the bottom. Bend the cable inside the cut-out and lead it out through the open side towards you so it does not lift the box. The console will then print «Calibration data gathered».' : 'Положение 6. На другом длинном боку, вырез снизу. Подогните кабель внутри выреза и выведите через открытую сторону к себе, чтобы он не приподнимал коробочку. После этого консоль напишет «Calibration data gathered».' }
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
        theta: 0.3, phi: 0.95, r: 58, target: new T.Vector3(-3, 4, -2), groundY: -1.02, auto: false,
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
        if (box) s2.scene.remove(box);
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
      var go = function (i) {
        if (i === current && !anim) return;
        anim = { from: box.quaternion.clone(), to: poses[i].q, k: 0, fromPose: poses[current], toPose: poses[i] };
        current = i; caption.textContent = poses[i].t;
        buttons.forEach(function (b) { b.setAttribute('aria-pressed', String(+b.dataset.pos === i)); });
        s2.state.dirty = true;
      };
      buttons.forEach(function (b) { b.addEventListener('click', function () { go(+b.dataset.pos); }); });
      buttons[0].setAttribute('aria-pressed', 'true');
    }

    // Переключатель «без ответвления / с ответвлением» для обеих сцен
    var toggles = document.querySelectorAll('input[name="aux-mode"], .aux-toggle input');
    document.querySelectorAll('.aux-toggle input').forEach(function (inp) {
      inp.addEventListener('change', function () {
        withAux = inp.value === 'aux';
        document.querySelectorAll('.aux-toggle input').forEach(function (o) { o.checked = (o.value === inp.value); });
        document.querySelectorAll('.aux-note').forEach(function (n) { n.hidden = !withAux; });
        rebuilders.forEach(function (fn) { fn(); });
      });
    });
  } catch (err) {
    console.error(err);
    wraps.forEach(function (w) { w.classList.add('nogl'); });
  }
})();
