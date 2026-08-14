## 2026-08-14T16:06:42Z
You are test_writer_2 in the E2E Testing Track for CountPips.
Working directory: c:\Users\jmqc1\Documents\Cosas\web-trading-journal\.agents\test_writer_2\
Original Request: c:\Users\jmqc1\Documents\Cosas\web-trading-journal\.agents\ORIGINAL_REQUEST.md
Project Blueprint: c:\Users\jmqc1\Documents\Cosas\web-trading-journal\PROJECT.md
Test Infrastructure: c:\Users\jmqc1\Documents\Cosas\web-trading-journal\TEST_INFRA.md
Workspace Root: c:\Users\jmqc1\Documents\Cosas\web-trading-journal

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Your scope:
Implement comprehensive, requirement-driven opaque-box Vitest test suites covering:
1. Dimension D2 & D3 (WCAG 2.1 AA Accessibility & Mobile Viewport 390x844) in `tests/e2e/d2_d3_accessibility_viewport.test.ts`:
   - Tier 1 Feature Coverage (>= 5 tests): Touch target rules (>= 44x44px), contrast standards in light/dark themes, ARIA attributes and labels, prefers-reduced-motion CSS tokens, skip links, input font size rules (>= 16px to prevent iOS auto-zoom).
   - Tier 2 Boundary & Corner Cases (>= 5 tests): Extreme viewport widths (390px, 320px), long translated strings causing potential overflow, nested table responsive degradation, modal keyboard focus traps.
2. Dimension D8 (Design Tokens & Theme Purity) in `tests/e2e/d8_design_tokens.test.ts`:
   - Tier 1 Feature Coverage (>= 5 tests): Validation of CSS custom properties `--tj-*`, `--surface-*`, `--text-*`, theme switching (`:root[data-theme="light"]`, `:root[data-theme="dark"]`), palette tokens.
   - Tier 2 Boundary & Corner Cases (>= 5 tests): Scans for prohibited raw inline hex/rgb colors in components, fallback token definitions, contrast compliance across custom palettes.
3. Dimension D11 & D12 (Shortcuts, Error Handling & Resilience) in `tests/e2e/d11_d12_shortcuts_resilience.test.ts`:
   - Tier 1 Feature Coverage (>= 5 tests): Ctrl+K (CommandPalette) and Ctrl+G (GlossaryModal) keybindings, localStorage try-catch safety for private browsing mode, interactive tool input bounds checking (RiskCalculator, DisciplineCost, EquityProjector).
   - Tier 2 Boundary & Corner Cases (>= 5 tests): NaN, Infinity, negative values handling in all calculators, DOMException / SecurityError simulation on localStorage, rapid concurrent shortcut triggers.
4. Tier 3 Cross-Feature Pairwise Combinations in `tests/e2e/tier3_pairwise_combinations.test.ts`:
   - At least 15 pairwise interaction test cases (e.g., Theme switching + Chart rendering, Filter selection + PRNG seed stability, Locale change + Shortcut activation, LocalStorage failure + Tool calculation, Touch viewport + Modal overlay focus, Error input + Recovery plan projection).
