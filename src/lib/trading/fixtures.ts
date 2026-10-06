/**
 * Fixtures de marketing: los datos de las dos piezas de la home que enseñan
 * números, la tira de KPI de `OverviewApp` y el calendario de `FeaturesBento`.
 *
 * Garantías:
 * · Los números salen de `METRICS` y `TRADES` (`data.ts`), no escritos a mano,
 *   así que la home y el panel de `/demo` no pueden discrepar.
 * · El texto que acompaña viaja en los dos idiomas; elige el componente, que
 *   sabe el idioma de la página. Un literal en español fijo serviría español
 *   en `/en`, y ninguna prueba cazaría el texto de un módulo sin uso.
 */

import { fmtMoney, fmtNum, fmtPct } from "./format";
import { METRICS, TRADES, dailyPnlForMonth } from "./data";
import { SETUP_NAMES, type SetupName } from "./setups";

/** Un rótulo que la fixture no puede resolver sola: no conoce el idioma. */
export interface Bilingue {
  es: string;
  en: string;
}

// El mes de muestra: el desfase del día 1 y la longitud salen del calendario, no de cifras a mano.
const ANIO = 2026;
const MES = 6; // julio
const MONTH_DAYS = new Date(Date.UTC(ANIO, MES + 1, 0)).getUTCDate();
const DESFASE = (new Date(Date.UTC(ANIO, MES, 1)).getUTCDay() + 6) % 7; // lunes = 0
const CELDAS = Math.ceil((DESFASE + MONTH_DAYS) / 7) * 7;

let cache: ReturnType<typeof build> | null = null;

function build() {
  return {
    kpis: buildKpis(),
    /** Calendario de julio 2026, semanas completas de lunes a domingo, con P&L diario. */
    cal: buildCal(),
  };
}

function buildKpis() {
  return {
    pnl: {
      v: fmtMoney(METRICS.netPnl, "es", { sign: true }),
      color: "rgb(var(--pnl-pos))",
      delta: `${fmtPct(METRICS.roiPct, "es", 1)} ROI`,
      deltaColor: "rgb(var(--pnl-pos))",
    },
  };
}

function buildCal() {
  // El P&L diario sale de TRADES: el «Total mes» coincide con el monthlyBreakdown de julio.
  const dailyPnl = dailyPnlForMonth(TRADES, ANIO, MES);
  const cells = Array.from({ length: CELDAS }, (_, i) => {
    const dayNum = i - DESFASE + 1;
    if (dayNum < 1 || dayNum > MONTH_DAYS) {
      return { day: "", val: "", style: "background:transparent" };
    }
    const pnl = dailyPnl.get(String(dayNum)) ?? 0;
    const isPos = pnl >= 0;
    // Intensidad escalada a unos 200 $, una ganancia típica de 1 R con el riesgo de la muestra.
    const intensity = Math.min(1, Math.abs(pnl) / 200);
    // El tinte es una fracción de `--cal-tint-max`, no un número suelto: con
    // más tinte el texto de 8 px caía a 2,72:1; atado al tope el peor caso es 7:1.
    const factor = (0.3 + intensity * 0.7).toFixed(2);
    // Un día sin operaciones es un dato, no un agujero: la celda existe siempre,
    // en gris neutro, y solo el color distingue ganancia de pérdida.
    const bg =
      pnl === 0
        ? "rgb(var(--divider) / 0.045)"
        : isPos
          ? `rgb(var(--pnl-pos) / calc(var(--cal-tint-max) * ${factor}))`
          : `rgb(var(--pnl-neg) / calc(var(--cal-tint-max) * ${factor}))`;
    const style = `background:${bg};border-radius:4px;aspect-ratio:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;padding:2px`;
    return {
      day: String(dayNum),
      val: pnl === 0 ? "·" : `${pnl >= 0 ? "+" : "−"}${fmtNum(Math.abs(pnl), "es", 0)}`,
      style,
    };
  });
  let total = 0;
  for (const v of dailyPnl.values()) total += v;
  return {
    // Los rótulos van en los dos idiomas: la fixture se evalúa una vez y el idioma lo decide la ruta.
    label: { es: "julio 2026", en: "July 2026" } satisfies Bilingue,
    chip: { es: "Mes en curso", en: "Current month" } satisfies Bilingue,
    pnl: {
      es: `${total >= 0 ? "+" : "−"}${fmtMoney(Math.abs(total), "es")}`,
      en: `${total >= 0 ? "+" : "−"}${fmtMoney(Math.abs(total), "en")}`,
    } satisfies Bilingue,
    pnlColor: total >= 0 ? "rgb(var(--pnl-pos))" : "rgb(var(--pnl-neg))",
    cells,
  };
}

