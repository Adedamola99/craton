/* Craton · 05-stereonet.js
 * Stereonet Bridge: 3D outcrop with Brunton, lower-hemisphere bowl that morphs into a Schmidt net, and the recover-the-measurement challenges.
 * Loaded as a classic script; top-level consts are shared across files in load order (see app/index.html).
 */
'use strict';
/* ===================== module 2: stereonet ↔ outcrop bridge ===================== */
const R_NET = 2;
const _f = new THREE.Vector3();
function toFlat(out, x, y, z){
  const p = Math.asin(clamp(-y, -1, 1)), h = Math.hypot(x, z), t = Math.atan2(x, -z);
  const r = R_NET * Math.SQRT2 * Math.sin((Math.PI / 2 - p) / 2);
  return h < 1e-9 ? out.set(0, 0, 0) : out.set(r * Math.sin(t), 0, -r * Math.cos(t));
}
function morphInto(out, x, y, z, m){ toFlat(_f, x, y, z); return out.set(lerp(R_NET * x, _f.x, m), lerp(R_NET * y, _f.y, m) + 0.004 * m, lerp(R_NET * z, _f.z, m)); }
function planeBasis(strike, dip){
  const a = strike * DEG, d = dip * DEG, dd = a + Math.PI / 2;
  return { s: [Math.sin(a), 0, -Math.cos(a)], dv: [Math.sin(dd) * Math.cos(d), -Math.sin(d), -Math.cos(dd) * Math.cos(d)] };
}
function gcVecs(strike, dip, n){
  const { s, dv } = planeBasis(strike, dip), out = [];
  for (let i = 0; i <= n; i++) { const th = Math.PI * i / n, c = Math.cos(th), sn = Math.sin(th); out.push([s[0] * c + dv[0] * sn, s[1] * c + dv[1] * sn, s[2] * c + dv[2] * sn]); }
  return out;
}
function poleVec(strike, dip){ const t = (strike + 90) * DEG + Math.PI, p = (90 - dip) * DEG; return [Math.sin(t) * Math.cos(p), -Math.sin(p), -Math.cos(t) * Math.cos(p)]; }
function tubeGeo(vecs, m, rad){
  const pts = vecs.map(v => morphInto(new THREE.Vector3(), v[0], v[1], v[2], m));
  return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), vecs.length + 8, rad, 6, false);
}
function buildOutcrop(stage){
  const { scene } = stage; lights(scene); scene.background = new THREE.Color('#d5ded9');
  const groundMat = new THREE.MeshStandardMaterial({ color: 0xdde5e0, roughness: 1 });
  const ground = new THREE.Mesh(new THREE.CircleGeometry(4.3, 64), groundMat); ground.rotation.x = -Math.PI / 2; ground.position.y = -2.2; scene.add(ground);
  const ringMat = new THREE.MeshBasicMaterial({ color: 0x46564f });
  const ring = new THREE.Mesh(new THREE.RingGeometry(4.25, 4.33, 96), ringMat); ring.rotation.x = -Math.PI / 2; ring.position.y = -2.19; scene.add(ring);
  const card = ['N', 'E', 'S', 'W'].map((l, i) => { const sp = makeLabel(l, '#0e1a15', 0.55); const a = i * 90 * DEG; sp.position.set(4.85 * Math.sin(a), -2.0, -4.85 * Math.cos(a)); scene.add(sp); return sp; });
  const tex = makeTex('sandstone', 256); tex.map.repeat.set(1.2, 1.2); tex.bump.repeat.set(1.2, 1.2);
  const yaw = new THREE.Group(), tilt = new THREE.Group(); yaw.add(tilt); scene.add(yaw);
  const h = 0.14;
  const slab = new THREE.Mesh(new THREE.BoxGeometry(4.2, h * 2, 4.2), new THREE.MeshStandardMaterial({ map: tex.map, bumpMap: tex.bump, bumpScale: 0.05, roughness: .9 }));
  tilt.add(slab);
  const strikeMat = new THREE.MeshBasicMaterial({ color: 0xb03c12 });
  const strikeLine = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.03, 4.9), strikeMat); strikeLine.position.y = h + 0.02; tilt.add(strikeLine);
  const dipArrow = makeArrow(1.9, 0.045, 0x08707e); dipArrow.position.set(0.15, h + 0.05, 0); tilt.add(dipArrow);
  // Brunton compass lying on the bed, long edge parallel to strike
  const brunton = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.14, 1.3), new THREE.MeshStandardMaterial({ color: 0x2a2f2c, roughness: .45, metalness: .3 }));
  const dial = new THREE.Mesh(new THREE.CircleGeometry(0.38, 40), new THREE.MeshBasicMaterial({ map: makeDialTexture() })); dial.rotation.x = -Math.PI / 2; dial.position.y = 0.071;
  const sight = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.05, 0.5), new THREE.MeshStandardMaterial({ color: 0x9aa39e, metalness: .6, roughness: .3 })); sight.position.set(0, 0.06, -0.85);
  brunton.add(body, dial, sight); brunton.position.set(-0.95, h + 0.07, 0.6); tilt.add(brunton);
  // horizontal reference plane + dip arc (live in yaw group, never tilted)
  const water = new THREE.Mesh(new THREE.CircleGeometry(2.6, 48), new THREE.MeshBasicMaterial({ color: 0x08707e, transparent: true, opacity: 0.12, side: THREE.DoubleSide, depthWrite: false }));
  water.rotation.x = -Math.PI / 2; yaw.add(water);
  const arcGeo = new THREE.BufferGeometry(); arcGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(36 * 3), 3));
  const arcMat = new THREE.LineBasicMaterial({ color: 0x0e1a15, depthTest: false });
  const arc = new THREE.Line(arcGeo, arcMat); arc.renderOrder = 25; yaw.add(arc);
  const refGeo = new THREE.BufferGeometry(); refGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3));
  const ref = new THREE.Line(refGeo, new THREE.LineDashedMaterial({ color: 0x0e1a15, dashSize: 0.1, gapSize: 0.08, depthTest: false })); ref.renderOrder = 25; yaw.add(ref);
  const dLabel = makeLabel('δ', '#0e1a15', 0.45); yaw.add(dLabel);
  function setPlane(strike, dip){
    yaw.rotation.y = -strike * DEG; tilt.rotation.z = -dip * DEG;
    const d = dip * DEG, cx = h * Math.sin(d), cy = h * Math.cos(d);
    water.position.set(cx, cy + 0.003, 0);
    const a = arcGeo.attributes.position, r = 1.45;
    for (let i = 0; i < 36; i++) { const th = d * i / 35; a.setXYZ(i, cx + r * Math.cos(th), cy - r * Math.sin(th) + 0.01, 0.0); }
    a.needsUpdate = true; arcGeo.computeBoundingSphere();
    const rp = refGeo.attributes.position; rp.setXYZ(0, cx, cy + 0.01, 0); rp.setXYZ(1, cx + 2.1, cy + 0.01, 0); rp.needsUpdate = true; refGeo.computeBoundingSphere(); ref.computeLineDistances();
    const mid = d / 2; dLabel.position.set(cx + 1.8 * Math.cos(mid), cy - 1.8 * Math.sin(mid) + 0.05, 0); dLabel.visible = dip > 4;
    stage.invalidate();
  }
  function setTheme(t){
    scene.background.set(t.stage); groundMat.color.set(t.chip); ringMat.color.set(t.mute);
    strikeMat.color.set(t.acc); dipArrow.userData.mat.color.set(t.acc2); water.material.color.set(t.acc2);
    arcMat.color.set(t.ink); ref.material.color.set(t.ink); card.forEach(c => c.userData.draw(t.ink)); dLabel.userData.draw(t.ink);
    stage.invalidate();
  }
  return { setPlane, setTheme, reset: stage.resetView };
}
function buildNet(stage){
  const { scene } = stage; scene.background = new THREE.Color('#d5ded9');
  scene.add(new THREE.HemisphereLight(0xffffff, 0x4c5a52, 1));
  let m = 0, plane = { strike: 45, dip: 30 }, ghost = null;
  // bowl
  const bowlGeo = new THREE.SphereGeometry(1, 48, 16, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2);
  const bowlBase = Float32Array.from(bowlGeo.attributes.position.array);
  const bowlMat = new THREE.MeshBasicMaterial({ color: 0x08707e, transparent: true, opacity: 0.1, side: THREE.DoubleSide, depthWrite: false });
  const bowl = new THREE.Mesh(bowlGeo, bowlMat); scene.add(bowl);
  // Schmidt graticule: great circles striking N–S, small circles about the N–S axis, primitive
  const polys = [];
  for (let d = 10; d <= 80; d += 10) { polys.push(gcVecs(0, d, 40)); polys.push(gcVecs(180, d, 40)); }
  polys.push(gcVecs(0, 90, 40));
  for (let phi = 10; phi < 180; phi += 10) { const pts = []; const c = Math.cos(phi * DEG), s = Math.sin(phi * DEG);
    for (let i = 0; i <= 40; i++) { const ps = Math.PI * i / 40; pts.push([s * Math.cos(ps), -s * Math.sin(ps), -c]); } polys.push(pts); }
  const prim = []; for (let i = 0; i <= 96; i++) { const a = Math.PI * 2 * i / 96; prim.push([Math.sin(a), 0, -Math.cos(a)]); }
  const segs = []; polys.forEach(pl => { for (let i = 0; i < pl.length - 1; i++) segs.push(pl[i], pl[i + 1]); });
  const gratBase = new Float32Array(segs.length * 3); segs.forEach((v, i) => { gratBase[3 * i] = v[0]; gratBase[3 * i + 1] = v[1]; gratBase[3 * i + 2] = v[2]; });
  const gratGeo = new THREE.BufferGeometry(); gratGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(gratBase.length), 3));
  const gratMat = new THREE.LineBasicMaterial({ color: 0x46564f, transparent: true, opacity: 0.45 });
  const grat = new THREE.LineSegments(gratGeo, gratMat); scene.add(grat);
  const primGeo = new THREE.BufferGeometry().setFromPoints(prim.map(v => new THREE.Vector3(v[0] * R_NET, 0.005, v[2] * R_NET)));
  const primMat = new THREE.LineBasicMaterial({ color: 0x0e1a15 });
  scene.add(new THREE.Line(primGeo, primMat));
  const card = ['N', 'E', 'S', 'W'].map((l, i) => { const sp = makeLabel(l, '#0e1a15', 0.42); const a = i * 90 * DEG; sp.position.set(2.42 * Math.sin(a), 0.05, -2.42 * Math.cos(a)); scene.add(sp); return sp; });
  // plane disc (fades as the net flattens)
  const yaw = new THREE.Group(), tilt = new THREE.Group(); yaw.add(tilt); scene.add(yaw);
  const discMat = new THREE.MeshBasicMaterial({ color: 0xb03c12, transparent: true, opacity: 0.2, side: THREE.DoubleSide, depthWrite: false });
  const disc = new THREE.Mesh(new THREE.CircleGeometry(R_NET, 48), discMat); disc.rotation.x = -Math.PI / 2; tilt.add(disc);
  // great circle, pole, ghost
  const gcMat = new THREE.MeshBasicMaterial({ color: 0xb03c12 });
  const gc = new THREE.Mesh(new THREE.BufferGeometry(), gcMat); gc.renderOrder = 5; scene.add(gc);
  const ghostMat = new THREE.MeshBasicMaterial({ color: 0x08707e, transparent: true, opacity: 0.55, depthWrite: false });
  const ghostMesh = new THREE.Mesh(new THREE.BufferGeometry(), ghostMat); ghostMesh.visible = false; scene.add(ghostMesh);
  const poleMat = new THREE.MeshBasicMaterial({ color: 0x0e1a15 });
  const pole = new THREE.Mesh(new THREE.SphereGeometry(0.075, 16, 12), poleMat); scene.add(pole);
  const poleLineGeo = new THREE.BufferGeometry(); poleLineGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3));
  const poleLineMat = new THREE.LineDashedMaterial({ color: 0x0e1a15, dashSize: .08, gapSize: .06, transparent: true });
  const poleLine = new THREE.Line(poleLineGeo, poleLineMat); scene.add(poleLine);
  const center = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 6), primMat); scene.add(center);
  const pLabel = makeLabel('P', '#0e1a15', 0.34); scene.add(pLabel);
  const tmp = new THREE.Vector3();
  function rebuildCurves(){
    gc.geometry.dispose(); gc.geometry = tubeGeo(gcVecs(plane.strike, plane.dip, 64), m, 0.028);
    if (ghost) { ghostMesh.geometry.dispose(); ghostMesh.geometry = tubeGeo(gcVecs(ghost.strike, ghost.dip, 64), m, 0.045); }
    ghostMesh.visible = !!ghost;
    const pv = poleVec(plane.strike, plane.dip); morphInto(tmp, pv[0], pv[1], pv[2], m); pole.position.copy(tmp); pLabel.position.set(tmp.x + 0.18, tmp.y + 0.2, tmp.z);
    const a = poleLineGeo.attributes.position; a.setXYZ(0, 0, 0, 0); a.setXYZ(1, tmp.x, tmp.y, tmp.z); a.needsUpdate = true; poleLineGeo.computeBoundingSphere(); poleLine.computeLineDistances();
  }
  function applyMorph(){
    const bp = bowlGeo.attributes.position;
    for (let i = 0; i < bp.count; i++) { morphInto(tmp, bowlBase[3 * i], bowlBase[3 * i + 1], bowlBase[3 * i + 2], m); bp.setXYZ(i, tmp.x, tmp.y - 0.002, tmp.z); }
    bp.needsUpdate = true; bowlGeo.computeBoundingSphere();
    const gp = gratGeo.attributes.position;
    for (let i = 0; i < gp.count; i++) { morphInto(tmp, gratBase[3 * i], gratBase[3 * i + 1], gratBase[3 * i + 2], m); gp.setXYZ(i, tmp.x, tmp.y, tmp.z); }
    gp.needsUpdate = true; gratGeo.computeBoundingSphere();
    discMat.opacity = 0.2 * (1 - m); disc.visible = m < 0.98;
    poleLineMat.opacity = 1 - m; poleLine.visible = m < 0.98;
    rebuildCurves(); stage.invalidate();
  }
  function setPlane(strike, dip){ plane = { strike, dip }; yaw.rotation.y = -strike * DEG; tilt.rotation.z = -dip * DEG; rebuildCurves(); stage.invalidate(); }
  function setMorph(v){ m = clamp(v, 0, 1); applyMorph(); }
  function setGhost(g){ ghost = g; rebuildCurves(); stage.invalidate(); }
  function setTheme(t){
    scene.background.set(t.stage); bowlMat.color.set(t.acc2); gratMat.color.set(t.mute); primMat.color.set(t.ink);
    discMat.color.set(t.acc); gcMat.color.set(t.acc); ghostMat.color.set(t.acc2); poleMat.color.set(t.ink); poleLineMat.color.set(t.ink);
    card.forEach(c => c.userData.draw(t.ink)); pLabel.userData.draw(t.ink); stage.invalidate();
  }
  applyMorph(); setPlane(45, 30);
  return { setPlane, setMorph, setGhost, setTheme,
    bowlView: () => stage.flyTo(stage.fitPos([3.4, 2.8, 4.4], [0, -0.6, 0], 2.7), [0, -0.6, 0]),
    mapView: () => stage.flyTo(stage.fitPos([0, 1, 0.0004], [0, 0, 0], 2.65), [0, 0, 0]) };
}
const NET_CHALLENGES = [
  { id: 'benue', place: 'Abakaliki Anticlinorium, Benue Trough', story: 'Your field partner measured the north-west limb of the anticline but smudged the numbers. Only the great circle on the net survived (teal).', strike: 225, dip: 28,
    why: 'Strike 225°, dip 28° toward 315° (NW). The Abakaliki folds trend NE–SW, so their limbs strike NE–SW and dip NW or SE. A limb that dips NW sits on the north-western side of the fold axis.' },
  { id: 'delta', place: 'Growth fault, Niger Delta (from seismic)', story: 'An interpreter traced this fault plane on a seismic line and plotted it, but the table of numbers was lost.', strike: 100, dip: 55,
    why: 'Strike 100°, dip 55° toward 190° (roughly S). Most Niger Delta growth faults dip basinward, toward the south and south-west, and flatten with depth into the overpressured Akata shale.' },
  { id: 'ibadan', place: 'Gneiss foliation, Ibadan', story: 'A student logged the foliation in a migmatite-gneiss road cut, then dropped the notebook in a stream.', strike: 10, dip: 72,
    why: 'Strike 010°, dip 72° toward 100° (E). Foliation in the Ibadan area follows the roughly N–S Pan-African structural grain and is usually steep, so its great circle runs near the centre of the net.' },
];
function angleBetween(a, b){ return Math.acos(clamp(a[0] * b[0] + a[1] * b[1] + a[2] * b[2], -1, 1)) / DEG; }

