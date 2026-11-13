/* Craton · 02-block-engine.js
 * Peel & Slice: procedural five-layer crustal block, deformation engine (fold / normal / thrust), clipping slicer, outcrop pin maths and pin questions.
 * Loaded as a classic script; top-level consts are shared across files in load order (see app/index.html).
 */
'use strict';
/* ============================ module 1: the block ============================ */
const W = 10, D = 6;
const LAYERS = [
  { id: 'lat', name: 'Lateritic Topsoil', kind: 'laterite', t: 0.5, swatch: '#9a3d1c', note: 'Quaternary weathering crust, SW Nigeria' },
  { id: 'ss', name: 'Cross-Bedded Sandstone', kind: 'sandstone', t: 1.15, swatch: '#d7b57d', note: 'like the Ajali Sandstone, Anambra Basin' },
  { id: 'sh', name: 'Fissile Shale', kind: 'shale', t: 0.95, swatch: '#4a4f53', note: 'like the Awgu Shale, Benue Trough' },
  { id: 'ls', name: 'Fossiliferous Limestone', kind: 'limestone', t: 1.05, swatch: '#cdd0c2', note: 'like the Ewekoro Formation, Dahomey Basin' },
  { id: 'gr', name: 'Basement Granite', kind: 'granite', t: 1.65, swatch: '#d4b4a3', note: 'Pan-African Older Granite, Basement Complex' },
];
const TOTAL = LAYERS.reduce((s, L) => s + L.t, 0);
const MODES = [
  { id: 'flat', label: 'Horizontal', sub: 'Undeformed strata' },
  { id: 'fold', label: 'Fold', sub: 'Plunging anticline and synclines' },
  { id: 'normal', label: 'Normal fault', sub: 'Extension on a 60° plane' },
  { id: 'reverse', label: 'Thrust', sub: 'Compression on a 35° plane' },
];
const FAULT_DIP = { normal: 60, reverse: 35 };
const isFaultMode = m => m === 'normal' || m === 'reverse';
function faultX(y, mode){ const d = FAULT_DIP[mode]; return d ? -y / Math.tan(d * DEG) : 0; }
function deformInto(out, x, y, z, hang, mode, s){
  let X = x, Y = y;
  if (mode === 'fold') {
    const amp = 1.25 * s, pl = Math.tan(16 * DEG * s);
    X = x * (1 - 0.1 * s);
    Y = y + amp * Math.cos(Math.PI * x / 5) * (0.8 + 0.2 * (z / (D / 2))) + z * pl;
  } else if (mode === 'normal' && hang) {
    const dip = 60 * DEG, dist = x - faultX(y, mode), r = 1.7 * s + 0.8 * s * Math.exp(-dist / 1.6);
    X = x + r * Math.cos(dip); Y = y - r * Math.sin(dip);
  } else if (mode === 'reverse' && hang) {
    const dip = 35 * DEG, dist = x - faultX(y, mode), r = 2.0 * s + 0.6 * s * Math.exp(-dist / 1.6);
    X = x - r * Math.cos(dip); Y = y + r * Math.sin(dip);
  }
  return out.set(X, Y, z);
}
function makePiece(){
  const g = new THREE.BoxGeometry(1, 1, 1, 24, 2, 10);
  const n = g.attributes.position.count;
  return { g, unit: Float32Array.from(g.attributes.position.array), nrm: Float32Array.from(g.attributes.normal.array), base: new Float32Array(n * 3) };
}
const _v = new THREE.Vector3();
function updatePiece(p, yb, yt, hang, mode, s){
  const pos = p.g.attributes.position, uv = p.g.attributes.uv, n = pos.count;
  for (let i = 0; i < n; i++) {
    const u = p.unit[3 * i] + .5, v = p.unit[3 * i + 1] + .5, w = p.unit[3 * i + 2] + .5;
    const y = lerp(yb, yt, v), xf = faultX(y, mode);
    const x = hang ? lerp(xf, W / 2, u) : lerp(-W / 2, xf, u), z = lerp(-D / 2, D / 2, w);
    p.base[3 * i] = x; p.base[3 * i + 1] = y; p.base[3 * i + 2] = z;
    deformInto(_v, x, y, z, hang, mode, s); pos.setXYZ(i, _v.x, _v.y, _v.z);
    const nx = Math.abs(p.nrm[3 * i]), ny = Math.abs(p.nrm[3 * i + 1]);
    if (nx > .5) uv.setXY(i, z * .3, y * .3); else if (ny > .5) uv.setXY(i, x * .3, z * .3); else uv.setXY(i, x * .3, y * .3);
  }
  pos.needsUpdate = true; uv.needsUpdate = true;
  p.g.computeVertexNormals(); p.g.computeBoundingSphere(); p.g.computeBoundingBox();
}
function orientationFrom(n){
  if (n.y < 0) n.negate();
  const dip = Math.acos(clamp(n.y, -1, 1)) / DEG;
  const dipDir = mod360(Math.atan2(n.x, -n.z) / DEG);
  return { dip, dipDir, strike: mod360(dipDir - 90) };
}

