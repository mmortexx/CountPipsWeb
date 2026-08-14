## 2026-08-14T16:06:42Z
You are test_writer_1 in the E2E Testing Track for CountPips.
Working directory: c:\Users\jmqc1\Documents\Cosas\web-trading-journal\.agents\test_writer_1\
Original Request: c:\Users\jmqc1\Documents\Cosas\web-trading-journal\.agents\ORIGINAL_REQUEST.md
Project Blueprint: c:\Users\jmqc1\Documents\Cosas\web-trading-journal\PROJECT.md
Test Infrastructure: c:\Users\jmqc1\Documents\Cosas\web-trading-journal\TEST_INFRA.md
Workspace Root: c:\Users\jmqc1\Documents\Cosas\web-trading-journal

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Your scope:
Implement comprehensive, requirement-driven opaque-box Vitest test suites covering:
1. Dimension D1 (Quantitative & Financial Math) in `tests/e2e/d1_math_accuracy.test.ts`:
   - Tier 1 Feature Coverage (>= 5 tests): Sharpe, Sortino (MAR=0), Calmar (365.25d base), Profit Factor Delta Method CI, Expectancy R, Kelly Criterion (pure/half/quarter with clamping f*=0), Binomial test CDF (Abramowitz & Stegun 7.1.26), Monte Carlo deterministic without replacement, Guardian Recovery Plan capital & ROI projector.
   - Tier 2 Boundary & Corner Cases (>= 5 tests): n=0 trades, n=1 trade, 100% win rate, 100% loss rate, zero drawdown/flat equity curve, 0 standard deviation, negative initial balance, extreme leverage.
2. Dimension D7 & D13 (Demo Engine & State Sync) in `tests/e2e/d7_d13_demo_engine.test.ts`:
   - Tier 1 Feature Coverage (>= 5 tests): Mulberry32 PRNG determinism with fixed seed, strict UTC date generation and indexing, filter integrity across assets/setups/sessions, data sync across metrics/calendar/equity curve.
   - Tier 2 Boundary & Corner Cases (>= 5 tests): Empty filter result sets, date range edge matching, zero balance boundary, single-candle ranges.
3. Tier 4 Real-World Application Scenarios in `tests/e2e/tier4_real_world_scenarios.test.ts`:
   - At least 8 realistic trading scenarios exercising multi-feature journeys (e.g. 50-trade sample import and statistical audit, Guardian recovery sequence from 30% drawdown, Kelly position sizing recalculation under shifting win rates, multi-month calendar PnL rollups, Monte Carlo risk of ruin stress testing, bilingual trade setup analysis).

Requirements:
- Tests must be written in TypeScript for Vitest (`npm test`).
- Import functions from `@/lib/trading/data`, `@/lib/trading/estadisticas`, `@/components/demo/demoStore`, etc. as appropriate.
- Test actual logic without mocking internal calculations with dummy values.
- Verify that tests run with `npx vitest run tests/e2e/d1_math_accuracy.test.ts tests/e2e/d7_d13_demo_engine.test.ts tests/e2e/tier4_real_world_scenarios.test.ts`.
- Write your progress to `progress.md` and complete handoff in `handoff.md` in your working directory.
- Send a message back to parent when done.
