/* Craton · 11-atlas-models-b.js
 * 3D Atlas part B: earthquakes, deltas, dunes, karst, gully erosion, oil traps, metamorphic grade, fossils.
 * Loaded as a classic script; top-level consts are shared across files in load order (see app/index.html).
 */
'use strict';
/* ---------- shared helpers for vertex-coloured slabs ---------- */
function addVC(meshes){ meshes.forEach(m => m.geometry.setAttribute('color', new THREE.Float32BufferAttribute(new Float32Array(m.geometry.attributes.position.count * 3), 3))); }
const _cc = new THREE.Color();
function paintVC(meshes, fn){
  meshes.forEach(m => { const p = m.geometry.attributes.position, c = m.geometry.attributes.color, n = m.geometry.attributes.normal;
    for (let i = 0; i < p.count; i++) { fn(_cc, p.getX(i), p.getY(i), p.getZ(i), m, n ? n.getX(i) : 0, n ? n.getY(i) : 1); _cc.convertSRGBToLinear(); c.setXYZ(i, _cc.r, _cc.g, _cc.b); }
    c.needsUpdate = true; });
}
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const tube = (pts, r) => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(...p))), Math.max(16, pts.length * 12), r, 8, false);

/* ---------- model: earthquakes and seismic waves ---------- */
const M_QUAKE = {
  id: 'quake', title: 'Earthquakes and seismic waves', group: 'The Earth system', animated: true,
  blurb: 'Watch P- and S-waves race out from a fault, then see the shadow zones that revealed the liquid core.',
  variants: [{ id: 'waves', label: 'Waves from a fault' }, { id: 'shadow', label: 'Shadow zones' }],
  cam: [9, 6, 11], target: [0, -1.4, 0], fit: 7.4,
  parts: {
    crust: { name: 'Crust', desc: 'Rock that stores elastic strain as plates push on it, until a fault suddenly slips.' },
    fault: { name: 'Fault plane', desc: 'The surface along which rock suddenly slips, releasing stored energy as seismic waves.' },
    focus: { name: 'Focus (hypocentre)', desc: 'The point underground where the rupture starts.' },
    epicentre: { name: 'Epicentre', desc: 'The point on the surface directly above the focus. News reports give this location.' },
    station: { name: 'Seismograph station', desc: 'Records the shaking. The time gap between the P and S arrivals tells you how far away the earthquake was.' },
    quake: { name: 'Earthquake', desc: 'Seismic waves spread out from here through the whole planet.' },
    mantle: { name: 'Mantle', desc: 'Waves speed up with depth here, so their paths curve back toward the surface.' },
    core: { name: 'Outer core', desc: 'Liquid iron. S-waves cannot cross it and P-waves are bent sharply as they enter it.' },
    sshadow: { name: 'S-wave shadow zone', desc: 'More than about 103° from the earthquake, no direct S-waves arrive, because they cannot travel through the liquid outer core.' },
    pshadow: { name: 'P-wave shadow zone', desc: 'Between about 103° and 142°, P-waves bent by the core miss this band of the surface.' },
  },
  quiz: {
    waves: [
      { type: 'tap', prompt: 'Tap the epicentre.', parts: ['epicentre'], hint: 'It is on the surface, not underground.', why: 'The epicentre is the surface point directly above the focus. Shaking is usually strongest near it.' },
      { type: 'tap', prompt: 'Tap the focus, where the rupture began.', parts: ['focus'], hint: 'It glows, deep on the fault plane.', why: 'Most earthquakes start within the top 20 km of the crust. Some in subduction zones start 700 km down.' },
      { type: 'mc', q: 'Watch the two wave fronts. Which will reach the seismograph station first?', opts: ['The S-wave', 'The P-wave', 'Both at the same time'], a: 1, hint: 'Compare how fast each ring grows.', why: 'P-waves travel about 1.7 times faster than S-waves. The further the station, the bigger the gap between their arrivals, which is how seismologists measure distance.' },
    ],
    shadow: [
      { type: 'tap', prompt: 'Tap the region where no direct S-waves arrive.', parts: ['sshadow', 'pshadow'], hint: 'It is on the far side of the planet from the earthquake.', why: 'The S-wave shadow zone covers everything beyond about 103°. Its size let Richard Oldham and others work out the size of the core.' },
      { type: 'mc', q: 'Why is there a huge S-wave shadow zone?', opts: ['S-waves are too weak to travel far', 'S-waves cannot travel through the liquid outer core', 'The inner core reflects them'], a: 1, hint: 'S-waves shear rock side to side. What can a liquid not resist?', why: 'Liquids have no shear strength, so shear waves cannot pass through them. That is our main evidence that the outer core is liquid.' },
    ],
  },
  local: 'Nigeria sits far from plate boundaries, but small tremors do happen, for example around Kwoi in Kaduna State in 2016 and in Mpape, Abuja, in 2018.',
  build(ctx){
    const S = ctx.scene;
    const clipBox = [new THREE.Plane(new THREE.Vector3(1, 0, 0), 7), new THREE.Plane(new THREE.Vector3(-1, 0, 0), 7), new THREE.Plane(new THREE.Vector3(0, 0, 1), 3.5), new THREE.Plane(new THREE.Vector3(0, 0, -1), 3.5), new THREE.Plane(new THREE.Vector3(0, -1, 0), 0), new THREE.Plane(new THREE.Vector3(0, 1, 0), 5)];
    const W = new THREE.Group(); S.add(W);
    const crust = ctx.part(new THREE.Mesh(new THREE.BoxGeometry(14, 5, 7), SM('#b8a07e', { op: 0.3 })), 'crust'); crust.position.y = -2.5; W.add(crust);
    const fg = new THREE.Group(); fg.position.set(0, -2.5, 0); fg.rotation.z = 20 * DEG; W.add(fg);
    const fp = ctx.part(new THREE.Mesh(new THREE.PlaneGeometry(7, 6.2), SM('#b03c12', { op: 0.42, clip: clipBox })), 'fault'); fp.rotation.y = Math.PI / 2; fg.add(fp);
    const fx = 0.5 * Math.tan(20 * DEG);
    const focus = ctx.part(new THREE.Mesh(new THREE.SphereGeometry(0.2, 20, 14), SM('#ff5a1f', { emissive: '#ff3a00', ei: 0.9 })), 'focus'); focus.position.set(fx, -3, 0); W.add(focus);
    const epi = ctx.part(new THREE.Mesh(new THREE.RingGeometry(0.14, 0.34, 28), SM('#b03c12', { emissive: '#b03c12', ei: 0.4 })), 'epicentre'); epi.rotation.x = -Math.PI / 2; epi.position.set(fx, 0.02, 0); W.add(epi);
    const epiC = ctx.part(new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.4, 14), SM('#b03c12')), 'epicentre'); epiC.rotation.x = Math.PI; epiC.position.set(fx, 0.35, 0); W.add(epiC);
    const st = ctx.part(new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.3, 0.4), SM('#0e1a15')), 'station'); st.position.set(5.2, 0.15, 1.8); W.add(st);
    const mast = ctx.part(new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.9, 8), SM('#46564f')), 'station'); mast.position.set(5.2, 0.6, 1.8); W.add(mast);
    const mkW = c => { const m = new THREE.Mesh(new THREE.SphereGeometry(1, 40, 24), new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.3, depthWrite: false, side: THREE.DoubleSide, clippingPlanes: clipBox })); m.position.copy(focus.position); W.add(m); return m; };
    const pw = mkW(0xff8a3d), sw = mkW(0x3fb2c9);
    const pl = makeLabel('P', '#b03c12', 0.5), sl = makeLabel('S', '#08707e', 0.5); W.add(pl, sl);
    // shadow zones on the whole Earth
    const Sh = new THREE.Group(); S.add(Sh);
    Sh.add(ctx.part(new THREE.Mesh(new THREE.SphereGeometry(3, 48, 32), SM('#b8452b', { op: 0.22 })), 'mantle'));
    Sh.add(ctx.part(new THREE.Mesh(new THREE.SphereGeometry(1.64, 40, 28), SM('#e8873a')), 'core'));
    const q = ctx.part(new THREE.Mesh(new THREE.SphereGeometry(0.16, 16, 12), SM('#ff5a1f', { emissive: '#ff3a00', ei: 0.9 })), 'quake'); q.position.set(0, 2.9, 0); Sh.add(q);
    Sh.add(ctx.part(new THREE.Mesh(new THREE.SphereGeometry(3.03, 48, 24, 0, Math.PI * 2, 103 * DEG, 77 * DEG), SM('#08707e', { op: 0.55 })), 'sshadow'));
    const pz = ctx.part(new THREE.Mesh(new THREE.SphereGeometry(3.06, 48, 16, 0, Math.PI * 2, 103 * DEG, 39 * DEG), SM('#e0a43a', { op: 0.7 })), 'pshadow'); pz.renderOrder = 3; Sh.add(pz);
    const rayMat = new THREE.LineBasicMaterial({ color: 0x0e1a15 });
    [15, 35, 55, 75, 95].forEach(a => [1, -1].forEach(sg => { const s0 = new THREE.Vector3(0, 3, 0), e = new THREE.Vector3(sg * 3 * Math.sin(a * DEG), 3 * Math.cos(a * DEG), 0), c = s0.clone().add(e).multiplyScalar(0.5 * (1 - a / 260));
      Sh.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(new THREE.QuadraticBezierCurve3(s0, c, e).getPoints(30)), rayMat)); }));
    let v = 'waves';
    return {
      setVariant(id){ v = id; W.visible = id === 'waves'; Sh.visible = id === 'shadow'; },
      tick(t){ if (v !== 'waves') return; const tc = t % 5, rP = 0.3 + tc * 2.4, rS = 0.3 + tc * 1.4;
        pw.scale.setScalar(rP); sw.scale.setScalar(rS); pw.material.opacity = 0.32 * (1 - tc / 5); sw.material.opacity = 0.32 * (1 - tc / 5);
        pl.position.set(fx + rP * 0.7, Math.min(-0.2, -3 + rP * 0.7), 3.4); sl.position.set(fx + rS * 0.7, Math.min(-0.2, -3 + rS * 0.7), 3.4); },
    };
  },
};

