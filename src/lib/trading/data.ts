/*
 * Deterministic demo-data generator + metrics calculator.
 * Mirrors CountPips.Data/DemoData/DemoDataGenerator.cs:
 *   9 instruments across 4 asset classes, 5 setups, 3 sessions,
 *   ~200 trades over 180 days, ~50% win rate, payoff ~1.5, PF ~1.5,
 *   expectancy ~0.25R, max DD ~8%, annualized Sharpe ~3.3.
 * Account: "Cuenta demo", $10,000 initial.
 * Every metric is COMPUTED from the trades so table = curve = KPIs.
 *
 * DETERMINISM: `mulberry32` with fixed seed (20260716). Same trades,
 * same metrics, same chart on every load — no Math.random() anywhere.
 */

export interface Instrument {
  symbol: string;
  basePrice: number;
  tickSize: number;
  decimals: number;
  assetClass: "crypto" | "forex" | "stock" | "futures";
}

export const INSTRUMENTS: Instrument[] = [
  { symbol: "BTC/USDT", basePrice: 65000, tickSize: 0.1, decimals: 1, assetClass: "crypto" },
  { symbol: "ETH/USDT", basePrice: 3200, tickSize: 0.01, decimals: 2, assetClass: "crypto" },
  { symbol: "EURUSD", basePrice: 1.08, tickSize: 0.0001, decimals: 4, assetClass: "forex" },
  { symbol: "XAU/USD", basePrice: 2350, tickSize: 0.01, decimals: 2, assetClass: "forex" },
  { symbol: "AAPL", basePrice: 190, tickSize: 0.01, decimals: 2, assetClass: "stock" },
  { symbol: "ES", basePrice: 5400, tickSize: 0.25, decimals: 2, assetClass: "futures" },
  { symbol: "NQ", basePrice: 18500, tickSize: 0.25, decimals: 2, assetClass: "futures" },
  { symbol: "CL", basePrice: 78.5, tickSize: 0.01, decimals: 2, assetClass: "futures" },
  { symbol: "GER40", basePrice: 18200, tickSize: 0.5, decimals: 1, assetClass: "futures" },
];

/**
 * Los cinco setups del catálogo, por su CLAVE — no por su rótulo.
 *
 * ── Por qué la clave está en inglés ───────────────────────────────────
 * La lista decía `["Ruptura", "Pullback", "Reversión", "Tendencia",
 * "Rango"]`: cuatro palabras españolas y una inglesa que se había
 * quedado sin traducir, y ese valor era a la vez el identificador del
 * dato, el `value` de los desplegables de filtro, la clave con la que se
 * agrupa la expectancia y el texto que se pintaba en pantalla. Las 76
 * páginas de `/en` enseñaban «Ruptura» y «Reversión» en el diario, en la
 * tabla de operaciones y en el detalle de cada una.
 *
 * Separar las dos cosas —una clave estable, un rótulo por idioma— es lo
 * que permite que el filtro siga comparando cadenas exactas mientras el
 * texto cambia con la ruta. La clave se escribe en inglés porque es el
 * idioma del vocabulario técnico del oficio (y porque «Pullback» ya lo
 * estaba), y porque una clave inglesa deja claro de un vistazo que lo
 * que se está tocando es un identificador y no una traducción.
 *
 * Nada persistido se rompe: `demoStore` guarda el diario del visitante
 * con estas mismas claves desde el momento en que se escribe, y valida
 * `typeof setup === "string"`, así que una entrada antigua sigue
 * cargando — sólo deja de casar con su filtro, que es el peor caso
 * aceptable para datos de una demo sin publicar.
 */
export const SETUP_NAMES = [
  "Breakout",
  "Pullback",
  "Reversal",
  "Trend",
  "Range",
] as const;
export type SetupName = (typeof SETUP_NAMES)[number];

/** El rótulo visible de cada setup, en los dos idiomas del sitio. */
const SETUP_LABELS: Record<SetupName, { es: string; en: string }> = {
  Breakout: { es: "Ruptura", en: "Breakout" },
  Pullback: { es: "Pullback", en: "Pullback" },
  Reversal: { es: "Reversión", en: "Reversal" },
  Trend: { es: "Tendencia", en: "Trend" },
  Range: { es: "Rango", en: "Range" },
};

