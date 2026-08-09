/**
 * Marketing fixtures — datos deterministas que el HTML de referencia
 * (Trading Journal - Home.dc.html) usaba para alimentar sus secciones
 * "Resumen", "Operaciones", "Playbook", "Calendario" y "Curva de
 * rendimiento". Tras portar el diseño a React/Next.js, esos mismos
 * valores se exponen desde aquí como una API estable para que los
 * componentes de marketing (`Hero`, `OverviewApp`, `FeaturesBento`,
 * `MetricsShowcaseNew`, ...) los consuman.
 *
 * R26-2d — Los KPIs y la curva de rendimiento ahora se sincronizan
 * con `METRICS` / `TRADES` de `data.ts` en vez de usar valores
 * hardcodeados. Así el copy de marketing ("P&L +5.732 $", "Sharpe 3,34",
 * "Max DD −8,0 %") y la demo real muestran exactamente los mismos
 * números: el trader que entra a /demo tras leer la home ve la
 * continuación coherente de lo que se le prometió. La semilla
 * determinista (mulberry32 con seed 20260722) se mantiene para todo
 * lo decorativo (filas de tabla, sparklines, etc.).
 *
 * Implementación:
 * - PRNG `mulberry32` con seed fija (20260722, como en el HTML).
 * - Formatos `es-ES` vía `Intl.NumberFormat` (consistente con el resto
 *   del proyecto que ya usa `src/lib/trading/format.ts`).
 * - Todos los exports son funciones puras: la primera llamada genera,
 *   las siguientes reutilizan el resultado cacheado (idempotente).
 */

import { fmtMoney, fmtNum, fmtPct } from "./format";
import type { Lang } from "@/lib/i18n";
import {
  METRICS,
  TRADES,
  dailyPnlForMonth,
} from "./data";

/* ---------- PRNG determinista ---------- */

function mulberry32(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rng = mulberry32(20260722);

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(rng() * arr.length)] as T;
}

function between(min: number, max: number): number {
  return min + rng() * (max - min);
}

/* ---------- Catálogos del dominio (alineados con el HTML) ---------- */

const INSTRUMENTS = ["ES35", "NQ", "SPX", "EURUSD", "BTC", "DAX", "GOLD", "CL"] as const;
const SETUPS = ["Ruptura", "Pullback", "Reversión", "Tendencia", "Rango"] as const;
const SESSIONS = ["London", "NY", "Asia"] as const;

const MONTH_DAYS = 31; // julio 2026

/* ---------- Cache ---------- */

let cache: ReturnType<typeof build> | null = null;

/* ---------- Builder principal ---------- */

function build() {
  return {
    /** Métricas "live" que el HTML mostraba flotando sobre el hero. */
    kpis: buildKpis(),
    /** Curva de rendimiento con 150 puntos de balance + área + línea + endpoint. */
    perf: buildPerf(),
    /** Calendario de julio 2026: 35 celdas (5 semanas × 7) con P&L diario. */
    cal: buildCal(),
    /** Las 7 KPIs que el HTML mostraba en la sección Resumen (dashboard). */
    kpiRow: buildKpiRow(),
    /** 10 filas de la tabla "Operaciones" (sample visible). */
    rows: buildRows(),
    /** 5 setups del Playbook. */
    playbook: buildPlaybook(),
    /** Una operación de ejemplo para la vista de detalle. */
    det: buildTradeDetail(),
  };
}

/* ---------- Builders por sección ---------- */

function buildKpis() {
  return {
    pnl: {
      v: fmtMoney(METRICS.netPnl, "es", { sign: true }),
      color: "var(--pos)",
      delta: `${fmtPct(METRICS.roiPct, "es", 1)} ROI`,
      deltaColor: "var(--pos)",
    },
  };
}

