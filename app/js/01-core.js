/* Craton · 01-core.js
 * React globals, maths helpers, procedural rock textures (Canvas2D) and the shared Three.js stage (renderer, OrbitControls, resize, cleanup).
 * Loaded as a classic script; top-level consts are shared across files in load order (see app/index.html).
 */
'use strict';
const { useState, useEffect, useLayoutEffect, useRef, useMemo, useCallback } = React;
const html = htm.bind(React.createElement);

/* ============================== math & utils ============================== */
const DEG = Math.PI / 180;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const mod360 = a => ((a % 360) + 360) % 360;
const f3 = a => String(Math.round(mod360(a)) % 360).padStart(3, '0');
const f2 = a => String(Math.round(a)).padStart(2, '0');
const POINTS8 = ['N','NE','E','SE','S','SW','W','NW'];
const quad = az => POINTS8[Math.round(mod360(az) / 45) % 8];
function rng(seed){ let s = seed >>> 0; return function(){ s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

const MEM = {}, PERSIST_SUBS = {}, PERSIST_ANY = [];
function persistGet(key, fallback){
  if (key in MEM) return MEM[key];
  try { const s = localStorage.getItem('geoatlas:' + key); if (s != null) { const v = JSON.parse(s); MEM[key] = v; return v; } } catch (e) {}
  return typeof fallback === 'function' ? fallback() : fallback;
}
function persistSet(key, val){
  MEM[key] = val;
  try { localStorage.setItem('geoatlas:' + key, JSON.stringify(val)); } catch (e) {}
  (PERSIST_SUBS[key] || []).forEach(fn => fn(val));
  PERSIST_ANY.forEach(fn => fn(key, val));
}
function usePersist(key, init){
  const [v, setV] = useState(() => persistGet(key, init));
  useEffect(() => {
    const sub = val => setV(val);
    const list = PERSIST_SUBS[key] || (PERSIST_SUBS[key] = []);
    list.push(sub);
    return () => { const i = list.indexOf(sub); if (i >= 0) list.splice(i, 1); };
  }, [key]);
  useEffect(() => {
    if (MEM[key] === v) return;
    MEM[key] = v;
    try { localStorage.setItem('geoatlas:' + key, JSON.stringify(v)); } catch (e) {}
    PERSIST_ANY.forEach(fn => fn(key, v));
  }, [key, v]);
  return [v, setV];
}
function readTheme(){
  const cs = getComputedStyle(document.documentElement);
  const g = (k, d) => (cs.getPropertyValue(k) || '').trim() || d;
  return { stage:g('--stage','#d5ded9'), ink:g('--ink','#0e1a15'), mute:g('--mute','#46564f'), line:g('--line','#c5d0ca'),
    acc:g('--acc','#b03c12'), acc2:g('--acc2','#08707e'), chip:g('--chip','#dde5e0'), panel:g('--panel','#fbfcfa') };
}

/* ======================= procedural lithology painter ======================= */
function paintRock(ctx, S, kind, seed){
  const k = S / 256;
  const r = rng(seed * 7919 + kind.length * 131);
  const R = (a, b) => a + (b - a) * r();
  const pick = a => a[(r() * a.length) | 0];
  const N = n => Math.round(n * k * k);
  const wrap = (x, y, m, fn) => { for (const dx of [-S, 0, S]) for (const dy of [-S, 0, S]) { const X = x + dx, Y = y + dy; if (X > -m && X < S + m && Y > -m && Y < S + m) fn(X, Y); } };
  const fill = c => { ctx.globalAlpha = 1; ctx.fillStyle = c; ctx.fillRect(0, 0, S, S); };
  const speck = (n, cols, a, b, alpha) => { ctx.globalAlpha = alpha == null ? 1 : alpha; for (let i = 0; i < N(n); i++) { const s = R(a, b) * k; ctx.fillStyle = pick(cols); ctx.fillRect(R(0, S), R(0, S), s, s); } ctx.globalAlpha = 1; };
  const polyAt = (x, y, rad, n, col, elong, rot, alpha) => {
    const pts = []; for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2 + R(-.3, .3); const rr = rad * R(.6, 1.1); const px = Math.cos(a) * rr * elong, py = Math.sin(a) * rr; pts.push([px * Math.cos(rot) - py * Math.sin(rot), px * Math.sin(rot) + py * Math.cos(rot)]); }
    wrap(x, y, rad * elong + 2, (X, Y) => { ctx.globalAlpha = alpha == null ? 1 : alpha; ctx.fillStyle = col; ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(X + p[0], Y + p[1]) : ctx.moveTo(X + p[0], Y + p[1])); ctx.closePath(); ctx.fill(); });
    ctx.globalAlpha = 1;
  };
  const disc = (x, y, rad, col, alpha, stroke) => wrap(x, y, rad + 2, (X, Y) => { ctx.globalAlpha = alpha == null ? 1 : alpha; ctx.beginPath(); ctx.arc(X, Y, rad, 0, Math.PI * 2); if (col) { ctx.fillStyle = col; ctx.fill(); } if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 1 * k; ctx.stroke(); } ctx.globalAlpha = 1; });

  switch (kind) {
    case 'laterite': {
      fill('#9a3d1c');
      for (let i = 0; i < N(170); i++) disc(R(0, S), R(0, S), R(6, 22) * k, pick(['#b4552a', '#84311a', '#c57b3c', '#a6461f', '#6f2812']), 0.45);
      for (let i = 0; i < N(75); i++) { const x = R(0, S), y = R(0, S), rr = R(2.5, 7.5) * k; disc(x, y, rr, '#4e1a0b', 1, '#c97a40'); disc(x - rr * .3, y - rr * .3, rr * .35, '#7d3418', .9); }
      speck(1800, ['#d08a52', '#5a1f0e', '#b86036'], .8, 1.8, .7);
      break;
    }
    case 'sandstone': {
      fill('#d7b57d');
      const sets = 3, hS = S / sets;
      for (let st = 0; st < sets; st++) {
        const top = st * hS, bot = top + hS, dir = st % 2 ? 1 : 1, step = 8 * k;
        ctx.strokeStyle = 'rgba(118,80,38,0.5)'; ctx.lineWidth = 1.3 * k;
        for (let x = -S; x < 2 * S; x += step) {
          ctx.beginPath(); ctx.moveTo(x, top); ctx.quadraticCurveTo(x + dir * hS * 0.75, top + hS * 0.82, x + dir * hS * 1.55, bot); ctx.stroke();
        }
        ctx.strokeStyle = 'rgba(96,62,26,0.85)'; ctx.lineWidth = 2.2 * k; ctx.beginPath(); ctx.moveTo(0, bot - 1); ctx.lineTo(S, bot - 1); ctx.stroke();
      }
      speck(4200, ['#efd7a8', '#b08a55', '#c9a46a', '#fff2d2', '#8a6a3c'], .7, 1.6, .9);
      break;
    }
    case 'shale': {
      fill('#4a4f53');
      let y = 0;
      while (y < S) {
        const th = R(1.5, 4.5) * k, col = pick(['#3b3f42', '#555b60', '#43484c', '#5e656a', '#33373a']), kk = 1 + ((r() * 3) | 0), ph = R(0, 6.28), amp = R(0.3, 1.2) * k;
        ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(0, y);
        for (let x = 0; x <= S; x += 8 * k) ctx.lineTo(x, y + Math.sin(x / S * Math.PI * 2 * kk + ph) * amp);
        ctx.lineTo(S, y + th + 2 * k); ctx.lineTo(0, y + th + 2 * k); ctx.closePath(); ctx.fill();
        if (r() < 0.12) { ctx.fillStyle = 'rgba(160,165,160,0.35)'; ctx.fillRect(0, y, S, 0.8 * k); }
        y += th;
      }
      ctx.fillStyle = 'rgba(15,17,18,0.55)';
      for (let i = 0; i < N(90); i++) ctx.fillRect(R(0, S), R(0, S), R(6, 26) * k, 0.8 * k);
      break;
    }
    case 'limestone': {
      fill('#cdd0c2');
      speck(2600, ['#bfc2b3', '#dfe1d6', '#aeb1a2'], 1, 2.4, .8);
      ctx.strokeStyle = '#8f9284'; ctx.lineWidth = 1.6 * k;
      const rows = 8, rh = S / rows;
      for (let row = 0; row < rows; row++) {
        const y = row * rh; ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(S, y); ctx.stroke();
        for (let c = 0; c < 4; c++) { const x = c * S / 4 + (row % 2) * S / 8; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + rh); ctx.stroke(); }
      }
      for (let i = 0; i < N(34); i++) { // bivalve fragments
        const x = R(0, S), y = R(0, S), rad = R(4, 9) * k, rot = R(0, 6.28);
        wrap(x, y, rad + 3, (X, Y) => { ctx.save(); ctx.translate(X, Y); ctx.rotate(rot); ctx.strokeStyle = '#6f7266'; ctx.lineWidth = 1.4 * k; ctx.beginPath(); ctx.arc(0, 0, rad, Math.PI, 0); ctx.stroke(); ctx.lineWidth = .7 * k; for (let j = 1; j < 5; j++) { const a = Math.PI + j * Math.PI / 5; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a) * rad, Math.sin(a) * rad); ctx.stroke(); } ctx.restore(); });
      }
      for (let i = 0; i < N(28); i++) { const x = R(0, S), y = R(0, S), rad = R(2, 4) * k; disc(x, y, rad, '#e6e7de', 1, '#76796c'); disc(x, y, rad * .3, '#76796c', 1); }
      break;
    }
    case 'granite': {
      fill('#d4b4a3');
      const mins = [['#e3a088', .32], ['#d98e75', .08], ['#efe9e1', .27], ['#a9aca9', .23], ['#1d1d20', .10]];
      for (let i = 0; i < N(560); i++) {
        let u = r(), m = 0; while (u > mins[m][1] && m < mins.length - 1) { u -= mins[m][1]; m++; }
        const bio = m === 4; polyAt(R(0, S), R(0, S), (bio ? R(1.4, 3.6) : R(3, 8.5)) * k, 5, mins[m][0], bio ? 1.6 : R(1, 1.5), R(0, 6.28), m === 3 ? .85 : 1);
      }
      break;
    }
    case 'gneiss': {
      fill('#c9c0b4');
      let y = -10 * k;
      while (y < S + 10 * k) {
        const th = R(5, 17) * k, dark = r() < 0.45, col = dark ? pick(['#3a3b3f', '#4a4b4f', '#2e3033']) : pick(['#dcd3c6', '#e3c6b4', '#cbbfb0', '#efe6da']);
        const ph = R(0, 6.28), amp = R(3, 9) * k;
        ctx.fillStyle = col; ctx.beginPath();
        for (let x = 0; x <= S; x += 4 * k) ctx.lineTo(x, y + amp * Math.sin(x / S * Math.PI * 4 + ph));
        for (let x = S; x >= 0; x -= 4 * k) ctx.lineTo(x, y + th + amp * Math.sin(x / S * Math.PI * 4 + ph + 0.35));
        ctx.closePath(); ctx.fill(); y += th * 0.85;
      }
      for (let i = 0; i < N(140); i++) polyAt(R(0, S), R(0, S), R(1, 2.4) * k, 5, pick(['#202124', '#f1ece4', '#9fa29f']), 2.4, R(-.12, .12), .6);
      break;
    }
    case 'basalt': {
      fill('#2c2e30');
      speck(7000, ['#3b3e41', '#232527', '#474b4e', '#2f3234'], .6, 1.4, 1);
      speck(120, ['#6f7d3a', '#5e6c2e'], 1, 2.2, 1);
      for (let i = 0; i < N(38); i++) { const x = R(0, S), y = R(0, S), rx = R(2.5, 9) * k, ry = rx * R(.55, .9), rot = R(-.4, .4), amyg = r() < .15;
        wrap(x, y, rx + 3, (X, Y) => { ctx.save(); ctx.translate(X, Y); ctx.rotate(rot); ctx.beginPath(); ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2); ctx.fillStyle = amyg ? '#e7e3d6' : '#121314'; ctx.fill(); ctx.strokeStyle = '#4c5154'; ctx.lineWidth = 1 * k; ctx.stroke(); if (!amyg) { ctx.beginPath(); ctx.ellipse(-rx * .2, -ry * .25, rx * .45, ry * .3, 0, 0, Math.PI * 2); ctx.fillStyle = 'rgba(80,84,88,.5)'; ctx.fill(); } ctx.restore(); }); }
      break;
    }
    case 'marble': {
      fill('#ebe8e1');
      for (let i = 0; i < N(900); i++) polyAt(R(0, S), R(0, S), R(1.8, 4.2) * k, 6, pick(['#f6f4ef', '#e1ded6', '#d8d5cd', '#fffdf8']), 1, 0, .9);
      ctx.strokeStyle = 'rgba(120,126,132,0.55)';
      for (let i = 0; i < 6; i++) { ctx.lineWidth = R(.8, 2.6) * k; ctx.beginPath(); let x = R(0, S), y = R(0, S); ctx.moveTo(x, y); for (let j = 0; j < 6; j++) { x += R(-60, 60) * k; y += R(10, 50) * k; ctx.bezierCurveTo(x - 20 * k, y - 10 * k, x + 15 * k, y - 25 * k, x, y); } ctx.stroke(); }
      break;
    }
    default: fill('#888');
  }
  ctx.globalAlpha = 1;
}
function makeTex(kind, S){
  const c = document.createElement('canvas'); c.width = c.height = S;
  const x = c.getContext('2d'); paintRock(x, S, kind, 3);
  const b = document.createElement('canvas'); b.width = b.height = S;
  const bx = b.getContext('2d'); const id = x.getImageData(0, 0, S, S); const d = id.data;
  for (let i = 0; i < d.length; i += 4) { const l = d[i] * .3 + d[i + 1] * .59 + d[i + 2] * .11; d[i] = d[i + 1] = d[i + 2] = l; }
  bx.putImageData(id, 0, 0);
  const map = new THREE.CanvasTexture(c), bump = new THREE.CanvasTexture(b);
  [map, bump].forEach(t => { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4; });
  map.encoding = THREE.sRGBEncoding;
  return { map, bump };
}

