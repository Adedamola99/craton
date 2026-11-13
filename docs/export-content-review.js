/* Craton · docs/export-content-review.js
 * Exports all geology teaching content (3D Atlas models, parts, quizzes, regional notes,
 * Field Kit questions/specimens, Exam Bank, Order-the-Events puzzles, and Explore Nigeria sites)
 * to docs/craton-content-review.csv (UTF-8 with BOM for Excel / Google Sheets).
 *
 * Usage: node docs/export-content-review.js
 */
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const ctx = {
  React: {
    useState() {},
    useEffect() {},
    useLayoutEffect() {},
    useRef() {},
    useMemo() {},
    useCallback() {},
    createElement() { return {}; },
  },
  htm: { bind() { return () => ''; } },
  THREE: {
    Vector3: function () { return { set() { return this; }, normalize() { return this; }, clone() { return this; } }; },
    Color: function () { return { convertSRGBToLinear() { return this; }, offsetHSL() { return this; }, lerp() { return this; }, getStyle() { return ''; } }; },
  },
  window: {},
  document: { documentElement: { getAttribute() { return null; } } },
  localStorage: { getItem() { return null; }, setItem() {} },
};
vm.createContext(ctx);

const files = [
  '01-core.js',
  '02-block-engine.js',
  '03-ui.js',
  '04-block.js',
  '05-stereonet.js',
  '06-field.js',
  '10-atlas-models-a.js',
  '11-atlas-models-b.js',
  '12-atlas-models-c.js',
  '13-atlas-library.js',
  '20-craton.js',
];

files.forEach(f => {
  const code = fs.readFileSync(path.join(root, 'app', 'js', f), 'utf8');
  vm.runInContext(code, ctx, { filename: f });
});

const data = vm.runInContext(
  '({ ATLAS, LAYERS, PREDICT, pinQuestion, NET_CHALLENGES, CLUES, SPECIMENS, EXAM_BANK, PUZZLES, NG_KINDS, NG_PLACES, CONTEXT_RX })',
  ctx
);

const HEADERS = [
  'Section',
  'Course Unit / Group',
  'Topic ID',
  'Topic Title',
  'Variant / View',
  'Item Type',
  'Item ID',
  'Name / Question / Prompt',
  'Description / Options',
  'Correct Answer',
  'Hint (Wrong 1st Attempt)',
  'Explanation (Why)',
  'In Standalone Daily/Exam Pool',
  'Reviewer Status (OK / Revise)',
  'Lecturer Notes / Corrections',
];

const rows = [HEADERS];
function addRow(cols) {
  rows.push(cols.map(v => (v == null ? '' : String(v))));
}

// 1. 3D Atlas Models
data.ATLAS.forEach(m => {
  const vMap = {};
  (m.variants || []).forEach(v => { vMap[v.id] = v.label; });

  // Overview
  addRow([
    '3D Atlas',
    m.group,
    m.id,
    m.title,
    (m.variants || []).map(v => v.id + ' (' + v.label + ')').join('; ') || 'all',
    'Model Overview',
    m.id + ':overview',
    m.title,
    m.blurb + (m.note ? ' [Note: ' + m.note + ']' : ''),
    '',
    '',
    m.local || '',
    'No',
    '',
    '',
  ]);

  // Variant-specific regional notes
  if (m.localV) {
    Object.entries(m.localV).forEach(([vid, text]) => {
      addRow([
        '3D Atlas',
        m.group,
        m.id,
        m.title,
        vMap[vid] ? vid + ' (' + vMap[vid] + ')' : vid,
        'Regional Note (Closer to home)',
        m.id + ':local:' + vid,
        'Closer to home (' + (vMap[vid] || vid) + ')',
        text,
        '',
        '',
        '',
        'No',
        '',
        '',
      ]);
    });
  }

  // Parts
  Object.entries(m.parts || {}).forEach(([pid, p]) => {
    addRow([
      '3D Atlas',
      m.group,
      m.id,
      m.title,
      'all',
      '3D Part',
      m.id + ':part:' + pid,
      p.name,
      p.desc,
      '',
      '',
      '',
      'No',
      '',
      '',
    ]);
  });

  // Quizzes
  Object.entries(m.quiz || {}).forEach(([vid, qs]) => {
    const vLabel = vMap[vid] ? vid + ' (' + vMap[vid] + ')' : vid;
    qs.forEach((q, qi) => {
      if (q.type === 'tap') {
        const targetNames = q.parts.map(pid => (m.parts[pid] ? m.parts[pid].name + ' [' + pid + ']' : pid)).join(' OR ');
        addRow([
          '3D Atlas',
          m.group,
          m.id,
          m.title,
          vLabel,
          'Tap Question (3D)',
          m.id + ':quiz:' + vid + ':' + qi,
          q.prompt,
          'Tap on 3D model',
          targetNames,
          q.hint,
          q.why,
          'No',
          '',
          '',
        ]);
      } else {
        const inPool = !data.CONTEXT_RX.test(q.q);
        addRow([
          '3D Atlas',
          m.group,
          m.id,
          m.title,
          vLabel,
          'Multiple-Choice Question',
          m.id + ':quiz:' + vid + ':' + qi,
          q.q,
          q.opts.map((o, idx) => String.fromCharCode(65 + idx) + ') ' + o).join(' | '),
          String.fromCharCode(65 + q.a) + ') ' + q.opts[q.a],
          q.hint,
          q.why,
          inPool ? 'Yes' : 'No (requires 3D view)',
          '',
          '',
        ]);
      }
    });
  });
});

