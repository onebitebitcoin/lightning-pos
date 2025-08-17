Modern UI Style Guide

Overview
- Stack: Vue 3 + Vite + Pinia + Tailwind CSS
- Theme: CSS variables in `src/style.css` with semantic Tailwind color tokens wired in `tailwind.config.js`.

Theme Tokens (edit in `src/style.css`)
- Surfaces: `--bg-{primary|secondary|tertiary}` (RGB values)
- Text: `--text-{primary|secondary|disabled}` (RGB values)
- Borders: `--border-{primary|secondary}` (RGB values)
- Accent: `--accent` (RGB value)

Tailwind Tokens (edit in `tailwind.config.js`)
- Semantic namespaces: `bg.*`, `text.*`, `border.*` map to the CSS variables with slash opacity support (e.g., `bg-bg-primary/80`).
- Brand/status palettes remain under `primary|success|warning|error` for utility use.

Component Primitives (Tailwind component classes)
- `.btn`, `.btn-primary`, `.btn-secondary`, `.btn-danger`, `.btn-outline`: Rounded-xl, clear focus ring, soft elevation.
- `.form-input`, `.form-file-input`: Semantic surfaces with primary focus ring.
- `.payment-option`: Minimal card-like surface; `.active` adds a focus ring.
- `.btn-category`: Filter chip; `.active` adds a soft primary tint.
- `.btn-quantity`: Compact stepper for cart quantity.
- `.shadow-soft-hover`: Subtle elevation tuned in `tailwind.config.js`.

Dark Mode
- Controlled by Pinia store `stores/theme.ts` via the `dark` class on `html`.
- Dark palette ensures sufficient contrast; primary remains vibrant.

Customization Tips
- Adjust brand color by changing `--color-primary-*` in `:root` and `.dark`.
- Tweak elevation in `tailwind.config.js` under `theme.extend.boxShadow`.
- Keep semantic classes (`bg-bg-*`, `text-text-*`, `border-*`) to avoid hard-coded colors.

Where It’s Used
- Global styles: `src/style.css`
- Tailwind theme: `tailwind.config.js`
- App shell: `src/App.vue` uses `bg-bg-secondary`
- Views updated: headers/wrappers/forms use semantic classes.