/* ---------- model: deltas ---------- */
const M_DELTA = {
  id: 'delta', title: 'Deltas and coasts', group: 'Surface processes',
  blurb: 'Build a delta where a river meets the sea. Compare the wave-shaped Niger Delta with a river-shaped bird-foot delta.',
  variants: [{ id: 'arcuate', label: 'Arcuate (Niger)' }, { id: 'birdfoot', label: 'Bird-foot' }],
  slider: { label: 'Sea level', def: 50, text: v => (v < 45 ? 'Sea level falls' : v > 55 ? 'Sea level rises' : 'Present sea level') },
  cam: [0, 8.5, 11], target: [0, -0.4, 0.8], fit: 7.6,
  parts: {
    plain: { name: 'Delta plain', desc: 'Low, flat, swampy land built of river mud and sand, crossed by channels.' },
    front: { name: 'Delta front', desc: 'The underwater slope where the river drops most of its sand as it slows down.' },
    distributary: { name: 'Distributary channel', desc: 'A branch of the river that splits off and carries water and sediment to the sea.' },
    river: { name: 'Trunk river', desc: 'The main river feeding sediment to the delta.' },
    sea: { name: 'Sea', desc: 'Waves and tides rework the sediment the river delivers.' },
    beach: { name: 'Beach ridge', desc: 'Sand piled along the shore by waves, smoothing the delta front into an arc.' },
  },
  quiz: {
    arcuate: [
      { type: 'mc', q: 'Why do deltas form where rivers enter the sea?', opts: ['The river speeds up and digs a hole', 'The water slows down and can no longer carry its sediment, so it drops it', 'The sea pushes sand up the river'], a: 1, hint: 'What happens to a river current when it meets still water?', why: 'As the current spreads out and slows, coarse sand settles first near the mouth and fine mud drifts further out, building land seaward.' },
      { type: 'tap', prompt: 'Tap a distributary channel.', parts: ['distributary'], hint: 'Thin blue channels branching across the delta plain.', why: 'Distributaries split the flow. Over time they switch course, building new lobes of the delta.' },
      { type: 'mc', q: 'The Niger Delta has a smooth, curved coastline. What shaped it?', opts: ['Strong waves spreading sand along the shore', 'The river alone', 'Glaciers'], a: 0, hint: 'Think about what strong ocean waves do to sand delivered at the river mouths.', why: 'Strong Atlantic waves move sand sideways along the coast, smoothing the delta into an arc. Tides also cut many creeks through its mangroves.' },
      { type: 'mc', q: 'Raise the sea level with the slider. What happens to the delta plain?', opts: ['It floods and the shoreline moves inland', 'It grows bigger', 'Nothing changes'], a: 0, hint: 'Drag the slider to the right and watch the land.', why: 'Rising sea level drowns low delta plains. This is a serious risk for the Niger Delta, where most land is only a few metres above sea level.' },
    ],
    birdfoot: [
      { type: 'mc', q: 'This delta has long fingers of land along each channel. What does that tell you?', opts: ['Waves are strong and smooth the coast', 'The river supplies lots of sediment and waves are weak', 'Glaciers built it'], a: 1, hint: 'Compare it with the arcuate delta.', why: 'Where waves and tides are weak, levees build out along each channel into long fingers. The Mississippi Delta is the classic bird-foot delta.' },
    ],
  },
  localV: {
    arcuate: 'The Niger Delta is one of the largest deltas in the world, rich in mangrove swamps and in the oil and gas trapped in its buried sands.',
    birdfoot: 'The Mississippi Delta in the USA is the classic bird-foot delta, a useful contrast with the wave-shaped Niger Delta.',
  },
  build(ctx){
    const S = ctx.scene, o = { x0: -8, x1: 8, z0: -6, z1: 6, nx: 110, nz: 84 };
    let V = 'arcuate', lvl = 0;
    const TH = { arcuate: [-62, -38, -14, 10, 34, 58].map(a => a * DEG), birdfoot: [-38, 0, 36].map(a => a * DEG) };
    const rc = th => V === 'arcuate' ? 4.4 * (1 - 0.22 * (th / 1.4) ** 2) : 2.0 + 3.4 * TH.birdfoot.reduce((s, k) => s + Math.exp(-(((th - k) / 0.12) ** 2)), 0);
    const inland = (x, z) => 0.35 + 0.05 * (-1 - z) - 0.25 * Math.exp(-x * x / 0.6);
    const deltaY = (x, z) => { const r = Math.hypot(x, z + 1), th = Math.atan2(x, z + 1), R = rc(th); return r < R ? 0.35 * (1 - r / R) + 0.05 : Math.max(-2.2, 0.05 - 0.55 * (r - R)); };
    const terr = (x, z) => z < -1 ? inland(x, z) : lerp(inland(x, -1), deltaY(x, z), smooth(0, 1, z + 1));
    const topMat = SM('#ffffff', { vc: true }), sideMat = SM('#8a7a5e');
    const t = hSlab(topMat, o, sideMat); addVC([t.top]); t.meshes.forEach(m => ctx.part(m, 'plain')); S.add(t.group);
    const sea = ctx.part(new THREE.Mesh(new THREE.PlaneGeometry(16, 12), SM('#2f7fb5', { op: 0.55, rough: 0.2 })), 'sea'); sea.rotation.x = -Math.PI / 2; S.add(sea);
    const chMat = SM('#2f7fb5', { rough: 0.3 }), beachMat = SM('#efe3c2');
    let chans = [];
    function paint(){ paintVC([t.top], (c, x, y) => { if (y > lvl + 0.04) c.set(y < lvl + 0.16 ? '#2f5a32' : '#4f7d3f'); else c.set('#c9b48a').lerp(new THREE.Color('#6d5c45'), clamp((lvl - y) / 2, 0, 1)); }); }
    function build(){
      chans.forEach(m => { S.remove(m); m.geometry.dispose(); }); chans = [];
      t.update(terr, () => -2.6);
      const main = []; for (let i = 0; i <= 12; i++) { const z = lerp(-6, -1, i / 12); main.push([0, terr(0, z) + 0.04, z]); }
      const m0 = ctx.part(new THREE.Mesh(tube(main, 0.14), chMat), 'river'); S.add(m0); chans.push(m0);
      TH[V].forEach(k => { const pts = []; const R = rc(k) + 0.15; for (let i = 0; i <= 14; i++) { const r = R * i / 14, th = k + 0.08 * Math.sin(r * 1.6); const x = r * Math.sin(th), z = -1 + r * Math.cos(th); pts.push([x, Math.max(terr(x, z), -0.1) + 0.04, z]); }
        const m = ctx.part(new THREE.Mesh(tube(pts, 0.085), chMat), 'distributary'); S.add(m); chans.push(m); });
      if (V === 'arcuate') { const pts = []; for (let i = 0; i <= 40; i++) { const th = lerp(-80, 80, i / 40) * DEG, r = rc(th) - 0.08, x = r * Math.sin(th), z = -1 + r * Math.cos(th); pts.push([x, terr(x, z) + 0.03, z]); }
        const b = ctx.part(new THREE.Mesh(tube(pts, 0.07), beachMat), 'beach'); S.add(b); chans.push(b); }
      paint();
    }
    build();
    return {
      setVariant(v){ V = v; build(); },
      setParam(v){ lvl = lerp(-0.6, 0.6, v / 100); sea.position.y = lvl; paint(); },
      regions: ['plain', 'front'],
      resolve(h, id){ return id === 'plain' ? (h.point.y > lvl + 0.04 ? 'plain' : 'front') : id; },
    };
  },
};

