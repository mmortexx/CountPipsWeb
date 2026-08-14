## 2026-08-14T16:10:21Z
You are Worker 1 for Milestone 1 (Core Resilience, Storage & Navigation) of CountPips.
Your working directory is: c:\Users\jmqc1\Documents\Cosas\web-trading-journal\.agents\worker_m1\
Parent orchestrator conversation ID: 5c47d07f-8b2d-4047-aa81-85801a9bd3bb

Read the authoritative requirements and explorer reports:
- ORIGINAL_REQUEST: c:\Users\jmqc1\Documents\Cosas\web-trading-journal\.agents\ORIGINAL_REQUEST.md
- PROJECT.md: c:\Users\jmqc1\Documents\Cosas\web-trading-journal\PROJECT.md
- SCOPE.md: c:\Users\jmqc1\Documents\Cosas\web-trading-journal\.agents\m1_orch\SCOPE.md
- Explorer 1 Report (Storage & Shortcuts): c:\Users\jmqc1\Documents\Cosas\web-trading-journal\.agents\explorer_m1_1\handoff.md
- Explorer 2 Report (ESLint Hygiene): c:\Users\jmqc1\Documents\Cosas\web-trading-journal\.agents\explorer_m1_2\handoff.md
- Explorer 3 Report (Tokens & Date Determinism): c:\Users\jmqc1\Documents\Cosas\web-trading-journal\.agents\explorer_m1_3\handoff.md

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Your Exclusive Write Scope:
- `src/lib/theme.tsx`
- `src/lib/overlays.ts`
- `src/components/tj/OverlayHost.tsx`
- `src/components/tj/GlobalShortcuts.tsx`
- `src/components/tj/ShortcutsHelp.tsx`
- `src/components/beta/TraderProfilePage.tsx`
- `src/components/charts/TradeCandleChart.tsx`
- `src/components/demo/TradeCompareModal.tsx`
- `src/components/marketing/HeroCockpit.tsx`
- `src/components/marketing/RiskCalculator.tsx`
- `src/components/demo/pages/TradesPage.tsx`
- `eslint.config.mjs`
- `src/components/demo/WindowChrome.tsx`
- `src/components/demo/pages/DashboardPage.tsx`
- `src/components/marketing/DisciplineCost.tsx`
- `tests/theme.test.ts` (or updating/adding tests as needed for theme resilience & shortcut)

Task Implementation Checklist:
1. Feature 1 (D12): Wrap `localStorage` in `try...catch` in `src/lib/theme.tsx` for private browsing resilience. Implement `getSavedTheme()`, `saveTheme()`, `getSavedPalette()`, `savePalette()` with fallback to `"light"` and `"clasico"`, keeping React state and DOM attributes working smoothly even when localStorage throws `DOMException` / `SecurityError` / `QuotaExceededError`. Export contract aliases (`getTheme`, `setThemeStorage`, `getPalette`, `setPaletteStorage`).
2. Feature 2 (D11): Bind `Ctrl+G` / `Cmd+G` shortcut in `OverlayHost.tsx` / `GlobalShortcuts.tsx` for `GlossaryModal`. Dynamic import with `{ ssr: false }`, prefetch on gesture, mutual exclusivity with `CommandPalette` / `ShortcutsHelp`, `e.preventDefault()` to prevent native Find Next, add `OPEN_GLOSSARY` in `src/lib/overlays.ts`, add shortcut entry to `ShortcutsHelp.tsx`, and suppress single-key shortcuts when dialogs are open in `GlobalShortcuts.tsx`.
3. Feature 3 (D7): Fix all 20 ESLint errors and React Compiler notices cleanly (no eslint-disable comments):
   - `TraderProfilePage.tsx`: remove unused `Layers` import.
   - `TradeCandleChart.tsx`: remove unused `useRef`, `fmtNum`, `Crosshair` imports.
   - `TradeCompareModal.tsx`: remove unused `fmtNum`, `pnlTone`, `ArrowRight`, `CheckCircle2`, `AlertTriangle`, `ShieldCheck` imports and unused `isWinA`, `isWinB`.
   - `HeroCockpit.tsx`: remove unused `useMemo`, `Terminal`, `Lock` imports and unused `simulatedCount` state.
   - `RiskCalculator.tsx`: remove unused `riskAt` function.
   - `TradesPage.tsx`: reorder declarations so `customIds`, `allTrades`, and `filtered` precede `handleCompare` and `handleExport`.
   - `eslint.config.mjs`: add `".agents/**"` to the `ignores` array.
4. Feature 4 (D8):
   - `WindowChrome.tsx:283`: replace `hover:bg-[#C42B1C]` with `hover:bg-pnl-neg hover:text-white`.
   - `DashboardPage.tsx:752`: replace `bg-[#1A1917]` with `bg-[rgb(var(--accent-ink))]`.
5. Feature 5 (D6):
   - `DisciplineCost.tsx:332`: replace `new Date().getFullYear()` with `ANIO_PUBLICACION` imported from `@/lib/publicacion`.
   - `TradeCandleChart.tsx:101`: use `date.getUTCHours()` and `date.getUTCMinutes()` instead of local hours/minutes.
6. Tests: Add/update unit test coverage for theme resilience and shortcuts (e.g. `tests/theme.test.ts`).

Verification Commands to execute:
- `npx eslint src` (must be 0 errors, 0 warnings)
- `npm run lint` (must pass with 0 errors)
- `npm run typecheck` (must pass with 0 errors)
- `npm test` (all vitest suites must pass)
- `npm run build` (must pass with exit code 0)