function NetModule({ themeKey, award }){
  const [strike, setStrike] = usePersist('m2.strike', 45);
  const [dip, setDip] = usePersist('m2.dip', 30);
  const [morph, setMorph] = useState(0);
  const [ci, setCi] = usePersist('m2.ci', 0);
  const [solved, setSolved] = usePersist('m2.solved', {});
  const [fb, setFb] = useState(null);
  const [left, leftApi, errL] = useStage({ cam: [6.6, 4.6, 7.6], target: [0, -0.5, 0], fov: 38, minD: 4, maxD: 30, fit: 4.9 }, buildOutcrop);
  const [right, rightApi, errR] = useStage({ cam: [3.4, 2.8, 4.4], target: [0, -0.6, 0], fov: 40, minD: 2.5, maxD: 20, fit: 2.7 }, buildNet);
  const ch = NET_CHALLENGES[ci % NET_CHALLENGES.length];
  useEffect(() => { const t = readTheme(); leftApi.current && leftApi.current.setTheme(t); rightApi.current && rightApi.current.setTheme(t); }, [themeKey]);
  useEffect(() => { leftApi.current && leftApi.current.setPlane(strike, dip); rightApi.current && rightApi.current.setPlane(strike, dip); }, [strike, dip]);
  useEffect(() => { rightApi.current && rightApi.current.setMorph(morph); }, [morph]);
  useEffect(() => { rightApi.current && rightApi.current.setGhost({ strike: ch.strike, dip: ch.dip }); setFb(null); }, [ci]);
  const anim = useRef(0);
  const play = to => { cancelAnimationFrame(anim.current); const from = morph, t0 = performance.now();
    if (to === 1 && rightApi.current) rightApi.current.mapView(); if (to === 0 && rightApi.current) rightApi.current.bowlView();
    const step = now => { const u = Math.min(1, (now - t0) / 1100), e = u < .5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2; setMorph(lerp(from, to, e)); if (u < 1) anim.current = requestAnimationFrame(step); };
    anim.current = requestAnimationFrame(step); };
  useEffect(() => () => cancelAnimationFrame(anim.current), []);
  const dd = mod360(strike + 90), pTrend = mod360(dd + 180), pPl = 90 - dip;
  const check = () => {
    const ang = angleBetween(poleVec(strike, dip), poleVec(ch.strike, ch.dip));
    if (ang <= 6) { setFb({ ok: true, ang }); setSolved(s => ({ ...s, [ch.id]: true })); award('m2:' + ch.id); return; }
    const tips = [];
    if (dip < ch.dip - 4) tips.push('Your great circle hugs the rim more than your partner\'s. What does a great circle near the rim say about how steep the bed is?');
    else if (dip > ch.dip + 4) tips.push('Your great circle runs closer to the centre than your partner\'s. What does that say about steepness?');
    const sd = Math.abs(((strike - ch.strike + 540) % 360) - 180);
    if (sd > 5) tips.push('Look at the two points where each great circle meets the rim. Those points are the strike line. Do yours sit in the same places?');
    setFb({ ok: false, ang, tips });
  };
  return html`<div className="h-full flex flex-col lg:flex-row gap-3 pb-3 min-h-0">
    <section className="flex-[1.15] lg:flex-1 min-h-[240px] grid grid-cols-2 gap-2 lg:gap-3" aria-label="Outcrop and stereonet views">
      <div className="viewport">
        <div ref=${left} className="absolute inset-0"></div>${errL && html`<${WebGLError} msg=${errL} />`}
        <div className="hud" style=${{ top: 8, left: 8 }}><div className="font-semibold">Outcrop</div><div>${f3(strike)}/${f2(dip)} ${quad(dd)}</div></div>
        <button className="hud-btn" style=${{ bottom: 8, right: 8 }} onClick=${() => leftApi.current && leftApi.current.reset()}>Reset</button>
      </div>
      <div className="viewport">
        <div ref=${right} className="absolute inset-0"></div>${errR && html`<${WebGLError} msg=${errR} />`}
        <div className="hud" style=${{ top: 8, left: 8 }}><div className="font-semibold">${morph < 0.5 ? 'Lower hemisphere' : 'Schmidt net'}</div><div>Pole ${f3(pTrend)}→${f2(pPl)}</div></div>
        <button className="hud-btn" style=${{ bottom: 8, right: 8 }} onClick=${() => rightApi.current && (morph > 0.5 ? rightApi.current.mapView() : rightApi.current.bowlView())}>Reset</button>
      </div>
    </section>
    <aside className="drawer flex-1 lg:flex-none lg:w-[390px]">
      <div className="scroll flex-1 p-4 flex flex-col gap-4 min-h-0">
        <div className="flex flex-col gap-1">
          <p className="eyebrow">Orient the bed · right-hand rule</p>
          <${Range} id="strike" label="Strike" value=${strike} min=${0} max=${359} onChange=${setStrike} fmt=${f3} />
          <${Range} id="dip" label="Dip" value=${dip} min=${0} max=${90} onChange=${setDip} fmt=${f2} />
        </div>
        <div className="readout">
          <div><span className="eyebrow">Dip dir.</span><b>${f3(dd)}°</b></div>
          <div><span className="eyebrow">Pole trend</span><b>${f3(pTrend)}°</b></div>
          <div><span className="eyebrow">Pole plunge</span><b>${f2(pPl)}°</b></div>
        </div>
        <div className="flex flex-col gap-2">
          <p className="eyebrow">Projection</p>
          <${Range} id="morph" label="3D bowl → flat equal-area net" value=${Math.round(morph * 100)} min=${0} max=${100} unit="%" onChange=${v => { cancelAnimationFrame(anim.current); setMorph(v / 100); }} />
          <div className="flex gap-2"><button className="btn flex-1" onClick=${() => play(0)}>Show bowl</button><button className="btn primary flex-1" onClick=${() => play(1)}>Flatten to net</button></div>
          <p className="text-[13px] text-mute">The red disc is your bed passed through the centre of the bowl. Where it cuts the bowl is the great circle. The pole P is the line at 90° to the bed, and it lands opposite the dip direction.</p>
        </div>
        <div className="card flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2"><p className="eyebrow">Recover the lost measurement · ${(ci % NET_CHALLENGES.length) + 1}/${NET_CHALLENGES.length}</p>${solved[ch.id] && html`<span className="text-[12px] font-semibold text-ok">Solved</span>`}</div>
          <p className="font-semibold leading-snug">${ch.place}</p>
          <p className="text-[14px] text-mute leading-snug">${ch.story} Rotate your bed until your red great circle sits on the teal one, then check.</p>
          <div className="flex gap-2"><button className="btn primary flex-1" onClick=${check}>Check my match</button><button className="btn" onClick=${() => setCi(i => i + 1)}>Next</button></div>
          ${fb && fb.ok && html`<div className="note ok"><strong>Matched within ${fb.ang.toFixed(1)}°. </strong>${ch.why}</div>`}
          ${fb && !fb.ok && html`<div className="note bad"><strong>Your pole is ${fb.ang.toFixed(0)}° from your partner's.</strong> ${fb.tips.join(' ')}</div>`}
        </div>
      </div>
    </aside>
  </div>`;
}

