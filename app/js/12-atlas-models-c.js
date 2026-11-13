/* Craton · 12-atlas-models-c.js
 * 3D Atlas part C: hot spots, landslides, mountain building, ocean floor and reefs, tin and gold, climate and sea level.
 * Loaded as a classic script; top-level consts are shared across files in load order (see app/index.html).
 */
'use strict';
/* ---------- shared: clip a 2D polygon to a rectangle ---------- */
function clipPolyRect(poly, x0, x1, y0, y1){
  [[0, x0, 1], [0, x1, -1], [1, y0, 1], [1, y1, -1]].forEach(([ax, v, sg]) => {
    const out = [];
    for (let i = 0; i < poly.length; i++) { const a = poly[i], b = poly[(i + 1) % poly.length], ia = (a[ax] - v) * sg >= 0, ib = (b[ax] - v) * sg >= 0;
      if (ia) out.push(a); if (ia !== ib) { const t = (v - a[ax]) / (b[ax] - a[ax]); out.push([a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1])]); } }
    poly = out;
  });
  return poly;
}
function fixedTag(scene, text, pos, scale){ const t = makeTag(scale || 0.6); t.userData.set(text); t.visible = true; t.position.set(...pos); scene.add(t); return t; }

/* ---------- model: hot spots and the Cameroon Line ---------- */
const M_HOTSPOT = {
  id: 'hotspot', title: 'Hot spots and the Cameroon Line', group: 'Magma and volcanoes', animated: true,
  blurb: 'Slide a plate over a mantle plume to build a chain of ageing volcanoes, then compare the puzzling Cameroon Volcanic Line.',
  variants: [{ id: 'chain', label: 'Hot-spot chain' }, { id: 'cameroon', label: 'Cameroon Line' }],
  cam: [6, 7, 12], target: [0, -0.4, 0], fit: 7.6,
  parts: {
    plate: { name: 'Moving plate', desc: 'The lithosphere slides over the plume, carrying each volcano away from its source of magma.' },
    plume: { name: 'Mantle plume', desc: 'A column of unusually hot mantle rising from deep below. It stays in roughly the same place for millions of years.' },
    mantle: { name: 'Mantle', desc: 'Solid but slowly flowing rock below the plate.' },
    active: { name: 'Active volcano', desc: 'Sitting directly above the plume, it is still fed with magma. This is the youngest volcano in the chain.' },
    extinct: { name: 'Extinct volcanic island', desc: 'Carried away from the plume, it lost its magma supply. It is now eroding and slowly sinking as the plate cools.' },
    seamount: { name: 'Seamount', desc: 'An old volcano that has eroded and sunk below sea level.' },
    sea: { name: 'Sea', desc: 'The ocean surface. The oldest volcanoes in the chain have sunk beneath it.' },
    ocean: { name: 'Oceanic crust (Gulf of Guinea)', desc: 'Thin basalt crust under the Atlantic.' },
    continent: { name: 'Continental crust (Cameroon)', desc: 'Thick, ancient crust of the African continent.' },
    cvl: { name: 'Cameroon Line volcano', desc: 'One of a line of volcanoes running about 1,600 km from the Atlantic islands deep into Africa.' },
    mtcam: { name: 'Mount Cameroon', desc: 'The highest and most active volcano on the line, about 4,040 m high. It erupted in 1999 and 2000.' },
    weak: { name: 'Line of weakness', desc: 'One explanation for the line: magma rising along an old zone of weakness in the plate, not from a single fixed plume.' },
  },
  quiz: {
    chain: [
      { type: 'tap', prompt: 'Tap the youngest volcano in the chain.', parts: ['active'], hint: 'Which one is still connected to the plume?', why: 'Only the volcano above the plume is active. Every other one was once in that spot and has been carried away.' },
      { type: 'mc', q: 'The volcanoes get older the further they are from the plume. Why?', opts: ['The plume moves across the plate', 'The plate moves over a plume that stays roughly fixed', 'Older volcanoes erupt more slowly'], a: 1, hint: 'Think about which moves faster over millions of years: the lithospheric plate or the deep mantle plume.', why: 'The chain is a record of plate motion. In Hawaii, ages increase steadily to the north-west, showing the Pacific Plate moving over the plume.' },
      { type: 'tap', prompt: 'Tap an old volcano that has sunk below sea level.', parts: ['seamount'], hint: 'Look under the water at the far end of the chain.', why: 'As a volcano drifts away, it erodes and the plate under it cools and subsides, so old islands become seamounts.' },
    ],
    cameroon: [
      { type: 'tap', prompt: 'Tap Mount Cameroon.', parts: ['mtcam'], hint: 'The largest volcano, just on the continent side.', why: 'Mount Cameroon is one of the most active volcanoes in Africa, close to the coast where ocean and continent meet.' },
      { type: 'mc', q: 'Unlike Hawaii, volcanoes along the Cameroon Line show no steady age pattern. What does that suggest?', opts: ['The plate is not moving', 'A single fixed plume may not explain it; magma may rise along a zone of weakness', 'The volcanoes are not real'], a: 1, hint: 'In a classic hot-spot chain, one moving plate over one fixed plume produces a steady age progression.', why: 'Geologists still debate the cause. A line of weakness in the lithosphere, possibly fed by hot mantle, fits the lack of an age progression better than a single plume.' },
    ],
  },
  localV: {
    chain: 'Hawaii is the textbook hot-spot chain. Iceland sits over both a plume and a mid-ocean ridge.',
    cameroon: 'The Cameroon Line runs along Nigeria\'s eastern border. In 1986, carbon dioxide released from Lake Nyos, a crater lake on the line, killed about 1,700 people in a single night.',
  },
  build(ctx){
    const S = ctx.scene;
    const mantle = ctx.part(new THREE.Mesh(new THREE.BoxGeometry(16, 2.6, 6), SM('#d9692c', { emissive: '#7a2a08', ei: 0.35 })), 'mantle'); mantle.position.y = -2.6; S.add(mantle);
    const magmaMat = SM('#ff5a1f', { emissive: '#ff3a00', ei: 0.8 });
    // chain view
    const C = new THREE.Group(); S.add(C);
    { const pl = ctx.part(new THREE.Mesh(new THREE.BoxGeometry(16, 1, 6), SM('#3e4b53')), 'plate'); pl.position.y = -0.8; C.add(pl); }
    const sea = ctx.part(new THREE.Mesh(new THREE.BoxGeometry(16, 1.0, 6), SM('#2f7fb5', { op: 0.35 })), 'sea'); sea.position.y = 0.2; sea.renderOrder = 4; C.add(sea);
    const plume = ctx.part(new THREE.Mesh(new THREE.CylinderGeometry(0.7, 1.2, 2.6, 24), magmaMat), 'plume'); plume.position.set(-5, -2.6, 0); C.add(plume);
    const head = ctx.part(new THREE.Mesh(new THREE.SphereGeometry(1, 24, 14), magmaMat), 'plume'); head.scale.set(1.7, 0.6, 1.5); head.position.set(-5, -1.35, 0); C.add(head);
    const feed = ctx.part(new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.4, 8), magmaMat), 'active'); feed.position.set(-5, -0.6, 0); C.add(feed);
    const V = [[-5, 2.9, 'now'], [-3, 2.4, '1 My'], [-1, 1.9, '3 My'], [1, 1.4, '5 My'], [3, 0.85, '15 My'], [5, 0.55, '28 My']];
    V.forEach(([x, h, age], i) => { const id = i === 0 ? 'active' : h + -0.3 > 0.7 ? 'extinct' : 'seamount';
      const col = new THREE.Color('#5b5048').lerp(new THREE.Color('#2f3a3f'), i / 5).getStyle();
      const cone = ctx.part(new THREE.Mesh(new THREE.ConeGeometry(0.9 + i * 0.06, h, 18), SM(col, { flat: true })), id); cone.position.set(x, -0.3 + h / 2, 0); C.add(cone);
      fixedTag(C, age, [x, -0.3 + h + 0.5, 0], 0.55); });
    const vent = ctx.part(new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 8), magmaMat), 'active'); vent.position.set(-5, 2.6, 0); C.add(vent);
    const arrows = [0, 1, 2].map(i => { const a = makeArrow(1.1, 0.05, 0xf4f1ea); a.position.set(0, -0.28, 2.6); C.add(a); return a; });
    // Cameroon Line view
    const K = new THREE.Group(); S.add(K);
    const oc = ctx.part(new THREE.Mesh(new THREE.BoxGeometry(8, 1, 6), SM('#3e4b53')), 'ocean'); oc.position.set(-4, -0.8, 0); K.add(oc);
    const ct = ctx.part(new THREE.Mesh(new THREE.BoxGeometry(8, 1.8, 6), SM('#9a8466')), 'continent'); ct.position.set(4, -0.4, 0); K.add(ct);
    const ksea = ctx.part(new THREE.Mesh(new THREE.BoxGeometry(8, 0.9, 6), SM('#2f7fb5', { op: 0.35 })), 'sea'); ksea.position.set(-4, 0.15, 0); ksea.renderOrder = 4; K.add(ksea);
    const line = (u) => [lerp(-7, 7, u), lerp(-2.4, 2.4, u)];
    const weak = ctx.part(new THREE.Mesh(new THREE.BoxGeometry(15.4, 0.06, 0.35), SM('#b03c12', { emissive: '#b03c12', ei: 0.35 })), 'weak');
    weak.position.set(0, 0.52, 0); weak.rotation.y = -Math.atan2(4.8, 14); K.add(weak);
    const CV = [['Annobón', 0.03, 0.9], ['São Tomé', 0.17, 1.6], ['Príncipe', 0.3, 1.1], ['Bioko', 0.43, 2.3], ['Mt Cameroon', 0.56, 3.0], ['Manengouba', 0.72, 1.8], ['Oku (Lake Nyos)', 0.88, 1.6]];
    CV.forEach(([nm, u, h]) => { const [x, z] = line(u), base = x < 0 ? -0.3 : 0.5, id = nm === 'Mt Cameroon' ? 'mtcam' : 'cvl';
      const c = ctx.part(new THREE.Mesh(new THREE.ConeGeometry(0.75, h, 16), SM(id === 'mtcam' ? '#5b4a40' : '#4e4a46', { flat: true })), id); c.position.set(x, base + h / 2, z); K.add(c);
      fixedTag(K, nm, [x, base + h + 0.45, z], 0.55); });
    const kh = ctx.part(new THREE.Mesh(new THREE.BoxGeometry(14, 0.5, 1.2), magmaMat), 'mantle'); kh.position.set(0, -1.5, 0); kh.rotation.y = -Math.atan2(4.8, 14); K.add(kh);
    let v = 'chain';
    return {
      setVariant(id){ v = id; C.visible = id === 'chain'; K.visible = id === 'cameroon'; },
      tick(t){ if (v !== 'chain') return; arrows.forEach((a, i) => { a.position.x = ((t * 0.9 + i * 5.3) % 16) - 8; });
        magmaMat.emissiveIntensity = 0.7 + 0.25 * Math.sin(t * 2.5); },
    };
  },
};

