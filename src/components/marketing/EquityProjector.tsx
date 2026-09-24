"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { marcasRedondas } from "@/lib/marcasEje";
import { useLang } from "@/lib/i18n";
import { ResultadoAnunciado } from "@/components/tj/ResultadoAnunciado";
import { Copy, Check, Table, LineChart, ArrowUpRight } from "lucide-react";
import { fmtMoney, pctSep, fmtInt, fmtNum as fmtNumCasa } from "@/lib/trading/format";
import { siteUrl } from "@/lib/site";

/** Cuántos decimales (0 a `max`) hacen falta para representar `v` sin ceros
 *  de más: el mismo recorte que hacía `minimumFractionDigits: 0,
 *  maximumFractionDigits: max`, pero para pasarlo al formateador de la
 *  casa en vez de a `toLocaleString` directamente. */
function decimalesSinCeros(v: number, max: number): number {
  const factor = 10 ** max;
  let n = Math.round(Math.abs(v) * factor);
  let d = max;
  while (d > 0 && n % 10 === 0) {
    n /= 10;
    d--;
  }
  return d;
}

/**
 * EquityProjector — Proyector de curva de capital de alta resolución.
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
    labelEs: "Cuenta fondeada",
    labelEn: "Prop firm",
    tagEs: "Riesgo estricto",
    tagEn: "Strict risk",
    winRate: 56,
    avgWinR: 1.5,
    avgLossR: 1.0,
    riskPct: 0.5,
    tradesPerYear: 250,
    frictionR: 0.02,
  },
  {
    id: "daytrader",
    labelEs: "Day trading",
    labelEn: "Day trading",
    tagEs: "Alta convicción",
    tagEn: "High conviction",
    winRate: 52,
    avgWinR: 2.0,
    avgLossR: 1.0,
    riskPct: 1.0,
    tradesPerYear: 200,
    frictionR: 0.03,
  },
  {
    id: "swing",
    labelEs: "Swing trading",
    labelEn: "Swing trading",
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
    tagEs: "Alta frecuencia",
    tagEn: "High frequency",
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

/* El nivel de confianza de la peor racha (abajo, en el motor cuantitativo)
   y el de la banda de varianza del gráfico se citan cada uno en tres
   textos distintos. Una sola constante para cada uno: si el nivel
   cambiara, los textos lo siguen solos en vez de quedar tres números
   sueltos por corregir a mano. */
const CONFIANZA_RACHA = 0.99;
/** Ancho de la banda p10–p90 del cono de varianza. Va emparejado con el
 *  z-score `z80` del motor cuantitativo (abajo): si este cambia, `z80`
 *  tiene que cambiar con él. */
const CONO_CONFIANZA_PCT = 80;