/* ---------- model: desert dunes ---------- */
const BAR = [[-3.6, -2, 1], [1.6, 2.2, 0.85], [4.4, -2.6, 0.7]];
const DUNEF = {
  barchan: (x, z) => { let h = 0; BAR.forEach(([x0, z0, s]) => { const dz = (z - z0) / s, u = (x - x0) / s + 0.38 * dz * dz, env = 1 - (dz / 2.2) ** 2; if (env <= 0) return;
    const p = u < -4 ? 0 : u < 0 ? (u + 4) / 4 : u < 1.3 ? 1 - u / 1.3 : 0; h = Math.max(h, 1.3 * s * Math.pow(env, 0.6) * p); }); return h; },
  transverse: (x, z) => { const u = x + 0.5 * Math.sin(0.7 * z), s = ((u % 4) + 4) % 4; return 1.0 * (s < 3 ? s / 3 : 1 - (s - 3)); },
  linear: (x, z) => { const v = z + 0.6 * Math.sin(0.5 * x), s = ((v % 3.2) + 3.2) % 3.2 - 1.6; return 1.0 * Math.pow(Math.max(0, 1 - Math.abs(s) / 1.6), 1.3); },
};
const M_DUNES = {
  id: 'dunes', title: 'Desert dunes', group: 'Surface processes', animated: true,
  blurb: 'Watch wind-blown sand build crescent barchans, transverse ridges and linear dunes. Read the wind from their shape.',
  variants: [{ id: 'barchan', label: 'Barchan' }, { id: 'transverse', label: 'Transverse' }, { id: 'linear', label: 'Linear' }],
  cam: [-6, 7, 11], target: [0, 0, 0], fit: 7.6,
  parts: {
    windward: { name: 'Windward (stoss) slope', desc: 'The gentle slope facing the wind. Sand grains bounce up it.' },
    slipface: { name: 'Slip face', desc: 'The steep downwind slope, about 34°, where sand avalanches down as the dune creeps forward.' },
    horn: { name: 'Horn', desc: 'The tips of a barchan move fastest because they hold the least sand, so they point downwind.' },
    interdune: { name: 'Interdune flat', desc: 'Bare ground between dunes, where there is too little sand to build a dune.' },
    flank: { name: 'Dune flank', desc: 'Linear dunes have slip faces on both sides, because winds come from two directions.' },
  },
  quiz: {
    barchan: [
      { type: 'tap', prompt: 'Tap the slip face of a dune.', parts: ['slipface'], hint: 'The steep side, in shadow.', why: 'Sand blown over the crest piles up until it avalanches down the slip face. Its angle, about 34°, is the angle of repose of dry sand.' },
      { type: 'mc', q: 'Which way is the wind blowing in this model?', opts: ['From the steep side toward the gentle side', 'From the gentle side toward the steep side', 'You cannot tell from a dune'], a: 1, hint: 'Watch the drifting grains, then check the dune shape.', why: 'Wind pushes sand up the gentle windward slope and drops it over the steep slip face, so dunes point their steep side downwind.' },
      { type: 'tap', prompt: 'Tap a horn of a barchan.', parts: ['horn'], hint: 'The thin tips of the crescent.', why: 'Barchans form where sand is scarce and the wind blows from one direction. Their horns always point downwind.' },
    ],
    transverse: [
      { type: 'mc', q: 'Transverse dunes form long ridges across the wind. What do they need?', opts: ['Very little sand', 'Plenty of sand and a steady wind from one direction', 'Wind from two directions'], a: 1, hint: 'Barchans form where sand is scarce; what happens when there is enough sand for crescent dunes to join up?', why: 'With abundant sand, barchans merge sideways into continuous ridges at right angles to the wind.' },
    ],
    linear: [
      { type: 'mc', q: 'Linear dunes run parallel to the overall wind and have steep sides on both flanks. Why?', opts: ['Winds blow from two directions at different seasons', 'There is no wind', 'They are made of rock'], a: 0, hint: 'A slip face forms on the downwind side. How can both sides be downwind?', why: 'Two seasonal winds from different directions each build a slip face, and the net transport stretches the dune into a long ridge.' },
    ],
  },
  local: 'Sand dunes cover parts of far northern Nigeria, in Yobe and Borno states at the edge of the Sahara. Each dry season the Harmattan wind blows dust south across the country.',
  build(ctx){
    const S = ctx.scene, o = { x0: -8, x1: 8, z0: -6, z1: 6, nx: 104, nz: 78 };
    let V = 'barchan';
    const sand = (x, z) => (V === 'barchan' ? 0 : 0) + DUNEF[V](x, z) + 0.02 * Math.sin(6 * x + z);
    const t = hSlab(SM('#ffffff', { vc: true }), o, SM('#c9a46a')); addVC([t.top]); t.meshes.forEach(m => ctx.part(m, 'windward')); S.add(t.group);
    const grains = new THREE.InstancedMesh(new THREE.SphereGeometry(0.05, 6, 4), SM('#fff4dc'), 80); grains.frustumCulled = false; S.add(grains);
    const r = rng(8), gp = Array.from({ length: 80 }, () => [r() * 16 - 8, r() * 12 - 6, r()]);
    const mtx = new THREE.Matrix4();
    function build(){ t.update(sand, () => -1);
      paintVC([t.top], (c, x, y, z, m, nx) => { c.set('#d9b77c').lerp(new THREE.Color('#ecd3a0'), clamp(y / 1.2, 0, 1)); if (nx > 0.35) c.lerp(new THREE.Color('#b8894f'), 0.55); }); }
    build();
    return {
      setVariant(v){ V = v; build(); },
      tick(time){ gp.forEach((g, i) => { const x = ((g[0] + time * 1.2 + 8) % 16 + 16) % 16 - 8, z = g[1]; mtx.makeTranslation(x, sand(x, z) + 0.15 + 0.12 * Math.abs(Math.sin(time * 3 + g[2] * 9)), z); grains.setMatrixAt(i, mtx); }); grains.instanceMatrix.needsUpdate = true; },
      regions: ['windward', 'slipface', 'horn', 'interdune', 'flank'],
      resolve(h){ const y = h.point.y, n = h.face ? h.face.normal : { x: 0, y: 1 };
        if (y < 0.08) return 'interdune';
        if (V === 'linear') return 'flank';
        if (n.x > 0.3) return 'slipface';
        if (V === 'barchan') { const d = BAR.reduce((b, q) => Math.hypot(h.point.x - q[0], h.point.z - q[1]) < Math.hypot(h.point.x - b[0], h.point.z - b[1]) ? q : b, BAR[0]); if (Math.abs(h.point.z - d[1]) / d[2] > 1.3) return 'horn'; }
        return 'windward'; },
    };
  },
};

