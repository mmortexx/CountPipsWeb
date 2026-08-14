# Scope: Milestone 1 — Core Resilience, Storage & Navigation

## Architecture & Boundaries
M1 focuses on core app resilience, storage fault tolerance in private browsing mode, keyboard navigation shortcuts, design token consistency, date determinism, and full ESLint hygiene.

## Feature Inventory
| # | Feature | Target Files | Requirements / Description | Status |
|---|---------|--------------|-----------------------------|--------|
| 1 | Private Browsing localStorage resilience (D12) | `src/lib/theme.tsx` | Wrap all localStorage reads/writes in `try...catch` with graceful memory/default fallbacks so private browsing doesn't crash | IN_PROGRESS |
| 2 | Ctrl+G / Cmd+G Glossary Shortcut (D11) | `OverlayHost.tsx` / `GlobalShortcuts.tsx` | Bind `Ctrl+G` and `Cmd+G` global shortcut to toggle `GlossaryModal` | IN_PROGRESS |
| 3 | ESLint Hygiene & React Compiler fixes (D7) | `TraderProfilePage.tsx`, `TradeCandleChart.tsx`, `TradeCompareModal.tsx`, `HeroCockpit.tsx`, `RiskCalculator.tsx`, `TradesPage.tsx` | Resolve 20 ESLint hygiene errors (unused imports/vars, React Compiler rules) cleanly | IN_PROGRESS |
| 4 | Design Token Compliance (D8) | `WindowChrome.tsx:283`, `DashboardPage.tsx:752` | Replace hardcoded inline hex colors with standard semantic design tokens / Tailwind classes | IN_PROGRESS |
| 5 | Deterministic Date & UTC Hours (D6) | `DisciplineCost.tsx:332`, `TradeCandleChart.tsx:101` | Replace `new Date().getFullYear()` with `ANIO_PUBLICACION` and ensure UTC hours usage | IN_PROGRESS |

## Interface Contracts & Constraints
- Must NOT break any existing UI or components.
- Zero ESLint errors or warnings.
- Clean build: `npm run build` or `pnpm build` must pass with exit code 0.
- All code edits must be genuine (no facade, no cheating).