/* ============================== three.js stage ============================== */
function createStage(host, opts){
  const test = document.createElement('canvas');
  if (!(test.getContext('webgl2') || test.getContext('webgl'))) throw new Error('This device or browser has WebGL turned off.');
  const renderer = new THREE.WebGLRenderer({ antialias: (window.devicePixelRatio || 1) < 2, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.localClippingEnabled = true;
  const canvas = renderer.domElement;
  canvas.style.cssText = 'display:block;width:100%;height:100%;touch-action:none;outline:none';
  host.appendChild(canvas);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(opts.fov || 38, 1, 0.1, 200);
  camera.position.set(...opts.cam);
  const controls = new THREE.OrbitControls(camera, canvas);
  controls.target.set(...(opts.target || [0, 0, 0]));
  controls.enableDamping = true; controls.dampingFactor = 0.12; controls.screenSpacePanning = true;
  controls.minDistance = opts.minD || 3; controls.maxDistance = opts.maxD || 40;
  controls.update();
  let dirty = true, raf = 0, alive = true;
  const stage = { renderer, scene, camera, controls, canvas, onFrame: null, tween: null,
    invalidate(){ dirty = true; },
    home: { pos: camera.position.clone(), target: controls.target.clone() } };
  const _dir = new THREE.Vector3();
  stage.fitPos = (dirArr, tgt, rad) => { const vf = camera.fov * DEG, hf = 2 * Math.atan(Math.tan(vf / 2) * camera.aspect); const dist = rad / Math.sin(Math.min(vf, hf) / 2); _dir.set(...dirArr).normalize(); return [tgt[0] + _dir.x * dist, tgt[1] + _dir.y * dist, tgt[2] + _dir.z * dist]; };
  stage.flyTo = (pos, target) => { stage.tween = { p0: camera.position.clone(), t0: controls.target.clone(), p1: new THREE.Vector3(...pos), t1: new THREE.Vector3(...target), u: 0 }; dirty = true; };
  stage.resetView = () => stage.flyTo(stage.home.pos.toArray(), stage.home.target.toArray());
  controls.addEventListener('change', () => { dirty = true; });
  controls.addEventListener('start', () => { stage.tween = null; stage.userMoved = true; });
  const resize = () => { const w = host.clientWidth, h = host.clientHeight; if (!w || !h) return; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
    if (opts.fit) { const t = opts.target || [0, 0, 0]; const d = [opts.cam[0] - t[0], opts.cam[1] - t[1], opts.cam[2] - t[2]]; const p = stage.fitPos(d, t, opts.fit); stage.home.pos.set(...p); if (!stage.userMoved && !stage.tween) { camera.position.set(...p); controls.update(); } }
    dirty = true; };
  const ro = new ResizeObserver(resize); ro.observe(host); resize();
  const loop = () => {
    if (!alive) return; raf = requestAnimationFrame(loop);
    if (stage.tween) { const t = stage.tween; t.u = Math.min(1, t.u + 0.06); const e = 1 - Math.pow(1 - t.u, 3); camera.position.lerpVectors(t.p0, t.p1, e); controls.target.lerpVectors(t.t0, t.t1, e); if (t.u >= 1) stage.tween = null; dirty = true; }
    controls.update();
    if (stage.onFrame && stage.onFrame()) dirty = true;
    if (dirty) { renderer.render(scene, camera); dirty = false; }
  };
  loop();
  stage.dispose = () => {
    alive = false; cancelAnimationFrame(raf); ro.disconnect(); controls.dispose();
    const seen = new Set();
    scene.traverse(o => {
      if (o.geometry && !seen.has(o.geometry)) { seen.add(o.geometry); o.geometry.dispose(); }
      const mats = Array.isArray(o.material) ? o.material : (o.material ? [o.material] : []);
      mats.forEach(m => { if (seen.has(m)) return; seen.add(m); ['map', 'bumpMap'].forEach(key => { if (m[key] && !seen.has(m[key])) { seen.add(m[key]); m[key].dispose(); } }); m.dispose(); });
    });
    renderer.dispose(); try { renderer.forceContextLoss(); } catch (e) {} canvas.remove();
  };
  return stage;
}
function makeLabel(text, color, h, depth){
  const c = document.createElement('canvas'); c.width = 128; c.height = 64;
  const tex = new THREE.CanvasTexture(c); tex.encoding = THREE.sRGBEncoding;
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthTest: !!depth, transparent: true }));
  sp.scale.set(h * 2, h, 1); sp.renderOrder = 30;
  sp.userData.draw = col => { const x = c.getContext('2d'); x.clearRect(0, 0, 128, 64); x.fillStyle = col; x.font = '600 42px "IBM Plex Mono", ui-monospace, monospace'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(text, 64, 34); tex.needsUpdate = true; };
  sp.userData.draw(color); return sp;
}
function makeArrow(len, rad, color){
  const g = new THREE.Group(); const mat = new THREE.MeshStandardMaterial({ color, roughness: .5 });
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(rad, rad, len - rad * 5, 10), mat); shaft.rotation.z = -Math.PI / 2; shaft.position.x = (len - rad * 5) / 2;
  const head = new THREE.Mesh(new THREE.ConeGeometry(rad * 2.6, rad * 5, 14), mat); head.rotation.z = -Math.PI / 2; head.position.x = len - rad * 2.5;
  g.add(shaft, head); g.userData.mat = mat; return g;
}
function lights(scene){
  scene.add(new THREE.HemisphereLight(0xffffff, 0x4c5a52, 0.95));
  const sun = new THREE.DirectionalLight(0xffffff, 0.9); sun.position.set(7, 12, 9); scene.add(sun);
  const fill = new THREE.DirectionalLight(0xffffff, 0.28); fill.position.set(-8, 4, -7); scene.add(fill);
}
function makeDialTexture(){
  const S = 256, c = document.createElement('canvas'); c.width = c.height = S; const x = c.getContext('2d');
  x.fillStyle = '#ebe6d8'; x.beginPath(); x.arc(128, 128, 126, 0, 7); x.fill();
  x.strokeStyle = '#1b1b1b'; x.lineWidth = 6; x.stroke();
  for (let a = 0; a < 360; a += 10) { const L = a % 90 === 0 ? 22 : a % 30 === 0 ? 15 : 8; x.lineWidth = a % 30 === 0 ? 3 : 1.5; x.beginPath(); x.moveTo(128 + 118 * Math.sin(a * DEG), 128 - 118 * Math.cos(a * DEG)); x.lineTo(128 + (118 - L) * Math.sin(a * DEG), 128 - (118 - L) * Math.cos(a * DEG)); x.stroke(); }
  x.fillStyle = '#1b1b1b'; x.font = '700 30px monospace'; x.textAlign = 'center'; x.textBaseline = 'middle';
  ['N', 'E', 'S', 'W'].forEach((l, i) => x.fillText(l, 128 + 76 * Math.sin(i * 90 * DEG), 128 - 76 * Math.cos(i * 90 * DEG)));
  x.fillStyle = '#c0391b'; x.beginPath(); x.moveTo(128, 42); x.lineTo(138, 128); x.lineTo(118, 128); x.fill();
  x.fillStyle = '#e8e8e8'; x.strokeStyle = '#1b1b1b'; x.lineWidth = 2; x.beginPath(); x.moveTo(128, 214); x.lineTo(138, 128); x.lineTo(118, 128); x.closePath(); x.fill(); x.stroke();
  x.fillStyle = '#1b1b1b'; x.beginPath(); x.arc(128, 128, 7, 0, 7); x.fill();
  const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; return t;
}