/* ---------- model: landslides ---------- */
const M_SLIDE = {
  id: 'slide', title: 'Landslides and mass wasting', group: 'Surface processes',
  blurb: 'Soak a hillside until it slumps, or watch jointed blocks break off a cliff and pile up as talus.',
  variants: [{ id: 'slump', label: 'Rotational slump' }, { id: 'rockfall', label: 'Rockfall' }],
  slider: { label: 'Rain soaking into the slope', def: 0, text: v => v < 15 ? 'Stable slope' : v < 50 ? 'Cracks opening' : v < 85 ? 'Slope failing' : 'Landslide complete' },
  cam: [7, 6, 12], target: [0, 1, 0], fit: 7.6,
  parts: {
    hill: { name: 'Stable hillside', desc: 'Rock and soil that stays in place, held by friction and cohesion.' },
    scarp: { name: 'Main scarp', desc: 'The steep, freshly exposed face at the top of the slide, where the block pulled away.' },
    slip: { name: 'Slip surface', desc: 'The curved surface the block slid along. Water soaking into the soil weakens it.' },
    block: { name: 'Slump block', desc: 'A coherent mass that rotated backward as it slid, so its top now tilts toward the hill.' },
    toe: { name: 'Toe', desc: 'Material pushed out and bulging at the bottom of the slide.' },
    house: { name: 'House', desc: 'Buildings on or near a slump are tilted, cracked or destroyed.' },
    cliff: { name: 'Cliff face', desc: 'A steep rock face exposed to weathering.' },
    joints: { name: 'Joints', desc: 'Cracks in the rock. Water, roots and heating and cooling slowly widen them until blocks break free.' },
    rock: { name: 'Falling block', desc: 'A block that has broken off along joints and fallen freely.' },
    talus: { name: 'Talus (scree)', desc: 'A pile of broken rock at the foot of the cliff, built up by many rockfalls.' },
    ground: { name: 'Valley floor', desc: 'Flat ground below the slope.' },
  },
  quiz: {
    slump: [
      { type: 'mc', q: 'Push the slider up. Why does heavy rain trigger the slump?', opts: ['Rain makes the soil lighter', 'Water adds weight and its pressure in the pores reduces friction along the slip surface', 'Raindrops push the hill over'], a: 1, hint: 'Think of what water does between soil grains.', why: 'Water fills pore spaces, adding weight and pushing grains apart. Friction drops until gravity wins. Most landslides happen during or just after heavy rain.' },
      { type: 'tap', prompt: 'With the slider past 50%, tap the main scarp.', parts: ['scarp'], hint: 'The bare, steep face at the top, left behind by the block.', why: 'A fresh scarp is a warning sign. Cracks behind it can mean the next block is getting ready to move.' },
      { type: 'mc', q: 'The house on the slump block now tilts back toward the hill. Why?', opts: ['The block rotated as it slid on a curved surface', 'The house was built crooked', 'Wind pushed it'], a: 0, hint: 'Look at the shape of the slip surface.', why: 'Sliding on a curved, spoon-shaped surface rotates the block backward. Back-tilted trees and fences are field clues to old slumps.' },
    ],
    rockfall: [
      { type: 'mc', q: 'What lets blocks break away from the cliff?', opts: ['Cracks (joints) widened by water, roots and weathering', 'Earthquakes only', 'The cliff is made of sand'], a: 0, hint: 'Even hard rock is cut by natural fractures that water, roots and weathering slowly pry open.', why: 'Joints are planes of weakness. Freeze-thaw in cold climates, root wedging and chemical weathering in the tropics slowly pry blocks loose.' },
      { type: 'tap', prompt: 'Tap the talus pile.', parts: ['talus'], hint: 'At the foot of the cliff.', why: 'Talus slopes stand at the angle of repose of loose rock, about 35°. They grow with every rockfall.' },
    ],
  },
  localV: {
    slump: 'Slope failures happen on steep, deeply weathered slopes and road cuts, especially in the rainy season. In 2017 a mudslide in Freetown, Sierra Leone, killed more than 1,000 people.',
    rockfall: 'Granite inselbergs such as Olumo Rock and the Idanre Hills shed blocks along joints and curved sheeting cracks, building boulder piles at their feet.',
  },
  build(ctx){
    const S = ctx.scene, D = 6;
    // slump
    const SL = new THREE.Group(); S.add(SL);
    const f = x => x < -2 ? 3 : x > 3.4 ? 0 : 3 * (1 - smooth(-2, 3.4, x));
    const A = [-1.6, f(-1.6)], B = [3.2, f(3.2)], M = [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2];
    const ch = [B[0] - A[0], B[1] - A[1]], L = Math.hypot(ch[0], ch[1]); let n = [-ch[1] / L, ch[0] / L]; if (n[1] < 0) n = [-n[0], -n[1]];
    const hgt = 1.4, Cc = [M[0] + n[0] * hgt, M[1] + n[1] * hgt], R = Math.hypot(A[0] - Cc[0], A[1] - Cc[1]);
    let a0 = Math.atan2(A[1] - Cc[1], A[0] - Cc[0]), a1 = Math.atan2(B[1] - Cc[1], B[0] - Cc[0]);
    const aM = Math.atan2(-n[1], -n[0]); const norm = a => { while (a < a0) a += 2 * Math.PI; while (a >= a0 + 2 * Math.PI) a -= 2 * Math.PI; return a; };
    if (norm(aM) <= norm(a1)) a1 = norm(a1); else { a1 = norm(a1) - 2 * Math.PI; }
    const arc = []; for (let i = 0; i <= 40; i++) { const a = lerp(a0, a1, i / 40); arc.push([Cc[0] + R * Math.cos(a), Cc[1] + R * Math.sin(a)]); }
    const surf = (xa, xb, nn) => { const p = []; for (let i = 0; i <= nn; i++) { const x = lerp(xa, xb, i / nn); p.push([x, f(x)]); } return p; };
    const hillPoly = [[-7, -2], ...surf(-7, A[0], 20), ...arc.slice(1, -1), ...surf(B[0], 7, 20), [7, -2]];
    const hillGeo = extrude(hillPoly, D);
    const hill = ctx.part(new THREE.Mesh(hillGeo, SM('#a0805a', { flat: true })), 'hill'); SL.add(hill);
    const grass = ctx.part(new THREE.Mesh(extrude([...surf(-7, A[0], 20), ...surf(A[0], -7, 20).map(([x, y]) => [x, y - 0.12])], D + 0.02), SM('#5f8a4a')), 'hill'); grass.position.y = 0.015; SL.add(grass);
    const blockPoly = [...surf(A[0], B[0], 30), ...arc.slice().reverse().slice(1, -1)];
    const pivot = new THREE.Group(); pivot.position.set(Cc[0], Cc[1], 0); SL.add(pivot);
    const blk = new THREE.Group(); blk.position.set(-Cc[0], -Cc[1], 0); pivot.add(blk);
    blk.add(ctx.part(new THREE.Mesh(extrude(blockPoly, D - 0.02), SM('#b08a60', { flat: true })), 'block'));
    { const bg = ctx.part(new THREE.Mesh(extrude([...surf(A[0], B[0], 30), ...surf(B[0], A[0], 30).map(([x, y]) => [x, y - 0.12])], D + 0.02), SM('#6a9450')), 'block'); bg.position.y = 0.015; blk.add(bg); }
    const mkHouse = (par, x, y, z, id) => { const g = new THREE.Group(); const b = ctx.part(new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.45, 0.55), SM('#e8e2d4')), id); b.position.y = 0.22;
      const r = ctx.part(new THREE.Mesh(new THREE.ConeGeometry(0.5, 0.35, 4), SM('#8a3d2a', { flat: true })), id); r.position.y = 0.62; r.rotation.y = Math.PI / 4; g.add(b, r); g.position.set(x, y, z); par.add(g); return g; };
    mkHouse(blk, -0.9, f(-0.9), 0.8, 'house'); mkHouse(SL, -4, 3, -1, 'house'); mkHouse(SL, -5.2, 3, 1.4, 'house');
    const tree = (par, x, z) => { const t = ctx.part(new THREE.Mesh(new THREE.ConeGeometry(0.25, 0.8, 7), SM('#3f7a3a', { flat: true })), par === blk ? 'block' : 'hill'); t.position.set(x, f(x) + 0.4, z); par.add(t); };
    tree(blk, 0.2, -1.5); tree(blk, 1.2, 1.6); tree(SL, -3, 1.8); tree(SL, -6, -2); tree(SL, 5, 2); tree(SL, 4.4, -1.6);
    // rockfall
    const RF = new THREE.Group(); S.add(RF);
    const cl = ctx.part(new THREE.Mesh(extrude([[-7, -1], [-7, 4], [-1.6, 4], [-1.6, 2.1], [0, 2.1], [0, 0], [7, 0], [7, -1]], D), SM('#8d8f86', { flat: true })), 'cliff'); RF.add(cl);
    const jm = SM('#2b2d2f');
    [-2.6, -3.8].forEach(x => { const j = ctx.part(new THREE.Mesh(new THREE.BoxGeometry(0.04, 4.2, D + 0.04), jm), 'joints'); j.position.set(x, 1.9, 0); RF.add(j); });
    const r = rng(17), rocks = [], rm = SM('#a3a59c', { flat: true });
    for (let gx = 0; gx < 2; gx++) for (let gy = 0; gy < 2; gy++) for (let gz = 0; gz < 4; gz++) {
      const m = ctx.part(new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.92, 1.42), rm), 'rock'); const p0 = new THREE.Vector3(-1.2 + gx * 0.8, 2.6 + gy * 0.95, -2.2 + gz * 1.48);
      const p1 = new THREE.Vector3(0.6 + r() * 2.6, 0.35 + r() * 0.3, -2.4 + r() * 4.8), rot = new THREE.Euler(r() * 3, r() * 3, r() * 3);
      m.position.copy(p0); RF.add(m); rocks.push({ m, p0, p1, rot, start: 0.15 + 0.7 * ((gy * 8 + gx * 4 + gz) / 16) + r() * 0.04 }); }
    const talus = ctx.part(new THREE.Mesh(extrude([[0, 0], [0, 0.9], [3.6, 0]], D), SM('#9a9b93', { flat: true })), 'talus'); talus.position.y = 0.001; RF.add(talus);
    let s = 0;
    function apply(){
      pivot.rotation.z = smooth(0.15, 1, s) * 0.42;
      rocks.forEach(o => { const u = clamp((s - o.start) / 0.12, 0, 1); o.m.position.set(lerp(o.p0.x, o.p1.x, u), lerp(o.p0.y, o.p1.y, u * u), lerp(o.p0.z, o.p1.z, u)); o.m.rotation.set(o.rot.x * u, o.rot.y * u, o.rot.z * u); });
      talus.scale.y = 0.4 + 0.6 * s;
    }
    apply();
    return {
      setVariant(v){ SL.visible = v === 'slump'; RF.visible = v === 'rockfall'; },
      setParam(v){ s = v / 100; apply(); },
      regions: ['hill', 'scarp', 'slip', 'block', 'toe'],
      resolve(h, id){
        if (id === 'hill') { const d = Math.hypot(h.point.x - Cc[0], h.point.y - Cc[1]); if (Math.abs(d - R) < 0.25 && h.point.x < B[0] + 0.2 && h.point.x > A[0] - 0.3 && h.point.y < f(h.point.x) - 0.05) return h.point.x < M[0] - 0.4 ? 'scarp' : 'slip'; return 'hill'; }
        if (id === 'block' && h.point.x > B[0] - 0.9) return 'toe';
        return id;
      },
    };
  },
};

