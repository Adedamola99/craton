/* Craton · 26-classroom.js
 * Class codes and Lecturer Dashboard:
 * - Lecturers create a class, set a unit/topic challenge, and get a short Class Code.
 * - Students join with a Class Code and complete the challenge using Craton's predict-first hint pedagogy.
 * - Lecturer Dashboard ranks which questions the class misses most, highlights the top misconception,
 *   and links directly to the 3D model to teach it in class.
 * - Works offline (deterministic class codes, pasteable submission codes, sample cohort) and syncs via Supabase when configured.
 * Loaded as a classic script; top-level consts are shared across files in load order (see app/index.html).
 */
'use strict';

const PRESET_CLASSES = {
  GLY101: {
    code: 'GLY101',
    title: 'GLY 101 · Introductory Physical Geology',
    lecturer: 'Dept. of Geology',
    unit: 'All',
    count: 6,
    seed: 101,
  },
  STR204: {
    code: 'STR204',
    title: 'GLY 204 · Structural Geology & Benue Trough',
    lecturer: 'Dr. Okafor',
    unit: 'Structures and time',
    count: 6,
    seed: 204,
  },
  RES302: {
    code: 'RES302',
    title: 'GLY 302 · Earth Resources & Hydrogeology',
    lecturer: 'Prof. Danjuma',
    unit: 'Earth resources',
    count: 5,
    seed: 302,
  },
};

function buildClassQuestions(cls){
  const pool = MC_POOL.filter(q => !cls.unit || cls.unit === 'All' || q.unit === cls.unit);
  const src = pool.length ? pool : MC_POOL;
  const r = rng(cls.seed || strHash(cls.code || 'GLY101'));
  return shuffled(src, r).slice(0, clamp(cls.count || 6, 3, Math.min(10, src.length)));
}

function makeShortClassCode(title, unit, count){
  const prefix = (unit && unit !== 'All' ? unit.replace(/[^A-Za-z]/g, '').slice(0, 3) : (title || 'GLY').replace(/[^A-Za-z]/g, '').slice(0, 3)).toUpperCase().padEnd(3, 'G');
  const num = 100 + (strHash((title || '') + ':' + (unit || 'All') + ':' + count + ':' + Date.now()) % 900);
  return prefix + num;
}

function encodeClassToken(cls){
  const min = { c: cls.code, t: cls.title, l: cls.lecturer || '', u: cls.unit || 'All', n: cls.count || 6, s: cls.seed || strHash(cls.code) };
  const bytes = new TextEncoder().encode(JSON.stringify(min));
  let bin = ''; for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return 'CRATON-CLS:' + btoa(bin);
}

function decodeClassInput(raw, customClasses){
  const str = String(raw || '').trim();
  if (!str) throw new Error('Enter a class code (for example GLY101) or paste a challenge code.');
  if (str.startsWith('CRATON-CLS:')) {
    const bin = atob(str.slice(11).replace(/\s+/g, ''));
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    const d = JSON.parse(new TextDecoder().decode(bytes));
    return { code: d.c, title: d.t, lecturer: d.l, unit: d.u, count: d.n, seed: d.s };
  }
  const clean = str.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (customClasses && customClasses[clean]) return customClasses[clean];
  if (PRESET_CLASSES[clean]) return PRESET_CLASSES[clean];
  if (/^[A-Z]{3}\d{3}$/.test(clean)) {
    const pref = clean.slice(0, 3);
    const matchedUnit = UNITS.find(u => u.replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase() === pref) || 'All';
    return {
      code: clean,
      title: 'Class ' + clean + ' (' + matchedUnit + ')',
      lecturer: 'Class challenge',
      unit: matchedUnit,
      count: 6,
      seed: strHash(clean),
    };
  }
  throw new Error('Class code "' + str + '" was not recognised. Try GLY101, STR204, RES302, a 6-character code like STR482, or a CRATON-CLS:... code.');
}

function encodeSubmissionToken(sub){
  const bytes = new TextEncoder().encode(JSON.stringify(sub));
  let bin = ''; for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return 'CRATON-SUB:' + btoa(bin);
}

function decodeSubmissionToken(raw){
  const str = String(raw || '').trim();
  if (!str.startsWith('CRATON-SUB:')) throw new Error('Submission codes must start with CRATON-SUB:');
  const bin = atob(str.slice(11).replace(/\s+/g, ''));
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  const sub = JSON.parse(new TextDecoder().decode(bytes));
  if (!sub || !sub.code || !sub.answers) throw new Error('Invalid submission code.');
  return sub;
}

