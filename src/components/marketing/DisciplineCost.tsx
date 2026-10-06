"use client";

import { useCallback, useId, useMemo, useState, type CSSProperties } from "react";
import { useLang } from "@/lib/i18n";
import { ResultadoAnunciado } from "@/components/tj/ResultadoAnunciado";
import { CampoUnidad } from "@/components/tj/CampoCifra";
import { BotonCopiar } from "@/components/tj/BotonCopiar";
import { componerInforme } from "@/lib/informe";
import { fmtMoney, fmtNum, fmtOperaciones, fmtPct, pctSep } from "@/lib/trading/format";
import { TASA_REINVERSION_ANUAL } from "@/lib/supuestos";

interface MistakeItem {
  id: string;
  labelEs: string;
  labelEn: string;
  pct: number;
}

const PRESETS = [
  {
    id: "prop",
    nameEs: "Trader de prop firm",
    nameEn: "Prop firm trader",
    trades: 50,
    breachPct: 30,
    inPlanExp: 55,
    offPlanExp: -75,
  },
  {
    id: "scalper",
    nameEs: "Scalper de futuros o cripto",
    nameEn: "Futures or crypto scalper",
    trades: 80,
    breachPct: 40,
    inPlanExp: 38,
    offPlanExp: -52,
  },
  {
    id: "swing",
    nameEs: "Swing trader discrecional",
    nameEn: "Discretionary swing trader",
    trades: 24,
    breachPct: 25,
    inPlanExp: 140,
    offPlanExp: -180,
  },
];

/**
 * DisciplineCost — Calculadora interactiva del coste de indisciplina.
 *
 * Muestra la brecha entre operar en plan y fuera de plan, la factura
 * mensual desglosada por tipología de fallo y la fuga anual de capital.
 */
