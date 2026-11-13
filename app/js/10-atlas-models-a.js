/* Craton · 10-atlas-models-a.js
 * 3D Atlas part A: shared helpers (materials, slabs, labels) and models: interior, plates, minerals, volcanoes, intrusions, folds, unconformities, valleys, groundwater.
 * Loaded as a classic script; top-level consts are shared across files in load order (see app/index.html).
 */
'use strict';
/* ============================ module 4: 3D atlas ============================ */
function SM(color, o){
  o = o || {};
  const m = new THREE.MeshStandardMaterial({ color: new THREE.Color(color).convertSRGBToLinear(), roughness: o.rough != null ? o.rough : 0.85, metalness: o.metal || 0, flatShading: !!o.flat,
    side: o.side != null ? o.side : THREE.DoubleSide, transparent: o.op != null, opacity: o.op != null ? o.op : 1 });
  if (o.op != null && o.op < 0.95) m.depthWrite = false;
  if (o.emissive) { m.emissive.set(o.emissive).convertSRGBToLinear(); m.emissiveIntensity = o.ei != null ? o.ei : 0.6; }
  if (o.clip) m.clippingPlanes = o.clip;
  if (o.map) m.map = o.map;
  if (o.vc) m.vertexColors = true;
  return m;
}
function hSlab(mat, o, sideMat){
  const nx = o.nx || 48, nz = o.nz || 24;
  const g = new THREE.Group();
  const top = new THREE.Mesh(new THREE.PlaneGeometry(1, 1, nx, nz), mat);
  const sides = [nx, nz, nx, nz].map(n => new THREE.Mesh(new THREE.PlaneGeometry(1, 1, n, 1), sideMat || mat));
  g.add(top, ...sides);
  function update(tf, bf){
    const x0 = o.x0, x1 = o.x1, z0 = o.z0, z1 = o.z1;
    const edges = [[x0, z1, x1, z1, nx], [x1, z1, x1, z0, nz], [x1, z0, x0, z0, nx], [x0, z0, x0, z1, nz]];
    const p = top.geometry.attributes.position;
    for (let iy = 0, k = 0; iy <= nz; iy++) for (let ix = 0; ix <= nx; ix++, k++) { const x = lerp(x0, x1, ix / nx), z = lerp(z0, z1, iy / nz); p.setXYZ(k, x, tf(x, z), z); }
    p.needsUpdate = true; top.geometry.computeVertexNormals(); top.geometry.computeBoundingSphere();
    sides.forEach((m, si) => { const e = edges[si], n = e[4], sp = m.geometry.attributes.position;
      for (let row = 0; row <= 1; row++) for (let i = 0; i <= n; i++) { const x = lerp(e[0], e[2], i / n), z = lerp(e[1], e[3], i / n); sp.setXYZ(row * (n + 1) + i, x, row === 0 ? tf(x, z) : bf(x, z), z); }
      sp.needsUpdate = true; m.geometry.computeVertexNormals(); m.geometry.computeBoundingSphere(); });
  }
  return { group: g, top, sides, meshes: [top, ...sides], update, nx, nz };
}
function rrect(x, a, b, w, h, r){ x.beginPath(); x.moveTo(a + r, b); x.lineTo(a + w - r, b); x.quadraticCurveTo(a + w, b, a + w, b + r); x.lineTo(a + w, b + h - r); x.quadraticCurveTo(a + w, b + h, a + w - r, b + h); x.lineTo(a + r, b + h); x.quadraticCurveTo(a, b + h, a, b + h - r); x.lineTo(a, b + r); x.quadraticCurveTo(a, b, a + r, b); x.closePath(); }
function makeTag(scale){
  const c = document.createElement('canvas'); c.width = 640; c.height = 80;
  const tex = new THREE.CanvasTexture(c); tex.encoding = THREE.sRGBEncoding;
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthTest: false, transparent: true }));
  sp.renderOrder = 40; sp.visible = false; const k = scale || 1; sp.scale.set(4.4 * k, 0.55 * k, 1);
  let th = { panel: '#fbfcfa', ink: '#0e1a15', line: '#c5d0ca' }, text = '';
  const draw = () => { const x = c.getContext('2d'); x.clearRect(0, 0, 640, 80); x.font = '600 32px "IBM Plex Sans", system-ui, sans-serif';
    const w = Math.min(630, x.measureText(text).width + 40), a = (640 - w) / 2;
    rrect(x, a, 8, w, 64, 14); x.fillStyle = th.panel; x.fill(); x.lineWidth = 3; x.strokeStyle = th.line; x.stroke();
    x.fillStyle = th.ink; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(text, 320, 42); tex.needsUpdate = true; };
  sp.userData.set = t => { text = t; draw(); };
  sp.userData.theme = t => { th = t; if (text) draw(); };
  return sp;
}
function makeEarthTex(){
  const c = document.createElement('canvas'); c.width = 512; c.height = 256; const x = c.getContext('2d'); const r = rng(99);
  x.fillStyle = '#2b6e93'; x.fillRect(0, 0, 512, 256);
  for (let i = 0; i < 70; i++) { const cx = r() * 512, cy = 40 + r() * 176, rx = 10 + r() * 46, ry = 6 + r() * 26;
    x.fillStyle = r() < .6 ? '#6f8f4e' : '#b49a62'; x.beginPath(); x.ellipse(cx, cy, rx, ry, r() * 3, 0, 7); x.fill(); }
  x.fillStyle = '#eef3f5'; x.fillRect(0, 0, 512, 16); x.fillRect(0, 240, 512, 16);
  const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; return t;
}
function stripeTex(seed){
  const c = document.createElement('canvas'); c.width = 256; c.height = 4; const x = c.getContext('2d'); const r = rng(seed);
  let u = 0, dark = true; while (u < 256) { const w = 6 + r() * 22; x.fillStyle = dark ? '#1f2a30' : '#e6e1d4'; x.fillRect(u, 0, w, 4); u += w; dark = !dark; }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.encoding = THREE.sRGBEncoding; return t;
}
function shapeFrom(pts){ const s = new THREE.Shape(); pts.forEach((p, i) => i ? s.lineTo(p[0], p[1]) : s.moveTo(p[0], p[1])); s.closePath(); return s; }
function extrude(pts, depth){ const g = new THREE.ExtrudeGeometry(shapeFrom(pts), { depth, bevelEnabled: false, steps: 1 }); g.translate(0, 0, -depth / 2); return g; }

/* ---------- model: Earth's interior ---------- */
const M_INTERIOR = {
  id: 'interior', title: "Earth's interior", group: 'The Earth system',
  blurb: 'Cut the planet open: crust, mantle and core, or the plates and the soft layer they ride on.',
  variants: [{ id: 'comp', label: 'By composition' }, { id: 'mech', label: 'By behaviour' }],
  cam: [-7.5, 4.6, -7.5], target: [0, 0, 0], fit: 3.7,
  note: 'Crust and lithosphere are drawn several times thicker than true scale so you can see them.',
  parts: {
    crust: { name: 'Crust', desc: 'The rocky outer skin: 5–10 km thick under oceans and 30–70 km under continents.' },
    upper: { name: 'Upper mantle', desc: 'Solid peridotite down to about 660 km. Hot enough to creep very slowly over millions of years.' },
    lower: { name: 'Lower mantle', desc: 'Dense, solid silicate rock from about 660 to 2,900 km deep. The biggest layer by volume.' },
    outer: { name: 'Outer core', desc: "Liquid iron and nickel, 2,900–5,150 km deep. Its churning generates Earth's magnetic field." },
    inner: { name: 'Inner core', desc: 'A solid iron-nickel ball about 1,220 km in radius, kept solid by enormous pressure.' },
    litho: { name: 'Lithosphere', desc: 'The rigid outer shell (crust plus uppermost mantle), roughly 100 km thick. It is broken into tectonic plates.' },
    astheno: { name: 'Asthenosphere', desc: 'A weak, slowly flowing zone of the upper mantle, roughly 100–350 km deep. Plates glide over it.' },
    meso: { name: 'Mesosphere', desc: 'Stronger mantle below the asthenosphere, reaching down to the core.' },
  },
  quiz: {
    comp: [
      { type: 'tap', prompt: 'Tap the only layer that is liquid.', parts: ['outer'], hint: 'Think about which layer S-waves cannot cross.', why: 'The outer core is molten iron and nickel. Shear (S) waves cannot travel through liquid, and the shadow zone they leave on the far side of the Earth is how seismologists discovered it.' },
      { type: 'tap', prompt: "Tap the layer that makes up most of Earth's volume.", parts: ['lower', 'upper'], hint: 'Compare the thickness of each band on the cut face.', why: "The mantle holds about 84% of Earth's volume. It is solid rock, yet it creeps slowly enough to drive plate motion." },
      { type: 'tap', prompt: 'Tap the layer you are standing on right now.', parts: ['crust'], hint: 'It is the outermost shell.', why: "The crust is thinner, relative to the whole Earth, than the skin of an apple. It is exaggerated here so you can see it." },
      { type: 'mc', q: 'The inner core is hotter than the outer core, yet it is solid. Why?', opts: ['It is made of rock, not metal', 'Enormous pressure keeps the iron from melting', 'It is cooling faster than the outer core'], a: 1, hint: 'What else increases as you go deeper, besides temperature?', why: 'Pressure raises the melting point of iron. At the centre the pressure is over three million times that at the surface, so iron stays solid even near 5,000 °C.' },
    ],
    mech: [
      { type: 'tap', prompt: 'Tap the soft, slowly flowing layer that tectonic plates glide over.', parts: ['astheno'], hint: 'It sits just below the rigid shell.', why: 'The asthenosphere is close to its melting point, so it is weak and can flow. That lets the rigid plates above it move a few centimetres a year.' },
      { type: 'tap', prompt: 'Tap the rigid shell that is broken into tectonic plates.', parts: ['litho'], hint: 'It includes the crust and the very top of the mantle.', why: 'Plates are pieces of lithosphere, not just crust. Nigeria rides on the African Plate.' },
      { type: 'mc', q: 'Is the asthenosphere a liquid?', opts: ['Yes, it is a layer of molten magma', 'No, it is solid rock that is weak enough to flow very slowly', 'It is a layer of water'], a: 1, hint: 'Earthquake S-waves do travel through it, only more slowly.', why: 'The asthenosphere is mostly solid. Only a tiny fraction may be melted. It behaves like very stiff putty over long time spans.' },
    ],
  },
  local: 'Nigeria sits on the African Plate, which moves a few centimetres a year. Seismic waves from distant earthquakes, recorded in Nigeria, travel through every layer shown here.',
  build(ctx){
    const root = new THREE.Group(); ctx.scene.add(root);
    const shell = (parent, rIn, r, color, id, map) => {
      const s = new THREE.Mesh(new THREE.SphereGeometry(r, 56, 36, 0, Math.PI * 1.5), map ? SM('#ffffff', { map }) : SM(color));
      const cut = SM(new THREE.Color(color).offsetHSL(0, 0, 0.05));
      const r1 = new THREE.Mesh(new THREE.RingGeometry(rIn, r, 56, 1, Math.PI / 2, Math.PI), cut);
      const r2 = new THREE.Mesh(r1.geometry, cut); r2.rotation.y = -Math.PI / 2;
      [s, r1, r2].forEach(m => { ctx.part(m, id); parent.add(m); });
    };
    shell(root, 0, 0.58, '#f2c14e', 'inner'); shell(root, 0.58, 1.64, '#e8873a', 'outer');
    const comp = new THREE.Group(), mech = new THREE.Group(); root.add(comp, mech);
    const earth = makeEarthTex();
    shell(comp, 1.64, 2.62, '#b8452b', 'lower'); shell(comp, 2.62, 2.86, '#8f3a25', 'upper'); shell(comp, 2.86, 3.0, '#8a7560', 'crust', earth);
    shell(mech, 1.64, 2.5, '#a3442a', 'meso'); shell(mech, 2.5, 2.78, '#e0772f', 'astheno'); shell(mech, 2.78, 3.0, '#6d6a5f', 'litho', earth);
    return { setVariant(v){ comp.visible = v === 'comp'; mech.visible = v === 'mech'; } };
  },
};

