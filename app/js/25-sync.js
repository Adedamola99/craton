/* Craton · 25-sync.js
 * Optional accounts and offline-first progress sync:
 * - Non-destructive progress merge (insights, streak, exam best scores, puzzles, Field Kit progress)
 * - Portable Sync Code & JSON backup (works 100% offline between phones and laptops)
 * - Optional Supabase Auth + PostgREST cloud sync via native fetch() (zero external SDKs)
 * Loaded as a classic script; top-level consts are shared across files in load order (see app/index.html).
 */
'use strict';

const SYNC_KEYS = ['insights', 'streak', 'exam.best', 'order.solved', 'm1.preds', 'm2.solved', 'm3.obs', 'm3.log'];

function readProgressSnapshot(){
  return {
    v: 1,
    updatedAt: Date.now(),
    insights: persistGet('insights', []),
    streak: persistGet('streak', { last: null, count: 0, best: 0, days: [] }),
    examBest: persistGet('exam.best', {}),
    orderSolved: persistGet('order.solved', {}),
    m1Preds: persistGet('m1.preds', {}),
    m2Solved: persistGet('m2.solved', {}),
    m3Obs: persistGet('m3.obs', {}),
    m3Log: persistGet('m3.log', []),
  };
}

function computeStreakFromDays(days, prevBest){
  const uniq = Array.from(new Set((days || []).filter(d => typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d)))).sort();
  if (!uniq.length) return { last: null, count: 0, best: prevBest || 0, days: [] };
  const last = uniq[uniq.length - 1];
  let best = prevBest || 0, run = 0, prev = null;
  uniq.forEach(d => {
    run = (prev && dayShift(prev, 1) === d) ? run + 1 : 1;
    if (run > best) best = run;
    prev = d;
  });
  let count = 1;
  for (let i = uniq.length - 1; i > 0; i--) {
    if (dayShift(uniq[i - 1], 1) === uniq[i]) count++;
    else break;
  }
  const cutoff = dayShift(last, -60);
  return { last, count, best: Math.max(best, count), days: uniq.filter(d => d >= cutoff) };
}

function mergeProgressSnapshots(a, b){
  const A = a || {}, B = b || {};
  const insights = Array.from(new Set([...(Array.isArray(A.insights) ? A.insights : []), ...(Array.isArray(B.insights) ? B.insights : [])]));
  const sA = A.streak || {}, sB = B.streak || {};
  const days = [...(Array.isArray(sA.days) ? sA.days : []), ...(Array.isArray(sB.days) ? sB.days : [])];
  if (sA.last) days.push(sA.last);
  if (sB.last) days.push(sB.last);
  const streak = computeStreakFromDays(days, Math.max(sA.best || 0, sB.best || 0, sA.count || 0, sB.count || 0));

  const examBest = { ...(A.examBest || {}) };
  Object.entries(B.examBest || {}).forEach(([u, sc]) => {
    if (typeof sc === 'number') examBest[u] = Math.max(examBest[u] || 0, sc);
  });

  const orderSolved = { ...(A.orderSolved || {}), ...(B.orderSolved || {}) };
  const m1Preds = { ...(A.m1Preds || {}), ...(B.m1Preds || {}) };
  const m2Solved = { ...(A.m2Solved || {}), ...(B.m2Solved || {}) };

  const m3Obs = { ...(A.m3Obs || {}) };
  Object.entries(B.m3Obs || {}).forEach(([sid, oB]) => {
    const oA = m3Obs[sid];
    if (!oA || (!oA.solved && oB && oB.solved)) m3Obs[sid] = oB;
    else if (oB) m3Obs[sid] = { ...oB, ...oA, solved: !!(oA.solved || oB.solved) };
  });

  const seenLog = new Set(), m3Log = [];
  [...(Array.isArray(A.m3Log) ? A.m3Log : []), ...(Array.isArray(B.m3Log) ? B.m3Log : [])]
    .filter(r => r && typeof r.t === 'number')
    .sort((x, y) => y.t - x.t)
    .forEach(r => { if (!seenLog.has(r.t)) { seenLog.add(r.t); if (m3Log.length < 30) m3Log.push(r); } });

  return {
    v: 1,
    updatedAt: Math.max(A.updatedAt || 0, B.updatedAt || 0, Date.now()),
    insights,
    streak,
    examBest,
    orderSolved,
    m1Preds,
    m2Solved,
    m3Obs,
    m3Log,
  };
}