function generateSampleSubmissions(cls){
  const qs = buildClassQuestions(cls);
  const names = [
    'Amina Bello', 'Chinedu Okafor', 'Tunde Adeyemi', 'Ngozi Eze', 'Ibrahim Musa',
    'Funke Ojo', 'Emeka Nwosu', 'Zainab Lawal', 'Sadiq Abdullahi', 'Blessing Okon',
    'Yusuf Garba', 'Chioma Nnaji', 'Damilola Balogun', 'Fatima Usman', 'Kelechi Ibe',
    'Halima Sani', 'Segun Obasanjo', 'Adaeze Obi', 'Musa Danjuma', 'Bolanle Alabi',
  ];
  const r = rng(strHash('sample:' + cls.code));
  return names.map((student, idx) => {
    const answers = {};
    qs.forEach((q, qi) => {
      // Make some questions systematically harder so lecturers see realistic misconception patterns
      const difficulty = ((qi * 37 + q.id.length * 13) % 10) / 10;
      const threshold = 0.25 + difficulty * 0.48;
      if (r() > threshold) {
        answers[q.id] = q.a;
      } else {
        const wrongOpts = q.opts.map((_, oi) => oi).filter(oi => oi !== q.a);
        // Bias toward one dominant distractor (common misconception)
        const distractor = wrongOpts[0] != null ? (r() < 0.72 ? wrongOpts[0] : wrongOpts[Math.floor(r() * wrongOpts.length)]) : 0;
        answers[q.id] = distractor;
      }
    });
    return {
      id: 'sim_' + cls.code + '_' + idx,
      code: cls.code,
      student,
      t: Date.now() - (names.length - idx) * 180000,
      answers,
    };
  });
}

