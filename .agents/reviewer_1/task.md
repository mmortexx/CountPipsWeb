# Reviewer 1 Task Assignment

## Mission
Review the entire CountPipsWeb project against all requirements in `ORIGINAL_REQUEST.md` (R1-R4) and `PROJECT.md`.

## Target Areas
1. **Zero Regression & Build Pipeline (R1)**:
   - Run `npm run lint` -> 0 errors.
   - Run `npm run typecheck` -> 0 errors.
   - Run `npm run test` -> 100% tests passing (all unit and E2E suites).
   - Run `npm run build` -> 182 static pages compiled.
2. **Quantitative Exactness (R2)**:
   - Review `src/lib/trading/data.ts`, `RiskCalculator.tsx`, `EdgeSignificanceChecker.tsx`, `AnalyticsPage.tsx`.
   - Verify Sharpe, Sortino (downside deviation MAR=0), Calmar, Omega, Half Kelly, SQN, Ulcer Index, Drawdown Skewness, Wilson 95% CI, multi-asset official multipliers.
3. **Fluent 2 Graphics & 165 FPS (R3)**:
   - Review GPU accelerated styles in `globals.css` (`translate3d`, `contain: layout paint`), canvas stippling in `EngravedAtlas.tsx`, Mica/Paper Dense materials.
4. **Accessibility & Responsive (R4)**:
   - Run `npm run legible` -> 100% WCAG AA text compliance.
   - Run `node scripts/humo.mjs --serve out` -> 19 routes across 4 viewports including 390x844 mobile and no-JS.

Write your verdict (APPROVE or REQUEST_CHANGES) and 5-section report to:
`c:\Users\jmqc1\Documents\Cosas\web-trading-journal\.agents\reviewer_1\handoff.md`