/* ---------- model: karst and caves ---------- */
const M_KARST = {
  id: 'karst', title: 'Karst and caves', group: 'Surface processes',
  blurb: 'Fade a limestone plateau to find sinkholes, a cave system, stalactites, a disappearing stream and a spring.',
  variants: [], slider: { label: 'Fade the limestone', def: 50 },
  cam: [9, 6, 11], target: [0, -1.4, 0], fit: 7.4,
  parts: {
    limestone: { name: 'Limestone', desc: 'Rock made of calcite, which slowly dissolves in rainwater made weakly acidic by carbon dioxide.' },
    sinkhole: { name: 'Sinkhole', desc: 'A hollow where the surface has dissolved or collapsed into a cave below.' },
    cave: { name: 'Cave passage', desc: 'Groundwater flowing along joints and bedding planes dissolved this tunnel over thousands of years.' },
    stalactite: { name: 'Stalactite', desc: 'Hangs from the ceiling. Drips lose carbon dioxide and leave a ring of calcite behind each time.' },
    stalagmite: { name: 'Stalagmite', desc: 'Grows up from the floor where drips land.' },
    column: { name: 'Column', desc: 'A stalactite and stalagmite that have grown together.' },
    stream: { name: 'Disappearing stream', desc: 'A surface stream that sinks into a sinkhole and continues underground.' },
    spring: { name: 'Karst spring', desc: 'Where underground water flows back out to the surface.' },
    watertable: { name: 'Water table', desc: 'Below this level the caves are filled with water.' },
  },
  quiz: { all: [
    { type: 'mc', q: 'How did these caves form?', opts: ['Lava tunnels cooled', 'Slightly acidic groundwater dissolved the limestone', 'Earthquakes cracked the rock open'], a: 1, hint: 'What does rain pick up from the air and soil?', why: 'Rain absorbs carbon dioxide and becomes weak carbonic acid. It dissolves calcite along cracks, widening them into passages.' },
    { type: 'tap', prompt: 'Tap a stalactite.', parts: ['stalactite'], hint: 'Fade the limestone. It hangs from the ceiling of the big chamber.', why: 'A memory trick: stalaCtites hold on tight to the Ceiling; stalaGmites grow up from the Ground.' },
    { type: 'tap', prompt: 'Tap a sinkhole on the surface.', parts: ['sinkhole'], hint: 'A round hollow in the plateau.', why: 'Sinkholes can open suddenly when a cave roof collapses, a real hazard in places like Florida.' },
    { type: 'tap', prompt: 'Tap the stream that vanishes underground.', parts: ['stream'], hint: 'Follow the blue line on the surface.', why: 'In karst, most drainage is underground, so surface rivers are rare and can disappear into sinkholes.' },
  ] },
  local: 'Nigeria has little true karst landscape, so these features are best known from textbooks: southern China, Slovenia and Florida. Limestone quarry faces can show small dissolution pockets.',
  build(ctx){
    const S = ctx.scene, o = { x0: -7, x1: 7, z0: -3.5, z1: 3.5, nx: 70, nz: 35 };
    const SK = [[-3, -1], [1.5, 1.2], [4, -1.5]];
    const top = (x, z) => 0.8 - SK.reduce((s, [a, b]) => s + 0.95 * Math.exp(-((x - a) ** 2 + (z - b) ** 2) / 0.45), 0);
    const limeMat = SM('#cdd0c2', { op: 0.5 });
    const L = hSlab(limeMat, o); L.update(top, () => -4); L.meshes.forEach(m => ctx.part(m, 'limestone')); S.add(L.group);
    const caveMat = SM('#3a332c');
    S.add(ctx.part(new THREE.Mesh(tube([[-6.8, -1.6, 0], [-3, -1.8, -1], [0, -2.25, 0.4], [3, -2.1, -0.5], [6.8, -2.6, 0]], 0.42), caveMat), 'cave'));
    S.add(ctx.part(new THREE.Mesh(tube([[-3, -0.2, -1], [-3, -1.0, -1], [-3, -1.75, -1]], 0.3), caveMat), 'cave'));
    const ch = ctx.part(new THREE.Mesh(new THREE.SphereGeometry(1, 32, 20), caveMat), 'cave'); ch.scale.set(1.9, 0.9, 1.3); ch.position.set(0, -2.3, 0.4); S.add(ch);
    const drip = SM('#efe5cf');
    [[-1.1, 0.1], [-0.6, 0.8], [0, 0.3], [0.5, 1.0], [1.0, 0.0], [-0.2, -0.3], [1.3, 0.6]].forEach(([x, z]) => { const c = ctx.part(new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.5, 8), drip), 'stalactite'); c.rotation.x = Math.PI; c.position.set(x, -1.68, z + 0.4); S.add(c); });
    [[-0.9, 0.3], [-0.3, 0.9], [0.3, 0.1], [0.8, 0.9], [1.2, 0.3]].forEach(([x, z]) => { const c = ctx.part(new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.45, 8), drip), 'stalagmite'); c.position.set(x, -2.85, z + 0.4); S.add(c); });
    const col = ctx.part(new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 1.5, 10), drip), 'column'); col.position.set(-1.4, -2.3, 0.7); S.add(col);
    const water = SM('#2f7fb5', { rough: 0.3 });
    const sp = []; for (let i = 0; i <= 16; i++) { const u = i / 16, x = lerp(-6.8, -3, u), z = lerp(2.6, -1, u) + 0.6 * Math.sin(u * 3); sp.push([x, top(x, z) + 0.05, z]); }
    S.add(ctx.part(new THREE.Mesh(tube(sp, 0.09), water), 'stream'));
    const spr = ctx.part(new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 12), water), 'spring'); spr.position.set(7.05, -2.6, 0); S.add(spr);
    const fall = ctx.part(new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.4, 0.3), water), 'spring'); fall.position.set(7.1, -3.3, 0); S.add(fall);
    const wt = ctx.part(new THREE.Mesh(new THREE.PlaneGeometry(14, 7), SM('#2f7fb5', { op: 0.3 })), 'watertable'); wt.rotation.x = -Math.PI / 2; wt.position.y = -3.2; S.add(wt);
    return {
      setParam(v){ const op = clamp(1 - v / 100, 0.1, 1); limeMat.opacity = op; limeMat.depthWrite = op > 0.95; },
      regions: ['limestone', 'sinkhole'],
      resolve(h, id){ if (id !== 'limestone') return id; return h.point.y < 0.45 && h.point.y > -0.3 && SK.some(([a, b]) => Math.hypot(h.point.x - a, h.point.z - b) < 1.1) ? 'sinkhole' : 'limestone'; },
    };
  },
};

