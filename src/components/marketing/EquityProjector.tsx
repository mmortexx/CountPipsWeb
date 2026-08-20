"use client";

import { useState, useMemo, useCallback, useRef } from "react";
import { useLang } from "@/lib/i18n";
import { Copy, Check, Table, LineChart, Sparkles, Activity, ShieldCheck, ArrowUpRight } from "lucide-react";

/**
 * EquityProjector — Terminal Cuantitativo y Proyector de Curva de Capital de Alta Resolución.
 *
 * Modelo estocástico con cono de varianza analítico (p10–p90), cálculo
 * institucional de expectancy neta, profit factor, drawdown al 99% de
 * confianza, simulador mensual y matriz de retorno año a año.
 */

type PresetKey = "propfirm" | "daytrader" | "swing" | "scalper" | "custom";
type ReinvestMode = "compound" | "linear";
type ViewTab = "chart" | "table";

interface PresetConfig {
  id: PresetKey;
  labelEs: string;
  labelEn: string;
  tagEs: string;
  tagEn: string;
  winRate: number;
  avgWinR: number;
  avgLossR: number;
  riskPct: number;
  tradesPerYear: number;
  frictionR: number;
}

const PRESETS: PresetConfig[] = [
  {
    id: "propfirm",
    labelEs: "Cuentas Fondeadas",
    labelEn: "Prop Firm",
    tagEs: "Riesgo Estricto",
    tagEn: "Strict Risk",
    winRate: 56,
    avgWinR: 1.5,
    avgLossR: 1.0,
    riskPct: 0.5,
    tradesPerYear: 250,
    frictionR: 0.02,
  },
  {
    id: "daytrader",
    labelEs: "Day Trading",
    labelEn: "Day Trading",
    tagEs: "Alta Convicción",
    tagEn: "High Conviction",
    winRate: 52,
    avgWinR: 2.0,
    avgLossR: 1.0,
    riskPct: 1.0,
    tradesPerYear: 200,
    frictionR: 0.03,
  },
  {
    id: "swing",
    labelEs: "Swing Trading",
    labelEn: "Swing Trading",
    tagEs: "Alto R:R",
    tagEn: "High R:R",
    winRate: 42,
    avgWinR: 3.2,
    avgLossR: 1.0,
    riskPct: 1.25,
    tradesPerYear: 90,
    frictionR: 0.02,
  },
  {
    id: "scalper",
    labelEs: "Scalping",
    labelEn: "Scalping",
    tagEs: "Alta Frecuencia",
    tagEn: "High Frequency",
    winRate: 64,
    avgWinR: 1.1,
    avgLossR: 1.0,
    riskPct: 0.35,
    tradesPerYear: 450,
    frictionR: 0.04,
  },
];

const CAPITAL_CHIPS = [
  { v: 5000, label: "$5k" },
  { v: 10000, label: "$10k" },
  { v: 25000, label: "$25k" },
  { v: 50000, label: "$50k" },
  { v: 100000, label: "$100k" },
  { v: 250000, label: "$250k" },
];

const HORIZON_CHIPS = [1, 2, 3, 5, 10];

