/* Craton · 20-craton.js
 * Craton features: Today (daily challenge, streak, progress), Practice (exam bank, order-the-events puzzles), Explore Nigeria map, Field kit hub and first-run tour.
 * Loaded as a classic script; top-level consts are shared across files in load order (see app/index.html).
 */
'use strict';
/* ============================ Craton: today, practice, Nigeria, field kit ============================ */
const dayKey = (d = new Date()) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
const dayShift = (k, n) => { const [y, m, d] = k.split('-').map(Number); return dayKey(new Date(y, m - 1, d + n)); };
const strHash = s => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
function shuffled(arr, rnd){ const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

const EXAM_BANK = [
  { unit: 'Earth materials', topic: 'Minerals', model: 'minerals', q: 'On the Mohs scale, which of these minerals is the hardest?', opts: ['Calcite', 'Quartz', 'Talc', 'Feldspar'], a: 1, hint: 'Which of these minerals can scratch steel and window glass?', why: 'Quartz is 7 on the Mohs scale, feldspar 6, calcite 3 and talc 1. Quartz scratches glass; calcite does not.' },
  { unit: 'Earth materials', topic: 'Rock identification', tool: 'field', q: 'A rock fizzes strongly when a drop of cold, dilute HCl is added. Which mineral does it most likely contain?', opts: ['Quartz', 'Calcite', 'Mica', 'Feldspar'], a: 1, hint: 'Which carbonate mineral reacts with acid to release carbon dioxide gas?', why: 'Calcite (CaCO₃) reacts with acid and releases carbon dioxide bubbles. Limestone and marble fizz; dolomite fizzes only when powdered.' },
  { unit: 'Magma and volcanoes', topic: 'Igneous rocks', model: 'intrusion', q: 'Which igneous rock is coarse-grained and rich in quartz and feldspar?', opts: ['Basalt', 'Rhyolite', 'Granite', 'Gabbro'], a: 2, hint: 'Look for the rock that is both light-coloured (felsic) and cooled slowly deep underground (plutonic).', why: 'Granite is felsic and plutonic: slow cooling deep underground grew large crystals. Rhyolite has the same composition but is fine-grained because it cooled at the surface.' },
  { unit: 'Magma and volcanoes', topic: 'Igneous rocks', model: 'volcano', q: 'Basalt and gabbro have the same composition. Why does gabbro have much bigger crystals?', opts: ['It cooled slowly underground', 'It contains more water', 'It is much older', 'It was metamorphosed'], a: 0, hint: 'What gives atoms in a magma more time to grow into large crystals?', why: 'Crystal size records cooling rate. Gabbro cooled slowly in the crust; basalt cooled quickly as lava at the surface.' },
  { unit: 'Earth materials', topic: 'Metamorphism', model: 'meta', q: 'When limestone is metamorphosed, it becomes…', opts: ['Slate', 'Quartzite', 'Marble', 'Gneiss'], a: 2, hint: 'Limestone is made of calcite. Which metamorphic rock is also made of interlocking calcite crystals?', why: 'Heat and pressure recrystallise calcite into marble, which still fizzes in acid.' },
  { unit: 'Earth materials', topic: 'Metamorphism', model: 'meta', q: 'Quartz sandstone metamorphoses to…', opts: ['Quartzite', 'Schist', 'Marble', 'Phyllite'], a: 0, hint: 'The parent rock is almost pure quartz sand.', why: 'The quartz grains recrystallise and fuse into quartzite, a very hard rock that breaks through the grains rather than around them.' },
  { unit: 'Structures and time', topic: 'Faults', tool: 'block', q: 'In a normal fault, the hanging wall moves…', opts: ['Up relative to the footwall', 'Down relative to the footwall', 'Sideways only', 'Not at all'], a: 1, hint: 'Normal faults form when the crust is pulled apart (extension). Which way does gravity pull the upper block?', why: 'Normal faults form by extension, so the hanging wall slides down the fault plane. Reverse and thrust faults form by compression and push the hanging wall up.' },
  { unit: 'Structures and time', topic: 'Strike and dip', tool: 'net', q: 'Strike is…', opts: ['The steepest angle of a bed below horizontal', 'The compass direction of a horizontal line on a bed', 'The thickness of a bed', 'The direction a river flows'], a: 1, hint: 'Imagine water lapping against a tilted rock slab. The waterline is horizontal—what do we measure along it?', why: 'Strike is the direction of the line where a bed meets a horizontal plane. Dip is measured at right angles to strike, downward from horizontal.' },
  { unit: 'Structures and time', topic: 'Apparent dip', tool: 'block', q: 'A bed dips 40° to the east. A cross-section cut north–south through it shows the bed dipping…', opts: ['More than 40°', 'Exactly 40°', 'About 0°, it looks flat', 'Vertically'], a: 2, hint: 'If a bed dips east, what direction is its horizontal strike line?', why: 'A north–south section runs along the strike, so the apparent dip is zero. Only a section parallel to the dip direction shows the true dip.' },
  { unit: 'Structures and time', topic: 'Relative dating', model: 'intrusion', q: 'The principle of cross-cutting relationships says that…', opts: ['A rock or fault that cuts another is younger than what it cuts', 'Older rocks are always on top', 'Faults are always the oldest feature', 'Fossils cut across beds'], a: 0, hint: 'Can a crack or dike cut through a rock layer that has not formed yet?', why: 'You cannot cut through something that does not exist yet, so the cutting feature is always younger.' },
  { unit: 'The Earth system', topic: 'Plate boundaries', model: 'plates', variant: 'div', q: 'Which type of plate boundary creates new oceanic crust?', opts: ['Convergent', 'Transform', 'Divergent', 'None of them'], a: 2, hint: 'Where do two plates pull apart so magma can rise and fill the gap?', why: 'At divergent boundaries, mid-ocean ridges, rising mantle melts and fills the gap with new basalt crust.' },
  { unit: 'Surface processes', topic: 'Groundwater', model: 'ground', q: 'Clay can have high porosity but makes a poor aquifer. Why?', opts: ['Its pores are tiny and poorly connected, so its permeability is low', 'It has no pores at all', 'It dissolves in water', 'It is too hard to drill'], a: 0, hint: 'Think about the difference between holding water (porosity) and letting water flow through (permeability).', why: 'Porosity is how much space there is; permeability is how easily water flows through it. Clay holds water but lets it move only very slowly.' },
  { unit: 'Structures and time', topic: 'Fossils', model: 'fossils', q: 'Which makes the best index fossil?', opts: ['A species that lived a long time in one small area', 'A species that lived a short time but spread widely', 'Any very large fossil', 'A fossil found in granite'], a: 1, hint: 'To pin down a narrow age across different continents, think about how long the species lived and how far it spread.', why: 'Short-lived and widespread species pin a rock to a narrow slice of time and can be matched between distant places.' },
  { unit: 'Earth materials', topic: 'Sedimentary rocks', model: 'minerals', variant: 'halite', q: 'Rock salt (halite) is an example of a…', opts: ['Clastic sedimentary rock', 'Chemical sedimentary rock', 'Metamorphic rock', 'Igneous rock'], a: 1, hint: 'Does halite form from broken rock fragments, or by crystallising out of evaporating water?', why: 'Halite crystallises from evaporating salty water, so it is a chemical (evaporite) sedimentary rock.' },
  { unit: 'Structures and time', topic: 'Nigerian geology', model: 'folds', variant: 'anticline', q: 'The Benue Trough first formed as…', opts: ['A rift, as Africa and South America separated in the Cretaceous', 'A chain of hot-spot volcanoes', 'A glacial valley', 'A meteorite crater'], a: 0, hint: 'Think about what happened to West Africa when the South Atlantic Ocean opened.', why: 'The Benue Trough opened as a failed arm of the rift system that created the South Atlantic, then was folded during Santonian compression.' },
];
const CONTEXT_RX = /slider|watch|look |this (model|view|crystal|volcano|delta|dune|granite|block|bed|trap|valley|fold|basin|column)|\bthese (?!would\b)|\bhere\b|shown|move the|erode the|push |raise |start |drag |the arrows|tilt the|in the animation|right after|this v-|on the right|the house on/i;
const MC_POOL = (() => {
  const out = [];
  ATLAS.forEach(m => Object.entries(m.quiz).forEach(([v, qs]) => qs.forEach((q, i) => {
    if (q.type === 'mc' && !CONTEXT_RX.test(q.q)) out.push({ id: m.id + ':' + v + ':' + i, q: q.q, opts: q.opts, a: q.a, why: q.why, hint: q.hint, model: m.id, variant: v === 'all' ? null : v, unit: m.group, topic: m.title });
  })));
  EXAM_BANK.forEach((q, i) => out.push({ ...q, id: 'bank:' + i }));
  return out;
})();
const UNITS = ['The Earth system', 'Earth materials', 'Magma and volcanoes', 'Structures and time', 'Surface processes', 'Oceans and climate', 'Earth resources'];

function OpenLink({ item, go, label }){
  if (item.model) return html`<button className="chipbtn" onClick=${() => go.model(item.model, item.variant)}>${label || 'Open in 3D'} →</button>`;
  if (item.tool) return html`<button className="chipbtn" onClick=${() => go.tool(item.tool)}>${label || 'Open the tool'} →</button>`;
  return null;
}

/* ---------- Today ---------- */
function TodayModule({ award, go, insights, streak, markDay, openTour, openSync, account }){
  const today = dayKey();
  const pool = MC_POOL.filter(q => q.model);
  const dq = pool[strHash('craton' + today) % pool.length];
  const done = (streak.days || []).includes(today);
  const live = streak.last === today || streak.last === dayShift(today, -1) ? streak.count : 0;
  const week = Array.from({ length: 7 }, (_, i) => dayShift(today, i - 6));
  const hr = new Date().getHours();
  const hello = hr < 12 ? 'Good morning' : hr < 17 ? 'Good afternoon' : 'Good evening';
  const groups = ATLAS_GROUPS.map(g => { const ms = ATLAS.filter(m => m.group === g.name);
    const tot = ms.reduce((s, m) => s + Object.values(m.quiz).reduce((a, q) => a + q.length, 0), 0);
    const got = ms.reduce((s, m) => s + insights.filter(x => x.startsWith('atlas:' + m.id + ':')).length, 0);
    return { name: g.name, tot, got: Math.min(got, tot) }; });
  const totalAll = groups.reduce((s, g) => s + g.tot, 0), gotAll = groups.reduce((s, g) => s + g.got, 0);
  return html`<div className="h-full scroll pb-6">
    <div className="max-w-[980px] mx-auto flex flex-col gap-4 py-2">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><p className="eyebrow">${new Date().toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long' })}</p><h1 className="display text-[30px] leading-tight">${hello}${account && account.name ? ', ' + account.name.split(' ')[0] : ''}.</h1></div>
        <div className="flex items-center gap-3">
          <button className="text-[13px] text-mute underline" onClick=${() => go.tab('practice', 'class')}>Class code</button>
          ${openSync && html`<button className="text-[13px] text-mute underline" onClick=${openSync}>${account ? 'Synced (' + account.name.split(' ')[0] + ')' : 'Sync & backup'}</button>`}
          <button className="text-[13px] text-mute underline" onClick=${openTour}>How Craton works</button>
        </div>
      </div>
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] items-start">
        <section className="card flex flex-col gap-3" aria-label="Daily challenge">
          <div className="flex items-center justify-between gap-2 flex-wrap"><p className="eyebrow">Daily challenge · ${dq.topic}</p>${done && html`<span className="text-[12px] font-semibold text-ok">Done for today</span>`}</div>
          <${Quiz} key=${today} q=${dq.q} opts=${dq.opts} a=${dq.a} hint=${dq.hint || 'Open the model in 3D and look again.'} why=${dq.why} onDone=${solved => { markDay(); if (solved) award('daily:' + today); }} />
          <div className="flex gap-2 flex-wrap"><${OpenLink} item=${dq} go=${go} label="Explore it in 3D" /></div>
        </section>
        <div className="flex flex-col gap-3">
          <section className="card flex flex-col gap-2" aria-label="Streak">
            <div className="flex items-baseline justify-between"><p className="eyebrow">Day streak</p><p className="mono text-[13px] text-mute">best ${streak.best || 0}</p></div>
            <p className="mono text-[40px] font-semibold leading-none">${live}<span className="text-[16px] text-mute font-medium"> ${live === 1 ? 'day' : 'days'}</span></p>
            <div className="grid grid-cols-7 gap-1.5" aria-label="Last seven days">
              ${week.map(d => { const on = (streak.days || []).includes(d); return html`<div key=${d} className="flex flex-col items-center gap-1"><span className="block w-full rounded-md" style=${{ height: 26, background: on ? 'var(--acc)' : 'var(--chip)', border: d === today ? '2px solid var(--ink)' : '1px solid var(--line)' }}></span><span className="mono text-[10px] text-mute">${['S', 'M', 'T', 'W', 'T', 'F', 'S'][new Date(d + 'T12:00').getDay()]}</span></div>`; })}
            </div>
            <p className="text-[13px] text-mute">${done ? 'Come back tomorrow to keep it going.' : 'Answer today’s challenge to keep your streak.'}</p>
          </section>
          <section className="grid grid-cols-2 gap-2" aria-label="Quick start">
            <button className="card text-left flex flex-col gap-1" onClick=${() => go.tab('practice', 'exam')}><span className="font-semibold">Exam practice</span><span className="text-[12px] text-mute leading-snug">10 exam-style questions, scored</span></button>
            <button className="card text-left flex flex-col gap-1" onClick=${() => go.tab('practice', 'order')}><span className="font-semibold">Order the events</span><span className="text-[12px] text-mute leading-snug">Read a rock history</span></button>
            <button className="card text-left flex flex-col gap-1" onClick=${() => go.tab('nigeria')}><span className="font-semibold">Explore Nigeria</span><span className="text-[12px] text-mute leading-snug">Tap a place, fly into 3D</span></button>
            <button className="card text-left flex flex-col gap-1" onClick=${() => go.tab('atlas')}><span className="font-semibold">3D Atlas</span><span className="text-[12px] text-mute leading-snug">${ATLAS.length} topics</span></button>
          </section>
        </div>
      </div>
      <section className="card flex flex-col gap-3" aria-label="Course progress">
        <div className="flex items-baseline justify-between gap-2"><p className="eyebrow">Your course</p><p className="mono text-[13px]">${gotAll}/${totalAll} questions solved</p></div>
        <div className="grid gap-x-6 gap-y-3" style=${{ gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' }}>
          ${groups.map(g => html`<button key=${g.name} className="text-left flex flex-col gap-1" onClick=${() => go.tab('atlas')}>
            <span className="flex justify-between text-[14px]"><span className="font-medium">${g.name}</span><span className="mono text-mute">${g.got}/${g.tot}</span></span>
            <span className="block h-2 rounded-full overflow-hidden" style=${{ background: 'var(--chip)' }}><span className="block h-full rounded-full" style=${{ width: (g.tot ? 100 * g.got / g.tot : 0) + '%', background: 'var(--acc2)' }}></span></span>
          </button>`)}
        </div>
      </section>
    </div>
  </div>`;
}

/* ---------- Practice: exam ---------- */
function ExamPractice({ award, go }){
  const [unit, setUnit] = usePersist('exam.unit', 'All');
  const [best, setBest] = usePersist('exam.best', {});
  const [ses, setSes] = useState(null);
  const start = () => {
    const pool = MC_POOL.filter(q => unit === 'All' || q.unit === unit);
    const qs = shuffled(pool, Math.random).slice(0, 10).map(q => ({ ...q, perm: shuffled(q.opts.map((_, i) => i), Math.random) }));
    setSes({ qs, i: 0, picks: [] });
  };
  if (!ses) {
    const count = MC_POOL.filter(q => unit === 'All' || q.unit === unit).length;
    return html`<div className="card flex flex-col gap-3">
      <p className="text-[15px]">Ten mixed questions in the style of university and secondary-school exams. You answer first, then see why.</p>
      <div className="flex flex-col gap-2"><p className="eyebrow">Choose a unit</p>
        <div className="flex flex-wrap gap-2">${['All', ...UNITS].map(u => html`<button key=${u} className="chipbtn" aria-pressed=${unit === u} onClick=${() => setUnit(u)}>${u}</button>`)}</div></div>
      <p className="mono text-[13px] text-mute">${count} questions in this unit${best[unit] != null ? ' · your best: ' + best[unit] + '/10' : ''}</p>
      <button className="btn primary self-start" onClick=${start}>Start practice</button>
    </div>`;
  }
  const n = ses.qs.length;
  if (ses.i >= n) {
    const score = ses.picks.filter((p, k) => p === ses.qs[k].a).length, scaled = Math.round(score / n * 10);
    const missed = ses.qs.filter((q, k) => ses.picks[k] !== q.a);
    return html`<div className="card flex flex-col gap-3">
      <p className="eyebrow">Result · ${unit}</p>
      <p className="mono text-[44px] font-semibold leading-none">${score}<span className="text-[18px] text-mute">/${n}</span></p>
      <p className="text-[15px]">${score === n ? 'Perfect. You know this unit.' : score >= n * 0.7 ? 'Strong work. Review the few you missed below.' : 'Keep going. Open the missed topics in 3D, then try again.'}</p>
      ${missed.length > 0 && html`<div className="flex flex-col gap-2"><p className="eyebrow">Review</p>${missed.map(q => html`<div key=${q.id} className="border-t border-line pt-2 flex flex-col gap-1"><p className="text-[14px] font-medium">${q.q}</p><p className="text-[13px] text-mute">Answer: ${q.opts[q.a]}</p><div><${OpenLink} item=${q} go=${go} /></div></div>`)}</div>`}
      <div className="flex gap-2"><button className="btn primary" onClick=${start}>Try another set</button><button className="btn" onClick=${() => setSes(null)}>Change unit</button></div>
    </div>`;
  }
  const q = ses.qs[ses.i], pick = ses.picks[ses.i], answered = pick != null;
  const choose = orig => { if (answered) return; const picks = ses.picks.slice(); picks[ses.i] = orig; setSes({ ...ses, picks }); if (orig === q.a) award('exam:' + q.id); };
  const next = () => { const i = ses.i + 1; if (i >= n) { const score = ses.picks.filter((p, k) => p === ses.qs[k].a).length; setBest(b => ({ ...b, [unit]: Math.max(b[unit] || 0, Math.round(score / n * 10)) })); } setSes({ ...ses, i }); };
  return html`<div className="card flex flex-col gap-3">
    <div className="flex items-center justify-between gap-2"><p className="eyebrow">Question ${ses.i + 1} of ${n} · ${q.topic}</p><button className="text-[13px] text-mute underline" onClick=${() => setSes(null)}>Stop</button></div>
    <div className="block h-1.5 rounded-full overflow-hidden" style=${{ background: 'var(--chip)' }}><span className="block h-full" style=${{ width: (100 * ses.i / n) + '%', background: 'var(--acc)' }}></span></div>
    <p className="text-[16px] font-medium leading-snug">${q.q}</p>
    <div className="flex flex-col gap-2">${q.perm.map(o => { const cls = !answered ? '' : o === q.a ? 'ok' : o === pick ? 'bad' : '';
      return html`<button key=${o} className=${'opt ' + cls} disabled=${answered} onClick=${() => choose(o)}>${q.opts[o]}</button>`; })}</div>
    ${answered && html`<div className=${'note ' + (pick === q.a ? 'ok' : 'info')}><strong>${pick === q.a ? 'Correct. ' : 'The answer is: ' + q.opts[q.a] + '. '}</strong>${q.why}</div>`}
    ${answered && html`<div className="flex gap-2 flex-wrap"><button className="btn primary" onClick=${next}>${ses.i + 1 < n ? 'Next question' : 'See my score'}</button><${OpenLink} item=${q} go=${go} /></div>`}
  </div>`;
}

/* ---------- Practice: order the events ---------- */
const PZ = { lime: '#cdd0c2', sand: '#d7b57d', shale: '#6e7275', silt: '#b8945e', dike: '#2f3134', lava: '#3a3a3a', sand2: '#e0c79a' };
function Lbl({ x, y, t }){ return html`<g><circle cx=${x} cy=${y} r="12" fill="var(--panel)" stroke="var(--ink)" strokeWidth="1.5" /><text x=${x} y=${y + 1} textAnchor="middle" dominantBaseline="central" fontSize="12" fontWeight="700" fill="var(--ink)" style=${{ fontFamily: 'var(--f-mono)' }}>${t}</text></g>`; }
function foldPath(k){ const f = x => 120 + 34 * k - 60 * Math.exp(-(((x - 200) / 95) ** 2)); let d = 'M-10 ' + f(-10).toFixed(1); for (let x = 0; x <= 410; x += 10) d += ' L' + x + ' ' + f(x).toFixed(1); for (let x = 410; x >= -10; x -= 10) d += ' L' + x + ' ' + (f(x) + 34).toFixed(1); return d + 'Z'; }
const PUZZLES = [
  { id: 'p1', title: 'Quarry wall', intro: 'A quarry face shows three flat beds, a dark dike, a wavy surface and a pebbly bed on top.',
    events: [['A', 'Limestone A deposited'], ['B', 'Sandstone B deposited'], ['C', 'Shale C deposited'], ['D', 'Dike D intruded'], ['E', 'Erosion made surface E'], ['F', 'Conglomerate F deposited']],
    why: ['Superposition: the lowest bed formed first.', 'Sandstone B lies on A, so it is younger.', 'Shale C lies on B.', 'The dike cuts beds A to C, so it is younger than all of them (cross-cutting).', 'The dike stops at the wavy surface, so erosion came after the dike.', 'The conglomerate sits on the erosion surface and is not cut by the dike, so it is the youngest. Its pebbles are pieces of the eroded rock below.'],
    svg: () => html`<svg viewBox="0 0 400 260" className="w-full h-auto rounded-lg" role="img" aria-label="Cross-section with three flat beds A, B and C, a dike D cutting them, a wavy erosion surface E and conglomerate F above">
      <defs><clipPath id="p1b"><path d="M0 116 Q100 104 200 116 T400 112 V260 H0Z" /></clipPath>
        <pattern id="p1peb" width="18" height="14" patternUnits="userSpaceOnUse"><rect width="18" height="14" fill="#c9a46f" /><circle cx="5" cy="5" r="3" fill="#8d7b64" /><circle cx="13" cy="10" r="2.5" fill="#a08a6a" /></pattern></defs>
      <rect x="0" y="0" width="400" height="260" fill="var(--stage)" />
      <g clipPath="url(#p1b)"><rect x="0" y="90" width="400" height="60" fill=${PZ.shale} /><rect x="0" y="150" width="400" height="50" fill=${PZ.sand} /><rect x="0" y="200" width="400" height="60" fill=${PZ.lime} /><polygon points="178,260 198,260 214,100 194,100" fill=${PZ.dike} /></g>
      <path d="M0 116 Q100 104 200 116 T400 112 V60 H0Z" fill="url(#p1peb)" />
      <path d="M0 116 Q100 104 200 116 T400 112" fill="none" stroke="#3b2f26" strokeWidth="3" />
      <${Lbl} x=${60} y=${232} t="A" /><${Lbl} x=${60} y=${176} t="B" /><${Lbl} x=${60} y=${134} t="C" /><${Lbl} x=${226} y=${190} t="D" /><${Lbl} x=${330} y=${112} t="E" /><${Lbl} x=${60} y=${86} t="F" />
    </svg>` },
  { id: 'p2', title: 'River cliff', intro: 'A cliff shows tilted beds, a dike, a fault, a flat erosion surface, a sandstone bed and a lava flow.',
    events: [['ABC', 'Beds A, B and C deposited'], ['T', 'Beds A–C tilted'], ['G', 'Dike G intruded'], ['F', 'Fault F moved'], ['E', 'Erosion made surface E'], ['D', 'Sandstone D deposited'], ['L', 'Lava flow L erupted']],
    why: ['Sedimentary beds are laid down first, and flat (original horizontality).', 'They are tilted now, so tilting happened after deposition.', 'The dike is vertical and cuts the tilted beds. Had it been there before tilting, it would be tilted too.', 'The fault offsets the dike, so faulting came after the dike.', 'Both the dike and the fault stop at the flat erosion surface.', 'Bed D lies on the erosion surface and is not faulted.', 'The lava sits on top of bed D, so it is the youngest.'],
    svg: () => { const half = html`<g><g transform="rotate(-22 200 190)">${Array.from({ length: 22 }, (_, k) => html`<rect key=${k} x="-300" y=${-80 + k * 24} width="1000" height="24" fill=${[PZ.lime, PZ.sand, PZ.shale][k % 3]} />`)}</g><rect x="236" y="100" width="14" height="190" fill=${PZ.dike} /></g>`;
      return html`<svg viewBox="0 0 400 260" className="w-full h-auto rounded-lg" role="img" aria-label="Cross-section with tilted beds A to C, a vertical dike G offset by fault F, a flat erosion surface E, sandstone D and lava L on top">
      <defs><clipPath id="p2l"><polygon points="0,120 268,120 218,260 0,260" /></clipPath><clipPath id="p2r"><polygon points="268,120 400,120 400,260 218,260" /></clipPath></defs>
      <rect x="0" y="0" width="400" height="260" fill="var(--stage)" />
      <g clipPath="url(#p2l)"><g transform="translate(0 22)">${half}</g></g>
      <g clipPath="url(#p2r)">${half}</g>
      <line x1="268" y1="120" x2="218" y2="260" stroke="#7a1d0c" strokeWidth="3" />
      <rect x="0" y="88" width="400" height="32" fill=${PZ.sand2} />
      <path d="M0 66 H250 Q280 66 282 88 H0Z" fill=${PZ.lava} /><g fill="#6b6b6b">${[[30, 76], [70, 80], [110, 74], [150, 79], [200, 75], [240, 80]].map(([x, y]) => html`<ellipse key=${x} cx=${x} cy=${y} rx="4" ry="2.5" />`)}</g>
      <line x1="0" y1="120" x2="400" y2="120" stroke="#3b2f26" strokeWidth="3" />
      <${Lbl} x=${80} y=${205} t="A–C" /><${Lbl} x=${243} y=${150} t="G" /><${Lbl} x=${196} y=${236} t="F" /><${Lbl} x=${350} y=${120} t="E" /><${Lbl} x=${330} y=${104} t="D" /><${Lbl} x=${60} y=${77} t="L" />
    </svg>`; } },
  { id: 'p3', title: 'Road cut', intro: 'A road cut shows folded beds, a dike, a flat erosion surface, sandstone above it and a fault.',
    events: [['B', 'Beds B deposited, flat'], ['Fo', 'Beds B folded'], ['X', 'Dike X intruded'], ['E', 'Erosion made surface E'], ['S', 'Sandstone S deposited'], ['Y', 'Fault Y moved']],
    why: ['Beds are deposited first, in flat layers.', 'They are folded now, so folding came after deposition.', 'The dike is straight and cuts across the folded beds, so it came after folding.', 'The erosion surface cuts off the top of the fold and the dike.', 'Sandstone S lies on the erosion surface.', 'Fault Y offsets everything, including sandstone S, so it is the youngest event.'],
    svg: () => { const half = html`<g><g>${[0, 1, 2, 3, 4].map(k => html`<path key=${k} d=${foldPath(k - 1)} fill=${[PZ.silt, PZ.shale, PZ.lime, PZ.sand, PZ.silt][k]} />`)}<rect x="0" y="230" width="400" height="40" fill=${PZ.shale} /></g>
        <rect x="300" y="100" width="12" height="170" fill=${PZ.dike} /></g>`;
      const top = html`<g><rect x="0" y="74" width="400" height="36" fill=${PZ.sand2} /><line x1="0" y1="110" x2="400" y2="110" stroke="#3b2f26" strokeWidth="3" /></g>`;
      return html`<svg viewBox="0 0 400 260" className="w-full h-auto rounded-lg" role="img" aria-label="Cross-section with folded beds B, a dike X, erosion surface E, sandstone S, all cut by fault Y">
      <defs><clipPath id="p3below"><rect x="0" y="110" width="400" height="160" /></clipPath><clipPath id="p3l"><polygon points="0,60 180,60 112,270 0,270" /></clipPath><clipPath id="p3r"><polygon points="180,60 400,60 400,270 112,270" /></clipPath></defs>
      <rect x="0" y="0" width="400" height="260" fill="var(--stage)" />
      <g clipPath="url(#p3l)"><g transform="translate(0 16)"><g clipPath="url(#p3below)">${half}</g>${top}</g></g>
      <g clipPath="url(#p3r)"><g clipPath="url(#p3below)">${half}</g>${top}</g>
      <line x1="180" y1="60" x2="112" y2="270" stroke="#7a1d0c" strokeWidth="3" />
      <${Lbl} x=${330} y=${200} t="B" /><${Lbl} x=${306} y=${150} t="X" /><${Lbl} x=${360} y=${110} t="E" /><${Lbl} x=${360} y=${90} t="S" /><${Lbl} x=${168} y=${200} t="Y" />
    </svg>`; } },
];
function OrderEvents({ award }){
  const [pi, setPi] = usePersist('order.pi', 0);
  const [solved, setSolved] = usePersist('order.solved', {});
  const pz = PUZZLES[pi % PUZZLES.length];
  const [seq, setSeq] = useState([]);
  const [check, setCheck] = useState(null);
  const [tries, setTries] = useState(0);
  const [reveal, setReveal] = useState(false);
  useEffect(() => { setSeq([]); setCheck(null); setTries(0); setReveal(false); }, [pi]);
  const pool = useMemo(() => shuffled(pz.events.map(e => e[0]), rng(strHash(pz.id))), [pz.id]);
  const label = id => pz.events.find(e => e[0] === id)[1];
  const allRight = check && check.every(Boolean);
  const doCheck = () => { const res = seq.map((id, k) => id === pz.events[k][0]); setCheck(res); if (res.every(Boolean)) { setSolved(s => ({ ...s, [pz.id]: true })); award('order:' + pz.id); } else setTries(t => t + 1); };
  return html`<div className="grid gap-3 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] items-start">
    <div className="card flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2 flex-wrap"><p className="eyebrow">Puzzle ${(pi % PUZZLES.length) + 1} of ${PUZZLES.length} · ${pz.title}</p>${solved[pz.id] && html`<span className="text-[12px] font-semibold text-ok">Solved</span>`}</div>
      ${pz.svg()}
      <p className="text-[14px] text-mute">${pz.intro}</p>
    </div>
    <div className="card flex flex-col gap-3">
      <p className="text-[15px] font-medium">Tap the events from oldest to youngest.</p>
      <ol className="flex flex-col gap-1.5">
        ${seq.map((id, k) => html`<li key=${id}><button className=${'opt w-full flex gap-2 ' + (check ? (check[k] ? 'ok' : 'bad') : '')} style=${{ textDecoration: 'none' }} disabled=${!!allRight} onClick=${() => { setSeq(s => s.filter(x => x !== id)); setCheck(null); }} aria-label=${'Remove ' + label(id)}><span className="mono font-semibold">${k + 1}.</span><span>${label(id)}</span></button></li>`)}
        ${seq.length === 0 && html`<li className="text-[13px] text-mute">Your order will build up here. Tap a placed event to take it back.</li>`}
      </ol>
      ${seq.length < pz.events.length && html`<div className="flex flex-wrap gap-2">${pool.filter(id => !seq.includes(id)).map(id => html`<button key=${id} className="chipbtn" onClick=${() => { setSeq(s => [...s, id]); setCheck(null); }}>${label(id)}</button>`)}</div>`}
      ${!allRight && html`<div className="flex gap-2 flex-wrap"><button className="btn primary" disabled=${seq.length < pz.events.length} onClick=${doCheck}>Check my order</button>${seq.length > 0 && html`<button className="btn" onClick=${() => { setSeq([]); setCheck(null); }}>Clear</button>`}</div>`}
      ${check && !allRight && html`<div className="note bad"><strong>${check.filter(Boolean).length} of ${check.length} in the right place.</strong> Use two rules: lower beds are older, and anything that cuts something else is younger than what it cuts.</div>`}
      ${tries >= 2 && !allRight && !reveal && html`<button className="text-[13px] text-mute underline self-start" onClick=${() => setReveal(true)}>Show the answer with reasons</button>`}
      ${(allRight || reveal) && html`<div className=${'note ' + (allRight ? 'ok' : 'info')}><strong>${allRight ? 'Correct. You read the rock’s history. ' : 'The correct order:'}</strong>
        <ol className="mt-2 flex flex-col gap-1.5 list-decimal pl-5">${pz.events.map((e, k) => html`<li key=${e[0]}><span className="font-semibold">${e[1]}.</span> ${pz.why[k]}</li>`)}</ol></div>`}
      ${(allRight || reveal) && html`<button className="btn primary self-start" onClick=${() => setPi(i => (i + 1) % PUZZLES.length)}>Next puzzle</button>`}
    </div>
  </div>`;
}
function PracticeModule({ award, go }){
  const [tab, setTab] = usePersist('pr.tab', 'exam');
  return html`<div className="h-full scroll pb-6"><div className="max-w-[1080px] mx-auto flex flex-col gap-3 py-2">
    <div className="flex flex-wrap items-end justify-between gap-3"><div><h1 className="display text-[28px] leading-tight">Practice</h1><p className="text-mute text-[15px]">Exam-style questions, rock-history puzzles and lecturer class challenges.</p></div></div>
    <div className="max-w-[540px] w-full"><${Seg} label="Practice type" value=${tab} onChange=${setTab} items=${[{ id: 'exam', label: 'Exam practice' }, { id: 'order', label: 'Order the events' }, { id: 'class', label: 'Class & lecturer' }]} /></div>
    ${tab === 'exam' ? html`<${ExamPractice} award=${award} go=${go} />` : tab === 'class' ? html`<${ClassroomModule} award=${award} go=${go} />` : html`<${OrderEvents} award=${award} />`}
  </div></div>`;
}

/* ---------- Explore Nigeria ---------- */
const NG_BORDER = typeof NG_BORDER_NE !== 'undefined' ? NG_BORDER_NE : [[2.69, 6.37], [2.72, 7.0], [2.75, 8.5], [3.1, 9.1], [3.6, 10.3], [3.6, 11.7], [4.1, 13.5], [5.0, 13.75], [6.4, 13.6], [7.8, 13.35], [9.0, 12.85], [10.6, 13.05], [12.3, 13.1], [13.6, 13.7], [14.1, 13.0], [14.6, 12.2], [14.2, 11.2], [13.6, 10.4], [12.9, 9.3], [12.3, 8.4], [11.8, 7.1], [11.1, 6.5], [10.2, 6.9], [9.5, 6.1], [8.9, 5.0], [8.5, 4.6], [7.6, 4.4], [6.8, 4.3], [6.0, 4.3], [5.4, 4.9], [5.0, 5.7], [4.5, 6.2], [3.4, 6.4]];
const NG_NIGER = [[3.6, 11.75], [4.2, 10.6], [4.8, 9.2], [5.6, 8.9], [6.4, 8.3], [6.74, 7.8], [6.75, 6.6], [6.6, 5.6], [6.4, 5.0]];
const NG_BENUE = [[12.6, 9.2], [11.2, 9.0], [9.9, 8.4], [8.53, 7.73], [7.5, 7.85], [6.74, 7.8]];
const ngXY = ([lon, lat]) => [(lon - 2.4) * 40, (14.3 - lat) * 40];
const ngPath = pts => pts.map((p, i) => (i ? 'L' : 'M') + ngXY(p).map(v => v.toFixed(1)).join(' ')).join(' ');
const NG_KINDS = { basement: ['Basement Complex', '#b0503a'], sed: ['Sedimentary basin', '#c08a2e'], volc: ['Volcanic', '#3f3f46'], coast: ['Coast and delta', '#1f6f9e'] };
const NG_PLACES = [
  { id: 'lagos', name: 'Lagos', state: 'Lagos', prov: 'dahomey', ll: [3.39, 6.45], kind: 'coast', region: 'Dahomey Basin coast', text: 'A low coastal plain and lagoons only a few metres above sea level. Coastal erosion and flooding are constant problems.', links: [{ label: 'Climate and sea-level change', model: 'climate' }, { label: 'Deltas and coasts', model: 'delta', variant: 'arcuate' }] },
  { id: 'ewekoro', name: 'Ewekoro', state: 'Ogun', prov: 'dahomey', ll: [3.21, 6.93], kind: 'sed', region: 'Dahomey Basin', text: 'Quarries expose Paleocene limestone full of shells, mined to make cement.', links: [{ label: 'Fossils and geologic time', model: 'fossils' }, { label: 'Field Station: identify the limestone', tool: 'field' }] },
  { id: 'olumo', name: 'Olumo Rock', state: 'Ogun', prov: 'basement', ll: [3.35, 7.15], kind: 'basement', region: 'Basement Complex, Abeokuta', text: 'A granite inselberg. Jointed granite breaks into blocks that pile up at its foot.', links: [{ label: 'Landslides: rockfall', model: 'slide', variant: 'rockfall' }, { label: 'Igneous intrusions', model: 'intrusion' }] },
  { id: 'ibadan', name: 'Ibadan', state: 'Oyo', prov: 'basement', ll: [3.9, 7.38], kind: 'basement', region: 'Basement Complex', text: 'Migmatite-gneiss with steep foliation in road cuts: the eroded root of the Pan-African mountain belt.', links: [{ label: 'Metamorphic grade', model: 'meta' }, { label: 'Mountain building', model: 'orogen' }] },
  { id: 'ilesha', name: 'Ilesha', state: 'Osun', prov: 'basement', ll: [4.74, 7.63], kind: 'basement', region: 'Ilesha schist belt', text: 'A schist belt with gold in quartz veins along shear zones.', links: [{ label: 'Gold in a schist belt', model: 'ore', variant: 'gold' }, { label: 'Metamorphic grade', model: 'meta' }] },
  { id: 'idanre', name: 'Idanre Hills', state: 'Ondo', prov: 'basement', ll: [5.11, 7.11], kind: 'basement', region: 'Basement Complex', text: 'Granite inselbergs rising high above the surrounding plain.', links: [{ label: 'Igneous intrusions', model: 'intrusion' }] },
  { id: 'jos', name: 'Jos Plateau', state: 'Plateau', prov: 'younger', ll: [8.89, 9.9], kind: 'volc', region: 'Younger Granites and basalts', text: 'Tin-bearing Younger Granites, young basalts and cinder cones, and ponds left by tin mining.', links: [{ label: 'Tin in granite', model: 'ore', variant: 'tin' }, { label: 'Cinder cones', model: 'volcano', variant: 'cinder' }] },
  { id: 'keana', name: 'Keana', state: 'Nasarawa', prov: 'benue', ll: [8.8, 8.13], kind: 'sed', region: 'Middle Benue Trough', text: 'Brine springs that have been worked for salt for centuries.', links: [{ label: 'Halite crystal', model: 'minerals', variant: 'halite' }] },
  { id: 'abakaliki', name: 'Abakaliki', state: 'Ebonyi', prov: 'benue', ll: [8.11, 6.32], kind: 'sed', region: 'Lower Benue Trough', text: 'Cretaceous shales folded into the Abakaliki Anticlinorium during Santonian compression.', links: [{ label: 'Folds and domes', model: 'folds', variant: 'anticline' }, { label: 'Peel & Slice: fold the block', tool: 'block' }] },
  { id: 'enugu', name: 'Enugu', state: 'Enugu', prov: 'anambra', ll: [7.5, 6.45], kind: 'sed', region: 'Anambra Basin', text: 'An escarpment of Cretaceous sandstones. The Ajali Sandstone aquifer supplies water to the city.', links: [{ label: 'Groundwater', model: 'ground' }, { label: 'Landslides: slump', model: 'slide', variant: 'slump' }] },
  { id: 'agulu', name: 'Agulu–Nanka', state: 'Anambra', prov: 'anambra', ll: [7.05, 6.11], kind: 'sed', region: 'Anambra Basin', text: 'Some of the largest erosion gullies in Africa, cut into the loose Nanka Sands.', links: [{ label: 'Gully erosion', model: 'gully' }] },
  { id: 'ph', name: 'Port Harcourt', state: 'Rivers', prov: 'delta', ll: [7.0, 4.8], kind: 'coast', region: 'Niger Delta', text: 'Growth faults, rollover anticlines and most of Nigeria’s oil and gas.', links: [{ label: 'Rollover oil trap', model: 'traps', variant: 'rollover' }, { label: 'Deltas and coasts', model: 'delta', variant: 'arcuate' }] },
  { id: 'gombe', name: 'Gombe', state: 'Gombe', prov: 'benue', ll: [11.17, 10.29], kind: 'sed', region: 'Upper Benue Trough', text: 'Cretaceous marine rocks with ammonites, recording a sea that once flooded the trough.', links: [{ label: 'Fossils and geologic time', model: 'fossils' }] },
  { id: 'biu', name: 'Biu Plateau', state: 'Borno', prov: 'volcanic', ll: [12.19, 10.61], kind: 'volc', region: 'Biu basalts', text: 'Young basalt lava fields with many cinder cones.', links: [{ label: 'Cinder cones', model: 'volcano', variant: 'cinder' }, { label: 'Shield volcano', model: 'volcano', variant: 'shield' }] },
  { id: 'maiduguri', name: 'Maiduguri', state: 'Borno', prov: 'chad', ll: [13.15, 11.85], kind: 'sed', region: 'Chad Basin', text: 'Sands and clays left by the much larger Lake Mega-Chad. Sand dunes cover parts of the far north.', links: [{ label: 'Desert dunes', model: 'dunes' }, { label: 'Climate and sea-level change', model: 'climate' }] },
  { id: 'sokoto', name: 'Sokoto', state: 'Sokoto', prov: 'sokoto', ll: [5.24, 13.06], kind: 'sed', region: 'Sokoto Basin', text: 'Flat-lying sedimentary rocks resting directly on the eroded Basement Complex.', links: [{ label: 'Unconformities', model: 'unconf', variant: 'noncon' }] },
  { id: 'cameroon', name: 'Mount Cameroon', state: 'Cross River border', prov: 'volcanic', ll: [9.17, 4.2], kind: 'volc', region: 'Cameroon, just across the border', text: 'The most active volcano on the Cameroon Volcanic Line, which runs along Nigeria’s eastern border.', links: [{ label: 'Hot spots and the Cameroon Line', model: 'hotspot', variant: 'cameroon' }] },
];
function NigeriaModule({ go }){
  const [mode, setMode] = usePersist('ng.mode', 'places');
  const [sel, setSel] = usePersist('ng.sel', 'abakaliki');
  const [provSel, setProvSel] = usePersist('ng.prov', 'benue');
  const [stateSel, setStateSel] = usePersist('ng.state', 'Plateau');
  const [showProvs, setShowProvs] = usePersist('ng.layer.provs', true);
  const [showStates, setShowStates] = usePersist('ng.layer.states', true);
  const [showRivers, setShowRivers] = usePersist('ng.layer.rivers', true);

  const provinces = typeof NG_PROVINCES !== 'undefined' ? NG_PROVINCES : [];
  const states = typeof NG_STATES !== 'undefined' ? NG_STATES : [];
  const provMap = useMemo(() => { const m = {}; provinces.forEach(pr => { m[pr.id] = pr; }); return m; }, [provinces]);

  const p = NG_PLACES.find(x => x.id === sel) || NG_PLACES[0];
  const curProv = provMap[provSel] || provinces[0];
  const curState = states.find(s => s.n === stateSel) || states[0];
  const stateProv = curState && provMap[curState.prov] ? provMap[curState.prov] : provinces[0];
  const statePlaces = curState ? NG_PLACES.filter(q => q.state === curState.n) : [];
  const provStates = curProv ? states.filter(s => s.prov === curProv.id).map(s => s.n) : [];
  const provPlaces = curProv ? NG_PLACES.filter(q => q.prov === curProv.id) : [];

  const activeProvId = mode === 'provinces' ? provSel : mode === 'states' && curState ? curState.prov : p.prov;

  return html`<div className="h-full scroll pb-6"><div className="max-w-[1180px] mx-auto flex flex-col gap-3 py-2">
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="display text-[28px] leading-tight">Explore Nigeria</h1>
        <p className="text-mute text-[15px]">Explore key geological sites, Nigeria’s 10 geological provinces and all 36 states + FCT, then fly into the matching 3D model.</p>
      </div>
      <div className="w-full sm:w-[440px]">
        <${Seg} label="Explore Nigeria mode" value=${mode} onChange=${setMode} items=${[
          { id: 'places', label: 'Key sites (17)' },
          { id: 'provinces', label: 'Provinces (10)' },
          { id: 'states', label: 'States (36+FCT)' },
        ]} />
      </div>
    </div>
    <div className="grid gap-3 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] items-start">
      <figure className="card m-0 flex flex-col gap-2">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-1 border-b border-line">
          <span className="eyebrow">${mode === 'places' ? 'Tap a site pin' : mode === 'provinces' ? 'Tap a geological province' : 'Tap any state'}</span>
          <div className="flex flex-wrap gap-1.5">
            <button className="chipbtn" style=${{ minHeight: 28, padding: '2px 9px', fontSize: 11 }} aria-pressed=${showProvs} onClick=${() => setShowProvs(v => !v)}>Geological provinces</button>
            <button className="chipbtn" style=${{ minHeight: 28, padding: '2px 9px', fontSize: 11 }} aria-pressed=${showStates} onClick=${() => setShowStates(v => !v)}>State borders</button>
            <button className="chipbtn" style=${{ minHeight: 28, padding: '2px 9px', fontSize: 11 }} aria-pressed=${showRivers} onClick=${() => setShowRivers(v => !v)}>Niger & Benue</button>
          </div>
        </div>
        <svg viewBox="0 0 510 420" className="w-full h-auto" role="img" aria-label="Geological and state map of Nigeria">
          <defs>
            <clipPath id="ng-clip"><path d=${ngPath(NG_BORDER) + 'Z'} /></clipPath>
          </defs>
          <path d=${ngPath(NG_BORDER) + 'Z'} fill=${showProvs && provMap.basement ? provMap.basement.color : 'var(--chip)'} fillOpacity=${showProvs ? 0.22 : 1} />

          ${showProvs && html`<g clipPath="url(#ng-clip)">
            ${states.map(s => {
              const pr = provMap[s.prov];
              const isAct = activeProvId === s.prov;
              return html`<path key=${'sp-' + s.n} d=${ngPath(s.p) + 'Z'} fill=${pr ? pr.color : 'var(--chip)'} fillOpacity=${mode === 'provinces' ? (isAct ? 0.58 : 0.24) : 0.26} style=${{ cursor: mode === 'provinces' ? 'pointer' : 'default' }} onClick=${mode === 'provinces' ? () => setProvSel(s.prov) : undefined} />`;
            })}
            ${provinces.filter(pr => pr.id !== 'basement').map(pr => {
              const isAct = activeProvId === pr.id;
              return pr.polys.map((poly, idx) => html`<path key=${pr.id + '-' + idx} d=${ngPath(poly) + 'Z'} fill=${pr.color} fillOpacity=${mode === 'provinces' ? (isAct ? 0.65 : 0.28) : 0.32} stroke=${isAct && mode === 'provinces' ? pr.color : 'none'} strokeWidth=${isAct ? 2.2 : 0} strokeLinejoin="round" style=${{ cursor: mode === 'provinces' ? 'pointer' : 'default' }} onClick=${mode === 'provinces' ? () => setProvSel(pr.id) : undefined} />`);
            })}
          </g>`}

          ${(showStates || mode === 'states') && html`<g>
            ${states.map(s => {
              const on = mode === 'states' && s.n === stateSel;
              const inProv = mode === 'provinces' && s.prov === provSel;
              return html`<path key=${'st-' + s.n} d=${ngPath(s.p) + 'Z'} fill=${on ? 'var(--acc)' : 'transparent'} fillOpacity=${on ? 0.28 : 0} stroke=${on ? 'var(--acc)' : inProv ? 'var(--ink)' : 'var(--ink)'} strokeOpacity=${on ? 1 : inProv ? 0.55 : 0.26} strokeWidth=${on ? 2.2 : inProv ? 1.1 : 0.7} strokeLinejoin="round" style=${{ cursor: mode === 'states' ? 'pointer' : mode === 'provinces' ? 'pointer' : 'default' }} onClick=${mode === 'states' ? () => setStateSel(s.n) : mode === 'provinces' ? () => setProvSel(s.prov) : undefined} />`;
            })}
            ${mode === 'states' && states.map(s => {
              const [cx, cy] = ngXY(s.c);
              const on = s.n === stateSel;
              return html`<text key=${'lbl-' + s.n} x=${cx} y=${cy} textAnchor="middle" dominantBaseline="central" fontSize=${on ? 11 : 8.5} fontWeight=${on ? '700' : '500'} fill=${on ? 'var(--ink)' : 'var(--mute)'} stroke="var(--panel)" strokeWidth=${on ? 3.2 : 2} style=${{ paintOrder: 'stroke', pointerEvents: 'none' }}>${s.n === 'FCT (Abuja)' ? 'FCT' : s.n}</text>`;
            })}
          </g>`}

          <path d=${ngPath(NG_BORDER) + 'Z'} fill="none" stroke="var(--ink)" strokeWidth="1.7" strokeLinejoin="round" pointerEvents="none" />

          ${showRivers && html`<g pointerEvents="none">
            <path d=${ngPath(NG_NIGER)} fill="none" stroke="#2f7fb5" strokeWidth="2.6" strokeLinecap="round" opacity="0.85" />
            <path d=${ngPath(NG_BENUE)} fill="none" stroke="#2f7fb5" strokeWidth="2.6" strokeLinecap="round" opacity="0.85" />
            <text x=${ngXY([5.3, 9.35])[0]} y=${ngXY([5.3, 9.35])[1]} fontSize="10.5" fill="#2f7fb5" style=${{ fontStyle: 'italic' }}>R. Niger</text>
            <text x=${ngXY([10.1, 8.85])[0]} y=${ngXY([10.1, 8.85])[1]} fontSize="10.5" fill="#2f7fb5" style=${{ fontStyle: 'italic' }}>R. Benue</text>
          </g>`}

          ${mode === 'provinces' && provinces.map(pr => {
            const poly = pr.polys[0];
            if (!poly) return null;
            const lon = poly.reduce((a, b) => a + b[0], 0) / poly.length;
            const lat = poly.reduce((a, b) => a + b[1], 0) / poly.length;
            const [cx, cy] = ngXY([lon, lat]);
            const on = pr.id === provSel;
            return html`<g key=${'plbl-' + pr.id} style=${{ cursor: 'pointer' }} onClick=${() => setProvSel(pr.id)}>
              <circle cx=${cx} cy=${cy} r=${on ? 7 : 5} fill=${pr.color} stroke="var(--panel)" strokeWidth="2" />
              <text x=${cx} y=${cy - 10} textAnchor="middle" fontSize=${on ? 11.5 : 9.5} fontWeight=${on ? '700' : '600'} fill="var(--ink)" stroke="var(--panel)" strokeWidth="3.5" style=${{ paintOrder: 'stroke' }}>${pr.short}</text>
            </g>`;
          })}

          ${mode !== 'provinces' && NG_PLACES.map(q => {
            const [x, y] = ngXY(q.ll);
            const on = mode === 'places' ? q.id === sel : (curState && q.state === curState.n);
            return html`<g key=${q.id} style=${{ cursor: 'pointer' }} onClick=${() => { setSel(q.id); if (mode !== 'places') setMode('places'); }} role="button" tabIndex="0" aria-label=${q.name} onKeyDown=${e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSel(q.id); setMode('places'); } }}>
              <circle cx=${x} cy=${y} r="14" fill="transparent" />
              ${on && html`<circle cx=${x} cy=${y} r="12.5" fill="none" stroke="var(--acc)" strokeWidth="2.4" />`}
              <circle cx=${x} cy=${y} r=${on ? 7.5 : 5.5} fill=${NG_KINDS[q.kind][1]} stroke="var(--panel)" strokeWidth="1.8" opacity=${mode === 'states' && !on ? 0.55 : 1} />
              ${on && html`<text x=${x + 14} y=${y + 4} fontSize="12.5" fontWeight="700" fill="var(--ink)" stroke="var(--panel)" strokeWidth="3.8" style=${{ paintOrder: 'stroke' }}>${q.name}</text>`}
            </g>`;
          })}
        </svg>
        <figcaption className="flex flex-wrap gap-x-3 gap-y-1 text-[11.5px] text-mute">
          ${showProvs
            ? provinces.map(pr => html`<button key=${pr.id} className="flex items-center gap-1 hover:underline" onClick=${() => { setProvSel(pr.id); setMode('provinces'); }}><span className="inline-block w-2.5 h-2.5 rounded-sm" style=${{ background: pr.color }}></span><span>${pr.short}</span></button>`)
            : Object.values(NG_KINDS).map(([n, c]) => html`<span key=${n} className="flex items-center gap-1.5"><span className="inline-block w-2.5 h-2.5 rounded-full" style=${{ background: c }}></span>${n}</span>`)}
          <span className="ml-auto">Natural Earth outline & 36 states + FCT.</span>
        </figcaption>
      </figure>

      <div className="flex flex-col gap-3">
        ${mode === 'places' && html`
          <section className="card flex flex-col gap-2" aria-live="polite">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <p className="eyebrow" style=${{ color: NG_KINDS[p.kind][1] }}>${NG_KINDS[p.kind][0]} · ${p.region}</p>
              <span className="mono text-[11px] text-mute">${p.state}</span>
            </div>
            <h2 className="display text-[24px] leading-tight">${p.name}</h2>
            <p className="text-[15px] leading-relaxed">${p.text}</p>
            ${provMap[p.prov] && html`<div className="border-t border-line pt-2 mt-1 flex items-center justify-between gap-2 flex-wrap">
              <span className="text-[12.5px] text-mute">Province: <strong className="text-ink">${provMap[p.prov].name}</strong></span>
              <button className="text-[12.5px] underline" style=${{ color: 'var(--acc)' }} onClick=${() => { setProvSel(p.prov); setMode('provinces'); }}>Inspect province →</button>
            </div>`}
            <div className="flex flex-col gap-2 mt-1">${p.links.map(l => html`<${OpenLink} key=${l.label} item=${l} go=${go} label=${l.label} />`)}</div>
          </section>
          <section className="flex flex-wrap gap-1.5" aria-label="All places">${NG_PLACES.map(q => html`<button key=${q.id} className="chipbtn" style=${{ minHeight: 34, padding: '5px 10px', fontSize: 12 }} aria-pressed=${q.id === sel} onClick=${() => setSel(q.id)}>${q.name}</button>`)}</section>
        `}

        ${mode === 'provinces' && curProv && html`
          <section className="card flex flex-col gap-2.5" aria-live="polite">
            <div className="flex items-center gap-2">
              <span className="inline-block w-3 h-3 rounded-sm" style=${{ background: curProv.color }}></span>
              <p className="eyebrow" style=${{ color: curProv.color }}>Geological Province · ${curProv.age}</p>
            </div>
            <h2 className="display text-[23px] leading-tight">${curProv.name}</h2>
            <p className="text-[14.5px] leading-relaxed">${curProv.text}</p>
            <div className="note info text-[13px]"><strong>Key rocks & lithologies:</strong> ${curProv.rocks}</div>
            ${provStates.length > 0 && html`<p className="text-[12.5px] text-mute"><strong>Major coverage across states:</strong> ${provStates.join(', ')}.</p>`}
            ${provPlaces.length > 0 && html`<div className="flex flex-wrap items-center gap-1.5"><span className="text-[12px] text-mute">Sites in this province:</span>${provPlaces.map(q => html`<button key=${q.id} className="chipbtn" style=${{ minHeight: 28, padding: '2px 8px', fontSize: 11.5 }} onClick=${() => { setSel(q.id); setMode('places'); }}>${q.name} →</button>`)}</div>`}
            <div className="flex flex-col gap-2 mt-1">${curProv.links.map(l => html`<${OpenLink} key=${l.label} item=${l} go=${go} label=${l.label} />`)}</div>
          </section>
          <section className="flex flex-wrap gap-1.5" aria-label="All geological provinces">${provinces.map(pr => html`<button key=${pr.id} className="chipbtn" style=${{ minHeight: 34, padding: '5px 10px', fontSize: 12 }} aria-pressed=${pr.id === provSel} onClick=${() => setProvSel(pr.id)}>${pr.short}</button>`)}</section>
        `}

        ${mode === 'states' && curState && html`
          <section className="card flex flex-col gap-2.5" aria-live="polite">
            <p className="eyebrow">State Geology · Nigeria (36 States + FCT)</p>
            <h2 className="display text-[24px] leading-tight">${curState.n}${curState.n.includes('FCT') ? '' : ' State'}</h2>
            ${stateProv && html`<div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <span className="inline-block w-3 h-3 rounded-sm" style=${{ background: stateProv.color }}></span>
                <span className="text-[14px] font-semibold">${stateProv.name}</span>
              </div>
              <p className="text-[12.5px] text-mute">Age: ${stateProv.age}</p>
              <p className="text-[14px] leading-relaxed">${stateProv.text}</p>
              <div className="note info text-[13px]"><strong>Dominant rocks:</strong> ${stateProv.rocks}</div>
            </div>`}
            ${statePlaces.length > 0 ? html`<div className="flex flex-col gap-1.5">
              <p className="eyebrow">Featured Craton field site${statePlaces.length > 1 ? 's' : ''} in ${curState.n}</p>
              <div className="flex flex-wrap gap-1.5">${statePlaces.map(q => html`<button key=${q.id} className="chipbtn" onClick=${() => { setSel(q.id); setMode('places'); }}>📍 ${q.name} (${q.region}) →</button>`)}</div>
            </div>` : null}
            ${stateProv && html`<div className="flex flex-col gap-2 mt-1">${stateProv.links.map(l => html`<${OpenLink} key=${l.label} item=${l} go=${go} label=${l.label} />`)}</div>`}
          </section>
          <section className="flex flex-wrap gap-1" aria-label="All Nigerian states">${states.map(s => html`<button key=${s.n} className="chipbtn" style=${{ minHeight: 30, padding: '3px 8px', fontSize: 11.5 }} aria-pressed=${s.n === stateSel} onClick=${() => setStateSel(s.n)}>${s.n}</button>`)}</section>
        `}
      </div>
    </div>
  </div></div>`;
}