export function DisciplineCost() {
  const idEscenarios = useId();
  const { lang } = useLang();
  const es = lang === "es";

  // Estado editable
  const [totalTrades, setTotalTrades] = useState(60);
  const [breachPct, setBreachPct] = useState(40);
  const [inPlanExp, setInPlanExp] = useState(29.73);
  const [offPlanExp, setOffPlanExp] = useState(-38.47);
  const [activePreset, setActivePreset] = useState<string>("custom");

  // Cálculos reactivos
  const offPlanTrades = Math.round((totalTrades * breachPct) / 100);
  const inPlanTrades = Math.max(0, totalTrades - offPlanTrades);

  /* Lo que escribe el usuario se guarda tal cual. Si fuera de plan rinde igual
     o más que dentro, no hay fuga que facturar y se dice. */
  const gapBruta = inPlanExp - offPlanExp;
  const gap = Math.max(0, gapBruta);
  const sinCoste = gapBruta <= 0;
  const planPierde = inPlanExp < 0;
  const inPlanTotal = inPlanTrades * inPlanExp;
  const offPlanTotal = offPlanTrades * offPlanExp;
  const totalLeakMonthly = offPlanTrades * gap;
  const totalLeakAnnual = totalLeakMonthly * 12;

  const mistakes: MistakeItem[] = useMemo(() => [
    { id: "offhours", labelEs: "Operar fuera de horario", labelEn: "Trading off-hours", pct: 32 },
    { id: "oversize", labelEs: "Tamaño excesivo (oversize)", labelEn: "Oversized position", pct: 27 },
    { id: "nostop", labelEs: "Sin stop loss / omitido", labelEn: "No stop loss / omitted", pct: 18 },
    { id: "chasing", labelEs: "Perseguir el precio (FOMO)", labelEn: "Chasing price (FOMO)", pct: 14 },
    { id: "movingstop", labelEs: "Mover stop loss en contra", labelEn: "Manually moving stop", pct: 9 },
  ], []);

  /** El error mayor, contra el que se miden las barras. */
  const maxPct = useMemo(() => Math.max(...mistakes.map((m) => m.pct)), [mistakes]);

  /* Importe corto para celdas estrechas (85 px a 320 px de ancho); la cifra
     exacta queda en el `title` de cada ficha. La abreviatura es manual:
     `notation: "compact"` da «121,1 mil» en español, más largo que el número. */
  const corto = useCallback(
    (v: number) => {
      const a = Math.abs(v);
      const signo = v < 0 ? "−" : "";
      /* «$» y no «US$»: a 320 px la ficha no admite dos caracteres más. */
      const corto = (cifra: string, sufijo: string) =>
        lang === "es" ? `${signo}${cifra}${sufijo ? `\u00a0${sufijo}` : ""}\u00a0$` : `${signo}$${cifra}${sufijo}`;
      if (a >= 1_000_000) return corto(fmtNum(a / 1_000_000, lang, 1), "M");
      if (a >= 10_000) return corto(fmtNum(a / 1_000, lang, 0), "k");
      return corto(fmtNum(a, lang, 0), "");
    },
    [lang],
  );

  /* La divisa cambia de sitio con el idioma («29,73 $» / «$29.73»). El signo
     se pasa aparte porque estas celdas lo fuerzan con independencia del
     valor: la fila de fuera de plan es negativa por definición. */
  const usd = useCallback(
    (signo: string, v: number) =>
      es ? `${signo}${fmtNum(v, lang, 2)}\u00a0$` : `${signo}$${fmtNum(v, lang, 2)}`,
    [es, lang],
  );

  /* Una cifra con su signo real y su color: «+29,73 $», «−38,47 $», «0,00 $». */
  const usdSigno = (v: number) => {
    const r = Number(v.toFixed(2));
    return usd(r > 0 ? "+" : r < 0 ? "−" : "", Math.abs(r));
  };
  const colorSigno = (v: number) =>
    Number(v.toFixed(2)) > 0 ? "text-[rgb(var(--pnl-pos))]" : Number(v.toFixed(2)) < 0 ? "text-[rgb(var(--pnl-neg))]" : "text-primary";
  /* Tocar una cifra a mano deja de ser el escenario elegido. */
  const aMano = <T,>(fijar: (v: T) => void) => (v: T) => {
    fijar(v);
    setActivePreset("custom");
  };

  const aplicarPreset = (p: typeof PRESETS[0]) => {
    setActivePreset(p.id);
    setTotalTrades(p.trades);
    setBreachPct(p.breachPct);
    setInPlanExp(p.inPlanExp);
    setOffPlanExp(p.offPlanExp);
  };

  const informe = () => {
    /* `fmtMoney` pone millares, divisa y el signo menos tipográfico de la casa. */
    const usd = (v: number) => fmtMoney(v, lang, { sign: true });
    return componerInforme(
      es ? "Coste de indisciplina" : "Cost of indiscipline",
      [
        {
          lineas: [
            `${es ? "Operaciones al mes" : "Trades per month"}: ${totalTrades} (${breachPct}${pctSep(lang)} ${es ? "fuera de plan" : "off-plan"})`,
            `${es ? "Resultado medio en plan, por operación" : "Avg result in-plan, per trade"}: ${usd(inPlanExp)}`,
            `${es ? "Resultado medio fuera de plan" : "Avg result off-plan"}: ${usd(offPlanExp)}`,
          ],
        },
        {
          rotulo: es ? "Resultado" : "Result",
          lineas: [
            `${es ? "Brecha por operación" : "Gap per trade"}: ${usd(-gap)}`,
            `${es ? "Fuga mensual" : "Monthly leak"}: ${usd(-totalLeakMonthly)}`,
            `${es ? "Fuga anual proyectada" : "Projected annual leak"}: ${usd(-totalLeakAnnual)}`,
          ],
        },
      ],
      `${es ? "" : "/en"}/herramientas/coste-de-indisciplina/`,
    );
  };

  return (
    <section className="section-tight">
      {/* Mismo vocabulario que el resumen copiado: «fuga mensual» y «fuga anual». */}
      <ResultadoAnunciado
        texto={
          es
            ? `Fuga mensual: ${fmtMoney(-totalLeakMonthly, lang, { sign: true })}. Fuga anual proyectada: ${fmtMoney(-totalLeakAnnual, lang, { sign: true })}.`
            : `Monthly leak: ${fmtMoney(-totalLeakMonthly, lang, { sign: true })}. Projected annual leak: ${fmtMoney(-totalLeakAnnual, lang, { sign: true })}.`
        }
      />
      <div className="tj-container">
        {/* Cabecera de sección */}
        <div className="inline-flex items-center gap-3 mb-5">
          <span className="eyebrow" data-titular-herramienta>
            {es ? "Calculadora de indisciplina" : "Indiscipline calculator"}
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-12 items-start">
          <div>
            <h2 data-titular-herramienta className="t-h2 m-0 text-primary max-w-[24ch]"
            >
              {es ? (
                <>
                  Lo que tu indisciplina te cuesta.
                </>
              ) : (
                <>
                  What your indiscipline costs you.
                </>
              )}
            </h2>
            <p
              className="t-entradilla mt-4 mb-6"
              style={{
                color: "var(--ink-2)",
                maxWidth: "38em",
              }}
            >
              {es
                ? "Pon tu resultado medio en plan y fuera de plan, y cuántas operaciones rompen tus reglas. La calculadora estima el dinero que dejas en la mesa cada mes y cada año."
                : "Enter your average result in plan and off plan, and how many trades break your rules. The calculator estimates the money left on the table each month and year."}
            </p>

            {/* Presets rápidos */}
            <div className="mb-6">
              <span id={idEscenarios} className="block text-[12px] text-tertiary mb-2">
                {es ? "Escenarios rápidos" : "Quick scenarios"}
              </span>
              {/* Una elección entre tres: conmutador segmentado, como en la
                  calculadora de riesgo y el proyector. */}
              <div className="tj-segmentado tj-segmentado-apila" role="group" aria-labelledby={idEscenarios}>
                {PRESETS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    aria-pressed={activePreset === p.id}
                    onClick={() => aplicarPreset(p)}
                    className="toque-comodo"
                  >
                    {es ? p.nameEs : p.nameEn}
                  </button>
                ))}
              </div>
            </div>

            {/* Controles interactivos */}
            <div className="tj-ficha p-5 mb-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label htmlFor="disc-trades" className="tj-deslizador-etiqueta">
                      {es ? "Operaciones al mes" : "Trades per month"}
                    </label>
                    <span className="tj-deslizador-valor">{fmtNum(totalTrades, lang, 0)}</span>
                  </div>
                  <input
                    id="disc-trades"
                    type="range"
                    min={10}
                    max={200}
                    step={2}
                    value={totalTrades}
                    onChange={(e) => aMano(setTotalTrades)(Number(e.target.value))}
                    aria-valuetext={fmtOperaciones(totalTrades, lang)}
                    /* `.tj-range` trae los 44 px, la bolita y la pista de dos
                       tramos; sin ella WebKit deja el control sin agarradera. */
                    className="tj-range w-full"
                    style={
                      {
                        "--f": ((totalTrades - 10) / (200 - 10)),
                      } as CSSProperties
                    }
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label htmlFor="disc-breach" className="tj-deslizador-etiqueta">
                      {es ? "Fuera de plan (fallos)" : "Off-plan (breaches)"}
                    </label>
                    <span className="tj-deslizador-valor">{fmtPct(breachPct / 100, lang, 0)}</span>
                  </div>
                  <input
                    id="disc-breach"
                    type="range"
                    min={5}
                    max={80}
                    step={1}
                    value={breachPct}
                    onChange={(e) => aMano(setBreachPct)(Number(e.target.value))}
                    aria-valuetext={fmtPct(breachPct / 100, lang, 0)}
                    className="tj-range w-full"
                    style={
                      {
                        "--f": ((breachPct - 5) / (80 - 5)),
                      } as CSSProperties
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[var(--ficha-division)]">
                <div>
                  <label htmlFor="disc-inplan" className="block text-[12px] text-tertiary mb-1">
                    {es ? "Resultado medio en plan, por operación" : "Avg result in-plan, per trade"}
                  </label>
                  <CampoUnidad
                    id="disc-inplan"
                    unidad="$"
                    antes={!es}
                    paso={1}
                    valor={inPlanExp}
                    onValor={aMano(setInPlanExp)}
                    className="text-primary"
                  />
                </div>

                <div>
                  <label htmlFor="disc-offplan" className="block text-[12px] text-tertiary mb-1">
                    {es ? "Resultado medio fuera de plan" : "Avg result off-plan"}
                  </label>
                  <CampoUnidad
                    id="disc-offplan"
                    unidad="$"
                    antes={!es}
                    paso={1}
                    valor={offPlanExp}
                    onValor={aMano(setOffPlanExp)}
                    className={offPlanExp < 0 ? "text-[rgb(var(--pnl-neg))]" : "text-primary"}
                  />
                </div>
              </div>
            </div>

            {/* Tabla Expectancy interactiva */}
            <div
              className="tj-ficha overflow-hidden"
            >
              {/* <table> real con `display: grid` (no una rejilla de <div>) para
                  que el lector asocie cada cifra con su columna y su fila.
                  <thead>/<tbody> van en `contents` para que los <tr> sean hijos
                  directos de la rejilla y el subgrid encuentre las columnas.
                  Las columnas se miden con la cifra más ancha: un importe grande
                  ensancha la tabla (y se desliza) en vez de pisar la vecina. */}
              <div className="overflow-x-auto custom-scroll">
                <table className="grid w-max min-w-full grid-cols-[minmax(max-content,1.25fr)_minmax(max-content,2.25rem)_minmax(max-content,1fr)_minmax(max-content,1.15fr)] border-collapse">
                <thead className="contents">
                <tr className="col-span-4 grid grid-cols-subgrid gap-x-3 whitespace-nowrap border-b border-[var(--ficha-division)] px-2.5 py-3 text-sm text-[var(--ink-3)]">
                  <th scope="col" className="tnum text-left text-[12px] font-normal">{es ? "Modo" : "Mode"}</th>
                  <th scope="col" className="tnum text-right text-[12px] font-normal">{es ? "Ops" : "Trades"}</th>
                  <th scope="col" className="tnum text-right text-[12px] font-normal">{es ? "Expectancy" : "Expectancy"}</th>
                  <th scope="col" className="tnum text-right text-[12px] font-normal">{es ? "Neto" : "Net P&L"}</th>
                </tr>
                </thead>
                <tbody className="contents">

                {/* Fila En Plan */}
                <tr className="col-span-4 grid grid-cols-subgrid gap-x-3 whitespace-nowrap items-center border-b px-2.5 py-3 text-sm border-[var(--ficha-division)] relative group">
                  <th scope="row" className="text-left font-medium text-primary text-[14px]">{es ? "En plan" : "In plan"}</th>
                  <td className="tnum text-right text-secondary text-[14px]">{inPlanTrades}</td>
                  <td className={`tnum text-right text-[14px] font-semibold ${colorSigno(inPlanExp)}`}>
                    {usdSigno(inPlanExp)}
                  </td>
                  <td className={`tnum text-right text-[14px] font-semibold ${colorSigno(inPlanTotal)}`}>
                    {usdSigno(inPlanTotal)}
                  </td>
                </tr>

                {/* Fila Fuera de Plan */}
                <tr className="col-span-4 grid grid-cols-subgrid gap-x-3 whitespace-nowrap items-center border-b px-2.5 py-3 text-sm border-[var(--ficha-division)] relative group">
                  <th scope="row" className="text-left font-medium text-primary text-[14px]">{es ? "Fuera de plan" : "Off plan"}</th>
                  <td className="tnum text-right text-secondary text-[14px]">{offPlanTrades}</td>
                  <td className={`tnum text-right text-[14px] font-semibold ${colorSigno(offPlanExp)}`}>
                    {usdSigno(offPlanExp)}
                  </td>
                  <td className={`tnum text-right text-[14px] font-semibold ${colorSigno(offPlanTotal)}`}>
                    {usdSigno(offPlanTotal)}
                  </td>
                </tr>

                {/* Fila Gap */}
                <tr className="relative col-span-4 grid grid-cols-subgrid gap-x-3 whitespace-nowrap items-center px-2.5 py-3.5 text-sm">
                  <th scope="row" className="text-left font-semibold text-primary text-[14px]">{es ? "Brecha" : "Gap"}</th>
                  <td className="tnum text-right text-secondary text-[14px]">—</td>
                  <td className="tnum text-right font-semibold text-[rgb(var(--pnl-neg))] text-[14px]">
                    {usdSigno(-gap)}
                  </td>
                  <td className="tnum text-right text-[14px] font-semibold text-[rgb(var(--pnl-neg))]">
                    {usdSigno(-totalLeakMonthly)}
                  </td>
                </tr>
                </tbody>
                </table>
              </div>
            </div>

            <p className="medida mt-3 text-[13px] text-tertiary leading-[1.6]">
              {es
                ? "La brecha es el dinero que dejas de ganar en cada operación que rompe las reglas frente a haberla ejecutado con disciplina."
                : "The gap is the cash lost on every off-plan trade compared to executing cleanly inside your rules."}
            </p>
            {(sinCoste || planPierde) && (
              <p className="medida mt-2 text-[13px] leading-[1.6] text-secondary">
                {planPierde
                  ? es
                    ? "Con estas cifras, tu plan pierde dinero de media: antes que la disciplina, lo que hay que revisar es el plan."
                    : "With these numbers your plan loses money on average: before discipline, it is the plan that needs reviewing."
                  : es
                    ? "Con estas cifras, fuera de plan rindes igual o más que dentro: saltarte el plan no te cuesta dinero, y la factura queda a cero."
                    : "With these numbers, off-plan trades do as well as or better than in-plan ones: breaking the plan costs you nothing, and the invoice stays at zero."}
              </p>
            )}
          </div>

          {/* Factura Dinámica */}
          <div className="relative tj-ficha">
            <p className="tj-ficha-barra">
              <span>{es ? "Factura de indisciplina" : "Indiscipline invoice"}</span>
              <span>{es ? "Al mes, con tus cifras" : "Monthly, from your numbers"}</span>
            </p>
            <div className="tj-ficha-cuerpo">

            {/* Desglose en tres columnas: concepto (elástica, `minmax(0,1fr)`),
                porcentaje e importe a su ancho natural. La barra se mide contra
                el error mayor (`maxPct`): con un multiplicador fijo se recortaría
                en silencio por encima de cierto valor. */}
            <ul className="m-0 mb-5 list-none space-y-3.5 p-0">
              {mistakes.map((row) => {
                const mistakeCost = (totalLeakMonthly * row.pct) / 100;
                return (
                  <li key={row.id}>
                    <div className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-baseline gap-x-2.5 text-xs">
                      {/* Se parte en dos líneas, no se trunca: cortado no dice nada. */}
                      <span className="min-w-0 font-medium leading-[1.3] text-primary [overflow-wrap:anywhere]">
                        {es ? row.labelEs : row.labelEn}
                      </span>
                      <span className="tnum whitespace-nowrap text-[12px] text-tertiary">
                        {row.pct}
                        {pctSep(lang)}
                      </span>
                      {/* Ancho mínimo común: la columna no baila al cambiar las cifras. */}
                      <span className="tnum min-w-[4.5rem] whitespace-nowrap text-right font-semibold text-[rgb(var(--pnl-neg))]">
                        {corto(-mistakeCost)}
                      </span>
                    </div>
                    <div className="relative mt-1.5 h-[3px] overflow-hidden bg-[rgb(var(--divider)/0.10)]">
                      <div
                        className="h-full bg-[var(--ink-3)] transition-[width] duration-300 ease-[var(--ease-suave)]"
                        style={{ width: `${(row.pct / maxPct) * 100}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>

            {/* Totales: Mensual y Anual */}
            <div className="pt-1 border-t border-[var(--ficha-division)]">
              {/* El rótulo es la única columna elástica y la cifra lleva `clamp`:
                  a 320 px encoge en vez de salirse. */}
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 py-4">
                <div className="min-w-0">
                  <span className="block text-[14px] font-semibold leading-[1.3] text-primary [overflow-wrap:anywhere]">
                    {es ? "Fuga mensual total" : "Total monthly leak"}
                  </span>
                  <span className="block text-[13px] leading-[1.3] text-tertiary [overflow-wrap:anywhere]">
                    {es ? `${fmtOperaciones(offPlanTrades, lang)} ${offPlanTrades === 1 ? "indisciplinada" : "indisciplinadas"}` : `${offPlanTrades} off-plan ${offPlanTrades === 1 ? "trade" : "trades"}`}
                  </span>
                </div>
                <span
                  className="tj-cifra text-[rgb(var(--pnl-neg))]"
                >
                  {fmtMoney(-totalLeakMonthly, lang)}
                </span>
              </div>

              {/* Proyección a 1, 3 y 5 años: notación corta (`corto`, importe exacto
                  en el `title`) y cuerpo con `clamp` para no desbordar a 320 px. */}
              <div className="border-t border-[var(--ficha-division)] pt-4">
                <span className="block text-[12px] font-semibold text-primary">
                  {es ? "Capital fugado acumulado" : "Cumulative leaked capital"}
                </span>
                <span className="mb-2.5 block text-[12px] text-tertiary">
                  {es
                    ? `Supuesto: reinvertido al ${fmtPct(TASA_REINVERSION_ANUAL, lang, 0)} anual`
                    : `Assumption: reinvested at ${fmtPct(TASA_REINVERSION_ANUAL, lang, 0)} p.a.`}
                </span>
                <div className="tj-matriz grid-cols-3 text-center tnum">
                  {([1, 3, 5] as const).map((yr) => {
                    const months = yr * 12;
                    const rMonthly = TASA_REINVERSION_ANUAL / 12;
                    let fv = 0;
                    for (let m = 1; m <= months; m++) {
                      fv = (fv + totalLeakMonthly) * (1 + rMonthly);
                    }
                    return (
                      <div
                        key={yr}
                        title={fmtMoney(-fv, lang)}
                        className="caja-cifra min-w-0 px-1.5 py-3"
                      >
                        <span className="block text-[12px] text-tertiary">
                          {yr} {yr === 1 ? (es ? "año" : "year") : (es ? "años" : "years")}
                        </span>
                        <span
                          className="tnum cifra-sm block whitespace-nowrap font-semibold text-[rgb(var(--pnl-neg))]"
                          
                        >
                          {corto(-fv)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Plan de Recuperación con el Guardián */}
            {totalLeakMonthly > 0 && (
              <div className="mt-5 border-t border-[var(--ficha-division)] pt-4">
                <div className="flex items-baseline justify-between gap-2 mb-2">
                  <span className="text-[12px] font-semibold text-primary">
                    {es ? "Si evitaras parte de la fuga" : "If you avoided part of the leak"}
                  </span>
                  <span className="text-[12px] text-tertiary">
                    {es ? "Escenario" : "Scenario"}
                  </span>
                </div>
                <p className="medida text-xs text-secondary leading-relaxed mb-3">
                  {es
                    ? `Si evitaras el 60\u00a0% de tus operaciones fuera de plan, dejarías de perder unos ${fmtMoney(Math.round(totalLeakMonthly * 0.6), lang, { decimals: 0 })} al mes. Es una estimación con tus cifras, no una promesa de resultado.`
                    : `If you avoided 60% of your off-plan trades, you would stop losing about ${fmtMoney(Math.round(totalLeakMonthly * 0.6), lang, { decimals: 0 })} a month. It is an estimate from your numbers, not a promise of results.`}
                </p>
                {/* Como la proyección: el «al mes» baja a su propia línea. */}
                <div className="tj-matriz grid-cols-2 text-center tnum">
                  {[0.5, 0.8].map((f) => (
                    <div
                      key={f}
                      title={`+${fmtMoney(totalLeakMonthly * f, lang)}`}
                      className="caja-cifra min-w-0 px-1.5 py-3"
                    >
                      <span className="block text-[12px] text-tertiary">
                        {es
                          ? `Evitando el ${fmtNum(f * 100, lang, 0)}${pctSep(lang)}`
                          : `Avoiding ${fmtNum(f * 100, lang, 0)}${pctSep(lang)}`}
                      </span>
                      <span
                        className="tnum cifra-sm block whitespace-nowrap font-semibold text-[rgb(var(--pnl-pos))]"
                        
                      >
                        +{corto(totalLeakMonthly * f).replace("−", "")}
                      </span>
                      <span className="block text-[12px] text-tertiary">
                        {es ? "al mes" : "per month"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            </div>
            <div className="tj-ficha-barra tj-ficha-barra--pie">
              <BotonCopiar
                texto={informe}
                rotulo={es ? "Copiar resumen" : "Copy summary"}
                hecho={es ? "Resumen copiado" : "Summary copied"}
              />
              <span className="text-tertiary">
                {es ? "Privado en tu navegador" : "Private in your browser"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
