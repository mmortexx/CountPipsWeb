/**
 * Marketing fixtures — los datos que alimentan las dos piezas de la home
 * que enseñan números: la tira de KPIs de `OverviewApp` y el calendario
 * de `FeaturesBento`.
 *
 * ── Qué se fue de aquí, y por qué ─────────────────────────────────────
 * Este módulo nació como el puerto del HTML de referencia y exportaba
 * nueve funciones: KPIs, curva, calendario, tira de siete métricas, diez
 * filas de operaciones, cinco fichas de playbook y una operación de
 * detalle. De esas nueve, SEIS no las leía ningún componente — eran el
 * sedimento de secciones que el rediseño ya había sustituido por
 * capturas reales de la aplicación.
 *
 * Se borran, y no es limpieza cosmética: ahí vivían los literales
 * «Ruptura», «Reversión», «Tendencia», «P&L total», «Operaciones»,
 * «peor racha» y «Edge confirmado», en español fijo. El sitio tiene 76
 * páginas en inglés; cualquiera que hubiera vuelto a enchufar una de
 * esas funciones habría servido español en `/en` sin enterarse, y no hay
 * prueba que cace el texto de un módulo que nadie llama.
 *
 * ── Lo que queda, y sus dos garantías ─────────────────────────────────
 * · Los números salen de `METRICS`/`TRADES` (`data.ts`), no escritos a
 *   mano: el KPI de la home y el panel de `/demo` son el mismo cálculo,
 *   así que no pueden discrepar.
 * · El texto que acompaña a los números viaja en los dos idiomas. Nada
 *   de aquí decide cuál se pinta: eso lo hace el componente, que sí sabe
 *   en qué idioma está la página.
 */

import { fmtMoney, fmtNum, fmtPct } from "./format";
import { METRICS, TRADES, dailyPnlForMonth } from "./data";

/** Un rótulo que la fixture no puede resolver sola: no conoce el idioma. */
export interface Bilingue {
  es: string;
  en: string;
}

const MONTH_DAYS = 31; // julio 2026

/* ---------- Cache ---------- */

let cache: ReturnType<typeof build> | null = null;

/* ---------- Builder principal ---------- */

function build() {
  return {
    /** Métricas "live" que el HTML mostraba flotando sobre el hero. */
    kpis: buildKpis(),
    /** Calendario de julio 2026: 35 celdas (5 semanas × 7) con P&L diario. */
    cal: buildCal(),
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
    /* Los dos rótulos del encabezado viajaban en español fijo y se
       pintaban tal cual en `/en/features`: «julio 2026 · Mes en curso»
       bajo un titular inglés. La fixture no puede elegir —se evalúa una
       sola vez, y el idioma lo decide la ruta—, así que entrega los dos
       y elige quien pinta. */
    label: { es: "julio 2026", en: "July 2026" } satisfies Bilingue,
    chip: { es: "Mes en curso", en: "Current month" } satisfies Bilingue,
    pnl: `${total >= 0 ? "+" : "−"}${fmtNum(Math.abs(total))} $`,
    pnlColor: total >= 0 ? "var(--pos)" : "var(--neg)",
    cells,
  };
}

/* ---------- API pública ---------- */

/**
 * El bundle de fixtures. Idempotente: la primera llamada genera, las
 * siguientes devuelven la misma referencia.
 *
 * Interno a propósito. Cuando era público, cada `getX()` de abajo tenía
 * además una puerta trasera por la que se colaba el bundle entero, y con
 * él las secciones que ya nadie pintaba.
 */
function buildMarketingFixture() {
  if (!cache) cache = build();
  return cache;
}

/** Acceso tipado por sección (azúcar sobre el bundle). */
export function getKpis() {
  return buildMarketingFixture().kpis;
}
export function getCal() {
  return buildMarketingFixture().cal;
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