/* ---------- model: plate boundaries ---------- */
const M_PLATES = {
  id: 'plates', title: 'Plate boundaries', group: 'The Earth system',
  blurb: 'Watch plates pull apart, sink beneath each other and slide past, with live ocean-floor motion.',
  variants: [{ id: 'div', label: 'Divergent' }, { id: 'sub', label: 'Subduction' }, { id: 'trans', label: 'Transform' }],
  cam: [6, 7, 12], target: [0, -1, 0], fit: 7.6, animated: true,
  parts: {
    ocplate: { name: 'Oceanic lithosphere', desc: 'A plate made of dense basalt crust and the mantle beneath it. It gets colder, thicker and denser as it ages.' },
    ridge: { name: 'Mid-ocean ridge', desc: 'A long undersea mountain chain where plates pull apart and new ocean floor forms.' },
    magma: { name: 'Rising magma', desc: 'Hot mantle rises and partly melts as pressure drops, filling the gap between the plates with new basalt.' },
    stripes: { name: 'Magnetic stripes', desc: "Bands of normal and reversed magnetism frozen into the basalt as it cooled, recording flips of Earth's field." },
    astheno: { name: 'Asthenosphere', desc: 'The weak, slowly flowing mantle layer the plates move over.' },
    trench: { name: 'Deep-sea trench', desc: 'The deepest parts of the ocean, where one plate bends down and sinks.' },
    contplate: { name: 'Continental lithosphere', desc: 'Thick, light granite-rich crust that is too buoyant to sink.' },
    arc: { name: 'Volcanic arc', desc: 'A chain of volcanoes above the sinking plate, fed by magma from the mantle wedge.' },
    melt: { name: 'Magma rising to the arc', desc: 'Water squeezed out of the sinking slab lowers the melting point of the mantle above it, so it melts.' },
    quakes: { name: 'Earthquake foci', desc: 'Earthquakes trace the sinking slab down to hundreds of kilometres: the Wadati–Benioff zone.' },
    transform: { name: 'Transform fault', desc: 'The active segment between two ridge offsets, where plates slide past each other in opposite directions.' },
    fracture: { name: 'Fracture zone', desc: 'The inactive scar beyond the ridge offsets. Both sides move the same way here, so it is not an active boundary.' },
  },
  quiz: {
    div: [
      { type: 'tap', prompt: 'Tap the mid-ocean ridge, where new ocean floor forms.', parts: ['ridge'], hint: 'Look for the highest ground in the middle.', why: 'Hot, young lithosphere at the ridge is buoyant, so it stands high. As it moves away it cools, shrinks and sinks lower.' },
      { type: 'mc', q: 'The magnetic stripes are mirror images on both sides of the ridge. What does that tell you?', opts: ['The ridge is where the crust is oldest', 'New crust forms at the ridge and moves away on both sides, recording each magnetic reversal', 'Ocean currents painted the stripes'], a: 1, hint: 'Think about where the newest basalt cools and locks in the magnetic field, then which way the plates move.', why: 'Symmetrical stripes were the key evidence for sea-floor spreading in the 1960s. They let geologists date the ocean floor without drilling.' },
      { type: 'tap', prompt: 'Tap the molten rock that fills the gap as the plates pull apart.', parts: ['magma'], hint: 'It glows.', why: 'As hot mantle rises, the pressure on it drops and it partly melts. This decompression melting makes the basalt of every ocean floor.' },
    ],
    sub: [
      { type: 'tap', prompt: 'Tap the deep-sea trench.', parts: ['trench'], hint: 'It is where the ocean plate starts to bend down.', why: 'Trenches mark where a plate bends and dives into the mantle. The Mariana Trench is about 11 km deep.' },
      { type: 'mc', q: 'Why does the oceanic plate sink instead of the continental one?', opts: ['Oceanic lithosphere is denser', 'It is moving faster', 'Continents are attached to the core'], a: 0, hint: 'Compare basalt with granite.', why: 'Old oceanic lithosphere is colder and denser than the asthenosphere below, so it sinks under its own weight. Continental crust is too buoyant.' },
      { type: 'tap', prompt: 'Tap the volcanic arc.', parts: ['arc'], hint: 'Look on the continent, above the sinking slab.', why: 'The slab releases water as it heats up. Water lowers the melting point of the mantle wedge above, producing magma that rises to feed a line of volcanoes.' },
      { type: 'tap', prompt: 'Tap the earthquakes that trace the sinking plate.', parts: ['quakes'], hint: 'Small yellow dots along the slab.', why: 'Earthquakes happen only in rock that is cold and brittle enough to break. Their deepening line maps the slab hundreds of kilometres into the mantle.' },
    ],
    trans: [
      { type: 'tap', prompt: 'Tap the part of the fault where the plates slide past each other in opposite directions.', parts: ['transform'], hint: 'It is the segment between the two ridge pieces. Watch the arrows.', why: 'Only the segment between the offset ridges is an active transform boundary. Earthquakes cluster here.' },
      { type: 'mc', q: 'Along a transform boundary, crust is…', opts: ['created', 'destroyed', 'neither created nor destroyed'], a: 2, hint: 'The plates only slide sideways past each other.', why: "Transform boundaries just move crust sideways. California's San Andreas Fault is a famous continental example." },
    ],
  },
  localV: {
    div: 'About 130 million years ago Africa and South America rifted apart, opening the South Atlantic. The Benue Trough formed as a failed arm of that rift.',
    sub: 'Nigeria has no subduction zone today. The nearest active volcanoes, on the Cameroon Volcanic Line, are not caused by subduction, which is a good contrast for exams.',
    trans: "The Romanche and Chain fracture zones in the equatorial Atlantic, off West Africa's coast, are giant transform faults.",
  },
  build(ctx){
    const S = ctx.scene;
    const ast = ctx.part(new THREE.Mesh(new THREE.BoxGeometry(16, 3.2, 6), SM('#d9692c', { emissive: '#7a2a08', ei: 0.35 })), 'astheno'); ast.position.y = -4.0; S.add(ast);
    const plateMat = SM('#3e4b53'), magmaMat = SM('#ff5a1f', { emissive: '#ff3a00', ei: 0.7 });
    // divergent
    const div = new THREE.Group(); S.add(div);
    const topD = x => 0.8 * Math.exp(-x * x / 5) - 0.35 * Math.exp(-x * x / 0.15);
    const baseD = x => -0.5 - 0.22 * Math.abs(x);
    const sidePts = sgn => { const pts = []; for (let i = 0; i <= 60; i++) { const x = sgn * lerp(8, 0.18, i / 60); pts.push([x, topD(x)]); } pts.push([sgn * 0.18, baseD(0.18)], [sgn * 8, baseD(8)]); return pts; };
    [-1, 1].forEach(sg => div.add(ctx.part(new THREE.Mesh(extrude(sidePts(sg), 6), plateMat), 'ocplate')));
    const dike = ctx.part(new THREE.Mesh(new THREE.BoxGeometry(0.36, 2.7, 6), magmaMat), 'magma'); dike.position.y = -1.05; div.add(dike);
    const ch = ctx.part(new THREE.Mesh(new THREE.SphereGeometry(1, 24, 16), magmaMat), 'magma'); ch.scale.set(1.6, 0.7, 3); ch.position.y = -2.3; div.add(ch);
    const st = stripeTex(4), stripeMat = SM('#ffffff', { map: st });
    const strips = [-1, 1].map(sg => { const g = new THREE.PlaneGeometry(1, 1, 90, 1); const m = ctx.part(new THREE.Mesh(g, stripeMat), 'stripes'); div.add(m);
      const p = g.attributes.position; for (let row = 0; row <= 1; row++) for (let i = 0; i <= 90; i++) { const x = sg * lerp(0.2, 8, i / 90); p.setXYZ(row * 91 + i, x, topD(x) + 0.015, row ? -3 : 3); }
      p.needsUpdate = true; g.computeVertexNormals(); g.computeBoundingSphere(); return { g, sg }; });
    [-1, 1].forEach(sg => { const a = makeArrow(1.6, 0.06, 0xf4f1ea); a.position.set(sg * 3.6, topD(3.6) + 0.45, 0); if (sg < 0) a.rotation.y = Math.PI; div.add(a); });
    // subduction
    const sub = new THREE.Group(); S.add(sub);
    const yS = x => x <= 0 ? 0 : -0.5 * Math.pow(x, 1.4), dyS = x => x <= 0 ? 0 : -0.7 * Math.pow(x, 0.4);
    const top = [], bot = []; for (let i = 0; i <= 80; i++) { const x = lerp(-8, 5.4, i / 80), y = yS(x), d = dyS(x), L = Math.hypot(1, d); top.push([x, y]); bot.push([x - (-d / L) * 0.9, y - (1 / L) * 0.9]); }
    sub.add(ctx.part(new THREE.Mesh(extrude([...top, ...bot.reverse()], 6), plateMat), 'ocplate'));
    const cT = x => 0.35 + 0.5 * Math.exp(-((x - 3.6) ** 2) / 2);
    const cont = []; for (let i = 0; i <= 40; i++) { const x = lerp(0.25, 8, i / 40); cont.push([x, cT(x)]); }
    cont.push([8, -2.4], [3.06, -2.4]); for (let i = 0; i <= 20; i++) { const x = lerp(3.06, 0.25, i / 20); cont.push([x, yS(x) + 0.02]); }
    sub.add(ctx.part(new THREE.Mesh(extrude(cont, 6), SM('#9a8466', { flat: true })), 'contplate'));
    const tr = ctx.part(new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.06, 6), SM('#141c20')), 'trench'); tr.position.set(0.05, 0.0, 0); sub.add(tr);
    const arcMat = SM('#5b5048', { flat: true });
    [-1.8, 0.2, 2.2].forEach(z => { const c = ctx.part(new THREE.Mesh(new THREE.ConeGeometry(0.55, 0.95, 10), arcMat), 'arc'); c.position.set(3.4, cT(3.4) + 0.42, z); sub.add(c); });
    const melt = ctx.part(new THREE.Mesh(new THREE.BoxGeometry(0.12, cT(3.4) - yS(3.4), 0.03), magmaMat), 'melt'); melt.position.set(3.4, (cT(3.4) + yS(3.4)) / 2, 3.02); sub.add(melt);
    const qMat = SM('#ffd23f', { emissive: '#ffb000', ei: 0.6 });
    for (let i = 0; i < 9; i++) { const x = 0.6 + i * 0.55, q = ctx.part(new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 8), qMat), 'quakes'); q.position.set(x, yS(x) - 0.25, 3.01 - (i % 3) * 0.002); sub.add(q); }
    const smMat = SM('#55636b', { flat: true });
    const seamounts = []; for (let k = 0; k < 6; k++) { const m = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.35, 8), smMat); m.userData.ph = k / 6; m.userData.z = (k % 2 ? 1.4 : -1.4); sub.add(m); seamounts.push(m); }
    { const a = makeArrow(1.6, 0.06, 0xf4f1ea); a.position.set(-5, 0.45, 0); sub.add(a); }
    // transform
    const trn = new THREE.Group(); S.add(trn);
    const tb = ctx.part(new THREE.Mesh(new THREE.BoxGeometry(16, 1.2, 6), plateMat), 'ocplate'); tb.position.y = -0.6; trn.add(tb);
    const tStr = [{ zc: 1.5, xr: -2 }, { zc: -1.5, xr: 2 }].map(o => { const g = new THREE.PlaneGeometry(1, 1, 160, 1); const m = ctx.part(new THREE.Mesh(g, stripeMat), 'stripes'); trn.add(m);
      const p = g.attributes.position; for (let row = 0; row <= 1; row++) for (let i = 0; i <= 160; i++) p.setXYZ(row * 161 + i, lerp(-8, 8, i / 160), 0.01, o.zc + (row ? -1.5 : 1.5));
      p.needsUpdate = true; g.computeVertexNormals(); g.computeBoundingSphere(); return { g, xr: o.xr }; });
    const ridgeMat = SM('#c4502d', { flat: true });
    [[-2, 1.5], [2, -1.5]].forEach(([x, z]) => { const r = ctx.part(new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.3, 3), ridgeMat), 'ridge'); r.position.set(x, 0.15, z); trn.add(r); });
    const tf = ctx.part(new THREE.Mesh(new THREE.BoxGeometry(4, 0.08, 0.1), SM('#b03c12', { emissive: '#b03c12', ei: 0.3 })), 'transform'); tf.position.set(0, 0.04, 0); trn.add(tf);
    [-5, 5].forEach(x => { const f = ctx.part(new THREE.Mesh(new THREE.BoxGeometry(6, 0.05, 0.07), SM('#8a949a')), 'fracture'); f.position.set(x, 0.03, 0); trn.add(f); });
    [[-5, 1.5, -1], [0, 1.5, 1], [0, -1.5, -1], [5, -1.5, 1]].forEach(([x, z, d]) => { const a = makeArrow(1.3, 0.05, 0xf4f1ea); a.position.set(x - d * 0.65, 0.35, z); if (d < 0) a.rotation.y = Math.PI; trn.add(a); });
    let v = 'div';
    return {
      setVariant(id){ v = id; div.visible = id === 'div'; sub.visible = id === 'sub'; trn.visible = id === 'trans'; },
      regions: ['ocplate', 'ridge'],
      resolve(h, id){ return v === 'div' && id === 'ocplate' && Math.abs(h.point.x) < 1.3 && h.point.y > 0 ? 'ridge' : id; },
      tick(t){
        const sp = 0.06 * t;
        if (v === 'div') strips.forEach(({ g, sg }) => { const uv = g.attributes.uv, p = g.attributes.position; for (let i = 0; i < uv.count; i++) uv.setX(i, Math.abs(p.getX(i)) * 0.35 - sp); uv.needsUpdate = true; });
        if (v === 'trans') tStr.forEach(({ g, xr }) => { const uv = g.attributes.uv, p = g.attributes.position; for (let i = 0; i < uv.count; i++) uv.setX(i, Math.abs(p.getX(i) - xr) * 0.35 - sp); uv.needsUpdate = true; });
        if (v === 'sub') seamounts.forEach(m => { const s = (t * 0.05 + m.userData.ph) % 1, x = lerp(-7.5, 3.2, s); m.position.set(x, yS(x) + 0.16, m.userData.z); m.rotation.z = Math.atan(dyS(x)); });
      },
    };
  },
};