/* ---------- Field kit hub ---------- */
const KIT = [
  { id: 'block', title: 'Peel & Slice', blurb: 'Fold, fault and thrust a five-layer block, peel it, cut it open and pin strike and dip.', icon: html`<path d="M3 7.5l9-4 9 4-9 4-9-4z M3 12l9 4 9-4 M3 16.5l9 4 9-4" />` },
  { id: 'net', title: 'Stereonet Bridge', blurb: 'Tilt a bed and watch its great circle and pole form on a hemisphere that flattens into a Schmidt net.', icon: html`<circle cx="12" cy="12" r="9" /><path d="M12 3c-5 4-5 14 0 18 M3 12h18" /><circle cx="16" cy="9" r="1.4" fill="currentColor" />` },
  { id: 'field', title: 'Field Station', blurb: 'Digital compass-clinometer, hand lens and acid test. Defend your rock identification to the Field Demonstrator.', icon: html`<circle cx="12" cy="12" r="9" /><path d="M14.5 9.5l-5 0 0 5 M14.5 9.5l-2 6-6 2 2-6z" />` },
];
function KitModule({ themeKey, award, tool, setTool }){
  if (tool) {
    const k = KIT.find(x => x.id === tool) || KIT[0];
    const M = tool === 'net' ? NetModule : tool === 'field' ? FieldModule : BlockModule;
    return html`<div className="h-full flex flex-col gap-2 min-h-0">
      <div className="flex items-center gap-2"><button className="chipbtn" onClick=${() => setTool(null)}>← Field kit</button><span className="eyebrow">${k.title}</span></div>
      <div className="flex-1 min-h-0"><${M} key=${tool} themeKey=${themeKey} award=${award} /></div>
    </div>`;
  }
  return html`<div className="h-full scroll pb-6"><div className="max-w-[1080px] mx-auto flex flex-col gap-3 py-2">
    <div><h1 className="display text-[28px] leading-tight">Field kit</h1><p className="text-mute text-[15px]">The tools a geologist uses on an outcrop and in the lab.</p></div>
    <div className="grid gap-3" style=${{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
      ${KIT.map(k => html`<button key=${k.id} className="card text-left flex gap-3 items-start" onClick=${() => setTool(k.id)}>
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--acc)" strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" aria-hidden="true" className="flex-none">${k.icon}</svg>
        <span className="flex flex-col gap-1"><span className="font-semibold text-[17px]">${k.title}</span><span className="text-[13px] text-mute leading-snug">${k.blurb}</span></span>
      </button>`)}
    </div>
  </div></div>`;
}

