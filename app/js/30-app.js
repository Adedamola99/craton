/* Craton · 30-app.js
 * App shell: navigation tabs, theme switch, streak/insight state, routing between sections, and the React mount.
 * Loaded as a classic script; top-level consts are shared across files in load order (see app/index.html).
 */
'use strict';
/* ================================== shell ================================== */
const TABS = [
  { id: 'today', label: 'Today', icon: html`<circle cx="12" cy="12" r="4" /><path d="M12 2v2 M12 20v2 M2 12h2 M20 12h2 M4.9 4.9l1.4 1.4 M17.7 17.7l1.4 1.4 M4.9 19.1l1.4-1.4 M17.7 6.3l1.4-1.4" />` },
  { id: 'atlas', label: 'Atlas', icon: html`<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5z M4 21.5V5.5 M8 7h8 M8 11h6" />` },
  { id: 'practice', label: 'Practice', icon: html`<path d="M9 11l3 3 8-8 M20 12v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h9" />` },
  { id: 'nigeria', label: 'Nigeria', icon: html`<path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.5" />` },
  { id: 'kit', label: 'Field kit', icon: html`<path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.6 2.6-2.4-.6-.6-2.4z" />` },
];
function Icon({ children }){ return html`<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" aria-hidden="true">${children}</svg>`; }
function useSystemDark(){
  const mq = useMemo(() => window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null, []);
  const [d, setD] = useState(mq ? mq.matches : false);
  useEffect(() => { if (!mq) return; const h = e => setD(e.matches); mq.addEventListener ? mq.addEventListener('change', h) : mq.addListener(h); return () => { mq.removeEventListener ? mq.removeEventListener('change', h) : mq.removeListener(h); }; }, [mq]);
  return d;
}
function App(){
  const [tab, setTab] = usePersist('tab2', 'today');
  const [kitTool, setKitTool] = usePersist('kit.tool', null);
  const [theme, setTheme] = useState(() => document.documentElement.getAttribute('data-theme'));
  const [attrTick, setAttrTick] = useState(0);
  const [insights, setInsights] = usePersist('insights', []);
  const [streak, setStreak] = usePersist('streak', { last: null, count: 0, best: 0, days: [] });
  const [tourDone, setTourDone] = usePersist('tour.done', false);
  const [tourOpen, setTourOpen] = useState(false);
  const [syncOpen, setSyncOpen] = useState(false);
  const sync = useCloudSync();
  useEffect(() => { if (!tourDone) setTourOpen(true); }, []);
  const sysDark = useSystemDark();
  useLayoutEffect(() => { if (theme) document.documentElement.setAttribute('data-theme', theme); }, [theme]);
  useEffect(() => { const mo = new MutationObserver(() => setAttrTick(t => t + 1)); mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] }); return () => mo.disconnect(); }, []);
  const attr = document.documentElement.getAttribute('data-theme');
  const dark = attr ? attr === 'dark' : sysDark;
  const themeKey = (dark ? 'd' : 'l') + attrTick;
  const award = useCallback(id => setInsights(s => s.includes(id) ? s : [...s, id]), []);
  const markDay = useCallback(() => setStreak(s => { const t = dayKey(); if (s.last === t) return s; const count = s.last === dayShift(t, -1) ? s.count + 1 : 1;
    return { last: t, count, best: Math.max(s.best || 0, count), days: [...(s.days || []).filter(d => d >= dayShift(t, -40)), t] }; }), []);
  const go = useMemo(() => ({
    model(id, variant){ persistSet('atlas.sel', id); if (variant) persistSet('atlas.' + id + '.v', variant); setTab('atlas'); },
    tool(t){ setKitTool(t); setTab('kit'); },
    tab(t, sub){ if (t === 'practice' && sub) persistSet('pr.tab', sub); if (t === 'atlas') persistSet('atlas.sel', null); setTab(t); },
  }), []);
  const live = streak.last === dayKey() || streak.last === dayShift(dayKey(), -1) ? streak.count : 0;
  const closeTour = () => { setTourOpen(false); setTourDone(true); };
  let body;
  if (tab === 'atlas') body = html`<${AtlasModule} themeKey=${themeKey} award=${award} onJump=${t => go.tool(t)} insights=${insights} />`;
  else if (tab === 'practice') body = html`<${PracticeModule} award=${award} go=${go} />`;
  else if (tab === 'nigeria') body = html`<${NigeriaModule} go=${go} />`;
  else if (tab === 'kit') body = html`<${KitModule} themeKey=${themeKey} award=${award} tool=${kitTool} setTool=${setKitTool} />`;
  else body = html`<${TodayModule} award=${award} go=${go} insights=${insights} streak=${streak} markDay=${markDay} openTour=${() => setTourOpen(true)} openSync=${() => setSyncOpen(true)} account=${sync.account} />`;
  return html`<div className="app">
    <header className="flex items-center gap-2 sm:gap-3 py-2.5">
      <button className="flex items-center gap-2 min-w-0 text-left" onClick=${() => setTab('today')} aria-label="Craton home">
        <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden="true"><rect x="2" y="4" width="24" height="5" rx="1.5" fill="var(--acc)" /><rect x="2" y="10" width="24" height="5" rx="1.5" fill="var(--ink)" opacity=".85" /><path d="M2 16h11l3 6H2z" fill="var(--acc2)" /><path d="M16 16h10v6h-7z" fill="var(--mute)" /></svg>
        <span className="min-w-0"><span className="brand text-[21px] leading-none block">Craton</span><span className="text-[11px] text-mute leading-tight hidden sm:block">Geology in 3D · built for Africa</span></span>
      </button>
      <nav className="topnav hidden lg:flex gap-1 ml-6" aria-label="Sections">${TABS.map(t => html`<button key=${t.id} aria-current=${tab === t.id ? 'page' : undefined} onClick=${() => { if (t.id === 'kit' && tab === 'kit') setKitTool(null); setTab(t.id); }}><${Icon}>${t.icon}<//>${t.label}</button>`)}</nav>
      <div className="flex-1"></div>
      <div className="flex items-center gap-1.5" title="Day streak"><svg width="18" height="18" viewBox="0 0 24 24" fill="var(--acc)" aria-hidden="true"><path d="M12 2c1 4-3 6-3 10a3 3 0 0 0 6 0c0-1.5-.8-2.6-.8-2.6S18 11 18 15a6 6 0 0 1-12 0c0-6 6-8 6-13z" /></svg><span className="mono text-[15px] font-semibold">${live}</span><span className="sr-only">day streak</span></div>
      <div className="text-right leading-tight hidden sm:block" title="Predictions, pins and answers you have reasoned through"><div className="mono text-[15px] font-semibold">${insights.length}</div><div className="eyebrow" style=${{ fontSize: 10 }}>insights</div></div>
      <button className="chipbtn" style=${{ minHeight: 38, padding: '6px 10px' }} onClick=${() => setSyncOpen(true)} aria-label="Account and progress sync" title="Sign in or sync progress across devices">
        ${sync.account ? sync.account.name.split(' ')[0].slice(0, 10) : 'Sync'}
      </button>
      <div className="seg" role="group" aria-label="Theme" style=${{ minWidth: 0 }}>
        <button aria-pressed=${!dark} onClick=${() => setTheme('light')} title="High-contrast daylight theme for outcrops">Field</button>
        <button aria-pressed=${dark} onClick=${() => setTheme('dark')} title="Low-glare theme for night study">Lab</button>
      </div>
    </header>
    <main className="flex-1 min-h-0" key=${tab}>${body}</main>
    <nav className="lg:hidden grid grid-cols-5 gap-1 border-t border-line pt-1" style=${{ paddingBottom: 4 }} aria-label="Sections">
      ${TABS.map(t => html`<button key=${t.id} className="navbtn" aria-current=${tab === t.id ? 'page' : undefined} onClick=${() => { if (t.id === 'kit' && tab === 'kit') setKitTool(null); setTab(t.id); }}><${Icon}>${t.icon}<//>${t.label}</button>`)}
    </nav>
    ${tourOpen && html`<${Tour} onClose=${closeTour} />`}
    ${syncOpen && html`<${SyncModal} sync=${sync} onClose=${() => setSyncOpen(false)} />`}
  </div>`;
}

ReactDOM.createRoot(document.getElementById('root')).render(html`<${App} />`);
