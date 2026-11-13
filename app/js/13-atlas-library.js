/* Craton · 13-atlas-library.js
 * 3D Atlas registry (ATLAS list, groups, icons), the picking/highlight engine and the Atlas library + viewer screens.
 * Loaded as a classic script; top-level consts are shared across files in load order (see app/index.html).
 */
'use strict';
const ATLAS = [M_INTERIOR, M_PLATES, M_QUAKE, M_OROGEN, M_MINERALS, M_META, M_VOLCANO, M_HOTSPOT, M_INTRUSION, M_FOLDS, M_UNCONF, M_FOSSILS, M_VALLEY, M_GROUND, M_DELTA, M_DUNES, M_KARST, M_GULLY, M_SLIDE, M_OCEAN, M_CLIMATE, M_TRAPS, M_ORE];
const ATLAS_GROUPS = [
  { name: 'The Earth system', jumps: [] },
  { name: 'Earth materials', jumps: [{ tab: 'field', title: 'Rock identification', blurb: 'Hand lens, acid test and the Field Demonstrator. Lives in the Field module.' }] },
  { name: 'Magma and volcanoes', jumps: [] },
  { name: 'Structures and time', jumps: [{ tab: 'block', title: 'Faults and the strata block', blurb: 'Normal and thrust faults, peeling and cross-sections. Lives in the Block module.' }, { tab: 'net', title: 'Stereonets', blurb: 'Strike, dip and the lower-hemisphere projection. Lives in the Stereonet module.' }] },
  { name: 'Surface processes', jumps: [] },
  { name: 'Oceans and climate', jumps: [] },
  { name: 'Earth resources', jumps: [] },
];
const ATLAS_NEXT = [];
const ATLAS_ICONS = {
  hotspot: html`<rect x="2" y="24" width="44" height="6" fill="#3e4b53" /><path d="M6 24 L12 8 L18 24Z" fill="#5b5048" /><path d="M20 24 L25 14 L30 24Z" fill="#4e4a46" /><path d="M33 24 L37 19 L41 24Z" fill="#2f3a3f" /><rect x="10" y="30" width="4" height="14" fill="#ff5a1f" /><path d="M2 20H46" stroke="#2f7fb5" stroke-width="1.5" />`,
  slide: html`<path d="M2 44 V12 H18 Q32 22 46 40 V44Z" fill="#a0805a" /><path d="M18 12 Q16 30 36 34" fill="none" stroke="#3b2f26" stroke-width="2" stroke-dasharray="3 2" /><path d="M2 12H18" stroke="#5f8a4a" stroke-width="3" />`,
  orogen: html`<path d="M2 28 L14 26 L20 12 L24 6 L28 12 L34 26 L46 28 V36 L34 36 Q24 46 14 36 L2 36Z" fill="#b8945e" /><path d="M24 6 V42" stroke="#1f2a30" stroke-width="2" /><path d="M4 22 h7 M44 22 h-7" stroke="currentColor" stroke-width="2" />`,
  ocean: html`<rect x="2" y="12" width="44" height="32" fill="#2f7fb5" opacity=".35" /><path d="M2 14 H12 L16 16 Q20 34 24 36 H36 Q40 28 44 36 V44 H2Z" fill="#8f7c63" /><path d="M2 12 H10" stroke="#5f8a4a" stroke-width="3" />`,
  ore: html`<rect x="3" y="8" width="42" height="34" fill="#a39a8e" /><ellipse cx="22" cy="42" rx="14" ry="12" fill="#e0b3a0" /><path d="M16 30 L14 12 M22 30 V12 M28 30 L31 12" stroke="#5a4632" stroke-width="2" /><circle cx="22" cy="18" r="2" fill="#1d1a18" /><circle cx="36" cy="10" r="2.2" fill="#f2c14e" />`,
  climate: html`<path d="M2 30 L10 14 L18 26 L26 32 L46 36 V44 H2Z" fill="#7a8f52" /><path d="M4 26 Q10 6 18 24Z" fill="#eef5f8" stroke="#9aa0a0" /><rect x="22" y="31" width="24" height="13" fill="#2f7fb5" opacity=".6" /><path d="M22 28 H46" stroke="#2f7fb5" stroke-width="1.5" stroke-dasharray="3 2" />`,
  quake: html`<rect x="3" y="20" width="42" height="24" fill="#b8a07e" /><circle cx="22" cy="34" r="3" fill="#ff5a1f" /><circle cx="22" cy="34" r="9" fill="none" stroke="#ff8a3d" stroke-width="2" /><circle cx="22" cy="34" r="15" fill="none" stroke="#3fb2c9" stroke-width="2" /><path d="M20 20 L26 44" stroke="#b03c12" stroke-width="2" />`,
  delta: html`<rect x="2" y="2" width="44" height="44" fill="#2f7fb5" /><path d="M24 2 L24 14 Q8 24 10 40 Q24 30 38 40 Q40 24 24 14Z" fill="#4f7d3f" /><path d="M24 2V14 M24 14 L14 36 M24 14 L24 34 M24 14 L34 36" stroke="#9fd3f0" stroke-width="1.5" fill="none" />`,
  dunes: html`<path d="M2 38 Q14 18 22 26 L26 38 Z" fill="#e0b87a" /><path d="M22 26 L26 38 L22 38Z" fill="#b8894f" /><path d="M24 38 Q36 22 42 28 L46 38Z" fill="#e0b87a" /><path d="M2 40H46" stroke="#c9a46a" stroke-width="2" />`,
  karst: html`<rect x="3" y="8" width="42" height="36" fill="#cdd0c2" /><ellipse cx="24" cy="30" rx="12" ry="7" fill="#3a332c" /><path d="M18 24v4 M23 24v5 M29 24v3" stroke="#efe5cf" stroke-width="2" /><path d="M10 8 q4 6 8 0" fill="#e7ece8" />`,
  gully: html`<rect x="2" y="6" width="44" height="36" fill="#9a3d1c" /><path d="M24 42 L22 30 L26 20 L23 10 M22 30 L12 24 M26 20 L36 16" stroke="#efe0c0" stroke-width="4" stroke-linecap="round" fill="none" />`,
  traps: html`<path d="M2 30 Q24 8 46 30 V36 Q24 14 2 36Z" fill="#4a4f53" /><path d="M2 36 Q24 14 46 36 V42 Q24 20 2 42Z" fill="#a9c1cc" /><path d="M16 22 Q24 15 32 22 Q24 19 16 22Z" fill="#d9483b" /><path d="M13 27 Q24 17 35 27 Q24 21 13 27Z" fill="#3f8f3a" />`,
  meta: html`<rect x="4" y="8" width="40" height="32" fill="#8d8576" /><path d="M8 16h14 M26 16h14 M10 24h12 M26 24h12 M8 32h14 M26 32h14" stroke="#2a2622" stroke-width="3" /><circle cx="24" cy="20" r="3" fill="#a3243b" />`,
  fossils: html`<rect x="6" y="4" width="36" height="40" fill="#cdd0c2" /><path d="M6 17H42 M6 30H42" stroke="#8d8f86" stroke-width="1.5" /><path d="M24 23 m-5 0 a5 5 0 1 0 5-5 a3 3 0 1 0 3 3" fill="none" stroke="#7d5f3e" stroke-width="2" /><ellipse cx="22" cy="38" rx="4" ry="5" fill="#4b3b2c" />`,
  interior: html`<circle cx="24" cy="24" r="19" fill="#8a7560" /><path d="M24 24 L24 5 A19 19 0 0 1 43 24 Z" fill="var(--panel)" /><circle cx="24" cy="24" r="11" fill="#e8873a" /><circle cx="24" cy="24" r="4.5" fill="#f2c14e" /><path d="M24 24 L24 5 A19 19 0 0 1 43 24 Z" fill="none" />`,
  plates: html`<rect x="3" y="20" width="18" height="8" fill="#3e4b53" /><rect x="27" y="20" width="18" height="8" fill="#3e4b53" /><rect x="21" y="16" width="6" height="22" fill="#ff5a1f" /><rect x="3" y="30" width="42" height="12" fill="#d9692c" />`,
  minerals: html`<circle cx="14" cy="14" r="6" fill="#5fb46a" /><circle cx="34" cy="14" r="3.5" fill="#9b7fd1" /><circle cx="14" cy="34" r="3.5" fill="#9b7fd1" /><circle cx="34" cy="34" r="6" fill="#5fb46a" /><path d="M14 14H34V34H14Z" fill="none" stroke="currentColor" stroke-width="1.5" />`,
  volcano: html`<path d="M2 40 L19 12 h10 L46 40 Z" fill="#6e6a66" /><path d="M23 13 V40" stroke="#ff5a1f" stroke-width="3" /><ellipse cx="24" cy="42" rx="9" ry="3.5" fill="#ff5a1f" />`,
  intrusion: html`<rect x="3" y="6" width="42" height="36" fill="#d7b57d" /><ellipse cx="17" cy="42" rx="13" ry="11" fill="#d9a58e" /><rect x="30" y="6" width="3" height="36" fill="#2f3134" /><rect x="33" y="24" width="12" height="3" fill="#2f3134" />`,
  folds: html`<path d="M3 30 Q24 2 45 30 V40 Q24 12 3 40Z" fill="#d7b57d" /><path d="M3 40 Q24 12 45 40 V46 H3Z" fill="#5d6266" />`,
  unconf: html`<g transform="rotate(-22 24 34)"><rect x="-4" y="26" width="56" height="6" fill="#b8945e" /><rect x="-4" y="32" width="56" height="6" fill="#6e7275" /><rect x="-4" y="38" width="56" height="8" fill="#d7b57d" /></g><rect x="3" y="8" width="42" height="7" fill="#cdd0c2" /><rect x="3" y="15" width="42" height="7" fill="#4a4f53" /><rect x="3" y="22" width="42" height="2" fill="#3b2f26" />`,
  valley: html`<path d="M3 10 L24 38 L45 10" fill="none" stroke="#5f8a4a" stroke-width="4" stroke-linejoin="round" /><path d="M8 10 Q10 38 24 38 Q38 38 40 10" fill="none" stroke="#9aa0a0" stroke-width="3" stroke-dasharray="3 3" />`,
  ground: html`<rect x="3" y="8" width="42" height="12" fill="#d8c08f" /><rect x="3" y="20" width="42" height="9" fill="#6f9bb0" /><rect x="3" y="29" width="42" height="6" fill="#62666b" /><rect x="3" y="35" width="42" height="8" fill="#8fa6a3" /><rect x="30" y="4" width="3" height="25" fill="#9aa3a8" />`,
};

