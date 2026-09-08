"use client";

import { useState, type CSSProperties } from "react";
import { useLang } from "@/lib/i18n";
import { fmtMoney, fmtNum, fmtPct } from "@/lib/trading/format";
import { AlertTriangle, ShieldCheck } from "lucide-react";

interface InstrumentConfig {
  id: string;
  name: string;
  category: "futures" | "micro" | "forex";
  pointValue: number;
  tickSize: number;
  tickValue: number;
  defaultCommissionRT: number; // Round turn por contrato en USD
  unitNameEs: string;
  unitNameEn: string;
}

const INSTRUMENT_SPECS: InstrumentConfig[] = [
  {
    id: "NQ",
    name: "NQ · E-mini Nasdaq-100",
    category: "futures",
    pointValue: 20,
    tickSize: 0.25,
    tickValue: 5.0,
    defaultCommissionRT: 4.5,
    unitNameEs: "puntos",
    unitNameEn: "points",
  },
  {
    id: "MNQ",
    name: "MNQ · Micro E-mini Nasdaq",
    category: "micro",
    pointValue: 2,
    tickSize: 0.25,
    tickValue: 0.5,
    defaultCommissionRT: 1.24,
    unitNameEs: "puntos",
    unitNameEn: "points",
  },
  {
    id: "ES",
    name: "ES · E-mini S&P 500",
    category: "futures",
    pointValue: 50,
    tickSize: 0.25,
    tickValue: 12.5,
    defaultCommissionRT: 4.5,
    unitNameEs: "puntos",
    unitNameEn: "points",
  },
  {
    id: "MES",
    name: "MES · Micro E-mini S&P",
    category: "micro",
    pointValue: 5,
    tickSize: 0.25,
    tickValue: 1.25,
    defaultCommissionRT: 1.24,
    unitNameEs: "puntos",
    unitNameEn: "points",
  },
  {
    id: "CL",
    name: "CL · Petróleo Crudo (Crude Oil)",
    category: "futures",
    pointValue: 1000,
    tickSize: 0.01,
    tickValue: 10.0,
    defaultCommissionRT: 4.5,
    unitNameEs: "dólares",
    unitNameEn: "dollars",
  },
  {
    id: "MCL",
    name: "MCL · Micro Crude Oil",
    category: "micro",
    pointValue: 100,
    tickSize: 0.01,
    tickValue: 1.0,
    defaultCommissionRT: 1.24,
    unitNameEs: "dólares",
    unitNameEn: "dollars",
  },
  {
    id: "GC",
    name: "GC · Oro (Gold Futures)",
    category: "futures",
    pointValue: 100,
    tickSize: 0.1,
    tickValue: 10.0,
    defaultCommissionRT: 4.5,
    unitNameEs: "dólares",
    unitNameEn: "dollars",
  },
  {
    id: "MGC",
    name: "MGC · Micro Gold",
    category: "micro",
    pointValue: 10,
    tickSize: 0.1,
    tickValue: 1.0,
    defaultCommissionRT: 1.24,
    unitNameEs: "dólares",
    unitNameEn: "dollars",
  },
  {
    id: "RTY",
    name: "RTY · E-mini Russell 2000",
    category: "futures",
    pointValue: 50,
    tickSize: 0.1,
    tickValue: 5.0,
    defaultCommissionRT: 4.5,
    unitNameEs: "puntos",
    unitNameEn: "points",
  },
  {
    id: "EURUSD",
    name: "EUR/USD · Forex Estándar (100k)",
    category: "forex",
    pointValue: 100000,
    tickSize: 0.0001,
    tickValue: 10.0, // 1 pip = $10 en 1 lote estándar
    defaultCommissionRT: 5.0,
    unitNameEs: "pips",
    unitNameEn: "pips",
  },
];