/**
 * El nombre de un setup tal y como debe leerse en la página.
 *
 * Acepta `string` y no sólo `SetupName` porque el diario del visitante
 * se guarda en su navegador: una entrada escrita antes de este cambio
 * trae un valor que ya no está en el catálogo, y la respuesta correcta
 * es pintarlo tal cual —el dato es suyo— en vez de romper la vista.
 */
export function nombreSetup(setup: string, lang: "es" | "en"): string {
  return SETUP_LABELS[setup as SetupName]?.[lang] ?? setup;
}

export const SESSIONS = ["London", "NY", "Asia"] as const;
export type Session = (typeof SESSIONS)[number];

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

function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
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

const INITIAL_BALANCE = 10000;

function buildTrades(): Trade[] {
  const rnd = mulberry32(20260716);
  const trades: Trade[] = [];
  const now = new Date("2026-07-16T18:00:00Z");
  const dayMs = 86400000;
  let id = 1;

  // 200 trades ≈ ~1.1 trades / business day over 180 days — realistic
  // cadence for an active retail day-trader running 1–3 setups per session.
  for (let i = 0; i < 200; i++) {
    const inst = INSTRUMENTS[Math.floor(rnd() * INSTRUMENTS.length)];
    const setup = SETUP_NAMES[Math.floor(rnd() * SETUP_NAMES.length)];
    const direction: Direction = rnd() > 0.42 ? "long" : "short";
    const session = SESSIONS[Math.floor(rnd() * SESSIONS.length)];

    const balance = INITIAL_BALANCE + trades.reduce((s, t) => s + t.netPnl, 0);
    // Risk 0.5–1.5 % of current balance per trade — slightly below the
    // classic 2 % rule, mirrors a disciplined retail trader who scales
    // down risk after drawdowns and up during winning streaks.
    const riskPct = 0.5 + rnd() * 1.0;
    const riskUsd = +(balance * (riskPct / 100)).toFixed(2);

    // 50 % win rate, payoff ~1.5 → PF ~1.5, expectancy ~0.25R, edge +.
    const isWin = rnd() < 0.50;
    const r = isWin ? +(0.5 + rnd() * 2.0).toFixed(2) : +(-(0.8 + rnd() * 0.4)).toFixed(2);
    const plannedRr = +(1.5 + rnd() * 2.0).toFixed(2);

    const netPnl = +(riskUsd * r).toFixed(2);
    // Fees scale with trade size (typical broker commission + slippage):
    // ~3–7 % of the absolute P&L magnitude. Always a positive cost.
    const fees = +(Math.abs(netPnl) * (0.03 + rnd() * 0.04)).toFixed(2);
    // gross = net + fees (fees are deducted from gross to get net, so
    // gross is bigger than net for winners and LESS negative for losers).
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

    const cr = rnd();
    const compliance: Compliance = cr < 0.7 ? "yes" : cr < 0.85 ? "partial" : "no";

    // Close timestamps aligned to the session's real UTC window:
    //   London 08:00–11:00, NY 14:00–17:00, Asia 23:00–03:00 (Tokyo open).
    // Asia hour is computed modulo 24 to avoid `setHours(24+)` rolling
    // the date into the next day.
    const hourBase =
      session === "London"
        ? 8 + Math.floor(rnd() * 3)
        : session === "NY"
        ? 14 + Math.floor(rnd() * 3)
        : (23 + Math.floor(rnd() * 4)) % 24;
    const closedAt = new Date(now.getTime() - rnd() * 180 * dayMs);
    closedAt.setHours(hourBase, Math.floor(rnd() * 60), 0, 0);
    const durationMin =
      session === "Asia"
        ? 60 + Math.floor(rnd() * 240)
        : 5 + Math.floor(rnd() * 180);
    const openedAt = new Date(closedAt.getTime() - durationMin * 60000);

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
      // 0–10 daily discipline score (10 = flawless plan execution).
      dayScore: Math.floor(rnd() * 11),
      entryNote: ES_NOTES[Math.floor(rnd() * ES_NOTES.length)],
      closeNote: ES_CLOSE[Math.floor(rnd() * ES_CLOSE.length)],
    });
  }

  return trades.sort((a, b) => b.closedAt.getTime() - a.closedAt.getTime());
}

