/* Craton · 03-ui.js
 * Shared UI components: Range slider, Quiz (predict-then-explain), Seg control, WebGL error card, useStage and useTap hooks.
 * Loaded as a classic script; top-level consts are shared across files in load order (see app/index.html).
 */
'use strict';
/* ============================== shared UI bits ============================== */
function Range({ id, label, value, min, max, step, onChange, disabled, unit, fmt }){
  return html`<div className="flex flex-col gap-0.5">
    <div className="flex justify-between items-baseline text-[13px]"><label htmlFor=${id} className="text-mute">${label}</label><span className="mono text-[15px] font-semibold">${fmt ? fmt(value) : value}${unit == null ? '°' : unit}</span></div>
    <input id=${id} type="range" className="geo-range" min=${min} max=${max} step=${step || 1} value=${value} disabled=${!!disabled} onChange=${e => onChange(+e.target.value)} />
  </div>`;
}
function Quiz({ q, opts, a, hint, why, onSolved, onDone, eyebrow }){
  const [picked, setPicked] = useState([]);
  const solved = picked.includes(a), exhausted = !solved && picked.length >= 2;
  useEffect(() => { if (solved && onSolved) onSolved(); }, [solved]);
  useEffect(() => { if ((solved || exhausted) && onDone) onDone(solved); }, [solved, exhausted]);
  return html`<div className="flex flex-col gap-2">
    ${eyebrow && html`<p className="eyebrow">${eyebrow}</p>`}
    <p className="text-[15px] leading-snug font-medium">${q}</p>
    <div className="flex flex-col gap-2">
      ${opts.map((o, i) => { const tried = picked.includes(i); const cls = tried ? (i === a ? 'ok' : 'bad') : (exhausted && i === a ? 'reveal' : '');
        return html`<button key=${i} className=${'opt ' + cls} disabled=${solved || exhausted || tried} onClick=${() => setPicked(p => [...p, i])}>${o}</button>`; })}
    </div>
    ${!solved && !exhausted && picked.length > 0 && html`<div className="note bad"><strong>Not quite.</strong> ${hint}</div>`}
    ${(solved || exhausted) && html`<div className=${'note ' + (solved ? 'ok' : 'info')}><strong>${solved ? 'Yes. ' : 'Explanation unlocked. '}</strong>${why}</div>`}
  </div>`;
}
function Seg({ items, value, onChange, label }){
  return html`<div className="seg" role="group" aria-label=${label}>${items.map(it => html`<button key=${it.id} aria-pressed=${value === it.id} onClick=${() => onChange(it.id)}>${it.label}</button>`)}</div>`;
}
function WebGLError({ msg }){
  return html`<div className="absolute inset-0 flex items-center justify-center p-6 text-center"><div className="max-w-xs"><p className="display text-lg mb-1">3D view unavailable</p><p className="text-mute text-sm">${msg} Try Chrome on Android with hardware acceleration on. The Field Station still works without 3D.</p></div></div>`;
}
function useStage(opts, build, deps){
  const host = useRef(null), api = useRef(null);
  const [err, setErr] = useState(null);
  useEffect(() => {
    let stage;
    try { stage = createStage(host.current, opts); } catch (e) { setErr(e.message || 'WebGL could not start.'); return; }
    api.current = build(stage);
    return () => { api.current = null; stage.dispose(); };
  }, []);
  return [host, api, err];
}
function useTap(onTap){
  const st = useRef(null);
  return {
    onPointerDown: e => { st.current = { x: e.clientX, y: e.clientY, t: performance.now(), id: e.pointerId, n: (st.current && st.current.multi) ? 2 : 1 }; },
    onPointerUp: e => { const s = st.current; st.current = null; if (!s || s.id !== e.pointerId) return; if (Math.hypot(e.clientX - s.x, e.clientY - s.y) < 7 && performance.now() - s.t < 450) onTap(e.clientX, e.clientY); },
  };
}

