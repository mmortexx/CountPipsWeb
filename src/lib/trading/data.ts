/*
 * Generador determinista de datos de demo y calculadora de métricas, réplica
 * de CountPips.Data/DemoData/DemoDataGenerator.cs: 9 instrumentos de 4 clases
 * de activo, 5 setups, 3 sesiones, ~200 operaciones en 180 días, ~50 % de
 * acierto, payoff y PF ~1,5, expectativa ~0,25 R, caída máxima ~8 %. Cuenta
 * «Cuenta demo» de 10.000 $. Toda métrica se calcula desde las operaciones,
 * así tabla, curva y KPI coinciden.
 *
 * Determinismo: `mulberry32` con semilla fija (20260716), sin Math.random().
 *
 * También entre zonas horarias: todo lo que toca el calendario va en UTC, al
 * escribir y al leer. Con la hora local, el servidor (UTC) y el navegador del
 * visitante generaban operaciones distintas y la portada publicada fallaba al
 * hidratar (error #418 de React), sin reproducirse en local. La hora de una
 * operación es un instante del reloj mundial (la apertura de Londres), no «las
 * nueve donde estés». Lo fija `tests/husos.test.ts`, que recalcula el conjunto
 * bajo tres husos y exige el mismo resultado.
 */

import { SETUP_NAMES, type SetupName } from "./setups.ts";
import { mulberry32 } from "./azar.ts";
import { OPERACIONES_MUESTRA, SALDO_INICIAL_MUESTRA } from "./muestra.ts";

export interface Instrument {
  symbol: string;
  basePrice: number;
  tickSize: number;
  decimals: number;
  assetClass: "crypto" | "forex" | "stock" | "futures" | "commodity";
}

export const INSTRUMENTS: Instrument[] = [
  { symbol: "BTC/USDT", basePrice: 65000, tickSize: 0.1, decimals: 1, assetClass: "crypto" },
  { symbol: "ETH/USDT", basePrice: 3200, tickSize: 0.01, decimals: 2, assetClass: "crypto" },
  { symbol: "EURUSD", basePrice: 1.08, tickSize: 0.0001, decimals: 4, assetClass: "forex" },
  { symbol: "XAU/USD", basePrice: 2350, tickSize: 0.01, decimals: 2, assetClass: "commodity" },
  { symbol: "AAPL", basePrice: 190, tickSize: 0.01, decimals: 2, assetClass: "stock" },
  { symbol: "ES", basePrice: 5400, tickSize: 0.25, decimals: 2, assetClass: "futures" },
  { symbol: "NQ", basePrice: 18500, tickSize: 0.25, decimals: 2, assetClass: "futures" },
  { symbol: "CL", basePrice: 78.5, tickSize: 0.01, decimals: 2, assetClass: "commodity" },
  { symbol: "GER40", basePrice: 18200, tickSize: 0.5, decimals: 1, assetClass: "futures" },
];

/**
 * Multiplicadores oficiales de contrato y tamaño de lote institucional.
 * CME/NYMEX Futures (ES $50, NQ $20, MES $5, MNQ $2, RTY $50, GC $100, CL $1000, GER40 25€),
 * Forex estándar (100.000 unidades) y spot/crypto (1:1).
 */
export const INSTRUMENT_MULTIPLIERS: Record<string, number> = {
  "BTC/USDT": 1,
  "ETH/USDT": 1,
  "EURUSD": 100_000,
  "XAU/USD": 100,
  "AAPL": 1,
  "ES": 50,
  "NQ": 20,
  "MES": 5,
  "MNQ": 2,
  "RTY": 50,
  "GC": 100,
  "CL": 1000,
  "GER40": 25,
};

/** Obtiene el multiplicador financiero para un símbolo o clase de activo dada. */
export function getInstrumentMultiplier(symbol: string, assetClass?: string): number {
  if (INSTRUMENT_MULTIPLIERS[symbol] !== undefined) {
    return INSTRUMENT_MULTIPLIERS[symbol];
  }
  if (assetClass === "forex") return 100_000;
  if (assetClass === "futures" || assetClass === "commodity") return 50;
  return 1;
}

export { SETUP_NAMES, nombreSetup, type SetupName } from "./setups.ts";

export const SESSIONS = ["London", "NY", "Asia"] as const;
export type Session = (typeof SESSIONS)[number];

/** La app escribe la plaza con su nombre completo y traducido, no con la
 *  abreviatura interna del dato. */
export const NOMBRE_SESION: Record<Session, { es: string; en: string }> = {
  London: { es: "Londres", en: "London" },
  NY: { es: "Nueva York", en: "New York" },
  Asia: { es: "Asia", en: "Asia" },
};

export type Direction = "long" | "short";
export type Compliance = "yes" | "partial" | "no";

