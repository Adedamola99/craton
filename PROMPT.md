# Briefing for the AI coding agent working on Craton

Read this file and `README.md` fully before changing any code.

## 1. What Craton is

Craton is an offline-first Progressive Web App that teaches undergraduate and secondary-school geology with interactive, procedurally generated 3D models. It is positioned as **"Africa's 3D geology course"**:

1. **The whole course, not one tool:** 23 Atlas topics plus a field kit.
2. **Predict first:** explanations unlock only after the learner commits to an answer. There are never "show answer" buttons before an attempt.
3. **Works on any phone, offline:** zero downloaded 3D assets, everything procedural, vendored libraries, service worker.
4. **Built for Africa:** examples come from real Nigerian and African geology (Benue Trough, Niger Delta, Jos Plateau, Basement Complex and others) while the science stays universal.

Our nearest competitor, Seequent's free _Visible Geology_, covers structural tools only. Our edge is breadth, active-learning pedagogy, low-end device support and regional grounding. See `docs/STRATEGY.md`.

## 2. Hard rules (do not break)

- **No external assets.** No `.glb`, image textures or video. Generate geometry with Three.js and textures with Canvas2D or SVG. Google Fonts is the only external request, and the app must still work without it.
- **Must run offline.** Any new file must be added to `SHELL` in `app/sw.js`, and `CACHE` must be bumped.
- **Performance on mid-range Android:** pixel ratio is capped at 1.75 and the scene renders only when something changes (`stage.invalidate()`). Dispose of geometries, materials and textures you replace. Avoid per-frame allocations.
- **Pedagogy:** every new interactive element follows _observe → predict/commit → feedback with a hint → explanation_. A wrong answer gives a hint, never just the answer, and the explanation unlocks after two attempts.
- **Accuracy:** geology content must be scientifically correct. If unsure about a regional fact, leave it out or flag it with `// TODO(review): …` for a geologist to check. Never invent statistics.
- **Accessibility:** real `<button>` elements, visible focus, 44px minimum touch targets, `aria-label` on icon-only buttons, `prefers-reduced-motion` respected, text contrast of at least 4.5:1 in both themes.
- **Both themes:** use CSS variables (`var(--ink)`, `var(--panel)` and so on) in UI, and `readTheme()` plus `setTheme(t)` in 3D scenes. Never hard-code a colour that only works in one theme for UI text.

## 3. Architecture you must respect

- Plain browser scripts, **no bundler**. React 18 via the `React`/`ReactDOM` globals; components written with **htm** (`html\`...\``), not JSX.
- Files in `app/js/` share one global scope and load in numeric order (see `app/index.html`). A file may only use top-level values _at load time_ that earlier files declare. Inside functions, anything goes.
- Each file starts with `'use strict';`. Do not add `import`/`export` unless you migrate the whole project (see the roadmap).
- Tailwind is **prebuilt**: after adding or changing class names, run `npm run css`. Custom component classes (`.card`, `.opt`, `.chipbtn`, `.btn`, `.seg`, `.note`, `.hud`, `.eyebrow`, `.mono`, `.display`) live in `app/css/craton.css`.
- Persisted state uses `usePersist(key, init)` (localStorage prefix `geoatlas:`). Wrap any new storage access in try/catch.
- Navigation lives in `App` (`30-app.js`). Other screens move around through the `go` object: `go.model(id, variant)`, `go.tool('block'|'net'|'field')`, `go.tab(tabId, sub)`.

## 4. Adding a 3D Atlas model

Create a model object (in a new file such as `app/js/14-atlas-models-d.js`, loaded before `13-atlas-library.js`), then add it to the `ATLAS` array and to `ATLAS_ICONS` in `13-atlas-library.js`.

