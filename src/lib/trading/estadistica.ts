/* Fórmulas puras de las calculadoras, aparte del generador de la muestra:
   importarlas no genera las 200 operaciones de /demo. */

/**
 * Riesgo de Ruina de Ralph Vince / Perry Kaufman.
 * Calcula la probabilidad analítica de sufrir un drawdown de capital determinado (por defecto 50%).
 *
 * E = p * b - q  (Esperanza matemática en R)
 * σ_R^2 = p * b^2 + q - E^2  (Varianza del sistema en R)
 * Unidades de riesgo antes de la ruina: U = ruinDdPct / riskPct
 *
 * Si E <= 0 -> Ruina matemática inevitable (100%).
 * Si E > 0  -> P(ruina) = e^( -2 * E * U / σ_R^2 ) * 100
 */
export function computeRiskOfRuin(
  winRate: number,
  payoff: number,
  riskPct = 1.0,
  ruinDdPct = 50
): number {
  const p = winRate > 1 ? winRate / 100 : Math.max(0, Math.min(1, winRate));
  const q = 1 - p;
  const b = Math.max(0.01, payoff);
  const safeRisk = Math.max(0.1, riskPct);
  const safeDd = Math.max(1, ruinDdPct);
  const units = safeDd / safeRisk;

  const expectancy = p * b - q;
  if (expectancy <= 0) return 100;

  const variance = p * b * b + q - expectancy * expectancy;
  if (variance <= 0) return 0;

  // Formulación exponencial clásica de aproximación de difusión
  const exponent = (-2 * expectancy * units) / variance;
  const prob = Math.exp(Math.max(-50, Math.min(0, exponent)));
  return +(Math.min(100, Math.max(0, prob * 100))).toFixed(2);
}

/**
 * Racha máxima de pérdidas consecutivas esperada en una muestra de N operaciones.
 * E[Max Consecutive Losses] = ln(N) / -ln(1 - WinRate)
 */
export function computeExpectedMaxLossStreak(winRate: number, tradesCount: number): number {
  const n = Math.max(1, Math.floor(tradesCount));
  const p = winRate > 1 ? winRate / 100 : Math.max(0, Math.min(1, winRate));
  const q = 1 - p; // probabilidad de pérdida
  if (q <= 0) return 0;
  if (q >= 1) return n;
  if (n < 2) return 1;

  const denom = -Math.log(q);
  if (denom <= 0) return n;
  const streak = Math.log(n) / denom;
  return Math.min(n, Math.max(1, Math.round(streak)));
}

/**
 * Valor en Riesgo (VaR) paramétrico 1-Day / 1-Trade en dólares.
 * 95% CI -> z = 1.645
 * 99% CI -> z = 2.326
 */
export function computeParametricVaR(
  balance: number,
  riskPct: number,
  confidence: 95 | 99 = 95
): number {
  const z = confidence === 99 ? 2.326 : 1.645;
  const oneR = Math.max(0, balance) * (Math.max(0, riskPct) / 100);
  return +(oneR * z).toFixed(2);
}

/**
 * Función de Distribución Acumulada (CDF) de la distribución normal estándar N(0, 1).
 * Aproximación analítica de alta precisión vía erf (Abramowitz & Stegun 7.1.26, error máximo < 1.5e-7).
 */
export function normalCdf(x: number): number {
  if (x === 0) return 0.5;
  const z = Math.abs(x) / Math.SQRT2;
  const t = 1 / (1 + 0.3275911 * z);
  const erf =
    1 -
    ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) *
      t *
      Math.exp(-z * z);
  const phi = 0.5 * (1 + erf);
  return x > 0 ? phi : 1 - phi;
}

/**
 * Potencia estadística (1 - β) de un test binomial de ventaja vs azar (H0: p = 0.50).
 * Probabilidad de detectar estadísticamente la ventaja al nivel de significación α = 0.05.
 *
 * k_crit = 0.5 * n + 1.96 * sqrt(n * 0.25)
 * μ_1 = p * n
 * σ_1 = sqrt(n * p * (1 - p))
 * Power = 1 - Φ((k_crit - μ_1) / σ_1)
 */
export function computeStatisticalPower(
  winRate: number,
  tradesCount: number,
  alpha = 0.05
): number {
  const n = Math.max(1, Math.floor(tradesCount));
  const p = winRate > 1 ? winRate / 100 : Math.max(0, Math.min(1, winRate));
  if (p <= 0.5) return 0;
  const q = 1 - p;

  const zAlpha = alpha === 0.01 ? 2.576 : 1.96;
  const kCrit = 0.5 * n + zAlpha * Math.sqrt(n * 0.25);
  const mu1 = p * n;
  const sigma1 = Math.sqrt(n * p * q);

  if (sigma1 <= 0) return 100;

  const zBeta = (kCrit - mu1) / sigma1;
  const power = 1 - normalCdf(zBeta);
  return +(Math.min(100, Math.max(0, power * 100))).toFixed(1);
}
