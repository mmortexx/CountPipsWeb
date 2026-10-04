"use client";

import { useState, type CSSProperties } from "react";
import { useLang } from "@/lib/i18n";
import { fmtMoney, fmtNum, fmtOperaciones, fmtPct, pctSep } from "@/lib/trading/format";
import { CampoUnidad } from "@/components/tj/CampoCifra";
import { ResultadoAnunciado } from "@/components/tj/ResultadoAnunciado";
import {
  INSTRUMENT_SPECS,
  clasificaFugaComisiones,
  resultadoBrutoPorOperacion,
  ticksAUnidades,
} from "@/lib/trading/fugaComisiones";

/** Umbral de fuga alta: una sola cifra para el aviso visual y para el
 *  texto del diagnóstico, no una repetida a mano en cada sitio. */
const UMBRAL_DRAG_ALTO = 25;
/** Ratio objetivo:riesgo usado para el win rate de equilibrio de la ficha. */
const RATIO_RR_EQUILIBRIO = 1.5;

export function CommissionDragCalculator() {
  const { lang } = useLang();
  const es = lang === "es";

  // Estado editable
  const [selectedInstId, setSelectedInstId] = useState<string>("MNQ");
  const [contracts, setContracts] = useState<number>(2);
  const [monthlyTrades, setMonthlyTrades] = useState<number>(60);
  const [targetUnits, setTargetUnits] = useState<number>(
    () => (INSTRUMENT_SPECS.find((i) => i.id === "MNQ") ?? INSTRUMENT_SPECS[0]).objetivo.inicial,
  );
  const [slippageTicks, setSlippageTicks] = useState<number>(1); // 1 tick de deslizamiento medio por trade
  const [customCommission, setCustomCommission] = useState<number>(1.24);

  const inst = INSTRUMENT_SPECS.find((i) => i.id === selectedInstId) || INSTRUMENT_SPECS[0];
  /* El recorrido del objetivo es de cada instrumento (ver `objetivo` en
     INSTRUMENT_SPECS): el crudo se mueve en céntimos y el S&P en puntos. */
  const { min: objetivoMin, max: objetivoMax, paso: objetivoPaso } = inst.objetivo;
  const decimalesObjetivo = (String(objetivoPaso).split(".")[1] ?? "").length;
  const objetivoTxt = fmtNum(targetUnits, lang, Number.isInteger(targetUnits) ? 0 : decimalesObjetivo);
  const objetivoConUnidad = `+${objetivoTxt} ${es ? inst.unitNameEs : inst.unitNameEn}`;

  const handleSelectInstrument = (instId: string) => {
    const item = INSTRUMENT_SPECS.find((i) => i.id === instId);
    if (!item) return;
    setSelectedInstId(instId);
    setCustomCommission(item.defaultCommissionRT);
    setTargetUnits(item.objetivo.inicial);
  };

  // Cálculos matemáticos
  const grossProfitPerTrade = resultadoBrutoPorOperacion(inst, targetUnits, contracts);
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
  const nivelFuga = clasificaFugaComisiones(costDragPct);
  const NIVEL_FUGA_LABEL: Record<typeof nivelFuga, { es: string; en: string }> = {
    alto: { es: "alto", en: "high" },
    moderado: { es: "moderado", en: "moderate" },
    bajo: { es: "bajo", en: "low" },
  };
  const breakEvenTicksPerTrade =
    inst.tickValue * contracts > 0
      ? totalCostPerTrade / (inst.tickValue * contracts)
      : 0;
  const breakEvenUnitsPerTrade = ticksAUnidades(inst, breakEvenTicksPerTrade);

  // Win rate de equilibrio al ratio objetivo:riesgo declarado arriba
  const nominalStopPerTrade = grossProfitPerTrade / RATIO_RR_EQUILIBRIO;
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
                  Lo que se queda por el camino.
                </>
              ) : (
                <>
                  What stays along the way.
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
              <p className="tj-deslizador-etiqueta m-0 mb-2">
                {es ? "Instrumento de operativa" : "Trading instrument"}
              </p>
              <div className="tj-segmentado tj-segmentado-diez" role="group" aria-label={es ? "Instrumento de operativa" : "Trading instrument"}>
                {INSTRUMENT_SPECS.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectInstrument(item.id)}
                    aria-pressed={selectedInstId === item.id}
                  >
                    <span className="tnum">{item.id}</span>
                    <span className="text-[12px] font-normal text-tertiary">{es && item.category === "futures" ? "futuros" : item.category}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Sliders de Entrada */}
            <div className="mt-6 space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="tj-deslizador-etiqueta">
                    {es ? "Contratos o lotes por operación" : "Contracts or lots per trade"}
                  </span>
                  <span className="tj-deslizador-valor">{fmtNum(contracts, lang, 0)}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="20"
                  step="1"
                  value={contracts}
                  onChange={(e) => setContracts(Number(e.target.value))}
                  aria-label={es ? "Contratos o lotes por operación" : "Contracts or lots per trade"}
                  aria-valuetext={fmtNum(contracts, lang, 0)}
                  className="tj-range w-full"
                  style={{ "--f": ((contracts - 1) / 19) } as CSSProperties}
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="tj-deslizador-etiqueta">
                    {es ? "Operaciones al mes" : "Trades per month"}
                  </span>
                  <span className="tj-deslizador-valor">{fmtNum(monthlyTrades, lang, 0)}</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="300"
                  step="5"
                  value={monthlyTrades}
                  onChange={(e) => setMonthlyTrades(Number(e.target.value))}
                  aria-label={es ? "Operaciones al mes" : "Trades per month"}
                  aria-valuetext={fmtOperaciones(monthlyTrades, lang)}
                  className="tj-range w-full"
                  style={{ "--f": ((monthlyTrades - 10) / 290) } as CSSProperties}
                />
              </div>

              {/* Los limites del recorrido salen a variables porque ahora
                  los usa tambien `--f`, el relleno de la pista. */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="tj-deslizador-etiqueta">
                    {es
                      ? `Ganancia media esperada (${inst.unitNameEs})`
                      : `Expected average gain (${inst.unitNameEn})`}
                  </span>
                  <span className="tj-deslizador-valor">{objetivoConUnidad}</span>
                </div>
                <input
                  type="range"
                  min={objetivoMin}
                  max={objetivoMax}
                  step={objetivoPaso}
                  value={targetUnits}
                  onChange={(e) => setTargetUnits(Number(e.target.value))}
                  aria-label={es ? "Ganancia media esperada" : "Expected average gain"}
                  aria-valuetext={objetivoConUnidad}
                  className="tj-range w-full"
                  style={
                    {
                      "--f": ((targetUnits - objetivoMin) / (objetivoMax - objetivoMin)),
                    } as CSSProperties
                  }
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="com-comision" className="block text-[12px] text-tertiary mb-1">
                    {es ? "Comisión ida y vuelta" : "Round-turn fee"}
                  </label>
                  <CampoUnidad
                    id="com-comision"
                    unidad="$"
                    antes={!es}
                    paso={0.05}
                    min={0}
                    valor={customCommission}
                    onValor={setCustomCommission}
                    aria-label={es ? "Comisión ida y vuelta, en dólares" : "Round-turn fee, in dollars"}
                    className="text-primary"
                  />
                </div>

                <div>
                  <label htmlFor="com-deslizamiento" className="block text-[12px] text-tertiary mb-1">
                    {es ? "Deslizamiento medio" : "Average slippage"}
                  </label>
                  <CampoUnidad
                    id="com-deslizamiento"
                    unidad="ticks"
                    paso={0.5}
                    min={0}
                    max={10}
                    valor={slippageTicks}
                    onValor={setSlippageTicks}
                    aria-label={es ? "Deslizamiento medio, en ticks" : "Average slippage, in ticks"}
                    className="text-primary"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Columna Derecha: Tarjeta de Resultados */}
          <div className="tj-ficha lg:sticky lg:top-24">
            <p className="tj-ficha-barra">
              <span>{es ? "En un año" : "Over a year"}</span>
              <span>
                {inst.id} · {fmtOperaciones(monthlyTrades * 12, lang)}
              </span>
            </p>
            <div className="tj-ficha-cuerpo">

            {/* El resultado que resume la tarjeta, dicho en voz alta para
                quien no ve la pantalla: ver ResultadoAnunciado. */}
            <ResultadoAnunciado
              texto={
                es
                  ? `Lo que queda en la cuenta: ${fmtMoney(netAnnual, lang, { decimals: 0, sign: true })} al año. Costes: ${fmtPct(costDragPct / 100, lang)} de la ganancia bruta.`
                  : `What stays in the account: ${fmtMoney(netAnnual, lang, { decimals: 0, sign: true })} a year. Costs: ${fmtPct(costDragPct / 100, lang)} of gross profit.`
              }
            />

            {/* P&L Neto vs Bruto */}
            <div className="space-y-3 pb-5 border-b border-[var(--line)]">
              <div>
                <span className="text-xs text-secondary">{es ? "Resultado bruto" : "Gross P&L"}</span>
                <div className="text-base tnum text-primary font-semibold">
                  +{fmtMoney(grossAnnual, lang, { decimals: 0 })}
                </div>
              </div>

              <div>
                <span className="text-xs text-secondary">
                  {es ? "Lo que queda en la cuenta" : "What stays in the account"}
                </span>
                <div
                  className={`tj-cifra ${
                    netAnnual < 0 ? "text-[rgb(var(--pnl-neg))]" : "text-[rgb(var(--pnl-pos))]"
                  }`}
                >
                  {fmtMoney(netAnnual, lang, { decimals: 0, sign: true })}
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
              <div>
                <span className="text-[12px] text-tertiary block mb-1">
                  {es ? "Parte de la ganancia" : "Share of profit"}
                </span>
                <span
                  className={`text-base tnum font-semibold ${
                    nivelFuga === "alto"
                      ? "text-[rgb(var(--pnl-neg))]"
                      : nivelFuga === "moderado"
                      ? "text-[rgb(var(--sig-amber))]"
                      : "text-[rgb(var(--pnl-pos))]"
                  }`}
                >
                  {fmtPct(costDragPct / 100, lang)}
                  {" · "}
                  {es ? NIVEL_FUGA_LABEL[nivelFuga].es : NIVEL_FUGA_LABEL[nivelFuga].en}
                </span>
                <span className="text-[12px] text-tertiary block mt-0.5">
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
                <span className="text-[12px] text-tertiary block mt-0.5 tnum">
                  {fmtNum(breakEvenUnitsPerTrade, lang, 2)} {es ? inst.unitNameEs : inst.unitNameEn}
                </span>
              </div>

              <div className="border-t border-[var(--line)] pt-3 sm:border-t-0 sm:pt-0">
                <span className="text-[12px] text-tertiary block mb-1">
                  {es ? "Win rate para no perder" : "Break-even win rate"}
                </span>
                {/* Por encima del 100 % no hay acierto que llegue: se dice, no se pinta «112 %». */}
                <span
                  className={`text-base tnum font-semibold ${
                    breakEvenWinRate > 100 ? "text-[rgb(var(--pnl-neg))]" : "text-primary"
                  }`}
                >
                  {breakEvenWinRate > 100
                    ? es ? "Inalcanzable" : "Out of reach"
                    : fmtPct(breakEvenWinRate / 100, lang)}
                </span>
                <span className="text-[12px] text-tertiary block mt-0.5">
                  {es ? `a 1:${fmtNum(RATIO_RR_EQUILIBRIO, lang, 1)} R:R` : `at 1:${fmtNum(RATIO_RR_EQUILIBRIO, lang, 1)} R:R`}
                </span>
              </div>
            </div>

            {/* Diagnóstico Institucional */}
            <div className="mt-5 pt-4 border-t border-[var(--line)]">
              <div>
                <p className="text-[13px] text-secondary leading-[1.6] m-0">
                  {netAnnual < 0
                    ? es
                      ? "Los costes superan la ganancia bruta: con estos números la cuenta pierde aunque cada operación alcance su objetivo."
                      : "Costs exceed the gross profit: with these numbers the account loses even if every trade reaches its target."
                    : costDragPct > UMBRAL_DRAG_ALTO
                    ? es
                      ? `Más del ${UMBRAL_DRAG_ALTO}${pctSep(lang)} de tu ganancia bruta se va en costes. Con este objetivo por operación, comisiones y deslizamiento pesan tanto como parte de tu ventaja.`
                      : `Over ${UMBRAL_DRAG_ALTO}${pctSep(lang)} of your gross profit goes to costs. With this target per trade, fees and slippage weigh as much as part of your edge.`
                    : es
                    ? "Con estos números, la ganancia por operación cubre comisiones y deslizamiento con margen."
                    : "With these numbers, the gain per trade covers fees and slippage with room to spare."}
                </p>
              </div>
            </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
