# CLAUDE.md

Project-specific notes for Claude Code. See also AGENTS.md for general
architecture notes.

## PrimeVue theming — white/light components (recurring pitfall)

Symptom: a PrimeVue component (Drawer, Dialog, Select/MultiSelect overlay,
DatePicker panel…) renders with a white background while the rest of the app
is dark.

Root cause history: the theme's dark mode was silently disabled for a long
time. `darkModeSelector` was set to `'html'`, which @primeuix treats as a
"custom" selector and compiles to `html { :root { …dark vars… } }` — a
descendant rule that never matches, so ALL dark tokens stayed off and the
theme rendered light. Many components were then patched individually with
`!important` overrides in `src/style.css` or per-component `:deep()` /
`:dt` props, which is why the codebase is full of them.

Fixed since: `darkModeSelector: '.dark'` in `src/main.ts` combined with
`<html lang="en" class="dark">` in `index.html`. The preset also maps the
dark `surface` palette to slate so PrimeVue surfaces match the app's
slate-blue design (`#0f172a`).

Rules when a component looks light/white:
1. Do NOT add a new pile of `!important` overrides first. Check that the
   dark tokens are active: in devtools,
   `getComputedStyle(document.documentElement).getPropertyValue('--p-content-background')`
   must be `#0f172a` (slate-900). If it is white-ish, dark mode is broken
   again (check `darkModeSelector` and the `class="dark"` on `<html>`).
2. Remember that overlays (Drawer, Dialog, Select panels, tooltips) are
   teleported to `<body>`: `<style scoped>` of the page does NOT reach their
   root elements. Style them through the theme tokens (preferred), a global
   rule in `src/style.css`, or PrimeVue's `:dt` prop.
3. Only fine-tune with `:deep()` / global CSS for glassmorphism effects the
   token system cannot express (blur, rgba backgrounds).