let _applyingSync = false;
function applyProgressSnapshot(snap){
  if (!snap) return readProgressSnapshot();
  const merged = mergeProgressSnapshots(readProgressSnapshot(), snap);
  _applyingSync = true;
  try {
    persistSet('insights', merged.insights);
    persistSet('streak', merged.streak);
    persistSet('exam.best', merged.examBest);
    persistSet('order.solved', merged.orderSolved);
    persistSet('m1.preds', merged.m1Preds);
    persistSet('m2.solved', merged.m2Solved);
    persistSet('m3.obs', merged.m3Obs);
    persistSet('m3.log', merged.m3Log);
  } finally {
    _applyingSync = false;
  }
  return merged;
}

function encodeSyncCode(snap){
  const payload = JSON.stringify(snap || readProgressSnapshot());
  const bytes = new TextEncoder().encode(payload);
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return 'CRATON1:' + btoa(bin);
}

function decodeSyncCode(raw){
  const str = String(raw || '').trim();
  if (!str) throw new Error('Paste a Craton sync code or JSON backup first.');
  let jsonStr = str;
  if (str.startsWith('CRATON1:')) {
    const b64 = str.slice(8).replace(/\s+/g, '');
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    jsonStr = new TextDecoder().decode(bytes);
  }
  const parsed = JSON.parse(jsonStr);
  if (!parsed || typeof parsed !== 'object' || (!Array.isArray(parsed.insights) && !parsed.streak)) {
    throw new Error('This code does not look like a valid Craton progress backup.');
  }
  return parsed;
}

/* ---------- Optional Supabase Cloud Client (native fetch, zero SDK) ---------- */
function getCloudConfig(){
  const cfg = persistGet('auth.cloud', null) || (typeof window !== 'undefined' && window.CRATON_CLOUD) || null;
  if (cfg && cfg.url && cfg.anonKey) {
    return { url: String(cfg.url).replace(/\/+$/, ''), anonKey: String(cfg.anonKey).trim() };
  }
  return null;
}

async function sbFetch(cfg, path, opts){
  const ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timer = ctrl ? setTimeout(() => ctrl.abort(), 7000) : 0;
  try {
    const headers = Object.assign({
      'apikey': cfg.anonKey,
      'Content-Type': 'application/json',
    }, (opts && opts.headers) || {});
    const res = await fetch(cfg.url + path, Object.assign({}, opts, { headers, signal: ctrl ? ctrl.signal : undefined }));
    const text = await res.text();
    let data = null;
    try { data = text ? JSON.parse(text) : null; } catch (e) {}
    if (!res.ok) {
      const msg = (data && (data.msg || data.error_description || data.message || data.error)) || ('Cloud error (' + res.status + ')');
      throw new Error(msg);
    }
    return data;
  } finally {
    if (timer) clearTimeout(timer);
  }
}

async function cloudAuthSignIn(cfg, email, password, isSignUp, name){
  const endpoint = isSignUp ? '/auth/v1/signup' : '/auth/v1/token?grant_type=password';
  const body = isSignUp
    ? { email, password, data: { name: name || email.split('@')[0] } }
    : { email, password };
  const data = await sbFetch(cfg, endpoint, { method: 'POST', body: JSON.stringify(body) });
  const user = data.user || (data.session && data.session.user) || { id: data.id, email };
  const token = data.access_token || (data.session && data.session.access_token) || null;
  return {
    id: user.id || ('usr_' + strHash(email)),
    email: user.email || email,
    name: (user.user_metadata && user.user_metadata.name) || name || email.split('@')[0],
    token,
    mode: token ? 'cloud' : 'pending_confirm',
  };
}