export interface Trade {
  id: number;
  instrument: string;
  setup: SetupName;
  direction: Direction;
  session: Session;
  entry: number;
  exit: number;
  qty: number;
  grossPnl: number;
  fees: number;
  netPnl: number;
  rMultiple: number;
  riskUsd: number;
  plannedRr: number;
  mae: number;
  mfe: number;
  initialStop: number;
  target: number;
  compliance: Compliance;
  openedAt: Date;
  closedAt: Date;
  durationMin: number;
  dayScore: number;
  entryNote: string;
  closeNote: string;
}

const ES_NOTES = [
  "Entrada limpia en rotura del nivel, volumen confirmando.",
  "Pullback a la media de 50, esperé el cierre.",
  "Reversión en zona de oferta, P&L ajustado.",
  "Seguí la tendencia, añadí en el retroceso.",
  "Rango lateral, falsa rotura — salí rápido.",
  "Buena gestión, moví el stop a punto muerto.",
  "Entré tarde, el movimiento ya estaba hecho.",
  "Plan cumplido, objetivo alcanzado.",
  "Estructura rota en M15, esperé el retest.",
  "Confluencia de nivel + Fibonacci + VWAP.",
  "Vela envolvente alcista en soporte diagonal.",
  "Falsa ruptura en H1, entré en sentido contrario.",
  "Esperé el primer cierre fuera del rango antes de entrar.",
  "Tendencia clara en H4, entrada en M5 con el flujo.",
  "Doble suelo visible, volumen decreciente en la corrección.",
  "Imbalance sin rellenar, entré al retest.",
];
const ES_CLOSE = [
  "Salí en objetivo por scalping.",
  "Stop cazado antes de reaccionar.",
  "Cerré parcial en +1R, resto al objetivo.",
  "Reversión no funcionó, corté pérdidas.",
  "Dejé correr hasta resistencia.",
  "Salí por trailing stop al cerrar sesión NY.",
  "Cierre manual antes de noticias macro.",
  "Objetivo tocado, salí en market.",
  "Stop mental en rotura de estructura menor.",
  "Cerré en breakeven tras ver falta de seguimiento.",
];

const INITIAL_BALANCE = SALDO_INICIAL_MUESTRA;

function buildTrades(): Trade[] {
  const rnd = mulberry32(20260716);
  const trades: Trade[] = [];
  const now = new Date("2026-07-16T18:00:00Z");
  const dayMs = 86400000;
  let id = 1;

  for (let i = 0; i < OPERACIONES_MUESTRA; i++) {
    const inst = INSTRUMENTS[Math.floor(rnd() * INSTRUMENTS.length)];
    const setup = SETUP_NAMES[Math.floor(rnd() * SETUP_NAMES.length)];
    const direction: Direction = rnd() > 0.42 ? "long" : "short";
    const session = SESSIONS[Math.floor(rnd() * SESSIONS.length)];

    const balance = INITIAL_BALANCE + trades.reduce((s, t) => s + t.netPnl, 0);
    // Riesgo del 0,5 al 1,5 % del saldo actual por operación.
    const riskPct = 0.5 + rnd() * 1.0;
    const riskUsd = +(balance * (riskPct / 100)).toFixed(2);

    // 50 % de acierto con payoff ~1,5: PF ~1,5 y expectativa ~0,25 R.
    const isWin = rnd() < 0.50;
    const r = isWin ? +(0.5 + rnd() * 2.0).toFixed(2) : +(-(0.8 + rnd() * 0.4)).toFixed(2);
    const plannedRr = +(1.5 + rnd() * 2.0).toFixed(2);

    const netPnl = +(riskUsd * r).toFixed(2);
    // Comisiones del 3 al 7 % del P&L absoluto; siempre un coste positivo.
    const fees = +(Math.abs(netPnl) * (0.03 + rnd() * 0.04)).toFixed(2);
    // bruto = neto + comisiones.
    const grossPnl = +(netPnl + fees).toFixed(2);

    const entry = +inst.basePrice.toFixed(inst.decimals);
    const stopDist = (0.004 + rnd() * 0.012) * entry;
    const exitRaw =
      direction === "long" ? entry + stopDist * r : entry - stopDist * r;
    const exit = +exitRaw.toFixed(inst.decimals);
    const initialStop =
      direction === "long"
        ? +(entry - stopDist).toFixed(inst.decimals)
        : +(entry + stopDist).toFixed(inst.decimals);
    const target =
      direction === "long"
        ? +(entry + stopDist * plannedRr).toFixed(inst.decimals)
        : +(entry - stopDist * plannedRr).toFixed(inst.decimals);
    const qty = +Math.max(
      0.0001,
      riskUsd / stopDist / (inst.assetClass === "forex" ? 100000 : 1)
    ).toFixed(inst.assetClass === "forex" ? 2 : 3);

    const mfe = isWin ? +(r + rnd() * 0.8).toFixed(2) : +(rnd() * 1.2).toFixed(2);
    const mae = isWin ? +(-(rnd() * 0.5)).toFixed(2) : +(-(0.9 + rnd() * 0.6)).toFixed(2);

    // Mismo sorteo, umbral según el resultado: las perdedoras rompen el plan
    // más a menudo, como en un diario real. Media global ≈ 70 % en plan.
    const cr = rnd();
    const enPlan = isWin ? 0.8 : 0.6;
    const compliance: Compliance = cr < enPlan ? "yes" : cr < enPlan + 0.15 ? "partial" : "no";

    // Cierre dentro de la ventana UTC de la sesión: Londres 08:00–11:00, NY
    // 14:00–17:00, Asia 23:00–03:00. La hora de Asia va módulo 24 para que
    // `setUTCHours(24+)` no adelante el día.
    const hourBase =
      session === "London"
        ? 8 + Math.floor(rnd() * 3)
        : session === "NY"
        ? 14 + Math.floor(rnd() * 3)
        : (23 + Math.floor(rnd() * 4)) % 24;
    const closedAt = new Date(now.getTime() - rnd() * 180 * dayMs);
    // UTC y no local: la ventana ya está en UTC. Ver la cabecera del fichero.
    closedAt.setUTCHours(hourBase, Math.floor(rnd() * 60), 0, 0);
    // Con el mercado cerrado solo cotiza la cripto: el sábado pasa al
    // viernes y el domingo al lunes, sin gastar sorteo.
    if (inst.assetClass !== "crypto") {
      const dia = closedAt.getUTCDay();
      if (dia === 6) closedAt.setUTCDate(closedAt.getUTCDate() - 1);
      else if (dia === 0) closedAt.setUTCDate(closedAt.getUTCDate() + 1);
    }
    const durationMin =
      session === "Asia"
        ? 60 + Math.floor(rnd() * 240)
        : 5 + Math.floor(rnd() * 180);
    const openedAt = new Date(closedAt.getTime() - durationMin * 60000);

    // Nota del día 1–5: el mismo sorteo, desplazado un punto hacia el resultado.
    const sorteo = 1 + Math.floor(rnd() * 5);
    const dayScore = isWin ? Math.min(5, sorteo + (sorteo < 4 ? 1 : 0)) : Math.max(1, sorteo - (sorteo > 2 ? 1 : 0));

    trades.push({
      id: id++,
      instrument: inst.symbol,
      setup,
      direction,
      session,
      entry,
      exit,
      qty,
      grossPnl,
      fees,
      netPnl,
      rMultiple: r,
      riskUsd,
      plannedRr,
      mae,
      mfe,
      initialStop,
      target,
      compliance,
      openedAt,
      closedAt,
      durationMin,
      dayScore,
      entryNote: ES_NOTES[Math.floor(rnd() * ES_NOTES.length)],
      closeNote: ES_CLOSE[Math.floor(rnd() * ES_CLOSE.length)],
    });
  }

  return trades.sort((a, b) => b.closedAt.getTime() - a.closedAt.getTime());
}