// 2. Exam Bank
data.EXAM_BANK.forEach((q, i) => {
  addRow([
    'Exam Bank',
    q.unit,
    q.model || q.tool || 'bank',
    q.topic,
    q.variant || 'all',
    'Multiple-Choice Question',
    'bank:' + i,
    q.q,
    q.opts.map((o, idx) => String.fromCharCode(65 + idx) + ') ' + o).join(' | '),
    String.fromCharCode(65 + q.a) + ') ' + q.opts[q.a],
    q.hint || '',
    q.why,
    'Yes',
    '',
    '',
  ]);
});

// 3. Field Kit: Peel & Slice (Layers, Predictions, Outcrop Pins)
data.LAYERS.forEach((L, i) => {
  addRow([
    'Field Kit: Peel & Slice',
    'Structures and time',
    'block',
    'Peel & Slice Stratigraphic Column',
    'Layer ' + (i + 1),
    'Stratigraphic Layer',
    'block:layer:' + L.id,
    L.name,
    L.note + ' (texture: ' + L.kind + ')',
    '',
    '',
    '',
    'No',
    '',
    '',
  ]);
});

Object.entries(data.PREDICT).forEach(([mode, P]) => {
  addRow([
    'Field Kit: Peel & Slice',
    'Structures and time',
    'block',
    'Peel & Slice Prediction Gate',
    mode,
    'Prediction Question',
    'block:predict:' + mode,
    P.q,
    P.opts.map((o, idx) => String.fromCharCode(65 + idx) + ') ' + o).join(' | '),
    String.fromCharCode(65 + P.a) + ') ' + P.opts[P.a],
    'Prediction unlocks after stress >= 60%',
    P.why,
    'No',
    '',
    '',
  ]);
});

const pinSamples = [
  { layer: 4, dip: 0, dipDir: 0, mode: 'flat', hang: false, label: 'Basement granite' },
  { layer: 0, dip: 0, dipDir: 0, mode: 'flat', hang: false, label: 'Lateritic topsoil' },
  { layer: 1, dip: 0, dipDir: 90, mode: 'flat', hang: false, label: 'Horizontal bed' },
  { layer: 1, dip: 2, dipDir: 90, mode: 'fold', hang: false, label: 'Fold hinge' },
  { layer: 1, dip: 28, dipDir: 90, mode: 'fold', hang: false, label: 'Fold limb' },
  { layer: 1, dip: 18, dipDir: 270, mode: 'normal', hang: true, label: 'Normal fault (hanging wall)' },
  { layer: 1, dip: 5, dipDir: 90, mode: 'normal', hang: false, label: 'Normal fault (footwall)' },
  { layer: 1, dip: 15, dipDir: 90, mode: 'reverse', hang: true, label: 'Thrust fault (hanging wall)' },
  { layer: 1, dip: 5, dipDir: 90, mode: 'reverse', hang: false, label: 'Thrust fault (footwall)' },
];
pinSamples.forEach(sample => {
  const pq = data.pinQuestion(sample);
  addRow([
    'Field Kit: Peel & Slice',
    'Structures and time',
    'block',
    'Outcrop Pin Question',
    sample.label,
    'Multiple-Choice Question',
    'block:pin:' + pq.id,
    pq.q,
    pq.opts.map((o, idx) => String.fromCharCode(65 + idx) + ') ' + o).join(' | '),
    String.fromCharCode(65 + pq.a) + ') ' + pq.opts[pq.a],
    pq.hint,
    pq.why,
    'No',
    '',
    '',
  ]);
});

