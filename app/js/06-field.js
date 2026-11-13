/* Craton · 06-field.js
 * Field Station: digital Brunton (SVG + DeviceOrientation), procedural hand specimens, hand lens, acid test and the Socratic observation gate.
 * Loaded as a classic script; top-level consts are shared across files in load order (see app/index.html).
 */
'use strict';
/* ===================== module 3: field station & Brunton ===================== */
const CLUES = [
  { id: 'color', label: 'Colour index', opts: [['light', 'Light (leucocratic, <35% dark minerals)'], ['medium', 'Medium (mesocratic, 35–65%)'], ['dark', 'Dark (melanocratic, >65%)']] },
  { id: 'grain', label: 'Grain size', opts: [['vfine', 'Too fine to see'], ['fine', 'Fine (<1 mm)'], ['medium', 'Medium (1–5 mm)'], ['coarse', 'Coarse (>5 mm)']] },
  { id: 'hcl', label: 'Dilute HCl reaction', opts: [['strong', 'Strong fizz'], ['weak', 'Weak, only when powdered'], ['none', 'No reaction']] },
  { id: 'structure', label: 'Structure', opts: [['massive', 'Massive'], ['foliated', 'Foliated / banded'], ['bedded', 'Bedded / cross-bedded'], ['vesicular', 'Vesicular'], ['fossil', 'Fossiliferous']] },
];
const clueText = (cid, v) => { const c = CLUES.find(x => x.id === cid); const o = c && c.opts.find(o => o[0] === v); return o ? o[1].split(' (')[0].toLowerCase() : v; };
const ROCKS = {
  'Granite': { color: 'light', grain: 'coarse', hcl: 'none', structure: 'massive' },
  'Migmatite-gneiss': { color: 'medium', grain: 'medium', hcl: 'none', structure: 'foliated' },
  'Basalt': { color: 'dark', grain: 'vfine', hcl: 'none', structure: 'vesicular' },
  'Fossiliferous limestone': { color: 'light', grain: 'fine', hcl: 'strong', structure: 'fossil' },
  'Cross-bedded sandstone': { color: 'light', grain: 'medium', hcl: 'none', structure: 'bedded' },
  'Marble': { color: 'light', grain: 'medium', hcl: 'strong', structure: 'massive' },
  'Shale': { color: 'dark', grain: 'vfine', hcl: 'none', structure: 'bedded' },
  'Quartzite': { color: 'light', grain: 'medium', hcl: 'none', structure: 'massive' },
};
const SPECIMENS = [
  { id: 'A', kind: 'gneiss', seed: 11, from: 'Road cut, Ibadan–Ife road, Oyo State', name: 'Migmatite-gneiss',
    hints: { color: 'Compare the total area of dark bands with light bands. Is one clearly dominant, or are they roughly even?', grain: 'Use the hand lens. Can you pick out separate crystals, and are most of them a few millimetres across?', hcl: 'Did you see bubbles, or did the drop just sit there?', structure: 'Look at how the dark minerals are arranged. Random, or lined up in parallel wavy bands?' },
    reveal: 'Migmatite-gneiss, the most widespread rock of the Nigerian Basement Complex. Its banding formed when older rocks were partly melted and sheared during the Pan-African orogeny, around 600 million years ago. The inselbergs and road cuts around Ibadan and Ile-Ife are full of it.' },
  { id: 'B', kind: 'granite', seed: 23, from: 'Boulder at the foot of Olumo Rock, Abeokuta', name: 'Granite',
    hints: { color: 'Estimate the dark specks as a share of the whole surface. Is it closer to a tenth or to a half?', grain: 'Measure a pink feldspar against the 1 cm scale bar. How many millimetres?', hcl: 'Did you see bubbles, or did the drop just sit there?', structure: 'Do the crystals line up in any direction, or are they scattered randomly?' },
    reveal: 'Pan-African Older Granite, like Olumo Rock and the Idanre Hills. Large interlocking feldspar crystals grew as magma cooled slowly kilometres below the surface. Light colour, coarse grains, no fizz and no fabric together point to a felsic plutonic rock.' },
  { id: 'C', kind: 'basalt', seed: 37, from: 'Lava flow, Jos Plateau', name: 'Basalt',
    hints: { color: 'Is there anything light in this rock apart from a few filled holes?', grain: 'Even under the 10× lens, can you see individual crystals?', hcl: 'Did you see bubbles, or did the drop just sit there?', structure: 'What are the round holes? Are they fossils, or something left by gas?' },
    reveal: 'Newer Basalt from the Jos Plateau. Lava erupted at the surface and cooled too fast for visible crystals to grow. The holes are vesicles, frozen gas bubbles; the white-filled ones are amygdales.' },
  { id: 'D', kind: 'limestone', seed: 41, from: 'Quarry face, Ewekoro, Ogun State', name: 'Fossiliferous limestone',
    hints: { color: 'Is this rock pale, mid-grey or dark overall?', grain: 'Ignore the shells for a moment. Can you see the grains of the rock between them?', hcl: 'Watch the drop closely after you apply the acid.', structure: 'What are those ribbed fan shapes and small discs?' },
    reveal: 'Ewekoro limestone from the Dahomey Basin, quarried for cement. A strong fizz in cold dilute HCl confirms calcite, and the shell fragments record a warm, shallow Paleocene sea.' },
  { id: 'E', kind: 'sandstone', seed: 53, from: 'Escarpment near Enugu, Anambra Basin', name: 'Cross-bedded sandstone',
    hints: { color: 'Are there dark minerals here at all, or is it mostly pale grains?', grain: 'With the lens, can you see sand grains? Are they nearer 0.5 mm or 5 mm?', hcl: 'Did you see bubbles, or did the drop just sit there?', structure: 'Look at the thin inclined lines between the flat surfaces. What made them?' },
    reveal: 'Ajali Sandstone from the Anambra Basin, an important aquifer around Enugu. The inclined laminae inside each set are cross-beds left by migrating dunes or tidal bars, and they show which way the current flowed.' },
  { id: 'F', kind: 'marble', seed: 67, from: 'Quarry, Igbeti, Oyo State', name: 'Marble',
    hints: { color: 'Is this rock pale or dark overall?', grain: 'Under the lens, what size are the sugary crystals?', hcl: 'Watch the drop closely after you apply the acid.', structure: 'Are there any layers, bands or fossils, or does the rock look the same in every direction?' },
    reveal: 'Marble from Igbeti in Oyo State. Metamorphism recrystallized limestone into a sugary mosaic of calcite, so it still fizzes in acid but has lost its fossils and bedding.' },
];
SPECIMENS.forEach(s => { s.truth = ROCKS[s.name]; });