/* ---------- model: mineral crystals ---------- */
const M_MINERALS = {
  id: 'minerals', title: 'Mineral crystals', group: 'Earth materials',
  blurb: 'Zoom into the atoms of halite, quartz and mica, then split them to see why they break the way they do.',
  variants: [{ id: 'halite', label: 'Halite' }, { id: 'quartz', label: 'Quartz' }, { id: 'mica', label: 'Mica' }],
  slider: { label: 'Split the crystal', for: ['halite', 'mica'] },
  cam: [4.2, 3.2, 5.4], target: [0, 0, 0], fit: 2.3, tagScale: 0.42,
  parts: {
    na: { name: 'Sodium ion (Na⁺)', desc: 'The smaller ion in halite. Each one is surrounded by six chloride ions.' },
    cl: { name: 'Chloride ion (Cl⁻)', desc: 'The larger ion. The alternating pattern of Na⁺ and Cl⁻ builds a cube.' },
    prism: { name: 'Hexagonal prism face', desc: 'Quartz grows as six-sided prisms because of how its SiO₄ tetrahedra link into a spiral framework.' },
    term: { name: 'Pyramidal termination', desc: 'The pointed end of a quartz crystal, grown into open space such as a vein or cavity.' },
    si: { name: 'Silicon atom', desc: 'Sits at the centre of the silica tetrahedron, bonded to four oxygens.' },
    o: { name: 'Oxygen atom', desc: 'Each oxygen is shared between two tetrahedra in quartz, linking them in all directions.' },
    sheet: { name: 'Silicate sheet', desc: 'Mica is built of strong sheets of linked tetrahedra, held to each other only by weak bonds.' },
  },
  quiz: {
    halite: [
      { type: 'tap', prompt: 'Tap a chloride ion. It is the larger of the two.', parts: ['cl'], hint: 'Compare the sizes of the two colours.', why: 'Chloride ions are much bigger than sodium ions. The small Na⁺ ions fit into the gaps between them.' },
      { type: 'mc', q: 'Drag the slider to split the crystal. Halite always breaks along flat planes at right angles. Why?', opts: ['Its ions form a cubic grid, so the weakest planes meet at 90°', 'Salt is very soft', 'It was cut by a machine'], a: 0, hint: 'Look at how the ions are lined up in rows.', why: 'This is cleavage: breaking along planes of weak bonding set by the crystal structure. Halite has three cleavage planes at right angles, so it breaks into cubes.' },
    ],
    quartz: [
      { type: 'tap', prompt: 'Tap the silicon atom at the centre of the tetrahedron.', parts: ['si'], hint: 'It is the small atom in the middle.', why: 'The SiO₄ tetrahedron is the building block of all silicate minerals, the most common minerals in the crust.' },
      { type: 'mc', q: 'Quartz has no cleavage. It breaks along curved, glassy surfaces. Why?', opts: ['Its bonds are equally strong in every direction, so there is no weak plane', 'It is too soft to cleave', 'It is made of sheets like mica'], a: 0, hint: 'Every oxygen links two tetrahedra, in all three dimensions.', why: 'With no weak direction, quartz breaks with a curved conchoidal fracture, like thick glass.' },
    ],
    mica: [
      { type: 'mc', q: 'Drag the slider to peel the sheets. Why does mica split into thin, flexible sheets?', opts: ['The silicate sheets are held to each other by weak bonds', 'It is full of gas bubbles', 'Mica is a metal'], a: 0, hint: 'Compare the bonding inside a sheet with the bonding between sheets.', why: 'Mica has perfect basal cleavage: strong bonds within each sheet, weak bonds between them. You can peel it with a fingernail.' },
      { type: 'tap', prompt: 'Tap a single silicate sheet.', parts: ['sheet'], hint: 'Any one of the thin hexagonal layers.', why: 'Each sheet is a two-dimensional network of linked tetrahedra.' },
    ],
  },
  localV: {
    halite: 'Brine springs at Keana and Awe in the Benue Trough have been worked for salt for centuries.',
    quartz: 'Quartz is the most common mineral in Nigerian granites and makes up almost all the grains of the Ajali Sandstone.',
    mica: 'Pegmatites in central Nigeria, for example around Keffi, contain large mica "books" alongside tantalite and tourmaline.',
  },
  build(ctx){
    const S = ctx.scene;
    // halite
    const hal = new THREE.Group(); S.add(hal);
    const sp = 0.55, pos = []; for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) for (let k = 0; k < 4; k++) pos.push({ i, j, k, na: (i + j + k) % 2 === 0, p: new THREE.Vector3((i - 1.5) * sp, (j - 1.5) * sp, (k - 1.5) * sp) });
    const naM = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 18, 12), SM('#9b7fd1', { rough: .4 }), 32);
    const clM = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 18, 12), SM('#5fb46a', { rough: .4 }), 32);
    naM.frustumCulled = clM.frustumCulled = false;
    ctx.part(naM, 'na'); ctx.part(clM, 'cl'); hal.add(naM, clM);
    const bondGeo = new THREE.BufferGeometry(); const bonds = new THREE.LineSegments(bondGeo, new THREE.LineBasicMaterial({ color: 0x8a948f })); hal.add(bonds);
    const mtx = new THREE.Matrix4();
    function placeHal(s){
      let a = 0, b = 0; const off = p => p.x > 0 ? s * 0.7 : 0;
      pos.forEach(o => { mtx.makeScale(o.na ? 0.13 : 0.22, o.na ? 0.13 : 0.22, o.na ? 0.13 : 0.22).setPosition(o.p.x + off(o.p), o.p.y, o.p.z); if (o.na) naM.setMatrixAt(a++, mtx); else clM.setMatrixAt(b++, mtx); });
      naM.instanceMatrix.needsUpdate = true; clM.instanceMatrix.needsUpdate = true; naM.computeBoundingSphere && naM.computeBoundingSphere(); clM.computeBoundingSphere && clM.computeBoundingSphere();
      const v = []; pos.forEach(o => [[1, 0, 0], [0, 1, 0], [0, 0, 1]].forEach(d => { const q = pos.find(r => r.i === o.i + d[0] && r.j === o.j + d[1] && r.k === o.k + d[2]); if (!q) return; if (s > 0.02 && (o.p.x > 0) !== (q.p.x > 0)) return; v.push(o.p.x + off(o.p), o.p.y, o.p.z, q.p.x + off(q.p), q.p.y, q.p.z); }));
      bondGeo.setAttribute('position', new THREE.Float32BufferAttribute(v, 3)); bondGeo.computeBoundingSphere();
    }
    // quartz + tetrahedron
    const qz = new THREE.Group(); S.add(qz);
    const glass = SM('#dfe8ec', { op: 0.78, rough: 0.12, flat: true });
    const prism = ctx.part(new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 1.8, 6), glass), 'prism'); prism.position.x = -1.1; qz.add(prism);
    [1, -1].forEach(sg => { const c = ctx.part(new THREE.Mesh(new THREE.ConeGeometry(0.55, 0.7, 6), glass), 'term'); c.position.set(-1.1, sg * 1.25, 0); if (sg < 0) c.rotation.x = Math.PI; qz.add(c); });
    const tet = new THREE.Group(); tet.position.x = 1.3; qz.add(tet);
    const si = ctx.part(new THREE.Mesh(new THREE.SphereGeometry(0.16, 20, 14), SM('#e0a43a', { rough: .4 })), 'si'); tet.add(si);
    const oV = [[1, 1, 1], [1, -1, -1], [-1, 1, -1], [-1, -1, 1]].map(v => new THREE.Vector3(...v).normalize().multiplyScalar(0.62));
    const oMat = SM('#d84a3a', { rough: .4 }); const tv = [];
    oV.forEach(v => { const o = ctx.part(new THREE.Mesh(new THREE.SphereGeometry(0.27, 20, 14), oMat), 'o'); o.position.copy(v); tet.add(o); tv.push(0, 0, 0, v.x, v.y, v.z); });
    for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) tv.push(oV[i].x, oV[i].y, oV[i].z, oV[j].x, oV[j].y, oV[j].z);
    tet.add(new THREE.LineSegments(new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(tv, 3)), new THREE.LineBasicMaterial({ color: 0x46564f })));
    // mica
    const mica = new THREE.Group(); S.add(mica);
    const sheets = []; for (let i = 0; i < 12; i++) { const m = ctx.part(new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.15, 0.05, 6), SM(i % 2 ? '#8b6b3d' : '#a4834e', { rough: 0.35, metal: 0.15, flat: true })), 'sheet'); m.rotation.y = i * 0.02; mica.add(m); sheets.push(m); }
    function placeMica(s){ sheets.forEach((m, i) => { m.position.y = (i - 5.5) * (0.065 + s * 0.17); }); }
    placeHal(0); placeMica(0);
    return {
      setVariant(v){ hal.visible = v === 'halite'; qz.visible = v === 'quartz'; mica.visible = v === 'mica'; },
      setParam(v){ placeHal(v / 100); placeMica(v / 100); },
    };
  },
};