export const TRADES: Trade[] = buildTrades();

export interface Metrics {
  closedCount: number;
  netPnl: number;
  winRate: number;
  wins: number;
  losses: number;
  expectancy: number;
  expectancyR: number;
  profitFactor: number;
  payoff: number;
  avgWin: number;
  avgLoss: number;
  largestWin: number;
  largestLoss: number;
  maxDrawdown: number;
  maxDrawdownPct: number;
  currentDrawdown: number;
  sharpe: number;
  sortino: number;
  calmar: number;
  omega: number;
  recoveryFactor: number;
  maxWinStreak: number;
  maxLossStreak: number;
  currentStreak: { kind: "win" | "loss" | "none"; count: number };
  compliancePct: number;
  costOfIndiscipline: number;
  expectancyInPlan: number;
  expectancyBrokePlan: number;
  equityCurve: { date: Date; balance: number; perf: number }[];
  drawdownCeiling: number[];
  finalBalance: number;
  roiPct: number;
  sqn: number;
  ulcerIndex: number;
  drawdownSkewness: number;
  halfKelly: number;
  gainToPainRatio: number;
}

/** Semáforo de disciplina con los cortes de la app (DisciplineSignal.LevelOf):
 *  alta desde el 80 %, media desde el 50 %. Una sola fuente para Resumen,
 *  Diario y la barra de estado. */
export function nivelDisciplina(pct: number): "alta" | "media" | "baja" {
  return pct >= 0.8 ? "alta" : pct >= 0.5 ? "media" : "baja";
}