function buildPerf() {
  // Pull the real equity curve from METRICS so the marketing curve's
  // endpoint matches the demo's `finalBalance` and the shape reflects
  // the actual trade sequence (not a synthetic noise line).
  const curve = METRICS.equityCurve;
  const data: { x: number; y: number }[] = curve.map((p, i) => ({
    x: curve.length > 1 ? i / (curve.length - 1) : 0,
    y: p.balance,
  }));
  // Renderizamos a viewBox 640x220 con margen lateral de 46px y arriba/abajo 24px.
  const xMin = 46;
  const xMax = 632;
  const yMin = 24;
  const yMax = 196;
  const ys = data.map((d) => d.y);
  const lo = Math.min(...ys);
  const hi = Math.max(...ys);
  const proj = (d: { x: number; y: number }) => ({
    x: xMin + (xMax - xMin) * d.x,
    y: yMin + (yMax - yMin) * (1 - (d.y - lo) / (hi - lo || 1)),
  });
  const projected = data.map(proj);
  const line = projected
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join(" ");
  const fill = `${line} L${projected[projected.length - 1]!.x.toFixed(1)},${yMax} L${projected[0]!.x.toFixed(1)},${yMax} Z`;
  // Línea "balance" (dashed, más suave) ligeramente por debajo.
  const dash = projected
    .map((p, i) => {
      const dy = p.y + 6 + Math.sin(p.x / 40) * 4;
      return `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${dy.toFixed(1)}`;
    })
    .join(" ");
  // Drawdown: área entre la línea y un techo imaginario por encima.
  const ceiling = projected.map((p) => ({ x: p.x, y: Math.min(p.y - 14, yMin + 4) }));
  const dd = `${line} ${ceiling
    .slice()
    .reverse()
    .map((p) => `L${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join(" ")} Z`;
  // Grid lines horizontales (5 niveles) con etiqueta.
  const grid = [0.0, 0.25, 0.5, 0.75, 1.0].map((p) => {
    const y = yMin + (yMax - yMin) * p;
    const val = hi - (hi - lo) * p;
    return { y, label: fmtNum(val, "es", 0) };
  });
  const last = projected[projected.length - 1]!;
  return { grid, line, fill, dash, dd, endX: last.x, endY: last.y };
}

function buildCal() {
  // Pull actual July 2026 daily P&L from TRADES — keeps the marketing
  // calendar's "Total mes" perfectly aligned with what the demo's
  // monthlyBreakdown would show for July. Days without trades (early
  // weekdays with no fills, or the not-yet-reached second half of the
  // month) render as transparent cells with just the day number.
  const dailyPnl = dailyPnlForMonth(TRADES, 2026, 6); // July = month index 6
  const cells = Array.from({ length: 35 }, (_, i) => {
    const dayNum = i - 4; // Empezamos en martes (offset 1) para alinear con julio 2026
    if (dayNum < 1 || dayNum > MONTH_DAYS) {
      return { day: "", val: "", style: "background:transparent" };
    }
    const pnl = dailyPnl.get(String(dayNum)) ?? 0;
    const isPos = pnl >= 0;
    // Intensity scaled to a $200 typical 1R win at the demo's risk
    // profile (0.5–1.5 % of $10–15 k balance ≈ $75–225 per R).
    const intensity = Math.min(1, Math.abs(pnl) / 200);
    // El tinte se expresa como FRACCIÓN de `--cal-tint-max`, no como un
    // número suelto. Antes iba de 0,18 a 0,60 por su cuenta, y al 0,60 la
    // celda quedaba tan teñida que su texto —8 px, en tinta oscura— caía a
    // 2,72:1 sobre ella: muy por debajo del mínimo. El tope existe justo
    // para esto y estaba escrito en la paleta (0,22 en claro, 0,30 en
    // oscuro) sin que nadie lo usara; atarse a él mantiene la escala de
    // intensidad y deja el peor caso en 7:1.
    const factor = (0.3 + intensity * 0.7).toFixed(2);
    // Un día del mes sin operaciones es un dato, no un agujero. Antes se
    // pintaba con opacidad 0: dieciocho de los treinta días de julio
    // desaparecían y las dos últimas filas del calendario quedaban en
    // blanco, de modo que el desfase del primer día no significaba nada.
    // Ahora la celda existe siempre, en gris neutro, y sólo el color
    // distingue ganancia de pérdida.
    const bg =
      pnl === 0
        ? "rgb(var(--divider) / 0.07)"
        : isPos
          ? `rgb(var(--accent-base) / calc(var(--cal-tint-max) * ${factor}))`
          : `rgb(var(--pnl-neg) / calc(var(--cal-tint-max) * ${factor}))`;
    // 2 px, el canto del sistema: los 5 px de antes eran el único radio de
    // ese tamaño que quedaba en la página.
    const style = `background:${bg};border-radius:2px;aspect-ratio:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;padding:2px`;
    return {
      day: String(dayNum),
      val: pnl === 0 ? "·" : `${pnl >= 0 ? "+" : "−"}${fmtNum(Math.abs(pnl), "es", 0)}`,
      style,
    };
  });
  // Total del mes: suma real del P&L de julio extraída de TRADES.
  let total = 0;
  for (const v of dailyPnl.values()) total += v;
  return {
    label: "julio 2026",
    chip: "Mes en curso",
    pnl: `${total >= 0 ? "+" : "−"}${fmtNum(Math.abs(total))} $`,
    pnlColor: total >= 0 ? "var(--pos)" : "var(--neg)",
    cells,
  };
}

function buildKpiRow() {
  // Sourced from METRICS so the marketing KPI strip stays in lock-step
  // with the demo's dashboard. The descriptive `d` field is built from
  // the same numbers (ROI %, W·L count, etc.) instead of being a
  // hand-typed string that drifts as the underlying data evolves.
  const wins = METRICS.wins;
  const losses = METRICS.losses;
  return [
    {
      l: "P&L total",
      v: fmtMoney(METRICS.netPnl, "es", { sign: true }),
      c: "var(--pos)",
      d: `ROI ${fmtPct(METRICS.roiPct, "es", 1)}`,
    },
    {
      l: "Win rate",
      v: fmtPct(METRICS.winRate, "es", 0),
      c: "var(--ink)",
      d: `${wins} W · ${losses} L`,
    },
    {
      l: "Expectancy",
      v: fmtMoney(METRICS.expectancy, "es", { sign: true }),
      c: "var(--pos)",
      d: "por operación",
    },
    {
      l: "Profit factor",
      v: fmtNum(METRICS.profitFactor, "es", 2),
      c: "var(--ink)",
      d: "Gross W / Gross L",
    },
    {
      l: "Sharpe",
      v: fmtNum(METRICS.sharpe, "es", 2),
      c: "var(--ink)",
      d: "anualizado",
    },
    {
      l: "Max DD",
      v: `−${fmtPct(METRICS.maxDrawdownPct, "es", 1)}`,
      c: "var(--neg)",
      d: "peor racha",
    },
    {
      l: "Operaciones",
      v: String(METRICS.closedCount),
      c: "var(--ink)",
      d: "cerradas",
    },
  ];
}

function buildRows() {
  // 10 filas de operaciones recientes, alineadas con el HTML.
  return Array.from({ length: 10 }, (_, i) => {
    const dir = rng() > 0.5 ? "Long" : "Short";
    const inst = pick(INSTRUMENTS);
    const setup = pick(SETUPS);
    const ses = pick(SESSIONS);
    const win = rng() > 0.5;
    const pnl = win ? between(80, 480) : -between(40, 260);
    const r = pnl / 100;
    const pnlStr = `${pnl >= 0 ? "+" : "−"}${fmtNum(Math.abs(pnl))} $`;
    const pct = fmtPct(pnl / 10000, "es", 2);
    const cum = 11000 + i * 200 + pnl;
    const cumStr = `${cum >= 0 ? "+" : "−"}${fmtNum(Math.abs(cum))} $`;
    return {
      dir,
      dc: dir === "Long" ? "var(--pos)" : "var(--neg)",
      inst,
      dot: inst === "BTC" || inst === "NQ" ? "var(--accent-base)" : "var(--ink-2)",
      setup,
      ses,
      es: "95,0",
      dur: `${Math.floor(between(2, 240))} min`,
      date: `2026-07-${String(MONTH_DAYS - i).padStart(2, "0")}`,
      pnl,
      pnlStr,
      pc: pnl >= 0 ? "var(--pos)" : "var(--neg)",
      r,
      rStr: `${r >= 0 ? "+" : ""}${r.toFixed(2)}R`,
      rc: pnl >= 0 ? "var(--pos)" : "var(--neg)",
      cum: cum,
      cumStr,
      cc: cum >= 10000 ? "var(--pos)" : "var(--neg)",
      open: () => {},
      det: { id: `trade-${i}` },
    };
  });
}

function buildPlaybook() {
  const names = ["Ruptura", "Pullback", "Reversión", "Tendencia", "Rango"];
  const colors = ["var(--accent-base)", "var(--pos)", "var(--neg)", "var(--ink-2)", "var(--warn)"];
  return names.map((name, i) => {
    const n = 12 + i * 3;
    const win = 0.42 + (i * 0.05);
    const exp = win > 0.5 ? 38.4 : -12.6;
    const expC = exp >= 0 ? "var(--pos)" : "var(--neg)";
    const wrStr = `${Math.round(win * 100)} %`;
    const pnl = exp * n;
    const pnlStr = `${pnl >= 0 ? "+" : "−"}${fmtNum(Math.abs(pnl))} $`;
    const pnlC = pnl >= 0 ? "var(--pos)" : "var(--neg)";
    const ses = SESSIONS[i % SESSIONS.length] ?? "London";
    const sesPnl = `${pnl >= 0 ? "+" : "−"}${fmtNum(Math.abs(pnl) / 2)} $`;
    // sparkline SVG path determinista
    const sparkPoints = Array.from({ length: 12 }, (_, k) => {
      const x = (k / 11) * 100;
      const y = 30 - rng() * 25 + (k / 11) * 5;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(" ");
    const spark = `M${sparkPoints.split(" ").join(" L")}`;
    const verdict = win > 0.5 ? "Edge confirmado" : "A revisar";
    const vc = win > 0.5 ? "var(--pos)" : "var(--warn)";
    return {
      name,
      color: colors[i] ?? "var(--accent-base)",
      spark,
      n,
      exp,
      expStr: `${exp >= 0 ? "+" : "−"}${fmtNum(Math.abs(exp))} $`,
      expC,
      win: wrStr,
      pnl: pnlStr,
      pnlC,
      verdict,
      vc,
      ses,
      sesPnl,
      cum: `+${fmtNum(pnl * 1.5)} $`,
      rbar: Math.round(win * 100),
      rtxt: `${Math.round(win * 100)} % a favor`,
      g: 7 + i,
      l: 5 - i % 2,
      gw: `${win.toFixed(2)} : 1`,
    };
  });
}

function buildTradeDetail() {
  return {
    inst: "NQ",
    dir: "Long",
    dc: "var(--pos)",
    date: "2026-07-22",
    idx: "trade-42",
    pnl: `+${fmtNum(312.4)} $`,
    pc: "var(--pos)",
    r: "+1.56R",
    rc: "var(--pos)",
    risk: `${fmtNum(200)} $`,
    riskPct: "2.00 %",
    rr: "1,60 : 1",
    entry: "18.450,25",
    exit: "18.462,00",
    qty: "4 contratos",
    gross: `+${fmtNum(350)} $`,
    gc: "var(--pos)",
    fees: `−${fmtNum(37.6)} $`,
    setup: "Ruptura · NY",
    maeR: "−0,40R",
    mfeR: "+1,80R",
    maeWidth: 40,
    mfeWidth: 95,
    stop: "18.420,00",
    obj: "18.500,00",
    maeAbs: `−${fmtNum(80)} $`,
    mfeAbs: `+${fmtNum(360)} $`,
    since: "desde la apertura NY",
  };
}

/* ---------- API pública ---------- */

/**
 * Devuelve el bundle de fixtures de marketing. Idempotente: la primera
 * llamada genera, las siguientes devuelven la misma referencia.
 */
export function buildMarketingFixture() {
  if (!cache) cache = build();
  return cache;
}

/** Acceso tipado por sección (azúcar sobre `buildMarketingFixture`). */
export function getKpis() {
  return buildMarketingFixture().kpis;
}
export function getPerf() {
  return buildMarketingFixture().perf;
}
export function getCal() {
  return buildMarketingFixture().cal;
}
export function getKpiRow() {
  return buildMarketingFixture().kpiRow;
}
export function getRows() {
  return buildMarketingFixture().rows;
}
export function getPlaybook() {
  return buildMarketingFixture().playbook;
}
export function getTradeDetail() {
  return buildMarketingFixture().det;
}

/* ---------- Distribución de R-múltiplo ---------- */

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
 * Distribución de R-múltiplo de las operaciones de muestra, en cubos de
 * 0,5R con bordes limpios.
 *
 * ── POR QUÉ EXISTE ────────────────────────────────────────────────────
 * Para que la home no vuelva a dibujar un histograma a mano. El que
 * había llevaba las nueve alturas escritas una a una, y de ahí salieron
 * tres contradicciones dentro de la MISMA tarjeta:
 *
 *   · pintaba un 63 % de ganadoras bajo un pie que declaraba «50 %»
 *     (el pie tenía razón: el motor da 50,5 %),
 *   · implicaba una esperanza de +1,16R junto a una ficha que decía
 *     +0,32R (y el motor da +0,23R),
 *   · y coloreaba por el ÍNDICE de la barra en la lista, no por el signo
 *     de la R, así que las pérdidas salían verdes y las ganancias rojas.
 *
 * Saliendo todo de `TRADES`, el gráfico, su pie y los ratios de al lado
 * no pueden discrepar: son el mismo cálculo. Si un día cambian las
 * operaciones de muestra, cambian los tres a la vez.
 *
 * ── POR QUÉ NO `rHistogram` ───────────────────────────────────────────
 * El de `data.ts` reparte un rango FIJO (−1,5 a 3,5) entre 9 cubos, así
 * que sus bordes caen en 0,2 / 0,7 / 1,3…: números que no se pueden
 * rotular en un eje sin que parezca ruido. Además deja cubos vacíos por
 * arriba, porque el rango no se ajusta a los datos. Aquí los bordes son
 * múltiplos de 0,5 y el rango se recorta a lo que hay. Aquel se queda
 * como está porque lo consume la analítica de la demo.
 *
 * ── EL HUECO DEL CENTRO ES REAL ───────────────────────────────────────
 * No habrá barras entre −0,5R y +0,5R: la operativa de muestra o se come
 * el stop entero o deja correr. Ese vacío es información sobre el
 * sistema, no un fallo de dibujo — el consumidor debe representarlo,
 * no esconderlo.
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