/* ---------- model: volcano types ---------- */
const VOLC = {
  shield: { R: 6, H: 1.45, cr: 0.4, fl: 1.15, prof: (r, s) => s.H * Math.pow(Math.max(0, 1 - (r / s.R) ** 2), 0.7), cols: ['#3c3d3f', '#55524d'], step: 0.16, flank: '#4a4946' },
  strato: { R: 3.8, H: 3.6, cr: 0.32, fl: 3.2, prof: (r, s) => s.H * Math.pow(Math.max(0, 1 - (r - s.cr) / (s.R - s.cr)), 1.7), cols: ['#47474a', '#b8a487'], step: 0.24, flank: '#6e6a66' },
  cinder: { R: 1.7, H: 1.3, cr: 0.55, fl: 0.72, prof: (r, s) => s.H * Math.max(0, 1 - (r - s.cr) / (s.R - s.cr)), cols: ['#5a2e22', '#76402d'], step: 0.13, flank: '#5a2e22' },
};
const M_VOLCANO = {
  id: 'volcano', title: 'Volcano types', group: 'Magma and volcanoes',
  blurb: 'Cut a shield volcano, a stratovolcano and a cinder cone in half and compare what is inside.',
  variants: [{ id: 'shield', label: 'Shield' }, { id: 'strato', label: 'Stratovolcano' }, { id: 'cinder', label: 'Cinder cone' }],
  cam: [5.5, 4.2, 11], target: [0, 0.4, -1], fit: 6.6,
  parts: {
    chamber: { name: 'Magma chamber', desc: 'A body of molten rock a few kilometres down, where magma collects before an eruption.' },
    conduit: { name: 'Conduit', desc: 'The pipe that magma rises through to reach the vent.' },
    crater: { name: 'Crater', desc: 'The bowl-shaped hollow at the summit vent.' },
    flank: { name: 'Flank', desc: 'The outer slope of the volcano. Its steepness tells you how runny the lava was.' },
    layers: { name: 'Eruption layers', desc: 'Each band is one lava flow or ash fall. Their pattern records the volcano\'s eruption history.' },
    crust: { name: 'Crust beneath the volcano', desc: 'Older rock that magma has pushed through.' },
  },
  quiz: {
    shield: [
      { type: 'tap', prompt: 'Tap the magma chamber, where magma collects before an eruption.', parts: ['chamber'], hint: 'Look below the volcano, inside the crust.', why: 'Magma rises because it is less dense than the rock around it, and pools where it stops being buoyant.' },
      { type: 'mc', q: 'Shield volcanoes are very wide with gentle slopes. Why?', opts: ['Their basalt lava is runny and flows a long way before it cools', 'They are built from loose ash', 'They erupt only once'], a: 0, hint: 'Think about how thick or runny the lava is.', why: 'Low-silica basalt has low viscosity, so it spreads in thin flows over huge distances. Hawaii\'s Mauna Loa is the classic example.' },
    ],
    strato: [
      { type: 'tap', prompt: 'Tap the conduit that magma rises through.', parts: ['conduit'], hint: 'A narrow pipe connecting the chamber to the summit.', why: 'In stratovolcanoes sticky magma can plug the conduit, letting pressure build until it erupts explosively.' },
      { type: 'mc', q: 'This volcano is steep and built of alternating lava and ash layers. What does that tell you about its magma?', opts: ['It is runny basalt that erupts gently', 'It is sticky, gas-rich magma that switches between explosive and lava eruptions', 'It has no magma'], a: 1, hint: 'Ash comes from explosions. What makes magma explode?', why: 'Andesitic magma is viscous and traps gas, so stratovolcanoes alternate between ash-rich explosions and thick lava flows that pile up steeply.' },
    ],
    cinder: [
      { type: 'mc', q: 'Cinder cones are small and steep, and can grow in just a few years. What are they built from?', opts: ['Thick lava flows', 'Loose fragments of frothy lava (scoria) thrown from a vent', 'Ice and mud'], a: 1, hint: 'Think about what gas-rich blobs of lava become when blasted into the air and piled around a vent.', why: 'Gas-rich blobs of lava are blasted out, cool in the air and land around the vent, piling up at the steepest angle loose gravel can hold, about 30–35°.' },
      { type: 'tap', prompt: 'Tap the crater.', parts: ['crater'], hint: 'The hollow at the top.', why: 'Cinder cones often have large craters for their size because the material falls back around the vent in a ring.' },
    ],
  },
  localV: {
    shield: 'The basalt lava fields of the Jos and Biu plateaus were built by the same kind of runny lava that builds shield volcanoes.',
    strato: 'Mount Cameroon, just beyond Nigeria\'s eastern border, is a large active volcano that has erupted several times since 1999.',
    cinder: 'The Biu Plateau and the Jos Plateau have many young cinder cones, some with their craters still clearly visible.',
  },
  build(ctx){
    const S = ctx.scene;
    const ground = ctx.part(new THREE.Mesh(new THREE.BoxGeometry(16, 3, 7), SM('#8c7a63')), 'crust'); ground.position.set(0, -1.5, -3.5); S.add(ground);
    const magmaMat = SM('#ff5a1f', { emissive: '#ff3a00', ei: 0.7 });
    const groups = {};
    Object.entries(VOLC).forEach(([id, s]) => {
      const g = new THREE.Group(); S.add(g); groups[id] = g;
      const surf = r => r < s.cr ? lerp(s.fl, s.prof(s.cr, s), Math.pow(r / s.cr, 2)) : s.prof(r, s);
      const flankPts = [], craterPts = [];
      for (let i = 0; i <= 10; i++) { const r = s.cr * i / 10; craterPts.push(new THREE.Vector2(Math.max(r, 0.001), surf(r))); }
      for (let i = 0; i <= 40; i++) { const r = lerp(s.cr, s.R, i / 40); flankPts.push(new THREE.Vector2(r, surf(r))); }
      g.add(ctx.part(new THREE.Mesh(new THREE.LatheGeometry(flankPts, 48, Math.PI / 2, Math.PI), SM(s.flank, { flat: true })), 'flank'));
      g.add(ctx.part(new THREE.Mesh(new THREE.LatheGeometry(craterPts, 32, Math.PI / 2, Math.PI), SM('#2b2420')), 'crater'));
      // cut face with eruption layers
      const outline = []; for (let i = 0; i <= 80; i++) { const x = lerp(-s.R, s.R, i / 80); outline.push([x, surf(Math.abs(x))]); }
      const cv = document.createElement('canvas'); cv.width = cv.height = 512; const cx = cv.getContext('2d');
      const px = x => (x + s.R) / (2 * s.R) * 512, py = y => 512 - y / s.H * 512;
      for (let k = 0; ; k++) { const d = k * s.step; if (d > s.H + 0.01) break; cx.fillStyle = s.cols[k % 2]; cx.beginPath(); cx.moveTo(px(-s.R), py(0));
        for (let i = 0; i <= 80; i++) { const x = lerp(-s.R, s.R, i / 80); cx.lineTo(px(x), py(Math.max(0, surf(Math.abs(x)) - d))); } cx.lineTo(px(s.R), py(0)); cx.closePath(); cx.fill(); }
      if (id === 'cinder') { const r = rng(5); for (let i = 0; i < 260; i++) { cx.fillStyle = r() < .5 ? '#2a1610' : '#9a5a3a'; cx.beginPath(); cx.arc(r() * 512, r() * 512, 2 + r() * 5, 0, 7); cx.fill(); } }
      const tex = new THREE.CanvasTexture(cv); tex.encoding = THREE.sRGBEncoding; tex.repeat.set(1 / (2 * s.R), 1 / s.H); tex.offset.set(0.5, 0);
      const face = ctx.part(new THREE.Mesh(new THREE.ShapeGeometry(shapeFrom([[-s.R, 0], ...outline, [s.R, 0]]), 1), SM('#ffffff', { map: tex })), 'layers'); face.position.z = 0.006; g.add(face);
      const rx = Math.min(1.6, s.R * 0.4), chShape = new THREE.Shape(); chShape.absellipse(0, -1.9, rx, 0.55, 0, Math.PI * 2, false, 0);
      const chm = ctx.part(new THREE.Mesh(new THREE.ShapeGeometry(chShape, 24), magmaMat), 'chamber'); chm.position.z = 0.012; g.add(chm);
      const cd = ctx.part(new THREE.Mesh(new THREE.ShapeGeometry(shapeFrom([[-0.09, -1.4], [0.09, -1.4], [0.09, s.fl], [-0.09, s.fl]])), magmaMat), 'conduit'); cd.position.z = 0.014; g.add(cd);
    });
    return { setVariant(v){ Object.entries(groups).forEach(([k, g]) => { g.visible = k === v; }); } };
  },
};