/* ---------- first-run tour ---------- */
const TOUR = [
  { t: 'Welcome to Craton', b: 'The whole of physical geology in 3D: ' + ATLAS.length + ' topics, exam practice and real Nigerian rocks, built to run on any phone.' },
  { t: 'Turn it in your hand', b: 'In the Atlas, drag to spin a model, pinch to zoom and tap any part to see what it is.' },
  { t: 'Predict before you are told', b: 'Craton never just hands you the answer. Commit to a prediction or find the part yourself, and the explanation unlocks.' },
  { t: 'Three minutes a day', b: 'A new challenge appears on Today every day. Keep your streak going, then test yourself in Practice before exams.' },
];
function Tour({ onClose }){
  const [i, setI] = useState(0);
  const s = TOUR[i], last = i === TOUR.length - 1;
  useEffect(() => { const k = e => { if (e.key === 'Escape') onClose(); }; window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k); }, []);
  return html`<div className="fixed inset-0 z-50 flex items-center justify-center p-4" style=${{ background: 'color-mix(in srgb, var(--ink) 50%, transparent)' }} role="dialog" aria-modal="true" aria-labelledby="tour-t">
    <div className="card w-full max-w-[420px] flex flex-col gap-3" style=${{ padding: 22 }}>
      <svg width="44" height="44" viewBox="0 0 28 28" aria-hidden="true"><rect x="2" y="4" width="24" height="5" rx="1.5" fill="var(--acc)" /><rect x="2" y="10" width="24" height="5" rx="1.5" fill="var(--ink)" opacity=".85" /><path d="M2 16h11l3 6H2z" fill="var(--acc2)" /><path d="M16 16h10v6h-7z" fill="var(--mute)" /></svg>
      <p className="eyebrow">${i + 1} of ${TOUR.length}</p>
      <h2 id="tour-t" className="display text-[24px] leading-tight">${s.t}</h2>
      <p className="text-[15px] leading-relaxed">${s.b}</p>
      <div className="flex gap-1.5">${TOUR.map((_, k) => html`<span key=${k} className="block h-1.5 flex-1 rounded-full" style=${{ background: k <= i ? 'var(--acc)' : 'var(--chip)' }}></span>`)}</div>
      <div className="flex gap-2 justify-between items-center mt-1">
        <button className="text-[13px] text-mute underline" onClick=${onClose}>Skip</button>
        <div className="flex gap-2">${i > 0 && html`<button className="btn" onClick=${() => setI(i - 1)}>Back</button>`}<button className="btn primary" autoFocus onClick=${() => last ? onClose() : setI(i + 1)}>${last ? 'Start learning' : 'Next'}</button></div>
      </div>
    </div>
  </div>`;
}