/* ---------- model: gully erosion ---------- */
const GULLY = [
  { pts: [[0, 6], [0.4, 3], [-0.3, 0.5], [0.5, -2], [0, -4.6]], delay: 0, k: 1 },
  { pts: [[0.4, 3], [2.5, 1.5], [4.1, -0.6]], delay: 0.2, k: 0.75 },
  { pts: [[-0.3, 0.5], [-2.5, -1], [-4.1, -3]], delay: 0.3, k: 0.8 },
  { pts: [[0.5, -2], [2.4, -3.6]], delay: 0.5, k: 0.65 },
  { pts: [[0.2, 4.5], [-2.2, 3.6], [-4.3, 2.1]], delay: 0.35, k: 0.7 },
];
GULLY.forEach(b => { b.seg = []; let L = 0; for (let i = 0; i < b.pts.length - 1; i++) { const [a, c] = [b.pts[i], b.pts[i + 1]], l = Math.hypot(c[0] - a[0], c[1] - a[1]); b.seg.push({ a, c, l, L0: L }); L += l; } b.L = L; });
const M_GULLY = {
  id: 'gully', title: 'Gully erosion', group: 'Surface processes',
  blurb: 'Let runoff loose on soft sand and watch gullies cut back toward houses and roads, as at Agulu–Nanka.',
  variants: [], slider: { label: 'Uncontrolled runoff over time', def: 55, text: v => v < 8 ? 'Before gullying' : v < 30 ? 'Rills and small gullies' : v < 65 ? 'Gullies growing headward' : 'Advanced gully complex' },
  cam: [9, 8, 11], target: [0, 1, 0], fit: 7.8,
  parts: {
    plateau: { name: 'Plateau surface', desc: 'Red lateritic soil over loose sand. Once the vegetation is cleared, runoff starts to concentrate.' },
    wall: { name: 'Gully wall', desc: 'Steep sides of loose, poorly cemented sand that collapse easily when wet.' },
    floor: { name: 'Gully floor', desc: 'Runoff carries collapsed sand away along the floor during storms.' },
    head: { name: 'Gully head', desc: 'The upslope end. Water pours over it and undercuts it, so the gully grows backward, toward the land above.' },
    houses: { name: 'Houses', desc: 'Buildings near a gully head are at risk as it cuts back.' },
    road: { name: 'Road', desc: 'Roads concentrate runoff into drains and can start new gullies when the water is not led safely away.' },
    vegetation: { name: 'Vegetation', desc: 'Roots bind the soil and leaves break the force of raindrops.' },
  },
  quiz: { all: [
    { type: 'tap', prompt: 'Tap a gully head, the end that is growing.', parts: ['head'], hint: 'Follow a gully to its upslope tip.', why: 'Gullies grow headward: runoff pours over the head, undercuts it and the wall collapses, so the gully eats back into the plateau.' },
    { type: 'mc', q: 'Move the slider. Which way do the gullies grow?', opts: ['Downslope, toward the river', 'Upslope, back toward the plateau and the houses', 'They do not grow'], a: 1, hint: 'Watch where the houses disappear.', why: 'Headward erosion is why gullies threaten towns on the plateau above, not just the valleys below.' },
    { type: 'mc', q: 'Which of these would slow a gully the most?', opts: ['Clearing more bush', 'Planting vegetation and leading road runoff safely into lined drains', 'Building houses closer to the edge'], a: 1, hint: 'What starts the gully in the first place?', why: 'Gully control combines vegetation, check dams and drainage that stops water pouring over the gully head.' },
  ] },
  local: 'The Agulu–Nanka–Oko gullies in Anambra State are among the largest in Africa. They cut into the loose Nanka Sands and have destroyed homes, farmland and roads.',
  build(ctx){
    const S = ctx.scene, o = { x0: -8, x1: 8, z0: -6, z1: 6, nx: 96, nz: 72 };
    let g = 0.55, tips = [];
    const plat = (x, z) => 2.4 - 0.06 * z + 0.05 * Math.sin(0.6 * x);
    const active = b => clamp((g - b.delay) / (1 - b.delay) * 1.15, 0, 1);
    function depth(x, z){
      let d = 0;
      GULLY.forEach(b => { const f = active(b); if (f <= 0) return; const len = f * b.L, w = (0.45 + 0.75 * g) * b.k, D = 2.3 * Math.pow(g, 0.7) * b.k;
        let best = 1e9; b.seg.forEach(s => { if (s.L0 >= len) return; const lim = Math.min(1, (len - s.L0) / s.l), cx = lerp(s.a[0], s.c[0], lim), cz = lerp(s.a[1], s.c[1], lim);
          const vx = cx - s.a[0], vz = cz - s.a[1], L2 = vx * vx + vz * vz || 1e-6, t = clamp(((x - s.a[0]) * vx + (z - s.a[1]) * vz) / L2, 0, 1);
          best = Math.min(best, Math.hypot(x - (s.a[0] + vx * t), z - (s.a[1] + vz * t))); });
        d = Math.max(d, D * (1 - smooth(w * 0.55, w, best))); });
      return d;
    }
    const terr = (x, z) => plat(x, z) - depth(x, z);
    const t = hSlab(SM('#ffffff', { vc: true, flat: true }), o, SM('#c9864e')); addVC([t.top]); t.meshes.forEach(m => ctx.part(m, 'wall')); S.add(t.group);
    const houses = [[0.2, -5.3], [-4.7, -4.1], [4.6, -1.4], [-1.9, -5.4], [-4.9, 1.6]].map(([x, z]) => { const h = new THREE.Group(); const b = ctx.part(new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.35, 0.45), SM('#e8e2d4')), 'houses'); b.position.y = 0.18;
      const rf = ctx.part(new THREE.Mesh(new THREE.ConeGeometry(0.42, 0.3, 4), SM('#8a8f93', { flat: true })), 'houses'); rf.position.y = 0.5; rf.rotation.y = Math.PI / 4; h.add(b, rf); h.position.set(x, plat(x, z), z); S.add(h); return h; });
    const roadMat = SM('#3b3d40');
    const road = Array.from({ length: 20 }, (_, i) => { const x = -7.6 + i * 0.8; const m = ctx.part(new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.04, 0.5), roadMat), 'road'); m.position.set(x, plat(x, -4.7) + 0.02, -4.7); S.add(m); return m; });
    const r = rng(21), vegMat = SM('#3f7a3a', { flat: true });
    const veg = Array.from({ length: 46 }, () => { const x = r() * 15 - 7.5, z = r() * 11 - 5.5; const c = ctx.part(new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.55, 7), vegMat), 'vegetation'); c.position.set(x, plat(x, z) + 0.27, z); S.add(c); return c; });
    function build(){
      t.update(terr, () => -1);
      paintVC([t.top], (c, x, y, z, m, nx, ny) => { const d = plat(x, z) - y; if (d < 0.12) c.set('#9a3d1c'); else if (ny > 0.8 && d > 0.6) c.set('#c9b48a'); else c.set('#d9a066').lerp(new THREE.Color('#efe0c0'), clamp(d / 2.2, 0, 1)); });
      const cut = (x, z) => depth(x, z) > 0.25;
      houses.forEach(h => { h.visible = !cut(h.position.x, h.position.z); });
      road.forEach(m => { m.visible = !cut(m.position.x, m.position.z); });
      veg.forEach(c => { c.visible = !cut(c.position.x, c.position.z) && g < 0.92; });
      tips = GULLY.map(b => { const f = active(b); if (f < 0.03) return null; const len = f * b.L; const s = b.seg.find(s => s.L0 + s.l >= len) || b.seg[b.seg.length - 1]; const u = clamp((len - s.L0) / s.l, 0, 1); return [lerp(s.a[0], s.c[0], u), lerp(s.a[1], s.c[1], u)]; }).filter(Boolean);
    }
    build();
    return {
      setParam(v){ g = v / 100; build(); },
      regions: ['wall', 'plateau', 'floor', 'head'],
      resolve(h, id){ if (id !== 'wall') return id; const p = h.point;
        if (tips.some(([x, z]) => Math.hypot(p.x - x, p.z - z) < 1.1)) return 'head';
        const d = plat(p.x, p.z) - p.y; if (d < 0.12) return 'plateau'; return h.face && h.face.normal.y > 0.8 && d > 0.6 ? 'floor' : 'wall'; },
    };
  },
};