/* ---------- model: mountain building ---------- */
const M_OROGEN = {
  id: 'orogen', title: 'Mountain building', group: 'The Earth system',
  blurb: 'Close an ocean, crash two continents together and watch a mountain belt rise with a deep root beneath it.',
  variants: [], slider: { label: 'Plates converge', def: 85, text: v => v < 25 ? 'Ocean closing by subduction' : v < 50 ? 'Ocean almost gone' : v < 70 ? 'Continents collide' : 'Mountain belt with a deep root' },
  cam: [6, 6, 12], target: [0, -1, 0], fit: 7.8,
  parts: {
    contA: { name: 'Continent A', desc: 'Thick, buoyant continental crust riding on its plate.' },
    contB: { name: 'Continent B', desc: 'The second continent, which has an ocean plate sinking beneath its edge.' },
    ocean: { name: 'Ocean basin', desc: 'Dense oceanic crust between the continents. It is consumed by subduction as the plates converge.' },
    slab: { name: 'Subducted ocean slab', desc: 'The old ocean floor, sinking into the mantle.' },
    sea: { name: 'Sea', desc: 'The narrowing ocean between the two continents.' },
    mountains: { name: 'Mountain belt', desc: 'Crust stacked up by folding and thrust faulting where the continents collided.' },
    root: { name: 'Crustal root', desc: 'Thickened crust bulging down into the mantle beneath the mountains, like the hidden part of an iceberg.' },
    suture: { name: 'Suture zone', desc: 'The scar where two continents joined. It often contains slivers of old ocean floor.' },
    mantle: { name: 'Mantle', desc: 'Denser rock that the continental crust floats on.' },
  },
  quiz: { all: [
    { type: 'mc', q: 'Start the slider at 0 and move it right. What has to disappear before two continents can collide?', opts: ['A mountain range', 'The ocean between them, by subduction', 'The mantle'], a: 1, hint: 'Watch the blue area in the middle.', why: 'Oceanic crust is dense enough to sink, so the ocean closes by subduction. Continental crust is too buoyant to sink far, so when the continents meet they crumple instead.' },
    { type: 'tap', prompt: 'With the slider past 70%, tap the crustal root under the mountains.', parts: ['root'], hint: 'Look at the bottom of the crust, below the peaks.', why: 'Isostasy: thick crust floats higher and sinks deeper, like a thick block of wood in water. The Himalayan crust is about 70 km thick, twice the normal thickness.' },
    { type: 'tap', prompt: 'Tap the suture where the two continents joined.', parts: ['suture'], hint: 'The dark line in the middle of the mountain belt.', why: 'Sutures mark former oceans. Geologists find them by looking for slivers of ocean-floor rock (ophiolites) squeezed between two continents.' },
    { type: 'mc', q: 'The Basement Complex of Nigeria is mostly gneiss and schist, flat-lying at the surface today. What does that tell you?', opts: ['It was always flat', 'It is the deeply eroded root of an ancient mountain belt', 'It formed in a desert'], a: 1, hint: 'Where in a colliding mountain belt are rocks squeezed and heated enough to turn into gneiss?', why: 'Metamorphic rocks like gneiss form deep in mountain roots. Hundreds of millions of years of erosion removed the peaks and exposed the root.' },
  ] },
  local: 'About 600 million years ago, the Pan-African orogeny joined West Africa to other continental blocks to build Gondwana. Nigeria\'s Basement Complex gneisses, schists and Older Granites are the deeply eroded roots of that mountain belt. The Himalaya is the same process happening today.',
  build(ctx){
    const S = ctx.scene;
    const mantle = ctx.part(new THREE.Mesh(new THREE.BoxGeometry(16, 3, 6), SM('#c8743c')), 'mantle'); mantle.position.y = -5.7; S.add(mantle);
    const o = (x0, x1) => ({ x0, x1, z0: -3, z1: 3, nx: 60, nz: 8 });
    const oA = o(-8, -2), oB = o(2, 8), oO = o(-2, 2);
    const A = hSlab(SM('#b8945e', { flat: true }), oA), B = hSlab(SM('#9a8466', { flat: true }), oB), O = hSlab(SM('#3e4b53'), oO);
    A.meshes.forEach(m => ctx.part(m, 'contA')); B.meshes.forEach(m => ctx.part(m, 'contB')); O.meshes.forEach(m => ctx.part(m, 'ocean'));
    S.add(A.group, B.group, O.group);
    const sea = ctx.part(new THREE.Mesh(new THREE.BoxGeometry(1, 0.8, 6), SM('#2f7fb5', { op: 0.4 })), 'sea'); sea.renderOrder = 4; S.add(sea);
    const slabMat = SM('#3e4b53'); let slab = null;
    const sut = ctx.part(new THREE.Mesh(new THREE.BoxGeometry(0.08, 1, 6.04), SM('#1f2a30')), 'suture'); S.add(sut);
    const arrows = [-1, 1].map(sg => { const a = makeArrow(1.4, 0.06, 0xf4f1ea); if (sg > 0) a.rotation.y = Math.PI; S.add(a); return { a, sg }; });
    function apply(t){
      const close = smooth(0, 0.5, t), c = smooth(0.45, 1, t), xa = lerp(-2.6, 0, close), xb = lerp(2.6, 0, close);
      const mtn = x => c * (3.0 * Math.exp(-x * x / 3.2) + 0.28 * Math.sin(5 * x) * Math.exp(-x * x / 5));
      const topC = (x, edge, sg) => 0.2 - 0.9 * (1 - c) * (1 - c) * (1 - smooth(0, 1.4, (edge - x) * sg)) + mtn(x);
      const botC = x => -2.4 - c * 3.2 * Math.exp(-x * x / 2.6);
      oA.x1 = xa; oB.x0 = xb; A.update(x => topC(x, xa, 1), botC); B.update(x => topC(x, xb, -1), botC);
      const gap = xb - xa; O.group.visible = sea.visible = gap > 0.05;
      if (gap > 0.05) { oO.x0 = xa; oO.x1 = xb; O.update(() => -0.9, () => -1.6); sea.scale.x = gap; sea.position.set((xa + xb) / 2, -0.5, 0); }
      if (slab) { S.remove(slab); slab.geometry.dispose(); }
      const Ls = lerp(0.6, 3.6, close) * (1 - smooth(0.6, 0.95, t)), dip = 50 * DEG;
      if (Ls > 0.05) { const x0 = xb, cx = Math.cos(dip), sy = Math.sin(dip); slab = ctx.part(new THREE.Mesh(extrude([[x0, -0.9], [x0 + Ls * cx, -0.9 - Ls * sy], [x0 + Ls * cx - 0.55, -0.9 - Ls * sy - 0.35], [x0 - 0.55, -1.6]], 6), slabMat), 'slab'); S.add(slab); } else slab = null;
      sut.visible = c > 0.05; const st = topC(0, 0, 1) - 0.02, sb = botC(0) + 0.02; sut.scale.y = st - sb; sut.position.set(0, (st + sb) / 2, 0);
      arrows.forEach(({ a, sg }) => { const x = sg * 5.6; a.position.set(sg < 0 ? x - 0.7 : x + 0.7, topC(x, sg < 0 ? xa : xb, -sg) + 0.35, 2.4); });
    }
    apply(0.85);
    return {
      setParam(v){ apply(v / 100); },
      regions: ['contA', 'contB'],
      resolve(h, id){ if (id !== 'contA' && id !== 'contB') return id; if (h.point.y < -2.75 && Math.abs(h.point.x) < 2.5) return 'root'; if (h.point.y > 1.0) return 'mountains'; return id; },
    };
  },
};

