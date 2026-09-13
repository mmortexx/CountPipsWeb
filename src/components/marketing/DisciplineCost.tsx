"use client";

import { useCallback, useMemo, useState, type CSSProperties } from "react";
import { useLang } from "@/lib/i18n";
import { ANIO_PUBLICACION } from "@/lib/publicacion";
import { fmtMoney, fmtNum } from "@/lib/trading/format";

interface MistakeItem {
  id: string;
  labelEs: string;
  labelEn: string;
  pct: number;
}

const PRESETS = [
  {
    id: "prop",
    nameEs: "Trader de Prop Firm",
    nameEn: "Prop Firm Trader",
    trades: 50,
    breachPct: 30,
    inPlanExp: 55,
    offPlanExp: -75,
  },
  {
    id: "scalper",
    nameEs: "Scalper de Futuros / Cripto",
    nameEn: "Futures / Crypto Scalper",
    trades: 80,
    breachPct: 40,
    inPlanExp: 38,
    offPlanExp: -52,
  },
  {
    id: "swing",
    nameEs: "Swing Trader Discrecional",
    nameEn: "Discretionary Swing Trader",
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
export function DisciplineCost({ num = "05·b" }: { num?: string }) {
  const { lang } = useLang();
  const es = lang === "es";

  // Estado editable
  const [totalTrades, setTotalTrades] = useState(60);
  const [breachPct, setBreachPct] = useState(40);
  const [inPlanExp, setInPlanExp] = useState(29.73);
  const [offPlanExp, setOffPlanExp] = useState(-38.47);
  const [copied, setCopied] = useState(false);
  const [activePreset, setActivePreset] = useState<string>("custom");

  // Cálculos reactivos
  const offPlanTrades = Math.round((totalTrades * breachPct) / 100);
  const inPlanTrades = Math.max(0, totalTrades - offPlanTrades);

  const gap = inPlanExp - offPlanExp;
  const inPlanTotal = inPlanTrades * inPlanExp;
  const offPlanTotal = offPlanTrades * offPlanExp;
  const totalLeakMonthly = offPlanTrades * gap;
  const totalLeakAnnual = totalLeakMonthly * 12;

  const mistakes: MistakeItem[] = useMemo(() => [
    { id: "offhours", labelEs: "Operar fuera de horario", labelEn: "Trading off-hours", pct: 32 },
    { id: "oversize", labelEs: "Tamaño excesivo (Oversize)", labelEn: "Oversized position", pct: 27 },
    { id: "nostop", labelEs: "Sin stop loss / omitido", labelEn: "No stop loss / omitted", pct: 18 },
    { id: "chasing", labelEs: "Perseguir el precio (FOMO)", labelEn: "Chasing price (FOMO)", pct: 14 },
    { id: "movingstop", labelEs: "Mover stop loss en contra", labelEn: "Manually moving stop", pct: 9 },
  ], []);

  /** El error mas gordo, que es contra el que se miden las barras. */
  const maxPct = useMemo(() => Math.max(...mistakes.map((m) => m.pct)), [mistakes]);

  /* ── IMPORTE CORTO PARA CELDAS ESTRECHAS ──────────────────────────
     Las fichas de proyeccion miden 85 px a 320 px de ancho y
     «−121.068,70 US$» no cabe: se salia 52 px. La cifra exacta se
     conserva en el `title` de cada ficha.

     La abreviatura se escribe A MANO y no con `notation: "compact"` de
     Intl, porque en espanol eso devuelve «121,1 mil», que ocupa MAS que
     el numero entero — comprobado, empeoraba el desborde en vez de
     arreglarlo. «k» y «M» son ademas como se abrevian las cifras
     agregadas en una mesa, en los dos idiomas. */
  const corto = useCallback(
    (v: number) => {
      const a = Math.abs(v);
      const signo = v < 0 ? "−" : "";
      /* «$» y no «US$» en las abreviadas: la ficha mide 73 px de
         contenido a 320 px y los dos caracteres de mas eran justo lo que
         no cabia. El importe completo, con su divisa, esta en el `title`
         de la ficha y en el resumen que se copia. */
      if (a >= 1_000_000) return `${signo}${fmtNum(a / 1_000_000, lang, 1)} M $`;
      if (a >= 10_000) return `${signo}${fmtNum(a / 1_000, lang, 0)} k $`;
      return `${signo}${fmtNum(a, lang, 0)} $`;
    },
    [lang],
  );

  const aplicarPreset = (p: typeof PRESETS[0]) => {
    setActivePreset(p.id);
    setTotalTrades(p.trades);
    setBreachPct(p.breachPct);
    setInPlanExp(p.inPlanExp);
    setOffPlanExp(p.offPlanExp);
  };

  const copiarResumen = () => {
    /* Las seis cifras del resumen salían de `toFixed`, o sea con punto
       decimal inglés, dentro de un texto castellano cuyo porcentaje
       ya llevaba su espacio duro. Es texto que el visitante se lleva:
       `fmtMoney` pone separador de millares, divisa, y el signo
       menos tipográfico que usa el resto del sitio. */
    const eur = (v: number) => fmtMoney(v, lang, { sign: true });
    const texto = es
      ? `Factura de Indisciplina (CountPips):\n• Operaciones/mes: ${totalTrades} (${breachPct}\u00a0% fuera de plan)\n• Expectancy en plan: ${eur(inPlanExp)}\n• Expectancy fuera de plan: ${eur(offPlanExp)}\n• Brecha por operación: ${eur(-gap)}\n• Fuga mensual: ${eur(-totalLeakMonthly)}\n• Fuga anual proyectada: ${eur(-totalLeakAnnual)}`
      : `Indiscipline Invoice (CountPips):\n• Trades/month: ${totalTrades} (${breachPct}% off-plan)\n• In-plan expectancy: ${eur(inPlanExp)}\n• Off-plan expectancy: ${eur(offPlanExp)}\n• Gap per trade: ${eur(-gap)}\n• Monthly leak: ${eur(-totalLeakMonthly)}\n• Projected annual leak: ${eur(-totalLeakAnnual)}`;

    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(texto).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2200);
      });
    }
  };

  return (
    <section className="section-tight border-t border-[rgb(var(--divider)/0.06)]">
      <div className="max-w-[1240px] mx-auto px-5 md:px-8">
        {/* Cabecera de sección */}
        <div className="inline-flex items-center gap-3 mb-5">
          <span
            className="tnum"
            style={{ fontSize: 12, fontWeight: 500, letterSpacing: "0.04em", color: "rgb(var(--accent-base))" }}
          >
            § {num}
          </span>
          <span aria-hidden style={{ width: 22, height: 1, background: "rgb(var(--divider) / 0.13)" }} />
          <span
            className="tnum"
            style={{ fontSize: 11, letterSpacing: "0.2em", color: "var(--ink-3)" }}
          >
            {es ? "COSTE REAL E INTERACTIVO" : "REAL & INTERACTIVE COST"}
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-12 items-start">
          <div>
            <h2
              className="font-serif m-0"
              style={{
                fontSize: "clamp(2rem, 3.6vw, 3rem)",
                fontWeight: 400,
                letterSpacing: "-0.022em",
                lineHeight: 1.08,
                color: "var(--ink)",
                textWrap: "balance",
              }}
            >
              {es ? (
                <>
                  Lo que tu <span style={{ color: "rgb(var(--accent-base))" }}>indisciplina</span> te cuesta.
                </>
              ) : (
                <>
                  What your <span style={{ color: "rgb(var(--accent-base))" }}>indiscipline</span> costs you.
                </>
              )}
            </h2>
            <p
              className="mt-4 mb-6"
              style={{
                fontSize: "clamp(1rem, 1.25vw, 1.08rem)",
                lineHeight: 1.6,
                color: "var(--ink-2)",
                maxWidth: "38em",
              }}
            >
              {es
                ? "Cuando operas tu plan ganas. Cuando improvisas o violas tus reglas, regalas capital. Ajusta tus cifras y calcula el dinero exacto que dejas en la mesa cada mes y cada año."
                : "When you trade your plan, you win. When you improvise or break your rules, you bleed capital. Adjust your numbers and discover the exact money left on the table each month and year."}
            </p>

            {/* Presets rápidos */}
            <div className="mb-6">
              <span className="block text-[11px] uppercase tracking-[0.14em] text-tertiary mb-2">
                {es ? "Escenarios rápidos" : "Quick scenarios"}
              </span>
              <div className="flex flex-wrap gap-2">
                {PRESETS.map((p) => {
                  const active = activePreset === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      aria-pressed={active}
                      onClick={() => aplicarPreset(p)}
                      className={`toque-comodo h-8 px-3 rounded-[2px] text-[12.5px] font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--accent-base)/0.55)] ${
                        active
                          ? "bg-[rgb(var(--accent-base))] text-[rgb(var(--accent-ink))] font-semibold shadow-sm"
                          : "border border-[rgb(var(--divider)/0.15)] bg-[rgb(var(--divider)/0.03)] hover:bg-[rgb(var(--divider)/0.08)] hover:border-[rgb(var(--accent-base)/0.4)] text-secondary hover:text-primary"
                      }`}
                    >
                      {es ? p.nameEs : p.nameEn}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Controles interactivos */}
            <div className="rounded-[2px] border border-[rgb(var(--divider)/0.13)] bg-[color-mix(in_oklab,var(--surface)_70%,transparent)] p-5 backdrop-blur-md mb-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label htmlFor="disc-trades" className="text-xs font-medium text-secondary">
                      {es ? "Operaciones al mes" : "Trades per month"}
                    </label>
                    <span className="tnum text-xs font-semibold text-primary">{totalTrades}</span>
                  </div>
                  <input
                    id="disc-trades"
                    type="range"
                    min={10}
                    max={200}
                    step={2}
                    value={totalTrades}
                    onChange={(e) => setTotalTrades(Number(e.target.value))}
                    /* `.tj-range`, como los otros seis deslizadores del
                       sitio. Antes era `appearance-none` con 6 px de alto
                       y sin regla de bolita: en WebKit eso deja el control
                       SIN AGARRADERA —no se ve qué se arrastra— y 6 px no
                       se cogen con el dedo. La clase trae los 44 px, la
                       bolita y la pista de dos tramos. */
                    className="tj-range w-full"
                    style={
                      {
                        "--pct": `${((totalTrades - 10) / (200 - 10)) * 100}%`,
                      } as CSSProperties
                    }
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label htmlFor="disc-breach" className="text-xs font-medium text-secondary">
                      {es ? "% fuera de plan (fallos)" : "% off-plan (breaches)"}
                    </label>
                    <span className="tnum text-xs font-semibold text-[rgb(var(--pnl-neg))]">{breachPct} %</span>
                  </div>
                  <input
                    id="disc-breach"
                    type="range"
                    min={5}
                    max={80}
                    step={1}
                    value={breachPct}
                    onChange={(e) => setBreachPct(Number(e.target.value))}
                    /* El tramo recorrido va en rojo porque lo que mide es
                       el porcentaje de operaciones FUERA de plan: aquí más
                       es peor. `--tj-recorrido` existe justamente para
                       cambiar ese tramo sin reescribir la pista. */
                    className="tj-range w-full"
                    style={
                      {
                        accentColor: "rgb(var(--pnl-neg))",
                        "--tj-recorrido": "rgb(var(--pnl-neg))",
                        "--pct": `${((breachPct - 5) / (80 - 5)) * 100}%`,
                      } as CSSProperties
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[rgb(var(--divider)/0.08)]">
                <div>
                  <label htmlFor="disc-inplan" className="block text-[11px] uppercase tracking-wider text-tertiary mb-1">
                    {es ? "Ganancia media en plan ($/op.)" : "Avg win in-plan ($/trade)"}
                  </label>
                  <div className="relative">
                    <input
                      id="disc-inplan"
                      type="number"
                      step={1}
                      min={0}
                      value={inPlanExp}
                      onChange={(e) => setInPlanExp(Number(e.target.value))}
                      className="w-full h-9 rounded-[2px] border border-[rgb(var(--divider)/0.15)] bg-[rgb(var(--divider)/0.04)] px-3 text-sm text-primary tnum outline-none focus:border-[rgb(var(--accent-base))]"
                    />
                    <span className="absolute right-3 top-2 text-xs text-tertiary">$</span>
                  </div>
                </div>

                <div>
                  <label htmlFor="disc-offplan" className="block text-[11px] uppercase tracking-wider text-tertiary mb-1">
                    {es ? "Resultado medio fuera de plan ($)" : "Avg result off-plan ($)"}
                  </label>
                  <div className="relative">
                    <input
                      id="disc-offplan"
                      type="number"
                      step={1}
                      max={0}
                      value={offPlanExp}
                      onChange={(e) => setOffPlanExp(Number(e.target.value))}
                      className="w-full h-9 rounded-[2px] border border-[rgb(var(--divider)/0.15)] bg-[rgb(var(--divider)/0.04)] px-3 text-sm text-[rgb(var(--pnl-neg))] tnum outline-none focus:border-[rgb(var(--pnl-neg))]"
                    />
                    <span className="absolute right-3 top-2 text-xs text-tertiary">$</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Tabla Expectancy interactiva */}
            <div
              className="rounded-[2px] overflow-hidden border border-[rgb(var(--divider)/0.13)] bg-[color-mix(in_oklab,var(--surface)_70%,transparent)] backdrop-blur-md"
            >
              <div className="overflow-x-auto custom-scroll">
                <div className="grid grid-cols-4 min-w-[400px] border-b border-[rgb(var(--divider)/0.06)] px-2.5 py-3 text-sm text-[var(--ink-3)]">
                  <span className="tnum text-[10px] uppercase tracking-[0.14em]">{es ? "Modo" : "Mode"}</span>
                  <span className="tnum text-right text-[10px] uppercase tracking-[0.14em]">{es ? "Ops" : "Trades"}</span>
                  <span className="tnum text-right text-[10px] uppercase tracking-[0.14em]">{es ? "Expectancy" : "Expectancy"}</span>
                  <span className="tnum text-right text-[10px] uppercase tracking-[0.14em]">{es ? "Neto" : "Net P&L"}</span>
                </div>

                {/* Fila En Plan */}
                <div className="grid min-w-[400px] grid-cols-4 items-center border-b px-2.5 py-3 text-sm border-[rgb(var(--divider)/0.06)] relative group">
                  <span className="absolute left-0 top-0 bottom-0 w-[2px] bg-[rgb(var(--accent-base))]" />
                  <span className="font-medium text-primary text-[13.5px]">{es ? "En plan" : "In plan"}</span>
                  <span className="tnum text-right text-secondary text-[13.5px]">{inPlanTrades}</span>
                  <span className="tnum text-right text-[13px] font-semibold text-[rgb(var(--pnl-pos))]">
                    +{fmtNum(inPlanExp, lang, 2)} $
                  </span>
                  <span className="tnum text-right text-[13px] font-semibold text-[rgb(var(--pnl-pos))]">
                    +{fmtNum(inPlanTotal, lang, 2)} $
                  </span>
                </div>

                {/* Fila Fuera de Plan */}
                <div className="grid min-w-[400px] grid-cols-4 items-center border-b px-2.5 py-3 text-sm border-[rgb(var(--divider)/0.06)] relative group">
                  <span className="absolute left-0 top-0 bottom-0 w-[2px] bg-[rgb(var(--pnl-neg))]" />
                  <span className="font-medium text-primary text-[13.5px]">{es ? "Fuera de plan" : "Off plan"}</span>
                  <span className="tnum text-right text-secondary text-[13.5px]">{offPlanTrades}</span>
                  <span className="tnum text-right text-[13px] font-semibold text-[rgb(var(--pnl-neg))]">
                    {fmtNum(offPlanExp, lang, 2)} $
                  </span>
                  <span className="tnum text-right text-[13px] font-semibold text-[rgb(var(--pnl-neg))]">
                    {fmtNum(offPlanTotal, lang, 2)} $
                  </span>
                </div>

                {/* Fila Gap */}
                <div className="relative grid min-w-[400px] grid-cols-4 items-center bg-[color-mix(in_oklab,rgb(var(--pnl-neg))_6%,transparent)] px-2.5 py-3.5 text-sm">
                  <span className="absolute left-0 top-0 bottom-0 w-[3px] bg-[rgb(var(--pnl-neg))]" />
                  <span className="font-bold text-primary text-[14px]">GAP</span>
                  <span className="tnum text-right text-secondary text-[13px]">—</span>
                  <span className="tnum text-right font-bold text-[rgb(var(--pnl-neg))] text-[14px]">
                    −{fmtNum(gap, lang, 2)} $
                  </span>
                  <span className="tnum text-right text-[14px] font-bold text-[rgb(var(--pnl-neg))]">
                    −{fmtNum(totalLeakMonthly, lang, 2)} $
                  </span>
                </div>
              </div>
            </div>

            <p className="mt-3 text-[11.5px] text-tertiary leading-relaxed">
              {es
                ? "El GAP es el dinero que dejas de ganar en cada operación que rompe las reglas frente a haberla ejecutado con disciplina."
                : "The GAP is the cash lost on every off-plan trade compared to executing cleanly inside your rules."}
            </p>
          </div>

          {/* Factura Dinámica */}
          <div
            className="relative p-6 rounded-[3px] border border-[rgb(var(--divider)/0.14)] bg-[color-mix(in_oklab,var(--surface)_75%,transparent)] backdrop-blur-sm shadow-xl"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-[rgb(var(--divider)/0.08)]">
              <div>
                <span className="tnum text-[11px] font-semibold uppercase tracking-[0.14em] text-tertiary block">
                  {es ? "Factura de indisciplina" : "Indiscipline invoice"}
                </span>
                <span className="text-xs text-secondary">
                  {es ? "Estimación mensual personalizada" : "Personalized monthly estimate"}
                </span>
              </div>
              <span
                className="tnum text-[10px] px-2.5 py-1 rounded-[2px] bg-[rgb(var(--pnl-neg)/0.14)] text-[rgb(var(--pnl-neg))] border border-[rgb(var(--pnl-neg)/0.28)] font-mono self-start sm:self-auto"
              >
                #LEAK-{ANIO_PUBLICACION}
              </span>
            </div>

            {/* ── EL DESGLOSE, COMO UN LIBRO DE CUENTAS ──────────────
                Tres columnas declaradas: concepto, porcentaje e importe.
                El concepto es la única elástica (`minmax(0,1fr)`) y las
                otras dos van a su ancho natural sin partirse. Antes era
                un `justify-between` con los tres apilados en un flex, y
                a 320 px el importe salía 45 px fuera de la caja.

                La barra se mide contra el error MAYOR, no contra un
                multiplicador inventado: estaba en `pct * 2.5`, que da la
                barra llena justo en el 40 % y por encima se recorta en
                silencio. Con el máximo real, la más larga siempre llega
                al borde y la comparación entre ellas es honesta. */}
            <ul className="m-0 mb-5 list-none space-y-3.5 p-0">
              {mistakes.map((row) => {
                const mistakeCost = (totalLeakMonthly * row.pct) / 100;
                return (
                  <li key={row.id}>
                    <div className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-baseline gap-x-2.5 text-xs">
                      {/* Se parte en dos lineas, no se trunca: «Tamaño
                          excesivo (Oversize)» con puntos suspensivos no
                          dice nada, y a 320 px se cortaba siempre. */}
                      <span className="min-w-0 font-medium leading-[1.3] text-primary [overflow-wrap:anywhere]">
                        {es ? row.labelEs : row.labelEn}
                      </span>
                      <span className="tnum whitespace-nowrap text-[11px] text-tertiary">
                        {row.pct} %
                      </span>
                      {/* Ancho mínimo común: los cinco importes acaban en
                          la misma vertical y la columna no baila cuando
                          cambian las cifras. */}
                      <span className="tnum min-w-[4.5rem] whitespace-nowrap text-right font-semibold text-[rgb(var(--pnl-neg))]">
                        −{fmtNum(mistakeCost, lang, 0)} $
                      </span>
                    </div>
                    <div className="relative mt-1.5 h-[3px] overflow-hidden bg-[rgb(var(--divider)/0.10)]">
                      <div
                        className="h-full bg-[rgb(var(--pnl-neg))] transition-[width] duration-300 ease-[var(--ease-suave)]"
                        style={{ width: `${(row.pct / maxPct) * 100}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>

            {/* Totales: Mensual y Anual */}
            <div className="space-y-3 pt-3 border-t border-[rgb(var(--divider)/0.08)]">
              {/* El total. El rotulo es la unica columna elastica y la
                  cifra lleva `clamp`, asi que a 320 px encoge en vez de
                  salirse: era un `text-2xl` fijo y se iba 16 px fuera. */}
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-[2px] border border-[rgb(var(--pnl-neg)/0.15)] bg-[color-mix(in_oklab,rgb(var(--pnl-neg))_5%,transparent)] p-3">
                <div className="min-w-0">
                  <span className="block text-xs font-semibold uppercase leading-[1.25] tracking-wider text-[rgb(var(--pnl-neg))] [overflow-wrap:anywhere]">
                    {es ? "Fuga mensual total" : "Total monthly leak"}
                  </span>
                  <span className="block text-[11.5px] leading-[1.3] text-tertiary [overflow-wrap:anywhere]">
                    {offPlanTrades} {es ? "operaciones indisciplinadas" : "off-plan trades"}
                  </span>
                </div>
                <span
                  className="tnum whitespace-nowrap font-mono font-semibold text-[rgb(var(--pnl-neg))]"
                  style={{ fontSize: "clamp(1.05rem, 4.6vw, 1.5rem)" }}
                >
                  −{fmtMoney(totalLeakMonthly, lang)}
                </span>
              </div>

              {/* Proyecciones compuestas 1, 3, 5 años */}
              {/* PROYECCION A 1, 3 Y 5 ANOS
                  Tres cifras de seis digitos en tres columnas de 90 px a
                  320 px de ancho: se salian hasta 52 px. Dos cambios y
                  deja de poder pasar:
                    - notacion CORTA («−121 k US$» en vez de
                      «−121.068,70 US$»), que ademas es como se leen las
                      cifras agregadas en una mesa de verdad; el importe
                      exacto queda en el `title`,
                    - cuerpo con `clamp`, que encoge antes que desbordar.
                  El parentesis del rotulo pasa a segunda linea: era parte
                  del titular y lo partia en cualquier ancho estrecho. */}
              <div className="rounded-[2px] border border-[rgb(var(--divider)/0.1)] bg-[rgb(var(--divider)/0.03)] p-3">
                <span className="block text-xs font-semibold uppercase tracking-wider text-primary">
                  {es ? "Capital fugado acumulado" : "Cumulative leaked capital"}
                </span>
                <span className="mb-2.5 block text-[10.5px] text-tertiary">
                  {es ? "Reinvertido al 8 % anual" : "Reinvested at 8 % p.a."}
                </span>
                <div className="grid grid-cols-3 gap-2 text-center font-mono">
                  {([1, 3, 5] as const).map((yr) => {
                    const months = yr * 12;
                    const rMonthly = 0.08 / 12;
                    let fv = 0;
                    for (let m = 1; m <= months; m++) {
                      fv = (fv + totalLeakMonthly) * (1 + rMonthly);
                    }
                    return (
                      <div
                        key={yr}
                        title={`−${fmtMoney(fv, lang)}`}
                        className="caja-cifra min-w-0 rounded-[2px] border border-[rgb(var(--divider)/0.08)] bg-[rgb(var(--divider)/0.04)] px-1.5 py-2"
                      >
                        <span className="block text-[10px] text-tertiary">
                          {yr} {yr === 1 ? (es ? "año" : "year") : (es ? "años" : "years")}
                        </span>
                        <span
                          className="tnum cifra-sm block whitespace-nowrap font-bold text-[rgb(var(--pnl-neg))]"
                          
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
              <div className="mt-4 p-3.5 rounded-[2px] border border-[rgb(var(--accent-base)/0.25)] bg-[rgb(var(--accent-base)/0.04)]">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-xs font-semibold text-[rgb(var(--accent-base))] uppercase tracking-wider">
                    {es ? "Plan de Recuperación con Guardián" : "Guardian Recovery Plan"}
                  </span>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-[2px] bg-[rgb(var(--accent-base)/0.15)] text-[rgb(var(--accent-base))]">
                    {es ? "ROI Inmediato" : "Immediate ROI"}
                  </span>
                </div>
                <p className="text-xs text-secondary leading-relaxed mb-3">
                  {es
                    ? `Frenando el 60\u00a0% de tus operaciones fuera de plan recuperas +${fmtMoney(totalLeakMonthly * 0.6, lang)} al mes. La licencia Core ($149) se amortiza sola en ${Math.max(1, Math.round(149 / ((totalLeakMonthly * 0.6) / 30)))} días de operativa.`
                    : `Stopping 60% of your off-plan trades recovers +${fmtMoney(totalLeakMonthly * 0.6, lang)} each month. The Core license ($149) pays for itself in ${Math.max(1, Math.round(149 / ((totalLeakMonthly * 0.6) / 30)))} trading days.`}
                </p>
                {/* Mismo tratamiento que la proyeccion: el «al mes» baja a
                    su propia linea en vez de alargar una cifra que ya no
                    cabia a 320 px. */}
                <div className="grid grid-cols-2 gap-2 text-center font-mono">
                  {[0.5, 0.8].map((f) => (
                    <div
                      key={f}
                      title={`+${fmtMoney(totalLeakMonthly * f, lang)}`}
                      className="caja-cifra min-w-0 rounded-[2px] border border-[rgb(var(--divider)/0.08)] bg-[rgb(var(--divider)/0.04)] px-1.5 py-2"
                    >
                      <span className="block text-[10px] uppercase text-tertiary">
                        {es ? `Ahorro al ${f * 100} %` : `${f * 100}% savings`}
                      </span>
                      <span
                        className="tnum cifra-sm block whitespace-nowrap font-bold text-[rgb(var(--pnl-pos))]"
                        
                      >
                        +{corto(totalLeakMonthly * f).replace("−", "")}
                      </span>
                      <span className="block text-[9.5px] uppercase tracking-wider text-tertiary">
                        {es ? "al mes" : "per month"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Acción: Copiar resumen */}
            <div className="mt-5 pt-3 border-t border-[rgb(var(--divider)/0.06)] flex items-center justify-between">
              <button
                type="button"
                onClick={copiarResumen}
                className="toque-comodo inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-[rgb(var(--accent-base))] transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--accent-base)/0.55)]"
              >
                <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <rect x="5" y="5" width="9" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
                  <path d="M11 5V3.5A1.5 1.5 0 0 0 9.5 2h-6A1.5 1.5 0 0 0 2 3.5v6A1.5 1.5 0 0 0 3.5 11H5" stroke="currentColor" strokeWidth="1.3" />
                </svg>
                {copied ? (es ? "¡Resumen copiado!" : "Summary copied!") : (es ? "Copiar este desglose" : "Copy breakdown")}
              </button>

              <span className="text-[11px] text-tertiary font-mono">
                {es ? "100 % privado en tu navegador" : "100% private in browser"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
