"use client";

import { useLang } from "@/lib/i18n";
import { Reveal } from "@/components/tj/Reveal";
import { METRICS } from "@/lib/trading/data";
import { getRDistribution } from "@/lib/trading/fixtures";
import { fmtNum, fmtPct, fmtR } from "@/lib/trading/format";

/* ── TODA CIFRA DE ESTA SECCIÓN SALE DEL MOTOR ─────────────────────────
   Antes estaban escritas a mano, y la tarjeta se contradecía a sí misma
   en tres sitios a la vez: el histograma dibujaba un 63 % de ganadoras
   bajo un pie que declaraba 50 %; implicaba +1,16R junto a una ficha que
   decía +0,32R; y el rótulo anunciaba «60 ops» sobre una muestra de 200.
   Ninguna de las cuatro fichas coincidía ya con `METRICS`, y la peor
   desviación no era cosmética: el drawdown máximo se anunciaba como
   −8,0 % cuando el real era dos puntos peor. Una cifra copiada a mano
   envejece hacia el lado favorable sin que nadie lo decida — por eso
   este comentario tampoco repite el valor de hoy: lo pinta `METRICS`.

   `METRICS` y `getRDistribution()` se calculan sobre las MISMAS 200
   operaciones deterministas que alimentan /demo, así que la home y la
   demo cuentan ahora la misma historia — que era justo la intención
   declarada en la cabecera de `fixtures.ts`. Nada de esto es aleatorio:
   la semilla es fija y el resultado, reproducible. */
const R_BINS = getRDistribution();
const R_MAX_COUNT = Math.max(1, ...R_BINS.map((b) => b.count));
/** Cubo con más operaciones: se marca como moda en el gráfico. */
const R_MODE_INDEX = R_BINS.findIndex((b) => b.count === R_MAX_COUNT);

/**
 * MetricsShowcaseNew — sección `#metrics` del HTML. Dos columnas:
 * - Lista de ratios (Sharpe, Profit Factor, Expectancy, Max DD)
 * - Tarjeta de "Distribución de R-múltiplo" con histograma
 * Le siguen catálogo de métricas (4 familias) y la calculadora de
 * riesgo interactiva — esos se renderizan en sus propios componentes
 * y se montan desde la home.
 */
