# Project: CountPips Audit, Quantitative Expansion, Fluent 2 & Continuous Development

## Architecture
CountPips is a static marketing website and interactive browser demo for a native Windows trading journal.
- **Framework**: Next.js 16 (App Router, SSG output export) + React 19 + TypeScript (Strict).
- **Styling**: Tailwind CSS v4 + Design Tokens (`--tj-*`, `--surface-*`, `--text-*`, `--accent-*`, `--pnl-*`).
- **I18n Architecture**: Symmetric bilingual routing (Spanish `/` + English `/en/`), 210 `STR` keys, 57 glossary terms, 8 tools, 13 FAQs (bilingual), 4 legal documents.
- **Interactive Tools**: 100% local client-side calculators and simulators (`RiskCalculator`, `EdgeSignificanceChecker`, `RMultipleSimulator`, `EquityProjector`, `DisciplineCost`, `GuardianNew`, `SavingsCalculator`, `SessionClock`, `CommissionDragCalculator`).
- **Demo Engine**: Deterministic PRNG (`mulberry32`), strict UTC date indexing, `useSyncExternalStore` reactive decoupled state (`demoStore.ts`), 5 WinUI 3 demo views (Dashboard, Trades, TradeDetail, Analytics, Journal).
- **Analytics & Consent**: Client-side PostHog (EU) with strict consent gating (`CookieConsent`), session recording disabled, masking enabled, 0 cookies.
- **Rendering & Animation**: Hardware-accelerated GPU transforms (`translate3d`, `scale()`, `will-change`), Fluent 2 spring dynamics, sub-pixel canvas vector stippling (`EngravedAtlas.tsx`, `BackgroundFX.tsx`), double catch-light highlights on Mica/Paper Dense surfaces.

## Feature Inventory
| # | Feature / Area | Dimension | Description & Target Files | Milestone | Source |
|---|----------------|-----------|----------------------------|-----------|--------|
| 1 | LocalStorage Resilience | D12 | Wrap `localStorage` in `try...catch` in `src/lib/theme.tsx` for private browsing | M1 | Survey UI/UX |
| 2 | Keyboard Shortcut Ctrl+G | D11 | Bind `Ctrl+G` / `Cmd+G` in `OverlayHost.tsx` / `GlobalShortcuts.tsx` for `GlossaryModal` | M1 | Survey UI/UX |
| 3 | ESLint & Hygiene Cleanup | D7 | Resolve ESLint errors (unused vars/imports, React Compiler memoization notices) | M1 | Survey Tech |
| 4 | Design System Token Purity | D8 | Replace inline hex with CSS tokens in `WindowChrome.tsx`, `DashboardPage.tsx` | M1 | Survey UI/UX |
| 5 | SSG Hydration Determinism | D6 | Replace non-deterministic dates in `DisciplineCost.tsx` and `TradeCandleChart.tsx` | M1 | Survey UI/UX |
| 6 | Math Edge Case NaN Guard | D1, D12 | Guard `cagr` against `finalBalance <= 0` in `EquityProjector.tsx` | M2 | Survey UI/UX |
| 7 | Quantitative Verification & Risk Metrics | D1, D7 | Sharpe, Sortino (downside dev MAR=0), Calmar (365.25d), Keating-Shadwick Omega Ratio, Half Kelly, SQN, Ulcer Index, Drawdown Skewness in `src/lib/trading/data.ts` | M2 | Survey Tech |
| 8 | Statistical Inference Engine | D1, D7 | Wilson 95% CI, Sample size $n$ determination matrices, Abramowitz & Stegun normal CDF, Wald-Wolfowitz runs test | M2 | Survey Tech |
| 9 | Multi-Asset Official Multipliers | D1 | CME/NYMEX Futures (ES, NQ, MES, MNQ, RTY, GC, CL) and Forex (100k, 10k, 1k) multipliers | M2 | Survey Tech |
| 10 | Mobile Input Font Sizes & Touch Targets | D2, D3 | Enforce input `fontSize >= 16px` and touch targets `>= 44x44px` in interactive tools and controls | M3 | Survey UI/UX |
| 11 | Fluent 2 GPU Acceleration & 165 FPS | D6, D8 | Hardware acceleration (`translate3d`, `contain: layout paint`), spring curves, sub-pixel canvas stippling (`EngravedAtlas.tsx`) | M3 | Survey UI/UX |
| 12 | Bilingual Parity Maintenance | D4 | Maintain 100% parity across `STR`, glossary (57 terms), tools (8), FAQs (13 bilingües), and legal docs (4) | M3 | Survey Spec |
| 13 | Security & Privacy Local Guard | D9 | Verify zero client-side leaks, PostHog consent-gating, sanitized JSON-LD | M3 | Survey Tech |
| 14 | E2E Opaque-Box Test Suite | D1-D13 | Requirement-driven test suite (Tiers 1-4) across 196 pages, 8 tools, 57 glossary terms | E2E Track | ORIGINAL_REQUEST |
| 15 | Adversarial Coverage Hardening | D1-D13 | White-box stress-testing, edge-case generation, and coverage audit (Tier 5) | M4 | ORIGINAL_REQUEST |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| E2E | E2E Testing Suite Track | Design test harness, implement Tiers 1-4 test suite, publish TEST_READY.md | none | DONE |
| M1 | Core Resilience, Storage & Navigation | Fix localStorage try-catch, Ctrl+G shortcut, ESLint cleanup, design tokens, SSG determinism | none | DONE |
| M2 | Quantitative Expansion & Math Robustness | Rigorous risk metrics (Sharpe, Sortino MAR=0, Calmar, Omega, Half Kelly, SQN, Ulcer Index, Drawdown Skew), Wilson 95% CI, Runs Test, Multi-asset multipliers | M1 | DONE |
| M3 | Fluent 2 Graphics, Touch Targets, Mobile & SEO | 165 fps GPU rendering, sub-pixel canvas stippling, Mica/Paper Dense catch-light, 390x844 mobile, WCAG AA 100% texts | M1 | DONE |
| M4 | Final Milestone: 100% E2E Pass & Adversarial Hardening | Verify all 6 gates, execute adversarial stress-testing (Tier 5), forensic integrity audit | E2E, M2, M3 | IN_PROGRESS |

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
- All financial metrics (`computeMetrics`, `calcKelly`, `calcSharpe`, `calcSortino`, `calcCalmar`, `calcExpectancy`, `runsTest`) must produce finite, deterministic numbers for all edge inputs ($n=0, n=1$, 100% win, 100% loss, 0 standard deviation, 0 downside deviation).

## Code Layout
- `src/app/`: Next.js App Router static pages (ES at root, EN under `/en/`).
- `src/components/ui/`: Primitive UI components (button, input, badge, dialog).
- `src/components/tj/`: Layout, navigation, modals, shortcuts, overlays, consent, canvas `EngravedAtlas`, `BackgroundFX`.
- `src/components/marketing/`: Interactive tools, feature sections, calculators, FAQ, heroes.
- `src/components/demo/`: Demo trading journal engine, dashboard, trades, calendar, analytics, journal, trade detail.
- `src/components/glosario/`: Bilingual glossary components and indices.
- `src/lib/`: Core libraries (`i18n.tsx`, `theme.tsx`, `consent.ts`, `glosario.ts`, `herramientas.ts`, `faq.ts`, `publicacion.ts`).
- `src/lib/trading/`: Quantitative trading math, metrics computation, glossary domain models.
- `tests/`: Vitest test suites.
- `tests/e2e/`: E2E requirement-driven opaque-box test suites (Tiers 1-4).