/* ---------- model: igneous intrusions ---------- */
const M_INTRUSION = {
  id: 'intrusion', title: 'Igneous intrusions', group: 'Magma and volcanoes',
  blurb: 'See batholiths, dikes, sills, a laccolith and a volcanic neck inside the crust. Fade the rock to look in.',
  variants: [], slider: { label: 'Fade the country rock', def: 45 },
  cam: [9, 6, 11], target: [0, -0.6, 0], fit: 7.6,
  parts: {
    country: { name: 'Country rock', desc: 'The older layered rock that the magma intruded.' },
    batholith: { name: 'Batholith', desc: 'A huge body of granite, often tens of kilometres across, that cooled slowly deep in the crust.' },
    dike: { name: 'Dike', desc: 'A sheet of igneous rock that cuts across the layers (discordant).' },
    sill: { name: 'Sill', desc: 'A sheet of igneous rock squeezed in parallel to the layers (concordant).' },
    laccolith: { name: 'Laccolith', desc: 'A mushroom-shaped intrusion that pushed the layers above it into a dome.' },
    neck: { name: 'Volcanic neck', desc: 'The solidified pipe of an old volcano, left standing when the softer cone erodes away.' },
    lava: { name: 'Lava flow', desc: 'Magma that reached the surface. It cooled fast, so its crystals are tiny.' },
  },
  quiz: { all: [
    { type: 'tap', prompt: 'Tap the sheet of igneous rock that cuts across the layers.', parts: ['dike'], hint: 'Fade the country rock and look for something steep.', why: 'A dike is discordant: it cuts across bedding. Dikes often feed sills and volcanoes above them.' },
    { type: 'tap', prompt: 'Tap the sheet that runs parallel to the layers.', parts: ['sill'], hint: 'It is flat and lies between two beds.', why: 'A sill is concordant: it follows the bedding. Look for it branching off the dike.' },
    { type: 'tap', prompt: 'Tap the largest intrusion, the one that would be tens of kilometres across in reality.', parts: ['batholith'], hint: 'It is at the bottom of the block.', why: 'Batholiths form from many pulses of magma. Erosion over millions of years can expose them as granite hills.' },
    { type: 'tap', prompt: 'Tap the intrusion that domed up the layers above it.', parts: ['laccolith'], hint: 'Look for a mushroom shape.', why: 'Viscous magma can lift the overlying rock instead of spreading sideways, forming a laccolith.' },
    { type: 'mc', q: 'The dike cuts through the sedimentary layers. Which is older?', opts: ['The dike', 'The layers', 'They formed at the same time'], a: 1, hint: 'Can you cut through something that does not exist yet?', why: 'The principle of cross-cutting relationships: anything that cuts through a rock is younger than the rock it cuts.' },
  ] },
  local: 'The Older Granites of southwest Nigeria are exposed batholiths. On the Jos Plateau, Jurassic Younger Granite ring complexes include ring dikes that once fed volcanoes.',
  build(ctx){
    const S = ctx.scene, cols = ['#c9a46f', '#8d8f86', '#d7b57d', '#6e7275', '#cdd0c2'];
    const country = cols.map((c, i) => { const m = SM(c, { op: 0.55 }); const b = ctx.part(new THREE.Mesh(new THREE.BoxGeometry(12, 1.1, 6), m), 'country'); b.position.y = 2.0 - 0.55 - i * 1.1; b.renderOrder = 5; S.add(b); return m; });
    const clipB = [new THREE.Plane(new THREE.Vector3(0, 1, 0), 3.5)];
    const bat = ctx.part(new THREE.Mesh(new THREE.SphereGeometry(1, 40, 24), SM('#d9a58e', { clip: clipB })), 'batholith'); bat.scale.set(3.6, 2.4, 2.6); bat.position.set(-2, -3.7, 0); S.add(bat);
    const dike = ctx.part(new THREE.Mesh(new THREE.BoxGeometry(0.28, 5.4, 4.4), SM('#2f3134')), 'dike'); dike.position.set(1.4, -0.7, 0); dike.rotation.z = 0.12; S.add(dike);
    const sill = ctx.part(new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.24, 4.4), SM('#3a3c3f')), 'sill'); sill.position.set(3.4, -1.3, 0); S.add(sill);
    const lacM = SM('#9c8a80');
    const lac = ctx.part(new THREE.Mesh(new THREE.SphereGeometry(1, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2), lacM), 'laccolith'); lac.scale.set(1.8, 0.75, 1.6); lac.position.set(-4.2, -0.2, 0); S.add(lac);
    const feed = ctx.part(new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 1.6, 10), lacM), 'laccolith'); feed.position.set(-4.2, -1.0, 0); S.add(feed);
    const neckM = SM('#2b2b2e', { flat: true });
    const neck = ctx.part(new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.5, 3.6, 14), neckM), 'neck'); neck.position.set(-1.4, 0.3, 0); S.add(neck);
    const cap = ctx.part(new THREE.Mesh(new THREE.ConeGeometry(0.62, 0.7, 14), neckM), 'neck'); cap.position.set(-1.4, 2.4, 0); S.add(cap);
    const lava = ctx.part(new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.12, 2.6), SM('#3a3a3a', { flat: true })), 'lava'); lava.position.set(-3.2, 2.06, 0.3); S.add(lava);
    return { setParam(v){ const op = clamp(1 - v / 100, 0.08, 1); country.forEach(m => { m.opacity = op; m.depthWrite = op > 0.95; }); } };
  },
};