/* ---------- model: ocean floor and reefs ---------- */
const OCEAN_PROF = x => { const y = x < -6 ? 1.0 - 0.1 * (x + 6) : x < -2 ? lerp(-0.2, -0.55, (x + 6) / 4) : x < -0.8 ? lerp(-0.55, -3, smooth(-2, -0.8, x)) : x < 1.6 ? lerp(-3, -3.9, smooth(-0.8, 1.6, x)) : -3.95;
  return x > 4.6 ? y + 2.1 * Math.exp(-((x - 7.3) ** 2) / 2.2) - 0.5 * Math.exp(-((x - 7.3) ** 2) / 0.08) : y; };
const M_OCEAN = {
  id: 'ocean', title: 'Ocean floor and coral reefs', group: 'Oceans and climate',
  blurb: 'Walk off a continent across the shelf, slope and abyssal plain, then sink a volcano and grow a coral atoll on it.',
  variants: [{ id: 'floor', label: 'Ocean floor profile' }, { id: 'atoll', label: 'Reef to atoll' }],
  slider: { label: 'Volcano sinks over time', def: 0, for: ['atoll'], text: v => v < 15 ? 'Fringing reef' : v < 62 ? 'Barrier reef with a lagoon' : 'Atoll' },
  cam: [3, 7, 12], target: [0, -1.4, 0], fit: 7.6,
  note: 'Depths are exaggerated about 50 times relative to distances, otherwise the ocean floor would look flat.',
  parts: {
    land: { name: 'Coastal land', desc: 'The edge of the continent above sea level.' },
    shelf: { name: 'Continental shelf', desc: 'The flooded, gently sloping edge of the continent, usually less than about 200 m deep.' },
    slope: { name: 'Continental slope', desc: 'The steeper drop from the shelf edge down to the deep ocean. It is the true edge of the continent.' },
    rise: { name: 'Continental rise', desc: 'A wedge of sediment that has slid and flowed down the slope and piled up at its foot.' },
    abyssal: { name: 'Abyssal plain', desc: 'The flattest places on Earth, 4–6 km deep, where fine mud has buried the rough ocean crust.' },
    ridge: { name: 'Mid-ocean ridge', desc: 'Undersea mountains where new ocean crust forms, with a rift valley along the crest.' },
    seamount: { name: 'Flat-topped seamount', desc: 'An old volcanic island, planed flat by waves, that has since sunk deep below the surface.' },
    sea: { name: 'Sea', desc: 'The ocean surface.' },
    volcano: { name: 'Volcanic island', desc: 'Old volcanic islands slowly sink as the ocean plate beneath them cools and the island erodes.' },
    reef: { name: 'Coral reef', desc: 'Built by corals, which need warm, clear, sunlit water, so a reef can only grow near the sea surface.' },
    lagoon: { name: 'Lagoon', desc: 'Calm, shallow water between the reef and the island, or inside the ring of an atoll.' },
    floor: { name: 'Ocean floor', desc: 'Deep ocean crust around the island.' },
  },
  quiz: {
    floor: [
      { type: 'tap', prompt: 'Tap the continental shelf.', parts: ['shelf'], hint: 'The shallow ledge next to the land.', why: 'The shelf is part of the continent, flooded by the sea. Most fishing, offshore oil and sea-floor sand lie on shelves.' },
      { type: 'tap', prompt: 'Tap the flattest part of the deep ocean floor.', parts: ['abyssal'], hint: 'Far from land, before the ridge.', why: 'Abyssal plains are flat because a steady rain of fine mud has buried the original rough volcanic crust.' },
      { type: 'mc', q: 'Where does the continent really end?', opts: ['At the beach', 'At the foot of the continental slope', 'At the mid-ocean ridge'], a: 1, hint: 'Where does thick continental crust give way to thin ocean crust?', why: 'The shelf and slope are both continental crust. The beach is only where today\'s sea level happens to sit.' },
    ],
    atoll: [
      { type: 'mc', q: 'Move the slider. Why does the reef become a ring with no island in the middle?', opts: ['Waves dissolve the island', 'The volcano sinks while the coral keeps growing upward to stay in sunlit water', 'Corals eat the volcano'], a: 1, hint: 'Watch the volcano and the reef separately.', why: 'This is Charles Darwin\'s subsidence theory, confirmed by drilling at Enewetak Atoll, which hit volcanic rock beneath about 1.3 km of reef limestone.' },
      { type: 'tap', prompt: 'With the slider past 30%, tap the lagoon.', parts: ['lagoon'], hint: 'The calm, pale water inside the reef.', why: 'Lagoons form because the reef rim grows fastest, where waves bring the most food and oxygen.' },
    ],
  },
  localV: {
    floor: 'Nigeria\'s offshore oil comes from the continental shelf and, increasingly, from the slope beyond it. The Bonga field lies in about 1,000 m of water.',
    atoll: 'The Gulf of Guinea has almost no coral reefs: the Niger and other rivers make the water muddy and less salty. Atolls are found in clear tropical seas, such as the Maldives.',
  },
  build(ctx){
    const S = ctx.scene;
    const F = new THREE.Group(); S.add(F);
    const prof = []; for (let i = 0; i <= 160; i++) { const x = lerp(-8, 8, i / 160); prof.push([x, OCEAN_PROF(x)]); }
    F.add(ctx.part(new THREE.Mesh(extrude([[-8, -5], ...prof, [8, -5]], 6), SM('#8f7c63', { flat: true })), 'abyssal'));
    const top = ctx.part(new THREE.Mesh(extrude([...prof.filter(p => p[0] <= -6.01), ...prof.filter(p => p[0] <= -6.01).reverse().map(([x, y]) => [x, y - 0.1])], 6.02), SM('#5f8a4a')), 'land'); top.position.y = 0.015; F.add(top);
    const sm = ctx.part(new THREE.Mesh(new THREE.CylinderGeometry(0.35, 1.3, 2.4, 20), SM('#4e4a46', { flat: true })), 'seamount'); sm.position.set(3.2, -3.95 + 1.2, 0.6); F.add(sm);
    const fsea = ctx.part(new THREE.Mesh(new THREE.BoxGeometry(13.96, 4.1, 5.96), SM('#2f7fb5', { op: 0.25 })), 'sea'); fsea.position.set(1, -2.05, 0); fsea.renderOrder = 4; F.add(fsea);
    [['Shelf', -4], ['Slope', -1.4], ['Rise', 0.4], ['Abyssal plain', 2.6], ['Ridge', 7.3]].forEach(([t, x]) => fixedTag(F, t, [x, OCEAN_PROF(x) + 0.75, 3.4], 0.6));
    // atoll
    const T = new THREE.Group(); S.add(T);
    const floor = ctx.part(new THREE.Mesh(new THREE.BoxGeometry(14, 1, 9), SM('#6d6a5f')), 'floor'); floor.position.y = -3.5; T.add(floor);
    const H = 4.6, Rb = 3.4, base = -3;
    const coneR = y => Rb * (1 - (y - base) / H);
    const vg = new THREE.Group(); T.add(vg);
    const vprof = []; for (let i = 0; i <= 24; i++) { const y = lerp(base - 4.5, base + H, i / 24); vprof.push(new THREE.Vector2(Math.max(0.01, y < base ? Rb : coneR(y)), y)); }
    vg.add(ctx.part(new THREE.Mesh(new THREE.LatheGeometry(vprof.reverse(), 40), SM('#4e5a3a', { flat: true, clip: [new THREE.Plane(new THREE.Vector3(0, 1, 0), 4)] })), 'volcano'));
    const r0 = coneR(0);
    const reefProf = [new THREE.Vector2(r0 - 0.05, base), new THREE.Vector2(r0 + 0.75, base), new THREE.Vector2(r0 + 0.5, 0.06), new THREE.Vector2(r0 - 0.05, 0.06)];
    const reef = ctx.part(new THREE.Mesh(new THREE.LatheGeometry(reefProf, 48), SM('#d9c7a6', { flat: true })), 'reef'); T.add(reef);
    const reefTop = ctx.part(new THREE.Mesh(new THREE.RingGeometry(r0 - 0.05, r0 + 0.5, 48), SM('#e8908a')), 'reef'); reefTop.rotation.x = -Math.PI / 2; reefTop.position.y = 0.065; T.add(reefTop);
    const lag = ctx.part(new THREE.Mesh(new THREE.CircleGeometry(r0 - 0.04, 48), SM('#5fc3c9', { op: 0.85 })), 'lagoon'); lag.rotation.x = -Math.PI / 2; lag.position.y = -0.02; T.add(lag);
    const tsea = ctx.part(new THREE.Mesh(new THREE.BoxGeometry(14, 3, 9), SM('#2f7fb5', { op: 0.3 })), 'sea'); tsea.position.y = -1.5; tsea.renderOrder = 4; T.add(tsea);
    return {
      setVariant(v){ F.visible = v === 'floor'; T.visible = v === 'atoll'; },
      setParam(v){ const s = v / 100; vg.position.y = -s * 5.2; lag.visible = s > 0.06; },
      regions: ['abyssal'],
      resolve(h, id){ if (id !== 'abyssal') return id; const x = h.point.x; return x < -6 ? 'land' : x < -2 ? 'shelf' : x < -0.8 ? 'slope' : x < 1.6 ? 'rise' : x < 5 ? 'abyssal' : 'ridge'; },
    };
  },
};