/* ---------- model: oil and gas traps ---------- */
const TRAP_T = [1.6, 0.7, 0.0, -0.8, -2.0, -3.2];
const TRAPS = {
  anticline: { split: 0, Y: (i, x, z) => TRAP_T[i] + 1.2 * Math.exp(-(x * x / 8 + z * z / 5)), trap: () => true },
  fault: { split: 1, Y: (i, x, z, side) => TRAP_T[i] + 0.22 * x - (side ? 1.3 : 0), trap: side => side === 0 },
  pinchout: { split: 0, Y: (i, x) => { const th = 0.8 * clamp((3 - x) / 6, 0, 1), y3 = -0.8 + 0.25 * x; return [y3 + th + 0.7 + 0.9, y3 + th + 0.7, y3 + th, y3, -2.0 + 0.25 * x, -3.2 + 0.25 * x][i]; }, trap: (side, x) => x < 3 },
  rollover: { split: -0.5, Y: (i, x, z, side) => side ? TRAP_T[i] - 0.7 + 1.0 * Math.exp(-((x - 2) ** 2) / 3.5 - z * z / 7) : TRAP_T[i] + 0.5, trap: side => side === 1 },
};
const M_TRAPS = {
  id: 'traps', title: 'Oil and gas traps', group: 'Earth resources',
  blurb: 'See how oil and gas rise from a source rock and get caught in four kinds of trap, including Niger Delta rollovers.',
  variants: [{ id: 'anticline', label: 'Anticline' }, { id: 'fault', label: 'Fault trap' }, { id: 'pinchout', label: 'Pinch-out' }, { id: 'rollover', label: 'Rollover (Niger Delta)' }],
  cam: [9, 6, 11], target: [0, -0.6, 0], fit: 7.4,
  parts: {
    overburden: { name: 'Overburden', desc: 'Younger sediment piled on top, burying and heating the rocks below.' },
    seal: { name: 'Seal (cap rock)', desc: 'Shale with tiny pores that oil and gas cannot pass through, so they are trapped beneath it.' },
    gas: { name: 'Gas cap', desc: 'Gas is the lightest fluid, so it rises to the very top of the trap.' },
    oil: { name: 'Oil leg', desc: 'Oil floats on water and sits beneath the gas.' },
    water: { name: 'Water-filled reservoir', desc: 'Porous sandstone whose pores hold salty water below the oil.' },
    source: { name: 'Source rock', desc: 'Organic-rich black shale. Buried deep and heated, its organic matter turns into oil and gas.' },
    deep: { name: 'Deeper rocks', desc: 'Older sediment below the source rock.' },
    fault: { name: 'Fault', desc: 'The fault offsets the reservoir against shale, sealing the trap on one side.' },
  },
  quiz: {
    anticline: [
      { type: 'tap', prompt: 'Tap the gas cap.', parts: ['gas'], hint: 'The highest part of the reservoir.', why: 'Gas, oil and water separate by density: gas on top, oil in the middle, water below. The boundaries between them are flat.' },
      { type: 'tap', prompt: 'Tap the seal that stops oil escaping upward.', parts: ['seal'], hint: 'The dark layer directly on top of the reservoir.', why: 'Without an impermeable seal, oil keeps rising until it leaks out at the surface as a seep.' },
      { type: 'mc', q: 'Why does oil move up from the source rock into the reservoir?', opts: ['It is lighter than the water filling the pores', 'Pumps push it up', 'Earthquakes squeeze it'], a: 0, hint: 'Think about oil floating on water.', why: 'Buoyant oil and gas migrate upward through porous rock until something stops them. That something is the trap.' },
    ],
    fault: [{ type: 'mc', q: 'What stops the oil escaping up-dip in this trap?', opts: ['The fault moved shale against the reservoir sandstone', 'The oil is solid', 'Nothing stops it'], a: 0, hint: 'Look at what lies across the fault from the oil.', why: 'Faults can juxtapose a reservoir against impermeable shale, and clay smeared along the fault plane can also seal it.' }],
    pinchout: [{ type: 'mc', q: 'There is no fold or fault here. What traps the oil?', opts: ['The sandstone thins out and is surrounded by shale', 'Salt', 'Ice'], a: 0, hint: 'Follow the reservoir bed up-dip.', why: 'This is a stratigraphic trap: the reservoir itself pinches out, for example where an old river channel or beach sand is buried in mud.' }],
    rollover: [
      { type: 'tap', prompt: 'Tap the growth fault.', parts: ['fault'], hint: 'The translucent plane cutting the layers.', why: 'Niger Delta growth faults move while sediment is being deposited. The beds on the down-thrown side bend into a rollover anticline.' },
      { type: 'tap', prompt: 'Tap the oil in the rollover.', parts: ['oil'], hint: 'Green, below the red gas cap.', why: 'Rollover anticlines against growth faults are the main oil traps of the Niger Delta.' },
    ],
  },
  localV: {
    anticline: 'Anticline traps are the classic oil trap worldwide. In Nigeria most fields are rollover anticlines next to growth faults.',
    fault: 'Fault seals are critical in the Niger Delta, where thousands of growth faults cut the Agbada Formation sandstones.',
    pinchout: 'Stratigraphic traps are increasingly targeted in the deep-water Niger Delta, where turbidite sands pinch out in shale.',
    rollover: 'In the Niger Delta, oil generated in the Akata Shale migrates into Agbada sandstones and collects in rollover anticlines beside growth faults.',
  },
  build(ctx){
    const S = ctx.scene, cols = ['#d7b57d', '#4a4f53', null, '#232527', '#8d8f86'], ids = ['overburden', 'seal', 'water', 'source', 'deep'];
    let V = 'anticline', goc = 0, owc = 0;
    const resMat = SM('#ffffff', { vc: true });
    const layers = cols.map((c, i) => [0, 1].map(side => { const o = { x0: -7, x1: 0, z0: -3, z1: 3, nx: 36, nz: 24 }; const s = hSlab(i === 2 ? resMat : SM(c), o); s.o = o; s.side = side;
      if (i === 2) addVC(s.meshes); s.meshes.forEach(m => { ctx.part(m, ids[i]); m.userData.side = side; }); S.add(s.group); return s; }));
    const fMat = SM('#b03c12', { op: 0.35 });
    const fp = ctx.part(new THREE.Mesh(new THREE.PlaneGeometry(6.4, 6.6), fMat), 'fault'); fp.rotation.y = Math.PI / 2; fp.position.y = -0.4; S.add(fp);
    const arrows = [0, 1, 2].map(() => { const a = makeArrow(0.9, 0.05, 0x3f8f3a); a.rotation.z = Math.PI / 2; S.add(a); return a; });
    const AX = { anticline: [-2.4, 2.4, 0], fault: [-3, -1.5, 0], pinchout: [-1, 1, 2], rollover: [1, 3, 2.6] };
    function build(){
      const T = TRAPS[V];
      layers.forEach((pair, i) => pair.forEach(s => { s.o.x0 = s.side ? T.split : -7; s.o.x1 = s.side ? 7 : T.split; s.update((x, z) => T.Y(i, x, z, s.side), (x, z) => T.Y(i + 1, x, z, s.side)); }));
      let crest = -99; layers[2].forEach(s => { if (!T.trap(s.side, 0)) return; const p = s.top.geometry.attributes.position; for (let i = 0; i < p.count; i++) if (T.trap(s.side, p.getX(i))) crest = Math.max(crest, p.getY(i)); });
      goc = crest - 0.3; owc = crest - 0.8;
      layers[2].forEach(s => paintVC(s.meshes, (c, x, y) => { const tr = T.trap(s.side, x); c.set(tr && y > goc ? '#d9483b' : tr && y > owc ? '#3f8f3a' : '#a9c1cc'); }));
      fp.visible = V === 'fault' || V === 'rollover'; fp.position.x = T.split;
      AX[V].forEach((x, k) => { const side = x >= T.split ? 1 : 0; arrows[k].position.set(x, T.Y(3, x, 0, side) - 0.95, 3.05); });
    }
    build();
    return {
      setVariant(v){ V = v; build(); },
      regions: ['water', 'gas', 'oil'],
      resolve(h, id){ if (id !== 'water') return id; const side = h.object.userData.side, T = TRAPS[V]; if (!T.trap(side, h.point.x)) return 'water'; return h.point.y > goc ? 'gas' : h.point.y > owc ? 'oil' : 'water'; },
    };
  },
};