function buildAtlas(stage, model){
  const { scene, camera, canvas } = stage;
  lights(scene); scene.background = new THREE.Color('#d5ded9');
  const parts = new Map(), pickables = [];
  const ctx = { scene, stage, clipOk: null, part(mesh, id){ mesh.userData.part = id; pickables.push(mesh); if (!parts.has(id)) parts.set(id, []); parts.get(id).push(mesh); return mesh; } };
  const inst = model.build(ctx);
  const tag = makeTag(model.tagScale); scene.add(tag);
  let anim = !(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches), hl = [];
  stage.onFrame = () => { if (anim && inst.tick) { inst.tick(performance.now() / 1000); return true; } return false; };
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  const shown = o => { while (o) { if (!o.visible) return false; o = o.parent; } return true; };
  function clearHL(){ hl.forEach(m => { m.emissive.copy(m.userData.e0); m.emissiveIntensity = m.userData.ei0; }); hl = []; }
  function highlight(id){
    clearHL();
    (parts.get(id) || []).forEach(mesh => { (Array.isArray(mesh.material) ? mesh.material : [mesh.material]).forEach(m => {
      if (!m.emissive || hl.includes(m)) return; if (!m.userData.e0) { m.userData.e0 = m.emissive.clone(); m.userData.ei0 = m.emissiveIntensity; }
      m.emissive.set('#ffb347').convertSRGBToLinear(); m.emissiveIntensity = 0.45; hl.push(m); }); });
  }
  function pick(cx, cy){
    const r = canvas.getBoundingClientRect();
    ndc.set(((cx - r.left) / r.width) * 2 - 1, -((cy - r.top) / r.height) * 2 + 1); ray.setFromCamera(ndc, camera);
    const hits = ray.intersectObjects(pickables.filter(shown), false).filter(h => !ctx.clipOk || ctx.clipOk(h.point));
    if (!hits.length) return null;
    const h = hits[0], raw = h.object.userData.part; let id = raw; if (inst.resolve) id = inst.resolve(h, id) || id;
    if (inst.regions && (inst.regions.includes(raw) || inst.regions.includes(id))) clearHL(); else highlight(id); tag.userData.set((model.parts[id] || {}).name || id);
    tag.position.copy(h.point).add(new THREE.Vector3(0, 0.5 * (model.tagScale || 1), 0)); tag.visible = true; stage.invalidate();
    return id;
  }
  function clear(){ clearHL(); tag.visible = false; stage.invalidate(); }
  return {
    setVariant(v){ clear(); inst.setVariant && inst.setVariant(v); stage.invalidate(); },
    setParam(v){ inst.setParam && inst.setParam(v); stage.invalidate(); },
    pick, clear, reset: stage.resetView,
    setAnim(a){ anim = a; stage.invalidate(); },
    setTheme(t){ scene.background.set(t.stage); scene.traverse(o => { if (o.userData && o.userData.theme) o.userData.theme(t); }); stage.invalidate(); },
  };
}