export function computeMetrics(trades: Trade[]): Metrics {
  const sorted = [...trades].sort(
    (a, b) => a.closedAt.getTime() - b.closedAt.getTime()
  );
  const n = sorted.length;
  const wins = sorted.filter((t) => t.netPnl > 0);
  const losses = sorted.filter((t) => t.netPnl < 0);
  const netPnl = sorted.reduce((s, t) => s + t.netPnl, 0);
  const grossWin = wins.reduce((s, t) => s + t.netPnl, 0);
  const grossLoss = Math.abs(losses.reduce((s, t) => s + t.netPnl, 0));
  const avgWin = wins.length ? grossWin / wins.length : 0;
  const avgLoss = losses.length ? grossLoss / losses.length : 0;

  let bal = INITIAL_BALANCE;
  let peak = INITIAL_BALANCE;
  let maxDd = 0;
  let maxDdPct = 0;
  const equityCurve: { date: Date; balance: number; perf: number }[] = [];
  // Máximo acumulado junto a equityCurve, para no recorrerla entera en cada punto.
  const drawdownCeiling: number[] = [];
  for (const t of sorted) {
    bal += t.netPnl;
    peak = Math.max(peak, bal);
    const dd = peak - bal;
    if (dd > maxDd) {
      maxDd = dd;
      maxDdPct = peak > 0 ? dd / peak : 0;
    }
    equityCurve.push({ date: t.closedAt, balance: bal, perf: bal - INITIAL_BALANCE });
    drawdownCeiling.push(peak);
  }
  const currentDd = peak - bal;

  const rVals = sorted
    .map((t) => t.rMultiple)
    .filter((r) => Number.isFinite(r));
  const expectancyR = rVals.length
    ? rVals.reduce((s, r) => s + r, 0) / rVals.length
    : 0;

  const rets = sorted.map((t) => t.netPnl);
  const mean = rets.reduce((s, r) => s + r, 0) / (rets.length || 1);
  const sd = Math.sqrt(
    rets.reduce((s, r) => s + (r - mean) ** 2, 0) / (rets.length || 1)
  );
  const downside = Math.sqrt(
    rets
      .filter((r) => r < 0)
      .reduce((s, r) => s + r ** 2, 0) /
      (rets.length || 1)
  );

  // Sharpe y Sortino por operación, anualizados por sqrt(operaciones por año),
  // que sale del tramo real de la muestra (n operaciones en `spanDays`, año de 365,25 días).
  const spanMs =
    n > 1
      ? sorted[n - 1].closedAt.getTime() - sorted[0].closedAt.getTime()
      : 1;
  const spanDays = Math.max(1, spanMs / 86_400_000);
  const tradesPerYear = (n * 365.25) / spanDays;
  const annFactor = Math.sqrt(tradesPerYear);
  const sharpe = sd ? (mean / sd) * annFactor : 0;
  const sortino = downside ? (mean / downside) * annFactor : 0;

  // Calmar = CAGR / |DD máx. %|, con el CAGR sobre el tramo real en años. Es 0
  // si no hay caída o el saldo no se movió.
  const years = spanDays / 365.25;
  const cagr =
    years > 0 && bal > 0 && INITIAL_BALANCE > 0
      ? Math.pow(bal / INITIAL_BALANCE, 1 / years) - 1
      : 0;
  const calmar = maxDdPct > 0 ? cagr / maxDdPct : 0;
  const recoveryFactor = maxDd ? netPnl / maxDd : 0;

  let curWin = 0, curLoss = 0, maxWin = 0, maxLoss = 0;
  for (const t of sorted) {
    if (t.netPnl > 0) { curWin++; curLoss = 0; maxWin = Math.max(maxWin, curWin); }
    else if (t.netPnl < 0) { curLoss++; curWin = 0; maxLoss = Math.max(maxLoss, curLoss); }
  }
  let streak: Metrics["currentStreak"] = { kind: "none", count: 0 };
  for (let i = sorted.length - 1; i >= 0; i--) {
    const t = sorted[i];
    if (t.netPnl > 0) {
      if (streak.kind === "loss") break;
      streak = { kind: "win", count: streak.count + 1 };
    } else if (t.netPnl < 0) {
      if (streak.kind === "win") break;
      streak = { kind: "loss", count: streak.count + 1 };
    }
  }

  const complied = sorted.filter((t) => t.compliance === "yes").length;
  const compliancePct = n ? complied / n : 0;
  const inPlan = sorted.filter((t) => t.compliance === "yes");
  // Como DisciplineCalculator de la app: «a medias» baja el cumplimiento pero
  // no entra en el coste, que es el neto de lo marcado «me salté el plan»
  // (positivo cuando esas operaciones perdieron).
  const broke = sorted.filter((t) => t.compliance === "no");
  const expectancyInPlan = inPlan.length
    ? inPlan.reduce((s, t) => s + t.netPnl, 0) / inPlan.length
    : 0;
  const pnlBroke = broke.reduce((s, t) => s + t.netPnl, 0);
  const expectancyBrokePlan = broke.length ? pnlBroke / broke.length : 0;
  const costOfIndiscipline = 0 - pnlBroke;

  const payoff = avgLoss ? avgWin / avgLoss : 0;
  const winRate = n ? wins.length / n : 0;
  const sqn = computeSqn(sorted);
  const ulcerIndex = computeUlcerIndex(sorted, INITIAL_BALANCE);
  const drawdownSkewness = computeDrawdownSkewness(sorted, INITIAL_BALANCE);
  const halfKelly = computeHalfKelly(winRate, payoff);
  const gainToPainRatio = computeGainToPain(sorted);

  return {
    closedCount: n,
    netPnl,
    winRate,
    wins: wins.length,
    losses: losses.length,
    expectancy: n ? netPnl / n : 0,
    expectancyR,
    profitFactor: grossLoss ? grossWin / grossLoss : grossWin,
    payoff,
    avgWin,
    avgLoss,
    largestWin: wins.length ? Math.max(...wins.map((t) => t.netPnl)) : 0,
    largestLoss: losses.length ? Math.min(...losses.map((t) => t.netPnl)) : 0,
    maxDrawdown: maxDd,
    maxDrawdownPct: maxDdPct,
    currentDrawdown: currentDd,
    sharpe,
    sortino,
    calmar,
    omega: computeOmega(sorted, 0),
    recoveryFactor,
    maxWinStreak: maxWin,
    maxLossStreak: maxLoss,
    currentStreak: streak,
    compliancePct,
    costOfIndiscipline,
    expectancyInPlan,
    expectancyBrokePlan,
    equityCurve,
    drawdownCeiling,
    finalBalance: bal,
    roiPct: (bal - INITIAL_BALANCE) / INITIAL_BALANCE,
    sqn,
    ulcerIndex,
    drawdownSkewness,
    halfKelly,
    gainToPainRatio,
  };
}

