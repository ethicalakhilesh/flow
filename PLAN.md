# Flow redesign — phase plan

Design direction: minimal & clean, light + dark theme, spacious card-based
layout (Apple Wallet / Copilot Money feel), monochrome base with a
user-selectable accent (green default, blue alt).

## Phase 1 — Design tokens & theme foundation
- Tailwind config: monochrome scale (gray 50–950) + two accent scales
  (green, blue), each with light/dark stops
- CSS variables for `--accent`, `--accent-bg`, `--accent-fg` driven by a
  `data-accent` attribute
- Light/dark via system preference + manual toggle
- No pages redesigned yet — tokens wired up and verified on the existing
  hello-world page

## Phase 2 — Layout primitives
- Reusable components: `Card`, `MetricCard`, `Avatar`, `Pill`/`Badge`
- Spacing/radius scale matching the mockup (12px cards, generous padding)
- Base app shell: top bar with avatar + theme/accent toggles

## Phase 3 — Accent preference persistence
- Settings control (dropdown or swatch picker) for green/blue accent
- Persisted per-user — cookie or Airtable field on the user record,
  survives reload/login
- Applies instantly without page reload

## Phase 4 — Rebuild dashboard
- Real dashboard replacing "Hello World": balance card, account cards,
  recent transaction list — matching the mockup structure
- Wired to Airtable data (once that's back in scope)

## Phase 5 — Accessibility & polish pass
- Contrast check both accents × both themes
- Focus states, `aria-label`s, reduced-motion handling
- Matches the recurring audit practice from before