/* ---------- Optional Cloud Classroom Sync ---------- */
async function cloudSaveClass(cls){
  const cfg = typeof getCloudConfig === 'function' ? getCloudConfig() : null;
  if (!cfg) return false;
  try {
    await sbFetch(cfg, '/rest/v1/craton_classes', {
      method: 'POST',
      headers: { 'Prefer': 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify({
        code: cls.code,
        title: cls.title,
        lecturer: cls.lecturer || '',
        unit: cls.unit || 'All',
        question_count: cls.count || 6,
        seed: cls.seed || strHash(cls.code),
      }),
    });
    return true;
  } catch (e) { return false; }
}

async function cloudPushSubmission(sub){
  const cfg = typeof getCloudConfig === 'function' ? getCloudConfig() : null;
  if (!cfg) return false;
  try {
    await sbFetch(cfg, '/rest/v1/craton_class_submissions', {
      method: 'POST',
      headers: { 'Prefer': 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify({
        submission_id: sub.id,
        class_code: sub.code,
        student_name: sub.student,
        answers: sub.answers,
        submitted_at: new Date(sub.t || Date.now()).toISOString(),
      }),
    });
    return true;
  } catch (e) { return false; }
}

async function cloudFetchSubmissions(code){
  const cfg = typeof getCloudConfig === 'function' ? getCloudConfig() : null;
  if (!cfg) return null;
  const rows = await sbFetch(
    cfg,
    '/rest/v1/craton_class_submissions?class_code=eq.' + encodeURIComponent(code) + '&select=submission_id,class_code,student_name,answers,submitted_at',
    { method: 'GET' }
  );
  if (!Array.isArray(rows)) return null;
  return rows.map(r => ({
    id: r.submission_id,
    code: r.class_code,
    student: r.student_name || 'Student',
    answers: r.answers || {},
    t: r.submitted_at ? new Date(r.submitted_at).getTime() : Date.now(),
  }));
}

/* ---------- Student View: Join Class & Complete Challenge ---------- */
function StudentClassView({ award, go, classes, setClasses, submissions, setSubmissions }){
  const [joinedCode, setJoinedCode] = usePersist('cls.joined', 'GLY101');
  const [codeInput, setCodeInput] = useState('');
  const [joinErr, setJoinErr] = useState('');
  const [activeSes, setActiveSes] = useState(null);
  const [lastSubCode, setLastSubCode] = useState('');
  const [copiedSub, setCopiedSub] = useState(false);
  const account = persistGet('auth.account', null);
  const [studentName, setStudentName] = usePersist('cls.studentName', (account && account.name) || '');

  const currentClass = useMemo(() => {
    try { return decodeClassInput(joinedCode, classes); }
    catch (e) { return PRESET_CLASSES.GLY101; }
  }, [joinedCode, classes]);

  const qs = useMemo(() => buildClassQuestions(currentClass), [currentClass]);
  const mySubmissions = (submissions[currentClass.code] || []).filter(s => s.isMine);
  const latestMine = mySubmissions[0] || null;

  const handleJoin = e => {
    e.preventDefault();
    setJoinErr('');
    try {
      const cls = decodeClassInput(codeInput, classes);
      setClasses(all => ({ ...all, [cls.code]: cls }));
      setJoinedCode(cls.code);
      setCodeInput('');
      setActiveSes(null);
      setLastSubCode('');
    } catch (ex) {
      setJoinErr(ex.message || 'Invalid class code.');
    }
  };

  const startChallenge = () => {
    setLastSubCode('');
    setActiveSes({ i: 0, firstPick: {}, tries: [] });
  };

  if (activeSes) {
    const n = qs.length;
    if (activeSes.i >= n) {
      const firstCorrect = qs.filter(q => activeSes.firstPick[q.id] === q.a).length;
      const missedQs = qs.filter(q => activeSes.firstPick[q.id] !== q.a);
      return html`<div className="card flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <p className="eyebrow">Challenge complete · ${currentClass.code}</p>
          <span className="mono text-[12px] text-ok font-semibold">Recorded for class dashboard</span>
        </div>
        <p className="mono text-[42px] font-semibold leading-none">${firstCorrect}<span className="text-[18px] text-mute">/${n} on first try</span></p>
        <p className="text-[15px]">
          ${firstCorrect === n
            ? 'Clean sweep on the first attempt!'
            : 'Your first-attempt answers have been logged so your lecturer can see which topics to review in class.'}
        </p>
        ${missedQs.length > 0 && html`<div className="flex flex-col gap-2">
          <p className="eyebrow">Topics to review in 3D</p>
          ${missedQs.map(q => html`<div key=${q.id} className="border-t border-line pt-2 flex flex-col gap-1">
            <p className="text-[14px] font-medium">${q.q}</p>
            <p className="text-[13px] text-mute">Correct answer: ${q.opts[q.a]}</p>
            <div><${OpenLink} item=${q} go=${go} /></div>
          </div>`)}
        </div>`}
        ${lastSubCode && html`<div className="note info flex flex-col gap-1.5">
          <div><strong>Offline result code (optional):</strong> If your class has no internet connection, copy this code to send to your lecturer.</div>
          <div className="flex gap-2 items-center">
            <input type="text" readOnly className="opt mono text-[12px] flex-1" value=${lastSubCode} onFocus=${e => e.target.select()} aria-label="Offline submission code" />
            <button className="btn" onClick=${async () => {
              try { await navigator.clipboard.writeText(lastSubCode); setCopiedSub(true); setTimeout(() => setCopiedSub(false), 2000); } catch (e) {}
            }}>${copiedSub ? 'Copied ✓' : 'Copy'}</button>
          </div>
        </div>`}
        <div className="flex gap-2 flex-wrap">
          <button className="btn primary" onClick=${() => setActiveSes(null)}>Back to class</button>
          <button className="btn" onClick=${startChallenge}>Retry challenge</button>
        </div>
      </div>`;
    }

    const q = qs[activeSes.i];
    const picked = activeSes.tries;
    const solved = picked.includes(q.a);
    const exhausted = !solved && picked.length >= 2;
    const doneQ = solved || exhausted;

    const pickOption = idx => {
      if (doneQ || picked.includes(idx)) return;
      const nextTries = [...picked, idx];
      const nextFirst = { ...activeSes.firstPick };
      if (nextFirst[q.id] == null) nextFirst[q.id] = idx;
      if (idx === q.a) award('class:' + currentClass.code + ':' + q.id);
      setActiveSes({ ...activeSes, firstPick: nextFirst, tries: nextTries });
    };

    const advanceQuestion = () => {
      const nextIdx = activeSes.i + 1;
      if (nextIdx >= n) {
        const sub = {
          id: 'sub_' + currentClass.code + '_' + strHash((studentName || 'student') + ':' + Date.now()),
          code: currentClass.code,
          student: (studentName || (account && account.name) || 'Student').trim() || 'Student',
          t: Date.now(),
          answers: activeSes.firstPick,
          isMine: true,
        };
        setSubmissions(all => {
          const prev = (all[currentClass.code] || []).filter(x => x.id !== sub.id);
          return { ...all, [currentClass.code]: [sub, ...prev] };
        });
        setLastSubCode(encodeSubmissionToken(sub));
        cloudPushSubmission(sub);
      }
      setActiveSes({ ...activeSes, i: nextIdx, tries: [] });
    };

    return html`<div className="card flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <p className="eyebrow">${currentClass.code} · Question ${activeSes.i + 1} of ${n} · ${q.topic}</p>
        <button className="text-[13px] text-mute underline" onClick=${() => setActiveSes(null)}>Leave</button>
      </div>
      <div className="block h-1.5 rounded-full overflow-hidden" style=${{ background: 'var(--chip)' }}>
        <span className="block h-full" style=${{ width: (100 * activeSes.i / n) + '%', background: 'var(--acc)' }}></span>
      </div>
      <p className="text-[16px] font-medium leading-snug">${q.q}</p>
      <div className="flex flex-col gap-2">
        ${q.opts.map((o, idx) => {
          const tried = picked.includes(idx);
          const cls = tried ? (idx === q.a ? 'ok' : 'bad') : (exhausted && idx === q.a ? 'reveal' : '');
          return html`<button key=${idx} className=${'opt ' + cls} disabled=${doneQ || tried} onClick=${() => pickOption(idx)}>${o}</button>`;
        })}
      </div>
      ${!doneQ && picked.length > 0 && html`<div className="note bad"><strong>Not quite.</strong> ${q.hint || 'Think about the physical process and try one more time.'}</div>`}
      ${doneQ && html`<div className=${'note ' + (solved ? 'ok' : 'info')}><strong>${solved ? 'Yes. ' : 'Explanation unlocked. '}</strong>${q.why}</div>`}
      ${doneQ && html`<div className="flex gap-2 flex-wrap">
        <button className="btn primary" onClick=${advanceQuestion}>${activeSes.i + 1 < n ? 'Next question' : 'Finish & submit'}</button>
        <${OpenLink} item=${q} go=${go} />
      </div>`}
    </div>`;
  }

  return html`<div className="grid gap-3 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] items-start">
    <section className="card flex flex-col gap-3" aria-label="Active class challenge">
      <div className="flex items-start justify-between gap-2 flex-wrap">
        <div>
          <p className="eyebrow">Joined class · ${currentClass.code}</p>
          <h2 className="display text-[22px] leading-tight">${currentClass.title}</h2>
          <p className="text-[13px] text-mute">${currentClass.lecturer ? currentClass.lecturer + ' · ' : ''}Unit: ${currentClass.unit} · ${qs.length} questions</p>
        </div>
        <span className="chipbtn mono text-[12px]" style=${{ minHeight: 30, padding: '3px 10px' }}>${currentClass.code}</span>
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="cls-student-name" className="eyebrow">Your name on the class sheet</label>
        <input id="cls-student-name" type="text" className="opt" placeholder="e.g. Chinedu Okafor" value=${studentName} onChange=${e => setStudentName(e.target.value)} />
      </div>
      ${latestMine && html`<div className="note ok">
        Last attempt: <strong>${qs.filter(q => latestMine.answers[q.id] === q.a).length}/${qs.length}</strong> on first try.
      </div>`}
      <div className="flex gap-2 flex-wrap">
        <button className="btn primary" onClick=${startChallenge}>${latestMine ? 'Take challenge again' : 'Start class challenge'}</button>
      </div>
    </section>

    <section className="card flex flex-col gap-3" aria-label="Join a class with a code">
      <p className="eyebrow">Switch or join a class</p>
      <form className="flex flex-col gap-2" onSubmit=${handleJoin}>
        <label htmlFor="cls-code-in" className="text-[14px] text-mute">Enter a 6-character class code from your lecturer, or paste a <span className="mono">CRATON-CLS:...</span> code:</label>
        <div className="flex gap-2">
          <input id="cls-code-in" type="text" className="opt mono flex-1" placeholder="e.g. GLY101 or STR204" value=${codeInput} onChange=${e => setCodeInput(e.target.value)} />
          <button type="submit" className="btn primary">Join</button>
        </div>
        ${joinErr && html`<div className="note bad">${joinErr}</div>`}
      </form>
      <div className="flex flex-col gap-1.5">
        <p className="eyebrow">Available classes on this device</p>
        <div className="flex flex-wrap gap-1.5">
          ${Object.values({ ...PRESET_CLASSES, ...classes }).map(c => html`<button key=${c.code} className="chipbtn" style=${{ minHeight: 34, padding: '4px 10px', fontSize: 12 }} aria-pressed=${c.code === currentClass.code} onClick=${() => { setJoinedCode(c.code); setJoinErr(''); }}>
            <span className="mono font-semibold">${c.code}</span> · ${c.unit === 'All' ? 'Whole course' : c.unit}
          </button>`)}
        </div>
      </div>
    </section>
  </div>`;
}

/* ---------- Lecturer View: Create Class & Most-Missed Dashboard ---------- */
function LecturerDashboardView({ go, classes, setClasses, submissions, setSubmissions }){
  const allClasses = useMemo(() => ({ ...PRESET_CLASSES, ...classes }), [classes]);
  const [selCode, setSelCode] = usePersist('cls.lecturerSel', 'GLY101');
  const currentClass = allClasses[selCode] || PRESET_CLASSES.GLY101;
  const [title, setTitle] = useState('');
  const [lecturer, setLecturer] = useState('');
  const [unit, setUnit] = useState('Structures and time');
  const [count, setCount] = useState(6);
  const [showCreate, setShowCreate] = useState(false);
  const [subInput, setSubInput] = useState('');
  const [subMsg, setSubMsg] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);

  const qs = useMemo(() => buildClassQuestions(currentClass), [currentClass]);
  const subs = submissions[currentClass.code] || [];

  const handleCreateClass = e => {
    e.preventDefault();
    const cleanTitle = title.trim() || ('Geology Class · ' + unit);
    const code = makeShortClassCode(cleanTitle, unit, count);
    const newCls = {
      code,
      title: cleanTitle,
      lecturer: lecturer.trim() || 'Lecturer',
      unit,
      count: clamp(Number(count) || 6, 3, 10),
      seed: strHash(code + ':' + cleanTitle),
    };
    setClasses(all => ({ ...all, [code]: newCls }));
    setSelCode(code);
    setTitle('');
    setShowCreate(false);
    cloudSaveClass(newCls);
  };

  const handleLoadSampleCohort = () => {
    const sample = generateSampleSubmissions(currentClass);
    setSubmissions(all => {
      const mine = (all[currentClass.code] || []).filter(s => s.isMine);
      return { ...all, [currentClass.code]: [...mine, ...sample] };
    });
    setSubMsg('Loaded sample responses from 20 students for ' + currentClass.code + '.');
  };

  const handleImportSubmission = () => {
    setSubMsg('');
    try {
      const sub = decodeSubmissionToken(subInput);
      setSubmissions(all => {
        const list = (all[sub.code] || []).filter(s => s.id !== sub.id);
        return { ...all, [sub.code]: [sub, ...list] };
      });
      setSelCode(sub.code);
      setSubInput('');
      setSubMsg('Added submission from ' + sub.student + ' to ' + sub.code + '.');
    } catch (ex) {
      setSubMsg(ex.message || 'Could not read submission code.');
    }
  };

  const handleCloudRefresh = async () => {
    setSubMsg('Checking cloud server…');
    try {
      const remote = await cloudFetchSubmissions(currentClass.code);
      if (!remote) { setSubMsg('No cloud server configured. Showing device & sample submissions.'); return; }
      setSubmissions(all => {
        const existing = all[currentClass.code] || [];
        const byId = new Map();
        [...remote, ...existing].forEach(s => byId.set(s.id, s));
        return { ...all, [currentClass.code]: Array.from(byId.values()) };
      });
      setSubMsg('Synced ' + remote.length + ' cloud submissions.');
    } catch (ex) {
      setSubMsg('Offline or cloud unreachable: showing saved submissions.');
    }
  };

  // Compute per-question miss rates and most common wrong answers
  const stats = useMemo(() => {
    return qs.map((q, idx) => {
      let attempts = 0, misses = 0;
      const wrongCounts = {};
      subs.forEach(s => {
        const pick = s.answers ? s.answers[q.id] : undefined;
        if (pick == null) return;
        attempts++;
        if (pick !== q.a) {
          misses++;
          wrongCounts[pick] = (wrongCounts[pick] || 0) + 1;
        }
      });
      let topWrongIdx = null, topWrongCount = 0;
      Object.entries(wrongCounts).forEach(([oi, cnt]) => {
        if (cnt > topWrongCount) { topWrongCount = cnt; topWrongIdx = Number(oi); }
      });
      const missRate = attempts > 0 ? Math.round((misses / attempts) * 100) : 0;
      return {
        q,
        order: idx + 1,
        attempts,
        misses,
        missRate,
        topWrong: topWrongIdx != null ? q.opts[topWrongIdx] : null,
        topWrongCount,
      };
    }).sort((a, b) => b.missRate - a.missRate || b.misses - a.misses);
  }, [qs, subs]);

  const classAvg = useMemo(() => {
    if (!subs.length || !qs.length) return 0;
    let totalCorrect = 0, totalPossible = subs.length * qs.length;
    subs.forEach(s => {
      qs.forEach(q => { if (s.answers && s.answers[q.id] === q.a) totalCorrect++; });
    });
    return Math.round((totalCorrect / totalPossible) * 100);
  }, [subs, qs]);

  return html`<div className="flex flex-col gap-3">
    <div className="card flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <p className="eyebrow">Lecturer dashboard</p>
          <h2 className="display text-[22px] leading-tight">${currentClass.title}</h2>
        </div>
        <button className="btn primary" onClick=${() => setShowCreate(v => !v)}>${showCreate ? 'Close form' : '+ Create new class'}</button>
      </div>

      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Select class">
        ${Object.values(allClasses).map(c => html`<button key=${c.code} className="chipbtn" style=${{ minHeight: 36, padding: '5px 12px' }} aria-pressed=${c.code === currentClass.code} onClick=${() => { setSelCode(c.code); setSubMsg(''); }}>
          <span className="mono font-semibold">${c.code}</span> · ${c.title}
        </button>`)}
      </div>

      ${showCreate && html`<form className="border-t border-line pt-3 flex flex-col gap-2.5" onSubmit=${handleCreateClass}>
        <p className="eyebrow">Create a class & set challenge</p>
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <label htmlFor="lec-title" className="eyebrow">Course / class title</label>
            <input id="lec-title" type="text" className="opt" placeholder="e.g. GLY 102 · UNILAG" value=${title} onChange=${e => setTitle(e.target.value)} required />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="lec-name" className="eyebrow">Lecturer / department</label>
            <input id="lec-name" type="text" className="opt" placeholder="e.g. Dr. Adewale" value=${lecturer} onChange=${e => setLecturer(e.target.value)} />
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <p className="eyebrow">Challenge unit</p>
          <div className="flex flex-wrap gap-1.5">
            ${['All', ...UNITS].map(u => html`<button type="button" key=${u} className="chipbtn" aria-pressed=${unit === u} onClick=${() => setUnit(u)}>${u}</button>`)}
          </div>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <label htmlFor="lec-count" className="eyebrow">Number of questions:</label>
          <select id="lec-count" className="btn" value=${count} onChange=${e => setCount(Number(e.target.value))}>
            ${[5, 6, 8, 10].map(n => html`<option key=${n} value=${n}>${n} questions</option>`)}
          </select>
          <button type="submit" className="btn primary">Generate class code</button>
        </div>
      </form>`}

      <div className="readout">
        <div><span className="eyebrow">Class code</span><b>${currentClass.code}</b></div>
        <div><span className="eyebrow">Students</span><b>${subs.length}</b></div>
        <div><span className="eyebrow">Class average</span><b>${subs.length ? classAvg + '%' : '—'}</b></div>
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <button className="btn" onClick=${async () => {
          const tok = encodeClassToken(currentClass);
          try { await navigator.clipboard.writeText(tok); setCopiedCode(true); setTimeout(() => setCopiedCode(false), 2000); } catch (e) {}
        }}>${copiedCode ? 'Copied full challenge code ✓' : 'Copy shareable challenge code'}</button>
        <button className="btn" onClick=${handleLoadSampleCohort}>${subs.length ? 'Reload sample class (20 students)' : 'Load sample class (20 students)'}</button>
        ${typeof getCloudConfig === 'function' && getCloudConfig() && html`<button className="btn" onClick=${handleCloudRefresh}>Refresh from cloud</button>`}
        ${subs.length > 0 && html`<button className="text-[13px] text-mute underline ml-auto" onClick=${() => setSubmissions(all => ({ ...all, [currentClass.code]: [] }))}>Clear results</button>`}
      </div>
      ${subMsg && html`<div className="note info">${subMsg}</div>`}
    </div>

    <section className="card flex flex-col gap-3" aria-label="Questions the class misses most">
      <div className="flex items-baseline justify-between gap-2 flex-wrap">
        <div>
          <p className="eyebrow">Ranked by first-attempt error rate</p>
          <h3 className="display text-[20px]">Questions the class misses most</h3>
        </div>
        <span className="mono text-[12px] text-mute">${qs.length} assigned questions</span>
      </div>

      ${subs.length === 0 && html`<div className="note">
        No student responses recorded for <strong>${currentClass.code}</strong> yet. Tell students to open <strong>Practice → Class</strong> and enter <span className="mono font-semibold">${currentClass.code}</span>, or tap <strong>Load sample class (20 students)</strong> above to preview the analytics dashboard.
      </div>`}

      <div className="flex flex-col gap-3">
        ${stats.map(st => html`<div key=${st.q.id} className="border-t border-line pt-3 flex flex-col gap-1.5">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="eyebrow">${st.q.topic} · ${st.q.unit}</span>
            <span className="mono text-[13px] font-semibold" style=${{ color: st.missRate >= 50 ? 'var(--bad)' : st.missRate >= 25 ? 'var(--acc)' : 'var(--ok)' }}>
              ${st.attempts ? st.missRate + '% missed (' + st.misses + '/' + st.attempts + ')' : '0 attempts'}
            </span>
          </div>
          <div className="block h-2 rounded-full overflow-hidden" style=${{ background: 'var(--chip)' }}>
            <span className="block h-full rounded-full" style=${{ width: st.missRate + '%', background: st.missRate >= 50 ? 'var(--bad)' : st.missRate >= 25 ? 'var(--acc)' : 'var(--ok)' }}></span>
          </div>
          <p className="text-[15px] font-medium leading-snug">${st.q.q}</p>
          <p className="text-[13px] text-mute"><strong>Correct answer:</strong> ${st.q.opts[st.q.a]}</p>
          ${st.topWrong && html`<p className="text-[13px]" style=${{ color: 'var(--bad)' }}>
            <strong>Most common wrong answer (${st.topWrongCount}):</strong> “${st.topWrong}”
          </p>`}
          <div className="flex gap-2 mt-0.5"><${OpenLink} item=${st.q} go=${go} label="Teach this in 3D" /></div>
        </div>`)}
      </div>

      <div className="border-t border-line pt-3 flex flex-col gap-1.5">
        <label htmlFor="lec-sub-in" className="eyebrow">Add an offline student result code</label>
        <div className="flex gap-2">
          <input id="lec-sub-in" type="text" className="opt mono text-[12px] flex-1" placeholder="Paste CRATON-SUB:... from a student" value=${subInput} onChange=${e => setSubInput(e.target.value)} />
          <button className="btn" disabled=${!subInput.trim()} onClick=${handleImportSubmission}>Add result</button>
        </div>
      </div>
    </section>
  </div>`;
}

function ClassroomModule({ award, go }){
  const [role, setRole] = usePersist('cls.role', 'student');
  const [classes, setClasses] = usePersist('cls.custom', {});
  const [submissions, setSubmissions] = usePersist('cls.subs', () => ({
    GLY101: generateSampleSubmissions(PRESET_CLASSES.GLY101),
  }));

  return html`<div className="flex flex-col gap-3">
    <div className="flex items-center justify-between gap-2 flex-wrap">
      <p className="text-[14px] text-mute">Join your lecturer's class with a code, or switch to the Lecturer dashboard to set a challenge and see which questions the class misses most.</p>
      <div className="w-full sm:w-[320px]">
        <${Seg} label="Class role" value=${role} onChange=${setRole} items=${[{ id: 'student', label: 'Student' }, { id: 'lecturer', label: 'Lecturer dashboard' }]} />
      </div>
    </div>
    ${role === 'lecturer'
      ? html`<${LecturerDashboardView} go=${go} classes=${classes} setClasses=${setClasses} submissions=${submissions} setSubmissions=${setSubmissions} />`
      : html`<${StudentClassView} award=${award} go=${go} classes=${classes} setClasses=${setClasses} submissions=${submissions} setSubmissions=${setSubmissions} />`}
  </div>`;
}
