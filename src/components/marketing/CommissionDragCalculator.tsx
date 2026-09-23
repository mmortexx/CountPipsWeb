"use client";

import { useState, type CSSProperties } from "react";
import { useLang } from "@/lib/i18n";
import { fmtMoney, fmtNum, fmtPct } from "@/lib/trading/format";
import { AlertTriangle, ShieldCheck } from "lucide-react";
import { CampoCifra } from "@/components/tj/CampoCifra";

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

export function CommissionDragCalculator() {
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
    <section className="section-tight">
      <div className="tj-container">
        {/* Cabecera */}
        <div className="inline-flex items-center gap-3 mb-5">
          <span className="eyebrow" data-titular-herramienta>
            {es ? "Calculadora de costes" : "Cost calculator"}
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-10 items-start">
          {/* Columna Izquierda: Configuración */}
          <div>
            <h2 data-titular-herramienta className="t-h2 m-0 text-primary max-w-[24ch]">
              {es ? (
                <>
                  Lo que se queda <span className="text-gradient">por el camino.</span>
                </>
              ) : (
                <>
                  What stays <span className="text-gradient">along the way.</span>
                </>
              )}
            </h2>
            <p className="mt-3 text-secondary text-sm md:text-base leading-relaxed max-w-xl">
              {es
                ? "En scalping e intradía, comisiones y deslizamiento se llevan una parte de cada operación. Elige tu instrumento y mira cuánto suman en un año."
                : "In scalping and intraday trading, fees and slippage take a share of every trade. Pick your instrument and see what they add up to in a year."}
            </p>

            {/* Selector de Instrumentos */}
            <div className="mt-6">
              <label className="block text-[12px] text-tertiary mb-2 tnum">
                {es ? "Instrumento de operativa" : "Trading instrument"}
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {INSTRUMENT_SPECS.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectInstrument(item.id)}
                    aria-pressed={selectedInstId === item.id}
                    className={`h-10 px-3 rounded-[4px] text-[13px] font-semibold transition-colors text-left flex items-center justify-between ${
                      selectedInstId === item.id
                        ? "bg-[color-mix(in_srgb,var(--ink)_9%,transparent)] text-primary shadow-[inset_0_0_0_1px_var(--line-2)]"
                        : "shadow-[inset_0_0_0_1px_var(--ficha-filo)] text-secondary hover:text-primary hover:bg-[color-mix(in_srgb,var(--ink)_3.5%,transparent)]"
                    }`}
                  >
                    <span className="tnum">{item.id}</span>
                    <span className={`text-[12px] font-normal ${selectedInstId === item.id ? "opacity-75" : "text-tertiary"}`}>{es && item.category === "futures" ? "futuros" : item.category}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Sliders de Entrada */}
            <div className="mt-6 space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-secondary font-medium">
                    {es ? "Contratos o lotes por operación" : "Contracts or lots per trade"}
                  </span>
                  <span className="tnum font-semibold text-primary">{contracts}</span>
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

              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-secondary font-medium">
                    {es ? "Operaciones al mes" : "Trades per month"}
                  </span>
                  <span className="tnum font-semibold text-primary">{monthlyTrades}</span>
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
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-secondary font-medium">
                    {es
                      ? `Ganancia media esperada (${inst.unitNameEs})`
                      : `Expected average gain (${inst.unitNameEn})`}
                  </span>
                  <span className="tnum font-semibold text-primary">
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
                <div className="tj-campo px-3 py-2.5">
                  <span className="text-[12px] text-tertiary block mb-1">
                    {es ? "Comisión ida y vuelta" : "Round-turn fee"}
                  </span>
                  <div className="flex items-center gap-1">
                    <span className="text-sm tnum text-secondary">$</span>
                    <CampoCifra
                      paso={0.05}
                      min={0}
                      valor={customCommission}
                      onValor={setCustomCommission}
                      aria-label={es ? "Comisión ida y vuelta, en dólares" : "Round-turn fee, in dollars"}
                      className="w-full bg-transparent tnum text-sm text-primary font-semibold outline-none"
                    />
                  </div>
                </div>

                <div className="tj-campo px-3 py-2.5">
                  <span className="text-[12px] text-tertiary block mb-1">
                    {es ? "Deslizamiento medio" : "Average slippage"}
                  </span>
                  <div className="flex items-center gap-1">
                    <CampoCifra
                      paso={0.5}
                      min={0}
                      max={10}
                      valor={slippageTicks}
                      onValor={setSlippageTicks}
                      aria-label={es ? "Deslizamiento medio, en ticks" : "Average slippage, in ticks"}
                      className="w-full bg-transparent tnum text-sm text-primary font-semibold outline-none"
                    />
                    <span className="text-xs tnum text-tertiary">ticks</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Columna Derecha: Tarjeta de Resultados */}
          <div className="tj-ficha p-6 sm:p-7 lg:sticky lg:top-24">
            <span className="text-[13px] font-medium text-secondary block mb-4">
              {es ? "En un año" : "Over a year"}
            </span>

            {/* P&L Neto vs Bruto */}
            <div className="space-y-3 pb-5 border-b border-[var(--line)]">
              <div>
                <span className="text-xs text-secondary">{es ? "Resultado bruto" : "Gross P&L"}</span>
                <div className="text-xl tnum text-primary font-medium">
                  +{fmtMoney(grossAnnual, lang, { decimals: 0 })}
                </div>
              </div>

              <div>
                <span className="text-xs text-secondary">
                  {es ? "Lo que queda en la cuenta" : "What stays in the account"}
                </span>
                <div className="text-3xl tnum font-semibold text-[rgb(var(--pnl-pos))]">
                  +{fmtMoney(netAnnual, lang, { decimals: 0 })}
                </div>
              </div>
            </div>

            {/* Matriz de Fuga por Costes */}
            <div className="py-4 space-y-2.5 border-b border-[var(--line)] text-xs">
              <div className="flex items-center justify-between">
                <span className="text-secondary">{es ? "Comisiones" : "Fees"}</span>
                <span className="tnum font-semibold text-[rgb(var(--pnl-neg))]">
                  −{fmtMoney(totalCommissionsMonthly * 12, lang, { decimals: 0 })}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-secondary">{es ? "Deslizamiento" : "Slippage"}</span>
                <span className="tnum font-semibold text-[rgb(var(--pnl-neg))]">
                  −{fmtMoney(totalSlippageMonthly * 12, lang, { decimals: 0 })}
                </span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-[var(--line)]">
                <span className="font-semibold text-primary">{es ? "Coste total" : "Total cost"}</span>
                <span className="tnum font-semibold text-[rgb(var(--pnl-neg))]">
                  −{fmtMoney(totalCostAnnual, lang, { decimals: 0 })}
                </span>
              </div>
            </div>

            {/* Indicadores Clave: Drag %, Break-Even Ticks y Win Rate Exigido */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-3 pt-4">
              <div className="border-t border-[var(--line)] pt-3 sm:border-t-0 sm:pt-0">
                <span className="text-[12px] text-tertiary block mb-1">
                  {es ? "Parte de la ganancia" : "Share of profit"}
                </span>
                <span
                  className={`text-base tnum font-semibold ${
                    costDragPct > 30
                      ? "text-[rgb(var(--pnl-neg))]"
                      : costDragPct > 15
                      ? "text-[rgb(var(--sig-amber))]"
                      : "text-[rgb(var(--pnl-pos))]"
                  }`}
                >
                  {fmtPct(costDragPct / 100, lang)}
                </span>
                <span className="text-[11px] text-tertiary block mt-0.5">
                  {es ? "del beneficio" : "of profit"}
                </span>
              </div>

              <div className="border-t border-[var(--line)] pt-3 sm:border-t-0 sm:pt-0">
                <span className="text-[12px] text-tertiary block mb-1">
                  {es ? "Ticks para cubrir costes" : "Ticks to cover costs"}
                </span>
                <span className="text-base tnum font-semibold text-primary">
                  {fmtNum(breakEvenTicksPerTrade, lang, 2)}
                </span>
                <span className="text-[11px] text-tertiary block mt-0.5 tnum">
                  {fmtNum(breakEvenUnitsPerTrade, lang, 2)} {es ? inst.unitNameEs : inst.unitNameEn}
                </span>
              </div>

              <div className="border-t border-[var(--line)] pt-3 sm:border-t-0 sm:pt-0">
                <span className="text-[12px] text-tertiary block mb-1">
                  {es ? "Win rate para no perder" : "Break-even win rate"}
                </span>
                <span className="text-base tnum font-semibold text-primary">
                  {fmtPct(breakEvenWinRate / 100, lang)}
                </span>
                <span className="text-[11px] text-tertiary block mt-0.5">
                  {es ? "a 1,5:1 R:R" : "at 1.5:1 R:R"}
                </span>
              </div>
            </div>

            {/* Diagnóstico Institucional */}
            <div className="mt-5 pt-4 border-t border-[var(--line)]">
              <div className="flex items-start gap-2">
                {costDragPct > 25 ? (
                  <AlertTriangle size={16} className="text-[rgb(var(--pnl-neg))] shrink-0 mt-0.5" />
                ) : (
                  <ShieldCheck size={16} className="text-[rgb(var(--accent-base))] shrink-0 mt-0.5" />
                )}
                <p className="text-[13px] text-secondary leading-relaxed m-0">
                  {costDragPct > 25
                    ? es
                      ? "Más del 25 % de tu ganancia bruta se va en costes. Con este objetivo por operación, comisiones y deslizamiento pesan tanto como parte de tu ventaja."
                      : "Over 25% of your gross profit goes to costs. With this target per trade, fees and slippage weigh as much as part of your edge."
                    : es
                    ? "Con estos números, la ganancia por operación cubre comisiones y deslizamiento con margen."
                    : "With these numbers, the gain per trade covers fees and slippage with room to spare."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