/**
 * Omega de Keating y Shadwick (Ω), forma discreta con umbral L:
 *   Ω(L) = ∑ max(r_i - L, 0) / ∑ max(L - r_i, 0)
 * con r_i el P&L neto de la operación i. Con L = 0 coincide con el Profit
 * Factor. Sin operaciones devuelve 0; sin pérdidas bajo el umbral, 100 si hay
 * ganancia y 0 si no.
 */
export function computeOmega(trades: Trade[], threshold = 0): number {
  if (trades.length === 0) return 0;
  let excessGains = 0;
  let shortfallLosses = 0;

  for (const t of trades) {
    const diff = t.netPnl - threshold;
    if (diff > 0) {
      excessGains += diff;
    } else if (diff < 0) {
      shortfallLosses += Math.abs(diff);
    }
  }

  if (shortfallLosses === 0) {
    return excessGains > 0 ? 100 : 0;
  }
  return +(excessGains / shortfallLosses).toFixed(4);
}

/**
 * SQN de Van Tharp = sqrt(N) * mean(R) / std(R): calidad estadística del
 * sistema, independiente del tamaño de la cuenta. Con menos de 2 R válidas o
 * desviación nula devuelve 0.
 */
export function computeSqn(trades: Trade[]): number {
  const rs = trades.map((t) => t.rMultiple).filter((r) => Number.isFinite(r));
  const n = rs.length;
  if (n < 2) return 0;
  const meanR = rs.reduce((s, v) => s + v, 0) / n;
  const varR = rs.reduce((s, v) => s + (v - meanR) ** 2, 0) / (n - 1);
  const stdR = Math.sqrt(Math.max(0, varR));
  return stdR > 0 ? +((Math.sqrt(n) * meanR) / stdR).toFixed(4) : 0;
}

/**
 * Índice Ulcer de Peter Martin = sqrt((1/N) * sum(DD%_i^2)): profundidad
 * cuadrática de las caídas, en puntos porcentuales. Sin operaciones, 0.
 */
export function computeUlcerIndex(trades: Trade[], initialBalance = INITIAL_BALANCE): number {
  const sorted = [...trades].sort((a, b) => a.closedAt.getTime() - b.closedAt.getTime());
  const n = sorted.length;
  if (n === 0) return 0;
  let bal = initialBalance;
  let peak = initialBalance;
  let sumSq = 0;
  for (const t of sorted) {
    bal += t.netPnl;
    if (bal > peak) peak = bal;
    const ddPct = peak > 0 ? ((peak - bal) / peak) * 100 : 0;
    sumSq += ddPct * ddPct;
  }
  return +Math.sqrt(sumSq / n).toFixed(4);
}

/** Asimetría de la serie de caídas (en %): propensión a caídas de cola pesada. Con menos de 3 operaciones o desviación nula, 0. */
export function computeDrawdownSkewness(trades: Trade[], initialBalance = INITIAL_BALANCE): number {
  const sorted = [...trades].sort((a, b) => a.closedAt.getTime() - b.closedAt.getTime());
  const n = sorted.length;
  if (n < 3) return 0;
  let bal = initialBalance;
  let peak = initialBalance;
  const dds: number[] = [];
  for (const t of sorted) {
    bal += t.netPnl;
    if (bal > peak) peak = bal;
    const ddPct = peak > 0 ? ((peak - bal) / peak) * 100 : 0;
    dds.push(ddPct);
  }
  const meanDd = dds.reduce((s, d) => s + d, 0) / n;
  const varDd = dds.reduce((s, d) => s + (d - meanDd) ** 2, 0) / n;
  const stdDd = Math.sqrt(varDd);
  if (stdDd === 0) return 0;
  const skew = dds.reduce((s, d) => s + ((d - meanDd) / stdDd) ** 3, 0) / n;
  return +skew.toFixed(4);
}