async function cloudSyncProfile(cfg, account){
  if (!cfg || !account || !account.token || !account.id) throw new Error('Sign in with cloud credentials to sync.');
  const authHeaders = { 'Authorization': 'Bearer ' + account.token };
  const rows = await sbFetch(
    cfg,
    '/rest/v1/craton_profiles?user_id=eq.' + encodeURIComponent(account.id) + '&select=progress,updated_at',
    { method: 'GET', headers: authHeaders }
  );
  const remoteSnap = Array.isArray(rows) && rows[0] && rows[0].progress ? rows[0].progress : null;
  const merged = applyProgressSnapshot(remoteSnap);
  await sbFetch(cfg, '/rest/v1/craton_profiles', {
    method: 'POST',
    headers: Object.assign({}, authHeaders, { 'Prefer': 'resolution=merge-duplicates,return=minimal' }),
    body: JSON.stringify({
      user_id: account.id,
      email: account.email,
      display_name: account.name || '',
      progress: merged,
      updated_at: new Date().toISOString(),
    }),
  });
  return merged;
}

/* ---------- Hook & Modal for App Shell ---------- */
function useCloudSync(){
  const [account, setAccount] = usePersist('auth.account', null);
  const [lastSync, setLastSync] = usePersist('auth.lastSync', null);
  const [syncState, setSyncState] = useState('idle'); // 'idle' | 'syncing' | 'ok' | 'offline' | 'error'
  const [syncMsg, setSyncMsg] = useState('');

  const syncNow = useCallback(async (accOverride) => {
    const acc = accOverride || account;
    if (!acc) return false;
    const cfg = getCloudConfig();
    if (!cfg || acc.mode !== 'cloud' || !acc.token) {
      const now = Date.now();
      setLastSync(now);
      setSyncState('ok');
      setSyncMsg('Saved on this device. Use your Sync Code to move progress to another phone.');
      return true;
    }
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      setSyncState('offline');
      setSyncMsg('Offline: progress is saved on this device and will sync when you reconnect.');
      return false;
    }
    setSyncState('syncing');
    setSyncMsg('Syncing progress…');
    try {
      await cloudSyncProfile(cfg, acc);
      const now = Date.now();
      setLastSync(now);
      setSyncState('ok');
      setSyncMsg('Cloud synced across your devices.');
      return true;
    } catch (e) {
      setSyncState('error');
      setSyncMsg('Saved locally (' + (e.message || 'cloud unreachable') + ').');
      return false;
    }
  }, [account, setLastSync]);

  // Auto-sync when progress keys change or when browser comes back online
  useEffect(() => {
    if (!account) return;
    let timer = 0;
    const onPersistChange = key => {
      if (_applyingSync || !SYNC_KEYS.includes(key)) return;
      clearTimeout(timer);
      timer = setTimeout(() => { syncNow(); }, 2000);
    };
    PERSIST_ANY.push(onPersistChange);
    const onOnline = () => { syncNow(); };
    window.addEventListener('online', onOnline);
    return () => {
      clearTimeout(timer);
      const idx = PERSIST_ANY.indexOf(onPersistChange);
      if (idx >= 0) PERSIST_ANY.splice(idx, 1);
      window.removeEventListener('online', onOnline);
    };
  }, [account, syncNow]);

  return { account, setAccount, lastSync, setLastSync, syncState, syncMsg, setSyncMsg, syncNow };
}

