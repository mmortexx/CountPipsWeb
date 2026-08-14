# Project: CountPips Audit, Correction, Optimization & Continuous Development

## Architecture
CountPips is a static marketing website and interactive browser demo for a native Windows trading journal.
- **Framework**: Next.js (App Router, SSG output export) + React 19 + TypeScript (Strict).
- **Styling**: Tailwind CSS v4 + Design Tokens (`--tj-*`, `--surface-*`, `--text-*`, `--accent-*`, `--pnl-*`).
- **I18n Architecture**: Symmetric bilingual routing (Spanish `/` + English `/en/`), 210 `STR` keys, 51 glossary terms, 7 tools, 17 FAQs, 4 legal documents.
- **Interactive Tools**: 100% local client-side calculators and simulators (`RiskCalculator`, `EdgeSignificanceChecker`, `RMultipleSimulator`, `EquityProjector`, `DisciplineCost`, `GuardianNew`, `SavingsCalculator`, `SessionClock`).
- **Demo Engine**: Deterministic PRNG (`mulberry32`), strict UTC date indexing, `useSyncExternalStore` reactive decoupled state (`demoStore.ts`).
- **Analytics & Consent**: Client-side PostHog (EU) with strict consent gating (`CookieConsent`), session recording disabled, masking enabled, 0 cookies.

## Feature Inventory
| # | Feature / Area | Dimension | Description & Target Files | Milestone | Source |
|---|----------------|-----------|----------------------------|-----------|--------|
| 1 | LocalStorage Resilience | D12 | Wrap `localStorage` in `try...catch` in `src/lib/theme.tsx` for private browsing | M1 | Survey UI/UX |
| 2 | Keyboard Shortcut Ctrl+G | D11 | Bind `Ctrl+G` / `Cmd+G` in `OverlayHost.tsx` / `GlobalShortcuts.tsx` for `GlossaryModal` | M1 | Survey UI/UX |
| 3 | ESLint & Hygiene Cleanup | D7 | Resolve 20 ESLint errors (unused vars/imports, React Compiler memoization notices) | M1 | Survey Tech |
| 4 | Design System Token Purity | D8 | Replace inline hex (`WindowChrome.tsx:283`, `DashboardPage.tsx:752`) with CSS tokens | M1 | Survey UI/UX |
| 5 | SSG Hydration Determinism | D6 | Replace `new Date().getFullYear()` in `DisciplineCost.tsx` and local hours in `TradeCandleChart.tsx` | M1 | Survey UI/UX |
| 6 | Math Edge Case NaN Guard | D1, D12 | Guard `cagr` against `finalBalance <= 0` in `EquityProjector.tsx:72` | M2 | Survey UI/UX |
| 7 | Quantitative Verification & Unit Tests | D1, D7 | Verify and add unit tests for Sharpe, Sortino, Calmar, Profit Factor CI, Kelly, Binomial, Monte Carlo | M2 | Survey Tech |
| 8 | Mobile Input Font Sizes | D3 | Enforce `text-base md:text-sm` (>= 16px on mobile) in `FAQ.tsx`, `ContactForm.tsx`, `GlosarioIndice.tsx`, `DisciplineCost.tsx` | M3 | Survey UI/UX |
| 9 | WCAG Touch Target Compliance | D2 | Enforce >= 44x44px touch targets on mobile for controls in `RiskCalculator.tsx`, `GlosarioIndice.tsx`, `TradeCandleChart.tsx`, `ShortcutsHelp.tsx` | M3 | Survey UI/UX |
| 10 | SEO Meta Description Fix | D5 | Trim `en/features/disciplina/page.tsx` meta description from 173 to <= 160 characters | M3 | Survey Spec |
| 11 | Bilingual Parity Maintenance | D4 | Maintain 100% parity across `STR`, glossary, tools, FAQs, and legal docs | M3 | Survey Spec |
| 12 | Security & Privacy Local Guard | D9 | Verify zero client-side leaks, PostHog consent-gating, sanitized JSON-LD | M3 | Survey Tech |
| 13 | Demo Engine State Sync | D13 | Verify deterministic PRNG, UTC timestamps, `useSyncExternalStore` sync | M2 | Survey Tech |
| 14 | E2E Opaque-Box Test Suite | D1-D13 | Requirement-driven test suite (Tiers 1-4) across 154 pages, 7 tools, 51 glossary terms | E2E Track | ORIGINAL_REQUEST |
| 15 | Adversarial Coverage Hardening | D1-D13 | White-box stress-testing, edge-case generation, and coverage audit (Tier 5) | M4 | ORIGINAL_REQUEST |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| E2E | E2E Testing Suite Track | Design test harness, implement Tiers 1-4 test suite, publish TEST_READY.md | none | IN_PROGRESS |
| M1 | Core Resilience, Storage & Navigation | Fix localStorage try-catch, Ctrl+G shortcut, ESLint cleanup, design tokens, SSG determinism | none | IN_PROGRESS |
| M2 | Quantitative Accuracy & Math Robustness | Fix cagr NaN guard, expand unit tests for all financial/statistical formulas, demo state sync | M1 | PLANNED |
| M3 | UI/UX, Touch Targets, Mobile Viewport & SEO | Touch targets >= 44x44px, inputs >= 16px, SEO meta description fix, bilingual validation | M1 | PLANNED |
| M4 | Final Milestone: 100% E2E Pass & Adversarial Hardening | Pass 100% E2E Test Suite (Tiers 1-4) + Tier 5 Adversarial Coverage Hardening | E2E, M2, M3 | PLANNED |

## Interface Contracts
### `src/lib/theme.tsx`
- `getTheme()`: returns `Theme`, must never throw even if `localStorage` throws `SecurityError`.
- `setTheme(theme)`: persists safely inside `try...catch`.
- `getPalette()` / `setPalette()`: persists safely inside `try...catch`.

### `src/components/tj/OverlayHost.tsx` & `GlobalShortcuts.tsx`
- Global keydown event listener:
  - `(e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k"` -> toggle `CommandPalette`.
  - `(e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "g"` -> toggle `GlossaryModal`.

### `src/components/marketing/EquityProjector.tsx`
- `cagr` computation:
  - `startBalance > 0 && finalBalance > 0 && years > 0` -> `Math.pow(finalBalance / startBalance, 1 / years) - 1`.
  - Else fallback to `-1` or `0` deterministically, never `NaN`.

### `src/lib/trading/data.ts`
- All financial metrics (`computeMetrics`, `calcKelly`, `calcSharpe`, `calcSortino`, `calcCalmar`, `calcExpectancy`) must produce finite, deterministic numbers for all edge inputs ($n=0, n=1$, 100% win, 100% loss, 0 standard deviation, 0 downside deviation).

## Code Layout
- `src/app/`: Next.js App Router static pages (ES at root, EN under `/en/`).
- `src/components/ui/`: Primitive UI components (button, input, badge, dialog).
- `src/components/tj/`: Layout, navigation, modals, shortcuts, overlays, consent.
- `src/components/marketing/`: Interactive tools, feature sections, calculators, FAQ, heroes.
- `src/components/demo/`: Demo trading journal engine, dashboard, trades, calendar, analytics.
- `src/components/glosario/`: Bilingual glossary components and indices.
- `src/lib/`: Core libraries (`i18n.tsx`, `theme.tsx`, `consent.ts`, `glosario.ts`, `herramientas.ts`, `faq.ts`, `publicacion.ts`).
- `src/lib/trading/`: Quantitative trading math, metrics computation, glossary domain models.
- `tests/`: Vitest test suites.
- `tests/e2e/`: E2E requirement-driven opaque-box test suites.