/** Medio Kelly en % = max(0, f* / 2) * 100, con f* = (p*b - q) / b. Acepta el acierto como fracción o como porcentaje. */
export function computeHalfKelly(winRate: number, payoff: number): number {
  const p = winRate > 1 ? winRate / 100 : winRate;
  const q = 1 - p;
  const b = payoff > 0 ? payoff : 1;
  const fullKelly = b > 0 ? (p * b - q) / b : 0;
  return fullKelly > 0 ? +(Math.max(0, fullKelly / 2) * 100).toFixed(2) : 0;
}

/** Intervalo de Wilson al 95 % (o el `z` dado), en %. Con `total` ≤ 0, todo a 0. */
export function computeWilsonCI(
  wins: number,
  total: number,
  z = 1.96
): { lower: number; upper: number; center: number; margin: number } {
  if (total <= 0) return { lower: 0, upper: 0, center: 0, margin: 0 };
  const p = Math.max(0, Math.min(1, wins / total));
  const zSq = z * z;
  const denom = 1 + zSq / total;
  const center = (p + zSq / (2 * total)) / denom;
  const margin = (z * Math.sqrt((p * (1 - p)) / total + zSq / (4 * total * total))) / denom;
  const lower = Math.max(0, center - margin);
  const upper = Math.min(1, center + margin);
  return {
    lower: +(lower * 100).toFixed(2),
    upper: +(upper * 100).toFixed(2),
    center: +(center * 100).toFixed(2),
    margin: +(margin * 100).toFixed(2),
  };
}

/** Gain-to-Pain de Jack Schwager = sum(P&L neto) / sum(|pérdidas|); sin pérdidas, 100 si hay ganancia y 0 si no. */
export function computeGainToPain(trades: Trade[]): number {
  const netPnl = trades.reduce((s, t) => s + t.netPnl, 0);
  const losses = trades.filter((t) => t.netPnl < 0);
  const absLoss = Math.abs(losses.reduce((s, t) => s + t.netPnl, 0));
  if (absLoss === 0) return netPnl > 0 ? 100 : 0;
  return +(netPnl / absLoss).toFixed(4);
}

/**
 * Ganancia necesaria para recuperar una caída: dd / (1 - dd). Un 10 % pide un
 * 11,11 %, un 20 % un 25 % y un 50 % un 100 %. Acepta fracción (0,10) o
 * porcentaje (10); una caída del 100 % o más es irrecuperable (Infinity).
 */
export function drawdownRecoveryRequired(ddPct: number): number {
  if (ddPct <= 0) return 0;
  if (ddPct >= 100 || ddPct === 1) return Infinity;
  if (ddPct > 1) {
    const d = ddPct / 100;
    if (d >= 1) return Infinity;
    return (d / (1 - d)) * 100;
  }
  return ddPct / (1 - ddPct);
}

export interface RunsTestResult {
  n: number;
  wins: number;
  losses: number;
  runs: number;
  expectedRuns: number;
  varianceRuns: number;
  standardDeviation: number;
  zScore: number;
  pValue: number;
  isClustered: boolean;
  isAlternating: boolean;
  isRandom: boolean;
}

/**
 * Test de rachas de Wald-Wolfowitz: contrasta si las rachas de ganancias y
 * pérdidas son compatibles con el azar (H0: i.i.d.) o muestran agrupamiento
 * (z < -1,96, p < 0,05) o alternancia excesiva (z > 1,96, p < 0,05). Ignora
 * las operaciones a cero; sin ambos signos o con n < 2 resulta aleatorio.
 */
export function computeRunsTest(trades: Trade[]): RunsTestResult {
  const binarySequence: number[] = [];
  let wins = 0;
  let losses = 0;

  for (const t of trades) {
    if (t.netPnl > 0) {
      binarySequence.push(1);
      wins++;
    } else if (t.netPnl < 0) {
      binarySequence.push(-1);
      losses++;
    }
  }

  const n = wins + losses;
  if (n < 2 || wins === 0 || losses === 0) {
    return {
      n,
      wins,
      losses,
      runs: binarySequence.length > 0 ? 1 : 0,
      expectedRuns: 0,
      varianceRuns: 0,
      standardDeviation: 0,
      zScore: 0,
      pValue: 1,
      isClustered: false,
      isAlternating: false,
      isRandom: true,
    };
  }

  let runs = 1;
  for (let i = 1; i < binarySequence.length; i++) {
    if (binarySequence[i] !== binarySequence[i - 1]) {
      runs++;
    }
  }

  const expectedRuns = (2 * wins * losses) / n + 1;
  const numerator = 2 * wins * losses * (2 * wins * losses - n);
  const denominator = n * n * (n - 1);
  const varianceRuns = denominator > 0 ? Math.max(0, numerator / denominator) : 0;
  const standardDeviation = Math.sqrt(varianceRuns);

  let zScore = 0;
  let pValue = 1;

  if (standardDeviation > 0) {
    zScore = (runs - expectedRuns) / standardDeviation;
    const absZ = Math.abs(zScore);
    const zNorm = absZ / Math.SQRT2;
    const t = 1 / (1 + 0.3275911 * zNorm);
    const erf =
      1 -
      ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) *
        t *
        Math.exp(-zNorm * zNorm);
    const phi = 0.5 * (1 + erf);
    pValue = Math.max(0, Math.min(1, 2 * (1 - phi)));
  }

  const isClustered = zScore < -1.96 && pValue < 0.05;
  const isAlternating = zScore > 1.96 && pValue < 0.05;
  const isRandom = !isClustered && !isAlternating;

  return {
    n,
    wins,
    losses,
    runs,
    expectedRuns: +expectedRuns.toFixed(4),
    varianceRuns: +varianceRuns.toFixed(4),
    standardDeviation: +standardDeviation.toFixed(4),
    zScore: +zScore.toFixed(4),
    pValue: +pValue.toFixed(4),
    isClustered,
    isAlternating,
    isRandom,
  };
}