/* ---------- model: tin and gold deposits ---------- */
const M_ORE = {
  id: 'ore', title: 'Tin and gold deposits', group: 'Earth resources',
  blurb: 'Fade away the rock to find the veins where tin and gold formed, and the river gravels where streams concentrate them.',
  variants: [{ id: 'tin', label: 'Tin in granite' }, { id: 'gold', label: 'Gold in a schist belt' }],
  slider: { label: 'Fade the country rock', def: 50 },
  cam: [8, 6.5, 11], target: [0, -0.8, 0], fit: 7.4,
  parts: {
    country: { name: 'Country rock', desc: 'The older rock that the granite intruded.' },
    granite: { name: 'Tin granite', desc: 'A granite rich in tin, fluorine and other elements that do not fit into common minerals.' },
    greisen: { name: 'Greisen cap', desc: 'The top of the granite, altered by hot fluids into quartz and mica. Cassiterite is often concentrated here.' },
    veins: { name: 'Mineralised veins', desc: 'Cracks filled by hot, metal-rich fluids that escaped from the top of the granite.' },
    cassiterite: { name: 'Cassiterite (tin ore)', desc: 'Tin oxide, SnO₂. Heavy, hard, black or brown, and resistant to weathering.' },
    placer: { name: 'Placer deposit', desc: 'River gravel where heavy grains settle out of the current and concentrate, because they are much denser than sand.' },
    river: { name: 'River', desc: 'Erodes the ore body and carries the grains downstream.' },
    pond: { name: 'Abandoned mining pond', desc: 'A water-filled pit left after placer mining.' },
    schist: { name: 'Schist', desc: 'Metamorphic rock of the schist belt, tilted and sheared during mountain building.' },
    shear: { name: 'Shear zone', desc: 'A band of intensely deformed rock that acted as a pathway for hot fluids.' },
    qvein: { name: 'Quartz vein', desc: 'White quartz deposited by fluids flowing up the shear zone. Gold precipitated with it.' },
    gold: { name: 'Gold', desc: 'Native gold. Very dense, soft and unreactive, so it survives weathering as grains and flakes.' },
    pits: { name: 'Artisanal mining pits', desc: 'Small hand-dug pits following a vein to the surface.' },
  },
  quiz: {
    tin: [
      { type: 'mc', q: 'Why is the tin concentrated at the top of the granite and in veins above it?', opts: ['Tin sank to the top', 'Hot fluids rich in tin rose to the top of the cooling granite and escaped along cracks', 'Rain washed tin into the granite'], a: 1, hint: 'What happens to the last fluids left in a cooling magma?', why: 'As the granite crystallised, elements like tin stayed in the remaining hot fluid. That fluid rose to the roof and into fractures, depositing cassiterite.' },
      { type: 'tap', prompt: 'Tap the placer deposit in the river.', parts: ['placer'], hint: 'The dark grains along the riverbed.', why: 'Cassiterite is about 2.5 times denser than quartz sand, so it drops out where the current slows. Most Jos tin was mined from placers like this.' },
    ],
    gold: [
      { type: 'tap', prompt: 'Tap a quartz vein that carries gold.', parts: ['qvein'], hint: 'Fade the rock and look inside the shear zone.', why: 'Lode gold in schist belts sits in quartz veins along shear zones. Miners follow the white quartz.' },
      { type: 'mc', q: 'Gold grains also collect in the stream gravel. Why does gold survive the journey?', opts: ['It floats', 'It is very dense and does not rust or dissolve', 'Streams make new gold'], a: 1, hint: 'Think about what happens to iron left out in the rain.', why: 'Gold is about 19 times denser than water and chemically unreactive, so it survives weathering and settles quickly in gravel.' },
    ],
  },
  localV: {
    tin: 'The Younger Granites of the Jos Plateau made Nigeria a major tin producer from the early 1900s. Placer mining left hundreds of ponds and spoil heaps that still scar the plateau.',
    gold: 'Gold occurs in the schist belts of the Basement Complex, for example around Ilesha and in Zamfara. In 2010, lead released by artisanal gold processing in Zamfara State poisoned thousands of children and killed hundreds.',
  },
  build(ctx){
    const S = ctx.scene, fade = [];
    const box = (w, h, d, c, id, pos, op) => { const m = SM(c, op ? { op } : {}); const b = ctx.part(new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m), id); b.position.set(...pos); return [b, m]; };
    // tin
    const T = new THREE.Group(); S.add(T);
    { const [b, m] = box(12, 4.6, 6, '#a39a8e', 'country', [0, -1.3, 0], 0.5); b.renderOrder = 5; T.add(b); fade.push(m); }
    const gr = ctx.part(new THREE.Mesh(new THREE.SphereGeometry(1, 40, 24, 0, Math.PI * 2, 0, Math.PI / 2), SM('#e0b3a0')), 'granite'); gr.scale.set(3.4, 2.4, 2.6); gr.position.set(-0.5, -3.6, 0); T.add(gr);
    const gs = ctx.part(new THREE.Mesh(new THREE.SphereGeometry(1, 40, 12, 0, Math.PI * 2, 0, 0.55), SM('#bdb6a4')), 'greisen'); gs.scale.set(3.48, 2.48, 2.68); gs.position.copy(gr.position); T.add(gs);
    const vm = SM('#5a4632'), cm = SM('#1d1a18', { flat: true, rough: 0.3 });
    [[-1.6, 0.25], [-0.5, 0], [0.6, -0.2], [1.6, -0.35]].forEach(([x, a]) => { const v = ctx.part(new THREE.Mesh(new THREE.BoxGeometry(0.08, 2.4, 3.8), vm), 'veins'); v.position.set(x, -0.2, 0); v.rotation.z = a; T.add(v);
      for (let k = 0; k < 4; k++) { const c = ctx.part(new THREE.Mesh(new THREE.OctahedronGeometry(0.11, 0), cm), 'cassiterite'); c.position.set(x - Math.sin(a) * (k * 0.5 - 0.6), -0.2 + k * 0.5 - 0.6, 1.92); T.add(c); } });
    const rv = []; for (let i = 0; i <= 20; i++) { const x = lerp(-6, 6, i / 20); rv.push([x, 1.0, -1.6 + 0.9 * Math.sin(x * 0.6)]); }
    T.add(ctx.part(new THREE.Mesh(tube(rv, 0.16), SM('#2f7fb5', { rough: 0.3 })), 'river'));
    const pr = rng(4); for (let i = 0; i < 40; i++) { const x = lerp(0.5, 5.8, pr()), z = -1.6 + 0.9 * Math.sin(x * 0.6) + (pr() - 0.5) * 0.5; const g = ctx.part(new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 4), cm), 'placer'); g.position.set(x, 1.02, z); T.add(g); }
    [[-3.6, 1.6], [3.8, 1.8]].forEach(([x, z]) => { const p = ctx.part(new THREE.Mesh(new THREE.CircleGeometry(0.75, 24), SM('#3f8fa6')), 'pond'); p.rotation.x = -Math.PI / 2; p.position.set(x, 1.01, z); T.add(p); });
    // gold
    const G = new THREE.Group(); S.add(G);
    const cols = ['#7d7a6c', '#9a9686', '#6c6e66', '#8f8a78'], k = Math.tan(0.6);
    for (let i = 0, c = -12; c < 6; i++, c += 0.75) { const poly = clipPolyRect([[-20, -20 * k + c], [20, 20 * k + c], [20, 20 * k + c + 0.75], [-20, -20 * k + c + 0.75]], -6, 6, -3.6, 1);
      if (poly.length >= 3) { const m = SM(cols[i % 4], { op: 0.55, flat: true }); fade.push(m); const b = ctx.part(new THREE.Mesh(extrude(poly, 6), m), 'schist'); b.renderOrder = 5; G.add(b); } }
    const sh = ctx.part(new THREE.Mesh(new THREE.BoxGeometry(1.0, 5.6, 6.02), SM('#b03c12', { op: 0.25 })), 'shear'); sh.position.set(0.6, -1.3, 0); sh.rotation.z = -0.25; G.add(sh);
    const qm = SM('#f3f1ea', { rough: 0.3 }), gm = SM('#f2c14e', { emissive: '#c08a00', ei: 0.5, metal: 0.6, rough: 0.3 });
    [[-1.4, -0.3], [-0.2, 0.3], [1.0, -0.1]].forEach(([y, dz]) => { const q = ctx.part(new THREE.Mesh(new THREE.BoxGeometry(0.16, 1.2, 1.6), qm), 'qvein'); q.position.set(0.6 + Math.tan(0.25) * (y - 0.6 + 1.3), y - 0.6, dz * 4); q.rotation.z = -0.25; G.add(q);
      for (let j = 0; j < 4; j++) { const g = ctx.part(new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), gm), 'gold'); g.position.set(q.position.x + 0.09, q.position.y + (j - 1.5) * 0.25, q.position.z + (j % 2 ? 0.4 : -0.3)); G.add(g); } });
    const gv = []; for (let i = 0; i <= 20; i++) { const x = lerp(-6, 6, i / 20); gv.push([x, 1.02, 1.6 + 0.8 * Math.sin(x * 0.5)]); }
    G.add(ctx.part(new THREE.Mesh(tube(gv, 0.16), SM('#2f7fb5', { rough: 0.3 })), 'river'));
    for (let i = 0; i < 26; i++) { const x = lerp(1.0, 5.8, pr()), z = 1.6 + 0.8 * Math.sin(x * 0.5) + (pr() - 0.5) * 0.4; const g = ctx.part(new THREE.Mesh(new THREE.SphereGeometry(0.055, 6, 4), gm), 'placer'); g.position.set(x, 1.05, z); G.add(g); }
    [[0.5, -0.8], [0.9, 0.4], [0.2, -2.0]].forEach(([x, z]) => { const p = ctx.part(new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.2, 0.06, 14), SM('#2a2420')), 'pits'); p.position.set(x, 1.02, z); G.add(p); });
    return {
      setVariant(v){ T.visible = v === 'tin'; G.visible = v === 'gold'; },
      setParam(v){ const op = clamp(1 - v / 100, 0.08, 1); fade.forEach(m => { m.opacity = op; m.depthWrite = op > 0.95; }); },
    };
  },
};

