/* Craton · 04-block.js
 * Peel & Slice React screen and the true-vs-apparent dip challenge.
 * Loaded as a classic script; top-level consts are shared across files in load order (see app/index.html).
 */
'use strict';
/* ============================== module 1 UI ============================== */
function BlockModule({ themeKey, award }){
  const [mode, setMode] = usePersist('m1.mode', 'flat');
  const [stress, setStress] = usePersist('m1.s', 0);
  const [layers, setLayers] = usePersist('m1.layers', () => LAYERS.map(() => ({ v: true, o: 1 })));
  const [slice, setSlice] = usePersist('m1.slice', { on: false, axis: 'x', pos: 2 });
  const [preds, setPreds] = usePersist('m1.preds', {});
  const [tab, setTab] = usePersist('m1.tab', 'deform');
  const [pin, setPin] = useState(null);
  const [pinId, setPinId] = useState(0);
  const [host, api, err] = useStage({ cam: [11.5, 7.5, 13.5], target: [0, -0.5, 0], fov: 36, minD: 6, maxD: 48, fit: 7.4 }, st => buildBlock(st, { onPin: setPin }));
  useEffect(() => { api.current && api.current.setTheme(readTheme()); }, [themeKey]);
  useEffect(() => { api.current && api.current.setDeform(mode, stress); }, [mode, stress]);
  useEffect(() => { api.current && api.current.setLayers(layers); }, [layers]);
  useEffect(() => { api.current && api.current.setSlice(slice); }, [slice]);
  const tap = useTap((x, y) => { if (!api.current) return; const r = api.current.pick(x, y); if (r) { setPinId(n => n + 1); setTab('pin'); } });
  const P = PREDICT[mode], pred = preds[mode];
  const locked = mode === 'flat' || pred == null;
  useEffect(() => { if (P && pred != null && stress >= 0.6) award('m1:predict:' + mode); }, [mode, pred, stress >= 0.6]);
  const modeObj = MODES.find(m => m.id === mode);
  const setLayer = (i, patch) => setLayers(ls => ls.map((l, j) => j === i ? { ...l, ...patch } : l));
  const peelNext = () => setLayers(ls => { const i = ls.findIndex(l => l.v && l.o > 0.02); if (i < 0 || i >= ls.length - 1) return ls; return ls.map((l, j) => j === i ? { ...l, v: false } : l); });
  const q = pin ? pinQuestion(pin) : null;

  return html`<div className="h-full flex flex-col lg:flex-row gap-3 pb-3 min-h-0">
    <section className="viewport flex-[1.15] lg:flex-1 min-h-[240px]" aria-label="3D structural block">
      <div ref=${host} className="absolute inset-0" ...${tap}></div>
      ${err && html`<${WebGLError} msg=${err} />`}
      <div className="hud" style=${{ top: 10, left: 10 }}>
        <div className="font-semibold">${modeObj.label}${mode !== 'flat' ? ' · ' + Math.round(stress * 100) + '%' : ''}</div>
        ${pin && html`<div>Pin ${LAYERS[pin.layer].id === 'gr' ? 'basement' : (pin.flat ? 'horizontal' : f3(pin.strike) + '/' + f2(pin.dip) + ' ' + quad(pin.dipDir))}</div>`}
      </div>
      <div className="hud hidden sm:block" style=${{ bottom: 10, left: 10 }}>Drag to orbit · pinch or scroll to zoom · tap a bed to drop a pin</div>
      <button className="hud-btn" style=${{ bottom: 10, right: 10 }} onClick=${() => api.current && api.current.reset()}>Reset view</button>
      ${pin && html`<button className="hud-btn" style=${{ top: 10, right: 10 }} onClick=${() => { api.current && api.current.clearPin(); setPin(null); }}>Clear pin</button>`}
    </section>
    <aside className="drawer flex-1 lg:flex-none lg:w-[390px]">
      <div className="p-3 pb-2 border-b border-line">
        <${Seg} label="Block tools" value=${tab} onChange=${setTab} items=${[{ id: 'deform', label: 'Deform' }, { id: 'peel', label: 'Peel' }, { id: 'slice', label: 'Slice' }, { id: 'pin', label: 'Pin' }]} />
      </div>
      <div className="scroll flex-1 p-4 flex flex-col gap-4 min-h-0">
        ${tab === 'deform' && html`
          <div className="flex flex-col gap-2">
            <p className="eyebrow">Tectonic regime</p>
            <div className="flex flex-wrap gap-2">${MODES.map(m => html`<button key=${m.id} className="chipbtn" aria-pressed=${mode === m.id} onClick=${() => { setMode(m.id); setStress(0); }}>${m.label}</button>`)}</div>
            <p className="text-sm text-mute">${modeObj.sub}</p>
          </div>
          <${Range} id="stress" label=${mode === 'flat' ? 'Stress (no stress applied)' : 'Stress / displacement'} value=${Math.round(stress * 100)} min=${0} max=${100} unit="%" disabled=${locked} onChange=${v => setStress(v / 100)} />
          ${mode === 'flat' && html`<div className="note">These beds obey the principle of original horizontality. Pick a regime above to apply stress, and you will be asked to predict the outcome first.</div>`}
          ${P && pred == null && html`<div className="card flex flex-col gap-2">
            <p className="eyebrow">Predict before you deform</p>
            <p className="text-[15px] font-medium leading-snug">${P.q}</p>
            ${P.opts.map((o, i) => html`<button key=${i} className="opt" onClick=${() => setPreds(p => ({ ...p, [mode]: i }))}>${o}</button>`)}
            <p className="text-[13px] text-mute">The stress slider unlocks once you commit to an answer.</p>
          </div>`}
          ${P && pred != null && stress < 0.6 && html`<div className="note info">Your prediction: <strong>${P.opts[pred]}</strong>. Push stress past 60% and watch the block.</div>`}
          ${P && pred != null && stress >= 0.6 && html`<div className=${'note ' + (pred === P.a ? 'ok' : 'bad')}><strong>${pred === P.a ? 'Prediction confirmed. ' : 'The rock disagreed with you. '}</strong>${P.why}</div>`}
          ${P && pred != null && html`<button className="text-[13px] text-mute underline self-start" onClick=${() => { setPreds(p => { const n = { ...p }; delete n[mode]; return n; }); setStress(0); }}>Reset this prediction</button>`}
        `}
        ${tab === 'peel' && html`
          <div className="flex items-center justify-between gap-2"><p className="eyebrow">Youngest at top</p>
            <div className="flex gap-2"><button className="chipbtn" onClick=${peelNext}>Peel next</button><button className="chipbtn" onClick=${() => setLayers(LAYERS.map(() => ({ v: true, o: 1 })))}>Restore</button></div></div>
          <ul className="flex flex-col gap-3">
            ${LAYERS.map((L, i) => { const st = layers[i] || { v: true, o: 1 }; return html`<li key=${L.id} className="flex flex-col gap-1">
              <div className="flex items-center gap-3">
                <span className="swatch" style=${{ background: L.swatch }}></span>
                <div className="flex-1 min-w-0"><div className="font-semibold text-[14px] leading-tight">${L.name}</div><div className="text-[12px] text-mute leading-tight">${L.note}</div></div>
                <button className="chipbtn" aria-pressed=${st.v} aria-label=${(st.v ? 'Hide ' : 'Show ') + L.name} onClick=${() => setLayer(i, { v: !st.v })}>${st.v ? 'Shown' : 'Hidden'}</button>
              </div>
              <input type="range" className="geo-range" aria-label=${L.name + ' opacity'} id=${'op-' + L.id} min="0" max="100" value=${Math.round(st.o * 100)} disabled=${!st.v} onChange=${e => setLayer(i, { o: +e.target.value / 100 })} />
            </li>`; })}
          </ul>
          <p className="text-[13px] text-mute">A composite teaching column: beds borrowed from several Nigerian basins, stacked on the Basement Complex. Peel down to the granite, or switch to a fault and fade the beds to see the fault plane.</p>
        `}
        ${tab === 'slice' && html`
          <div className="flex items-center justify-between gap-2">
            <p className="eyebrow">Cross-section slicer</p>
            <button className="chipbtn" aria-pressed=${slice.on} onClick=${() => setSlice(s => ({ ...s, on: !s.on }))}>${slice.on ? 'Slicing' : 'Off'}</button>
          </div>
          <${Seg} label="Cut axis" value=${slice.axis} onChange=${ax => setSlice(s => ({ ...s, axis: ax, pos: ax === 'x' ? 2 : 1 }))} items=${[{ id: 'x', label: 'N–S section (cut X)' }, { id: 'z', label: 'E–W section (cut Z)' }]} />
          <${Range} id="slicepos" label="Cut position" value=${slice.pos} min=${slice.axis === 'x' ? -5.5 : -3.2} max=${slice.axis === 'x' ? 6.5 : 3.2} step=${0.05} unit=" m" fmt=${v => v.toFixed(1)} disabled=${!slice.on} onChange=${v => setSlice(s => ({ ...s, pos: v }))} />
          <${ApparentDip} key=${pinId + ':' + slice.axis + ':' + mode} pin=${pin} slice=${slice} award=${award} />
        `}
        ${tab === 'pin' && html`
          ${!pin && html`<div className="note">Tap any bed in the 3D block to drop an outcrop pin. You will get its strike and dip and a question about why it looks the way it does.</div>`}
          ${pin && html`<div className="flex flex-col gap-3">
            <div className="flex items-center gap-3"><span className="swatch" style=${{ background: LAYERS[pin.layer].swatch }}></span>
              <div><div className="font-semibold leading-tight">${LAYERS[pin.layer].name}</div><div className="text-[12px] text-mute">${isFaultMode(pin.mode) ? (pin.hang ? 'Hanging wall' : 'Footwall') : 'Outcrop pin'} · right-hand rule</div></div></div>
            ${LAYERS[pin.layer].id === 'gr'
              ? html`<div className="note">Crystalline granite has no bedding, so there is no strike and dip to measure here.</div>`
              : html`<div className="readout"><div><span className="eyebrow">Strike</span><b>${pin.flat ? '—' : f3(pin.strike) + '°'}</b></div><div><span className="eyebrow">Dip</span><b>${f2(pin.dip)}°</b></div><div><span className="eyebrow">Dip dir.</span><b>${pin.flat ? '—' : f3(pin.dipDir) + '°'}</b></div></div>`}
            <div className="card"><${Quiz} key=${pinId + ':' + q.id} eyebrow="Why does this layer look like this?" ...${q} onSolved=${() => award('m1:pin:' + q.id)} /></div>
            <p className="text-[13px] text-mute">The pin stays on its bed as you change stress, so you can watch the reading change.</p>
          </div>`}
        `}
      </div>
    </aside>
  </div>`;
}
function ApparentDip({ pin, slice, award }){
  const [guess, setGuess] = useState(null);
  if (!slice.on) return html`<div className="note">Turn slicing on, then drag the cut through the block. Fade younger beds in the Peel tab if you want to see deeper.</div>`;
  if (!pin || LAYERS[pin.layer].id === 'gr' || pin.flat) return html`<div className="note">To compare true and apparent dip, drop a pin on a tilted bed first (Pin tab). Try the fold or a fault at 60% stress or more.</div>`;
  const trend = slice.axis === 'x' ? 0 : 90;
  const theta = Math.abs(Math.sin((trend - pin.strike) * DEG));
  const app = Math.atan(Math.tan(pin.dip * DEG) * theta) / DEG;
  const truth = (pin.dip - app) < 0.6 ? 1 : 2;
  const opts = ['Steeper than the true dip', 'The same as the true dip', 'Shallower than the true dip'];
  return html`<div className="card flex flex-col gap-2">
    <p className="eyebrow">True vs apparent dip</p>
    <p className="text-[15px] font-medium leading-snug">Your pinned bed dips ${f2(pin.dip)}° toward ${f3(pin.dipDir)}°. On this ${trend === 0 ? 'N–S' : 'E–W'} section face, will it look…</p>
    ${opts.map((o, i) => html`<button key=${i} className=${'opt ' + (guess == null ? '' : i === truth ? 'ok' : i === guess ? 'bad' : '')} disabled=${guess != null} onClick=${() => { setGuess(i); if (i === truth) award('m1:apparent'); }}>${o}</button>`)}
    ${guess != null && html`<div className=${'note ' + (guess === truth ? 'ok' : 'info')}>
      <div className="mono text-[13px] mb-1">tan α = tan δ · sin β</div>
      <div className="mono text-[13px]">δ (true) = ${pin.dip.toFixed(1)}° · β = ${Math.round(Math.asin(theta) / DEG)}° · α (apparent) = ${app.toFixed(1)}°</div>
      <p className="mt-2">β is the angle between the section line and the strike. A section cut parallel to dip direction (β = 90°) shows the true dip. Every other section shows a shallower apparent dip, and a section along strike shows the bed as flat. Apparent dip can never be steeper than true dip.</p>
    </div>`}
  </div>`;
}