export const METRICS = computeMetrics(TRADES);
export const INITIAL_BALANCE_CONST = INITIAL_BALANCE;

/** Temporalidad y régimen de mercado de una operación de muestra, deducidos de
 *  su duración y su setup, que la muestra no trae. */
export function contextoDeMercado(trade: Trade): {
  temporalidad: string;
  regimen: { es: string; en: string };
} {
  const d = trade.durationMin;
  const temporalidad = d < 30 ? "1m" : d < 120 ? "5m" : d < 240 ? "15m" : "1h";
  const regimen =
    trade.setup === "Trend" || trade.setup === "Pullback"
      ? { es: "Tendencia", en: "Trending" }
      : trade.setup === "Breakout"
        ? { es: "Expansión", en: "Expanding" }
        : { es: "Rango", en: "Ranging" };
  return { temporalidad, regimen };
}

/** Ventana tras una pérdida en la que volver al mismo instrumento cuenta
 *  como posible revancha. */
export const ENFRIAMIENTO_MIN = 30;

/** Dónde cae una operación dentro de su día (UTC): cuántas se abrieron
 *  antes, cuánto hace que cerró la anterior, el resultado ya cerrado ese
 *  día al abrirla y si parece revancha (vuelta al mismo instrumento tras
 *  una pérdida, dentro de `ENFRIAMIENTO_MIN`). */
export function contextoDelDia(trade: Trade, trades: Trade[]) {
  const dia = trade.openedAt.toISOString().slice(0, 10);
  const antes = trades
    .filter((t) => t.id !== trade.id && t.openedAt.toISOString().slice(0, 10) === dia && t.openedAt < trade.openedAt)
    .sort((a, b) => a.openedAt.getTime() - b.openedAt.getTime());
  const cerradasAntes = trades.filter(
    (t) => t.id !== trade.id && t.closedAt.toISOString().slice(0, 10) === dia && t.closedAt <= trade.openedAt,
  );
  const anterior = cerradasAntes.reduce<Trade | undefined>(
    (u, t) => (!u || t.closedAt > u.closedAt ? t : u),
    undefined,
  );
  const minDesdeAnterior = anterior
    ? Math.round((trade.openedAt.getTime() - anterior.closedAt.getTime()) / 60000)
    : null;
  return {
    ordinal: antes.length + 1,
    minDesdeAnterior,
    pnlPrevio: +cerradasAntes.reduce((s, t) => s + t.netPnl, 0).toFixed(2),
    revancha:
      !!anterior &&
      anterior.netPnl < 0 &&
      anterior.instrument === trade.instrument &&
      minDesdeAnterior !== null &&
      minDesdeAnterior <= ENFRIAMIENTO_MIN,
  };
}

/** Cumplimiento del plan por mes natural (UTC), con el mismo criterio que
 *  `compliancePct`: los `meses` últimos hasta el de la operación más reciente.
 *  Un mes sin operaciones sale con `n: 0` y fracción 0. */
export function cumplimientoMensual(
  trades: Trade[],
  meses = 6,
): { inicio: Date; n: number; fraccion: number }[] {
  if (!trades.length) return [];
  const ultimo = trades.reduce((m, t) => Math.max(m, t.closedAt.getTime()), -Infinity);
  const fin = new Date(ultimo);
  return Array.from({ length: meses }, (_, i) => {
    const inicio = new Date(Date.UTC(fin.getUTCFullYear(), fin.getUTCMonth() - (meses - 1 - i), 1));
    const del = trades.filter(
      (t) => t.closedAt.getUTCFullYear() === inicio.getUTCFullYear() && t.closedAt.getUTCMonth() === inicio.getUTCMonth(),
    );
    const cumplidas = del.filter((t) => t.compliance === "yes").length;
    return { inicio, n: del.length, fraccion: del.length ? cumplidas / del.length : 0 };
  });
}