export function MetricsShowcaseNew() {
  const { lang } = useLang();
  const es = lang === "es";
  return (
    <section
      id="metrics"
      className="section relative border-t border-b border-[rgb(var(--divider)/0.06)] scroll-mt-24"
    >
      {/* T2c — `tj-container` sustituye a `max-w-[1240px] mx-auto px-5 md:px-8`
          para heredar los gutters fluidos (clamp(1.25rem, 4vw, 2.25rem))
          y el page-w de T2a. El `gap-12` desktop se mantiene; en móvil el
          gap baja a `gap-10` para evitar 48 px de aire entre titular y
          tarjeta cuando se apilan. */}
      <div className="tj-container grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-12 items-center">
        <div>
          <Reveal>
            <div className="inline-flex items-center gap-3 mb-5">
              <span className="eyebrow">
                {es ? "MÉTRICAS" : "METRICS"}
              </span>
            </div>
          </Reveal>
          <Reveal delay={0.06}>
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
                  Las cifras que usan{" "}
                  <span style={{ color: "rgb(var(--accent-base))" }}>los que viven de esto</span>.
                </>
              ) : (
                <>
                  The numbers the{" "}
                  <span style={{ color: "rgb(var(--accent-base))" }}>pros who live off this</span> use.
                </>
              )}
            </h2>
          </Reveal>
          <Reveal delay={0.12}>
            <p
              className="mt-5 mb-8"
              style={{
                fontSize: "clamp(1rem, 1.3vw, 1.12rem)",
                lineHeight: 1.62,
                color: "var(--ink-2)",
                maxWidth: "36em",
              }}
            >
              {es
                ? "No gráficos bonitos. Ratios que correlacionan con la consistencia a largo plazo: lo que separa un edge real de una racha."
                : "Not pretty charts. Ratios that correlate with long-term consistency: what separates a real edge from a streak."}
            </p>
          </Reveal>
          {/* T2c — `gap-4` (16 px) en vez de `gap-3` (12 px): las tarjetas
              2×2 ya no se pegan en móvil y el número grande (19 px / 700)
              no roza la etiqueta.
              P1 — envoltorio Reveal stagger 0.18 para que las 4 KPIs
              entren en escena como bloque coordinado, no como lista
              asíncrona. El stagger interno entre las 4 tiles se logra con
              el `delay` único del wrapper (no por tile): en móvil las 4 se
              asientan a la vez, leyendo como placa de ratios, no como
              cascada decorativa. */}
          <Reveal delay={0.18}>
          {/* ── Cuadro de cifras, no rejilla de tarjetas ─────────────
              Esto eran cuatro cajas redondeadas con borde, fondo propio
              y un punto de color: el patrón por defecto de cualquier
              panel, y lo que hacía que la sección se leyera como un
              cuadro de mandos de plantilla en vez de como la ficha de
              datos de una institución.

              El registro correcto para una cifra financiera no es la
              caja: es la RETÍCULA. Un informe de mercado, una terminal
              o una memoria anual alinean los datos con reglas finas y
              dejan que manden las cifras — la caja compite con el dato
              que tiene dentro. Se retiran los recuadros y queda una
              cuadrícula de filetes: separador arriba de cada celda,
              vertical entre columnas, y nada más.

              `gap` pasa a 0 a propósito: con hueco, los filetes se
              rompen y dejan de leerse como una cuadrícula continua. La
              separación la da el relleno interior de cada celda. */}
          <ul className="m-0 p-0 list-none grid grid-cols-2 border-t border-[rgb(var(--divider)/0.14)]">
            {[
              { id: "sharpe", l: "Sharpe Ratio", v: fmtNum(METRICS.sharpe, lang, 2), c: "rgb(var(--pnl-pos))", formula: "S = (μ - Rf) / σ", descEs: "Retorno ajustado a la volatilidad total.", descEn: "Return adjusted to total volatility." },
              { id: "sortino", l: "Sortino Ratio", v: fmtNum(METRICS.sortino, lang, 2), c: "rgb(var(--pnl-pos))", formula: "So = (μ - Rf) / σ_d", descEs: "Penaliza únicamente la volatilidad bajista.", descEn: "Penalizes only downside deviation." },
              { id: "omega", l: "Ratio Omega", v: fmtNum(METRICS.omega, lang, 2), c: "var(--ink)", formula: "Ω = ∫[L,+∞] (1-F) / ∫[-∞,L] F", descEs: "Pondera toda la distribución de colas.", descEn: "Weights entire distribution tail risk." },
              { id: "calmar", l: "Ratio Calmar", v: fmtNum(METRICS.calmar, lang, 2), c: "var(--ink)", formula: "Ca = CAGR / MaxDD", descEs: "Rendimiento anualizado vs peor drawdown.", descEn: "Annual return vs maximum drawdown." },
              {
                id: "expectancy",
                l: es ? "Esperanza E(R)" : "Expectancy E(R)",
                v: fmtR(METRICS.expectancyR, lang, 2),
                c: METRICS.expectancyR >= 0 ? "rgb(var(--pnl-pos))" : "rgb(var(--pnl-neg))",
                formula: "E(R) = (WR × W̄) - ((1-WR) × L̄)",
                descEs: "Beneficio matemático medio por operación.",
                descEn: "Mathematical mean edge per trade in R.",
              },
              {
                id: "maxDd",
                l: "Max Drawdown",
                v: `−${fmtPct(METRICS.maxDrawdownPct, lang, 1)}`,
                c: "rgb(var(--pnl-neg))",
                formula: "DD = (Peak - Trough) / Peak",
                descEs: "Máxima caída pico a valle registrada.",
                descEn: "Peak-to-trough historical drawdown.",
              },
            ].map((m) => (
              <li
                key={m.id}
                className="group/metric relative min-w-0 border-b border-[rgb(var(--divider)/0.14)] py-4 pr-5 [&:nth-child(even)]:pl-5 [&:nth-child(even)]:border-l [&:nth-child(even)]:border-l-[rgb(var(--divider)/0.14)] transition-colors duration-200"
              >
                {/* ── LA FÓRMULA NO LE DISPUTA EL ANCHO A LA ETIQUETA ────
                    Estaban las dos en un `flex justify-between`, y ahí la
                    fórmula sólo cabía si era corta. Las cuatro largas
                    —Sortino, Omega, Esperanza y Max Drawdown— envolvían a
                    dos líneas y acababan PEGADAS a su etiqueta: medido en
                    la portada, hueco de 0 px entre una y otra. Se leía
                    como un amasijo justo en la sección que presume de
                    rigor.

                    Ahora cada una tiene su renglón. La etiqueta manda,
                    la fórmula va debajo en monoespaciado terciario —que
                    es su rango: referencia, no titular— y no envuelve
                    nunca. El recorte es sólo red de seguridad; a 10 px
                    la más larga pide ~186 px y la celda da ~230 px.

                    Por debajo de `sm` desaparece: en 390 px la celda cae
                    a ~170 px y la fórmula saldría cortada a media
                    integral, que se lee peor que no estar. */}
                <span
                  className="block text-[11px] uppercase"
                  style={{ letterSpacing: "0.14em", color: "var(--ink-3)" }}
                >
                  {m.l}
                </span>
                <span
                  className="mt-0.5 hidden break-words font-mono text-[11px] leading-[1.35] text-tertiary transition-colors duration-200 group-hover/metric:text-secondary sm:block"
                  title={m.formula}
                >
                  {m.formula}
                </span>
                <span
                  className="tnum mt-2 block text-[22px] sm:text-[26px]"
                  style={{ fontWeight: 600, color: m.c, letterSpacing: "-0.02em", lineHeight: 1.1 }}
                >
                  {m.v}
                </span>
                <span className="text-[12px] text-tertiary mt-1 block">
                  {es ? m.descEs : m.descEn}
                </span>
              </li>
            ))}
          </ul>
          </Reveal>
        </div>

        {/* Distribución de R */}
        <div
          data-entra
          // T3c — distribución R-múltiplo swap a `.tj-paper`: misma tarjeta
          // de histograma, ahora sobre papel translúcido cálido. El border
          // + padding originales se conservan; el `box-shadow` inset se
          // retira porque `.tj-paper` ya aporta su propio catch-light.
          className="tj-paper relative rounded-[2px]"
          style={{
            padding: 24,
            border: "1px solid rgb(var(--divider) / 0.13)",
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <span
              className="tnum"
              style={{ fontSize: 12, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--ink-3)" }}
            >
              {es ? "Distribución de R-múltiplo" : "R-multiple distribution"}
            </span>
            <span
              className="tnum"
              style={{
                fontSize: 11,
                padding: "4px 9px",
                borderRadius: 4,
                background: "color-mix(in oklab, rgb(var(--accent-base)) 14%, transparent)",
                color: "rgb(var(--accent-base))",
                border: "1px solid color-mix(in oklab, rgb(var(--accent-base)) 30%, transparent)",
              }}
            >
              {/* El recuento sale de la propia muestra. Estaba fijo en
                  «60» sobre un conjunto de 200 operaciones: el rótulo que
                  dice cuántas se han contado no puede ser el único dato
                  del gráfico que nadie cuenta. */}
              {es
                ? `${METRICS.closedCount} ops`
                : `${METRICS.closedCount} trades`}
            </span>
          </div>
          {/* ── EL HISTOGRAMA, AHORA CALCULADO ───────────────────────────
              Las nueve alturas estaban escritas a mano y el color se
              elegía por el ÍNDICE de la barra: los cuatro primeros cubos
              en verde y el resto en rojo. Como los cuatro primeros son
              las PÉRDIDAS, el gráfico insignia de un diario de trading
              pintaba las pérdidas de verde y las ganancias de rojo.

              Ahora cada cubo trae su propio `losing` desde
              `getRDistribution()`, así que el color lo decide el signo de
              la R y no puede volver a invertirse al reordenar la lista.
              La altura es proporcional al cubo más poblado, no a un total
              inventado.

              Los cubos vacíos (no hay operaciones entre −0,5R y +0,5R) se
              dibujan como un muñón de 2 px sobre el eje en vez de
              desaparecer: un hueco sin marca se lee como fallo de
              dibujo, y con marca se lee como lo que es — esta operativa
              o se come el stop entero o deja correr.

              Las barras siguen `aria-hidden`; la fila de rótulos de abajo
              y el resumen de debajo llevan la semántica para lectores de
              pantalla. */}
          {/* T2c — envoltorio `min-w-0` para que el histograma no fuerce
              overflow horizontal en móvil (los cubos y sus huecos ya
              cabían, pero `min-w-0` protege contra sub-pixel rounding en
              320 px). */}
          <div className="relative min-w-0">
          <div className="flex items-end gap-1.5" style={{ height: 160 }}>
            {R_BINS.map((b, i) => {
              const pct = (b.count / R_MAX_COUNT) * 100;
              const rango = `${fmtR(b.from, lang, 1)} … ${fmtR(b.to, lang, 1)}`;
              const cuenta = es
                ? `${b.count} ${b.count === 1 ? "operación" : "operaciones"}`
                : `${b.count} ${b.count === 1 ? "trade" : "trades"}`;
              return (
                <div
                  key={`${b.from}`}
                  title={`${rango} · ${cuenta}`}
                  className="flex-1 rounded-t relative cursor-default transition-transform duration-200 ease-[var(--ease-suave)] hover:-translate-y-[3%]"
                  style={{
                    // Mínimo de 2 px para que un cubo vacío deje marca en
                    // el eje en lugar de un agujero.
                    height: b.count === 0 ? "2px" : `${Math.max(pct, 3)}%`,
                    background:
                      i === R_MODE_INDEX
                        ? "rgb(var(--accent-base))"
                        : b.losing
                          ? "color-mix(in oklab, rgb(var(--pnl-neg)) 60%, transparent)"
                          : "color-mix(in oklab, rgb(var(--pnl-pos)) 70%, transparent)",
                    opacity: b.count === 0 ? 0.35 : 0.85,
                  }}
                  aria-hidden
                >
                  {i === R_MODE_INDEX && (
                    <span
                      className="tnum absolute -top-5 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[2px]"
                      style={{
                        fontSize: 11,
                        letterSpacing: "0.1em",
                        color: "rgb(var(--accent-base))",
                        background: "color-mix(in oklab, rgb(var(--accent-base)) 14%, transparent)",
                        border: "1px solid color-mix(in oklab, rgb(var(--accent-base)) 32%, transparent)",
                      }}
                    >
                      {es ? "MODA" : "MODE"}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
          {/* Baseline axis — 1px hairline beneath the bars. */}
          <div aria-hidden className="h-px w-full" style={{ background: "rgb(var(--divider) / 0.13)" }} />
          </div>
          {/* Eje: un rótulo por cubo, con su borde izquierdo. Antes eran
              nueve etiquetas fijas (−3R…+5R) que no describían ningún
              dato — la muestra real va de −1,5R a +2,5R. */}
          <div className="mt-2 flex items-center justify-between">
            {R_BINS.map((b) => (
              <span
                key={b.from}
                className="tnum flex-1 text-center"
                style={{ fontSize: 11, color: "var(--ink-3)" }}
              >
                {fmtR(b.from, lang, 1)}
              </span>
            ))}
          </div>
          {/* Resumen del gráfico para lectores de pantalla: las barras van
              `aria-hidden`, así que sin esto la tarjeta entera era mudo
              decorado. Sale del mismo cálculo que dibuja las barras. */}
          <p className="sr-only">
            {es
              ? `Distribución de R-múltiplo de ${METRICS.closedCount} operaciones de muestra: ` +
                R_BINS.map(
                  (b) =>
                    `entre ${fmtR(b.from, lang, 1)} y ${fmtR(b.to, lang, 1)}, ${b.count} ${b.count === 1 ? "operación" : "operaciones"}`
                ).join("; ") +
                "."
              : `R-multiple distribution across ${METRICS.closedCount} sample trades: ` +
                R_BINS.map(
                  (b) =>
                    `between ${fmtR(b.from, lang, 1)} and ${fmtR(b.to, lang, 1)}, ${b.count} ${b.count === 1 ? "trade" : "trades"}`
                ).join("; ") +
                "."}
          </p>
          {/* T2c — `gap-3` → `gap-4` para igualar el ritmo de las tarjetas
              de ratios; los valores largos no se pegan a la etiqueta del
              vecino. Las tres cifras salen del motor: eran «50 %»,
              «+0,32R» y «1,59» escritas a mano, y sólo la primera se
              acercaba a la verdad. */}
          <div className="mt-5 grid grid-cols-3 gap-x-2.5 gap-y-4 pt-4 border-t sm:gap-x-4" style={{ borderColor: "rgb(var(--divider) / 0.06)" }}>
            {[
              { l: es ? "Ganadoras" : "Winners", v: fmtPct(METRICS.winRate, lang, 1) },
              { l: es ? "R medio" : "Avg R", v: fmtR(METRICS.expectancyR, lang, 2) },
              { l: es ? "Payoff" : "Payoff", v: fmtNum(METRICS.payoff, lang, 2) },
            ].map((s) => (
              <div key={s.l} className="relative">
                <div
                  className="tnum flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0.5"
                  style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--ink-3)" }}
                >
                  {/* R24-1c: tiny accent dot before each stat label so the
                      three stats read as a synchronized footer row rather
                      than three floating micro-headers. */}
                  <span aria-hidden className="w-1 h-1 rounded-[1px]" style={{ background: "rgb(var(--accent-base))" }} />
                  {s.l}
                </div>
                <div className="tnum" style={{ fontSize: 18, fontWeight: 700, marginTop: 4, color: "var(--ink)" }}>{s.v}</div>
              </div>
            ))}
          </div>
          {/* Qué son estas cifras. No es letra pequeña defensiva: la
              sección enseña ratios de una operativa, y quien la lee tiene
              derecho a saber que salen del conjunto de muestra de la demo
              y no de una cuenta real. Decirlo una vez, aquí, evita
              tener que matizarlo en cada número — y es lo que el contrato
              del proyecto exige distinguir. El Sharpe se declara
              anualizado porque un Sharpe sin periodo no significa nada. */}
          <p
            className="mt-4 pt-3 border-t"
            style={{
              borderColor: "rgb(var(--divider) / 0.06)",
              fontSize: 12,
              lineHeight: 1.5,
              color: "var(--ink-3)",
            }}
          >
            {es
              ? `Calculado sobre las ${METRICS.closedCount} operaciones de muestra de la demo, no sobre cuentas reales. Sharpe anualizado.`
              : `Computed over the demo's ${METRICS.closedCount} sample trades, not live accounts. Sharpe is annualized.`}
          </p>
        </div>
      </div>
    </section>
  );
}