```js
const M_EXAMPLE = {
  id: "example",
  title: "Example topic",
  group: "Surface processes", // group must match ATLAS_GROUPS
  blurb: "One sentence shown on the library card.",
  variants: [
    { id: "a", label: "View A" },
    { id: "b", label: "View B" },
  ], // or []
  slider: {
    label: "What the slider does",
    def: 0,
    for: ["a"],
    text: (v) => (v < 50 ? "Early" : "Late"),
  }, // optional
  cam: [9, 6, 11],
  target: [0, 0, 0],
  fit: 7.4, // camera direction, look-at point, radius to fit on screen
  animated: false, // true if build() returns tick()
  note: "Optional caveat, for example vertical exaggeration.",
  parts: {
    partId: { name: "Shown name", desc: "One or two sentence explanation." },
  },
  quiz: {
    // keyed by variant id, or 'all'
    a: [
      {
        type: "tap",
        prompt: "Tap the …",
        parts: ["partId"],
        hint: "…",
        why: "…",
      },
      { type: "mc", q: "…?", opts: ["…", "…", "…"], a: 1, hint: "…", why: "…" },
    ],
  },
  local: "Closer-to-home note", // or localV: { a: '…', b: '…' }
  build(ctx) {
    // ctx.scene (THREE.Scene), ctx.part(mesh, partId) registers a tappable mesh, ctx.clipOk(point) filters picks
    const m = ctx.part(
      new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), SM("#d7b57d")),
      "partId",
    );
    ctx.scene.add(m);
    return {
      setVariant(v) {},
      setParam(v /* 0–100 */) {},
      tick(seconds) {},
      regions: ["partId"], // parts that are surface regions: show a label, no glow
      resolve(hit, partId) {
        return partId;
      }, // optional: map a hit point to a finer part id
    };
  },
};
```

Useful helpers: `SM(color, {op, flat, emissive, ei, clip, map, vc, rough, metal})`, `hSlab()` for terrain or layer slabs, `extrude(points2D, depth)`, `tube(points3D, radius)`, `makeArrow()`, `makeTag()`, `fixedTag()`, `addVC()`/`paintVC()` for vertex colours, `makeTex(kind)` for rock textures, `rng(seed)`, `smooth`, `lerp`, `clamp`.

Multiple-choice questions whose text depends on seeing the model ("drag the slider…", "this volcano…") are filtered out of Daily and Exam practice by `CONTEXT_RX` in `20-craton.js`. Write standalone questions where you can.

## 5. Before you finish any change

1. Serve `app/` locally and open every section: Today, Atlas (open the models you touched), Practice (both modes), Nigeria, Field kit (all three tools).
2. Check the browser console: there must be no errors.
3. Check phone width (400px) and desktop. The page must never scroll sideways.
4. Check both themes (Field and Lab).
5. Turn the network off in DevTools, reload and confirm the app still works.
6. Run `npm run css` if you added Tailwind classes, and bump `CACHE` in `sw.js`.

## 6. Roadmap (priority order)

1. **Content review:** export every model's parts and quiz text to a spreadsheet for a geology lecturer to review, and apply corrections.
2. **Accounts and sync:** optional sign-in (for example Supabase or Firebase) to sync `insights`, `streak` and progress across devices. The app must keep working fully offline and signed out.
3. **Class codes and lecturer dashboard:** a lecturer creates a class and sets challenges; students join with a code; the dashboard shows which questions the class misses most.
4. **Accurate Nigeria map:** replace the hand-drawn `NG_BORDER` with a simplified public-domain outline (for example Natural Earth), and add state boundaries and geological provinces.
5. **More exam content:** expand `EXAM_BANK` to at least 300 reviewed questions mapped to university.
6. **Localisation:** move UI strings into a dictionary and add Hausa, Yoruba, Igbo and French.
7. **Craton Pro (company product):** import borehole logs (CSV of location plus layer depths), interpolate a 3D ground model, and reuse the Peel/Slice/Pin tools on real data. Clearly separate measured and interpolated values.
8. **AR view** (WebXR) in the installed app.
9. **Optional modernisation:** migrate to Vite + ES modules + JSX only if it keeps the same offline behaviour and bundle size. Do it as one dedicated change, not mixed with features.

## 7. Known limitations

- `NG_BORDER` and the river lines are a rough sketch (labelled as approximate in the UI).
- Fixed 3D labels (`fixedTag`) follow the theme through `userData.theme`; new label types must do the same.
- Pricing and partner names on the landing page are placeholders in `[BRACKETS]`.
- Three.js is pinned at r147 because later versions removed `examples/js` (non-module) files. Upgrading means switching to ES modules.