function Compass({ heading, tilt }){
  const ticks = [];
  for (let a = 0; a < 360; a += 5) { const long = a % 30 === 0, r1 = 92, r2 = long ? 81 : 87;
    ticks.push(html`<line key=${a} x1=${100 + r1 * Math.sin(a * DEG)} y1=${100 - r1 * Math.cos(a * DEG)} x2=${100 + r2 * Math.sin(a * DEG)} y2=${100 - r2 * Math.cos(a * DEG)} stroke="currentColor" strokeWidth=${long ? 1.6 : 0.7} />`); }
  const labels = [];
  for (let a = 0; a < 360; a += 30) { const t = a === 0 ? 'N' : a === 90 ? 'E' : a === 180 ? 'S' : a === 270 ? 'W' : String(a);
    labels.push(html`<text key=${'l' + a} x=${100 + 70 * Math.sin(a * DEG)} y=${100 - 70 * Math.cos(a * DEG)} textAnchor="middle" dominantBaseline="central" fontSize=${a % 90 === 0 ? 13 : 9} fontWeight=${a % 90 === 0 ? 700 : 500} fill=${a === 0 ? 'var(--acc)' : 'currentColor'} transform=${`rotate(${a} ${100 + 70 * Math.sin(a * DEG)} ${100 - 70 * Math.cos(a * DEG)})`}>${t}</text>`); }
  const clin = [];
  for (let a = -90; a <= 90; a += 10) { const ang = (a + 90) * DEG; const x1 = 100 - 46 * Math.cos(ang), y1 = 100 + 46 * Math.sin(ang), x2 = 100 - (a % 30 === 0 ? 39 : 42) * Math.cos(ang), y2 = 100 + (a % 30 === 0 ? 39 : 42) * Math.sin(ang);
    clin.push(html`<line key=${'c' + a} x1=${x1} y1=${y1} x2=${x2} y2=${y2} stroke="currentColor" strokeWidth="0.8" />`); }
  const pAng = (tilt + 90) * DEG;
  const bub = clamp(tilt, -30, 30) * 0.75;
  return html`<svg viewBox="0 0 200 200" className="w-full h-auto max-w-[300px] mx-auto text-ink" role="img" aria-label=${'Digital Brunton reading azimuth ' + f3(heading) + ' degrees, inclination ' + Math.round(tilt) + ' degrees'} style=${{ fontFamily: 'var(--f-mono)' }}>
    <circle cx="100" cy="100" r="98" fill="var(--chip)" stroke="currentColor" strokeWidth="2" />
    <g transform=${`rotate(${-heading} 100 100)`} style=${{ transition: 'transform 120ms linear' }}>${ticks}${labels}
      <polygon points="100,35 105,100 95,100" fill="var(--acc)" /><polygon points="100,165 105,100 95,100" fill="var(--panel)" stroke="currentColor" strokeWidth="0.8" /></g>
    <path d="M 54 100 A 46 46 0 0 0 146 100" fill="none" stroke="currentColor" strokeWidth="0.8" />${clin}
    <line x1="100" y1="100" x2=${100 - 44 * Math.cos(pAng)} y2=${100 + 44 * Math.sin(pAng)} stroke="var(--acc2)" strokeWidth="2.4" strokeLinecap="round" />
    <rect x="70" y="140" width="60" height="12" rx="6" fill="var(--panel)" stroke="currentColor" strokeWidth="0.8" />
    <line x1="100" y1="140" x2="100" y2="152" stroke="currentColor" strokeWidth="0.6" />
    <circle cx=${100 + bub} cy="146" r="4.2" fill="var(--acc2)" opacity="0.8" />
    <circle cx="100" cy="100" r="4" fill="currentColor" />
    <polygon points="100,2 94,12 106,12" fill="currentColor" />
  </svg>`;
}

