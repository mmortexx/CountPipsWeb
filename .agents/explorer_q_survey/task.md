# Task Assignment: Quantitative Math & Statistical Engine Survey (R2)

## Mission
Survey the entire quantitative and statistical engine of CountPipsWeb in `src/lib/trading/`, interactive tools (`src/components/marketing/`, `src/components/demo/`), and existing test suites (`tests/`, `tests/e2e/`).

## Authoritative User Request
Path: `c:\Users\jmqc1\Documents\Cosas\web-trading-journal\.agents\ORIGINAL_REQUEST.md`

## Focus Areas
1. Quantitative Risk Metrics: Sharpe, Sortino (with exact downside deviation MAR=0 or custom threshold), Calmar (365.25d annualized), Omega Ratio, Half Kelly sizing, SQN (Van Tharp system quality number), Ulcer Index, Drawdown Skewness.
2. Statistical Inference: Wilson 95% Score Confidence Interval for win rate, sample size $n$ determination matrices for statistical significance, Random Walk / Runs hypothesis test for trade independence.
3. Multi-Asset Official Multipliers: Futures (ES $50, NQ $20, MES $5, MNQ $2, RTY $50, GC $100, CL $1000) and Forex (Standard 100k, Mini 10k, Micro 1k).
4. Edge cases: $n=0, n=1$, 100% win, 100% loss, 0 variance, 0 downside deviation.
5. Existing test coverage and gaps in `tests/` and `tests/e2e/d1_math_accuracy.test.ts`.

Write your structured report to `c:\Users\jmqc1\Documents\Cosas\web-trading-journal\.agents\explorer_q_survey\handoff.md`.