export function EquityProjector({ num = "03" }: { num?: string }) {
  const { lang } = useLang();
  const es = lang === "es";

  // ── Estado ────────────────────────────────────────────────────────
  const [selectedPreset, setSelectedPreset] = useState<PresetKey>("daytrader");
  const [startBalance, setStartBalance] = useState(10000);
  const [tradesPerYear, setTradesPerYear] = useState(200);
  const [winRate, setWinRate] = useState(52); // %
  const [avgWinR, setAvgWinR] = useState(2.0); // R
  const [avgLossR, setAvgLossR] = useState(1.0); // R
  const [riskPct, setRiskPct] = useState(1.0); // %
  const [years, setYears] = useState(5);
  const [reinvestMode, setReinvestMode] = useState<ReinvestMode>("compound");
  const [monthlyContribution, setMonthlyContribution] = useState(0); // USD / mes
  const [frictionR, setFrictionR] = useState(0.02); // R por trade
  const [viewTab, setViewTab] = useState<ViewTab>("chart");
  const [showConfidenceCone, setShowConfidenceCone] = useState(true);
  const [hoverMonthIndex, setHoverMonthIndex] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  const chartRef = useRef<SVGSVGElement | null>(null);

  // Aplicar Preset
  const applyPreset = useCallback((presetId: PresetKey) => {
    setSelectedPreset(presetId);
    const p = PRESETS.find((item) => item.id === presetId);
    if (p) {
      setWinRate(p.winRate);
      setAvgWinR(p.avgWinR);
      setAvgLossR(p.avgLossR);
      setRiskPct(p.riskPct);
      setTradesPerYear(p.tradesPerYear);
      setFrictionR(p.frictionR);
    }
  }, []);

  const onManualChange = () => {
    if (selectedPreset !== "custom") {
      setSelectedPreset("custom");
    }
  };

  // ── Motor Cuantitativo ──────────────────────────────────────────
  const c = useMemo(() => {
    const wr = winRate / 100;
    const lr = 1 - wr;

    // Expectancy bruta y neta (deduciendo comisiones / slippage)
    const grossExpectancyR = wr * avgWinR - lr * avgLossR;
    const netExpectancyR = grossExpectancyR - frictionR;
    const hasEdge = netExpectancyR > 0;

    // Profit factor
    const grossWinTotal = wr * avgWinR;
    const grossLossTotal = lr * avgLossR;
    const profitFactor = grossLossTotal > 0 ? grossWinTotal / grossLossTotal : 0;

    // Criterio de Kelly institucional
    const b = avgLossR > 0 ? avgWinR / avgLossR : 1;
    const fullKellyPct = b > 0 ? Math.max(0, ((wr * b - lr) / b) * 100) : 0;
    const halfKellyPct = fullKellyPct / 2;

    // Varianza por operación en unidades de R
    const diffWin = avgWinR - grossExpectancyR;
    const diffLoss = -avgLossR - grossExpectancyR;
    const varPerTradeR = Math.max(0, wr * (diffWin * diffWin) + lr * (diffLoss * diffLoss));
    const stdPerTradeR = Math.sqrt(varPerTradeR);

    // Tasa de crecimiento por trade
    const growthPerTrade = (netExpectancyR * riskPct) / 100;
    const tradesPerMonth = tradesPerYear / 12;

    // Simulación mensual
    const totalMonths = years * 12;
    const monthlyPoints: Array<{
      month: number;
      year: number;
      trades: number;
      balance: number;
      lowerBalance: number;
      upperBalance: number;
      totalDeposited: number;
      netProfit: number;
    }> = [];

    let currentBalance = startBalance;
    let totalDeposited = startBalance;

    monthlyPoints.push({
      month: 0,
      year: 0,
      trades: 0,
      balance: currentBalance,
      lowerBalance: currentBalance,
      upperBalance: currentBalance,
      totalDeposited,
      netProfit: 0,
    });

    const z80 = 1.282; // 80% confianza bilateral (p10 a p90)
    const monthlyGrowthFactor = Math.pow(1 + Math.max(-0.99, growthPerTrade), tradesPerMonth);

    for (let m = 1; m <= totalMonths; m++) {
      if (reinvestMode === "compound") {
        currentBalance = Math.max(0, currentBalance * monthlyGrowthFactor + monthlyContribution);
      } else {
        const monthlyProfit = startBalance * growthPerTrade * tradesPerMonth;
        currentBalance = Math.max(0, currentBalance + monthlyProfit + monthlyContribution);
      }

      totalDeposited += monthlyContribution;

      // Estimación analítica del cono de dispersión
      const cumulativeTrades = Math.round(m * tradesPerMonth);
      const stdCumulativeReturn = stdPerTradeR * (riskPct / 100) * Math.sqrt(cumulativeTrades);
      const expectedLogGrowth = cumulativeTrades * Math.log(Math.max(0.001, 1 + growthPerTrade));
      const upperFactor = Math.exp(expectedLogGrowth + z80 * stdCumulativeReturn);
      const lowerFactor = Math.exp(Math.max(-5, expectedLogGrowth - z80 * stdCumulativeReturn));

      const upperBalance = Math.max(0, startBalance * upperFactor + (totalDeposited - startBalance));
      const lowerBalance = Math.max(0, startBalance * lowerFactor + (totalDeposited - startBalance));

      monthlyPoints.push({
        month: m,
        year: Number((m / 12).toFixed(2)),
        trades: cumulativeTrades,
        balance: currentBalance,
        lowerBalance,
        upperBalance,
        totalDeposited,
        netProfit: currentBalance - totalDeposited,
      });
    }

    const finalBalance = monthlyPoints[monthlyPoints.length - 1].balance;
    const finalNetProfit = finalBalance - totalDeposited;
    const totalReturnPct = totalDeposited > 0 ? (finalNetProfit / totalDeposited) * 100 : 0;

    // CAGR (Tasa de crecimiento anual compuesto)
    const cagr =
      startBalance > 0 && finalBalance > 0 && years > 0
        ? Math.pow(finalBalance / startBalance, 1 / years) - 1
        : -1;

    // Drawdown estimado al 99% de confianza
    const maxConsecLosses = lr > 0 && lr < 1 ? Math.log(0.01) / Math.log(lr) : 0;
    const estMaxDDpct = maxConsecLosses * avgLossR * (riskPct / 100) * 100;

    // Tiempo para duplicar capital
    let monthsToDouble: number | null = null;
    if (hasEdge && growthPerTrade > 0) {
      const tradesToDouble = Math.log(2) / Math.log(1 + growthPerTrade);
      monthsToDouble = tradesPerMonth > 0 ? tradesToDouble / tradesPerMonth : null;
    }

    // Expectancy en dólares iniciales
    const expectancyUsdInitial = netExpectancyR * (riskPct / 100) * startBalance;
    const yearlyUsdInitial = expectancyUsdInitial * tradesPerYear;

    // Desglose por años para la tabla
    const yearlyBreakdown: Array<{
      year: number;
      startBal: number;
      endBal: number;
      trades: number;
      yearProfit: number;
      yearReturnPct: number;
      cumulativeProfit: number;
      estDrawdownPct: number;
    }> = [];

    for (let y = 1; y <= years; y++) {
      const startM = (y - 1) * 12;
      const endM = y * 12;
      const startBalYear = monthlyPoints[startM].balance;
      const endBalYear = monthlyPoints[endM].balance;
      const depositsThisYear = monthlyContribution * 12;
      const yearProfit = endBalYear - startBalYear - depositsThisYear;
      const yearReturnPct = startBalYear > 0 ? (yearProfit / startBalYear) * 100 : 0;
      const cumulativeProfit = endBalYear - monthlyPoints[endM].totalDeposited;

      yearlyBreakdown.push({
        year: y,
        startBal: startBalYear,
        endBal: endBalYear,
        trades: tradesPerYear,
        yearProfit,
        yearReturnPct,
        cumulativeProfit,
        estDrawdownPct: estMaxDDpct,
      });
    }

    return {
      grossExpectancyR,
      netExpectancyR,
      hasEdge,
      profitFactor,
      fullKellyPct,
      halfKellyPct,
      growthPerTrade,
      monthlyPoints,
      finalBalance,
      finalNetProfit,
      totalDeposited,
      totalReturnPct,
      cagr,
      maxConsecLosses: Math.max(0, Math.round(maxConsecLosses)),
      estMaxDDpct: Math.max(0, estMaxDDpct),
      monthsToDouble,
      expectancyUsdInitial,
      yearlyUsdInitial,
      yearlyBreakdown,
    };
  }, [
    startBalance,
    tradesPerYear,
    winRate,
    avgWinR,
    avgLossR,
    riskPct,
    years,
    reinvestMode,
    monthlyContribution,
    frictionR,
  ]);

  // ── Formateadores de Alta Fidelidad ──────────────────────────────
  const fmtUsd = useCallback(
    (n: number, compact = false) => {
      const locale = es ? "es-ES" : "en-US";
      if (compact && Math.abs(n) >= 1_000_000) {
        return `$${(n / 1_000_000).toLocaleString(locale, { minimumFractionDigits: 1, maximumFractionDigits: 2 })}M`;
      }
      if (compact && Math.abs(n) >= 10_000) {
        return `$${(n / 1_000).toLocaleString(locale, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}k`;
      }
      return new Intl.NumberFormat(locale, {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      }).format(n);
    },
    [es],
  );

  const fmtNum = useCallback(
    (n: number, dec = 2) => {
      const locale = es ? "es-ES" : "en-US";
      return new Intl.NumberFormat(locale, {
        minimumFractionDigits: dec,
        maximumFractionDigits: dec,
      }).format(n);
    },
    [es],
  );

  const fmtPct = useCallback(
    (n: number, dec = 1) => `${fmtNum(n, dec)} %`,
    [fmtNum],
  );

  // ── Renderizado del Gráfico Vectorial en Ultra Alta Resolución ───
  const svgW = 900;
  const svgH = 320;
  const padLeft = 75;
  const padRight = 24;
  const padTop = 24;
  const padBottom = 34;

  const chartData = useMemo(() => {
    const pts = c.monthlyPoints;
    const allBalances = pts.flatMap((p) =>
      showConfidenceCone ? [p.balance, p.lowerBalance, p.upperBalance] : [p.balance]
    );
    const maxVal = Math.max(...allBalances, startBalance * 1.1, 1);
    const minVal = Math.min(...allBalances, 0);
    const range = maxVal - minVal || 1;

    const getX = (m: number) =>
      padLeft + (m / (pts.length - 1 || 1)) * (svgW - padLeft - padRight);
    const getY = (val: number) =>
      svgH - padBottom - ((val - minVal) / range) * (svgH - padTop - padBottom);

    const medianCoords = pts.map((p) => ({
      x: getX(p.month),
      y: getY(p.balance),
      raw: p,
    }));

    const medianPath =
      "M " + medianCoords.map((coord) => `${coord.x.toFixed(2)},${coord.y.toFixed(2)}`).join(" L ");

    const areaPath =
      medianPath +
      ` L ${getX(pts.length - 1).toFixed(2)},${(svgH - padBottom).toFixed(2)} L ${padLeft},${(
        svgH - padBottom
      ).toFixed(2)} Z`;

    // Cono de confianza (polígono cerrado p10 -> p90)
    let conePath = "";
    if (showConfidenceCone) {
      const upperCoords = pts.map((p) => ({
        x: getX(p.month),
        y: getY(p.upperBalance),
      }));
      const lowerCoords = [...pts].reverse().map((p) => ({
        x: getX(p.month),
        y: getY(p.lowerBalance),
      }));
      conePath =
        "M " +
        upperCoords.map((coord) => `${coord.x.toFixed(2)},${coord.y.toFixed(2)}`).join(" L ") +
        " L " +
        lowerCoords.map((coord) => `${coord.x.toFixed(2)},${coord.y.toFixed(2)}`).join(" L ") +
        " Z";
    }

    // 4 Ticks limpios en el eje Y a la izquierda con separación vertical amplia
    const gridYValues = [0.2, 0.45, 0.72, 0.98].map((pct) => {
      const val = minVal + range * pct;
      return { val, y: getY(val) };
    });

    // Ticks en el eje X por cada año
    const gridXYears = Array.from({ length: years + 1 }, (_, i) => ({
      year: i,
      x: getX(i * 12),
    }));

    return {
      minVal,
      maxVal,
      medianCoords,
      medianPath,
      areaPath,
      conePath,
      gridYValues,
      gridXYears,
    };
  }, [c.monthlyPoints, showConfidenceCone, startBalance, years]);

  // Manejo de interacción de cursor / toque
  const handleSvgMove = (clientX: number) => {
    if (!chartRef.current) return;
    const rect = chartRef.current.getBoundingClientRect();
    const relativeX = clientX - rect.left;
    const pct = Math.max(
      0,
      Math.min(
        1,
        (relativeX - (padLeft / svgW) * rect.width) / (((svgW - padLeft - padRight) / svgW) * rect.width),
      ),
    );
    const targetMonth = Math.round(pct * (c.monthlyPoints.length - 1));
    setHoverMonthIndex(Math.max(0, Math.min(c.monthlyPoints.length - 1, targetMonth)));
  };

  const activePoint =
    hoverMonthIndex !== null ? c.monthlyPoints[hoverMonthIndex] : c.monthlyPoints[c.monthlyPoints.length - 1];
  const activeCoord =
    hoverMonthIndex !== null ? chartData.medianCoords[hoverMonthIndex] : chartData.medianCoords[chartData.medianCoords.length - 1];

  // Copiar resumen al portapapeles
  const copySummary = useCallback(async () => {
    const lines = [
      es ? "PROYECCIÓN DE CURVA DE CAPITAL — CountPips" : "EQUITY CURVE PROJECTION — CountPips",
      "═".repeat(38),
      `${es ? "Perfil" : "Profile"}: ${selectedPreset.toUpperCase()}`,
      `${es ? "Balance Inicial" : "Starting Balance"}: ${fmtUsd(startBalance)}`,
      `${es ? "Aporte Mensual" : "Monthly Deposit"}: ${fmtUsd(monthlyContribution)} / ${es ? "mes" : "mo"}`,
      `${es ? "Horizonte Temporal" : "Time Horizon"}: ${years} ${es ? "años" : "years"} (${tradesPerYear * years} ops)`,
      `${es ? "Modelo Reinversión" : "Compounding Mode"}: ${reinvestMode === "compound" ? (es ? "Interés Compuesto" : "Compounding") : (es ? "Retiro Fijo" : "Fixed")}`,
      "─".repeat(38),
      `${es ? "Métricas de Edge" : "Edge Stats"}:`,
      `  • Win Rate: ${fmtNum(winRate, 1)} %`,
      `  • Ratio Ganancia / Pérdida: ${fmtNum(avgWinR, 2)} R / ${fmtNum(avgLossR, 2)} R`,
      `  • Expectancy Neta: ${c.netExpectancyR >= 0 ? "+" : ""}${fmtNum(c.netExpectancyR, 3)} R`,
      `  • Profit Factor: ${fmtNum(c.profitFactor, 2)}`,
      `  • Riesgo / Op: ${fmtNum(riskPct, 2)} %`,
      "─".repeat(38),
      `${es ? "Resultados Proyectados" : "Projected Results"}:`,
      `  • ${es ? "Balance Final" : "Final Balance"}: ${fmtUsd(c.finalBalance)}`,
      `  • ${es ? "Beneficio Neto" : "Net Profit"}: ${fmtUsd(c.finalNetProfit)} (${fmtPct(c.totalReturnPct, 1)})`,
      `  • CAGR: ${fmtPct(c.cagr * 100, 1)}`,
      `  • ${es ? "Max DD Estimado (99%)" : "Est. Max DD (99%)"}: ${fmtPct(c.estMaxDDpct, 1)}`,
      `  • ${es ? "Tiempo para Duplicar" : "Time to Double"}: ${c.monthsToDouble ? `${fmtNum(c.monthsToDouble, 1)} ${es ? "meses" : "months"}` : "N/A"}`,
      "═".repeat(38),
      "https://countpips.com/herramientas/proyector-de-capital",
    ];

    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      setCopied(true);
      setTimeout(() => setCopied(false), 2400);
    } catch {
      // Fallback
    }
  }, [
    es,
    selectedPreset,
    startBalance,
    monthlyContribution,
    years,
    tradesPerYear,
    reinvestMode,
    winRate,
    avgWinR,
    avgLossR,
    riskPct,
    c,
    fmtUsd,
    fmtNum,
    fmtPct,
  ]);

  // Control deslizador estilizado y accesible
  const sliderControl = (
    label: string,
    value: number,
    min: number,
    max: number,
    step: number,
    onChange: (n: number) => void,
    suffix: string,
    badgeHint?: string,
  ) => (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span
            className="tnum text-[10.5px] font-medium tracking-wide uppercase"
            style={{ color: "var(--ink-2)" }}
          >
            {label}
          </span>
          {badgeHint && (
            <span
              className="text-[9.5px] font-mono px-1.5 py-0.2 rounded-[2px]"
              style={{
                background: "color-mix(in oklab, var(--surface-2) 80%, transparent)",
                color: "var(--ink-3)",
                border: "1px solid rgb(var(--divider) / 0.12)",
              }}
            >
              {badgeHint}
            </span>
          )}
        </div>
        <span
          className="tnum font-mono text-[11.5px] font-bold px-1.5 py-0.2 rounded-[2px] shadow-sm"
          style={{
            color: "rgb(var(--accent-base))",
            background: "color-mix(in oklab, rgb(var(--accent-base)) 12%, transparent)",
            border: "1px solid color-mix(in oklab, rgb(var(--accent-base)) 25%, transparent)",
          }}
        >
          {fmtNum(value, Number.isInteger(step) ? 0 : 2)}
          <span className="opacity-75 ml-0.5 text-[10px] font-normal">{suffix}</span>
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => {
          onManualChange();
          onChange(parseFloat(e.target.value));
        }}
        className="tj-range w-full"
        style={
          {
            accentColor: "rgb(var(--accent-base))",
            height: 44,
            "--pct": `${Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100))}%`,
          } as React.CSSProperties
        }
        aria-label={label}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
      />
    </div>
  );

  return (
    <section className="section-tight bg-veil border-t border-[rgb(var(--divider)/0.08)] relative overflow-hidden">
      <div className="tj-container">
        
        {/* Cabecera Editorial */}
        <div className="max-w-3xl mb-8">
          <div className="inline-flex items-center gap-3 mb-3">
            <span
              className="tnum text-[11.5px] font-semibold tracking-wider text-[rgb(var(--accent-base))]"
            >
              § {num}
            </span>
            <span aria-hidden style={{ width: 22, height: 1, background: "rgb(var(--divider) / 0.22)" }} />
            <span
              className="tnum uppercase text-[10.5px] tracking-[0.2em] font-semibold"
              style={{ color: "var(--ink-3)" }}
            >
              {es ? "TERMINAL CUANTITATIVO · SIMULADOR DE CAPITAL" : "QUANTITATIVE CAPITAL TERMINAL"}
            </span>
          </div>

          <h2
            className="font-serif m-0 text-primary"
            style={{
              fontSize: "clamp(2.1rem, 4vw, 3.4rem)",
              fontWeight: 400,
              letterSpacing: "-0.025em",
              lineHeight: 1.05,
              textWrap: "balance",
            }}
          >
            {es ? (
              <>
                Tu edge, <span style={{ color: "rgb(var(--accent-base))" }}>compuesto</span> con rigor institucional.
              </>
            ) : (
              <>
                Your edge, <span style={{ color: "rgb(var(--accent-base))" }}>compounded</span> with institutional rigor.
              </>
            )}
          </h2>

          <p
            className="mt-3.5 mb-0"
            style={{
              fontSize: "clamp(0.95rem, 1.25vw, 1.08rem)",
              lineHeight: 1.6,
              color: "var(--ink-2)",
              maxWidth: "44em",
            }}
          >
            {es
              ? "Modela con precisión milimétrica la trayectoria de tu capital considerando frecuencia operativa, fricción real de mercado, interés compuesto y el cono de dispersión estocástica."
              : "Model high-precision equity trajectories factoring in trading frequency, market friction, geometric compounding, and stochastic variance cones."}
          </p>
        </div>

        {/* ══════════ COCKPIT INSTITUCIONAL ENCLOSURE ══════════ */}
        <div
          className="w-full rounded-[4px] border overflow-hidden shadow-xl"
          style={{
            borderColor: "rgb(var(--divider) / 0.18)",
            background: "var(--surface-1)",
            boxShadow: "0 15px 35px -10px rgba(0,0,0,0.12)",
          }}
        >
          {/* Barra Superior del Terminal (Titlebar) */}
          <div
            className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b"
            style={{
              borderColor: "rgb(var(--divider) / 0.15)",
              background: "color-mix(in oklab, var(--surface-2) 80%, transparent)",
            }}
          >
            <div className="flex items-center gap-2.5">
              <span
                aria-hidden="true"
                className="px-1.5 py-0.5 rounded-[2px] text-[9.5px] font-mono font-bold"
                style={{
                  background: "color-mix(in oklab, rgb(var(--accent-base)) 15%, transparent)",
                  color: "rgb(var(--accent-base))",
                  border: "1px solid color-mix(in oklab, rgb(var(--accent-base)) 35%, transparent)",
                }}
              >
                WINUI3
              </span>
              <span className="text-[11px] font-mono tracking-wider font-semibold text-[var(--ink)]">
                COUNTPIPS · {es ? "MOTOR CUANTITATIVO DE CAPITAL" : "QUANTITATIVE CAPITAL ENGINE"}
              </span>
            </div>

            {/* Presets Toolbar en la Barra Superior */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 sm:pb-0">
              {PRESETS.map((p) => {
                const active = selectedPreset === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => applyPreset(p.id)}
                    className="px-2.5 py-1 rounded-[2px] text-[11px] font-mono transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5"
                    style={{
                      background: active
                        ? "rgb(var(--accent-base))"
                        : "color-mix(in oklab, var(--surface-1) 70%, transparent)",
                      color: active ? "rgb(var(--accent-ink))" : "var(--ink-2)",
                      border: active
                        ? "1px solid rgb(var(--accent-base))"
                        : "1px solid rgb(var(--divider) / 0.14)",
                      fontWeight: active ? 700 : 500,
                    }}
                  >
                    <span>{es ? p.labelEs : p.labelEn}</span>
                    <span
                      className="text-[9.5px] opacity-75 font-normal px-1 rounded-[1px]"
                      style={{
                        background: active ? "rgba(0,0,0,0.15)" : "rgb(var(--divider) / 0.10)",
                      }}
                    >
                      {es ? p.tagEs : p.tagEn}
                    </span>
                  </button>
                );
              })}

              <button
                type="button"
                aria-pressed={selectedPreset === "custom"}
                onClick={() => setSelectedPreset("custom")}
                className="px-2.5 py-1 rounded-[2px] text-[11px] font-mono transition-all cursor-pointer whitespace-nowrap"
                style={{
                  background:
                    selectedPreset === "custom"
                      ? "rgb(var(--accent-base))"
                      : "transparent",
                  color: selectedPreset === "custom" ? "rgb(var(--accent-ink))" : "var(--ink-3)",
                  border:
                    selectedPreset === "custom"
                      ? "1px solid rgb(var(--accent-base))"
                      : "1px dashed rgb(var(--divider) / 0.22)",
                  fontWeight: selectedPreset === "custom" ? 700 : 400,
                }}
              >
                {es ? "Manual" : "Custom"}
              </button>

              {/* Controles de Ventana Nativos Windows 11 */}
              <div className="hidden sm:flex items-center gap-2.5 pl-2.5 border-l border-[rgb(var(--divider)/0.18)] text-[var(--ink-3)]" aria-hidden="true">
                <svg width="10" height="1" viewBox="0 0 10 1" fill="currentColor" className="opacity-70">
                  <rect width="10" height="1" />
                </svg>
                <svg width="9" height="9" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.1" className="opacity-70">
                  <rect x="0.5" y="0.5" width="9" height="9" />
                </svg>
                <svg width="9" height="9" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.3" className="opacity-70">
                  <path d="M1 1L9 9M9 1L1 9" />
                </svg>
              </div>
            </div>
          </div>

          {/* Cuadrícula Principal: Entradas vs Cockpit */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 divide-y lg:divide-y-0 lg:divide-x divide-[rgb(var(--divider)/0.14)] items-stretch">
            
            {/* ══════════ PANEL IZQUIERDO: PARÁMETROS (5 cols) ══════════ */}
            <div className="lg:col-span-5 p-5 sm:p-6 space-y-5 flex flex-col justify-between" style={{ background: "color-mix(in oklab, var(--surface-1) 60%, transparent)" }}>
              
              {/* Sección 1: Capital */}
              <div className="space-y-3.5">
                <div className="flex items-center justify-between pb-1.5 border-b border-[rgb(var(--divider)/0.10)]">
                  <span className="tnum text-[10.5px] font-bold uppercase tracking-wider text-[rgb(var(--accent-base))] flex items-center gap-1.5">
                    <Activity className="w-3 h-3" />
                    01 · {es ? "CAPITAL Y FRECUENCIA" : "CAPITAL & FREQUENCY"}
                  </span>
                  <span className="text-[11.5px] font-mono text-[var(--ink)] font-bold">
                    {fmtUsd(startBalance)}
                  </span>
                </div>

                {/* Chips de Capital Inicial */}
                <div>
                  <div className="grid grid-cols-6 gap-1">
                    {CAPITAL_CHIPS.map((chip) => {
                      const active = startBalance === chip.v;
                      return (
                        <button
                          key={chip.v}
                          type="button"
                          onClick={() => {
                            onManualChange();
                            setStartBalance(chip.v);
                          }}
                          className="py-1 text-center text-[10.5px] font-mono rounded-[2px] transition-all cursor-pointer"
                          style={{
                            background: active
                              ? "rgb(var(--accent-base))"
                              : "color-mix(in oklab, var(--surface-2) 80%, transparent)",
                            color: active ? "rgb(var(--accent-ink))" : "var(--ink-2)",
                            border: active
                              ? "1px solid rgb(var(--accent-base))"
                              : "1px solid rgb(var(--divider) / 0.12)",
                            fontWeight: active ? 700 : 500,
                          }}
                        >
                          {chip.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {sliderControl(
                  es ? "Balance inicial exacto" : "Exact start balance",
                  startBalance,
                  1000,
                  250000,
                  1000,
                  setStartBalance,
                  " $",
                )}

                {sliderControl(
                  es ? "Operaciones por año" : "Trades per year",
                  tradesPerYear,
                  12,
                  600,
                  4,
                  setTradesPerYear,
                  es ? " ops" : " trades",
                  `≈ ${(tradesPerYear / 12).toFixed(1)} ${es ? "ops/mes" : "trades/mo"}`
                )}

                {/* Aporte mensual */}
                <div className="pt-2 border-t border-[rgb(var(--divider)/0.08)]">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="tnum text-[9.5px] uppercase tracking-wider text-[var(--ink-3)] font-semibold">
                      {es ? "Aporte mensual de ahorro" : "Monthly cashflow injection"}
                    </span>
                    <span className="text-[11px] font-mono text-[rgb(var(--accent-base))] font-bold">
                      +{fmtUsd(monthlyContribution)} / {es ? "mes" : "mo"}
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-1">
                    {[0, 250, 500, 1000].map((amt) => {
                      const active = monthlyContribution === amt;
                      return (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => {
                            onManualChange();
                            setMonthlyContribution(amt);
                          }}
                          className="py-1 text-[10.5px] font-mono rounded-[2px] transition-all cursor-pointer text-center"
                          style={{
                            background: active
                              ? "color-mix(in oklab, rgb(var(--accent-base)) 16%, transparent)"
                              : "color-mix(in oklab, var(--surface-2) 50%, transparent)",
                            color: active ? "rgb(var(--accent-base))" : "var(--ink-3)",
                            border: active
                              ? "1px solid color-mix(in oklab, rgb(var(--accent-base)) 45%, transparent)"
                              : "1px solid rgb(var(--divider) / 0.10)",
                            fontWeight: active ? 700 : 400,
                          }}
                        >
                          {amt === 0 ? (es ? "Sin aporte" : "None") : `+$${amt}`}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Sección 2: Edge */}
              <div className="space-y-3.5 pt-3.5 border-t border-[rgb(var(--divider)/0.12)]">
                <div className="flex items-center justify-between pb-1.5 border-b border-[rgb(var(--divider)/0.10)]">
                  <span className="tnum text-[10.5px] font-bold uppercase tracking-wider text-[rgb(var(--accent-base))] flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3" />
                    02 · {es ? "EDGE Y ESTADÍSTICA DE OPERATIVA" : "EDGE & TRADE STATISTICS"}
                  </span>
                  <span
                    className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-[2px] shadow-sm"
                    style={{
                      color: c.hasEdge ? "rgb(var(--pnl-pos))" : "rgb(var(--pnl-neg))",
                      background: c.hasEdge
                        ? "color-mix(in oklab, rgb(var(--pnl-pos)) 14%, transparent)"
                        : "color-mix(in oklab, rgb(var(--pnl-neg)) 14%, transparent)",
                      border: c.hasEdge
                        ? "1px solid color-mix(in oklab, rgb(var(--pnl-pos)) 35%, transparent)"
                        : "1px solid color-mix(in oklab, rgb(var(--pnl-neg)) 35%, transparent)",
                    }}
                  >
                    PF: {fmtNum(c.profitFactor, 2)}
                  </span>
                </div>

                {sliderControl(
                  es ? "Win Rate (Aciertos)" : "Win Rate",
                  winRate,
                  25,
                  80,
                  1,
                  setWinRate,
                  " %",
                  winRate >= 50 ? (es ? "Edge Favorable" : "Positive WR") : (es ? "Requiere Alto R:R" : "Requires High R:R")
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {sliderControl(
                    es ? "Ganancia Media" : "Avg Win (R)",
                    avgWinR,
                    0.5,
                    6.0,
                    0.1,
                    setAvgWinR,
                    " R"
                  )}
                  {sliderControl(
                    es ? "Pérdida Media" : "Avg Loss (R)",
                    avgLossR,
                    0.25,
                    3.0,
                    0.05,
                    setAvgLossR,
                    " R"
                  )}
                </div>

                {/* Fricción */}
                <div className="pt-2 border-t border-[rgb(var(--divider)/0.08)] flex items-center justify-between">
                  <span className="tnum text-[9.5px] uppercase tracking-wider text-[var(--ink-3)] font-semibold">
                    {es ? "Fricción (Comisiones / Slippage)" : "Friction (Fees / Slippage)"}
                  </span>
                  <div className="flex gap-1">
                    {[0.0, 0.02, 0.04, 0.06].map((f) => {
                      const active = frictionR === f;
                      return (
                        <button
                          key={f}
                          type="button"
                          onClick={() => {
                            onManualChange();
                            setFrictionR(f);
                          }}
                          className="px-2 py-0.5 text-[10.5px] font-mono rounded-[2px] transition-all cursor-pointer"
                          style={{
                            background: active
                              ? "color-mix(in oklab, rgb(var(--accent-base)) 18%, transparent)"
                              : "color-mix(in oklab, var(--surface-2) 50%, transparent)",
                            color: active ? "rgb(var(--accent-base))" : "var(--ink-3)",
                            border: active
                              ? "1px solid color-mix(in oklab, rgb(var(--accent-base)) 45%, transparent)"
                              : "1px solid rgb(var(--divider) / 0.10)",
                            fontWeight: active ? 700 : 400,
                          }}
                        >
                          {f === 0 ? "0R" : `${f}R`}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Sección 3: Riesgo y Horizonte */}
              <div className="space-y-3.5 pt-3.5 border-t border-[rgb(var(--divider)/0.12)]">
                <div className="flex items-center justify-between pb-1.5 border-b border-[rgb(var(--divider)/0.10)]">
                  <span className="tnum text-[10.5px] font-bold uppercase tracking-wider text-[rgb(var(--accent-base))] flex items-center gap-1.5">
                    <ShieldCheck className="w-3 h-3" />
                    03 · {es ? "GESTIÓN DE RIESGO Y HORIZONTE" : "RISK & HORIZON"}
                  </span>
                  <span className="text-[11px] font-mono text-[var(--ink)] font-bold">
                    {years} {es ? "Años" : "Years"}
                  </span>
                </div>

                {sliderControl(
                  es ? "Riesgo por Operación" : "Risk per Trade",
                  riskPct,
                  0.1,
                  3.0,
                  0.05,
                  setRiskPct,
                  " %",
                  `Kelly 1/2: ${fmtNum(c.halfKellyPct, 1)}%`
                )}

                {/* Horizonte */}
                <div>
                  <div className="grid grid-cols-5 gap-1">
                    {HORIZON_CHIPS.map((y) => {
                      const active = years === y;
                      return (
                        <button
                          key={y}
                          type="button"
                          onClick={() => {
                            onManualChange();
                            setYears(y);
                          }}
                          className="py-1 text-[10.5px] font-mono rounded-[2px] transition-all cursor-pointer text-center"
                          style={{
                            background: active
                              ? "rgb(var(--accent-base))"
                              : "color-mix(in oklab, var(--surface-2) 80%, transparent)",
                            color: active ? "rgb(var(--accent-ink))" : "var(--ink-2)",
                            border: active
                              ? "1px solid rgb(var(--accent-base))"
                              : "1px solid rgb(var(--divider) / 0.12)",
                            fontWeight: active ? 700 : 500,
                          }}
                        >
                          {y} {es ? (y === 1 ? "año" : "años") : (y === 1 ? "yr" : "yrs")}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Modelo de Reinversión */}
                <div className="pt-2 border-t border-[rgb(var(--divider)/0.08)]">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setReinvestMode("compound")}
                      className="p-2.5 text-left rounded-[3px] transition-all cursor-pointer"
                      style={{
                        background:
                          reinvestMode === "compound"
                            ? "color-mix(in oklab, rgb(var(--accent-base)) 14%, transparent)"
                            : "color-mix(in oklab, var(--surface-2) 40%, transparent)",
                        border:
                          reinvestMode === "compound"
                            ? "1px solid color-mix(in oklab, rgb(var(--accent-base)) 55%, transparent)"
                            : "1px solid rgb(var(--divider) / 0.12)",
                      }}
                    >
                      <div
                        className="text-[11.5px] font-mono font-semibold flex items-center justify-between"
                        style={{
                          color: reinvestMode === "compound" ? "rgb(var(--accent-base))" : "var(--ink)",
                        }}
                      >
                        <span>{es ? "Interés Compuesto" : "Compounding"}</span>
                        {reinvestMode === "compound" && <span className="w-1.5 h-1.5 rounded-full bg-[rgb(var(--accent-base))]" />}
                      </div>
                      <div className="text-[9.5px] text-[var(--ink-3)] leading-tight mt-0.5">
                        {es ? "Escala con el capital" : "Scales with equity"}
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setReinvestMode("linear")}
                      className="p-2.5 text-left rounded-[3px] transition-all cursor-pointer"
                      style={{
                        background:
                          reinvestMode === "linear"
                            ? "color-mix(in oklab, rgb(var(--accent-base)) 14%, transparent)"
                            : "color-mix(in oklab, var(--surface-2) 40%, transparent)",
                        border:
                          reinvestMode === "linear"
                            ? "1px solid color-mix(in oklab, rgb(var(--accent-base)) 55%, transparent)"
                            : "1px solid rgb(var(--divider) / 0.12)",
                      }}
                    >
                      <div
                        className="text-[11.5px] font-mono font-semibold flex items-center justify-between"
                        style={{
                          color: reinvestMode === "linear" ? "rgb(var(--accent-base))" : "var(--ink)",
                        }}
                      >
                        <span>{es ? "Retiro Fijo / PnL" : "Fixed / Withdrawal"}</span>
                        {reinvestMode === "linear" && <span className="w-1.5 h-1.5 rounded-full bg-[rgb(var(--accent-base))]" />}
                      </div>
                      <div className="text-[9.5px] text-[var(--ink-3)] leading-tight mt-0.5">
                        {es ? "Riesgo fijo en base" : "Fixed on starting"}
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* ══════════ PANEL DERECHO: TERMINAL CUANTITATIVO (7 cols) ══════════ */}
            <div className="lg:col-span-7 p-5 sm:p-6 space-y-5 flex flex-col justify-between" style={{ background: "color-mix(in oklab, var(--surface-1) 40%, transparent)" }}>
              
              {/* Encabezado: Expectancy & Live Status */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[rgb(var(--divider)/0.12)]">
                <div className="min-w-0">
                  <div className="tnum flex items-center gap-2 text-[10px] tracking-wider uppercase font-semibold text-[var(--ink-3)]">
                    <span>{es ? "EXPECTANCY NETA POR OPERACIÓN" : "NET EXPECTANCY PER TRADE"}</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-[rgb(var(--accent-base))]" />
                  </div>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span
                      className="tnum font-mono text-3xl sm:text-4xl font-bold tracking-tight whitespace-nowrap"
                      style={{
                        color: c.hasEdge ? "rgb(var(--pnl-pos))" : "rgb(var(--pnl-neg))",
                        textShadow: c.hasEdge ? "0 0 20px rgb(var(--pnl-pos) / 0.25)" : "none",
                      }}
                    >
                      {c.netExpectancyR >= 0 ? "+" : ""}
                      {fmtNum(c.netExpectancyR, 3)} R
                    </span>
                    <span className="tnum font-mono text-xs whitespace-nowrap" style={{ color: "var(--ink-2)" }}>
                      ≈ {fmtUsd(c.expectancyUsdInitial)} / {es ? "op." : "trade"}
                    </span>
                  </div>
                </div>

                {/* Badge de Convicción */}
                <div className="text-left sm:text-right">
                  <div
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[2px] text-[11px] font-mono font-semibold shadow-sm"
                    style={{
                      background: c.hasEdge
                        ? "color-mix(in oklab, rgb(var(--pnl-pos)) 14%, transparent)"
                        : "color-mix(in oklab, rgb(var(--pnl-neg)) 14%, transparent)",
                      color: c.hasEdge ? "rgb(var(--pnl-pos))" : "rgb(var(--pnl-neg))",
                      border: c.hasEdge
                        ? "1px solid color-mix(in oklab, rgb(var(--pnl-pos)) 40%, transparent)"
                        : "1px solid color-mix(in oklab, rgb(var(--pnl-neg)) 40%, transparent)",
                    }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: c.hasEdge ? "rgb(var(--pnl-pos))" : "rgb(var(--pnl-neg))" }} />
                    <span>
                      {c.hasEdge
                        ? es
                          ? "EDGE POSITIVO · SOSTENIBLE"
                          : "POSITIVE EDGE · SUSTAINABLE"
                        : es
                        ? "EXPECTANCY NEGATIVA"
                        : "NEGATIVE EXPECTANCY"}
                    </span>
                  </div>
                  <div className="text-[10px] text-[var(--ink-3)] font-mono mt-1">
                    {es ? "Generación teórica anual:" : "Yearly theoretical:"}{" "}
                    <span className="text-[var(--ink)] font-bold">{fmtUsd(c.yearlyUsdInitial)}</span>
                  </div>
                </div>
              </div>

              {/* Alerta si no hay edge */}
              {!c.hasEdge && (
                <div
                  className="p-3 rounded-[3px] text-xs font-mono leading-relaxed"
                  style={{
                    background: "color-mix(in oklab, rgb(var(--pnl-neg)) 14%, transparent)",
                    border: "1px solid color-mix(in oklab, rgb(var(--pnl-neg)) 40%, transparent)",
                    color: "rgb(var(--pnl-neg))",
                  }}
                  role="alert"
                >
                  ⚠{" "}
                  {es
                    ? "Tu esperanza matemática neta es negativa: el interés compuesto jugará en tu contra. Ajusta tu ratio R o win rate antes de apalancar."
                    : "Your net expectancy is negative: compounding works against you. Adjust R ratio or win rate before scaling."}
                </div>
              )}

              {/* Selector de Pestaña */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
                <div className="flex items-center gap-1 p-0.5 rounded-[3px] bg-[rgb(var(--divider)/0.10)] border border-[rgb(var(--divider)/0.12)]">
                  <button
                    type="button"
                    onClick={() => setViewTab("chart")}
                    className="px-3 py-1 rounded-[2px] text-[11px] font-mono transition-all flex items-center gap-1.5 cursor-pointer"
                    style={{
                      background: viewTab === "chart" ? "var(--surface-2)" : "transparent",
                      color: viewTab === "chart" ? "var(--ink)" : "var(--ink-3)",
                      fontWeight: viewTab === "chart" ? 600 : 400,
                      boxShadow: viewTab === "chart" ? "0 1px 3px rgba(0,0,0,0.12)" : "none",
                    }}
                  >
                    <LineChart className="w-3.5 h-3.5" />
                    <span>{es ? "Curva y Varianza" : "Curve & Variance"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewTab("table")}
                    className="px-3 py-1 rounded-[2px] text-[11px] font-mono transition-all flex items-center gap-1.5 cursor-pointer"
                    style={{
                      background: viewTab === "table" ? "var(--surface-2)" : "transparent",
                      color: viewTab === "table" ? "var(--ink)" : "var(--ink-3)",
                      fontWeight: viewTab === "table" ? 600 : 400,
                      boxShadow: viewTab === "table" ? "0 1px 3px rgba(0,0,0,0.12)" : "none",
                    }}
                  >
                    <Table className="w-3.5 h-3.5" />
                    <span>{es ? "Matriz Anual" : "Yearly Matrix"}</span>
                  </button>
                </div>

                {viewTab === "chart" && (
                  <button
                    type="button"
                    onClick={() => setShowConfidenceCone(!showConfidenceCone)}
                    className="text-[10.5px] font-mono px-2.5 py-1 rounded-[2px] transition-all flex items-center gap-1.5 cursor-pointer"
                    style={{
                      background: showConfidenceCone
                        ? "color-mix(in oklab, rgb(var(--accent-base)) 14%, transparent)"
                        : "transparent",
                      color: showConfidenceCone ? "rgb(var(--accent-base))" : "var(--ink-3)",
                      border: "1px solid rgb(var(--divider) / 0.15)",
                    }}
                  >
                    <span
                      className="w-2 h-2 rounded-[1px]"
                      style={{
                        background: showConfidenceCone ? "rgb(var(--accent-base))" : "transparent",
                        border: "1px solid rgb(var(--accent-base))",
                      }}
                    />
                    <span>{es ? "Cono 80% Varianza" : "80% Variance Cone"}</span>
                  </button>
                )}
              </div>

              {/* VISTA 1: Gráfico Interactivo de Alta Definición */}
              {viewTab === "chart" && (
                <div className="space-y-2">
                  {/* Tooltip Dinámico Scrubber */}
                  <div
                    className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-[3px] border border-[rgb(var(--divider)/0.15)] font-mono text-xs shadow-sm"
                    style={{ background: "color-mix(in oklab, var(--surface-2) 90%, transparent)" }}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-[var(--ink-3)] uppercase tracking-wider text-[9.5px] font-semibold">
                        {es ? "Hito Inspeccionado:" : "Milestone:"}
                      </span>
                      <span className="font-bold text-[rgb(var(--accent-base))] text-xs">
                        {activePoint.year === 0
                          ? es
                            ? "Inicio (Año 0)"
                            : "Start (Year 0)"
                          : `${es ? "Año" : "Year"} ${activePoint.year} (${activePoint.trades} trades)`}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-xs">
                      <div>
                        <span className="text-[var(--ink-3)] text-[10px] mr-1">{es ? "Capital:" : "Equity:"}</span>
                        <span className="font-bold text-[var(--ink)]">{fmtUsd(activePoint.balance)}</span>
                      </div>
                      <div>
                        <span className="text-[var(--ink-3)] text-[10px] mr-1">PnL:</span>
                        <span
                          className="font-bold"
                          style={{
                            color:
                              activePoint.netProfit >= 0 ? "rgb(var(--pnl-pos))" : "rgb(var(--pnl-neg))",
                          }}
                        >
                          {activePoint.netProfit >= 0 ? "+" : ""}
                          {fmtUsd(activePoint.netProfit)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* SVG Chart con Renderizado Preciso */}
                  <div
                    className="relative cursor-crosshair touch-none select-none rounded-[3px] overflow-hidden border border-[rgb(var(--divider)/0.14)]"
                    style={{ background: "color-mix(in oklab, var(--surface-2) 40%, transparent)" }}
                    onMouseMove={(e) => handleSvgMove(e.clientX)}
                    onTouchMove={(e) => {
                      if (e.touches.length > 0) {
                        handleSvgMove(e.touches[0].clientX);
                      }
                    }}
                    onMouseLeave={() => setHoverMonthIndex(null)}
                    onTouchEnd={() => setHoverMonthIndex(null)}
                  >
                    <svg
                      ref={chartRef}
                      viewBox={`0 0 ${svgW} ${svgH}`}
                      className="w-full"
                      style={{ height: "auto", display: "block", shapeRendering: "geometricPrecision", textRendering: "geometricPrecision" }}
                      aria-label={es ? "Gráfico interactivo de proyección" : "Interactive projection chart"}
                    >
                      <defs>
                        <linearGradient id="eq-area-grad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="rgb(var(--accent-base))" stopOpacity="0.32" />
                          <stop offset="60%" stopColor="rgb(var(--accent-base))" stopOpacity="0.10" />
                          <stop offset="100%" stopColor="rgb(var(--accent-base))" stopOpacity="0.01" />
                        </linearGradient>
                        <linearGradient id="eq-cone-grad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="rgb(var(--accent-base))" stopOpacity="0.14" />
                          <stop offset="100%" stopColor="rgb(var(--accent-base))" stopOpacity="0.03" />
                        </linearGradient>
                        <filter id="eq-glow" x="-20%" y="-20%" width="140%" height="140%">
                          <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="rgb(var(--accent-base))" floodOpacity="0.45" />
                        </filter>
                      </defs>

                      {/* Rejilla Horizontal con Labels a la Izquierda */}
                      {chartData.gridYValues.map((gy, idx) => (
                        <g key={idx}>
                          <line
                            x1={padLeft}
                            y1={gy.y}
                            x2={svgW - padRight}
                            y2={gy.y}
                            stroke="rgb(var(--divider) / 0.14)"
                            strokeDasharray="3 4"
                            strokeWidth="1"
                          />
                          <text
                            x={padLeft - 8}
                            y={gy.y + 3.5}
                            textAnchor="end"
                            fill="var(--ink-3)"
                            fontSize="10"
                            fontFamily="monospace"
                            fontWeight="500"
                            className="tnum"
                          >
                            {fmtUsd(gy.val, true)}
                          </text>
                        </g>
                      ))}

                      {/* Rejilla Vertical por Años */}
                      {chartData.gridXYears.map((gx) => (
                        <g key={gx.year}>
                          <line
                            x1={gx.x}
                            y1={padTop}
                            x2={gx.x}
                            y2={svgH - padBottom}
                            stroke="rgb(var(--divider) / 0.12)"
                            strokeDasharray="2 3"
                            strokeWidth="1"
                          />
                          <text
                            x={gx.x}
                            y={svgH - 10}
                            textAnchor="middle"
                            fill="var(--ink-3)"
                            fontSize="10.5"
                            fontFamily="monospace"
                            fontWeight="600"
                            className="tnum"
                          >
                            {gx.year === 0 ? (es ? "Inicio" : "Start") : `A${gx.year}`}
                          </text>
                        </g>
                      ))}

                      {/* Cono de Confianza */}
                      {showConfidenceCone && chartData.conePath && (
                        <path
                          d={chartData.conePath}
                          fill="url(#eq-cone-grad)"
                          stroke="color-mix(in oklab, rgb(var(--accent-base)) 35%, transparent)"
                          strokeDasharray="3 3"
                          strokeWidth="1"
                        />
                      )}

                      {/* Relleno & Curva Principal con Glow */}
                      <path d={chartData.areaPath} fill="url(#eq-area-grad)" />
                      
                      <path
                        d={chartData.medianPath}
                        fill="none"
                        stroke="rgb(var(--accent-base))"
                        strokeWidth="2.8"
                        strokeLinejoin="round"
                        strokeLinecap="round"
                        filter="url(#eq-glow)"
                      />

                      {/* Línea Base */}
                      <line
                        x1={padLeft}
                        y1={svgH - padBottom}
                        x2={svgW - padRight}
                        y2={svgH - padBottom}
                        stroke="rgb(var(--divider) / 0.30)"
                        strokeWidth="1.2"
                      />

                      {/* Crosshair Laser & Active Marker */}
                      {activeCoord && (
                        <g>
                          <line
                            x1={activeCoord.x}
                            y1={padTop}
                            x2={activeCoord.x}
                            y2={svgH - padBottom}
                            stroke="rgb(var(--accent-base))"
                            strokeWidth="1.2"
                            strokeDasharray="2 2"
                          />
                          <circle
                            cx={activeCoord.x}
                            cy={activeCoord.y}
                            r="6"
                            fill="rgb(var(--accent-base))"
                            stroke="var(--surface-1)"
                            strokeWidth="2.5"
                            filter="url(#eq-glow)"
                          />
                          <circle
                            cx={activeCoord.x}
                            cy={activeCoord.y}
                            r="2"
                            fill="#ffffff"
                          />
                        </g>
                      )}
                    </svg>
                  </div>
                </div>
              )}

              {/* VISTA 2: Matriz Anual */}
              {viewTab === "table" && (
                <div className="overflow-x-auto rounded-[3px] border border-[rgb(var(--divider)/0.14)] shadow-sm">
                  <table className="w-full text-left font-mono text-xs">
                    <thead>
                      <tr
                        className="border-b border-[rgb(var(--divider)/0.14)] text-[10px] uppercase tracking-wider text-[var(--ink-3)]"
                        style={{ background: "color-mix(in oklab, var(--surface-2) 75%, transparent)" }}
                      >
                        <th className="py-2 px-3">{es ? "Año" : "Year"}</th>
                        <th className="py-2 px-3 text-right">{es ? "Balance Inicial" : "Start Bal"}</th>
                        <th className="py-2 px-3 text-right">{es ? "PnL Anual" : "Year PnL"}</th>
                        <th className="py-2 px-3 text-right">{es ? "Retorno %" : "Return %"}</th>
                        <th className="py-2 px-3 text-right">{es ? "Balance Final" : "End Bal"}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[rgb(var(--divider)/0.08)]">
                      {c.yearlyBreakdown.map((row) => (
                        <tr
                          key={row.year}
                          className="hover:bg-[rgb(var(--divider)/0.06)] transition-colors"
                        >
                          <td className="py-2 px-3 font-bold text-[rgb(var(--accent-base))]">
                            {es ? "Año" : "Year"} {row.year}
                          </td>
                          <td className="py-2 px-3 text-right text-[var(--ink-2)]">
                            {fmtUsd(row.startBal)}
                          </td>
                          <td
                            className="py-2 px-3 text-right font-medium"
                            style={{
                              color: row.yearProfit >= 0 ? "rgb(var(--pnl-pos))" : "rgb(var(--pnl-neg))",
                            }}
                          >
                            {row.yearProfit >= 0 ? "+" : ""}
                            {fmtUsd(row.yearProfit)}
                          </td>
                          <td
                            className="py-2 px-3 text-right font-semibold"
                            style={{
                              color:
                                row.yearReturnPct >= 0 ? "rgb(var(--pnl-pos))" : "rgb(var(--pnl-neg))",
                            }}
                          >
                            {fmtPct(row.yearReturnPct, 1)}
                          </td>
                          <td className="py-2 px-3 text-right font-bold text-[var(--ink)]">
                            {fmtUsd(row.endBal)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Matriz de KPIs (6 Bloques de Alta Densidad) */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                <div
                  className="p-3 rounded-[3px] border border-[rgb(var(--divider)/0.12)] shadow-sm"
                  style={{ background: "color-mix(in oklab, var(--surface-2) 60%, transparent)" }}
                >
                  <div className="tnum text-[9.5px] uppercase tracking-wider text-[var(--ink-3)] font-semibold flex items-center justify-between">
                    <span>{es ? "Balance Proyectado" : "Projected Balance"}</span>
                    <ArrowUpRight className="w-3 h-3 text-[rgb(var(--accent-base))]" />
                  </div>
                  <div className="tnum text-lg sm:text-xl font-mono font-bold mt-1 text-[rgb(var(--accent-base))]">
                    {fmtUsd(c.finalBalance)}
                  </div>
                  <div className="text-[10px] text-[var(--ink-3)] font-mono mt-0.5">
                    {startBalance > 0 ? `${(c.finalBalance / startBalance).toFixed(1)}x capital inicial` : ""}
                  </div>
                </div>

                <div
                  className="p-3 rounded-[3px] border border-[rgb(var(--divider)/0.12)] shadow-sm"
                  style={{ background: "color-mix(in oklab, var(--surface-2) 60%, transparent)" }}
                >
                  <div className="tnum text-[9.5px] uppercase tracking-wider text-[var(--ink-3)] font-semibold">
                    CAGR ({es ? "Tasa Anual" : "Annual Rate"})
                  </div>
                  <div
                    className="tnum text-lg sm:text-xl font-mono font-bold mt-1"
                    style={{ color: c.cagr >= 0 ? "rgb(var(--pnl-pos))" : "rgb(var(--pnl-neg))" }}
                  >
                    {fmtPct(c.cagr * 100, 1)}
                  </div>
                  <div className="text-[10px] text-[var(--ink-3)] font-mono mt-0.5">
                    {es ? "Crecimiento geométrico" : "Geometric compound"}
                  </div>
                </div>

                <div
                  className="p-3 rounded-[3px] border border-[rgb(var(--divider)/0.12)] shadow-sm"
                  style={{ background: "color-mix(in oklab, var(--surface-2) 60%, transparent)" }}
                >
                  <div className="tnum text-[9.5px] uppercase tracking-wider text-[var(--ink-3)] font-semibold">
                    {es ? "Retorno Total / PnL" : "Total Return / PnL"}
                  </div>
                  <div
                    className="tnum text-lg sm:text-xl font-mono font-bold mt-1"
                    style={{
                      color: c.totalReturnPct >= 0 ? "rgb(var(--pnl-pos))" : "rgb(var(--pnl-neg))",
                    }}
                  >
                    {c.totalReturnPct >= 0 ? "+" : ""}
                    {fmtPct(c.totalReturnPct, 0)}
                  </div>
                  <div className="text-[10px] text-[var(--ink-3)] font-mono mt-0.5">
                    {c.finalNetProfit >= 0 ? "+" : ""}
                    {fmtUsd(c.finalNetProfit, true)} net
                  </div>
                </div>

                <div
                  className="p-3 rounded-[3px] border border-[rgb(var(--divider)/0.12)] shadow-sm"
                  style={{ background: "color-mix(in oklab, var(--surface-2) 60%, transparent)" }}
                >
                  <div className="tnum text-[9.5px] uppercase tracking-wider text-[var(--ink-3)] font-semibold">
                    {es ? "Max DD Est. (99% Conf.)" : "Est. Max DD (99% Conf.)"}
                  </div>
                  <div className="tnum text-lg sm:text-xl font-mono font-bold mt-1 text-[rgb(var(--pnl-neg))]">
                    -{fmtPct(c.estMaxDDpct, 1)}
                  </div>
                  <div className="text-[10px] text-[var(--ink-3)] font-mono mt-0.5">
                    {es ? `Racha peor: ~${c.maxConsecLosses} pérdidas` : `Streak: ~${c.maxConsecLosses} losses`}
                  </div>
                </div>

                <div
                  className="p-3 rounded-[3px] border border-[rgb(var(--divider)/0.12)] shadow-sm"
                  style={{ background: "color-mix(in oklab, var(--surface-2) 60%, transparent)" }}
                >
                  <div className="tnum text-[9.5px] uppercase tracking-wider text-[var(--ink-3)] font-semibold">
                    {es ? "Tiempo para Duplicar" : "Time to Double (2x)"}
                  </div>
                  <div className="tnum text-lg sm:text-xl font-mono font-bold mt-1 text-[var(--ink)]">
                    {c.monthsToDouble !== null
                      ? `${fmtNum(c.monthsToDouble, 1)} ${es ? "meses" : "mo"}`
                      : "—"}
                  </div>
                  <div className="text-[10px] text-[var(--ink-3)] font-mono mt-0.5">
                    {c.monthsToDouble !== null
                      ? `≈ ${(c.monthsToDouble / 12).toFixed(1)} ${es ? "años" : "yrs"}`
                      : es ? "Sin crecimiento" : "No growth"}
                  </div>
                </div>

                <div
                  className="p-3 rounded-[3px] border border-[rgb(var(--divider)/0.12)] shadow-sm"
                  style={{ background: "color-mix(in oklab, var(--surface-2) 60%, transparent)" }}
                >
                  <div className="tnum text-[9.5px] uppercase tracking-wider text-[var(--ink-3)] font-semibold">
                    Profit Factor / Kelly
                  </div>
                  <div className="tnum text-lg sm:text-xl font-mono font-bold mt-1 text-[var(--ink)]">
                    {fmtNum(c.profitFactor, 2)}
                  </div>
                  <div className="text-[10px] text-[var(--ink-3)] font-mono mt-0.5">
                    {es ? `Sugerido: ${fmtNum(c.halfKellyPct, 1)}% riesgo` : `Rec: ${fmtNum(c.halfKellyPct, 1)}% risk`}
                  </div>
                </div>
              </div>

              {/* Botón de Copiar Resumen y Footer */}
              <div className="pt-3 border-t border-[rgb(var(--divider)/0.12)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <span className="text-[10.5px] font-mono text-[var(--ink-3)]">
                  {es ? "Modelo estocástico determinista con cono de varianza." : "Deterministic stochastic model with variance cone."}
                </span>

                <button
                  type="button"
                  onClick={copySummary}
                  className="px-4 py-2 rounded-[3px] text-xs font-mono font-semibold transition-all cursor-pointer flex items-center justify-center gap-2 shadow-sm"
                  style={{
                    background: copied
                      ? "rgb(var(--pnl-pos))"
                      : "color-mix(in oklab, rgb(var(--accent-base)) 14%, transparent)",
                    color: copied ? "#000000" : "rgb(var(--accent-base))",
                    border: copied
                      ? "1px solid rgb(var(--pnl-pos))"
                      : "1px solid color-mix(in oklab, rgb(var(--accent-base)) 45%, transparent)",
                  }}
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>
                    {copied
                      ? es
                        ? "¡Copiado al Portapapeles!"
                        : "Copied to Clipboard!"
                      : es
                      ? "Copiar Resumen de Proyección"
                      : "Copy Projection Summary"}
                  </span>
                </button>
              </div>

              {/* Disclaimer */}
              <div
                className="p-2.5 rounded-[3px]"
                style={{
                  background: "color-mix(in oklab, var(--surface-2) 40%, transparent)",
                  border: "1px solid rgb(var(--divider) / 0.10)",
                }}
              >
                <p className="tnum m-0 text-[9.5px] leading-relaxed text-[var(--ink-3)]">
                  {es
                    ? "Nota de rigor estadístico: Esta proyección asume una esperanza matemática constante. En mercados reales, los regímenes de volatilidad cambian y las rachas perdedoras pueden ser superiores. El drawdown estimado calcula la racha consecutiva al 99 % de confianza estadística."
                    : "Statistical note: This projection assumes constant mathematical expectancy. In live trading, regimes shift and drawdowns may be larger. Estimated max drawdown models streaks at 99% confidence."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