/* ---------- model: folds and domes ---------- */
const FOLDF = {
  anticline: (x, z) => Math.exp(-x * x / 7), syncline: (x, z) => -Math.exp(-x * x / 7),
  dome: (x, z) => Math.exp(-(x * x / 7 + z * z / 5)), basin: (x, z) => -Math.exp(-(x * x / 7 + z * z / 5)),
  monocline: (x, z) => 0.5 * Math.tanh(x * 1.2), plunging: (x, z) => Math.exp(-x * x / 7) * (0.5 - 0.5 * Math.tanh(z * 0.6)),
};
const FOLD_BEDS = [['Sandstone', '#d7b57d'], ['Shale', '#5d6266'], ['Limestone', '#cdd0c2'], ['Siltstone', '#b8945e'], ['Shale', '#43484c'], ['Sandstone', '#e0c79a']];
const M_FOLDS = {
  id: 'folds', title: 'Folds and domes', group: 'Structures and time',
  blurb: 'Fold a stack of beds six different ways, then erode it flat to see the map pattern geologists use.',
  variants: [{ id: 'anticline', label: 'Anticline' }, { id: 'syncline', label: 'Syncline' }, { id: 'dome', label: 'Dome' }, { id: 'basin', label: 'Basin' }, { id: 'monocline', label: 'Monocline' }, { id: 'plunging', label: 'Plunging' }],
  slider: { label: 'Erode the land surface', def: 0 },
  cam: [9, 9, 11], target: [0, -0.6, 0], fit: 7.4,
  parts: Object.fromEntries(FOLD_BEDS.map((b, i) => ['L' + i, { name: 'Bed ' + (i + 1) + ': ' + b[0] + (i === 0 ? ' (youngest)' : i === 5 ? ' (oldest)' : ''), desc: 'Law of superposition: in an undisturbed stack, each bed is older than the one above it.' }])),
  quiz: {
    anticline: [{ type: 'mc', q: 'Erode the anticline about halfway. Where are the oldest beds exposed?', opts: ['In the centre (core) of the fold', 'On the outer edges', 'They are not exposed anywhere'], a: 0, hint: 'Watch the colours in the middle as you erode.', why: 'An eroded anticline exposes its oldest rocks in the core, with younger beds repeated symmetrically on both limbs.' }],
    syncline: [{ type: 'mc', q: 'Erode the syncline about halfway. Where are the youngest beds?', opts: ['In the centre', 'On the outer edges', 'Everywhere equally'], a: 0, hint: 'Watch which colour survives in the middle.', why: 'A syncline is a trough, so its youngest beds stay preserved in the core while erosion strips them from the limbs.' }],
    dome: [{ type: 'mc', q: 'Erode the dome. What pattern does it make on the map?', opts: ['Parallel stripes', 'A bullseye with the oldest rocks in the middle', 'A bullseye with the youngest rocks in the middle'], a: 1, hint: 'Look straight down after eroding.', why: 'A dome is an anticline that plunges in every direction, so erosion exposes a circular target pattern with old rocks at the centre.' }],
    basin: [{ type: 'mc', q: 'Erode the basin. Which rocks are in the middle of the bullseye?', opts: ['The oldest', 'The youngest', 'Igneous rocks'], a: 1, hint: 'A basin is the opposite of a dome.', why: 'Beds dip inward toward the centre of a basin, so the youngest beds sit in the middle.' }],
    monocline: [{ type: 'mc', q: 'A monocline is a step-like fold. Where would you measure steep dips?', opts: ['Everywhere across the fold', 'Only in the narrow bend between two flat areas', 'Nowhere, it has no dip'], a: 1, hint: 'Picture a carpet draped over a single step: where is it tilted?', why: 'Beds are flat on both sides of a monocline and dip steeply only across the step. Monoclines often drape over a fault in the basement below.' }],
    plunging: [{ type: 'mc', q: 'Erode the plunging anticline and look from above. The beds make a V shape. Which way does the V point?', opts: ['Toward the direction the fold plunges', 'Away from the plunge direction', 'It does not point anywhere'], a: 0, hint: 'The hinge of this fold dips toward the front of the block.', why: 'For a plunging anticline, the V (or nose) of the outcrop pattern points in the direction of plunge. For a plunging syncline it points the other way.' }],
  },
  localV: {
    anticline: 'The Abakaliki Anticlinorium in the Benue Trough is a large anticline formed during Santonian compression.',
    syncline: 'The Afikpo Syncline, next to the Abakaliki Anticlinorium, preserves younger Cretaceous rocks in its core.',
    dome: 'Domes make excellent oil traps when a porous bed is sealed by shale above it.',
    basin: 'The Anambra and Chad basins are sedimentary basins where beds generally get younger toward the centre.',
    monocline: 'Monoclines form where sedimentary layers drape over a fault in the harder basement rock below.',
    plunging: 'Many Benue Trough folds plunge along their NE–SW axes, so they close in V shapes on geological maps.',
  },
  build(ctx){
    const S = ctx.scene, A = 1.6, clip = new THREE.Plane(new THREE.Vector3(0, -1, 0), 99);
    const o = { x0: -6, x1: 6, z0: -4, z1: 4, nx: 60, nz: 40 };
    const slabs = FOLD_BEDS.map((b, i) => { const s = hSlab(SM(b[1], { clip: [clip] }), o); s.meshes.forEach(m => ctx.part(m, 'L' + i)); S.add(s.group); return s; });
    let F = FOLDF.anticline, h = 99;
    const topMax = 1.2 + A + 0.05;
    function rebuild(){ slabs.forEach((s, i) => { const tf = (x, z) => 1.2 - 0.6 * i + A * F(x, z); const bf = i < 5 ? (x, z) => 1.2 - 0.6 * (i + 1) + A * F(x, z) : () => -3.6; s.update(tf, bf); }); }
    ctx.clipOk = p => p.y <= h + 1e-3;
    rebuild();
    return {
      setVariant(v){ F = FOLDF[v]; rebuild(); },
      setParam(v){ h = v <= 0 ? 99 : lerp(topMax, -0.8, v / 100); clip.constant = h; },
    };
  },
};