/* ---------- model: metamorphic grade ---------- */
const META_NAMES = g => g < 0.15 ? 'Shale (not yet metamorphosed)' : g < 0.35 ? 'Slate' : g < 0.5 ? 'Phyllite' : g < 0.75 ? 'Schist' : 'Gneiss';
const M_META = {
  id: 'meta', title: 'Metamorphic grade', group: 'Earth materials',
  blurb: 'Squeeze and heat a shale. Watch mica flakes line up and grow, garnets appear and bands form as it becomes gneiss.',
  variants: [], slider: { label: 'Heat and pressure (metamorphic grade)', def: 10, text: v => META_NAMES(v / 100) },
  cam: [5.5, 3.8, 6.5], target: [0, 0, 0], fit: 3.5, tagScale: 0.6,
  parts: {
    matrix: { name: 'Rock', desc: 'The whole rock stays solid throughout. Minerals recrystallise without melting.' },
    mica: { name: 'Mica flakes', desc: 'Platy minerals that grow and rotate until they lie perpendicular to the squeeze, creating foliation.' },
    quartz: { name: 'Quartz and feldspar grains', desc: 'Light minerals that, at high grade, separate from the dark ones into bands.' },
    garnet: { name: 'Garnet', desc: 'An index mineral. Its first appearance marks medium-grade conditions.' },
    stress: { name: 'Directed pressure', desc: 'Squeezing from opposite directions, typically during mountain building.' },
  },
  quiz: { all: [
    { type: 'mc', q: 'Start at the left of the slider and move right slowly. Which rock forms first from shale?', opts: ['Gneiss', 'Slate', 'Schist'], a: 1, hint: 'Watch the rock name under the slider.', why: 'Low-grade metamorphism of shale gives slate, then phyllite, schist and finally gneiss as heat and pressure rise.' },
    { type: 'mc', q: 'Under directed pressure (squeezing), how do mica flakes line up at high metamorphic grade?', opts: ['Parallel to the squeeze', 'Perpendicular to the squeeze', 'Randomly'], a: 1, hint: 'Imagine pressing flat coins or flakes between your palms. Which way do their flat faces turn?', why: 'Platy minerals grow and rotate until they lie at right angles to the greatest pressure. That alignment is foliation.' },
    { type: 'tap', prompt: 'Raise the grade until red crystals appear, then tap a garnet.', parts: ['garnet'], hint: 'They appear around the schist stage.', why: 'Index minerals like garnet let geologists map zones of metamorphic grade across a region.' },
  ] },
  local: 'The schist belts of the Nigerian Basement Complex, such as the Ilesha schist belt with its gold deposits, and the surrounding gneisses record Pan-African metamorphism.',
  build(ctx){
    const S = ctx.scene, r = rng(31);
    const matM = SM('#4a4f53', { op: 0.25 });
    S.add(ctx.part(new THREE.Mesh(new THREE.BoxGeometry(4, 2.6, 3), matM), 'matrix'));
    const NF = 240, NQ = 260, NG = 14;
    const flakes = new THREE.InstancedMesh(new THREE.CylinderGeometry(1, 1, 0.05, 7), SM('#2a2622', { rough: 0.4, metal: 0.1 }), NF);
    const grains = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 0), SM('#e9e4da', { flat: true }), NQ);
    const gar = new THREE.InstancedMesh(new THREE.DodecahedronGeometry(1, 0), SM('#a3243b', { flat: true, rough: 0.3 }), NG);
    [flakes, grains, gar].forEach(m => { m.frustumCulled = false; S.add(m); });
    ctx.part(flakes, 'mica'); ctx.part(grains, 'quartz'); ctx.part(gar, 'garnet');
    const rp = () => new THREE.Vector3(r() * 3.6 - 1.8, r() * 2.2 - 1.1, r() * 2.6 - 1.3);
    const rq = () => new THREE.Quaternion().setFromEuler(new THREE.Euler(r() * 6.28, r() * 6.28, r() * 6.28));
    const F = Array.from({ length: NF }, () => ({ p: rp(), q: rq(), f: new THREE.Quaternion().setFromEuler(new THREE.Euler(0, r() * 6.28, 0)) }));
    const Q = Array.from({ length: NQ }, () => ({ p: rp() }));
    const G = Array.from({ length: NG }, () => ({ p: rp() }));
    [1, -1].forEach(sg => { const a = makeArrow(1.0, 0.07, 0xb03c12); a.rotation.z = sg > 0 ? -Math.PI / 2 : Math.PI / 2; a.position.y = sg * 2.5; a.traverse(o => { if (o.isMesh) ctx.part(o, 'stress'); }); S.add(a); });
    const mtx = new THREE.Matrix4(), qq = new THREE.Quaternion(), sc = new THREE.Vector3(), pv = new THREE.Vector3();
    const band = (y, centres) => centres.reduce((b, c) => Math.abs(y - c) < Math.abs(y - b) ? c : b, centres[0]);
    function place(g){
      const a = smooth(0.08, 0.55, g), s = 0.05 + 0.2 * smooth(0.1, 0.8, g), b = smooth(0.72, 0.95, g);
      matM.color.set('#4a4f53').lerp(new THREE.Color('#8d8576'), g).convertSRGBToLinear();
      F.forEach((o, i) => { qq.copy(o.q).slerp(o.f, a); const c = band(o.p.y, [-0.85, 0, 0.85]); pv.set(o.p.x, lerp(o.p.y, c + (o.p.y - c) * 0.2, b), o.p.z); mtx.compose(pv, qq, sc.set(s, 1, s)); flakes.setMatrixAt(i, mtx); });
      Q.forEach((o, i) => { const c = band(o.p.y, [-0.42, 0.42]); pv.set(o.p.x, lerp(o.p.y, c + (o.p.y - c) * 0.25, b), o.p.z); const k = 0.035 + 0.05 * g; mtx.compose(pv, qq.identity(), sc.set(k, k * (1 - 0.4 * a), k)); grains.setMatrixAt(i, mtx); });
      const gs = 0.13 * smooth(0.45, 0.65, g); G.forEach((o, i) => { mtx.compose(o.p, qq.identity(), sc.set(gs || 1e-4, gs || 1e-4, gs || 1e-4)); gar.setMatrixAt(i, mtx); });
      [flakes, grains, gar].forEach(m => { m.instanceMatrix.needsUpdate = true; });
      gar.visible = gs > 0.005;
    }
    place(0.1);
    return { setParam(v){ place(v / 100); } };
  },
};