export function CommissionDragCalculator({ num = "08" }: { num?: string }) {
  const { lang } = useLang();
  const es = lang === "es";

  // Estado editable
  const [selectedInstId, setSelectedInstId] = useState<string>("MNQ");
  const [contracts, setContracts] = useState<number>(2);
  const [monthlyTrades, setMonthlyTrades] = useState<number>(60);
  const [targetUnits, setTargetUnits] = useState<number>(15); // p. ej. 15 puntos en NQ/MNQ o 15 pips en FX
  const [slippageTicks, setSlippageTicks] = useState<number>(1); // 1 tick de deslizamiento medio por trade
  const [customCommission, setCustomCommission] = useState<number>(1.24);

  const inst = INSTRUMENT_SPECS.find((i) => i.id === selectedInstId) || INSTRUMENT_SPECS[0];
  /* Los limites del deslizador de objetivo dependen del instrumento, y
     ahora los necesita tambien `--pct` para pintar el tramo recorrido de
     la pista. Salen aqui una vez en vez de repetir el ternario. */
  const esMini = inst.id === "ES" || inst.id === "MES";
  const objetivoMin = inst.category === "forex" ? 5 : esMini ? 2 : 5;
  const objetivoMax = inst.category === "forex" ? 80 : esMini ? 40 : 100;

  const handleSelectInstrument = (instId: string) => {
    const item = INSTRUMENT_SPECS.find((i) => i.id === instId);
    if (!item) return;
    setSelectedInstId(instId);
    setCustomCommission(item.defaultCommissionRT);
    if (item.category === "forex") {
      setTargetUnits(15); // 15 pips
    } else if (item.id === "ES" || item.id === "MES") {
      setTargetUnits(6); // 6 puntos en S&P
    } else if (item.id === "NQ" || item.id === "MNQ") {
      setTargetUnits(20); // 20 puntos en Nasdaq
    } else if (item.id === "RTY") {
      setTargetUnits(10); // 10 puntos en Russell
    } else {
      setTargetUnits(0.5); // 50 centavos en CL/GC/MCL/MGC
    }
  };

  // Cálculos matemáticos
  const grossProfitPerTrade = targetUnits * inst.pointValue * contracts;
  const grossMonthly = grossProfitPerTrade * monthlyTrades;

  const commissionPerTrade = customCommission * contracts;
  const totalCommissionsMonthly = commissionPerTrade * monthlyTrades;

  const slippagePerTrade = slippageTicks * inst.tickValue * contracts;
  const totalSlippageMonthly = slippagePerTrade * monthlyTrades;

  const totalCostPerTrade = commissionPerTrade + slippagePerTrade;
  const totalCostMonthly = totalCommissionsMonthly + totalSlippageMonthly;
  const netMonthly = grossMonthly - totalCostMonthly;
  const netAnnual = netMonthly * 12;
  const grossAnnual = grossMonthly * 12;
  const totalCostAnnual = totalCostMonthly * 12;

  const costDragPct = grossMonthly > 0 ? (totalCostMonthly / grossMonthly) * 100 : 0;
  const breakEvenTicksPerTrade =
    inst.tickValue * contracts > 0
      ? totalCostPerTrade / (inst.tickValue * contracts)
      : 0;
  const breakEvenUnitsPerTrade = breakEvenTicksPerTrade * inst.tickSize;

  // Win rate de equilibrio a 1.5:1 R:R
  const nominalStopPerTrade = grossProfitPerTrade / 1.5;
  const breakEvenWinRate =
    nominalStopPerTrade + grossProfitPerTrade > 0
      ? ((nominalStopPerTrade + totalCostPerTrade) / (nominalStopPerTrade + grossProfitPerTrade)) * 100
      : 40;

  return (
    <section className="section-tight bg-veil border-t border-[rgb(var(--divider)/0.08)]">
      <div className="tj-container">
        {/* Cabecera */}
        <div className="inline-flex items-center gap-3 mb-5">
          <span className="tnum font-mono text-xs font-semibold text-[rgb(var(--accent-base))]">
            § {num}
          </span>
          <span aria-hidden className="w-[22px] h-px bg-[rgb(var(--divider)/0.15)]" />
          <span className="tnum font-mono text-[11px] tracking-[0.2em] text-tertiary uppercase">
            {es ? "ANÁLISIS CUANTITATIVO DE COSTES" : "QUANTITATIVE COST ANALYSIS"}
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-10 items-start">
          {/* Columna Izquierda: Configuración */}
          <div>
            <h2 className="font-serif text-3xl md:text-4xl text-primary font-normal tracking-tight">
              {es ? (
                <>
                  La factura oculta de tus <span className="text-[rgb(var(--accent-base))]">comisiones</span>.
                </>
              ) : (
                <>
                  The hidden drag of your <span className="text-[rgb(var(--accent-base))]">commissions</span>.
                </>
              )}
            </h2>
            <p className="mt-3 text-secondary text-sm md:text-base leading-relaxed max-w-xl">
              {es
                ? "En scalping e intradía, las comisiones de la CME y el deslizamiento pueden absorber entre el 15 % y el 40 % de tus ganancias brutas. Selecciona tu instrumento y comprueba el impacto exacto en tu balance anual."
                : "In scalping and intraday trading, CME fees and slippage can absorb between 15% and 40% of gross profits. Select your instrument and check the exact impact on your annual bottom line."}
            </p>

            {/* Selector de Instrumentos */}
            <div className="mt-6">
              <label className="block text-xs uppercase tracking-wider text-tertiary mb-2 font-mono">
                {es ? "Instrumento de operativa" : "Trading instrument"}
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {INSTRUMENT_SPECS.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectInstrument(item.id)}
                    className={`h-10 px-3 rounded-[2px] text-xs font-semibold transition-all text-left flex items-center justify-between border ${
                      selectedInstId === item.id
                        ? "border-[rgb(var(--accent-base))] bg-[rgb(var(--accent-base)/0.12)] text-primary"
                        : "border-[rgb(var(--divider)/0.15)] bg-[var(--surface-1)] text-secondary hover:text-primary hover:border-[rgb(var(--divider)/0.3)]"
                    }`}
                  >
                    <span className="font-mono">{item.id}</span>
                    <span className="text-[10px] text-tertiary">{item.category}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Sliders de Entrada */}
            <div className="mt-6 space-y-4">
              <div className="tj-paper p-4 rounded-[2px] border border-[rgb(var(--divider)/0.12)] space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-secondary font-medium">
                    {es ? "Contratos / Lotes por trade:" : "Contracts / Lots per trade:"}
                  </span>
                  <span className="font-mono font-bold text-primary tnum">{contracts}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="20"
                  step="1"
                  value={contracts}
                  onChange={(e) => setContracts(Number(e.target.value))}
                  aria-label={es ? "Contratos por operacion" : "Contracts per trade"}
                  className="tj-range w-full"
                  style={{ "--pct": `${((contracts - 1) / 19) * 100}%` } as CSSProperties}
                />
              </div>

              <div className="tj-paper p-4 rounded-[2px] border border-[rgb(var(--divider)/0.12)] space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-secondary font-medium">
                    {es ? "Operaciones al mes:" : "Trades per month:"}
                  </span>
                  <span className="font-mono font-bold text-primary tnum">{monthlyTrades} trades</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="300"
                  step="5"
                  value={monthlyTrades}
                  onChange={(e) => setMonthlyTrades(Number(e.target.value))}
                  aria-label={es ? "Operaciones al mes" : "Trades per month"}
                  className="tj-range w-full"
                  style={{ "--pct": `${((monthlyTrades - 10) / 290) * 100}%` } as CSSProperties}
                />
              </div>

              {/* Los limites del recorrido salen a variables porque ahora
                  los usa tambien `--pct`, el relleno de la pista. */}
              <div className="tj-paper p-4 rounded-[2px] border border-[rgb(var(--divider)/0.12)] space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-secondary font-medium">
                    {es
                      ? `Ganancia media esperada (${inst.unitNameEs}):`
                      : `Expected average gain (${inst.unitNameEn}):`}
                  </span>
                  <span className="font-mono font-bold text-primary tnum">
                    +{targetUnits} {es ? inst.unitNameEs : inst.unitNameEn}
                  </span>
                </div>
                <input
                  type="range"
                  min={objetivoMin}
                  max={objetivoMax}
                  step={inst.category === "forex" ? 1 : 0.5}
                  value={targetUnits}
                  onChange={(e) => setTargetUnits(Number(e.target.value))}
                  aria-label={es ? "Ganancia media esperada" : "Expected average gain"}
                  className="tj-range w-full"
                  style={
                    {
                      "--pct": `${((targetUnits - objetivoMin) / (objetivoMax - objetivoMin)) * 100}%`,
                    } as CSSProperties
                  }
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-[2px] border border-[rgb(var(--divider)/0.12)] bg-[var(--surface-1)]">
                  <span className="text-[11px] text-tertiary block mb-1">
                    {es ? "Comisión Round-Turn ($):" : "Round-Turn Fee ($):"}
                  </span>
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-mono text-secondary">$</span>
                    <input
                      type="number"
                      step="0.05"
                      min="0"
                      value={customCommission}
                      onChange={(e) => setCustomCommission(Math.max(0, Number(e.target.value)))}
                      className="w-full bg-transparent font-mono text-sm text-primary font-semibold outline-none"
                    />
                  </div>
                </div>

                <div className="p-3 rounded-[2px] border border-[rgb(var(--divider)/0.12)] bg-[var(--surface-1)]">
                  <span className="text-[11px] text-tertiary block mb-1">
                    {es ? "Deslizamiento (Ticks medio):" : "Slippage (Avg ticks):"}
                  </span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="10"
                      value={slippageTicks}
                      onChange={(e) => setSlippageTicks(Math.max(0, Number(e.target.value)))}
                      className="w-full bg-transparent font-mono text-sm text-primary font-semibold outline-none"
                    />
                    <span className="text-xs font-mono text-tertiary">ticks</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Columna Derecha: Tarjeta de Resultados */}
          <div className="tj-paper p-6 sm:p-7 rounded-[2px] border border-[rgb(var(--divider)/0.16)] bg-[var(--surface-1)] sticky top-24">
            <span className="text-xs font-mono uppercase tracking-wider text-tertiary block mb-3">
              {es ? "DESGLOSE FINANCIERO ANUAL" : "ANNUAL FINANCIAL BREAKDOWN"}
            </span>

            {/* P&L Neto vs Bruto */}
            <div className="space-y-3 pb-5 border-b border-[rgb(var(--divider)/0.12)]">
              <div>
                <span className="text-xs text-secondary">{es ? "P&L Bruto Anual:" : "Annual Gross P&L:"}</span>
                <div className="text-xl font-mono text-primary font-medium tnum">
                  +{fmtMoney(grossAnnual, lang, { decimals: 0 })}
                </div>
              </div>

              <div>
                <span className="text-xs text-secondary font-semibold">
                  {es ? "P&L Neto Real en Cuenta:" : "Real Net P&L in Account:"}
                </span>
                <div className="text-3xl font-mono font-bold text-[rgb(var(--pnl-pos))] tnum">
                  +{fmtMoney(netAnnual, lang, { decimals: 0 })}
                </div>
              </div>
            </div>

            {/* Matriz de Fuga por Costes */}
            <div className="py-4 space-y-2.5 border-b border-[rgb(var(--divider)/0.12)] text-xs">
              <div className="flex items-center justify-between">
                <span className="text-secondary">{es ? "Comisiones CME / Bróker (año):" : "CME / Broker Fees (yr):"}</span>
                <span className="font-mono font-semibold text-[rgb(var(--pnl-neg))] tnum">
                  −{fmtMoney(totalCommissionsMonthly * 12, lang, { decimals: 0 })}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-secondary">{es ? "Coste por Deslizamiento (año):" : "Slippage Friction (yr):"}</span>
                <span className="font-mono font-semibold text-[rgb(var(--pnl-neg))] tnum">
                  −{fmtMoney(totalSlippageMonthly * 12, lang, { decimals: 0 })}
                </span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-[rgb(var(--divider)/0.08)]">
                <span className="font-semibold text-primary">{es ? "Fricción Total Anual:" : "Total Annual Drag:"}</span>
                <span className="font-mono font-bold text-[rgb(var(--pnl-neg))] tnum">
                  −{fmtMoney(totalCostAnnual, lang, { decimals: 0 })}
                </span>
              </div>
            </div>

            {/* Indicadores Clave: Drag %, Break-Even Ticks y Win Rate Exigido */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-4">
              <div className="p-2.5 rounded-[2px] bg-[rgb(var(--divider)/0.04)] border border-[rgb(var(--divider)/0.10)]">
                <span className="text-[10.5px] text-tertiary block mb-1">
                  {es ? "Arrastre de Costes:" : "Fee Drag %:"}
                </span>
                <span
                  className={`text-base font-mono font-bold tnum ${
                    costDragPct > 30
                      ? "text-[rgb(var(--pnl-neg))]"
                      : costDragPct > 15
                      ? "text-[rgb(var(--sig-amber))]"
                      : "text-[rgb(var(--pnl-pos))]"
                  }`}
                >
                  {fmtPct(costDragPct / 100, lang)}
                </span>
                <span className="text-[9.5px] text-tertiary block mt-0.5">
                  {es ? "del beneficio" : "of profit"}
                </span>
              </div>

              <div className="p-2.5 rounded-[2px] bg-[rgb(var(--divider)/0.04)] border border-[rgb(var(--divider)/0.10)]">
                <span className="text-[10.5px] text-tertiary block mb-1">
                  {es ? "Break-even Ticks:" : "Break-even Ticks:"}
                </span>
                <span className="text-base font-mono font-bold text-primary tnum">
                  {breakEvenTicksPerTrade.toFixed(2)}
                </span>
                <span className="text-[9.5px] text-tertiary block mt-0.5 font-mono">
                  {fmtNum(breakEvenUnitsPerTrade, lang, 2)} {es ? inst.unitNameEs : inst.unitNameEn}
                </span>
              </div>

              <div className="p-2.5 rounded-[2px] bg-[rgb(var(--divider)/0.04)] border border-[rgb(var(--divider)/0.10)]">
                <span className="text-[10.5px] text-tertiary block mb-1">
                  {es ? "Win Rate Exigido:" : "Required BE Win Rate:"}
                </span>
                <span className="text-base font-mono font-bold text-[rgb(var(--accent-base))] tnum">
                  {fmtPct(breakEvenWinRate / 100, lang)}
                </span>
                <span className="text-[9.5px] text-tertiary block mt-0.5">
                  {es ? "a 1.5:1 R:R" : "at 1.5:1 R:R"}
                </span>
              </div>
            </div>

            {/* Diagnóstico Institucional */}
            <div className="mt-5 p-3.5 rounded-[2px] border border-[rgb(var(--divider)/0.12)] bg-[var(--surface-2)]">
              <div className="flex items-start gap-2">
                {costDragPct > 25 ? (
                  <AlertTriangle size={16} className="text-[rgb(var(--pnl-neg))] shrink-0 mt-0.5" />
                ) : (
                  <ShieldCheck size={16} className="text-[rgb(var(--accent-base))] shrink-0 mt-0.5" />
                )}
                <p className="text-[12px] text-secondary leading-relaxed m-0">
                  {costDragPct > 25
                    ? es
                      ? "Alerta de micro-drag: Estás cediendo más del 25 % de tu ganancia al bróker. Considera ampliar tu target en múltiplos de R o escalar a contratos mini para reducir el ratio comisiones/beneficio."
                      : "Micro-drag alert: You are yielding over 25% of gross profit to fees. Consider widening your target in R-multiples or scaling to mini contracts to improve fee efficiency."
                    : es
                    ? "Estructura de costes saludable: Tu ganancia por operación absorbe cómodamente las tarifas de intercambio y el deslizamiento sin erosionar tu ventaja estadística."
                    : "Healthy cost structure: Your average gain comfortably absorbs exchange fees and slippage without eroding your statistical edge."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
