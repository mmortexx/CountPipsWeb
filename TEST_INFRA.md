# E2E Test Infra: CountPips

## Test Philosophy
- **Opaque-box & Requirement-driven**: Tests derive strictly from user requirements in `ORIGINAL_REQUEST.md` and user-facing specifications across all 13 quality dimensions (D1 to D13).
- **Systematic Multi-Tier Verification**:
  - **Tier 1: Feature Coverage** (>=5 test cases per dimension covering nominal happy-path functionality).
  - **Tier 2: Boundary & Corner Cases** (>=5 test cases per dimension covering extremes, null/empty/overflow/zero states).
  - **Tier 3: Cross-Feature Interactions** (Pairwise combination testing verifying integrated behavior).
  - **Tier 4: Real-World Application Workloads** (End-to-end user journeys and trading scenarios).
- **Progressive Testability**: Verification uses standard Vitest execution (`npm test`) in Node.js environment without circular dependencies or unneeded complexity.

---

## 13 Quality Dimensions & Feature Inventory

| # | Dimension | Requirement | Tier 1 (Nominal) | Tier 2 (Boundary) | Tier 3 (Pairwise) | Tier 4 (Real-World) |
|---|-----------|-------------|:----------------:|:-----------------:|:-----------------:|:-------------------:|
| D1 | Quantitative & Financial Math | Sharpe, Sortino, Calmar, PF CI, Kelly, Binomial CDF, Monte Carlo, Guardian | ≥5 | ≥5 | ✓ | ✓ |
| D2 | WCAG 2.1 AA Accessibility | Touch targets ≥44x44, contrast, focus traps, ARIA, reduced-motion | ≥5 | ≥5 | ✓ | ✓ |
| D3 | Mobile Viewport 390×844 | Zero overflow, font sizes ≥16px for inputs, table/chart responsive | ≥5 | ≥5 | ✓ | ✓ |
| D4 | Bilingual Parity ES/EN | 100% STR dictionary parity, 51 glossary terms, tools, FAQs, legal | ≥5 | ≥5 | ✓ | ✓ |
| D5 | SEO & Metadata | Unique titles, descriptions ≤160 chars, canonicals, hreflang, JSON-LD | ≥5 | ≥5 | ✓ | ✓ |
| D6 | Performance & Hydration | Deterministic SSR/SSG time, pure CSS animations, dynamic imports | ≥5 | ≥5 | ✓ | ✓ |
| D7 | Type Integrity & Tooling | TypeScript strictness, zero any, test suite execution | ≥5 | ≥5 | ✓ | ✓ |
| D8 | Design System Tokens | `--tj-*`, `--surface-*` token purity, theme switching light/dark | ≥5 | ≥5 | ✓ | ✓ |
| D9 | Security & Privacy | 100% local processing, zero external telemetry leaks, CookieConsent | ≥5 | ≥5 | ✓ | ✓ |
| D10 | Editorial Tone & Copy | Institutional copy, pricing disclaimers, no false promises | ≥5 | ≥5 | ✓ | ✓ |
| D11 | Navigation & Shortcuts | Ctrl+K command palette, Ctrl+G glossary, logical tab index | ≥5 | ≥5 | ✓ | ✓ |
| D12 | Error Handling & Resilience | NaN/Infinity guards, localStorage try-catch, invalid input rejection | ≥5 | ≥5 | ✓ | ✓ |
| D13 | Demo Engine State Sync | Deterministic mulberry32 PRNG, UTC timestamps, useSyncExternalStore | ≥5 | ≥5 | ✓ | ✓ |

---

## Test Architecture & Layout

- **Runner**: Vitest (`npm test` / `npx vitest run`)
- **Location**: `tests/` and `tests/e2e/`
- **Suites**:
  1. `tests/e2e/d1_math_accuracy.test.ts` — Comprehensive financial formulas, delta-method CI, Kelly, Monte Carlo, Guardian.
  2. `tests/e2e/d2_accessibility_wcag.test.ts` — Touch target standards, ARIA attributes, focus states, reduced-motion specs.
  3. `tests/e2e/d3_mobile_viewport.test.ts` — Viewport 390x844 layout assertions, font-size >= 16px checks, responsive constraints.
  4. `tests/e2e/d4_bilingual_parity.test.ts` — Key-by-key parity in `STR`, glossary (51 terms), tools, FAQs, and legal routes.
  5. `tests/e2e/d5_seo_metadata.test.ts` — Title uniqueness, description <= 160 length, canonical URLs, hreflang symmetry, JSON-LD schema validity.
  6. `tests/e2e/d6_d8_performance_tokens.test.ts` — Design token usage, no raw hex leaks, SSR determinism, theme token mappings.
  7. `tests/e2e/d9_d10_security_editorial.test.ts` — Client-side privacy, PostHog consent gating, institutional tone invariants.
  8. `tests/e2e/d11_d12_shortcuts_resilience.test.ts` — Shortcut keybindings (Ctrl+K, Ctrl+G), storage error handling, input validation.
  9. `tests/e2e/d13_demo_engine.test.ts` — Mulberry32 PRNG determinism, UTC date consistency, cross-view state synchronization.
  10. `tests/e2e/tier3_pairwise_combinations.test.ts` — Multi-feature interaction matrix.
  11. `tests/e2e/tier4_real_world_scenarios.test.ts` — Full user lifecycle and trading journal workflows.

---

## Minimum Coverage Thresholds
- **Tier 1 (Feature Coverage)**: ≥65 test cases (≥5 per dimension × 13 dimensions)
- **Tier 2 (Boundary & Corner Cases)**: ≥65 test cases (≥5 per dimension × 13 dimensions)
- **Tier 3 (Cross-Feature Combinations)**: ≥15 test cases (Pairwise interactions)
- **Tier 4 (Real-World Application Scenarios)**: ≥8 complex scenarios
- **Total Minimum Target**: ≥153 test cases

---

## Pass/Fail Acceptance Criteria
- All tests execute and pass via `npm test` with exit code 0.
- Zero flaky or time-dependent assertions (all dates mocked or deterministic UTC).
- Zero mock shortcuts that bypass actual module business logic.