/* ---------- model: unconformities ---------- */
const M_UNCONF = {
  id: 'unconf', title: 'Unconformities', group: 'Structures and time',
  blurb: 'Find the surfaces where millions of years of rock record are missing. Lift off the younger beds to see them.',
  variants: [{ id: 'angular', label: 'Angular' }, { id: 'discon', label: 'Disconformity' }, { id: 'noncon', label: 'Nonconformity' }],
  slider: { label: 'Lift off the younger beds', def: 0 },
  cam: [9, 6, 11], target: [0, -0.4, 0], fit: 7.2,
  parts: {
    lower: { name: 'Older beds', desc: 'Rocks deposited before the gap in time.' },
    upper: { name: 'Younger beds', desc: 'Rocks deposited after erosion stopped and the land subsided again.' },
    surface: { name: 'Unconformity surface', desc: 'An old erosion surface. Time is missing here: rock was eroded or never deposited.' },
    basement: { name: 'Crystalline basement', desc: 'Igneous or metamorphic rock that formed deep in the crust, then was uplifted and eroded.' },
  },
  quiz: {
    angular: [
      { type: 'tap', prompt: 'Tap the surface that represents missing time.', parts: ['surface'], hint: 'Look for the boundary between tilted and flat beds.', why: 'An angular unconformity separates tilted older beds from flat younger ones. James Hutton\'s Siccar Point in Scotland convinced him that Earth is immensely old.' },
      { type: 'mc', q: 'What happened right after the lower beds were deposited?', opts: ['The upper beds were laid down', 'They were tilted (deformed)', 'They were intruded by granite'], a: 1, hint: 'They were flat once. Now they are not.', why: 'The sequence is: deposition, tilting, uplift and erosion, subsidence, then deposition of the younger beds.' },
    ],
    discon: [
      { type: 'tap', prompt: 'Tap the unconformity surface.', parts: ['surface'], hint: 'It is the wavy pebbly layer.', why: 'A disconformity is an erosion surface between parallel beds. It is easy to miss in the field.' },
      { type: 'mc', q: 'The beds above and below are parallel. How could you tell there is a time gap here?', opts: ['You cannot tell', 'An uneven erosion surface with pebbles, or a jump in fossil ages', 'The beds are different colours'], a: 1, hint: 'What does erosion leave behind?', why: 'Channels, soil horizons, pebble lags and missing fossil zones all reveal a disconformity.' },
    ],
    noncon: [
      { type: 'tap', prompt: 'Tap the crystalline basement rock.', parts: ['basement'], hint: 'It is not layered.', why: 'A nonconformity puts sedimentary rock directly on igneous or metamorphic rock that once lay many kilometres deep.' },
      { type: 'mc', q: 'What must have happened before the sandstone could be deposited on this granite?', opts: ['The granite was uplifted and the rock above it eroded away', 'The granite was deposited by a river', 'Nothing, they formed together'], a: 0, hint: 'Granite crystallises deep underground.', why: 'Granite forms kilometres down, so all the overlying rock had to be removed by erosion before the sea could lay sand on top of it.' },
    ],
  },
  localV: {
    angular: 'Look for angular unconformities wherever folded Benue Trough rocks are overlain by younger, flat-lying sediments.',
    discon: 'Disconformities are common within the Cretaceous and Tertiary sediments of the Niger Delta and the Anambra Basin.',
    noncon: 'Across Nigeria, Cretaceous sandstones sit directly on the eroded Precambrian Basement Complex, a gap of about 500 million years.',
  },
  build(ctx){
    const S = ctx.scene;
    const bedCols = ['#b8945e', '#6e7275', '#d7b57d', '#8d8f86'];
    const upperCols = ['#cdd0c2', '#4a4f53', '#d7b57d'];
    const mk = (geo, color, part, o) => ctx.part(new THREE.Mesh(geo, SM(color, o)), part);
    const groups = {};
    const makeUpper = (g, y0) => { const up = new THREE.Group(); g.add(up); upperCols.forEach((c, i) => { const b = mk(new THREE.BoxGeometry(12, 0.6, 6), c, 'upper'); b.position.y = y0 + 0.3 + i * 0.6; up.add(b); }); return up; };
    // angular
    { const g = new THREE.Group(); S.add(g); groups.angular = g;
      const k = Math.tan(0.45), d = 0.5 / Math.cos(0.45);
      const clipRect = poly => { [[0, -6, 1], [0, 6, -1], [1, -3, 1], [1, 0, -1]].forEach(([ax, v, sg]) => { const out = []; for (let i = 0; i < poly.length; i++) { const a = poly[i], b = poly[(i + 1) % poly.length], ia = (a[ax] - v) * sg >= 0, ib = (b[ax] - v) * sg >= 0; if (ia) out.push(a); if (ia !== ib) { const t = (v - a[ax]) / (b[ax] - a[ax]); out.push([a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1])]); } } poly = out; }); return poly; };
      for (let i = 0, c = -6.7; c < 3; i++, c += d) { const poly = clipRect([[-20, -20 * k + c], [20, 20 * k + c], [20, 20 * k + c + d], [-20, -20 * k + c + d]]);
        if (poly.length >= 3) g.add(mk(extrude(poly, 6), bedCols[i % 4], 'lower', { flat: true })); }
      const sf = mk(new THREE.BoxGeometry(12, 0.08, 6), '#3b2f26', 'surface'); sf.position.y = 0.04; g.add(sf);
      g.userData.up = makeUpper(g, 0.08); }
    // disconformity
    { const g = new THREE.Group(); S.add(g); groups.discon = g; const cols = bedCols.concat(bedCols);
      for (let i = 0; i < 7; i++) { const b = mk(new THREE.BoxGeometry(12, 0.4, 6), cols[i], 'lower'); b.position.y = -3 + 0.2 + i * 0.4; g.add(b); }
      const wav = (x, z) => 0.12 + 0.16 * Math.sin(1.4 * x + 0.5 * z);
      const o = { x0: -6, x1: 6, z0: -3, z1: 3, nx: 60, nz: 20 };
      const cg = hSlab(SM('#5a4a3a', { flat: true }), o); cg.update(wav, () => -0.2); cg.meshes.forEach(m => ctx.part(m, 'surface')); g.add(cg.group);
      const up = new THREE.Group(); g.add(up); const b1 = hSlab(SM(upperCols[0]), o); b1.update(() => 0.8, wav); b1.meshes.forEach(m => ctx.part(m, 'upper')); up.add(b1.group);
      [1, 2].forEach(i => { const b = mk(new THREE.BoxGeometry(12, 0.6, 6), upperCols[i], 'upper'); b.position.y = 0.8 + 0.3 + (i - 1) * 0.6; up.add(b); });
      g.userData.up = up; }
    // nonconformity
    { const g = new THREE.Group(); S.add(g); groups.noncon = g; const gt = makeTex('granite', 256); gt.map.repeat.set(3, 1);
      const base = mk(new THREE.BoxGeometry(12, 3, 6), '#ffffff', 'basement', { map: gt.map }); base.position.y = -1.5; g.add(base);
      const dk = mk(new THREE.BoxGeometry(0.3, 3.0, 6.02), '#2f3134', 'basement'); dk.position.set(2, -1.5, 0); dk.rotation.z = -0.3; dk.scale.y = 0.96; g.add(dk);
      const sf = mk(new THREE.BoxGeometry(12, 0.12, 6), '#8a4a2a', 'surface'); sf.position.y = 0.06; g.add(sf);
      g.userData.up = makeUpper(g, 0.12); }
    let lift = 0;
    const apply = () => Object.values(groups).forEach(g => { g.userData.up.position.y = lift * 2.8; });
    return { setVariant(v){ Object.entries(groups).forEach(([k, g]) => { g.visible = k === v; }); apply(); }, setParam(v){ lift = v / 100; apply(); } };
  },
};