export function EquityProjector() {
  const { lang } = useLang();
  const es = lang === "es";

  // ── Estado ────────────────────────────────────────────────────────
  /* Se abre con el perfil más prudente y a tres años. Con «Day trading» a
     cinco años la primera cifra que veía el visitante era +21.721 %: la
     aritmética era correcta, pero una web que habla como un departamento
     de riesgo no puede abrir con eso. Los valores salen del perfil, así
     que el perfil marcado y sus cifras no pueden discrepar. */
  const inicial = PRESETS[0];
  const [selectedPreset, setSelectedPreset] = useState<PresetKey>(inicial.id);
  const [startBalance, setStartBalance] = useState(10000);
  const [tradesPerYear, setTradesPerYear] = useState(inicial.tradesPerYear);
  const [winRate, setWinRate] = useState(inicial.winRate); // %
  const [avgWinR, setAvgWinR] = useState(inicial.avgWinR); // R
  const [avgLossR, setAvgLossR] = useState(inicial.avgLossR); // R
  const [riskPct, setRiskPct] = useState(inicial.riskPct); // %
  const [years, setYears] = useState(3);
  const [reinvestMode, setReinvestMode] = useState<ReinvestMode>("compound");
  const [monthlyContribution, setMonthlyContribution] = useState(0); // USD / mes
  const [frictionR, setFrictionR] = useState(inicial.frictionR); // R por trade
  const [viewTab, setViewTab] = useState<ViewTab>("chart");
  const [showConfidenceCone, setShowConfidenceCone] = useState(true);
  const [hoverMonthIndex, setHoverMonthIndex] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  const chartRef = useRef<SVGSVGElement | null>(null);
  /* El gráfico se dibuja al ancho real de su caja, en píxeles. Con un
     lienzo fijo de 900 escalado a la caja, en un móvil de 390 todo se
     reducía a un tercio y las cifras de los ejes quedaban en 3–4 px. */
  const cajaGraficoRef = useRef<HTMLDivElement | null>(null);
  const [anchoGrafico, setAnchoGrafico] = useState(900);
  useEffect(() => {
    const caja = cajaGraficoRef.current;
    if (!caja || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(([e]) => {
      const w = Math.round(e.contentRect.width);
      if (w > 0) setAnchoGrafico(w);
    });
    ro.observe(caja);
    return () => ro.disconnect();
  }, []);

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

    const z80 = 1.282; // z-score para CONO_CONFIANZA_PCT (80 %), bilateral (p10 a p90)
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

    // Peor racha a CONFIANZA_RACHA en todo el horizonte: P(racha >= r en N ops) ~ 1 - e^(-N·p·q^r).
    // La caída sale de esa racha, compuesta si se reinvierte; es un suelo, no el máximo.
    const totalTrades = tradesPerYear * years;
    const maxConsecLosses =
      lr > 0 && lr < 1 && wr > 0 && totalTrades > 0
        ? Math.max(1, Math.log(-Math.log(CONFIANZA_RACHA) / (totalTrades * wr)) / Math.log(lr))
        : 0;
    const perdidaPorOp = Math.min(0.99, avgLossR * (riskPct / 100));
    const estMaxDDpct =
      reinvestMode === "compound"
        ? (1 - Math.pow(1 - perdidaPorOp, maxConsecLosses)) * 100
        : Math.min(100, maxConsecLosses * perdidaPorOp * 100);

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
      /* Las abreviadas escribian «$2,18M» tambien en castellano: la
         divisa delante, que es la convencion inglesa, al lado de un
         «2.182.131 US$» de la casilla vecina que sale de `Intl` y la
         pone detras. Ahora cada idioma abrevia como escribe. */
      if (compact && Math.abs(n) >= 1_000_000) {
        const valor = n / 1_000_000;
        const cifra = fmtNumCasa(valor, lang, decimalesSinCeros(valor, 2));
        return es ? `${cifra}\u00a0M $` : `$${cifra}M`;
      }
      if (compact && Math.abs(n) >= 10_000) {
        const cifra = fmtNumCasa(n / 1_000, lang, 0);
        return es ? `${cifra}\u00a0k $` : `$${cifra}k`;
      }
      // Con millares siempre: `Intl` en español deja «1000 $» sin punto.
      return fmtMoney(n, lang, { decimals: 0 });
    },
    [es, lang],
  );

  const fmtNum = useCallback(
    (n: number, dec = 2) => fmtNumCasa(n, lang, dec),
    [lang],
  );

  /* El espacio antes del signo es ESPANOL. En ingles el signo va pegado;
     la casa lo tiene decidido en `PCT_SEP` de lib/trading/format.ts y aqui
     se escribia siempre con espacio, en los dos idiomas. Espacio duro para
     que el signo no se quede solo al principio de la linea siguiente. */
  const fmtPct = useCallback(
    (n: number, dec = 1) => `${fmtNum(n, dec)}${es ? "\u00a0%" : "%"}`,
    [fmtNum, es],
  );

  // ── Renderizado del Gráfico Vectorial en Ultra Alta Resolución ───
  const svgW = anchoGrafico;
  const svgH = Math.round(Math.max(200, Math.min(320, svgW * 0.4)));
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

    const gridYValues = marcasRedondas(minVal, maxVal)
      .filter((val) => val > minVal)
      .map((val) => ({ val, y: getY(val) }));

    // Un rótulo de año cada ~44 px como mínimo; si no caben todos, uno de cada dos.
    const saltoAnios = (svgW - padLeft - padRight) / Math.max(1, years) < 44 ? 2 : 1;
    const gridXYears = Array.from({ length: years + 1 }, (_, i) => ({
      year: i,
      x: getX(i * 12),
      rotulo: i % saltoAnios === 0,
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
  }, [c.monthlyPoints, showConfidenceCone, startBalance, years, svgW, svgH]);

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
      `${es ? "Perfil" : "Profile"}: ${(() => {
        const p = PRESETS.find((x) => x.id === selectedPreset);
        return p ? (es ? p.labelEs : p.labelEn) : es ? "Manual" : "Custom";
      })()}`,
      `${es ? "Balance inicial" : "Starting balance"}: ${fmtUsd(startBalance)}`,
      `${es ? "Aporte mensual" : "Monthly deposit"}: ${fmtUsd(monthlyContribution)} / ${es ? "mes" : "mo"}`,
      `${es ? "Horizonte" : "Time horizon"}: ${years} ${es ? "años" : "years"} (${fmtInt(tradesPerYear * years, lang)} ops)`,
      `${es ? "Reinversión" : "Compounding mode"}: ${reinvestMode === "compound" ? (es ? "Interés compuesto" : "Compounding") : (es ? "Retiro fijo" : "Fixed")}`,
      "─".repeat(38),
      `${es ? "Ventaja" : "Edge"}:`,
      `  • Win rate: ${fmtNum(winRate, 1)}${pctSep(lang)}`,
      `  • ${es ? "Ganancia / pérdida media" : "Average win / loss"}: ${fmtNum(avgWinR, 2)} R / ${fmtNum(avgLossR, 2)} R`,
      `  • ${es ? "Expectancy neta" : "Net expectancy"}: ${c.netExpectancyR >= 0 ? "+" : ""}${fmtNum(c.netExpectancyR, 3)} R`,
      `  • Profit factor: ${fmtNum(c.profitFactor, 2)}`,
      `  • ${es ? "Riesgo por operación" : "Risk per trade"}: ${fmtNum(riskPct, 2)}${pctSep(lang)}`,
      "─".repeat(38),
      `${es ? "Resultados proyectados" : "Projected results"}:`,
      `  • ${es ? "Balance final" : "Final balance"}: ${fmtUsd(c.finalBalance)}`,
      `  • ${es ? "Beneficio neto" : "Net profit"}: ${fmtUsd(c.finalNetProfit)} (${fmtPct(c.totalReturnPct, 1)})`,
      `  • CAGR: ${fmtPct(c.cagr * 100, 1)}`,
      `  • ${es ? "Drawdown máximo estimado" : "Estimated max drawdown"} (${fmtPct(CONFIANZA_RACHA * 100, 0)}): ${fmtPct(c.estMaxDDpct, 1)}`,
      `  • ${es ? "Tiempo para duplicar" : "Time to double"}: ${c.monthsToDouble ? `${fmtNum(c.monthsToDouble, 1)} ${es ? "meses" : "months"}` : "N/A"}`,
      "═".repeat(38),
      siteUrl(`${es ? "" : "/en"}/herramientas/proyector-de-capital/`),
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
    lang,
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
            className="tnum text-[12px] font-medium"
            style={{ color: "var(--ink-2)" }}
          >
            {label}
          </span>
          {badgeHint && (
            <span
              className="text-[12px] tnum"
              style={{ color: "var(--ink-3)" }}
            >
              {badgeHint}
            </span>
          )}
        </div>
        <span
          className="tnum text-[14px] font-semibold"
          style={{ color: "var(--ink)" }}
        >
          {/* El dólar cambia de sitio con el idioma: «10.000 $» en español,
              «$10,000» en inglés. Con el sufijo fijo `" $"` la web inglesa
              componía «10,000 $», que es la forma española del símbolo en
              una página en inglés. Las demás unidades —ops, %, R— sí van
              siempre detrás, así que sólo se bifurca el dinero. */}
          {suffix === " $" ? (
            es ? (
              <>
                {fmtNum(value, 0)}
                <span className="opacity-75 ml-0.5 text-[11px] font-normal"> $</span>
              </>
            ) : (
              <>
                <span className="opacity-75 mr-0.5 text-[11px] font-normal">$</span>
                {fmtNum(value, 0)}
              </>
            )
          ) : (
            <>
              {fmtNum(value, Number.isInteger(step) ? 0 : 2)}
              <span className="opacity-75 ml-0.5 text-[11px] font-normal">{suffix}</span>
            </>
          )}
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
    <section className="section-tight relative overflow-hidden">
      {/* Dónde acaba el capital y a costa de qué: sin el drawdown, la
          cifra final sola es la mitad de la historia y la mitad
          optimista. */}
      <ResultadoAnunciado
        texto={
          es
            ? `Capital final: ${fmtUsd(c.finalBalance)} (${fmtPct(c.totalReturnPct, 1)}). Drawdown máximo estimado: ${fmtPct(c.estMaxDDpct, 1)}.`
            : `Final balance: ${fmtUsd(c.finalBalance)} (${fmtPct(c.totalReturnPct, 1)}). Estimated max drawdown: ${fmtPct(c.estMaxDDpct, 1)}.`
        }
      />
      <div className="tj-container">
        
        {/* Cabecera Editorial */}
        <div className="max-w-3xl mb-8">
          <div className="inline-flex items-center gap-3 mb-3">
            <span className="eyebrow" data-titular-herramienta>
              {/* Decia «TERMINAL CUANTITATIVO · SIMULADOR DE CAPITAL».
                  «Terminal» vuelve a sugerir una pieza de producto, y
                  «Simulador» es peor que vago: es el nombre de una
                  pantalla que la app SI tiene y que no es esta, asi que
                  quien lo lea puede creer que esta viendo aquella. Se
                  nombra la herramienta por su nombre real, el mismo del
                  rotulo del marco y el de `herramientas.ts`. */}
              {es ? "PROYECTOR DE CAPITAL" : "EQUITY PROJECTOR"}
            </span>
          </div>

          <h2 data-titular-herramienta className="t-h2 m-0 text-primary max-w-[24ch]"
          >
            {es ? (
              <>
                Tu edge, <span className="text-gradient">compuesto</span> con rigor institucional.
              </>
            ) : (
              <>
                Your edge, <span className="text-gradient">compounded</span> with institutional rigor.
              </>
            )}
          </h2>

          <p
            className="medida mt-3.5 mb-0"
            style={{
              fontSize: "clamp(0.95rem, 1.25vw, 1.08rem)",
              lineHeight: 1.6,
              color: "var(--ink-2)",
            }}
          >
            {es
              ? "Proyecta tu capital a partir de tu expectancy, tu frecuencia, la fricción del mercado y el interés compuesto, con el margen de variación que cabe esperar. Es un cálculo, no una promesa."
              : "Project your capital from your expectancy, trading frequency, market friction and compounding, with the range of variation to expect. It is a calculation, not a promise."}
          </p>
        </div>

        {/* ══════════ COCKPIT INSTITUCIONAL ENCLOSURE ══════════ */}
        <div
          className="w-full tj-ficha overflow-hidden"
        >
          {/* Cabecera de la herramienta. NO es la barra de titulo de
              una ventana: esto no es una pantalla del programa. */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-[var(--ficha-division)]">
            {/* ── ESTA HERRAMIENTA NO ES UNA PANTALLA DEL PROGRAMA ────
                Aqui habia una insignia «WINUI3» junto al rotulo «MOTOR
                CUANTITATIVO DE CAPITAL», y las dos cosas juntas se leian
                como una captura de la aplicacion de escritorio. No lo es:
                la app no tiene ningun proyector con deslizadores de win
                rate, R medio y horizonte, ni publica CAGR proyectado,
                retorno total ni tiempo para duplicar. Lo que si tiene es
                el Simulador, que contesta la misma pregunta sorteando
                entre las operaciones REALES del trader.

                Era ademas la unica de las ocho herramientas de la web con
                marco de aplicacion; las otras siete no fingen ser el
                programa. El marco se queda —es la caja de la herramienta—
                pero el rotulo la nombra por su nombre real, el mismo que
                usa `src/lib/herramientas.ts` para esta entrada. */}
            <span className="tnum text-[11px] font-medium uppercase tracking-[0.1em] text-[var(--ink-3)]">
              CountPips · {es ? "Proyector de capital" : "Equity projector"}
            </span>

            {/* Presets Toolbar en la Barra Superior */}
            {/* `tj-fila-sigue`: la fila no cabe y se desplaza de lado.
                Sin aviso, la ultima entrada queda partida contra el canto
                y eso no se lee como «hay mas a la derecha» sino como un
                texto cortado. Medido a 390 px: 838 px de contenido en 316. */}
            <div className="tj-fila-sigue flex items-center gap-1.5 overflow-x-auto pb-0.5 sm:pb-0">
              {PRESETS.map((p) => {
                const active = selectedPreset === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => applyPreset(p.id)}
                    className={`toque-comodo px-2.5 py-1 rounded-[4px] text-[12px] tnum transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                      active
                        ? "bg-[color-mix(in_srgb,var(--ink)_9%,transparent)] text-[var(--ink)] font-semibold shadow-[inset_0_0_0_1px_var(--line-2)]"
                        : "text-[var(--ink-2)] font-medium shadow-[inset_0_0_0_1px_var(--ficha-filo)] hover:text-[var(--ink)] hover:bg-[color-mix(in_srgb,var(--ink)_3.5%,transparent)]"
                    }`}
                  >
                    <span>{es ? p.labelEs : p.labelEn}</span>
                    <span className="text-[11px] font-normal text-[var(--ink-3)]">
                      {es ? p.tagEs : p.tagEn}
                    </span>
                  </button>
                );
              })}

              <button
                type="button"
                aria-pressed={selectedPreset === "custom"}
                onClick={() => setSelectedPreset("custom")}
                className={`toque-comodo px-2.5 py-1 rounded-[4px] text-[12px] tnum transition-colors cursor-pointer whitespace-nowrap ${
                  selectedPreset === "custom"
                    ? "bg-[color-mix(in_srgb,var(--ink)_9%,transparent)] text-[var(--ink)] font-semibold shadow-[inset_0_0_0_1px_var(--line-2)]"
                    : "text-[var(--ink-3)] shadow-[inset_0_0_0_1px_var(--ficha-filo)] hover:text-[var(--ink)]"
                }`}
              >
                {es ? "Manual" : "Custom"}
              </button>
            </div>
          </div>

          {/* Cuadrícula Principal: Entradas vs Cockpit */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 divide-y lg:divide-y-0 lg:divide-x divide-[var(--ficha-division)] items-stretch">
            
            {/* ══════════ PANEL IZQUIERDO: PARÁMETROS (5 cols) ══════════ */}
            <div className="lg:col-span-5 p-5 sm:p-6 space-y-5 flex flex-col justify-between">
              
              {/* Sección 1: Capital */}
              <div className="space-y-3.5">
                <div className="flex items-center justify-between pb-2 border-b border-[var(--line)]">
                  <span className="text-[14px] font-semibold text-primary flex items-center gap-2">
                    <span className="tnum text-tertiary font-normal">01</span> {es ? "Capital y frecuencia" : "Capital and frequency"}
                  </span>
                  <span className="text-[13px] tnum text-[var(--ink)] font-semibold">
                    {fmtUsd(startBalance)}
                  </span>
                </div>

                {/* Capital inicial — conmutador segmentado.
                    Eran seis botones sueltos con 4 px de hueco y un
                    filete cada uno: seis rectángulos en fila, que no se
                    leen como UNA elección de seis posibilidades. Ahora
                    son un bloque con su filete exterior y divisiones de
                    un píxel, que es como este sitio separa las celdas de
                    sus cuadros de cifras. Ver `.tj-segmentado`. */}
                <div>
                  <div className="tj-segmentado tj-segmentado-seis" role="group">
                    {CAPITAL_CHIPS.map((chip) => {
                      const active = startBalance === chip.v;
                      return (
                        <button
                          key={chip.v}
                          type="button"
                          aria-pressed={active}
                          onClick={() => {
                            onManualChange();
                            setStartBalance(chip.v);
                          }}
                        >
                          {es ? `${chip.v / 1000}\u00a0k\u00a0$` : chip.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {sliderControl(
                  es ? "Balance inicial" : "Starting balance",
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
                  `≈ ${fmtNum(tradesPerYear / 12, 1)} ${es ? "ops/mes" : "trades/mo"}`
                )}

                {/* Aporte mensual */}
                <div className="pt-2 border-t border-[rgb(var(--divider)/0.08)]">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="tnum text-[12px] text-[var(--ink-3)] font-semibold">
                      {es ? "Aporte mensual" : "Monthly deposit"}
                    </span>
                    <span className="text-[12px] tnum text-[rgb(var(--accent-base))] font-semibold">
                      +{fmtUsd(monthlyContribution)} / {es ? "mes" : "mo"}
                    </span>
                  </div>
                  <div className="tj-segmentado" role="group">
                    {[0, 250, 500, 1000].map((amt) => {
                      const active = monthlyContribution === amt;
                      return (
                        <button
                          key={amt}
                          type="button"
                          aria-pressed={active}
                          onClick={() => {
                            onManualChange();
                            setMonthlyContribution(amt);
                          }}
                        >
                          {amt === 0 ? (es ? "Sin aporte" : "None") : `+${fmtUsd(amt)}`}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Sección 2: Edge */}
              <div className="space-y-3.5 pt-3.5 border-t border-[rgb(var(--divider)/0.12)]">
                <div className="flex items-center justify-between pb-2 border-b border-[var(--line)]">
                  <span className="text-[14px] font-semibold text-primary flex items-center gap-2">
                    <span className="tnum text-tertiary font-normal">02</span> {es ? "Ventaja" : "Edge"}
                  </span>
                  <span
                    className="text-[12px] tnum font-semibold"
                    style={{ color: c.hasEdge ? "rgb(var(--pnl-pos))" : "rgb(var(--pnl-neg))" }}
                  >
                    PF {fmtNum(c.profitFactor, 2)}
                  </span>
                </div>

                {sliderControl(
                  es ? "Win rate" : "Win rate",
                  winRate,
                  25,
                  80,
                  1,
                  setWinRate,
                  pctSep(lang),
                  winRate >= 50 ? (es ? "Por encima del 50\u00a0%" : "Above 50%") : (es ? "Necesita R:R alto" : "Needs a high R:R")
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {sliderControl(
                    es ? "Ganancia media" : "Avg win (R)",
                    avgWinR,
                    0.5,
                    6.0,
                    0.1,
                    setAvgWinR,
                    " R"
                  )}
                  {sliderControl(
                    es ? "Pérdida media" : "Avg loss (R)",
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
                  <span className="tnum text-[12px] text-[var(--ink-3)] font-semibold">
                    {es ? "Costes por operación" : "Costs per trade"}
                  </span>
                  <div className="tj-segmentado" role="group">
                    {[0.0, 0.02, 0.04, 0.06].map((f) => {
                      const active = frictionR === f;
                      return (
                        <button
                          key={f}
                          type="button"
                          aria-pressed={active}
                          onClick={() => {
                            onManualChange();
                            setFrictionR(f);
                          }}
                        >
                          {f === 0 ? `0${es ? "\u00a0" : ""}R` : `${fmtNum(f, 2)}${es ? "\u00a0" : ""}R`}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Sección 3: Riesgo y Horizonte */}
              <div className="space-y-3.5 pt-3.5 border-t border-[rgb(var(--divider)/0.12)]">
                <div className="flex items-center justify-between pb-2 border-b border-[var(--line)]">
                  <span className="text-[14px] font-semibold text-primary flex items-center gap-2">
                    <span className="tnum text-tertiary font-normal">03</span> {es ? "Riesgo y horizonte" : "Risk and horizon"}
                  </span>
                  <span className="text-[12px] tnum text-[var(--ink)] font-semibold">
                    {years} {es ? (years === 1 ? "año" : "años") : (years === 1 ? "year" : "years")}
                  </span>
                </div>

                {sliderControl(
                  es ? "Riesgo por operación" : "Risk per trade",
                  riskPct,
                  0.1,
                  3.0,
                  0.05,
                  setRiskPct,
                  pctSep(lang),
                  `Kelly 1/2: ${fmtPct(c.halfKellyPct, 1)}`
                )}

                {/* Horizonte */}
                <div>
                  <div className="tj-segmentado" role="group">
                    {HORIZON_CHIPS.map((y) => {
                      const active = years === y;
                      return (
                        <button
                          key={y}
                          type="button"
                          aria-pressed={active}
                          onClick={() => {
                            onManualChange();
                            setYears(y);
                          }}
                        >
                          {y}{" "}{es ? (y === 1 ? "año" : "años") : (y === 1 ? "yr" : "yrs")}
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
                      className={`toque-comodo p-2.5 text-left rounded-[4px] transition-colors cursor-pointer ${
                        reinvestMode === "compound"
                          ? "bg-[color-mix(in_srgb,var(--ink)_9%,transparent)] shadow-[inset_0_0_0_1px_var(--line-2)]"
                          : "shadow-[inset_0_0_0_1px_var(--ficha-filo)] hover:bg-[color-mix(in_srgb,var(--ink)_3.5%,transparent)]"
                      }`}
                    >
                      <div className="text-[13px] tnum font-semibold flex items-center justify-between text-[var(--ink)]">
                        <span>{es ? "Interés compuesto" : "Compounding"}</span>
                        {reinvestMode === "compound" && <Check aria-hidden className="w-3.5 h-3.5 text-[var(--ink-2)]" />}
                      </div>
                      {/* `--ink-2` y no `--ink-3`: esta linea vive DENTRO de la
                            opcion, sobre su propia superficie, que es mas
                            clara que el velo contra el que se calibro el
                            terciario. Medido ahi: 4,28:1 en tema oscuro,
                            por debajo del 4,5:1 de AA. Con el secundario
                            sube por encima del listón. */}
                      <div className="text-[11px] text-[var(--ink-2)] leading-tight mt-0.5">
                        {es ? "Escala con el capital" : "Scales with equity"}
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setReinvestMode("linear")}
                      className={`toque-comodo p-2.5 text-left rounded-[4px] transition-colors cursor-pointer ${
                        reinvestMode === "linear"
                          ? "bg-[color-mix(in_srgb,var(--ink)_9%,transparent)] shadow-[inset_0_0_0_1px_var(--line-2)]"
                          : "shadow-[inset_0_0_0_1px_var(--ficha-filo)] hover:bg-[color-mix(in_srgb,var(--ink)_3.5%,transparent)]"
                      }`}
                    >
                      <div className="text-[13px] tnum font-semibold flex items-center justify-between text-[var(--ink)]">
                        <span>{es ? "Retiro fijo" : "Fixed / withdrawal"}</span>
                        {reinvestMode === "linear" && <Check aria-hidden className="w-3.5 h-3.5 text-[var(--ink-2)]" />}
                      </div>
                      {/* `--ink-2` y no `--ink-3`: esta linea vive DENTRO de la
                            opcion, sobre su propia superficie, que es mas
                            clara que el velo contra el que se calibro el
                            terciario. Medido ahi: 4,28:1 en tema oscuro,
                            por debajo del 4,5:1 de AA. Con el secundario
                            sube por encima del listón. */}
                      <div className="text-[11px] text-[var(--ink-2)] leading-tight mt-0.5">
                        {es ? "Riesgo fijo en base" : "Fixed on starting"}
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* ══════════ PANEL DERECHO: RESULTADOS (7 cols) ══════════ */}
            <div className="lg:col-span-7 p-5 sm:p-6 space-y-5 flex flex-col justify-between">
              
              {/* Encabezado: Expectancy & Live Status */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[var(--ficha-division)]">
                <div className="min-w-0">
                  <div className="tnum text-[11px] font-medium uppercase tracking-[0.1em] text-[var(--ink-3)]">
                    {es ? "Expectancy neta por operación" : "Net expectancy per trade"}
                  </div>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span
                      className="tnum text-3xl sm:text-4xl font-semibold tracking-tight whitespace-nowrap"
                      style={{
                        color: c.hasEdge ? "rgb(var(--pnl-pos))" : "rgb(var(--pnl-neg))",
                        textShadow: "none",
                      }}
                    >
                      {c.netExpectancyR >= 0 ? "+" : ""}
                      {fmtNum(c.netExpectancyR, 3)} R
                    </span>
                    <span className="tnum text-xs" style={{ color: "var(--ink-2)" }}>
                      ≈ {fmtUsd(c.expectancyUsdInitial)} / {es ? "op." : "trade"}
                    </span>
                  </div>
                </div>

                {/* Badge de Convicción */}
                <div className="text-left sm:text-right">
                  <div
                    className="inline-flex items-center gap-1.5 text-[12px] font-medium"
                    style={{ color: c.hasEdge ? "rgb(var(--pnl-pos))" : "rgb(var(--pnl-neg))" }}
                  >
                    <span className="w-1.5 h-1.5 rounded-[1px]" style={{ background: c.hasEdge ? "rgb(var(--pnl-pos))" : "rgb(var(--pnl-neg))" }} />
                    <span>
                      {c.hasEdge
                        ? es
                          ? "Expectancy positiva"
                          : "Positive expectancy"
                        : es
                        ? "Expectancy negativa"
                        : "Negative expectancy"}
                    </span>
                  </div>
                  <div className="text-[11px] text-[var(--ink-3)] tnum mt-1">
                    {es ? "Primer año, en teoría:" : "First year, in theory:"}{" "}
                    <span className="text-[var(--ink)] font-semibold">{fmtUsd(c.yearlyUsdInitial)}</span>
                  </div>
                </div>
              </div>

              {/* Alerta si no hay edge */}
              {!c.hasEdge && (
                <div
                  className="border-y border-[var(--ficha-division)] py-3 text-xs tnum leading-relaxed"
                  style={{ color: "rgb(var(--pnl-neg))" }}
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
                <div className="tj-segmentado" role="group">
                  <button
                    type="button"
                    onClick={() => setViewTab("chart")}
                    aria-pressed={viewTab === "chart"}
                    className="px-3 text-[12px] tnum flex items-center gap-1.5 cursor-pointer"
                  >
                    <LineChart aria-hidden className="w-3.5 h-3.5" />
                    <span>{es ? "Curva" : "Curve"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewTab("table")}
                    aria-pressed={viewTab === "table"}
                    className="px-3 text-[12px] tnum flex items-center gap-1.5 cursor-pointer"
                  >
                    <Table aria-hidden className="w-3.5 h-3.5" />
                    <span>{es ? "Por años" : "By year"}</span>
                  </button>
                </div>

                {viewTab === "chart" && (
                  <button
                    type="button"
                    onClick={() => setShowConfidenceCone(!showConfidenceCone)}
                    className="toque-comodo text-[12px] tnum px-2.5 py-1 rounded-[4px] transition-all flex items-center gap-1.5 cursor-pointer"
                    aria-pressed={showConfidenceCone}
                    style={{ color: showConfidenceCone ? "var(--ink)" : "var(--ink-3)" }}
                  >
                    <span
                      className="w-2 h-2 rounded-[1px]"
                      style={{
                        background: showConfidenceCone ? "rgb(var(--accent-base))" : "transparent",
                        border: "1px solid rgb(var(--accent-base))",
                      }}
                    />
                    <span>{es ? `Banda del ${fmtPct(CONO_CONFIANZA_PCT, 0)}` : `${fmtPct(CONO_CONFIANZA_PCT, 0)} band`}</span>
                  </button>
                )}
              </div>

              {/* VISTA 1: Gráfico Interactivo de Alta Definición */}
              {viewTab === "chart" && (
                <div className="space-y-2">
                  {/* Tooltip Dinámico Scrubber */}
                  <div
                    className="flex flex-wrap items-center justify-between gap-2 border-y border-[var(--ficha-division)] py-2.5 tnum text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-[var(--ink-3)] text-[12px] font-semibold">
                        {es ? "Punto:" : "Point:"}
                      </span>
                      <span className="font-semibold text-[rgb(var(--accent-base))] text-xs">
                        {activePoint.year === 0
                          ? es
                            ? "Inicio (Año 0)"
                            : "Start (Year 0)"
                          : `${es ? "Año" : "Year"} ${fmtNumCasa(activePoint.year, lang, decimalesSinCeros(activePoint.year, 2))} (${fmtInt(activePoint.trades, lang)} ${es ? "ops" : "trades"})`}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                      <div>
                        <span className="text-[var(--ink-3)] text-[11px] mr-1">{es ? "Capital:" : "Equity:"}</span>
                        <span className="font-semibold text-[var(--ink)]">{fmtUsd(activePoint.balance)}</span>
                      </div>
                      <div>
                        <span className="text-[var(--ink-3)] text-[11px] mr-1">PnL:</span>
                        <span
                          className="font-semibold"
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
                    ref={cajaGraficoRef}
                    className="relative cursor-crosshair touch-none select-none rounded-[8px] overflow-hidden"
                    style={{ boxShadow: "inset 0 0 0 1px var(--ficha-division)" }}
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
                            fontSize="11"
                            fontWeight="500"
                            style={{ fontFamily: "var(--font-mono)" }}
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
                          {gx.rotulo && (
                            <text
                              x={gx.x}
                              y={svgH - 11}
                              textAnchor={gx.year === 0 ? "start" : gx.year === years ? "end" : "middle"}
                              fill="var(--ink-3)"
                              fontSize="11"
                              fontWeight="500"
                              style={{ fontFamily: "var(--font-mono)" }}
                              className="tnum"
                            >
                              {gx.year === 0 ? (es ? "Inicio" : "Start") : `${es ? "A" : "Y"}${gx.year}`}
                            </text>
                          )}
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
                        strokeWidth="2.4"
                        strokeLinejoin="round"
                        strokeLinecap="round"
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
                            stroke="var(--ficha-fondo)"
                            strokeWidth="2.5"
                          />
                          <circle
                            cx={activeCoord.x}
                            cy={activeCoord.y}
                            r="2"
                            fill="rgb(var(--accent-ink))"
                          />
                        </g>
                      )}
                    </svg>
                  </div>
                </div>
              )}

              {/* VISTA 2: Matriz Anual */}
              {viewTab === "table" && (
                /* ── LA MATRIZ, COMO UN CUADRO DE UN INFORME ──────────
                   Era una tabla correcta y sin voz: cabecera con un
                   fondo gris, filas separadas por una línea al 8 % y
                   nada que dijera dónde acaba la cuenta. Cinco filas de
                   cifras que se leen todas igual de importantes.

                   Ahora sigue las convenciones de un cuadro impreso, que
                   son las mismas que ya usa el resto del sitio:

                   · La cabecera se remata con FILETE DOBLE —el mismo de
                     los pies de lámina—, no con una banda de color.
                   · El último ejercicio es el RESULTADO, y va marcado
                     como tal: filete doble encima y tinta plena. Es la
                     cifra a la que se viene, y antes se perdía entre las
                     demás.
                   · Cada fila lleva su BARRA de balance, dibujada al
                     fondo de la celda final en proporción al mayor de la
                     serie. No es adorno: convierte una columna de
                     números en una curva que se lee de un vistazo, que
                     es justo lo que la herramienta quiere enseñar.
                   · Los años van en versalitas de tinta, no en acento:
                     el color se reserva para el signo del resultado. */
                <div className="overflow-x-auto rounded-[8px]">
                  <table className="w-full text-left tnum text-xs">
                    <thead>
                      <tr className="text-[12px] text-[var(--ink-3)]">
                        <th className="tj-matriz-cab py-2.5 px-3 font-medium">{es ? "Año" : "Year"}</th>
                        <th className="tj-matriz-cab py-2.5 px-3 text-right font-medium">{es ? "Balance inicial" : "Start balance"}</th>
                        <th className="tj-matriz-cab py-2.5 px-3 text-right font-medium">{es ? "Resultado del año" : "Year P&L"}</th>
                        <th className="tj-matriz-cab py-2.5 px-3 text-right font-medium">{es ? "Rentabilidad" : "Return"}</th>
                        <th className="tj-matriz-cab py-2.5 px-3 text-right font-medium">{es ? "Balance final" : "End balance"}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {c.yearlyBreakdown.map((row, i) => {
                        const ultimo = i === c.yearlyBreakdown.length - 1;
                        const techo = Math.max(
                          ...c.yearlyBreakdown.map((r) => Math.abs(r.endBal)),
                          1,
                        );
                        const cuota = Math.max(0, Math.min(1, row.endBal / techo));
                        return (
                          <tr
                            key={row.year}
                            className={`transition-colors hover:bg-[rgb(var(--divider)/0.06)] ${
                              ultimo ? "tj-matriz-total" : "border-t border-[rgb(var(--divider)/0.09)]"
                            }`}
                          >
                            <td
                              className="py-2 px-3"
                              style={{ color: "var(--ink-2)" }}
                            >
                              {es ? "Año" : "Year"} {row.year}
                            </td>
                            <td className="py-2 px-3 text-right text-[var(--ink-3)]">
                              {fmtUsd(row.startBal)}
                            </td>
                            <td
                              className="py-2 px-3 text-right"
                              style={{
                                color: row.yearProfit >= 0 ? "rgb(var(--pnl-pos))" : "rgb(var(--pnl-neg))",
                              }}
                            >
                              {row.yearProfit >= 0 ? "+" : ""}
                              {fmtUsd(row.yearProfit)}
                            </td>
                            <td
                              className="py-2 px-3 text-right"
                              style={{
                                color:
                                  row.yearReturnPct >= 0 ? "rgb(var(--pnl-pos))" : "rgb(var(--pnl-neg))",
                              }}
                            >
                              {fmtPct(row.yearReturnPct, 1)}
                            </td>
                            {/* La barra vive detrás de la cifra, anclada a
                                la derecha, para que crezca hacia donde se
                                lee el número. */}
                            <td className="relative py-2 px-3 text-right font-semibold text-[var(--ink)]">
                              <span
                                aria-hidden
                                className="pointer-events-none absolute inset-y-[3px] right-0 rounded-[1px]"
                                style={{
                                  width: `${(cuota * 100).toFixed(2)}%`,
                                  background: "rgb(var(--divider) / 0.13)",
                                }}
                              />
                              <span className="relative">{fmtUsd(row.endBal)}</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* ── LAS SEIS CIFRAS, EN UNA RETICULA DE FILETES ────────
                  Eran seis tarjetas sueltas con 10 px de hueco, borde y
                  sombra cada una: seis objetos que por casualidad estan
                  juntos. Son las seis lecturas de UNA proyeccion, y se
                  presentan como tales — el mismo cuadro de filetes que
                  usa la portada para sus metricas (`.tj-matriz`). */}
              <div
                className="tj-matriz grid-cols-2 border-b border-[var(--ficha-division)] sm:grid-cols-3"
              >
                <div
                  /* Cada casilla es el contenedor contra el que se mide
                     su propia cifra: «2.182.131 US$» a cuerpo fijo se
                     salia 33 px a 320 px. */
                  className="caja-cifra p-3.5"
                >
                  <div className="tnum text-[12px] text-[var(--ink-3)] font-semibold flex items-center justify-between">
                    <span>{es ? "Balance proyectado" : "Projected balance"}</span>
                    <ArrowUpRight aria-hidden className="w-3 h-3 text-[rgb(var(--accent-base))]" />
                  </div>
                  <div className="tnum cifra-lg mt-1 whitespace-nowrap font-semibold text-[rgb(var(--accent-base))]">
                    {fmtUsd(c.finalBalance, true)}
                  </div>
                  <div className="text-[11px] text-[var(--ink-3)] tnum mt-0.5">
                    {startBalance > 0
                      ? `${fmtNum(c.finalBalance / startBalance, 1)}\u00a0× ${es ? "el capital inicial" : "starting capital"}`
                      : ""}
                  </div>
                </div>

                <div
                  /* Cada casilla es el contenedor contra el que se mide
                     su propia cifra: «2.182.131 US$» a cuerpo fijo se
                     salia 33 px a 320 px. */
                  className="caja-cifra p-3.5"
                >
                  <div className="tnum text-[12px] text-[var(--ink-3)] font-semibold">
                    CAGR ({es ? "tasa anual" : "annual rate"})
                  </div>
                  <div
                    className="tnum text-lg sm:text-xl font-semibold mt-1"
                    style={{ color: c.cagr >= 0 ? "rgb(var(--pnl-pos))" : "rgb(var(--pnl-neg))" }}
                  >
                    {fmtPct(c.cagr * 100, 1)}
                  </div>
                  <div className="text-[11px] text-[var(--ink-3)] tnum mt-0.5">
                    {es ? "Crecimiento compuesto" : "Compound growth"}
                  </div>
                </div>

                <div
                  /* Cada casilla es el contenedor contra el que se mide
                     su propia cifra: «2.182.131 US$» a cuerpo fijo se
                     salia 33 px a 320 px. */
                  className="caja-cifra p-3.5"
                >
                  <div className="tnum text-[12px] text-[var(--ink-3)] font-semibold">
                    {es ? "Retorno total" : "Total return"}
                  </div>
                  <div
                    className="tnum text-lg sm:text-xl font-semibold mt-1"
                    style={{
                      color: c.totalReturnPct >= 0 ? "rgb(var(--pnl-pos))" : "rgb(var(--pnl-neg))",
                    }}
                  >
                    {c.totalReturnPct >= 0 ? "+" : ""}
                    {fmtPct(c.totalReturnPct, 0)}
                  </div>
                  <div className="text-[11px] text-[var(--ink-3)] tnum mt-0.5">
                    {c.finalNetProfit >= 0 ? "+" : ""}
                    {fmtUsd(c.finalNetProfit, true)} {es ? "neto" : "net"}
                  </div>
                </div>

                <div
                  /* Cada casilla es el contenedor contra el que se mide
                     su propia cifra: «2.182.131 US$» a cuerpo fijo se
                     salia 33 px a 320 px. */
                  className="caja-cifra p-3.5"
                >
                  <div className="tnum text-[12px] text-[var(--ink-3)] font-semibold">
                    {es
                      ? `Drawdown máx. est. (${fmtPct(CONFIANZA_RACHA * 100, 0)})`
                      : `Est. max DD (${fmtPct(CONFIANZA_RACHA * 100, 0)})`}
                  </div>
                  <div className="tnum cifra-lg mt-1 whitespace-nowrap font-semibold text-[rgb(var(--pnl-neg))]">
                    −{fmtPct(c.estMaxDDpct, 1)}
                  </div>
                  <div className="text-[11px] text-[var(--ink-3)] tnum mt-0.5">
                    {es
                      ? `Peor racha: ~${fmtInt(c.maxConsecLosses, lang)} pérdidas`
                      : `Streak: ~${fmtInt(c.maxConsecLosses, lang)} losses`}
                  </div>
                </div>

                <div
                  /* Cada casilla es el contenedor contra el que se mide
                     su propia cifra: «2.182.131 US$» a cuerpo fijo se
                     salia 33 px a 320 px. */
                  className="caja-cifra p-3.5"
                >
                  <div className="tnum text-[12px] text-[var(--ink-3)] font-semibold">
                    {es ? "Tiempo para duplicar" : "Time to double"}
                  </div>
                  <div className="tnum cifra-lg mt-1 whitespace-nowrap font-semibold text-[var(--ink)]">
                    {c.monthsToDouble !== null
                      ? `${fmtNum(c.monthsToDouble, 1)} ${es ? "meses" : "mo"}`
                      : "—"}
                  </div>
                  <div className="text-[11px] text-[var(--ink-3)] tnum mt-0.5">
                    {c.monthsToDouble !== null
                      ? `≈ ${fmtNum(c.monthsToDouble / 12, 1)} ${es ? "años" : "yrs"}`
                      : es ? "Sin crecimiento" : "No growth"}
                  </div>
                </div>

                <div
                  /* Cada casilla es el contenedor contra el que se mide
                     su propia cifra: «2.182.131 US$» a cuerpo fijo se
                     salia 33 px a 320 px. */
                  className="caja-cifra p-3.5"
                >
                  <div className="tnum text-[12px] text-[var(--ink-3)] font-semibold">
                    Profit factor
                  </div>
                  <div className="tnum cifra-lg mt-1 whitespace-nowrap font-semibold text-[var(--ink)]">
                    {fmtNum(c.profitFactor, 2)}
                  </div>
                  <div className="text-[11px] text-[var(--ink-3)] tnum mt-0.5">
                    {es ? `Medio Kelly: ${fmtPct(c.halfKellyPct, 1)}` : `Half Kelly: ${fmtPct(c.halfKellyPct, 1)}`}
                  </div>
                </div>
              </div>

              {/* Botón de Copiar Resumen y Footer */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <span className="text-[12px] tnum text-[var(--ink-3)]">
                  {es
                    ? `Proyección ${reinvestMode === "compound" ? "con interés compuesto" : "con riesgo fijo"} y banda de varianza del ${fmtPct(CONO_CONFIANZA_PCT, 0)}. No es una promesa.`
                    : `${reinvestMode === "compound" ? "Compounded" : "Fixed-risk"} projection with an ${fmtPct(CONO_CONFIANZA_PCT, 0)} variance band. Not a promise.`}
                </span>

                <button
                  type="button"
                  onClick={copySummary}
                  className="toque-comodo -mx-1 px-1 py-2 text-[13px] font-medium transition-colors cursor-pointer flex items-center gap-2 text-primary hover:text-[rgb(var(--accent-base))]"
                >
                  {copied ? <Check aria-hidden className="w-3.5 h-3.5" /> : <Copy aria-hidden className="w-3.5 h-3.5" />}
                  <span>
                    {copied
                      ? es
                        ? "Copiado"
                        : "Copied"
                      : es
                      ? "Copiar resumen"
                      : "Copy summary"}
                  </span>
                </button>
              </div>

              {/* Disclaimer */}
              <div className="border-t border-[var(--ficha-division)] pt-3">
                <p className="medida tnum m-0 text-[11px] leading-relaxed text-[var(--ink-3)]">
                  {es
                    ? `Nota de rigor estadístico: Esta proyección asume una esperanza matemática constante. En mercados reales, los regímenes de volatilidad cambian y las rachas perdedoras pueden ser superiores. El drawdown estimado calcula la racha consecutiva al ${fmtPct(CONFIANZA_RACHA * 100, 0)} de confianza estadística.`
                    : `Statistical note: This projection assumes constant mathematical expectancy. In live trading, regimes shift and drawdowns may be larger. Estimated max drawdown models streaks at ${fmtPct(CONFIANZA_RACHA * 100, 0)} confidence.`}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
