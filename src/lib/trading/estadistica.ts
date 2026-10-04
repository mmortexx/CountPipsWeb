/* Fórmulas puras de las calculadoras, aparte del generador de la muestra:
   importarlas no genera las 200 operaciones de /demo. */

/**
 * Los dos tramos de la barra riesgo/beneficio crecen desde el CENTRO del
 * carril, cada uno hacia su lado, así que ninguno puede pasar del 50 %.
 *
 * Anclados a los bordes con la escala entera —que es como estaba— el mayor
 * de los dos se iba al 100 % del carril y tapaba al otro por completo: con
 * un 3:1 la parte roja no se veía.
 */
export function tramosRiesgoBeneficio(
  riesgo: number,
  beneficio: number
): { riesgo: number; beneficio: number } {
  const r = Number.isFinite(riesgo) ? Math.max(0, riesgo) : 0;
  const b = Number.isFinite(beneficio) ? Math.max(0, beneficio) : 0;
  const max = Math.max(r, b, 1);
  return { riesgo: (r / max) * 50, beneficio: (b / max) * 50 };
}

/** Un empate exacto —25 % a 0,9 R : 0,3 R, 40 % a 1,5— sale en coma
 *  flotante como ±1e-16, y se pintaba «Expectancy positiva» con «0,000 R».
 *  Por debajo de una milmillonésima es cero. */
export function sinRuido(x: number): number {
  return Math.abs(x) < 1e-9 ? 0 : x;
}

/** Parte del balance inicial perdida que las calculadoras cuentan como ruina. */
export const UMBRAL_RUINA_PCT = 50;

/**
 * Riesgo de ruina: probabilidad de perder alguna vez `ruinDdPct` del
 * capital arriesgando `riskPct` fijo por operación, con ganancias de `b`
 * unidades y pérdidas de 1.
 *
 * E = p · b − q. Si E ≤ 0 la ruina es segura (100 %). Si no,
 * P(ruina) = z^U, con U = ruinDdPct / riskPct y z la raíz en (q, 1) de
 * p · z^b + q / z = 1: la ruina del jugador generalizada, exacta cuando
 * las pérdidas son de una unidad. La aproximación de difusión
 * e^(−2·E·U/σ²), que es la que había, falla con pagos asimétricos: con
 * un 50 % de acierto y ganancias de 1.500 R daba un 87 % de ruina.
 */
export function computeRiskOfRuin(
  winRate: number,
  payoff: number,
  riskPct = 1.0,
  ruinDdPct = UMBRAL_RUINA_PCT
): number {
  const p = winRate > 1 ? winRate / 100 : Math.max(0, Math.min(1, winRate));
  const q = 1 - p;
  const b = Math.max(0.01, payoff);
  const safeRisk = Math.max(0.1, riskPct);
  const safeDd = Math.max(1, ruinDdPct);
  const units = safeDd / safeRisk;

  if (p * b - q <= 0) return 100;
  if (q <= 0) return 0;

  const g = (z: number) => p * Math.pow(z, b) + q / z - 1;
  /* g(1) = 0 y g'(1) = E > 0, así que g es negativa justo por debajo de 1;
     y g(q) = p·q^b > 0. La raíz buscada queda entre q y ese punto. */
  let hi = 1 - 1e-6;
  while (g(hi) >= 0 && 1 - hi > 1e-15) hi = 1 - (1 - hi) / 10;
  if (g(hi) >= 0) return 100;
  let lo = q;
  for (let i = 0; i < 200; i++) {
    const mid = (lo + hi) / 2;
    if (g(mid) > 0) lo = mid;
    else hi = mid;
  }
  return Math.min(100, Math.max(0, Math.pow((lo + hi) / 2, units) * 100));
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

/** Valores críticos de una cola: z tal que Φ(z) = confianza. */
export const Z_UNA_COLA = { 90: 1.2816, 95: 1.6449, 99: 2.3263 } as const;
/** z de una potencia del 80 %: Φ(0,8416) = 0,80. */
const Z_POTENCIA_80 = 0.8416;

export type VeredictoVentaja = "sin-ventaja" | "muestra-insuficiente" | "no-significativo" | "moderada" | "solida";

/**
 * ¿Ventaja o azar? Con ganancias de `ganancia` R y pérdidas de `perdida`
 * R, el acierto que deja la expectancy a cero es
 * perdida / (ganancia + perdida). Esa es la hipótesis nula —sin
 * ventaja—, no el 50 %: un 35 % de aciertos a 1 R : 1 R pierde dinero
 * por lejos que esté del 50 %, y un 40 % a 3 R : 1 R lo gana.
 *
 * Contraste de una cola —solo interesa si el acierto SUPERA el de
 * equilibrio— con la aproximación normal, válida con n·p0·(1−p0) ≥ 5.
 * La muestra necesaria es la que detecta el acierto observado con una
 * potencia del 80 %: si la muestra ya la alcanza, el contraste sale
 * significativo por construcción.
 */
export function contrasteVentaja(n: number, aciertoPct: number, ganancia: number, perdida: number) {
  const p = Math.min(1, Math.max(0, aciertoPct / 100));
  const equilibrio = perdida / (ganancia + perdida);
  const q0 = 1 - equilibrio;
  const sd0 = Math.sqrt(equilibrio * q0);
  const sd1 = Math.sqrt(p * (1 - p));
  const diferencia = sinRuido(p - equilibrio);
  const hayVentaja = diferencia > 0;
  const minimoValido = Math.ceil(5 / (equilibrio * q0));
  const valido = n >= minimoValido;
  const z = sd0 > 0 ? (diferencia * Math.sqrt(n)) / sd0 : 0;
  const pValor = valido ? 1 - normalCdf(z) : 1;

  const muestraPara = (confianza: keyof typeof Z_UNA_COLA): number | null =>
    hayVentaja
      ? Math.max(minimoValido, Math.ceil(((Z_UNA_COLA[confianza] * sd0 + Z_POTENCIA_80 * sd1) / diferencia) ** 2))
      : null;

  const potencia = !hayVentaja
    ? 0
    : sd1 > 0
      ? normalCdf((diferencia * Math.sqrt(n) - Z_UNA_COLA[95] * sd0) / sd1) * 100
      : diferencia * Math.sqrt(n) > Z_UNA_COLA[95] * sd0
        ? 100
        : 0;

  const veredicto: VeredictoVentaja = !hayVentaja
    ? "sin-ventaja"
    : !valido
      ? "muestra-insuficiente"
      : pValor >= 0.05
        ? "no-significativo"
        : pValor >= 0.01
          ? "moderada"
          : "solida";

  return { equilibrio, z, pValor, valido, minimoValido, potencia, muestraPara, veredicto };
}
