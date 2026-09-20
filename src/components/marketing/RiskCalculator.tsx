"use client";

import { useState, useMemo, useCallback, type CSSProperties } from "react";
import { useLang } from "@/lib/i18n";
import { computeRiskOfRuin, computeParametricVaR, tramosRiesgoBeneficio } from "@/lib/trading/estadistica";
import { fmtPct, formatoUsd, pctSep } from "@/lib/trading/format";

/**
 * RiskCalculator — calculadora de tamaño de posición institucional y multi-activo.
 *
 * Admite:
 *  - Acciones / Cripto (unidades o monedas)
 *  - Forex (Lotes estándar, mini y micro)
 *  - Futuros (Contratos con multiplicador por punto como ES, NQ, MES, MNQ, GC, CL)
 */

const RISK_MIN = 0.25;
const RISK_MAX = 3;
const RISK_MARKS = [0.25, 1, 2, 3];

type AssetMode = "equities" | "forex" | "futures";

interface FuturesContract {
  id: string;
  name: string;
  mult: number;
  tickSize: number;
}

export const FUTURES_CONTRACTS: FuturesContract[] = [
  { id: "es", name: "E-mini S&P 500 (ES) · 50 $/pt", mult: 50, tickSize: 0.25 },
  { id: "nq", name: "E-mini Nasdaq (NQ) · 20 $/pt", mult: 20, tickSize: 0.25 },
  { id: "mes", name: "Micro E-mini S&P (MES) · 5 $/pt", mult: 5, tickSize: 0.25 },
  { id: "mnq", name: "Micro Nasdaq (MNQ) · 2 $/pt", mult: 2, tickSize: 0.25 },
  { id: "rty", name: "E-mini Russell 2000 (RTY) · 50 $/pt", mult: 50, tickSize: 0.1 },
  { id: "gc", name: "Gold / Oro (GC) · 100 $/pt", mult: 100, tickSize: 0.1 },
  { id: "cl", name: "Crude Oil (CL) · 1.000 $/pt", mult: 1000, tickSize: 0.01 },
];

type ForexLotType = "standard" | "mini" | "micro";