export const TRADES: Trade[] = buildTrades();

/* ===== Metrics calculator ===== */
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
  // Running peak alongside equityCurve — replaces the previous O(n²)
  // `equityCurve.filter(x => x.date <= e.date)` lookup that became
  // noticeable at n ≥ 200 trades.
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
      .reduce((s, r) => s + (r - mean) ** 2, 0) /
      (rets.length || 1)
  );

  // Annualize per-trade Sharpe / Sortino by sqrt(trades_per_year) so the
  // demo's AnalyticsPage values match the marketing copy ("Sharpe 3,34")
  // and the conventional definition a trader expects. trades_per_year is
  // derived from the actual sample span (n trades over `spanDays`),
  // assuming 252 trading days / year (the heatmap already filters out
  // weekends so this is consistent with the rest of the demo).
  const spanMs =
    n > 1
      ? sorted[n - 1].closedAt.getTime() - sorted[0].closedAt.getTime()
      : 1;
  const spanDays = Math.max(1, spanMs / 86_400_000);
  const tradesPerYear = (n * 252) / spanDays;
  const annFactor = Math.sqrt(tradesPerYear);
  const sharpe = sd ? (mean / sd) * annFactor : 0;
  const sortino = downside ? (mean / downside) * annFactor : 0;

  // Calmar = CAGR / |Max DD %| (standard definition, both unitless).
  // CAGR computed from the actual span in years. Falls back to 0 if
  // there's no drawdown or the balance never moved.
  const years = spanDays / 252;
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
  const broke = sorted.filter((t) => t.compliance !== "yes");
  const expectancyInPlan = inPlan.length
    ? inPlan.reduce((s, t) => s + t.netPnl, 0) / inPlan.length
    : 0;
  const expectancyBrokePlan = broke.length
    ? broke.reduce((s, t) => s + t.netPnl, 0) / broke.length
    : 0;
  const costOfIndiscipline = broke.reduce(
    (s, t) => s + (expectancyInPlan - t.netPnl),
    0
  );

  return {
    closedCount: n,
    netPnl,
    winRate: n ? wins.length / n : 0,
    wins: wins.length,
    losses: losses.length,
    expectancy: n ? netPnl / n : 0,
    expectancyR,
    profitFactor: grossLoss ? grossWin / grossLoss : grossWin,
    payoff: avgLoss ? avgWin / avgLoss : 0,
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
  };
}

export const METRICS = computeMetrics(TRADES);
export const INITIAL_BALANCE_CONST = INITIAL_BALANCE;

/* ===== Analytics distributions ===== */
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
    const d = t.closedAt.getDay();
    if (d === 0 || d === 6) continue;
    const row = d - 1;
    const h = t.closedAt.getHours();
    const col = Math.min(5, Math.floor(h / 4));
    grid[row][col] += t.netPnl;
  }
  return grid;
}

export function weekdayBreakdown(trades: Trade[]): { day: string; pnl: number }[] {
  const days = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
  return days.map((day, i) => ({
    day,
    pnl: trades
      .filter((t) => (t.closedAt.getDay() === 0 ? 6 : t.closedAt.getDay() - 1) === i)
      .reduce((s, t) => s + t.netPnl, 0),
  }));
}

export function monthlyBreakdown(trades: Trade[]): { month: string; pnl: number }[] {
  const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
  const byMonth = new Map<number, number>();
  for (const t of trades) {
    const m = t.closedAt.getMonth();
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
      t.closedAt.getFullYear() === year &&
      t.closedAt.getMonth() === month
    ) {
      const key = `${t.closedAt.getDate()}`;
      m.set(key, (m.get(key) || 0) + t.netPnl);
    }
  }
  return m;
}

export const WEEKDAYS_SHORT = ["Lun", "Mar", "Mié", "Jue", "Vie"];
export const WEEKDAYS_FULL = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];