/* ---------- model: climate and sea-level change ---------- */
const seaFor = s => s < 0.5 ? lerp(-1.05, 0, s / 0.5) : lerp(0, 0.42, (s - 0.5) / 0.5);
const M_CLIMATE = {
  id: 'climate', title: 'Climate and sea-level change', group: 'Oceans and climate',
  blurb: 'Grow and melt ice sheets and watch the coastline move: a dry continental shelf in the ice age, a flooded coast in a warmer world.',
  variants: [], slider: { label: 'Global climate: ice age → today → warmer', def: 50, text: v => v < 15 ? 'Last ice age: sea about 120 m lower' : v < 45 ? 'Ice melting, sea rising' : v <= 55 ? 'Today' : 'Warmer world: ice shrinks, sea rises' },
  cam: [5, 7, 12], target: [0, 0, 0], fit: 7.6,
  note: 'Heights are exaggerated. Sea-level changes here are illustrative, not predictions for a specific year.',
  parts: {
    ice: { name: 'Ice sheet and glaciers', desc: 'Water evaporated from the ocean and locked up on land as ice. More land ice means lower sea level.' },
    mountains: { name: 'Highlands', desc: 'High, cold ground where ice builds up first.' },
    coast: { name: 'Low coastal plain', desc: 'Land only a few metres above sea level. The first to flood when the sea rises.' },
    city: { name: 'Coastal city', desc: 'Many of the world\'s biggest cities sit on low coasts and deltas.' },
    shelf: { name: 'Continental shelf', desc: 'Under water today, but dry land during the last ice age, when people and animals could walk across it.' },
    deep: { name: 'Deep ocean floor', desc: 'Stays under water whatever the climate.' },
    sea: { name: 'Sea', desc: 'Its level depends mostly on how much water is locked up as ice on land, and on how warm the water is.' },
  },
  quiz: { all: [
    { type: 'mc', q: 'Move the slider to the ice age. Why does the sea level fall?', opts: ['Sea water freezes in place', 'Water evaporated from the oceans is stored on land as ice sheets', 'The ocean floor rises'], a: 1, hint: 'Where does the snow that builds ice sheets come from?', why: 'About 20,000 years ago so much water was locked in ice sheets that sea level was about 120 m lower than today.' },
    { type: 'tap', prompt: 'At the ice-age setting, tap the area that is dry land then but under the sea today.', parts: ['shelf'], hint: 'The sandy ledge between the coast and the deep water.', why: 'Continental shelves were exposed during ice ages. River valleys cut across them are now drowned under the sea.' },
    { type: 'mc', q: 'In a warmer world, sea level rises for two reasons. Melting land ice is one. What is the other?', opts: ['Warmer water expands and takes up more space', 'Rain gets saltier', 'The Moon pulls harder'], a: 0, hint: 'What happens to most things when they are heated?', why: 'Thermal expansion of seawater and melting glaciers and ice sheets together drive today\'s sea-level rise.' },
    { type: 'tap', prompt: 'Move the slider to the warmer setting, then tap what floods first.', parts: ['coast', 'city'], hint: 'Look for the lowest land.', why: 'Low coastal plains and deltas, where many large cities stand, are the first to flood and erode.' },
  ] },
  local: 'Lagos and the Niger Delta coast are only a few metres above sea level, and coastal erosion at places like Bar Beach is a constant problem. Inland, about 7,000 years ago, a wetter climate filled Lake Chad into a vast lake known as Mega-Chad.',
  build(ctx){
    const S = ctx.scene, o = { x0: -8, x1: 8, z0: -4, z1: 4, nx: 96, nz: 48 };
    const terr = (x, z) => { let y; if (x < -4) y = 0.6 + 1.6 * smooth(-4, -7, x) + 0.6 * Math.sin(1.3 * z + x) * smooth(-4, -6, x); else if (x < 1) y = lerp(0.6, 0.06, smooth(-4, 1, x)); else if (x < 5) y = lerp(-0.1, -1.0, (x - 1) / 4); else y = lerp(-1.0, -3, smooth(5, 7, x));
      return y + 0.05 * Math.sin(2 * x + 3 * z); };
    const t = hSlab(SM('#ffffff', { vc: true, flat: true }), o, SM('#8a7a66')); addVC([t.top]); t.update(terr, () => -3.5); t.meshes.forEach(m => ctx.part(m, 'coast')); S.add(t.group);
    paintVC([t.top], (c, x, y) => { if (y > 1.3) c.set('#8d8576'); else if (y > 0.04) c.set('#5f8a4a').lerp(new THREE.Color('#7a8f52'), clamp(y, 0, 1)); else if (y > -1.08) c.set('#d8c08f'); else c.set('#6d5c45'); });
    const sea = ctx.part(new THREE.Mesh(new THREE.BoxGeometry(15.96, 1, 7.96), SM('#2f7fb5', { op: 0.5, rough: 0.2 })), 'sea'); sea.renderOrder = 4; S.add(sea);
    const ice = ctx.part(new THREE.Mesh(new THREE.SphereGeometry(1, 40, 20, 0, Math.PI * 2, 0, Math.PI / 2), SM('#eef5f8', { rough: 0.35 })), 'ice'); S.add(ice);
    const city = new THREE.Group(); S.add(city); const r = rng(12);
    for (let i = 0; i < 14; i++) { const x = lerp(-1.2, 0.8, r()), z = lerp(-2.6, 2.6, r()), h = 0.15 + r() * 0.5; const b = ctx.part(new THREE.Mesh(new THREE.BoxGeometry(0.25, h, 0.25), SM('#e8e2d4')), 'city'); b.position.set(x, terr(x, z) + h / 2, z); city.add(b); }
    let sl = 0;
    function apply(s){
      sl = seaFor(s); const top = sl, bot = -3.4; sea.scale.y = top - bot; sea.position.y = (top + bot) / 2;
      const k = s < 0.5 ? lerp(1, 0.32, s / 0.5) : lerp(0.32, 0.04, (s - 0.5) / 0.5);
      ice.scale.set(1.2 + 3.6 * k, 0.4 + 1.6 * k, 1.5 + 2.6 * k); ice.position.set(-7 + 0.6 * k, 1.4 - 0.2 * k, 0); ice.visible = k > 0.05;
    }
    apply(0.5);
    return {
      setParam(v){ apply(v / 100); },
      regions: ['coast', 'shelf', 'mountains', 'deep'],
      resolve(h, id){ if (id !== 'coast') return id; const y = h.point.y; if (y < -1.08) return 'deep'; if (y < 0.0) return 'shelf'; return h.point.x < -4 ? 'mountains' : 'coast'; },
    };
  },
};