function buildBlock(stage, cb){
  const { scene, camera, canvas } = stage;
  lights(scene); scene.background = new THREE.Color('#d5ded9');
  const clip = new THREE.Plane(new THREE.Vector3(-1, 0, 0), 1000);
  const HIDDEN = new THREE.MeshBasicMaterial({ visible: false });
  const texs = {}; LAYERS.forEach(L => { texs[L.kind] = makeTex(L.kind, 256); });
  let state = { mode: 'flat', s: 0 }, slice = { on: false, axis: 'x', pos: 2 }, layerState = LAYERS.map(() => ({ v: true, o: 1 }));
  let yTop = TOTAL / 2;
  const layers = LAYERS.map((L, i) => {
    const yt = yTop, yb = yTop - L.t; yTop = yb;
    const front = new THREE.MeshStandardMaterial({ map: texs[L.kind].map, bumpMap: texs[L.kind].bump, bumpScale: 0.045, roughness: 0.9, metalness: 0, clippingPlanes: [clip] });
    const back = new THREE.MeshBasicMaterial({ map: texs[L.kind].map, color: 0x8f8f8f, side: THREE.BackSide, clippingPlanes: [clip] });
    const pieces = [false, true].map(hang => {
      const p = makePiece();
      p.fm = [front, front, front, front, front, front]; p.bm = [back, back, back, back, back, back];
      p.m1 = new THREE.Mesh(p.g, p.fm); p.m2 = new THREE.Mesh(p.g, p.bm);
      p.m1.userData = { layer: i, hang, piece: p }; p.hang = hang;
      scene.add(p.m1, p.m2); return p;
    });
    return { L, yt, yb, front, back, pieces };
  });
  // fault plane
  const fpGeo = new THREE.BufferGeometry(); fpGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(12), 3)); fpGeo.setIndex([0, 1, 2, 2, 1, 3]);
  const fpMat = new THREE.MeshBasicMaterial({ color: 0xb03c12, transparent: true, opacity: 0.3, side: THREE.DoubleSide, depthWrite: false, clippingPlanes: [clip] });
  const fault = new THREE.Mesh(fpGeo, fpMat); fault.renderOrder = 3; scene.add(fault);
  // section plane
  const secMat = new THREE.MeshBasicMaterial({ color: 0x08707e, transparent: true, opacity: 0.1, side: THREE.DoubleSide, depthWrite: false });
  const sec = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), secMat);
  const secEdge = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.PlaneGeometry(1, 1)), new THREE.LineBasicMaterial({ color: 0x08707e }));
  sec.add(secEdge); sec.visible = false; scene.add(sec);
  // ground reference + north arrow
  let grid = null; const baseY = -TOTAL / 2 - 0.01;
  const nShape = new THREE.Shape(); nShape.moveTo(0, -0.7); nShape.lineTo(0.35, 0.3); nShape.lineTo(0, 0.1); nShape.lineTo(-0.35, 0.3); nShape.closePath();
  const nMat = new THREE.MeshBasicMaterial({ color: 0xb03c12, side: THREE.DoubleSide });
  const nArrow = new THREE.Mesh(new THREE.ShapeGeometry(nShape), nMat); nArrow.rotation.x = -Math.PI / 2; nArrow.position.set(-W / 2 - 1.2, baseY + 0.02, -D / 2 + 0.3); scene.add(nArrow);
  const nLabel = makeLabel('N', '#0e1a15', 0.55, true); nLabel.position.set(-W / 2 - 1.2, baseY + 0.4, -D / 2 - 0.9); scene.add(nLabel);
  // pin marker
  const pin = new THREE.Group(); pin.visible = false;
  const pinMat = new THREE.MeshBasicMaterial({ color: 0xb03c12, depthTest: false });
  const symMat = new THREE.MeshBasicMaterial({ color: 0x0e1a15, depthTest: false });
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.13, 16, 12), pinMat); head.position.y = 0.8;
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.8, 6), pinMat); stem.position.y = 0.4;
  const sym = new THREE.Group(); sym.position.y = 0.04;
  const sBar = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.03, 1.2), symMat);
  const dTick = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.03, 0.07), symMat); dTick.position.x = 0.21;
  const hBar = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.03, 0.07), symMat);
  sym.add(sBar, dTick, hBar); pin.add(head, stem, sym);
  pin.traverse(o => { o.renderOrder = 20; }); scene.add(pin);
  let pinRef = null;

  function evalPin(){
    if (!pinRef) return null;
    const { base, hang, layer } = pinRef, e = 0.04, { mode, s } = state;
    const p = deformInto(new THREE.Vector3(), base.x, base.y, base.z, hang, mode, s);
    const px = deformInto(new THREE.Vector3(), base.x + e, base.y, base.z, hang, mode, s).sub(p);
    const pz = deformInto(new THREE.Vector3(), base.x, base.y, base.z + e, hang, mode, s).sub(p);
    const o = orientationFrom(new THREE.Vector3().crossVectors(pz, px).normalize());
    pin.position.copy(p); pin.visible = true;
    sym.rotation.y = -o.strike * DEG; const flat = o.dip < 0.5; dTick.visible = !flat; hBar.visible = flat;
    stage.invalidate();
    return { layer, hang, ...o, flat, mode };
  }
  function setDeform(mode, s){
    state = { mode, s };
    const fm = isFaultMode(mode);
    layers.forEach(lo => lo.pieces.forEach(p => {
      updatePiece(p, lo.yb, lo.yt, p.hang, mode, s);
      const inner = p.hang ? 1 : 0; // BoxGeometry group 0 = +x face, 1 = -x face
      p.fm[inner] = fm ? lo.front : HIDDEN; p.bm[inner] = fm ? lo.back : HIDDEN;
    }));
    fault.visible = fm;
    if (fm) { const a = fpGeo.attributes.position, y1 = TOTAL / 2 + 0.8, y0 = -TOTAL / 2 - 0.8, z = D / 2 + 0.25;
      a.setXYZ(0, faultX(y1, mode), y1, -z); a.setXYZ(1, faultX(y1, mode), y1, z); a.setXYZ(2, faultX(y0, mode), y0, -z); a.setXYZ(3, faultX(y0, mode), y0, z);
      a.needsUpdate = true; fpGeo.computeBoundingSphere(); }
    const r = evalPin(); if (r) cb.onPin(r);
    stage.invalidate();
  }
  function setLayers(arr){
    layerState = arr;
    layers.forEach((lo, i) => {
      const st = arr[i] || { v: true, o: 1 }, op = clamp(st.o, 0, 1), tr = op < 0.99;
      [lo.front, lo.back].forEach(m => { if (m.transparent !== tr) { m.transparent = tr; m.needsUpdate = true; } m.opacity = op; m.depthWrite = !tr; });
      lo.pieces.forEach(p => { p.m1.visible = p.m2.visible = st.v && op > 0.02; });
    });
    stage.invalidate();
  }
  function setSlice(sl){
    slice = sl;
    clip.normal.set(sl.axis === 'x' ? -1 : 0, 0, sl.axis === 'z' ? -1 : 0);
    clip.constant = sl.on ? sl.pos : 1000;
    sec.visible = sl.on;
    if (sl.axis === 'x') { sec.rotation.set(0, Math.PI / 2, 0); sec.scale.set(D + 1.4, TOTAL + 4.6, 1); sec.position.set(sl.pos, -0.4, 0); }
    else { sec.rotation.set(0, 0, 0); sec.scale.set(W + 4.6, TOTAL + 4.6, 1); sec.position.set(0, -0.4, sl.pos); }
    stage.invalidate();
  }
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), tA = new THREE.Vector3(), tB = new THREE.Vector3(), tC = new THREE.Vector3(), bary = new THREE.Vector3();
  function pick(cx, cy){
    const rect = canvas.getBoundingClientRect();
    ndc.set(((cx - rect.left) / rect.width) * 2 - 1, -((cy - rect.top) / rect.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const targets = [];
    layers.forEach((lo, i) => { const st = layerState[i] || { v: true, o: 1 }; if (st.v && st.o > 0.1) lo.pieces.forEach(p => targets.push(p.m1)); });
    const hits = ray.intersectObjects(targets, false);
    const hit = hits.find(h => !slice.on || (slice.axis === 'x' ? h.point.x <= slice.pos + 1e-3 : h.point.z <= slice.pos + 1e-3));
    if (!hit || !hit.face) return null;
    const p = hit.object.userData.piece, pos = p.g.attributes.position, { a, b, c } = hit.face;
    tA.fromBufferAttribute(pos, a); tB.fromBufferAttribute(pos, b); tC.fromBufferAttribute(pos, c);
    THREE.Triangle.getBarycoord(hit.point, tA, tB, tC, bary);
    const B = (idx, k) => p.base[3 * idx + k];
    const base = new THREE.Vector3(
      B(a, 0) * bary.x + B(b, 0) * bary.y + B(c, 0) * bary.z,
      B(a, 1) * bary.x + B(b, 1) * bary.y + B(c, 1) * bary.z,
      B(a, 2) * bary.x + B(b, 2) * bary.y + B(c, 2) * bary.z);
    pinRef = { base, hang: p.hang, layer: hit.object.userData.layer };
    const r = evalPin(); cb.onPin(r); return r;
  }
  function clearPin(){ pinRef = null; pin.visible = false; stage.invalidate(); }
  function setTheme(t){
    scene.background.set(t.stage);
    if (grid) { scene.remove(grid); grid.geometry.dispose(); grid.material.dispose(); }
    grid = new THREE.GridHelper(26, 26, new THREE.Color(t.mute), new THREE.Color(t.line)); grid.position.y = baseY; scene.add(grid);
    fpMat.color.set(t.acc); pinMat.color.set(t.acc); nMat.color.set(t.acc); symMat.color.set(t.ink);
    secMat.color.set(t.acc2); secEdge.material.color.set(t.acc2); nLabel.userData.draw(t.ink);
    stage.invalidate();
  }
  setDeform('flat', 0);
  return { setDeform, setLayers, setSlice, pick, clearPin, setTheme, reset: stage.resetView };
}

const PREDICT = {
  fold: { q: 'You are about to squeeze this block from the east and west. What will the beds in the middle do?',
    opts: ['Sag down into a basin', 'Arch upward into an anticline', 'Stay flat and simply get thicker'], a: 1,
    why: 'Horizontal compression buckles layered rock. The centre arches into an anticline and the edges sag into synclines. The hinge also tilts toward the north, so the fold plunges. This is the style of the Santonian folding that inverted the Benue Trough into the Abakaliki Anticlinorium.' },
  normal: { q: 'The crust is about to be pulled apart across a fault dipping 60° to the east. Which way will the block above the fault (the hanging wall) move?',
    opts: ['Up the fault plane', 'Straight sideways, with no vertical change', 'Down the fault plane'], a: 2,
    why: 'Extension lets the hanging wall slide down-dip. Watch the beds beside the fault bend down toward it. That is a rollover, the classic trap shape of Niger Delta growth faults, where sediment piles up against a fault that keeps moving.' },
  reverse: { q: 'Now the crust is squeezed across a fault dipping 35°. What will the hanging wall do?',
    opts: ['Ride up and over the footwall', 'Drop down the fault', 'Split into thinner horizontal beds'], a: 0,
    why: 'Compression drives the hanging wall up-dip, stacking older rock over younger rock. A reverse fault this shallow is called a thrust. A borehole through it would pass through some beds twice.' },
};

function pinQuestion(pin){
  const L = LAYERS[pin.layer], dip = Math.round(pin.dip), dd = f3(pin.dipDir);
  if (L.id === 'gr') return { id: 'granite', q: 'Your pin is in the basement granite. It has no bedding. Why are its crystals interlocking and big enough to see?',
    opts: ['Sand grains were cemented together by groundwater', 'It cooled slowly from magma deep in the crust', 'It formed as mud settled on a lake floor'], a: 1,
    hint: 'Zoom in on the texture. Are the grains rounded and separate, or locked together like a mosaic?',
    why: 'Coarse interlocking crystals mean slow cooling at depth. Nigeria\'s Pan-African Older Granites, such as Olumo Rock and the Idanre Hills, intruded the Basement Complex about 600 million years ago and were exposed later by erosion.' };
  if (L.id === 'lat') return { id: 'laterite', q: 'Why is this top layer brick-red and full of hard nodules?',
    opts: ['Lava baked the surface red', 'Wind carried red sand in from the Sahara', 'Tropical weathering washed out the soluble minerals and left iron oxides behind'], a: 2,
    hint: 'Think about what years of heavy rain and heat do to minerals. Which elements wash away, and which stay?',
    why: 'Laterite is a residual soil. Intense tropical weathering removes silica and soluble cations, concentrating iron and aluminium oxides into nodules and crusts. Road cuts around Ibadan show it well. In real outcrops laterite forms after folding and faulting and drapes over them; this model deforms it only so you can keep track of it.' };
  const m = pin.mode;
  if (m === 'flat' || dip < 1) {
    if (m === 'fold') return { id: 'hinge', q: 'The dip here is only ' + dip + '°, yet the block is folded. Where is your pin?',
      opts: ['On a steep fold limb', 'Near a fold hinge, where the bed turns over', 'Outside the fold altogether'], a: 1,
      hint: 'Run your eye along the bed. Where does it change from dipping one way to dipping the other?',
      why: 'At the hinge the bed is momentarily level across the fold. Dip increases toward the limbs. Mapping where dip directions flip is how geologists trace fold axes across the Benue Trough.' };
    return { id: 'horiz', q: 'This bed dips ' + dip + '°. Why is it horizontal?',
      opts: ['It was dumped on a steep slope', 'Particles settled out of water under gravity into flat layers', 'It was tilted, then tilted back exactly'], a: 1,
      hint: 'Picture sand settling to the bottom of a bucket of water. What shape does the deposit take?',
      why: 'This is Steno\'s principle of original horizontality: sediment accumulates in nearly flat layers. Inside the sandstone you can see small inclined cross-beds, but the bed as a whole is level. Any real tilt you measure later is evidence of deformation.' };
  }
  if (m === 'fold') {
    if (dip < 4) return { id: 'hinge', q: 'The dip here is only ' + dip + '°, yet the block is folded. Where is your pin?',
      opts: ['On a steep fold limb', 'Near a fold hinge, where the bed turns over', 'Outside the fold altogether'], a: 1,
      hint: 'Run your eye along the bed. Where does it change from dipping one way to dipping the other?',
      why: 'At the hinge the bed is momentarily level across the fold. Dip increases toward the limbs. Mapping where dip directions flip is how geologists trace fold axes across the Benue Trough.' };
    return { id: 'limb', q: 'This bed dips ' + dip + '° toward ' + dd + '°. What tilted it?',
      opts: ['It was laid down on a sloping sea floor', 'Horizontal compression buckled it into a fold', 'It slid down a normal fault'], a: 1,
      hint: 'Pin a bed on the other side of the block centre. Do the two dip directions point away from each other, toward each other, or the same way?',
      why: 'Dips that face away from a central axis define an anticline; dips that face toward it define a syncline. Both form when layered rock is shortened. The NE–SW folds of the Benue Trough formed this way during Santonian inversion.' };
  }
  if (m === 'normal') {
    if (pin.hang) return { id: 'nhang', q: 'This bed sits lower than the same bed across the fault and dips ' + dip + '° toward ' + dd + '°. Why?',
      opts: ['Compression pushed the other block upward', 'The crust stretched and this block slid down the fault', 'It was deposited lower to begin with'], a: 1,
      hint: 'Find the fault plane. Is your pin above it (hanging wall) or below it (footwall)? Then compare the same bed on each side.',
      why: 'Hanging wall down relative to footwall means a normal fault, the signature of extension. Near the fault the beds dip back toward it in a rollover. In the Niger Delta, growth faults like this move while sediment is still arriving, so rollovers trap oil and gas.' };
    return { id: 'nfoot', q: 'Your pin is below the fault plane. Did this block move?',
      opts: ['Yes, it rose up the fault', 'Relative to it, the hanging wall dropped; this side is the fixed reference', 'It moved sideways along the strike of the fault'], a: 1,
      hint: 'Follow one bed, say the shale, across the fault. Which side is out of place compared with the undeformed block?',
      why: 'Fault motion is relative. Here the footwall is the reference frame and the hanging wall slid down-dip, so this is a normal fault formed by extension.' };
  }
  if (pin.hang) return { id: 'rhang', q: 'This bed is higher than its continuation across the fault. Why?',
    opts: ['Extension let it drop', 'Erosion removed rock from the other side', 'Compression drove it up the fault plane'], a: 2,
    hint: 'Is your pin above or below the fault plane? Which way has the same bed moved relative to the other side?',
    why: 'Hanging wall up relative to footwall means a reverse fault; at 35° it is a thrust. Thrusts shorten and thicken the crust and stack older rock on younger rock.' };
  return { id: 'rfoot', q: 'You are below the thrust plane. What would a borehole drilled straight down through the fault zone find?',
    opts: ['Each bed exactly once', 'Some beds twice: a repeated section', 'No sedimentary rock at all'], a: 1,
    hint: 'Trace a vertical line down through the block near the fault. How many times does it cross the shale?',
    why: 'Thrusting puts a sheet of rock on top of its own continuation, so a well through the fault crosses the same beds twice. Repeated sections in well logs are a key clue to hidden thrusts.' };
}