/* ---------- model: river and glacial valleys ---------- */
const M_VALLEY = {
  id: 'valley', title: 'River and glacial valleys', group: 'Surface processes',
  blurb: 'Morph a V-shaped river valley into a U-shaped glacial trough and see what the ice does.',
  variants: [{ id: 'river', label: 'River valley', param: 0 }, { id: 'glacier', label: 'Glacial valley', param: 100 }],
  slider: { label: 'Ice age: from river to glacier', def: 0 },
  cam: [10, 7.5, 10], target: [0, 0.6, 0], fit: 7.8,
  parts: {
    floor: { name: 'Valley floor', desc: 'The lowest part of the valley, where water or ice does most of its cutting.' },
    walls: { name: 'Valley walls', desc: 'The sides of the valley. Their shape tells you what carved it.' },
    river: { name: 'River', desc: 'A river cuts down into its bed, and slopes above it slump in, making a V shape. On gentle ground it meanders.' },
    glacier: { name: 'Valley glacier', desc: 'A river of ice that grinds the whole valley floor and walls, widening the valley into a U shape.' },
  },
  quiz: {
    river: [
      { type: 'mc', q: 'What carved this V-shaped valley?', opts: ['A river cutting down into its bed while the slopes above wash in', 'A glacier', 'An earthquake'], a: 0, hint: 'Look at what flows along the bottom.', why: 'Rivers erode mostly downward in a narrow channel. Rain, soil creep and landslides then wear the sides back into a V.' },
      { type: 'tap', prompt: 'Tap the valley floor.', parts: ['floor', 'river'], hint: 'The lowest ground in the middle.', why: 'In a V-shaped valley the floor is little more than the river channel itself.' },
    ],
    glacier: [
      { type: 'mc', q: 'Why are glacial valleys U-shaped?', opts: ['Ice fills the whole valley and erodes the floor and the walls at the same time', 'Glaciers flow faster than rivers', 'Ice dissolves rock'], a: 0, hint: 'Compare how much of the valley the ice touches with how much the river touched.', why: 'A glacier is hundreds of metres thick and drags rock fragments along its base and sides, scouring a broad trough with steep walls and a flat floor.' },
      { type: 'tap', prompt: 'Tap the glacier.', parts: ['glacier'], hint: 'The pale ice filling the valley.', why: 'Valley glaciers move only centimetres to metres per day, but over thousands of years they reshape whole mountain ranges.' },
    ],
  },
  localV: {
    river: 'Where the Niger, the Benue and rivers on the Jos Plateau cross hard basement rock, they cut narrow V-shaped valleys and gorges.',
    glacier: 'Nigeria has no glaciers today, but about 300 million years ago ice sheets covered much of southern Gondwana, including parts of Africa.',
  },
  build(ctx){
    const S = ctx.scene, o = { x0: -8, x1: 8, z0: -6, z1: 6, nx: 80, nz: 60 };
    let m = 0;
    const axis = z => 0.6 * Math.sin(z * 0.6) * (1 - m);
    const terr = (x, z) => { const xx = x - axis(z), ax = Math.abs(xx); const V = 3.4 * Math.min(1, ax / 6.5), U = 3.4 * Math.min(1, Math.pow(ax / 5.2, 2.6));
      const n = (0.18 * Math.sin(0.9 * x + 0.3 * z) * Math.cos(0.7 * z) + 0.12 * Math.sin(2.1 * x - 1.3 * z)) * (0.3 + 0.7 * Math.min(1, ax / 4)); return lerp(V, U, m) + n - 0.07 * z; };
    const topMat = SM('#ffffff', { vc: true, flat: true }), sideMat = SM('#8a7a66');
    const ter = hSlab(topMat, o, sideMat); ter.top.geometry.setAttribute('color', new THREE.Float32BufferAttribute(new Float32Array(ter.top.geometry.attributes.position.count * 3), 3));
    ter.meshes.forEach(mm => ctx.part(mm, 'walls')); S.add(ter.group);
    const green = new THREE.Color('#5f8a4a'), rock = new THREE.Color('#8d7b64'), polished = new THREE.Color('#9aa0a0'), tmpC = new THREE.Color();
    const river = ctx.part(new THREE.Mesh(new THREE.PlaneGeometry(1, 1, 1, 80), SM('#2f7fb5', { op: 0.9, rough: 0.2 })), 'river'); S.add(river);
    const ice = ctx.part(new THREE.Mesh(new THREE.PlaneGeometry(1, 1, 60, 60), SM('#e6f1f6', { op: 0.85, rough: 0.3 })), 'glacier'); S.add(ice);
    function rebuild(){
      ter.update(terr, () => -1.5);
      const p = ter.top.geometry.attributes.position, c = ter.top.geometry.attributes.color;
      for (let i = 0; i < p.count; i++) { const y = p.getY(i), x = p.getX(i), z = p.getZ(i); const t = clamp((y + 0.4) / 3.6, 0, 1);
        tmpC.copy(green).lerp(rock, t); if (m > 0) tmpC.lerp(polished, m * clamp(1 - Math.abs(Math.abs(x - axis(z)) - 3.5) / 2.5, 0, 1) * 0.6); tmpC.convertSRGBToLinear(); c.setXYZ(i, tmpC.r, tmpC.g, tmpC.b); }
      c.needsUpdate = true;
      const rp = river.geometry.attributes.position;
      for (let i = 0; i <= 80; i++) { const z = lerp(-6, 6, i / 80), xc = axis(z); [-0.2, 0.2].forEach((dx, col) => rp.setXYZ(i * 2 + col, xc + dx, terr(xc + dx, z) + 0.05, z)); }
      rp.needsUpdate = true; river.geometry.computeVertexNormals(); river.geometry.computeBoundingSphere();
      river.material.opacity = 0.9 * (1 - m); river.visible = m < 0.7;
      const ip = ice.geometry.attributes.position;
      for (let iy = 0, k = 0; iy <= 60; iy++) for (let ix = 0; ix <= 60; ix++, k++) { const x = lerp(-4.6, 4.6, ix / 60), z = lerp(-6, 6, iy / 60), L = 1.9 - 0.07 * z, t = terr(x, z); ip.setXYZ(k, x, t < L ? L : t - 0.08, z); }
      ip.needsUpdate = true; ice.geometry.computeVertexNormals(); ice.geometry.computeBoundingSphere();
      ice.material.opacity = 0.85 * clamp((m - 0.35) / 0.5, 0, 1); ice.visible = m > 0.36;
    }
    rebuild();
    return {
      setParam(v){ m = v / 100; rebuild(); },
      regions: ['walls', 'floor'],
      resolve(h, id){ if (id !== 'walls') return id; const n = h.face && h.face.normal; return n && n.y > 0.82 && Math.abs(h.point.x - axis(h.point.z)) < (m > 0.5 ? 3.6 : 1.2) ? 'floor' : 'walls'; },
    };
  },
};

/* ---------- model: groundwater ---------- */
const M_GROUND = {
  id: 'ground', title: 'Groundwater', group: 'Surface processes',
  blurb: 'Look underground at the water table, aquifers and wells. Pump a borehole and watch the water table drop.',
  variants: [], slider: { label: 'Pumping rate of the borehole', def: 30 },
  cam: [9, 6, 11], target: [0, -0.4, 0], fit: 7.4,
  parts: {
    unsat: { name: 'Unsaturated zone', desc: 'Pore spaces here hold both air and water. Rain soaks down through it.' },
    sat: { name: 'Saturated zone', desc: 'Every pore is full of water. Its top surface is the water table.' },
    aquitard: { name: 'Aquitard (clay)', desc: 'Clay has tiny, poorly connected pores, so water moves through it very slowly.' },
    confined: { name: 'Confined aquifer', desc: 'A porous sandstone trapped between clay layers. Its water is under pressure.' },
    basement: { name: 'Basement rock', desc: 'Hard crystalline rock that holds water only in cracks.' },
    well: { name: 'Pumped borehole', desc: 'Pumping pulls water toward the well faster than it can flow back, lowering the water table nearby.' },
    artesian: { name: 'Artesian well', desc: 'A well into a confined aquifer, where pressure pushes water up the casing, sometimes above the ground.' },
  },
  quiz: { all: [
    { type: 'tap', prompt: 'Tap the zone where every pore space is completely full of water.', parts: ['sat'], hint: 'It is below the water table.', why: 'The saturated zone is what we call groundwater. Its upper surface, the water table, roughly follows the shape of the land.' },
    { type: 'tap', prompt: 'Tap the layer that slows groundwater down.', parts: ['aquitard'], hint: 'Its grains are the finest.', why: 'Clay can be very porous but has low permeability: its pores are too small and poorly connected for water to flow easily.' },
    { type: 'mc', q: 'Raise the pumping rate. What happens to the water table around the borehole?', opts: ['It rises into a mound', 'It dips into a cone of depression', 'It stays exactly the same'], a: 1, hint: 'Push the slider to the right and look at the blue zone near the well.', why: 'Pumping removes water faster than it flows in, so the water table sags into a cone around the well. Nearby shallow wells can run dry.' },
    { type: 'tap', prompt: 'Tap the well where water rises without a pump.', parts: ['artesian'], hint: 'It reaches the deeper aquifer under the clay.', why: 'The confined aquifer is recharged where it is exposed at a higher elevation, so its water is under pressure, like water in a tank on a tower.' },
  ] },
  local: 'Enugu draws water from the Ajali Sandstone aquifer. In Lagos, thousands of boreholes tap the coastal sands, and heavy pumping can pull salty water in from the sea.',
  build(ctx){
    const S = ctx.scene, o = { x0: -7, x1: 7, z0: -3, z1: 3, nx: 56, nz: 24 };
    let P = 0.3;
    const surf = (x, z) => 2.0 + 0.15 * Math.sin(0.5 * x);
    const WT = (x, z) => 0.8 - 1.1 * P * Math.exp(-((x - 2.2) ** 2 + z * z) / 1.8);
    const L = [['unsat', '#d8c08f', 0.4], ['sat', '#3f7fa6'], ['aquitard', '#62666b'], ['confined', '#8fa6a3'], ['basement', '#8a7f7a']];
    const slabs = L.map(([id, c, op]) => { const s = hSlab(SM(c, op ? { op } : {}), o); s.meshes.forEach(m => ctx.part(m, id)); S.add(s.group); return s; });
    slabs[0].group.renderOrder = 5;
    const fixed = [[2, -0.4, -1.2], [3, -1.2, -2.5], [4, -2.5, -3.2]];
    fixed.forEach(([i, t, b]) => slabs[i].update(() => t, () => b));
    const casing = SM('#9aa3a8', { metal: 0.4, rough: 0.4 });
    const w = ctx.part(new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 2.6, 12), casing), 'well'); w.position.set(2.2, 1.0, 0); S.add(w);
    const pump = ctx.part(new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.35, 0.35), SM('#b03c12')), 'well'); pump.position.set(2.2, 2.45, 0); S.add(pump);
    const aw = ctx.part(new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 4.0, 12), casing), 'artesian'); aw.position.set(-3.5, 0.3, 0); S.add(aw);
    const jet = ctx.part(new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.16, 0.8, 12), SM('#4aa3d6', { op: 0.8 })), 'artesian'); jet.position.set(-3.5, 2.7, 0); S.add(jet);
    function rebuild(){ slabs[0].update(surf, WT); slabs[1].update(WT, () => -0.4); }
    rebuild();
    return { setParam(v){ P = v / 100; rebuild(); } };
  },
};

