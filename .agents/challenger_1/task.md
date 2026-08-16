# Challenger 1 Task Assignment

## Mission
Perform empirical adversarial stress testing on the quantitative models, financial calculations, PRNG determinism, and mathematical boundary conditions of CountPipsWeb.

## Authoritative User Request
Path: `c:\Users\jmqc1\Documents\Cosas\web-trading-journal\.agents\ORIGINAL_REQUEST.md`

## Focus Areas
1. **Adversarial Input Generation**:
   - Extreme inputs to `computeMetrics`: $n=0, n=1, n=10000$, all wins, all losses, alternating +/- infinity-risk setups, flat equity curves, zero standard deviation, zero downside deviation.
   - Half Kelly position sizing with extreme payoffs ($b \to \infty$, $b \to 0$, negative edge).
   - Wilson Score 95% CI with $p=0, p=1, n=1, n=1000000$.
   - Delta Method Profit Factor CI with $n_w=1, n_l=0$, zero variance.
   - Monte Carlo simulation: seed reproducibility, ruin boundary condition ($balance \le 0$).
2. **Execution Verification**:
   - Run unit and E2E test suites with `npm test`.
   - Verify zero NaN, zero Infinity leakage in UI/JSON representations.

Write your verdict (APPROVE or REQUEST_CHANGES) and 5-section report to:
`c:\Users\jmqc1\Documents\Cosas\web-trading-journal\.agents\challenger_1\handoff.md`