/** El bundle de fixtures, idempotente. Interno a propósito: público, daba una puerta trasera a secciones sin uso. */
function buildMarketingFixture() {
  if (!cache) cache = build();
  return cache;
}

export function getCal() {
  return buildMarketingFixture().cal;
}

export interface SetupResumen {
  setup: SetupName;
  n: number;
  acierto: number;
  expectativaR: number;
}

/** Cada setup de la muestra con su acierto y su R media, de mejor a peor. */
export function getSetups(): SetupResumen[] {
  return SETUP_NAMES.map((setup) => {
    const ops = TRADES.filter((t) => t.setup === setup);
    const n = ops.length;
    return {
      setup,
      n,
      acierto: n ? ops.filter((t) => t.rMultiple > 0).length / n : 0,
      expectativaR: n ? ops.reduce((s, t) => s + t.rMultiple, 0) / n : 0,
    };
  })
    .filter((s) => s.n > 0)
    .sort((a, b) => b.expectativaR - a.expectativaR);
}

/** Anchura de cada cubo del histograma, en R. */
const R_BIN = 0.5;

export interface RBin {
  /** Borde izquierdo, en R (incluido). */
  from: number;
  /** Borde derecho, en R (excluido; el último cubo lo tiene abierto). */
  to: number;
  /** Operaciones de muestra que caen dentro. */
  count: number;
  /** `true` si el cubo entero cae en pérdida. Decide el color de la barra. */
  losing: boolean;
}

let rDist: RBin[] | null = null;

/**
 * Distribución de R de las operaciones de muestra, en cubos de 0,5 R con
 * bordes limpios y el rango recortado a lo que hay.
 *
 * Sale toda de `TRADES`, así que el gráfico, su pie y los ratios de al lado no
 * pueden discrepar; con alturas escritas a mano llegaron a contradecirse y a
 * colorear por el índice de la barra y no por el signo de R.
 *
 * No es `rHistogram` (`data.ts`): ese reparte un rango fijo de −1,5 a 3,5 en 9
 * cubos, con bordes (0,2 / 0,7 / 1,3…) que no se rotulan bien y cubos vacíos por
 * arriba. Aquel se queda porque lo usa la analítica de la demo.
 *
 * El hueco entre −0,5 R y +0,5 R es real (la muestra o se come el stop o deja
 * correr): el consumidor debe representarlo, no esconderlo.
 */
export function getRDistribution(): RBin[] {
  if (rDist) return rDist;
  const rs = TRADES.map((t) => t.rMultiple).filter(Number.isFinite);
  if (!rs.length) {
    rDist = [];
    return rDist;
  }
  const lo = Math.floor(Math.min(...rs) / R_BIN) * R_BIN;
  const hi = Math.ceil(Math.max(...rs) / R_BIN) * R_BIN;
  const n = Math.max(1, Math.round((hi - lo) / R_BIN));
  const bins: RBin[] = Array.from({ length: n }, (_, i) => {
    const from = Number((lo + i * R_BIN).toFixed(2));
    const to = Number((from + R_BIN).toFixed(2));
    return { from, to, count: 0, losing: to <= 0 };
  });
  for (const r of rs) {
    const idx = Math.max(0, Math.min(n - 1, Math.floor((r - lo) / R_BIN)));
    bins[idx].count += 1;
  }
  rDist = bins;
  return bins;
}