function SpecimenView({ spec, lens, acidAt }){
  const cv = useRef(null), wrap = useRef(null);
  const pat = useMemo(() => { const c = document.createElement('canvas'); c.width = c.height = 512; paintRock(c.getContext('2d'), 512, spec.kind, spec.seed); return c; }, [spec.id]);
  const shape = useMemo(() => { const r = rng(spec.seed * 31); const pts = []; for (let i = 0; i < 26; i++) { const a = i / 26 * Math.PI * 2; pts.push([a, 0.82 + r() * 0.2 + (i % 3 === 0 ? -0.06 : 0)]); } return pts; }, [spec.id]);
  useEffect(() => {
    let raf = 0, alive = true;
    const draw = () => {
      if (!alive) return;
      const c = cv.current, w = wrap.current.clientWidth, h = wrap.current.clientHeight, dpr = Math.min(window.devicePixelRatio || 1, 2);
      if (!w || !h) return;
      if (c.width !== Math.round(w * dpr)) { c.width = Math.round(w * dpr); c.height = Math.round(h * dpr); }
      const x = c.getContext('2d'); x.setTransform(dpr, 0, 0, dpr, 0, 0); x.clearRect(0, 0, w, h);
      const t = readTheme(), cx = w * 0.5, cy = h * 0.5, R0 = Math.min(w * 0.42, h * 0.42);
      const path = () => { x.beginPath(); shape.forEach(([a, k], i) => { const px = cx + Math.cos(a) * R0 * k * 1.25, py = cy + Math.sin(a) * R0 * k * 0.9; i ? x.lineTo(px, py) : x.moveTo(px, py); }); x.closePath(); };
      x.save(); x.translate(6, 10); path(); x.fillStyle = 'rgba(0,0,0,0.18)'; x.filter = 'blur(6px)'; x.fill(); x.restore(); x.filter = 'none';
      x.save(); path(); x.clip();
      const p = x.createPattern(pat, 'repeat'); const sc = 0.55; x.save(); x.translate(cx, cy); x.scale(sc, sc); x.fillStyle = p; x.fillRect(-w / sc, -h / sc, 2 * w / sc, 2 * h / sc); x.restore();
      const g = x.createRadialGradient(cx - R0 * .5, cy - R0 * .5, R0 * .1, cx, cy, R0 * 1.3); g.addColorStop(0, 'rgba(255,255,255,0.22)'); g.addColorStop(.6, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(0,0,0,0.35)'); x.fillStyle = g; x.fillRect(0, 0, w, h);
      // acid test
      const age = acidAt ? (performance.now() - acidAt) / 1000 : 99, dx = cx + R0 * 0.25, dy = cy - R0 * 0.05;
      if (age < 6) {
        const fade = age > 5 ? 6 - age : 1;
        x.globalAlpha = 0.55 * fade; x.fillStyle = '#cfe7ee'; x.beginPath(); x.ellipse(dx, dy, 24, 15, 0, 0, Math.PI * 2); x.fill();
        x.globalAlpha = 0.9 * fade; x.fillStyle = 'rgba(255,255,255,.8)'; x.beginPath(); x.ellipse(dx - 8, dy - 5, 6, 3, -0.4, 0, Math.PI * 2); x.fill();
        if (spec.truth.hcl === 'strong' && age > 0.4) {
          const br = rng(5);
          for (let i = 0; i < 34; i++) { const ph = br() * 1.2, life = ((age - ph) % 1.2) / 1.2; if (age < ph) continue;
            const bx = dx + (br() - .5) * 40, by = dy + (br() - .5) * 16 - life * 26, rr = 1 + br() * 2.6;
            x.globalAlpha = (1 - life) * fade; x.strokeStyle = '#ffffff'; x.lineWidth = 1; x.beginPath(); x.arc(bx, by, rr, 0, Math.PI * 2); x.stroke(); }
        }
        x.globalAlpha = 1;
      }
      x.restore();
      path(); x.strokeStyle = 'rgba(0,0,0,0.35)'; x.lineWidth = 1.2; x.stroke();
      if (lens) {
        const lr = Math.min(w, h) * 0.3, lx = cx - R0 * 0.2, ly = cy;
        x.save(); x.beginPath(); x.arc(lx, ly, lr, 0, Math.PI * 2); x.clip();
        const zs = sc * 3.2; x.translate(lx, ly); x.scale(zs, zs); x.fillStyle = p; x.fillRect(-lr / zs * 2, -lr / zs * 2, lr / zs * 4, lr / zs * 4); x.restore();
        x.beginPath(); x.arc(lx, ly, lr, 0, Math.PI * 2); x.lineWidth = 7; x.strokeStyle = t.ink; x.stroke();
        x.fillStyle = t.ink; x.font = '600 12px "IBM Plex Mono", monospace'; x.textAlign = 'center'; x.fillText('10× hand lens', lx, ly + lr + 18); x.textAlign = 'left';
      }
      // scale bar: 1 cm ≈ 44 px in the normal view
      x.fillStyle = t.ink; x.fillRect(14, h - 22, 44, 4); x.font = '500 11px "IBM Plex Mono", monospace'; x.fillText('1 cm', 14, h - 28);
      if (age < 6) raf = requestAnimationFrame(draw);
    };
    draw();
    const ro = new ResizeObserver(draw); ro.observe(wrap.current);
    return () => { alive = false; cancelAnimationFrame(raf); ro.disconnect(); };
  }, [spec.id, lens, acidAt]);
  return html`<div ref=${wrap} className="relative w-full h-[230px] sm:h-[280px]"><canvas ref=${cv} className="w-full h-full block" role="img" aria-label=${'Hand specimen ' + spec.id + (lens ? ', viewed through a 10× hand lens' : '')}></canvas></div>`;
}

function FieldModule({ award }){
  const [heading, setHeading] = usePersist('m3.heading', 10);
  const [tilt, setTilt] = usePersist('m3.tilt', 72);
  const [sensor, setSensor] = useState(false);
  const [sensorMsg, setSensorMsg] = useState('');
  const [log, setLog] = usePersist('m3.log', []);
  const [sid, setSid] = usePersist('m3.sid', 'A');
  const [obs, setObs] = usePersist('m3.obs', {});
  const [lens, setLens] = useState(false);
  const [acidAt, setAcidAt] = useState(0);
  const [idPick, setIdPick] = useState('');
  const spec = SPECIMENS.find(s => s.id === sid) || SPECIMENS[0];
  const o = obs[spec.id] || {};
  const setO = patch => setObs(all => ({ ...all, [spec.id]: { ...(all[spec.id] || {}), ...patch } }));
  const pending = useRef(null), got = useRef(false);
  useEffect(() => {
    if (!sensor) return;
    let raf = 0;
    const onOri = e => {
      let hd = e.webkitCompassHeading != null ? e.webkitCompassHeading : (e.alpha != null ? 360 - e.alpha : null);
      if (hd == null || e.beta == null) return; got.current = true;
      pending.current = { h: mod360(hd), t: clamp(e.beta, -90, 90) };
      if (!raf) raf = requestAnimationFrame(() => { raf = 0; const p = pending.current; if (p) { setHeading(Math.round(p.h)); setTilt(Math.round(p.t)); } });
    };
    window.addEventListener('deviceorientation', onOri);
    const to = setTimeout(() => { if (!got.current) { setSensor(false); setSensorMsg('No orientation data arrived from this device or browser. Use the sliders instead.'); } }, 1800);
    return () => { window.removeEventListener('deviceorientation', onOri); cancelAnimationFrame(raf); clearTimeout(to); };
  }, [sensor]);
  const enableSensor = async () => {
    setSensorMsg(''); got.current = false;
    try {
      if (typeof DeviceOrientationEvent === 'undefined') throw new Error('none');
      if (typeof DeviceOrientationEvent.requestPermission === 'function') { const r = await DeviceOrientationEvent.requestPermission(); if (r !== 'granted') throw new Error('denied'); }
      setSensor(true);
    } catch (e) { setSensor(false); setSensorMsg(e.message === 'denied' ? 'Motion access was declined. Use the sliders instead.' : 'This browser does not expose orientation sensors here. Use the sliders instead.'); }
  };
  const allLogged = CLUES.every(c => o[c.id]);
  const checked = o.checked || null;
  const stale = checked && CLUES.some(c => checked[c.id] !== o[c.id]);
  const clueOk = checked ? CLUES.every(c => checked[c.id] === spec.truth[c.id]) : false;
  const askMentor = () => { setO({ checked: CLUES.reduce((m, c) => (m[c.id] = o[c.id], m), {}), idTries: o.idTries || [] }); };
  const proposeId = () => {
    if (!idPick) return;
    const tries = [...(o.idTries || []), idPick];
    if (idPick === spec.name) { setO({ idTries: tries, solved: true }); award('m3:' + spec.id); } else setO({ idTries: tries });
  };
  const lastWrong = o.idTries && o.idTries.length && !o.solved ? o.idTries[o.idTries.length - 1] : null;
  const contrast = (() => {
    if (!lastWrong) return null; const typ = ROCKS[lastWrong]; const c = CLUES.find(c => typ[c.id] !== spec.truth[c.id]);
    if (!c) return null;
    return 'A typical ' + lastWrong.toLowerCase() + ' would show ' + clueText(c.id, typ[c.id]) + ' for ' + c.label.toLowerCase() + '. You logged ' + clueText(c.id, o[c.id]) + '. Which do you trust: the textbook or your own observation?';
  })();

  return html`<div className="h-full scroll pb-4">
    <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)] items-start">
      <section className="drawer p-4 flex flex-col gap-3" aria-label="Digital Brunton compass">
        <div className="flex items-baseline justify-between gap-2"><h2 className="display text-xl">Digital Brunton</h2><span className="eyebrow">compass · clinometer</span></div>
        <${Compass} heading=${heading} tilt=${tilt} />
        <div className="readout"><div><span className="eyebrow">Azimuth</span><b>${f3(heading)}°</b></div><div><span className="eyebrow">Inclination</span><b>${tilt > 0 ? '+' : ''}${Math.round(tilt)}°</b></div><div><span className="eyebrow">Quadrant</span><b>${quad(heading)}</b></div></div>
        <${Range} id="heading" label="Azimuth (rotate the compass)" value=${heading} min=${0} max=${359} onChange=${setHeading} fmt=${f3} disabled=${sensor} />
        <${Range} id="tilt" label="Inclination (tilt the clinometer)" value=${tilt} min=${-90} max=${90} onChange=${setTilt} disabled=${sensor} />
        <div className="flex flex-wrap gap-2">
          <button className="btn" aria-pressed=${sensor} onClick=${() => sensor ? setSensor(false) : enableSensor()}>${sensor ? 'Stop phone sensors' : 'Use phone sensors'}</button>
          <button className="btn primary" onClick=${() => setLog(l => [{ s: Math.round(heading), d: Math.abs(Math.round(tilt)), spec: spec.id, t: Date.now() }, ...l].slice(0, 30))}>Log as strike/dip</button>
        </div>
        ${sensorMsg && html`<p className="text-[13px] text-mute">${sensorMsg}</p>`}
        <p className="text-[13px] text-mute">Lay the phone's long edge along the bed for strike, then turn it to face down-dip and tilt for dip. Correct for your local magnetic declination before plotting.</p>
        ${log.length > 0 && html`<div className="flex flex-col gap-1"><div className="flex justify-between items-center"><p className="eyebrow">Field log · saved on this device</p><button className="text-[12px] text-mute underline" onClick=${() => setLog([])}>Clear</button></div>
          <ol className="mono text-[13px] flex flex-col gap-0.5">${log.slice(0, 6).map((r, i) => html`<li key=${r.t + ':' + i} className="flex justify-between border-b border-line py-1"><span>${f3(r.s)}/${f2(r.d)}</span><span className="text-mute">specimen ${r.spec} · ${new Date(r.t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></li>`)}</ol></div>`}
      </section>

      <section className="drawer p-4 flex flex-col gap-3" aria-label="Socratic observation gate">
        <div className="flex items-baseline justify-between gap-2 flex-wrap"><h2 className="display text-xl">Field Station</h2><span className="eyebrow">observe → log → defend</span></div>
        <div className="flex gap-2 flex-wrap" role="group" aria-label="Specimens">${SPECIMENS.map(s => html`<button key=${s.id} className="chipbtn" aria-pressed=${s.id === spec.id} onClick=${() => { setSid(s.id); setLens(false); setAcidAt(0); setIdPick(''); }}>${s.id}${(obs[s.id] || {}).solved ? ' ✓' : ''}</button>`)}</div>
        <p className="text-[14px]"><span className="font-semibold">Specimen ${spec.id}</span> <span className="text-mute">· ${spec.from}</span></p>
        <div className="rounded-xl border border-line bg-chip overflow-hidden"><${SpecimenView} spec=${spec} lens=${lens} acidAt=${acidAt} /></div>
        <div className="flex gap-2 flex-wrap">
          <button className="btn" aria-pressed=${lens} onClick=${() => setLens(l => !l)}>${lens ? 'Put lens away' : 'Hand lens 10×'}</button>
          <button className="btn" onClick=${() => { setAcidAt(performance.now()); setO({ acid: true }); }}>Drop dilute HCl</button>
        </div>
        <div className="flex flex-col gap-3">
          ${CLUES.map(c => { const lockedAcid = c.id === 'hcl' && !o.acid; const verdict = checked && !stale ? (checked[c.id] === spec.truth[c.id]) : null;
            return html`<fieldset key=${c.id} className="flex flex-col gap-1.5">
              <legend className="flex items-center gap-2 mb-1"><span className="eyebrow">${c.label}</span>${verdict === true && html`<span className="text-[12px] font-semibold text-ok">confirmed</span>`}${verdict === false && html`<span className="text-[12px] font-semibold text-bad">look again</span>`}</legend>
              <div className="flex flex-wrap gap-1.5">${c.opts.map(([v, lab]) => html`<button key=${v} className="chipbtn" aria-pressed=${o[c.id] === v} disabled=${lockedAcid || o.solved} onClick=${() => setO({ [c.id]: v })}>${lab}</button>`)}</div>
              ${lockedAcid && html`<p className="text-[12px] text-mute">Do the acid test first.</p>`}
              ${verdict === false && html`<p className="text-[13px] text-bad">${spec.hints[c.id]}</p>`}
            </fieldset>`; })}
        </div>
        <div className="card flex flex-col gap-2">
          <p className="eyebrow">Field Demonstrator</p>
          ${!allLogged && html`<p className="text-[14px] text-mute">Log all four clues and I will check your evidence. I will not name the rock until you defend an identification.</p>`}
          ${allLogged && (!checked || stale) && !o.solved && html`<button className="btn primary" onClick=${askMentor}>${stale ? 'Ask me to re-check' : 'Ask the Field Demonstrator'}</button>`}
          ${checked && !stale && !clueOk && html`<p className="text-[14px]">Some of your evidence does not match what is in your hand. Read the notes marked “look again”, observe again, and revise.</p>`}
          ${checked && !stale && clueOk && !o.solved && html`<div className="flex flex-col gap-2">
            <p className="text-[14px]">Your four clues are solid. Now commit: what is this rock?</p>
            <label htmlFor="idpick" className="sr-only">Identification</label>
            <select id="idpick" className="btn w-full" value=${idPick} onChange=${e => setIdPick(e.target.value)}><option value="">Choose a rock name…</option>${Object.keys(ROCKS).map(n => html`<option key=${n} value=${n}>${n}</option>`)}</select>
            <button className="btn primary" disabled=${!idPick} onClick=${proposeId}>Defend this identification</button>
            ${contrast && html`<div className="note bad">${contrast}</div>`}
          </div>`}
          ${o.solved && html`<div className="note ok"><strong>${spec.name}. </strong>${spec.reveal}</div>`}
          ${o.solved && html`<button className="text-[13px] text-mute underline self-start" onClick=${() => setObs(all => { const n = { ...all }; delete n[spec.id]; return n; })}>Reset this specimen</button>`}
        </div>
      </section>
    </div>
  </div>`;
}

