/** Tailwind config for Craton. Colours map to CSS variables in app/css/craton.css, so light/dark themes work. */
module.exports = {
  content: ['./app/**/*.{html,js}'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)', panel: 'var(--panel)', ink: 'var(--ink)', mute: 'var(--mute)', line: 'var(--line)',
        acc: 'var(--acc)', acc2: 'var(--acc2)', chip: 'var(--chip)', stage: 'var(--stage)', ok: 'var(--ok)', bad: 'var(--bad)',
      },
      fontFamily: {
        display: ['Archivo', '"Arial Narrow"', 'system-ui', 'sans-serif'],
        body: ['"IBM Plex Sans"', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
    },
  },
};