/* ---------- model: fossils and geologic time ---------- */
const FOSSIL_BEDS = [
  ['Quaternary', '2.6–0 million years', '#c9a46f'], ['Paleogene', '66–23 million years', '#cdd0c2'], ['Cretaceous', '145–66 million years', '#8d8f86'],
  ['Jurassic', '201–145 million years', '#d7b57d'], ['Devonian', '419–359 million years', '#6e7275'], ['Cambrian', '539–485 million years', '#b8945e'],
];
const M_FOSSILS = {
  id: 'fossils', title: 'Fossils and geologic time', group: 'Structures and time',
  blurb: 'Dig down through a column of rock, from recent leaves to Cambrian trilobites, and read time from the layers.',
  variants: [], slider: { label: 'Dig down through time', def: 0, text: v => 'Uncovered: ' + FOSSIL_BEDS[Math.min(5, Math.floor(v / 100 * 6))][0] },
  cam: [7, 4, 10], target: [0.8, 0, 0], fit: 4.6, tagScale: 0.62,
  parts: {
    ...Object.fromEntries(FOSSIL_BEDS.map((b, i) => ['L' + i, { name: b[0] + ' rocks', desc: 'Deposited ' + b[1] + ' ago. ' + (i === 0 ? 'The youngest layer, on top.' : i === 5 ? 'The oldest layer, at the bottom.' : 'Older than the layers above, younger than those below.') }])),
    leaf: { name: 'Fossil leaf', desc: 'Plant remains in young river and lake sediment.' },
    mammal: { name: 'Mammal bone', desc: 'Mammals spread widely after the dinosaurs died out 66 million years ago.' },
    ammonite: { name: 'Ammonite', desc: 'A coiled, squid-like sea animal. Ammonites evolved fast and lived worldwide, which makes them excellent index fossils.' },
    dino: { name: 'Dinosaur bone', desc: 'Dinosaurs dominated the land through the Jurassic and Cretaceous.' },
    fish: { name: 'Armoured fish', desc: 'The Devonian is called the Age of Fishes.' },
    trilobite: { name: 'Trilobite', desc: 'A sea-floor arthropod. Trilobites appeared in the Cambrian and died out 252 million years ago.' },
  },
  quiz: { all: [
    { type: 'tap', prompt: 'Tap the oldest fossil in this column.', parts: ['trilobite'], hint: 'Law of superposition: what is at the bottom?', why: 'In undisturbed layers the oldest rocks are at the bottom. Trilobites are among the oldest common fossils with hard parts.' },
    { type: 'mc', q: 'Ammonites make excellent index fossils. Why?', opts: ['They are very large', 'Each species lived for a short time but spread worldwide, so it dates rocks precisely', 'They are always found with dinosaurs'], a: 1, hint: 'What makes a fossil useful for matching rocks of the same age in different places?', why: 'An index fossil is widespread, easy to recognise and short-lived, so finding it pins a rock to a narrow slice of time.' },
    { type: 'tap', prompt: 'Tap the ammonite.', parts: ['ammonite'], hint: 'A coiled shell, in the Cretaceous layer.', why: 'Cretaceous ammonites are used to date the marine rocks of the Benue Trough.' },
    { type: 'mc', q: 'The ages on the right jump from 359 to 201 million years between two layers. What does that gap mean?', opts: ['Those layers formed very fast', 'Rock from that time is missing here: an unconformity', 'The labels are wrong'], a: 1, hint: 'Compare this with the Unconformities model.', why: 'No single place preserves all of geologic time. Geologists build the complete timescale by matching fossils between many sites.' },
  ] },
  local: 'Cretaceous ammonites are found in the Benue Trough, for example around Ashaka in Gombe State, and the Paleocene Ewekoro limestone is full of shells. Nigeria has no Cambrian trilobites, because its rocks of that age are igneous and metamorphic basement.',
  build(ctx){
    const S = ctx.scene, mats = [];
    FOSSIL_BEDS.forEach((b, i) => { const m = SM(b[2], { op: 1 }); mats.push(m); const bx = ctx.part(new THREE.Mesh(new THREE.BoxGeometry(6, 1, 4), m), 'L' + i); bx.position.y = 2.5 - i; S.add(bx);
      const tg = makeTag(0.62); tg.userData.set(b[0] + ' · ' + b[1]); tg.visible = true; tg.position.set(4.6, 2.5 - i, 0); S.add(tg); });
    const add = (mesh, id, x, i) => { ctx.part(mesh, id); mesh.position.x = x; mesh.position.y += 2.5 - i; mesh.position.z += 1.97; S.add(mesh); return mesh; };
    { const s = new THREE.Shape(); s.absellipse(0, 0, 0.42, 0.18, 0, Math.PI * 2, false, 0); add(new THREE.Mesh(new THREE.ShapeGeometry(s, 20), SM('#5e6b2e')), 'leaf', -1.2, 0).rotation.z = 0.4; }
    { const g = new THREE.Group(); const m = SM('#efe5cf'); const c = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.8, 10), m); c.rotation.z = Math.PI / 2; g.add(c);
      [-0.42, 0.42].forEach(x => { const e = new THREE.Mesh(new THREE.SphereGeometry(0.11, 12, 8), m); e.position.x = x; g.add(e); }); g.children.forEach(ch => ctx.part(ch, 'mammal')); g.position.set(0.9, 1.5, 1.97); S.add(g); }
    { const pts = []; for (let i = 0; i <= 80; i++) { const th = i / 80 * Math.PI * 4, rr = 0.05 * Math.exp(0.18 * th); pts.push([rr * Math.cos(th), rr * Math.sin(th), 0]); } add(new THREE.Mesh(tube(pts, 0.04), SM('#c9a46f', { rough: 0.5 })), 'ammonite', -0.8, 2); }
    { const g = new THREE.Group(); const m = SM('#7d5f3e'); const c = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.09, 1.4, 12), m); c.rotation.z = Math.PI / 2 - 0.15; g.add(c);
      [-0.72, 0.72].forEach(x => { const e = new THREE.Mesh(new THREE.SphereGeometry(0.2, 14, 10), m); e.position.set(x, -x * 0.15, 0); g.add(e); }); g.children.forEach(ch => ctx.part(ch, 'dino')); g.position.set(1.0, -0.5, 1.97); S.add(g); }
    { const g = new THREE.Group(); const m = SM('#3a3d40'); const body = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 10), m); body.scale.set(0.5, 0.18, 0.08); g.add(body);
      const tail = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.3, 4), m); tail.rotation.z = Math.PI / 2; tail.position.x = -0.6; g.add(tail); g.children.forEach(ch => ctx.part(ch, 'fish')); g.position.set(-0.6, -1.5, 1.97); S.add(g); }
    { const g = new THREE.Group(); const m = SM('#4b3b2c'); const body = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 10), m); body.scale.set(0.26, 0.38, 0.07); g.add(body);
      for (let k = -3; k <= 3; k++) { const seg = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.025, 0.04), SM('#2a2018')); seg.position.set(0, k * 0.09, 0.05); g.add(seg); }
      g.children.forEach(ch => ctx.part(ch, 'trilobite')); g.position.set(0.6, -2.5, 1.97); S.add(g); }
    return { setParam(v){ const d = v / 100 * 6; mats.forEach((m, i) => { const op = 1 - clamp(d - i, 0, 1) * 0.85; m.opacity = op; m.depthWrite = op > 0.95; }); } };
  },
};