function AtlasModule({ themeKey, award, onJump, insights }){
  const [sel, setSel] = usePersist('atlas.sel', null);
  const model = ATLAS.find(m => m.id === sel);
  if (model) return html`<${AtlasViewer} key=${model.id} model=${model} themeKey=${themeKey} award=${award} onBack=${() => setSel(null)} />`;
  const done = id => insights.filter(s => s.startsWith('atlas:' + id + ':')).length;
  const total = m => Object.values(m.quiz).reduce((s, q) => s + q.length, 0);
  return html`<div className="h-full scroll pb-6">
    <div className="flex flex-col gap-1 py-2 max-w-[760px]">
      <h1 className="display text-[28px] leading-tight">The 3D Atlas</h1>
      <p className="text-mute text-[15px]">Pick a topic and open it in 3D. Tap any part to learn its name, then switch to Quiz and find it yourself. Topics follow the order of a standard physical geology course.</p>
    </div>
    ${ATLAS_GROUPS.map(g => html`<section key=${g.name} className="mt-5">
      <h2 className="eyebrow mb-2">${g.name}</h2>
      <div className="grid gap-3" style=${{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
        ${ATLAS.filter(m => m.group === g.name).map(m => html`<button key=${m.id} className="card text-left flex gap-3 items-start hover:border-acc" style=${{ minHeight: 44 }} onClick=${() => setSel(m.id)}>
          <svg width="48" height="48" viewBox="0 0 48 48" aria-hidden="true" className="flex-none text-ink">${ATLAS_ICONS[m.id]}</svg>
          <span className="flex flex-col gap-1 min-w-0">
            <span className="font-semibold text-[16px] leading-tight">${m.title}</span>
            <span className="text-[13px] text-mute leading-snug">${m.blurb}</span>
            <span className="mono text-[12px] text-mute">${(m.variants.length || 1) + (m.variants.length > 1 ? ' views' : ' view')} · ${done(m.id)}/${total(m)} solved</span>
          </span>
        </button>`)}
        ${g.jumps.map(j => html`<button key=${j.tab} className="card text-left flex flex-col gap-1" style=${{ borderStyle: 'dashed' }} onClick=${() => onJump(j.tab)}>
          <span className="font-semibold text-[16px] leading-tight">${j.title} →</span><span className="text-[13px] text-mute leading-snug">${j.blurb}</span></button>`)}
      </div>
    </section>`)}
    ${ATLAS_NEXT.length > 0 && html`<section className="mt-6">
      <h2 className="eyebrow mb-2">Coming next</h2>
      <div className="flex flex-wrap gap-2">${ATLAS_NEXT.map(t => html`<span key=${t} className="chipbtn" style=${{ borderStyle: 'dashed', color: 'var(--mute)' }}>${t}</span>`)}</div>
    </section>`}
  </div>`;
}

function AtlasViewer({ model, themeKey, award, onBack }){
  const [variant, setVariant] = usePersist('atlas.' + model.id + '.v', model.variants.length ? model.variants[0].id : 'all');
  const [param, setParam] = usePersist('atlas.' + model.id + '.p', model.slider ? (model.slider.def || 0) : 0);
  const [mode, setMode] = useState('explore');
  const [picked, setPicked] = useState(null);
  const [qi, setQi] = useState(0);
  const [tap, setTap] = useState(null);
  const [anim, setAnim] = useState(!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches));
  const [host, api, err] = useStage({ cam: model.cam, target: model.target, fov: 38, minD: 1.5, maxD: 40, fit: model.fit }, st => buildAtlas(st, model));
  useEffect(() => { api.current && api.current.setTheme(readTheme()); }, [themeKey]);
  useEffect(() => { api.current && api.current.setVariant(variant); setPicked(null); setQi(0); setTap(null); }, [variant]);
  useEffect(() => { api.current && api.current.setParam(param); }, [param, variant]);
  useEffect(() => { api.current && api.current.setAnim(anim); }, [anim]);
  const qs = model.quiz[variant] || model.quiz.all || [];
  const q = qs[qi % Math.max(1, qs.length)];
  const qid = 'atlas:' + model.id + ':' + variant + ':' + (qi % Math.max(1, qs.length));
  const sliderOn = model.slider && (!model.slider.for || model.slider.for.includes(variant));
  const local = (model.localV && model.localV[variant]) || model.local;
  const onTap = useTap((x, y) => {
    if (!api.current) return; const id = api.current.pick(x, y); if (!id) return;
    setPicked(id);
    if (mode === 'quiz' && q && q.type === 'tap' && !(tap && tap.ok)) {
      const ok = q.parts.includes(id); setTap(t => ({ ok, id, tries: ((t && t.tries) || 0) + 1 })); if (ok) award(qid);
    }
  });
  const nextQ = () => { setQi(i => i + 1); setTap(null); api.current && api.current.clear(); setPicked(null); };
  const pInfo = picked && model.parts[picked];
  return html`<div className="h-full flex flex-col lg:flex-row gap-3 pb-3 min-h-0">
    <section className="viewport flex-[1.15] lg:flex-1 min-h-[240px]" aria-label=${model.title + ' 3D model'}>
      <div ref=${host} className="absolute inset-0" ...${onTap}></div>
      ${err && html`<${WebGLError} msg=${err} />`}
      <div className="hud" style=${{ top: 10, left: 10 }}><div className="font-semibold">${model.title}</div><div>${model.slider && model.slider.text ? model.slider.text(param) : model.variants.length ? (model.variants.find(v => v.id === variant) || model.variants[0]).label : model.group}</div></div>
      <div className="hud hidden sm:block" style=${{ bottom: 10, left: 10 }}>${mode === 'quiz' ? 'Quiz: labels are hidden until you tap' : 'Drag to orbit · pinch to zoom · tap any part'}</div>
      <button className="hud-btn" style=${{ bottom: 10, right: 10 }} onClick=${() => api.current && api.current.reset()}>Reset view</button>
      ${model.animated && html`<button className="hud-btn" style=${{ top: 10, right: 10 }} aria-pressed=${anim} onClick=${() => setAnim(a => !a)}>${anim ? 'Pause motion' : 'Play motion'}</button>`}
    </section>
    <aside className="drawer flex-1 lg:flex-none lg:w-[390px]">
      <div className="p-3 pb-2 border-b border-line flex flex-col gap-2">
        <div className="flex items-center gap-2"><button className="chipbtn" onClick=${onBack}>← Atlas</button><span className="eyebrow truncate">${model.group}</span></div>
        <${Seg} label="Mode" value=${mode} onChange=${m => { setMode(m); setTap(null); }} items=${[{ id: 'explore', label: 'Explore' }, { id: 'quiz', label: 'Quiz me' }]} />
      </div>
      <div className="scroll flex-1 p-4 flex flex-col gap-4 min-h-0">
        ${model.variants.length > 1 && html`<div className="flex flex-col gap-2"><p className="eyebrow">Choose a view</p>
          <div className="flex flex-wrap gap-2">${model.variants.map(v => html`<button key=${v.id} className="chipbtn" aria-pressed=${variant === v.id} onClick=${() => { setVariant(v.id); if (v.param != null) setParam(v.param); }}>${v.label}</button>`)}</div></div>`}
        ${sliderOn && html`<div className="flex flex-col gap-1"><${Range} id=${'ap-' + model.id} label=${model.slider.label} value=${param} min=${0} max=${100} unit="%" onChange=${setParam} />${model.slider.text && html`<p className="mono text-[14px] font-semibold">${model.slider.text(param)}</p>`}</div>`}
        ${mode === 'explore' && html`
          ${pInfo ? html`<div className="card flex flex-col gap-1"><p className="eyebrow">You tapped</p><p className="font-semibold text-[17px] leading-tight">${pInfo.name}</p><p className="text-[14px] leading-snug">${pInfo.desc}</p></div>`
            : html`<div className="note">Tap any part of the model to see what it is. When you feel ready, switch to <strong>Quiz me</strong>.</div>`}
          ${model.note && html`<p className="text-[13px] text-mute">${model.note}</p>`}
        `}
        ${mode === 'quiz' && q && html`<div className="card flex flex-col gap-2">
          <div className="flex justify-between items-center"><p className="eyebrow">Question ${(qi % qs.length) + 1} of ${qs.length}</p></div>
          ${q.type === 'mc' ? html`<${Quiz} key=${qid + ':' + qi} q=${q.q} opts=${q.opts} a=${q.a} hint=${q.hint} why=${q.why} onSolved=${() => award(qid)} />` : html`
            <p className="text-[15px] font-medium leading-snug">${q.prompt}</p>
            ${!tap && html`<p className="text-[13px] text-mute">Tap your answer on the 3D model.</p>`}
            ${tap && !tap.ok && html`<div className="note bad"><strong>That's the ${(model.parts[tap.id] || {}).name || tap.id}. </strong>${tap.tries >= 2 ? q.hint + ' Keep looking.' : 'Not that one. Try again.'}</div>`}
            ${tap && tap.ok && html`<div className="note ok"><strong>Yes, that's it. </strong>${q.why}</div>`}`}
          <button className="btn self-start" onClick=${nextQ}>${qs.length > 1 ? 'Next question' : 'Ask again'}</button>
        </div>`}
        ${local && html`<div className="note info"><strong>Closer to home. </strong>${local}</div>`}
      </div>
    </aside>
  </div>`;
}