export function rHistogram(trades: Trade[], bins = 9): { x: number; count: number }[] {
  const vals = trades.map((t) => t.rMultiple).filter(Number.isFinite);
  const min = -1.5, max = 3.5;
  const step = (max - min) / bins;
  const out = Array.from({ length: bins }, (_, i) => ({ x: +(min + i * step).toFixed(1), count: 0 }));
  for (const v of vals) {
    let idx = Math.floor((v - min) / step);
    idx = Math.max(0, Math.min(bins - 1, idx));
    out[idx].count++;
  }
  return out;
}

export function pnlHistogram(trades: Trade[], bins = 9): { x: number; count: number }[] {
  const vals = trades.map((t) => t.netPnl);
  if (!vals.length) return [];
  const min = Math.min(...vals), max = Math.max(...vals);
  const step = (max - min) / bins || 1;
  const out = Array.from({ length: bins }, (_, i) => ({ x: +(min + i * step).toFixed(0), count: 0 }));
  for (const v of vals) {
    let idx = Math.floor((v - min) / step);
    idx = Math.max(0, Math.min(bins - 1, idx));
    out[idx].count++;
  }
  return out;
}

export function durationHistogram(trades: Trade[]): { label: string; count: number }[] {
  const buckets = [
    { label: "<15m", max: 15 },
    { label: "15–60m", max: 60 },
    { label: "1–3h", max: 180 },
    { label: "3–6h", max: 360 },
    { label: "6–24h", max: 1440 },
    { label: ">24h", max: Infinity },
  ];
  return buckets.map((b, i) => ({
    label: b.label,
    count: trades.filter(
      (t) =>
        t.durationMin <= b.max &&
        (i === 0 || buckets[i - 1].max < t.durationMin)
    ).length,
  }));
}

export function heatmap(trades: Trade[]): number[][] {
  const hourBuckets = [0, 4, 8, 12, 16, 20];
  const grid = Array.from({ length: 5 }, () => Array(hourBuckets.length).fill(0));
  for (const t of trades) {
    const d = t.closedAt.getUTCDay();
    if (d === 0 || d === 6) continue;
    const row = d - 1;
    const h = t.closedAt.getUTCHours();
    const col = Math.min(5, Math.floor(h / 4));
    grid[row][col] += t.netPnl;
  }
  return grid;
}

const DAYS_ES = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const DAYS_EN = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const MONTHS_ES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
const MONTHS_EN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function weekdayBreakdown(trades: Trade[], lang: "es" | "en" = "es"): { day: string; pnl: number }[] {
  const days = lang === "en" ? DAYS_EN : DAYS_ES;
  return days.map((day, i) => ({
    day,
    pnl: trades
      .filter(
        (t) => (t.closedAt.getUTCDay() === 0 ? 6 : t.closedAt.getUTCDay() - 1) === i
      )
      .reduce((s, t) => s + t.netPnl, 0),
  }));
}

export function monthlyBreakdown(trades: Trade[], lang: "es" | "en" = "es"): { month: string; pnl: number }[] {
  const months = lang === "en" ? MONTHS_EN : MONTHS_ES;
  const byMonth = new Map<number, number>();
  for (const t of trades) {
    const m = t.closedAt.getUTCMonth();
    byMonth.set(m, (byMonth.get(m) || 0) + t.netPnl);
  }
  const present = [...byMonth.keys()].sort((a, b) => a - b);
  return present.map((m) => ({ month: months[m], pnl: byMonth.get(m)! }));
}

export interface RankingRow {
  name: string;
  count: number;
  expectancy: number;
  totalPnl: number;
  winRate: number;
}

export function rankByExpectancy(
  trades: Trade[],
  key: (t: Trade) => string
): RankingRow[] {
  const map = new Map<string, Trade[]>();
  for (const t of trades) {
    const k = key(t);
    if (!map.has(k)) map.set(k, []);
    map.get(k)!.push(t);
  }
  const rows: RankingRow[] = [];
  for (const [name, ts] of map) {
    const m = computeMetrics(ts);
    rows.push({
      name,
      count: ts.length,
      expectancy: m.expectancy,
      totalPnl: m.netPnl,
      winRate: m.winRate,
    });
  }
  return rows.sort((a, b) => b.expectancy - a.expectancy);
}

export function dailyPnlForMonth(
  trades: Trade[],
  year: number,
  month: number
): Map<string, number> {
  const m = new Map<string, number>();
  for (const t of trades) {
    if (
      t.closedAt.getUTCFullYear() === year &&
      t.closedAt.getUTCMonth() === month
    ) {
      const key = `${t.closedAt.getUTCDate()}`;
      m.set(key, (m.get(key) || 0) + t.netPnl);
    }
  }
  return m;
}

export const WEEKDAYS_SHORT = ["Lun", "Mar", "Mié", "Jue", "Vie"];

export {
  computeRiskOfRuin,
  computeExpectedMaxLossStreak,
  computeParametricVaR,
  normalCdf,
} from "./estadistica.ts";