export function RiskCalculator() {
  const { lang } = useLang();
  /* Espacio duro antes del signo en espanol, pegado en ingles: la regla
     de la casa, escrita en `PCT_SEP` de lib/trading/format.ts. */
  const PCT = lang === "es" ? "\u00a0%" : "%";
  const es = lang === "es";

  const presets = [
    { label: es ? "Conservador" : "Conservative", pct: 0.5 },
    { label: es ? "Estándar" : "Standard", pct: 1.0 },
    { label: es ? "Agresivo" : "Aggressive", pct: 2.0 },
  ];
  const balances = [
    { label: es ? "10\u00a0k $" : "$10k", v: 10000 },
    { label: es ? "25\u00a0k $" : "$25k", v: 25000 },
    { label: es ? "50\u00a0k $" : "$50k", v: 50000 },
    { label: es ? "100\u00a0k $" : "$100k", v: 100000 },
  ];

  // ── Estado editable: la operación del usuario ─────────────────────
  const [assetMode, setAssetMode] = useState<AssetMode>("equities");
  const [futuresContractId, setFuturesContractId] = useState("es");
  const [forexLotType, setForexLotType] = useState<ForexLotType>("standard");
  const [riskPct, setRiskPct] = useState(1.0);
  const [balance, setBalance] = useState(10000);
  const [entry, setEntry] = useState(100);
  const [stop, setStop] = useState(95);
  const [target, setTarget] = useState(115);
  const [includeFriction, setIncludeFriction] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showKelly, setShowKelly] = useState(false);
  const [kellyWinRate, setKellyWinRate] = useState(55); // %

  const selectedFutures = useMemo(
    () => FUTURES_CONTRACTS.find((f) => f.id === futuresContractId) ?? FUTURES_CONTRACTS[0],
    [futuresContractId]
  );

  const lotMultiplier = useMemo(() => {
    if (forexLotType === "micro") return 1000;
    if (forexLotType === "mini") return 10000;
    return 100000;
  }, [forexLotType]);

  // ── Cálculo en vivo adaptado al activo ───────────────────────────
  const c = useMemo(() => {
    const riskPerShare = Math.abs(entry - stop);
    const rewardPerShare = Math.abs(target - entry);
    const valid = riskPerShare > 0 && rewardPerShare > 0 && entry > 0;
    const rr = valid ? rewardPerShare / riskPerShare : 0;
    const riskUsd = (balance * riskPct) / 100;

    // Criterio de Kelly: f* = (p*b - q) / b
    const p = kellyWinRate / 100;
    const q = 1 - p;
    const b = rr > 0 ? rr : 1;
    const fullKellyPct = b > 0 ? Math.max(0, ((p * b - q) / b) * 100) : 0;
    const halfKellyPct = fullKellyPct > 0 ? Math.max(0.25, Math.min(3.0, fullKellyPct / 2)) : 0;
    const quarterKellyPct = fullKellyPct > 0 ? Math.max(0.25, Math.min(3.0, fullKellyPct / 4)) : 0;

    let size = 0;
    let sizeLabel = "u";
    let positionValue = 0;
    let pipValue = 0;

    if (valid) {
      if (assetMode === "equities") {
        size = riskUsd / riskPerShare;
        sizeLabel = es ? "unidades" : "units";
        positionValue = size * entry;
        pipValue = size * 0.01;
      } else if (assetMode === "forex") {
        const units = riskUsd / riskPerShare;
        const lots = units / lotMultiplier;
        size = lots;
        sizeLabel =
          forexLotType === "micro"
            ? (es ? "micro lotes (1k)" : "micro lots (1k)")
            : forexLotType === "mini"
              ? (es ? "mini lotes (10k)" : "mini lots (10k)")
              : (es ? "lotes estándar (100k)" : "standard lots (100k)");
        positionValue = units * entry;
        pipValue = (units * 0.0001); // Para pares EUR/USD base 0.0001
      } else {
        const pointRisk = riskPerShare * selectedFutures.mult;
        const contracts = pointRisk > 0 ? riskUsd / pointRisk : 0;
        size = contracts;
        sizeLabel = es ? "contratos" : "contracts";
        positionValue = contracts * entry * selectedFutures.mult;
        pipValue = contracts * selectedFutures.tickSize * selectedFutures.mult;
      }
    }

    // Fricción de ejecución estimada (comisiones ida y vuelta + 1 tick slippage)
    const commissionPerUnit = assetMode === "futures" ? 4.5 : (assetMode === "forex" ? (lotMultiplier / 100000) * 5.0 : 0.005);
    const estimatedFriction = valid && includeFriction ? size * commissionPerUnit : 0;

    const grossProfit = valid
      ? (assetMode === "futures"
          ? size * rewardPerShare * selectedFutures.mult
          : assetMode === "forex"
            ? (size * lotMultiplier) * rewardPerShare
            : size * rewardPerShare)
      : 0;

    const netProfit = Math.max(0, grossProfit - estimatedFriction);
    const totalRiskUsd = riskUsd + estimatedFriction;
    const profitPct = (netProfit / balance) * 100;
    const positionPct = (positionValue / balance) * 100;
    const direction = entry > 0 && stop > entry ? "short" : "long";

    return {
      riskPerShare,
      rewardPerShare,
      valid,
      rr,
      riskUsd,
      totalRiskUsd,
      estimatedFriction,
      size,
      sizeLabel,
      profit: netProfit,
      grossProfit,
      profitPct,
      positionValue,
      positionPct,
      pipValue,
      direction,
      fullKellyPct,
      halfKellyPct,
      quarterKellyPct,
      riskOfRuin: computeRiskOfRuin(kellyWinRate, rr, riskPct, 50),
      var95: computeParametricVaR(balance, riskPct, 95),
      leverage: valid && balance > 0 ? positionValue / balance : 0,
    };
  }, [entry, stop, target, balance, riskPct, assetMode, selectedFutures, forexLotType, lotMultiplier, includeFriction, kellyWinRate, es]);

  const nf = useMemo(() => {
    const locale = es ? "es-ES" : "en-US";
    return {
      usd: formatoUsd(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2,
      }),
      dec1: new Intl.NumberFormat(locale, {
        minimumFractionDigits: 1, maximumFractionDigits: 1,
      }),
      dec2: new Intl.NumberFormat(locale, {
        minimumFractionDigits: 2, maximumFractionDigits: 2,
      }),
    };
  }, [es]);

  const fmtUsd = useCallback((n: number) => nf.usd.format(n), [nf]);

  const fmtNum = useCallback(
    (n: number, dec = 2) => (dec === 1 ? nf.dec1 : nf.dec2).format(n),
    [nf],
  );

  const tramos = tramosRiesgoBeneficio(c.riskUsd, c.profit);

  const handleAssetChange = useCallback((mode: AssetMode) => {
    setAssetMode(mode);
    if (mode === "futures") {
      setEntry(5800);
      setStop(5780);
      setTarget(5840);
    } else if (mode === "forex") {
      setEntry(1.0850);
      setStop(1.0820);
      setTarget(1.0910);
    } else {
      setEntry(100);
      setStop(95);
      setTarget(115);
    }
  }, []);

  const handleFuturesChange = useCallback((id: string) => {
    setFuturesContractId(id);
    if (id === "es" || id === "mes") {
      setEntry(5800);
      setStop(5780);
      setTarget(5840);
    } else if (id === "nq" || id === "mnq") {
      setEntry(20500);
      setStop(20400);
      setTarget(20700);
    } else if (id === "rty") {
      setEntry(2200);
      setStop(2185);
      setTarget(2230);
    } else if (id === "gc") {
      setEntry(2650);
      setStop(2635);
      setTarget(2680);
    } else if (id === "cl") {
      setEntry(75.00);
      setStop(74.20);
      setTarget(76.60);
    }
  }, []);

  /* Aqui vivia `chipStyle`, que vestia a mano cada opcion de los tres
     grupos de esta calculadora. Ya no hace falta: los grupos son
     conmutadores segmentados y el estilo del elegido lo pone
     `.tj-segmentado` a partir de `aria-pressed`, que es ademas lo que
     un lector de pantalla necesita para anunciarlo. */

  const numInput = (label: string, value: number, onChange: (n: number) => void, ariaLabel: string) => (
    <label className="block min-w-0">
      <span className="tnum block text-[12px] text-tertiary mb-1">
        {label}
      </span>
      <input
        type="number"
        inputMode="decimal"
        step="any"
        min={0}
        value={Number.isFinite(value) ? value : ""}
        onChange={(e) => {
          const v = parseFloat(e.target.value);
          onChange(Number.isFinite(v) ? v : 0);
        }}
        aria-label={ariaLabel}
        className="tj-campo tnum w-full min-h-[44px] px-3 text-base font-medium text-primary"
      />
    </label>
  );

  const copyPlan = useCallback(async () => {
    if (!c.valid) return;
    const lines = [
      es ? "Plan de operación — CountPips" : "Trade plan — CountPips",
      "─".repeat(28),
      `${es ? "Activo" : "Asset"}: ${assetMode.toUpperCase()}`,
      `${es ? "Balance" : "Balance"}: ${fmtUsd(balance)}`,
      `${es ? "Riesgo nominal" : "Nominal risk"}: ${fmtNum(riskPct)} % (${fmtUsd(c.riskUsd)})`,
      `${es ? "Fricción estimada" : "Estimated friction"}: -${fmtUsd(c.estimatedFriction)}`,
      `${es ? "Riesgo total" : "Total risk"}: ${fmtUsd(c.totalRiskUsd)}`,
      `${es ? "Entrada" : "Entry"}: ${fmtNum(entry)}`,
      `${es ? "Stop" : "Stop"}: ${fmtNum(stop)}`,
      `${es ? "Objetivo" : "Target"}: ${fmtNum(target)}`,
      `${es ? "Dirección" : "Direction"}: ${c.direction === "short" ? (es ? "Corto" : "Short") : (es ? "Largo" : "Long")}`,
      "─".repeat(28),
      `${es ? "Tamaño" : "Size"}: ${fmtNum(c.size, 2)} ${c.sizeLabel}`,
      `${es ? "Valor pip/punto" : "Pip/Point value"}: ${fmtUsd(c.pipValue)}`,
      `${es ? "R:R" : "R:R"}: ${fmtNum(c.rr, 2)} : 1`,
      `${es ? "Beneficio neto estimado" : "Estimated net profit"}: ${fmtUsd(c.profit)} (${fmtNum(c.profitPct, 1)} %)`,
      `${es ? "Valor nocional" : "Notional value"}: ${fmtUsd(c.positionValue)}`,
    ];
    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      // clipboard fallback
    }
  }, [c, balance, riskPct, entry, stop, target, assetMode, es, fmtUsd, fmtNum]);

  return (
    <section className="section-tight">
      <div className="tj-container grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
        <div>
          <div className="inline-flex items-center gap-3 mb-5">
            <span className="eyebrow" data-titular-herramienta>
              {es ? "CALCULADORA DE RIESGO" : "RISK CALCULATOR"}
            </span>
          </div>

          <h2 data-titular-herramienta className="t-h2 m-0 text-primary max-w-[24ch]">
            {es ? (
              <>
                Calcula tu riesgo <span className="text-[rgb(var(--accent-base))]">antes</span> de operar.
              </>
            ) : (
              <>
                Calculate your risk <span className="text-[rgb(var(--accent-base))]">before</span> you trade.
              </>
            )}
          </h2>

          <p className="mt-5 mb-7 text-base sm:text-lg leading-relaxed text-secondary max-w-[34em]">
            {es
              ? "Introduce tu capital y la distancia a tu stop. Calculamos el tamaño exacto en unidades, lotes o contratos según el mercado que operes."
              : "Enter your balance and stop distance. We work out the exact sizing in units, lots or contracts tailored to your market."}
          </p>

          {/* Selector de clase de activo */}
          <div className="mb-5">
            <div className="tnum mb-2 text-[12px] text-tertiary">
              {es ? "Mercado / Instrumento" : "Market / Instrument"}
            </div>
            {/* Conmutador, no tres botones sueltos: con `flex-wrap` el
                tercero se quedaba solo en una segunda fila y con otro
                ancho, y tres opciones que son lo mismo se veian como dos
                cosas y una suelta. Ver `.tj-segmentado`. */}
            <div className="tj-segmentado tj-segmentado-apila" role="group">
              {[
                { id: "equities" as const, labelEs: "Acciones / Cripto", labelEn: "Stocks / Crypto" },
                { id: "forex" as const, labelEs: "Forex (Lotes)", labelEn: "Forex (Lots)" },
                { id: "futures" as const, labelEs: "Futuros (Contratos)", labelEn: "Futures (Contracts)" },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  aria-pressed={assetMode === m.id}
                  onClick={() => handleAssetChange(m.id)}
                >
                  {es ? m.labelEs : m.labelEn}
                </button>
              ))}
            </div>
          </div>

          {/* Subselector para futuros */}
          {assetMode === "futures" && (
            <div className="mb-5 border-y border-[var(--ficha-division)] py-3">
              <span className="block text-[12px] text-tertiary mb-2">
                {es ? "Contrato de futuros" : "Futures contract"}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {FUTURES_CONTRACTS.map((fc) => (
                  <button
                    key={fc.id}
                    type="button"
                    onClick={() => handleFuturesChange(fc.id)}
                    className={`h-7 px-2.5 rounded-[4px] text-xs tnum transition-all ${
                      futuresContractId === fc.id
                        ? "bg-[color-mix(in_srgb,var(--ink)_9%,transparent)] text-primary font-semibold shadow-[inset_0_0_0_1px_var(--line-2)]"
                        : "text-secondary shadow-[inset_0_0_0_1px_var(--ficha-filo)] hover:text-primary hover:bg-[color-mix(in_srgb,var(--ink)_3.5%,transparent)]"
                    }`}
                  >
                    {fc.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Subselector para Forex */}
          {assetMode === "forex" && (
            <div className="mb-5 border-y border-[var(--ficha-division)] py-3">
              <span className="block text-[12px] text-tertiary mb-2">
                {es ? "Tipo de lote Forex" : "Forex lot sizing"}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { id: "standard" as const, labelEs: "Estándar (100k)", labelEn: "Standard (100k)" },
                  { id: "mini" as const, labelEs: "Mini (10k)", labelEn: "Mini (10k)" },
                  { id: "micro" as const, labelEs: "Micro (1k)", labelEn: "Micro (1k)" },
                ].map((lot) => (
                  <button
                    key={lot.id}
                    type="button"
                    onClick={() => setForexLotType(lot.id)}
                    className={`h-7 px-2.5 rounded-[4px] text-xs tnum transition-all ${
                      forexLotType === lot.id
                        ? "bg-[color-mix(in_srgb,var(--ink)_9%,transparent)] text-primary font-semibold shadow-[inset_0_0_0_1px_var(--line-2)]"
                        : "text-secondary shadow-[inset_0_0_0_1px_var(--ficha-filo)] hover:text-primary hover:bg-[color-mix(in_srgb,var(--ink)_3.5%,transparent)]"
                    }`}
                  >
                    {es ? lot.labelEs : lot.labelEn}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Control de Fricción de Ejecución */}
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <span className="block text-[14px] font-medium text-primary">
                {es ? "Deducir fricción de ejecución" : "Deduct execution friction"}
              </span>
              <span className="block text-[12px] text-tertiary">
                {es ? "Comisiones estimadas + 1 tick de slippage" : "Estimated commissions + 1 tick slippage"}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIncludeFriction((v) => !v)}
              role="switch"
              aria-checked={includeFriction}
              aria-label={es ? "Deducir fricción de ejecución" : "Deduct execution friction"}
              className={`toque-halo relative h-6 w-10 shrink-0 rounded-full transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--accent-base)/0.55)] ${
                includeFriction ? "bg-[var(--ink)]" : "bg-[color-mix(in_srgb,var(--ink)_14%,transparent)]"
              }`}
            >
              <span
                aria-hidden
                className={`absolute top-[3px] left-[3px] h-[18px] w-[18px] rounded-full bg-[var(--raised)] shadow-sm transition-transform duration-200 ${
                  includeFriction ? "translate-x-4" : ""
                }`}
              />
            </button>
          </div>

          {/* Chips de plantilla */}
          <div className="mb-4">
            <div className="tnum mb-2 text-[12px] text-tertiary">
              {es ? "Plantilla de riesgo" : "Risk preset"}
            </div>
            <div className="tj-segmentado tj-segmentado-apila" role="group">
              {presets.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => setRiskPct(p.pct)}
                  aria-pressed={riskPct === p.pct}
                >
                  {p.label} · {fmtNum(p.pct)}{pctSep(lang)}
                </button>
              ))}
            </div>
          </div>

          {/* Chips de balance */}
          <div>
            <div className="tnum mb-2 text-[12px] text-tertiary">
              {es ? "Balance de cuenta" : "Account balance"}
            </div>
            {/* Aqui no hace falta apilar: son cuatro etiquetas de cuatro
                caracteres y caben en fila hasta en 390 px. */}
            <div className="tj-segmentado" role="group">
              {balances.map((b) => (
                <button
                  key={b.label}
                  type="button"
                  onClick={() => setBalance(b.v)}
                  aria-pressed={balance === b.v}
                >
                  {b.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tarjeta calculadora */}
        <div
          className="tj-paper tj-paper-glow relative p-6 rounded-[12px]"
        >
          {/* Slider de riesgo */}
          <div className="mb-5">
            <div className="flex items-center justify-between mb-2">
              <span
                className="tnum"
                style={{ fontSize: 13, color: "var(--ink-2)" }}
              >
                {es ? "Riesgo por operación" : "Risk per trade"}
              </span>
              <span
                className="tnum inline-flex items-baseline gap-1"
                style={{
                  fontSize: 22,
                  fontWeight: 600,
                  color: "var(--ink)",
                }}
              >
                {fmtNum(riskPct)}
                {pctSep(lang)}
              </span>
            </div>
            <input
              type="range"
              min={RISK_MIN}
              max={RISK_MAX}
              step={0.05}
              value={riskPct}
              onChange={(e) => setRiskPct(parseFloat(e.target.value))}
              aria-label={es ? "Porcentaje de riesgo por operación" : "Risk percentage per trade"}
              /* `.tj-range`, como los otros deslizadores del sitio. Era
                 `appearance-none` con 8 px de alto y sin regla de bolita:
                 en WebKit eso deja el control sin agarradera visible, y
                 8 px no se cogen con el dedo. */
              className="tj-range w-full"
              style={
                {
                  "--pct": `${((riskPct - RISK_MIN) / (RISK_MAX - RISK_MIN)) * 100}%`,
                } as CSSProperties
              }
            />
            <div className="flex justify-between mt-1 text-[11px] text-tertiary tnum">
              {/* `0.25%` con punto ingles, en una lista donde la cifra de al
                  lado dice `3,00%`. La marca salia del numero crudo de
                  JavaScript, que siempre lleva punto decimal. */}
              {RISK_MARKS.map((m) => (
                <span key={m}>{fmtPct(m / 100, lang, m < 1 ? 2 : 0)}</span>
              ))}
            </div>
          </div>

          {/* Entrada / Stop / Target */}
          <div
            className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mb-5"
          >
            {numInput(es ? "Entrada" : "Entry", entry, setEntry, es ? "Precio de entrada" : "Entry price")}
            {numInput(es ? "Stop" : "Stop", stop, setStop, es ? "Precio de stop loss" : "Stop loss price")}
            {numInput(es ? "Objetivo" : "Target", target, setTarget, es ? "Precio objetivo take profit" : "Take profit target price")}
          </div>

          {/* Criterio de Kelly (Medio Kelly institucional) */}
          <div className="mb-5 border-y border-[var(--line)] py-3">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setShowKelly((v) => !v)}
                aria-expanded={showKelly}
                className="toque-comodo text-[13px] text-secondary hover:text-primary flex items-center gap-2 transition-colors"
              >
                <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden className={`transition-transform duration-150 ${showKelly ? "rotate-90" : ""}`}>
                  <path d="M3.5 2l3 3-3 3" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span>{es ? "Criterio de Kelly" : "Kelly criterion"}</span>
              </button>
              <span className="text-[12px] tnum text-tertiary">
                {es ? "Medio Kelly: " : "Half-Kelly: "}
                <strong className="text-primary font-semibold">{fmtNum(c.halfKellyPct)}{PCT}</strong>
              </span>
            </div>

            {showKelly && (
              <div className="mt-3 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-tertiary">{es ? "Win Rate histórico estimado:" : "Estimated historical Win Rate:"}</span>
                  <span className="tnum font-semibold text-primary">{kellyWinRate}{PCT}</span>
                </div>
                <input
                  type="range"
                  min={35}
                  max={75}
                  step={1}
                  value={kellyWinRate}
                  onChange={(e) => setKellyWinRate(parseInt(e.target.value, 10))}
                  aria-label={es ? "Win rate para Kelly" : "Win rate for Kelly"}
                  /* `.tj-range` como el resto: con `appearance-none` y sin
                     regla de bolita, en WebKit no se veía la agarradera. */
                  className="tj-range w-full"
                  style={{ "--pct": `${((kellyWinRate - 35) / 40) * 100}%` } as CSSProperties}
                />
                <div className="grid grid-cols-3 gap-2 text-center text-[12px] tnum">
                  <div className="py-1">
                    <div className="text-tertiary">{es ? "Kelly completo" : "Full Kelly"}</div>
                    <div className="font-semibold text-primary mt-0.5">{fmtNum(c.fullKellyPct)}{PCT}</div>
                  </div>
                  <div className="py-1">
                    <div className="text-[rgb(var(--accent-base))] font-semibold">{es ? "Medio Kelly" : "Half Kelly"}</div>
                    <div className="font-semibold text-[rgb(var(--accent-base))] mt-0.5">{fmtNum(c.halfKellyPct)}{PCT}</div>
                  </div>
                  <div className="py-1">
                    <div className="text-tertiary">{es ? "Cuarto de Kelly" : "Quarter Kelly"}</div>
                    <div className="font-semibold text-primary mt-0.5">{fmtNum(c.quarterKellyPct)}{PCT}</div>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={c.halfKellyPct <= 0}
                  onClick={() => c.halfKellyPct > 0 && setRiskPct(Number(c.halfKellyPct.toFixed(2)))}
                  className="toque-comodo w-full py-2 text-[13px] tnum font-medium tj-campo text-primary hover:text-[rgb(var(--accent-base))] transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {c.halfKellyPct <= 0
                    ? (es ? `Sin ventaja (Kelly = 0${PCT} · No operar)` : "No edge (Kelly = 0% · Do not trade)")
                    : (es ? `Usar medio Kelly (${fmtNum(c.halfKellyPct)}${PCT} de riesgo)` : `Apply Half-Kelly recommendation (${fmtNum(c.halfKellyPct)}% risk)`)}
                </button>
              </div>
            )}
          </div>

          {/* Aviso de validación + dirección */}
          {!c.valid ? (
            <div
              className="mb-4 border-y border-[var(--ficha-division)] py-2.5 text-[13px] leading-[1.5]"
              style={{ color: "rgb(var(--pnl-neg))" }}
              role="alert"
            >
              {es
                ? "Entrada, stop y objetivo deben ser distintos y positivos para calcular el tamaño."
                : "Entry, stop and target must be distinct and positive to calculate size."}
            </div>
          ) : (
            <div
              className="mb-4 flex items-center gap-2 text-[12px] tnum text-secondary"
            >
              <span
                aria-hidden
                className="inline-flex items-center justify-center rounded-[2px] w-4 h-4 font-semibold text-[11px]"
                style={{
                  background: c.direction === "short"
                    ? "color-mix(in oklab, rgb(var(--pnl-neg)) 16%, transparent)"
                    : "color-mix(in oklab, rgb(var(--pnl-pos)) 16%, transparent)",
                  color: c.direction === "short" ? "rgb(var(--pnl-neg))" : "rgb(var(--pnl-pos))",
                }}
              >
                {c.direction === "short" ? "↓" : "↑"}
              </span>
              <span>
                {c.direction === "short"
                  ? (es ? "Operación en corto detectada" : "Short trade detected")
                  : (es ? "Operación en largo detectada" : "Long trade detected")}
              </span>
            </div>
          )}

          {/* Resultados — la rejilla cuenta sus columnas contra SU ancho,
              no contra el de la ventana. Con `sm:grid-cols-3` pedia tres
              columnas siempre que la ventana pasara de 640, y en
              /features/metricas esta calculadora vive en una columna
              estrecha: a 1024 px de ventana la rejilla medía 324 px, la
              celda 100 y el hueco de la cifra 66, mientras «100,10 US$»
              pedia 84 — se partia en dos lineas. A 1280 y a 1440 la misma
              rejilla mide 432 y va sobrada, que es por lo que no se veia
              mirando solo los extremos.

              `auto-fit` + `minmax(8.25rem, 1fr)` deja que sea el ancho
              real quien lo decida. Medido, da el mismo reparto de siempre
              donde ya estaba bien —3 columnas a 1280, 1440 y en la
              herramienta a 768; 2 en movil— y baja a 2 solo en el caso
              que se rompia. */}
          <div className="grid grid-cols-[repeat(auto-fit,minmax(8.25rem,1fr))] gap-x-4 mb-2">
            <Result label={es ? "Riesgo total" : "Total risk"} value={fmtUsd(c.totalRiskUsd)} color="rgb(var(--pnl-neg))" />
            <Result label={es ? "Beneficio neto" : "Net profit"} value={fmtUsd(c.profit)} color="rgb(var(--pnl-pos))" />
            <Result label={es ? "Tamaño de posición" : "Position size"} value={`${fmtNum(c.size, assetMode === "forex" ? 2 : (assetMode === "futures" ? 1 : 2))} ${c.sizeLabel}`} color="var(--ink)" />
            <Result label="R:R" value={`${fmtNum(c.rr, 2)} : 1`} color="var(--ink)" />
            <Result label={es ? "Valor del pip / punto" : "Pip / point value"} value={fmtUsd(c.pipValue)} color="var(--ink)" />
            <Result label={es ? "Fricción estimada" : "Est. friction"} value={`−${fmtUsd(c.estimatedFriction)}`} color="var(--ink-2)" />
          </div>

          {/* Stats adicionales: valor posición, apalancamiento, VaR 95% y riesgo de ruina */}
          <div
            /* La clase va en CADA celda y no como variante `[&>div]:`:
               Tailwind no compone una clase propia dentro de un variante
               arbitrario y ahi no llegaba a generar regla ninguna —
               comprobado en la hoja construida. */
            className="mb-6 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-[var(--line)] pt-4 sm:grid-cols-4"
          >
            <div className="caja-cifra">
              <div className="tnum text-[12px] leading-[1.3] text-tertiary [hyphens:auto] break-words">
                {es ? "Valor nocional" : "Notional value"}
              </div>
              <div className="tnum text-sm mt-0.5 whitespace-nowrap font-semibold text-primary">
                {fmtUsd(c.positionValue)}
              </div>
            </div>
            <div className="caja-cifra">
              <div className="tnum text-[12px] leading-[1.3] text-tertiary [hyphens:auto] break-words">
                {es ? "Apalancamiento" : "Leverage"}
              </div>
              <div
                className="tnum text-sm font-semibold mt-0.5"
                style={{
                  color: c.leverage > 10 ? "rgb(var(--pnl-neg))" : "var(--ink)",
                }}
              >
                {fmtNum(c.leverage, 1)}x
              </div>
            </div>
            <div className="caja-cifra">
              <div className="tnum text-[12px] leading-[1.3] text-tertiary [hyphens:auto] break-words">
                {es ? "VaR 95 %" : "95% VaR"}
              </div>
              <div className="tnum text-sm mt-0.5 whitespace-nowrap font-semibold text-primary">
                {fmtUsd(c.var95)}
              </div>
            </div>
            <div className="caja-cifra">
              <div className="tnum text-[12px] leading-[1.3] text-tertiary [hyphens:auto] break-words">
                {es ? "Riesgo de ruina" : "Risk of ruin (50%)"}
              </div>
              <div
                className="tnum text-sm font-semibold mt-0.5"
                style={{
                  color: c.riskOfRuin > 1 ? "rgb(var(--pnl-neg))" : "rgb(var(--pnl-pos))",
                }}
              >
                {fmtNum(c.riskOfRuin, 2)}{PCT}
              </div>
            </div>
          </div>

          {/* Barra Riesgo ↔ Beneficio */}
          <div>
            <div className="flex items-center justify-between mb-2 text-xs">
              <span className="tnum inline-flex items-center gap-1.5 text-tertiary">
                <span aria-hidden className="w-1.5 h-1.5 rounded-[1px] bg-[rgb(var(--pnl-neg))]" />
                {es ? "Riesgo" : "Risk"}
              </span>
              <span className="tnum font-semibold text-[rgb(var(--accent-base))]">
                {fmtNum(c.rr, 2)} : 1 R:R
              </span>
              <span className="tnum inline-flex items-center gap-1.5 text-tertiary">
                {es ? "Beneficio" : "Profit"}
                <span aria-hidden className="w-1.5 h-1.5 rounded-[1px] bg-[rgb(var(--pnl-pos))]" />
              </span>
            </div>
            <div className="relative h-2 rounded-[8px] overflow-hidden bg-[rgb(var(--divider)/0.13)]">
              {/* Los dos tramos crecen desde el centro, cada uno hacia su
                  lado, y por eso miden la mitad: anclados a los bordes, el
                  mayor de los dos se iba al 100 % del carril y tapaba al
                  otro entero —con 3:1 la parte roja desaparecía—. */}
              <div
                className="absolute top-0 h-full bg-[rgb(var(--pnl-neg))]"
                style={{ right: "50%", width: `${tramos.riesgo}%` }}
              />
              <div
                className="absolute top-0 h-full bg-[rgb(var(--pnl-pos))]"
                style={{ left: "50%", width: `${tramos.beneficio}%` }}
              />
              <span
                aria-hidden
                className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-px bg-white/40"
              />
            </div>
            <div className="mt-2 flex items-center justify-between tnum text-[12px] text-secondary">
              <span>{fmtUsd(c.riskUsd)}</span>
              <span className="text-tertiary">{fmtNum(c.profitPct, 1)}{PCT} {es ? "del balance" : "of balance"}</span>
              <span>{fmtUsd(c.profit)}</span>
            </div>
          </div>

          {/* Copiar plan */}
          <button
            type="button"
            onClick={copyPlan}
            disabled={!c.valid}
            className="mt-4 -ml-1 inline-flex items-center gap-2 min-h-[44px] px-1 text-[14px] font-medium transition-colors duration-150 text-primary hover:text-[rgb(var(--accent-base))] disabled:opacity-40 disabled:cursor-not-allowed outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--accent-base)/0.55)]"
          >
            {copied ? (
              <>
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M3 8.5l3 3 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span>{es ? "Plan copiado al portapapeles" : "Plan copied to clipboard"}</span>
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <rect x="5" y="5" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M3 11V3.5A1.5 1.5 0 014.5 2H11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                <span>{es ? "Copiar plan de operación" : "Copy trade plan"}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </section>
  );
}

function Result({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    /* `caja-cifra` + `cifra-lg`: la cifra se mide contra el ancho de SU
       celda y encoge de 18 a 13,8 px antes que partirse. Con cuerpo fijo
       se partia por la mitad —«0,20 US|$», «$100.1|0», «20,00 accion|es»—
       en cuanto la celda bajaba de unos 100 px, que es lo que pasa cuando
       esta calculadora vive en la columna estrecha de /features/metricas.
       Una cifra rota en dos lineas deja de leerse como un dato. */
    <div
      className="caja-cifra relative min-w-0 border-t border-[var(--line)] py-3.5"
    >
      <div
        className="tnum text-[12px] text-tertiary"
      >
        {label}
      </div>
      <div
        className="tnum cifra-lg min-w-0 break-words font-semibold mt-1"
        style={{ color }}
      >
        {value}
      </div>
    </div>
  );
}