function SyncModal({ sync, onClose }){
  const { account, setAccount, lastSync, setLastSync, syncState, syncMsg, setSyncMsg, syncNow } = sync;
  const [tab, setTab] = useState(account ? 'profile' : 'signin');
  const [authMode, setAuthMode] = useState('signin'); // 'signin' | 'signup'
  const [name, setName] = useState((account && account.name) || '');
  const [email, setEmail] = useState((account && account.email) || '');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [codeOut, setCodeOut] = useState(() => encodeSyncCode(readProgressSnapshot()));
  const [codeIn, setCodeIn] = useState('');
  const [copied, setCopied] = useState(false);
  const [importOk, setImportOk] = useState('');
  const [showCloudCfg, setShowCloudCfg] = useState(false);
  const existingCfg = getCloudConfig();
  const [cloudUrl, setCloudUrl] = useState((existingCfg && existingCfg.url) || '');
  const [cloudKey, setCloudKey] = useState((existingCfg && existingCfg.anonKey) || '');

  useEffect(() => {
    const onKey = e => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const snap = readProgressSnapshot();
  const cloudConfigured = !!getCloudConfig();

  const handleSignIn = async e => {
    e.preventDefault();
    setErr('');
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim() || cleanEmail.split('@')[0] || 'Student';
    if (!cleanEmail) { setErr('Enter your email or student ID.'); return; }
    const cfg = getCloudConfig();
    if (cfg && password.trim()) {
      setBusy(true);
      try {
        const acc = await cloudAuthSignIn(cfg, cleanEmail, password, authMode === 'signup', cleanName);
        setAccount(acc);
        setPassword('');
        setTab('profile');
        if (acc.token) await syncNow(acc);
        else setSyncMsg('Check your email to confirm your account. Your progress remains saved on this device.');
      } catch (ex) {
        setErr(ex.message || 'Could not reach cloud server.');
      } finally {
        setBusy(false);
      }
      return;
    }
    // Local/offline account profile (works without internet or server setup)
    const localAcc = {
      id: 'local_' + strHash(cleanEmail),
      email: cleanEmail,
      name: cleanName,
      mode: 'local',
      createdAt: Date.now(),
    };
    setAccount(localAcc);
    setLastSync(Date.now());
    setSyncMsg('Signed in on this device. Use Sync Code anytime to merge progress with another phone.');
    setTab('profile');
  };

  const handleCopyCode = async () => {
    const fresh = encodeSyncCode(readProgressSnapshot());
    setCodeOut(fresh);
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(fresh);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }
    } catch (e) {}
  };

  const handleDownloadJson = () => {
    const payload = JSON.stringify(readProgressSnapshot(), null, 2);
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'craton-progress-' + dayKey() + '.json';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const handleMergeCode = () => {
    setErr('');
    setImportOk('');
    try {
      const incoming = decodeSyncCode(codeIn);
      const merged = applyProgressSnapshot(incoming);
      setCodeOut(encodeSyncCode(merged));
      setCodeIn('');
      setLastSync(Date.now());
      setImportOk('Merged! You now have ' + merged.insights.length + ' insights and a ' + (merged.streak.count || 0) + '-day streak.');
      if (account && account.mode === 'cloud') syncNow();
    } catch (ex) {
      setErr(ex.message || 'Invalid sync code.');
    }
  };

  const handleSaveCloudConfig = () => {
    const u = cloudUrl.trim().replace(/\/+$/, ''), k = cloudKey.trim();
    if (!u || !k) {
      persistSet('auth.cloud', null);
      setSyncMsg('Cloud server cleared. Using offline device storage and Sync Codes.');
    } else {
      persistSet('auth.cloud', { url: u, anonKey: k });
      setSyncMsg('Cloud server saved. Sign in with email and password to sync online.');
    }
    setShowCloudCfg(false);
  };

  return html`<div className="fixed inset-0 z-50 flex items-center justify-center p-4" style=${{ background: 'color-mix(in srgb, var(--ink) 50%, transparent)' }} role="dialog" aria-modal="true" aria-labelledby="sync-title">
    <div className="card w-full max-w-[460px] max-h-[90vh] flex flex-col gap-3 overflow-hidden" style=${{ padding: 20 }}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="eyebrow">Offline-first account & sync</p>
          <h2 id="sync-title" className="display text-[22px] leading-tight">${account ? account.name : 'Save & sync your progress'}</h2>
        </div>
        <button className="chipbtn" onClick=${onClose} aria-label="Close account dialog">Close</button>
      </div>

      <${Seg} label="Account sections" value=${tab} onChange=${t => { setTab(t); setErr(''); setImportOk(''); setCodeOut(encodeSyncCode(readProgressSnapshot())); }}
        items=${[
          { id: account ? 'profile' : 'signin', label: account ? 'Account' : 'Sign in' },
          { id: 'code', label: 'Sync code' },
        ]} />

      <div className="scroll flex-1 flex flex-col gap-3 pr-1">
        <div className="readout">
          <div><span className="eyebrow">Insights</span><b>${snap.insights.length}</b></div>
          <div><span className="eyebrow">Streak</span><b>${snap.streak.count || 0}d</b></div>
          <div><span className="eyebrow">Best streak</span><b>${snap.streak.best || 0}d</b></div>
        </div>

        ${tab === 'signin' && !account && html`
          <form className="flex flex-col gap-2.5" onSubmit=${handleSignIn}>
            <p className="text-[14px] text-mute leading-snug">
              Craton always saves your work on this phone, even offline and signed out. Sign in to label your profile${cloudConfigured ? ' and sync automatically across devices' : ' or transfer progress between phones with a Sync Code'}.
            </p>
            ${cloudConfigured && html`<${Seg} label="Sign in or create account" value=${authMode} onChange=${setAuthMode} items=${[{ id: 'signin', label: 'Sign in' }, { id: 'signup', label: 'Create account' }]} />`}
            <div className="flex flex-col gap-1">
              <label htmlFor="sync-name" className="eyebrow">Your name</label>
              <input id="sync-name" type="text" className="opt" placeholder="e.g. Amina Bello" value=${name} onChange=${e => setName(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="sync-email" className="eyebrow">Email or student ID</label>
              <input id="sync-email" type="text" className="opt" placeholder="you@university.edu.ng" value=${email} onChange=${e => setEmail(e.target.value)} required />
            </div>
            ${cloudConfigured && html`<div className="flex flex-col gap-1">
              <label htmlFor="sync-pass" className="eyebrow">Password (for cloud sync)</label>
              <input id="sync-pass" type="password" className="opt" placeholder="••••••••" value=${password} onChange=${e => setPassword(e.target.value)} />
            </div>`}
            ${err && html`<div className="note bad">${err}</div>`}
            <button type="submit" className="btn primary" disabled=${busy}>${busy ? 'Connecting…' : (cloudConfigured && password ? (authMode === 'signup' ? 'Create cloud account' : 'Sign in & sync') : 'Save profile on this device')}</button>
          </form>
        `}

        ${tab === 'profile' && account && html`
          <div className="card flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div>
                <div className="font-semibold text-[15px]">${account.name}</div>
                <div className="mono text-[12px] text-mute">${account.email}</div>
              </div>
              <span className="chipbtn" style=${{ minHeight: 28, padding: '2px 10px', fontSize: 12 }}>
                ${account.mode === 'cloud' ? 'Cloud account' : 'Local profile'}
              </span>
            </div>
            ${lastSync && html`<p className="mono text-[12px] text-mute">Last synced: ${new Date(lastSync).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>`}
            ${syncMsg && html`<div className=${'note ' + (syncState === 'error' ? 'bad' : syncState === 'ok' ? 'ok' : 'info')}>${syncMsg}</div>`}
            <div className="flex flex-wrap gap-2 mt-1">
              <button className="btn primary flex-1" disabled=${syncState === 'syncing'} onClick=${() => syncNow()}>
                ${syncState === 'syncing' ? 'Syncing…' : account.mode === 'cloud' ? 'Sync now' : 'Save checkpoint'}
              </button>
              <button className="btn" onClick=${() => setTab('code')}>Get Sync Code</button>
              <button className="btn" onClick=${() => { setAccount(null); setSyncMsg('Signed out. Your progress stays on this device.'); setTab('signin'); }}>Sign out</button>
            </div>
          </div>
        `}

        ${tab === 'code' && html`
          <div className="flex flex-col gap-2.5">
            <p className="text-[14px] text-mute leading-snug">
              Moving to another phone or computer without internet? Copy your Sync Code below and paste it on the other device. Both devices' progress will be merged safely—nothing is overwritten.
            </p>
            <div className="flex flex-col gap-1">
              <label htmlFor="sync-code-out" className="eyebrow">Your sync code (copy from this device)</label>
              <textarea id="sync-code-out" readOnly rows="2" className="opt mono text-[12px]" value=${codeOut} onFocus=${e => e.target.select()}></textarea>
              <div className="flex flex-wrap gap-2 mt-1">
                <button className="btn primary flex-1" onClick=${handleCopyCode}>${copied ? 'Copied to clipboard ✓' : 'Copy sync code'}</button>
                <button className="btn" onClick=${handleDownloadJson}>Download .json</button>
              </div>
            </div>
            <div className="border-t border-line pt-2.5 flex flex-col gap-1.5">
              <label htmlFor="sync-code-in" className="eyebrow">Merge a sync code from another device</label>
              <textarea id="sync-code-in" rows="2" className="opt mono text-[12px]" placeholder="Paste CRATON1:... or JSON here" value=${codeIn} onChange=${e => setCodeIn(e.target.value)}></textarea>
              ${err && html`<div className="note bad">${err}</div>`}
              ${importOk && html`<div className="note ok">${importOk}</div>`}
              <button className="btn primary self-start" disabled=${!codeIn.trim()} onClick=${handleMergeCode}>Merge into this device</button>
            </div>
          </div>
        `}

        <div className="border-t border-line pt-2 flex flex-col gap-2">
          <button className="text-[12px] text-mute underline self-start" onClick=${() => setShowCloudCfg(s => !s)}>
            ${showCloudCfg ? 'Hide cloud server settings' : (cloudConfigured ? 'Cloud server connected · Edit' : 'Connect a Supabase cloud server (optional)')}
          </button>
          ${showCloudCfg && html`<div className="card flex flex-col gap-2">
            <p className="text-[12px] text-mute leading-snug">
              Optional: connect a Supabase project (see <span className="mono">docs/supabase-schema.sql</span>) for automatic online sync. Leave blank to use offline device storage and Sync Codes.
            </p>
            <label htmlFor="cfg-url" className="eyebrow">Supabase Project URL</label>
            <input id="cfg-url" type="url" className="opt mono text-[12px]" placeholder="https://xxxx.supabase.co" value=${cloudUrl} onChange=${e => setCloudUrl(e.target.value)} />
            <label htmlFor="cfg-key" className="eyebrow">Supabase Anon Public Key</label>
            <input id="cfg-key" type="text" className="opt mono text-[12px]" placeholder="eyJhbGciOi..." value=${cloudKey} onChange=${e => setCloudKey(e.target.value)} />
            <div className="flex gap-2">
              <button className="btn primary" onClick=${handleSaveCloudConfig}>Save server settings</button>
              ${cloudConfigured && html`<button className="btn" onClick=${() => { setCloudUrl(''); setCloudKey(''); persistSet('auth.cloud', null); setShowCloudCfg(false); }}>Disconnect</button>`}
            </div>
          </div>`}
        </div>
      </div>
    </div>
  </div>`;
}