// 4. Field Kit: Stereonet Bridge
data.NET_CHALLENGES.forEach(ch => {
  addRow([
    'Field Kit: Stereonet Bridge',
    'Structures and time',
    'net',
    ch.place,
    'Challenge: ' + ch.id,
    'Stereonet Challenge',
    'net:' + ch.id,
    ch.story,
    'Target orientation: Strike ' + String(ch.strike).padStart(3, '0') + '°, Dip ' + String(ch.dip).padStart(2, '0') + '° (right-hand rule)',
    'Strike ' + String(ch.strike).padStart(3, '0') + '° / Dip ' + String(ch.dip).padStart(2, '0') + '°',
    'Dynamic Socratic hints based on strike/dip error',
    ch.why,
    'No',
    '',
    '',
  ]);
});

// 5. Field Kit: Field Station Specimens
data.SPECIMENS.forEach(sp => {
  const truthStr = Object.entries(sp.truth).map(([k, v]) => k + ': ' + v).join(', ');
  const hintsStr = Object.entries(sp.hints).map(([k, v]) => k + ': ' + v).join(' | ');
  addRow([
    'Field Kit: Field Station',
    'Earth materials',
    'field',
    'Specimen ' + sp.id + ' (' + sp.name + ')',
    sp.from,
    'Hand Specimen Identification',
    'field:spec:' + sp.id,
    'Specimen ' + sp.id + ' from ' + sp.from,
    'Clues (' + truthStr + ')',
    sp.name,
    hintsStr,
    sp.reveal,
    'No',
    '',
    '',
  ]);
});

// 6. Practice: Order the Events Puzzles
data.PUZZLES.forEach(pz => {
  addRow([
    'Practice: Order the Events',
    'Structures and time',
    'order',
    pz.title,
    pz.id,
    'Relative Dating Puzzle',
    'order:' + pz.id,
    pz.intro,
    'Events (oldest → youngest): ' + pz.events.map((e, idx) => (idx + 1) + '. ' + e[1]).join(' | '),
    pz.events.map(e => e[0]).join(' → '),
    'Use two rules: lower beds are older, and anything that cuts something else is younger than what it cuts.',
    pz.why.map((w, idx) => (idx + 1) + '. ' + w).join(' | '),
    'No',
    '',
    '',
  ]);
});

// 7. Explore Nigeria Map Locations
data.NG_PLACES.forEach(pl => {
  const kindLabel = data.NG_KINDS[pl.kind] ? data.NG_KINDS[pl.kind][0] : pl.kind;
  addRow([
    'Explore Nigeria',
    kindLabel,
    'nigeria',
    pl.name,
    pl.region,
    'Map Location',
    'ng:' + pl.id,
    pl.name + ' (' + pl.region + ') [' + pl.ll[1] + '°N, ' + pl.ll[0] + '°E]',
    pl.text,
    'Links: ' + pl.links.map(l => l.label + ' (' + (l.model || l.tool) + ')').join('; '),
    '',
    '',
    'No',
    '',
    '',
  ]);
});

function csvEscape(field) {
  const s = String(field == null ? '' : field);
  if (/[",\r\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
  return s;
}

const csvContent = '\uFEFF' + rows.map(r => r.map(csvEscape).join(',')).join('\r\n') + '\r\n';
const outPath = path.join(root, 'docs', 'craton-content-review.csv');
fs.writeFileSync(outPath, csvContent, 'utf8');
console.log('Exported ' + (rows.length - 1) + ' content rows to ' + outPath);
