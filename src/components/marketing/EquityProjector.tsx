"use client";

import { useState, useMemo, useCallback, useRef } from "react";
import { useLang } from "@/lib/i18n";

/**
 * EquityProjector — Proyector de Curva de Capital y Terminal de Simulación Institucional.
 *
 * Combina un modelo determinista de interés compuesto con análisis de varianza
 * (cono de confianza analítico p10-p90), gestión de aportaciones periódicas,
 * presets de perfiles de trading, desglose año a año y control táctil y de cursor.
 *
 * ── Modelo Cuantitativo ──────────────────────────────────────────────────
 *   netExpectancyR     = (winRate · avgWinR) − ((1 - winRate) · avgLossR) − frictionR
 *   profitFactor       = (winRate · avgWinR) / ((1 - winRate) · avgLossR)
 *   growthPerTrade     = netExpectancyR · (riskPct / 100)
 *
 *   En modo compuesto:
 *     balance(t+1)     = balance(t) · (1 + growthPerTrade)^(tradesPerMonth) + monthlyDeposit
 *   En modo lineal (retiro periódico):
 *     pnlMonth         = startBalance · growthPerTrade · tradesPerMonth
 *
 *   Drawdown estimado (99% confianza):
 *     maxConsecLosses  ≈ ln(0.01) / ln(1 - winRate)
 *     estMaxDD%        = maxConsecLosses · avgLossR · riskPct
 *
 *   Cono de Varianza (Intervalo de confianza ~80%, z = 1.282):
 *     varPerTradeR     = wr·(winR - ExpR)² + (1-wr)·(-lossR - ExpR)²
 *     stdPerTradeR     = sqrt(varPerTradeR)
 *     stdMonthlyGrowth = stdPerTradeR · (riskPct/100) · sqrt(tradesPerMonth)
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
    labelEn: "Prop Firm / Funded",
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

const CAPITAL_CHIPS = [5000, 10000, 25000, 50000, 100000, 250000];
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
  const [frictionR, setFrictionR] = useState(0.02); // R por operación
  const [viewTab, setViewTab] = useState<ViewTab>("chart");
  const [showConfidenceCone, setShowConfidenceCone] = useState(true);
  const [hoverMonthIndex, setHoverMonthIndex] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  const chartRef = useRef<SVGSVGElement | null>(null);

  // Aplicar preset
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

  const onManualParamChange = () => {
    if (selectedPreset !== "custom") {
      setSelectedPreset("custom");
    }
  };

  // ── Motor Cuantitativo ──────────────────────────────────────────
  const c = useMemo(() => {
    const wr = winRate / 100;
    const lr = 1 - wr;

    // Expectancy bruta y neta (tras fricción de comisiones/slippage)
    const grossExpectancyR = wr * avgWinR - lr * avgLossR;
    const netExpectancyR = grossExpectancyR - frictionR;
    const hasEdge = netExpectancyR > 0;

    // Profit factor: Ganancia bruta total esperada / Pérdida bruta total esperada
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

    // Punto inicial (mes 0)
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

    // Simulación mes a mes
    const z80 = 1.282; // 80% confianza bilateral (p10 a p90)
    const monthlyGrowthFactor = Math.pow(1 + Math.max(-0.99, growthPerTrade), tradesPerMonth);

    for (let m = 1; m <= totalMonths; m++) {
      if (reinvestMode === "compound") {
        currentBalance = Math.max(0, currentBalance * monthlyGrowthFactor + monthlyContribution);
      } else {
        // En modo lineal, la ganancia se calcula siempre sobre el capital base
        const monthlyProfit = startBalance * growthPerTrade * tradesPerMonth;
        currentBalance = Math.max(0, currentBalance + monthlyProfit + monthlyContribution);
      }

      totalDeposited += monthlyContribution;

      // Estimación del cono de varianza
      const cumulativeTrades = Math.round(m * tradesPerMonth);
      const stdCumulativeReturn = (stdPerTradeR * (riskPct / 100) * Math.sqrt(cumulativeTrades));
      
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

    // CAGR (Tasa de crecimiento anual compuesto) sobre el capital inicial
    const cagr =
      startBalance > 0 && finalBalance > 0 && years > 0
        ? Math.pow(finalBalance / startBalance, 1 / years) - 1
        : -1;

    // Drawdown estimado (99% confianza)
    const maxConsecLosses = lr > 0 && lr < 1 ? Math.log(0.01) / Math.log(lr) : 0;
    const estMaxDDpct = maxConsecLosses * avgLossR * (riskPct / 100) * 100;

    // Tiempo para duplicar capital (fórmula logarítmica exacta)
    let monthsToDouble: number | null = null;
    if (hasEdge && growthPerTrade > 0) {
      const tradesToDouble = Math.log(2) / Math.log(1 + growthPerTrade);
      monthsToDouble = tradesPerMonth > 0 ? tradesToDouble / tradesPerMonth : null;
    }

    // Expectancy en dólares sobre el balance inicial
    const expectancyUsdInitial = (netExpectancyR * (riskPct / 100)) * startBalance;
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

  // ── Formateadores ────────────────────────────────────────────────
  const fmtUsd = useCallback(
    (n: number, compact = false) => {
      const locale = es ? "es-ES" : "en-US";
      if (compact && Math.abs(n) >= 1_000_000) {
        return `${(n / 1_000_000).toLocaleString(locale, { minimumFractionDigits: 1, maximumFractionDigits: 2 })}M $`;
      }
      if (compact && Math.abs(n) >= 100_000) {
        return `${(n / 1_000).toLocaleString(locale, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}k $`;
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

  // ── Renderizado del Gráfico SVG Interactivo ──────────────────────
  const svgW = 600;
  const svgH = 220;
  const padLeft = 14;
  const padRight = 14;
  const padTop = 18;
  const padBottom = 26;

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
      "M " + medianCoords.map((coord) => `${coord.x.toFixed(1)},${coord.y.toFixed(1)}`).join(" L ");

    const areaPath =
      medianPath +
      ` L ${getX(pts.length - 1).toFixed(1)},${(svgH - padBottom).toFixed(1)} L ${padLeft},${(
        svgH - padBottom
      ).toFixed(1)} Z`;

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
        upperCoords.map((coord) => `${coord.x.toFixed(1)},${coord.y.toFixed(1)}`).join(" L ") +
        " L " +
        lowerCoords.map((coord) => `${coord.x.toFixed(1)},${coord.y.toFixed(1)}`).join(" L ") +
        " Z";
    }

    // Ticks horizontales (milestones)
    const gridYValues = [0.25, 0.5, 0.75, 1.0].map((pct) => {
      const val = minVal + range * pct;
      return { val, y: getY(val) };
    });

    // Ticks verticales por cada año
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
      getX,
      getY,
    };
  }, [c.monthlyPoints, showConfidenceCone, startBalance, years]);

  // Manejo de interacción de cursor / toque sobre el SVG
  const handleSvgMove = (clientX: number) => {
    if (!chartRef.current) return;
    const rect = chartRef.current.getBoundingClientRect();
    const relativeX = clientX - rect.left;
    const pct = Math.max(0, Math.min(1, (relativeX - (padLeft / svgW) * rect.width) / ((svgW - padLeft - padRight) / svgW * rect.width)));
    const targetMonth = Math.round(pct * (c.monthlyPoints.length - 1));
    setHoverMonthIndex(Math.max(0, Math.min(c.monthlyPoints.length - 1, targetMonth)));
  };

  const activePoint =
    hoverMonthIndex !== null ? c.monthlyPoints[hoverMonthIndex] : c.monthlyPoints[c.monthlyPoints.length - 1];
  const activeCoord =
    hoverMonthIndex !== null ? chartData.medianCoords[hoverMonthIndex] : chartData.medianCoords[chartData.medianCoords.length - 1];

  // Copiar resumen institucional al portapapeles
  const copySummary = useCallback(async () => {
    const lines = [
      es ? "PROYECCIÓN DE CURVA DE CAPITAL — CountPips" : "EQUITY CURVE PROJECTION — CountPips",
      "═".repeat(36),
      `${es ? "Perfil" : "Profile"}: ${selectedPreset.toUpperCase()}`,
      `${es ? "Balance Inicial" : "Starting Balance"}: ${fmtUsd(startBalance)}`,
      `${es ? "Aporte Mensual" : "Monthly Contribution"}: ${fmtUsd(monthlyContribution)} / ${es ? "mes" : "mo"}`,
      `${es ? "Horizonte Temporal" : "Time Horizon"}: ${years} ${es ? "años" : "years"} (${tradesPerYear * years} ${es ? "trades totales" : "total trades"})`,
      `${es ? "Modo Reinversión" : "Compounding Mode"}: ${reinvestMode === "compound" ? (es ? "Compuesto Dinámico" : "Dynamic Compounding") : (es ? "Retiro Fijo" : "Fixed Withdrawal")}`,
      "─".repeat(36),
      `${es ? "Métricas de Edge" : "Edge Statistics"}:`,
      `  • Win Rate: ${fmtNum(winRate, 1)} %`,
      `  • Ganancia / Pérdida R: ${fmtNum(avgWinR, 2)} R / ${fmtNum(avgLossR, 2)} R`,
      `  • Expectancy Neta: ${c.netExpectancyR >= 0 ? "+" : ""}${fmtNum(c.netExpectancyR, 3)} R`,
      `  • Profit Factor: ${fmtNum(c.profitFactor, 2)}`,
      `  • Riesgo por Operación: ${fmtNum(riskPct, 2)} %`,
      "─".repeat(36),
      `${es ? "Resultados Proyectados" : "Projected Results"}:`,
      `  • ${es ? "Balance Final" : "Final Balance"}: ${fmtUsd(c.finalBalance)}`,
      `  • ${es ? "Beneficio Neto" : "Net Profit"}: ${fmtUsd(c.finalNetProfit)} (${fmtPct(c.totalReturnPct, 1)})`,
      `  • CAGR: ${fmtPct(c.cagr * 100, 1)}`,
      `  • ${es ? "Max Drawdown Estimado (99%)" : "Estimated Max DD (99%)"}: ${fmtPct(c.estMaxDDpct, 1)}`,
      `  • ${es ? "Tiempo para Duplicar" : "Time to Double"}: ${c.monthsToDouble ? `${fmtNum(c.monthsToDouble, 1)} ${es ? "meses" : "months"}` : "N/A"}`,
      "═".repeat(36),
      es ? "Generado en https://countpips.com/herramientas/proyector-de-capital" : "Generated at https://countpips.com/herramientas/proyector-de-capital",
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

  // Reusable parametric slider with exact number display & touch-target enforcement
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
    <div className="group/param">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <span
            className="tnum"
            style={{
              fontSize: 10,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "var(--ink-3)",
              fontWeight: 600,
            }}
          >
            {label}
          </span>
          {badgeHint && (
            <span
              className="text-[9px] px-1.5 py-0.5 rounded-[2px]"
              style={{
                background: "color-mix(in oklab, var(--surface-2) 80%, transparent)",
                color: "var(--ink-2)",
                border: "1px solid rgb(var(--divider) / 0.10)",
              }}
            >
              {badgeHint}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <span
            className="tnum font-mono inline-flex items-baseline px-2.5 py-0.5 rounded-[2px]"
            style={{
              fontSize: 12.5,
              fontWeight: 700,
              color: "rgb(var(--accent-base))",
              background: "color-mix(in oklab, rgb(var(--accent-base)) 12%, transparent)",
              border: "1px solid color-mix(in oklab, rgb(var(--accent-base)) 30%, transparent)",
            }}
          >
            {fmtNum(value, Number.isInteger(step) ? 0 : 2)}
            <span className="opacity-75 ml-0.5 text-[11px] font-normal">{suffix}</span>
          </span>
        </div>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => {
          onManualParamChange();
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
    <section className="section-tight bg-veil border-t border-[rgb(var(--divider)/0.06)] relative overflow-hidden">
      <div className="tj-container">
        {/* Header institucional */}
        <div className="max-w-3xl mb-10">
          <div className="inline-flex items-center gap-3 mb-4">
            <span
              className="tnum"
              style={{
                fontSize: 11.5,
                fontWeight: 600,
                letterSpacing: "0.08em",
                color: "rgb(var(--accent-base))",
              }}
            >
              § {num}
            </span>
            <span aria-hidden style={{ width: 20, height: 1, background: "rgb(var(--divider) / 0.18)" }} />
            <span
              className="tnum uppercase"
              style={{ fontSize: 10.5, letterSpacing: "0.22em", color: "var(--ink-3)", fontWeight: 600 }}
            >
              {es ? "PROYECTOR CUANTITATIVO DE CAPITAL" : "QUANTITATIVE EQUITY PROJECTOR"}
            </span>
          </div>

          <h2
            className="font-serif m-0"
            style={{
              fontSize: "clamp(2rem, 3.8vw, 3.25rem)",
              fontWeight: 400,
              letterSpacing: "-0.025em",
              lineHeight: 1.06,
              color: "var(--ink)",
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
            className="mt-4 mb-0"
            style={{
              fontSize: "clamp(0.95rem, 1.25vw, 1.08rem)",
              lineHeight: 1.6,
              color: "var(--ink-2)",
              maxWidth: "42em",
            }}
          >
            {es
              ? "Simula la evolución matemática de tu capital considerando frecuencia operativa, fricción de comisiones, reinversión compuesta o retiro de flujos, y el cono de varianza estadística."
              : "Simulate the mathematical evolution of your equity factoring in trade frequency, fee friction, compound reinvestment or payouts, and statistical variance bounds."}
          </p>
        </div>

        {/* Barra de Perfiles / Presets */}
        <div className="mb-8 p-3 rounded-[3px] border border-[rgb(var(--divider)/0.12)] bg-[rgb(var(--divider)/0.03)] backdrop-blur-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[rgb(var(--accent-base))]" />
              <span
                className="tnum text-[10px] uppercase font-semibold tracking-wider"
                style={{ color: "var(--ink-3)" }}
              >
                {es ? "Perfiles de Trading Preconfigurados:" : "Preset Trading Profiles:"}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {PRESETS.map((p) => {
                const active = selectedPreset === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => applyPreset(p.id)}
                    className="group relative px-3 py-1.5 rounded-[2px] text-xs font-mono transition-all duration-150 flex items-center gap-1.5 cursor-pointer"
                    style={{
                      background: active
                        ? "rgb(var(--accent-base))"
                        : "color-mix(in oklab, var(--surface-2) 65%, transparent)",
                      color: active ? "rgb(var(--accent-ink))" : "var(--ink-2)",
                      border: active
                        ? "1px solid rgb(var(--accent-base))"
                        : "1px solid rgb(var(--divider) / 0.12)",
                      fontWeight: active ? 600 : 500,
                    }}
                  >
                    <span>{es ? p.labelEs : p.labelEn}</span>
                    <span
                      className="text-[9px] px-1 py-0.2 rounded-sm opacity-80"
                      style={{
                        background: active
                          ? "rgba(0,0,0,0.18)"
                          : "color-mix(in oklab, var(--surface-2) 90%, transparent)",
                      }}
                    >
                      {es ? p.tagEs : p.tagEn}
                    </span>
                  </button>
                );
              })}

              <button
                type="button"
                onClick={() => setSelectedPreset("custom")}
                className="px-2.5 py-1.5 rounded-[2px] text-xs font-mono transition-all duration-150 cursor-pointer"
                style={{
                  background:
                    selectedPreset === "custom"
                      ? "rgb(var(--accent-base))"
                      : "color-mix(in oklab, var(--surface-2) 30%, transparent)",
                  color: selectedPreset === "custom" ? "rgb(var(--accent-ink))" : "var(--ink-3)",
                  border:
                    selectedPreset === "custom"
                      ? "1px solid rgb(var(--accent-base))"
                      : "1px dashed rgb(var(--divider) / 0.18)",
                  fontWeight: selectedPreset === "custom" ? 600 : 400,
                }}
              >
                {es ? "Manual" : "Custom"}
              </button>
            </div>
          </div>
        </div>

        {/* Cuadrícula Principal: Entradas Paramétricas vs Cockpit de Resultados */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* ══════════ COLUMNA IZQUIERDA: PARÁMETROS (5 cols) ══════════ */}
          <div className="lg:col-span-5 space-y-5">
            
            {/* Bloque 1: Capital, Flujos & Frecuencia */}
            <div
              className="tj-paper p-5 rounded-[3px] border border-[rgb(var(--divider)/0.12)] space-y-4"
              style={{ background: "color-mix(in oklab, var(--surface-2) 40%, transparent)" }}
            >
              <div className="flex items-center justify-between pb-2 border-b border-[rgb(var(--divider)/0.08)]">
                <span className="tnum text-[10px] font-bold uppercase tracking-wider text-[rgb(var(--accent-base))]">
                  01 · {es ? "CAPITAL Y FRECUENCIA" : "CAPITAL & FREQUENCY"}
                </span>
                <span className="text-[11px] font-mono text-[var(--ink-3)]">
                  {fmtUsd(startBalance)}
                </span>
              </div>

              {/* Chips de Capital Rápido */}
              <div>
                <span className="tnum block text-[9.5px] uppercase tracking-wider text-[var(--ink-3)] mb-1.5 font-medium">
                  {es ? "Capital Inicial Rápido:" : "Quick Starting Capital:"}
                </span>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-1">
                  {CAPITAL_CHIPS.map((amt) => {
                    const active = startBalance === amt;
                    return (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => {
                          onManualParamChange();
                          setStartBalance(amt);
                        }}
                        className="py-1 px-1 rounded-[2px] text-[11px] font-mono text-center transition-all cursor-pointer"
                        style={{
                          background: active
                            ? "color-mix(in oklab, rgb(var(--accent-base)) 15%, transparent)"
                            : "transparent",
                          color: active ? "rgb(var(--accent-base))" : "var(--ink-2)",
                          border: active
                            ? "1px solid color-mix(in oklab, rgb(var(--accent-base)) 45%, transparent)"
                            : "1px solid rgb(var(--divider) / 0.12)",
                          fontWeight: active ? 700 : 400,
                        }}
                      >
                        {fmtUsd(amt, true)}
                      </button>
                    );
                  })}
                </div>
              </div>

              {sliderControl(
                es ? "Balance inicial exacto" : "Exact starting balance",
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

              {/* Aporte mensual optativo */}
              <div className="pt-2 border-t border-[rgb(var(--divider)/0.06)]">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="tnum text-[10px] uppercase tracking-wider text-[var(--ink-3)] font-semibold">
                    {es ? "Aporte / Depósito mensual" : "Monthly deposit / cashflow"}
                  </span>
                  <span className="text-[11px] font-mono text-[rgb(var(--accent-base))] font-semibold">
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
                          onManualParamChange();
                          setMonthlyContribution(amt);
                        }}
                        className="py-1 text-[10.5px] font-mono rounded-[2px] transition-all cursor-pointer"
                        style={{
                          background: active
                            ? "color-mix(in oklab, rgb(var(--accent-base)) 14%, transparent)"
                            : "transparent",
                          color: active ? "rgb(var(--accent-base))" : "var(--ink-3)",
                          border: active
                            ? "1px solid color-mix(in oklab, rgb(var(--accent-base)) 40%, transparent)"
                            : "1px solid rgb(var(--divider) / 0.10)",
                          fontWeight: active ? 600 : 400,
                        }}
                      >
                        {amt === 0 ? (es ? "Sin aporte" : "None") : `+${amt}$`}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Bloque 2: Edge Estadístico */}
            <div
              className="tj-paper p-5 rounded-[3px] border border-[rgb(var(--divider)/0.12)] space-y-4"
              style={{ background: "color-mix(in oklab, var(--surface-2) 40%, transparent)" }}
            >
              <div className="flex items-center justify-between pb-2 border-b border-[rgb(var(--divider)/0.08)]">
                <span className="tnum text-[10px] font-bold uppercase tracking-wider text-[rgb(var(--accent-base))]">
                  02 · {es ? "EDGE Y ESTADÍSTICA DE OPERATIVA" : "EDGE & TRADE STATISTICS"}
                </span>
                <span
                  className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-[2px]"
                  style={{
                    color: c.hasEdge ? "rgb(var(--pnl-pos))" : "rgb(var(--pnl-neg))",
                    background: c.hasEdge
                      ? "color-mix(in oklab, rgb(var(--pnl-pos)) 12%, transparent)"
                      : "color-mix(in oklab, rgb(var(--pnl-neg)) 12%, transparent)",
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

              {/* Fricción por comisiones y slippage */}
              <div className="pt-2 border-t border-[rgb(var(--divider)/0.06)] flex items-center justify-between">
                <div>
                  <span className="tnum block text-[10px] uppercase tracking-wider text-[var(--ink-3)] font-semibold">
                    {es ? "Fricción (Comisiones + Slippage)" : "Friction (Fees + Slippage)"}
                  </span>
                  <span className="text-[10px] text-[var(--ink-3)] opacity-80">
                    {es ? "Deducción directa de la expectancy" : "Direct expectancy drag"}
                  </span>
                </div>
                <div className="flex gap-1">
                  {[0.0, 0.02, 0.04, 0.06].map((f) => {
                    const active = frictionR === f;
                    return (
                      <button
                        key={f}
                        type="button"
                        onClick={() => {
                          onManualParamChange();
                          setFrictionR(f);
                        }}
                        className="px-2 py-1 text-[10px] font-mono rounded-[2px] transition-all cursor-pointer"
                        style={{
                          background: active
                            ? "color-mix(in oklab, rgb(var(--accent-base)) 15%, transparent)"
                            : "transparent",
                          color: active ? "rgb(var(--accent-base))" : "var(--ink-3)",
                          border: active
                            ? "1px solid color-mix(in oklab, rgb(var(--accent-base)) 40%, transparent)"
                            : "1px solid rgb(var(--divider) / 0.10)",
                        }}
                      >
                        {f === 0 ? "0R" : `${f}R`}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Bloque 3: Gestión de Riesgo y Horizonte */}
            <div
              className="tj-paper p-5 rounded-[3px] border border-[rgb(var(--divider)/0.12)] space-y-4"
              style={{ background: "color-mix(in oklab, var(--surface-2) 40%, transparent)" }}
            >
              <div className="flex items-center justify-between pb-2 border-b border-[rgb(var(--divider)/0.08)]">
                <span className="tnum text-[10px] font-bold uppercase tracking-wider text-[rgb(var(--accent-base))]">
                  03 · {es ? "GESTIÓN DE RIESGO Y HORIZONTE" : "RISK & HORIZON"}
                </span>
                <span className="text-[10.5px] font-mono text-[var(--ink-3)]">
                  {years} {es ? "Años de proyección" : "Years projection"}
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

              {/* Selector de Horizonte en Años */}
              <div>
                <span className="tnum block text-[9.5px] uppercase tracking-wider text-[var(--ink-3)] mb-1.5 font-medium">
                  {es ? "Horizonte Temporal:" : "Time Horizon:"}
                </span>
                <div className="grid grid-cols-5 gap-1">
                  {HORIZON_CHIPS.map((y) => {
                    const active = years === y;
                    return (
                      <button
                        key={y}
                        type="button"
                        onClick={() => {
                          onManualParamChange();
                          setYears(y);
                        }}
                        className="py-1 text-[11px] font-mono rounded-[2px] transition-all cursor-pointer"
                        style={{
                          background: active
                            ? "color-mix(in oklab, rgb(var(--accent-base)) 14%, transparent)"
                            : "transparent",
                          color: active ? "rgb(var(--accent-base))" : "var(--ink-2)",
                          border: active
                            ? "1px solid color-mix(in oklab, rgb(var(--accent-base)) 40%, transparent)"
                            : "1px solid rgb(var(--divider) / 0.12)",
                          fontWeight: active ? 700 : 400,
                        }}
                      >
                        {y} {es ? (y === 1 ? "año" : "años") : (y === 1 ? "yr" : "yrs")}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Selector de Modo de Reinversión */}
              <div className="pt-2 border-t border-[rgb(var(--divider)/0.06)]">
                <span className="tnum block text-[9.5px] uppercase tracking-wider text-[var(--ink-3)] mb-1.5 font-medium">
                  {es ? "Modelo de Reinversión:" : "Reinvestment Model:"}
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setReinvestMode("compound")}
                    className="p-2 text-left rounded-[2px] transition-all cursor-pointer"
                    style={{
                      background:
                        reinvestMode === "compound"
                          ? "color-mix(in oklab, rgb(var(--accent-base)) 12%, transparent)"
                          : "transparent",
                      border:
                        reinvestMode === "compound"
                          ? "1px solid color-mix(in oklab, rgb(var(--accent-base)) 50%, transparent)"
                          : "1px solid rgb(var(--divider) / 0.10)",
                    }}
                  >
                    <div
                      className="text-[11px] font-mono font-semibold"
                      style={{
                        color: reinvestMode === "compound" ? "rgb(var(--accent-base))" : "var(--ink)",
                      }}
                    >
                      {es ? "Interés Compuesto" : "Compounding"}
                    </div>
                    <div className="text-[9.5px] text-[var(--ink-3)] leading-tight mt-0.5">
                      {es ? "El tamaño escala con el balance" : "Size scales with equity"}
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setReinvestMode("linear")}
                    className="p-2 text-left rounded-[2px] transition-all cursor-pointer"
                    style={{
                      background:
                        reinvestMode === "linear"
                          ? "color-mix(in oklab, rgb(var(--accent-base)) 12%, transparent)"
                          : "transparent",
                      border:
                        reinvestMode === "linear"
                          ? "1px solid color-mix(in oklab, rgb(var(--accent-base)) 50%, transparent)"
                          : "1px solid rgb(var(--divider) / 0.10)",
                    }}
                  >
                    <div
                      className="text-[11px] font-mono font-semibold"
                      style={{
                        color: reinvestMode === "linear" ? "rgb(var(--accent-base))" : "var(--ink)",
                      }}
                    >
                      {es ? "Retiro de PnL / Fijo" : "Fixed / Withdrawal"}
                    </div>
                    <div className="text-[9.5px] text-[var(--ink-3)] leading-tight mt-0.5">
                      {es ? "Riesgo fijo en base inicial" : "Fixed risk on starting cap"}
                    </div>
                  </button>
                </div>
              </div>
            </div>

          </div>

          {/* ══════════ COLUMNA DERECHA: TERMINAL CUANTITATIVO (7 cols) ══════════ */}
          <div className="lg:col-span-7 space-y-5">
            
            {/* Tarjeta Principal del Terminal */}
            <div
              className="tj-paper tj-paper-glow p-6 rounded-[3px] border border-[rgb(var(--divider)/0.14)] relative overflow-hidden"
              style={{
                background:
                  "radial-gradient(ellipse at top right, color-mix(in oklab, rgb(var(--accent-base)) 4%, transparent), transparent 70%), color-mix(in oklab, var(--surface-2) 65%, transparent)",
              }}
            >
              {/* Encabezado del Terminal: Expectancy & Live Status */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[rgb(var(--divider)/0.10)]">
                <div>
                  <div className="tnum flex items-center gap-2" style={{ fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--ink-3)", fontWeight: 600 }}>
                    <span>{es ? "EXPECTANCY NETA POR OPERACIÓN" : "NET EXPECTANCY PER TRADE"}</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-[rgb(var(--accent-base))] animate-pulse" />
                  </div>
                  <div className="flex items-baseline gap-3 mt-1">
                    <span
                      className="tnum font-mono text-3xl sm:text-4xl font-bold tracking-tight"
                      style={{
                        color: c.hasEdge ? "rgb(var(--pnl-pos))" : "rgb(var(--pnl-neg))",
                      }}
                    >
                      {c.netExpectancyR >= 0 ? "+" : ""}
                      {fmtNum(c.netExpectancyR, 3)} R
                    </span>
                    <span className="tnum font-mono text-sm" style={{ color: "var(--ink-2)" }}>
                      ≈ {fmtUsd(c.expectancyUsdInitial)} / {es ? "op." : "trade"}
                    </span>
                  </div>
                </div>

                {/* Badge de Convicción */}
                <div className="text-right sm:text-right">
                  <div
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[2px] text-xs font-mono font-semibold"
                    style={{
                      background: c.hasEdge
                        ? "color-mix(in oklab, rgb(var(--pnl-pos)) 14%, transparent)"
                        : "color-mix(in oklab, rgb(var(--pnl-neg)) 14%, transparent)",
                      color: c.hasEdge ? "rgb(var(--pnl-pos))" : "rgb(var(--pnl-neg))",
                      border: c.hasEdge
                        ? "1px solid color-mix(in oklab, rgb(var(--pnl-pos)) 35%, transparent)"
                        : "1px solid color-mix(in oklab, rgb(var(--pnl-neg)) 35%, transparent)",
                    }}
                  >
                    <span className="w-2 h-2 rounded-full" style={{ background: c.hasEdge ? "rgb(var(--pnl-pos))" : "rgb(var(--pnl-neg))" }} />
                    {c.hasEdge
                      ? es
                        ? "EDGE POSITIVO · MODELO SOSTENIBLE"
                        : "POSITIVE EDGE · SUSTAINABLE"
                      : es
                      ? "EXPECTANCY NEGATIVA · SIN VENTAJA"
                      : "NEGATIVE EXPECTANCY · NO EDGE"}
                  </div>
                  <div className="text-[10px] text-[var(--ink-3)] font-mono mt-1">
                    {es ? "Generación teórica anual:" : "Theoretical yearly generation:"}{" "}
                    <span className="text-[var(--ink)] font-semibold">{fmtUsd(c.yearlyUsdInitial)}</span>
                  </div>
                </div>
              </div>

              {/* Alerta si no hay edge */}
              {!c.hasEdge && (
                <div
                  className="mt-4 p-3 rounded-[2px] text-xs font-mono leading-relaxed"
                  style={{
                    background: "color-mix(in oklab, rgb(var(--pnl-neg)) 12%, transparent)",
                    border: "1px solid color-mix(in oklab, rgb(var(--pnl-neg)) 35%, transparent)",
                    color: "rgb(var(--pnl-neg))",
                  }}
                  role="alert"
                >
                  ⚠{" "}
                  {es
                    ? "Tu esperanza matemática neta es negativa: el interés compuesto y la frecuencia de operaciones jugarán en tu contra. Ajusta tu ratio R o win rate antes de apalancar."
                    : "Your net mathematical expectancy is negative: compounding and trade volume will amplify losses. Adjust your R ratio or win rate before scaling."}
                </div>
              )}

              {/* Selector de Pestaña: Gráfico Interactivo vs Tabla Año a Año */}
              <div className="flex items-center justify-between mt-5 mb-3">
                <div className="flex items-center gap-1.5 p-0.5 rounded-[2px] bg-[rgb(var(--divider)/0.08)]">
                  <button
                    type="button"
                    onClick={() => setViewTab("chart")}
                    className="px-3 py-1 rounded-[2px] text-xs font-mono transition-all cursor-pointer"
                    style={{
                      background: viewTab === "chart" ? "var(--surface-2)" : "transparent",
                      color: viewTab === "chart" ? "var(--ink)" : "var(--ink-3)",
                      fontWeight: viewTab === "chart" ? 600 : 400,
                      boxShadow: viewTab === "chart" ? "0 1px 3px rgba(0,0,0,0.12)" : "none",
                    }}
                  >
                    📈 {es ? "Curva y Varianza" : "Curve & Variance"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewTab("table")}
                    className="px-3 py-1 rounded-[2px] text-xs font-mono transition-all cursor-pointer"
                    style={{
                      background: viewTab === "table" ? "var(--surface-2)" : "transparent",
                      color: viewTab === "table" ? "var(--ink)" : "var(--ink-3)",
                      fontWeight: viewTab === "table" ? 600 : 400,
                      boxShadow: viewTab === "table" ? "0 1px 3px rgba(0,0,0,0.12)" : "none",
                    }}
                  >
                    📋 {es ? "Matriz Año a Año" : "Yearly Matrix"}
                  </button>
                </div>

                {viewTab === "chart" && (
                  <button
                    type="button"
                    onClick={() => setShowConfidenceCone(!showConfidenceCone)}
                    className="text-[10.5px] font-mono px-2.5 py-1 rounded-[2px] transition-all flex items-center gap-1.5 cursor-pointer"
                    style={{
                      background: showConfidenceCone
                        ? "color-mix(in oklab, rgb(var(--accent-base)) 12%, transparent)"
                        : "transparent",
                      color: showConfidenceCone ? "rgb(var(--accent-base))" : "var(--ink-3)",
                      border: "1px solid rgb(var(--divider) / 0.12)",
                    }}
                  >
                    <span
                      className="w-2 h-2 rounded-sm"
                      style={{
                        background: showConfidenceCone ? "rgb(var(--accent-base))" : "transparent",
                        border: "1px solid rgb(var(--accent-base))",
                      }}
                    />
                    {es ? "Cono 80% Varianza" : "80% Variance Cone"}
                  </button>
                )}
              </div>

              {/* VISTA 1: Gráfico Interactivo de Alta Resolución */}
              {viewTab === "chart" && (
                <div className="relative">
                  {/* Tooltip Dinámico Scrubber */}
                  <div
                    className="flex flex-wrap items-center justify-between gap-2 p-2.5 mb-2 rounded-[2px] border border-[rgb(var(--divider)/0.12)] font-mono text-xs"
                    style={{ background: "color-mix(in oklab, var(--surface-2) 75%, transparent)" }}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-[var(--ink-3)] uppercase tracking-wider text-[10px]">
                        {es ? "Hito Inspeccionado:" : "Inspected Milestone:"}
                      </span>
                      <span className="font-bold text-[rgb(var(--accent-base))]">
                        {activePoint.year === 0
                          ? es
                            ? "Inicio (Mes 0)"
                            : "Start (Month 0)"
                          : `${es ? "Año" : "Year"} ${activePoint.year} (${activePoint.month} ${es ? "meses" : "mo"} · ${activePoint.trades} trades)`}
                      </span>
                    </div>

                    <div className="flex items-center gap-4">
                      <div>
                        <span className="text-[var(--ink-3)] text-[10px] mr-1">{es ? "Capital:" : "Equity:"}</span>
                        <span className="font-bold text-[var(--ink)]">{fmtUsd(activePoint.balance)}</span>
                      </div>
                      <div>
                        <span className="text-[var(--ink-3)] text-[10px] mr-1">{es ? "PnL Neto:" : "Net PnL:"}</span>
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

                  {/* SVG Chart con Rejilla y Crosshair */}
                  <div
                    className="relative cursor-crosshair touch-none select-none rounded-[2px] overflow-hidden border border-[rgb(var(--divider)/0.10)]"
                    style={{ background: "color-mix(in oklab, var(--surface-2) 30%, transparent)" }}
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
                      style={{ height: "auto", display: "block" }}
                      aria-label={es ? "Gráfico interactivo de proyección de capital" : "Interactive equity projection chart"}
                    >
                      <defs>
                        <linearGradient id="eq-area-grad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="rgb(var(--accent-base))" stopOpacity="0.30" />
                          <stop offset="100%" stopColor="rgb(var(--accent-base))" stopOpacity="0.01" />
                        </linearGradient>
                        <linearGradient id="eq-cone-grad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="rgb(var(--accent-base))" stopOpacity="0.12" />
                          <stop offset="100%" stopColor="rgb(var(--accent-base))" stopOpacity="0.04" />
                        </linearGradient>
                      </defs>

                      {/* Rejilla de Fondo Horizontal */}
                      {chartData.gridYValues.map((gy, idx) => (
                        <g key={idx}>
                          <line
                            x1={padLeft}
                            y1={gy.y}
                            x2={svgW - padRight}
                            y2={gy.y}
                            stroke="rgb(var(--divider) / 0.12)"
                            strokeDasharray="3 3"
                            strokeWidth="0.8"
                          />
                          <text
                            x={svgW - padRight}
                            y={gy.y - 4}
                            textAnchor="end"
                            fill="var(--ink-3)"
                            fontSize="8.5"
                            fontFamily="monospace"
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
                            stroke="rgb(var(--divider) / 0.10)"
                            strokeDasharray="2 2"
                            strokeWidth="0.8"
                          />
                          <text
                            x={gx.x}
                            y={svgH - 8}
                            textAnchor="middle"
                            fill="var(--ink-3)"
                            fontSize="9"
                            fontFamily="monospace"
                            className="tnum font-medium"
                          >
                            {gx.year === 0 ? (es ? "Inicio" : "Start") : `${es ? "A" : "Y"}${gx.year}`}
                          </text>
                        </g>
                      ))}

                      {/* Cono de Confianza / Varianza */}
                      {showConfidenceCone && chartData.conePath && (
                        <path
                          d={chartData.conePath}
                          fill="url(#eq-cone-grad)"
                          stroke="color-mix(in oklab, rgb(var(--accent-base)) 30%, transparent)"
                          strokeDasharray="2 2"
                          strokeWidth="0.8"
                        />
                      )}

                      {/* Relleno de Área & Línea de Curva Principal */}
                      <path d={chartData.areaPath} fill="url(#eq-area-grad)" />
                      <path
                        d={chartData.medianPath}
                        fill="none"
                        stroke="rgb(var(--accent-base))"
                        strokeWidth="2.2"
                        strokeLinejoin="round"
                        strokeLinecap="round"
                      />

                      {/* Línea Base */}
                      <line
                        x1={padLeft}
                        y1={svgH - padBottom}
                        x2={svgW - padRight}
                        y2={svgH - padBottom}
                        stroke="rgb(var(--divider) / 0.25)"
                        strokeWidth="1"
                      />

                      {/* Crosshair Interactivo */}
                      {activeCoord && (
                        <g>
                          <line
                            x1={activeCoord.x}
                            y1={padTop}
                            x2={activeCoord.x}
                            y2={svgH - padBottom}
                            stroke="rgb(var(--accent-base))"
                            strokeWidth="1"
                            strokeDasharray="2 2"
                          />
                          <circle
                            cx={activeCoord.x}
                            cy={activeCoord.y}
                            r="5"
                            fill="rgb(var(--accent-base))"
                            stroke="var(--surface-2)"
                            strokeWidth="2"
                          />
                          <circle
                            cx={activeCoord.x}
                            cy={activeCoord.y}
                            r="9"
                            fill="none"
                            stroke="rgb(var(--accent-base))"
                            strokeOpacity="0.4"
                            strokeWidth="1.5"
                          />
                        </g>
                      )}
                    </svg>
                  </div>
                </div>
              )}

              {/* VISTA 2: Matriz Año a Año (Desglose Institucional) */}
              {viewTab === "table" && (
                <div className="overflow-x-auto rounded-[2px] border border-[rgb(var(--divider)/0.10)]">
                  <table className="w-full text-left font-mono text-xs">
                    <thead>
                      <tr
                        className="border-b border-[rgb(var(--divider)/0.12)] text-[10px] uppercase tracking-wider text-[var(--ink-3)]"
                        style={{ background: "color-mix(in oklab, var(--surface-2) 60%, transparent)" }}
                      >
                        <th className="py-2.5 px-3">{es ? "Año" : "Year"}</th>
                        <th className="py-2.5 px-3 text-right">{es ? "Balance Inicial" : "Start Bal"}</th>
                        <th className="py-2.5 px-3 text-right">{es ? "PnL Anual" : "Year PnL"}</th>
                        <th className="py-2.5 px-3 text-right">{es ? "Retorno %" : "Return %"}</th>
                        <th className="py-2.5 px-3 text-right">{es ? "Balance Final" : "End Bal"}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[rgb(var(--divider)/0.06)]">
                      {c.yearlyBreakdown.map((row) => (
                        <tr
                          key={row.year}
                          className="hover:bg-[rgb(var(--divider)/0.04)] transition-colors"
                        >
                          <td className="py-2.5 px-3 font-semibold text-[rgb(var(--accent-base))]">
                            {es ? "Año" : "Year"} {row.year}
                          </td>
                          <td className="py-2.5 px-3 text-right text-[var(--ink-2)]">
                            {fmtUsd(row.startBal)}
                          </td>
                          <td
                            className="py-2.5 px-3 text-right font-medium"
                            style={{
                              color: row.yearProfit >= 0 ? "rgb(var(--pnl-pos))" : "rgb(var(--pnl-neg))",
                            }}
                          >
                            {row.yearProfit >= 0 ? "+" : ""}
                            {fmtUsd(row.yearProfit)}
                          </td>
                          <td
                            className="py-2.5 px-3 text-right font-medium"
                            style={{
                              color:
                                row.yearReturnPct >= 0 ? "rgb(var(--pnl-pos))" : "rgb(var(--pnl-neg))",
                            }}
                          >
                            {fmtPct(row.yearReturnPct, 1)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-[var(--ink)]">
                            {fmtUsd(row.endBal)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Matriz de KPIs Institucionales (6 Bloques de Alta Densidad) */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-5">
                
                {/* KPI 1: Balance Final */}
                <div
                  className="p-3.5 rounded-[2px] border border-[rgb(var(--divider)/0.10)] transition-all hover:border-[rgb(var(--accent-base)/0.40)]"
                  style={{ background: "color-mix(in oklab, var(--surface-2) 50%, transparent)" }}
                >
                  <div className="tnum text-[10px] uppercase tracking-wider text-[var(--ink-3)]">
                    {es ? "Balance Final Proyectado" : "Final Projected Balance"}
                  </div>
                  <div className="tnum text-lg sm:text-xl font-mono font-bold mt-1 text-[rgb(var(--accent-base))]">
                    {fmtUsd(c.finalBalance)}
                  </div>
                  <div className="text-[10px] text-[var(--ink-3)] font-mono mt-0.5">
                    {startBalance > 0 ? `${(c.finalBalance / startBalance).toFixed(1)}x capital base` : ""}
                  </div>
                </div>

                {/* KPI 2: CAGR */}
                <div
                  className="p-3.5 rounded-[2px] border border-[rgb(var(--divider)/0.10)] transition-all hover:border-[rgb(var(--accent-base)/0.40)]"
                  style={{ background: "color-mix(in oklab, var(--surface-2) 50%, transparent)" }}
                >
                  <div className="tnum text-[10px] uppercase tracking-wider text-[var(--ink-3)]">
                    CAGR ({es ? "Tasa Anual" : "Annual Rate"})
                  </div>
                  <div
                    className="tnum text-lg sm:text-xl font-mono font-bold mt-1"
                    style={{ color: c.cagr >= 0 ? "rgb(var(--pnl-pos))" : "rgb(var(--pnl-neg))" }}
                  >
                    {fmtPct(c.cagr * 100, 1)}
                  </div>
                  <div className="text-[10px] text-[var(--ink-3)] font-mono mt-0.5">
                    {es ? "Crecimiento geométrico" : "Geometric compound rate"}
                  </div>
                </div>

                {/* KPI 3: Retorno Total % */}
                <div
                  className="p-3.5 rounded-[2px] border border-[rgb(var(--divider)/0.10)] transition-all hover:border-[rgb(var(--accent-base)/0.40)]"
                  style={{ background: "color-mix(in oklab, var(--surface-2) 50%, transparent)" }}
                >
                  <div className="tnum text-[10px] uppercase tracking-wider text-[var(--ink-3)]">
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

                {/* KPI 4: Max Drawdown 99% */}
                <div
                  className="p-3.5 rounded-[2px] border border-[rgb(var(--divider)/0.10)] transition-all hover:border-[rgb(var(--accent-base)/0.40)]"
                  style={{ background: "color-mix(in oklab, var(--surface-2) 50%, transparent)" }}
                >
                  <div className="tnum text-[10px] uppercase tracking-wider text-[var(--ink-3)]">
                    {es ? "Max DD Est. (99% Conf.)" : "Est. Max DD (99% Conf.)"}
                  </div>
                  <div className="tnum text-lg sm:text-xl font-mono font-bold mt-1 text-[rgb(var(--pnl-neg))]">
                    -{fmtPct(c.estMaxDDpct, 1)}
                  </div>
                  <div className="text-[10px] text-[var(--ink-3)] font-mono mt-0.5">
                    {es ? `Racha peor: ~${c.maxConsecLosses} pérdidas` : `Streak: ~${c.maxConsecLosses} losses`}
                  </div>
                </div>

                {/* KPI 5: Tiempo para Duplicar */}
                <div
                  className="p-3.5 rounded-[2px] border border-[rgb(var(--divider)/0.10)] transition-all hover:border-[rgb(var(--accent-base)/0.40)]"
                  style={{ background: "color-mix(in oklab, var(--surface-2) 50%, transparent)" }}
                >
                  <div className="tnum text-[10px] uppercase tracking-wider text-[var(--ink-3)]">
                    {es ? "Tiempo para Duplicar" : "Time to Double (2x)"}
                  </div>
                  <div className="tnum text-lg sm:text-xl font-mono font-bold mt-1 text-[var(--ink)]">
                    {c.monthsToDouble !== null
                      ? `${fmtNum(c.monthsToDouble, 1)} ${es ? "meses" : "mo"}`
                      : "—"}
                  </div>
                  <div className="text-[10px] text-[var(--ink-3)] font-mono mt-0.5">
                    {c.monthsToDouble !== null
                      ? `≈ ${(c.monthsToDouble / 12).toFixed(1)} ${es ? "años" : "years"}`
                      : es ? "Sin crecimiento positivo" : "No positive growth"}
                  </div>
                </div>

                {/* KPI 6: Profit Factor & Half Kelly */}
                <div
                  className="p-3.5 rounded-[2px] border border-[rgb(var(--divider)/0.10)] transition-all hover:border-[rgb(var(--accent-base)/0.40)]"
                  style={{ background: "color-mix(in oklab, var(--surface-2) 50%, transparent)" }}
                >
                  <div className="tnum text-[10px] uppercase tracking-wider text-[var(--ink-3)]">
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

              {/* Barra de Acciones: Copiar Resumen */}
              <div className="mt-5 pt-4 border-t border-[rgb(var(--divider)/0.10)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono text-[var(--ink-3)]">
                    {es ? "Modelo estocástico determinista con cono de varianza." : "Deterministic stochastic model with variance cone."}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={copySummary}
                  className="px-4 py-2 rounded-[2px] text-xs font-mono font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer"
                  style={{
                    background: copied
                      ? "rgb(var(--pnl-pos))"
                      : "color-mix(in oklab, rgb(var(--accent-base)) 15%, transparent)",
                    color: copied ? "#000" : "rgb(var(--accent-base))",
                    border: copied
                      ? "1px solid rgb(var(--pnl-pos))"
                      : "1px solid color-mix(in oklab, rgb(var(--accent-base)) 40%, transparent)",
                  }}
                >
                  <span>{copied ? "✓" : "📋"}</span>
                  <span>
                    {copied
                      ? es
                        ? "¡Resumen Copiado al Portapapeles!"
                        : "Summary Copied to Clipboard!"
                      : es
                      ? "Copiar Resumen de Proyección"
                      : "Copy Projection Summary"}
                  </span>
                </button>
              </div>

              {/* Disclaimer Institucional */}
              <div
                className="mt-4 p-3 rounded-[2px]"
                style={{
                  background: "color-mix(in oklab, var(--surface-2) 30%, transparent)",
                  border: "1px solid rgb(var(--divider) / 0.08)",
                }}
              >
                <p className="tnum m-0 text-[10.5px] leading-relaxed text-[var(--ink-3)]">
                  {es
                    ? "Nota de rigor estadístico: Esta proyección asume una esperanza matemática constante y distribución estacionaria. En mercados reales, los regímenes de volatilidad cambian y las rachas perdedoras pueden ser superiores. El drawdown estimado calcula la racha consecutiva al 99 % de confianza estadística. No constituye asesoramiento financiero ni garantía de rendimiento."
                    : "Statistical rigor notice: This projection assumes stationary distributions and constant expectancy. Real market regimes fluctuate and drawdown clusters can be larger. Estimated max drawdown reflects consecutive losing streaks at 99% statistical confidence. Does not constitute financial advice or profit guarantees."}
                </p>
              </div>

            </div>

          </div>

        </div>

      </div>
    </section>
  );
}
