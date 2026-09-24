"use client";

import { useState } from "react";
import { useLang } from "@/lib/i18n";
import { Reveal } from "@/components/tj/Reveal";
import { ShieldCheck, AlertTriangle, HandMetal, Timer } from "lucide-react";
import { fmtInt, fmtNum, pctSep } from "@/lib/trading/format";

/**
 * GuardianNew — sección `#guardian`. Disciplina que actúa: comprobación
 * previa de una operación + 3 características de cómo frena antes del
 * error.
 *
 * ── DOS COSAS QUE ESTABAN MAL ─────────────────────────────────────────
 *
 * 1. LOS BOTONES NO HACÍAN NADA. «Ajustar a 2 contratos» y «Anular» eran
 *    dos `<button>` sin `onClick`, con cursor de mano, elevación al pasar
 *    por encima y anillo de foco — y dentro del orden de tabulación. Un
 *    lector de pantalla los anunciaba como botones. Es la peor clase de
 *    decorado: el que promete una interacción que no existe. Y estaba en
 *    la sección que vende, precisamente, que el producto ACTÚA.
 *
 * 2. LAS CIFRAS NO CUADRABAN. 4 contratos daban «2,4 % de riesgo» con un
 *    límite del 1 %, y el aviso recomendaba «reduce a 2 contratos». Dos
 *    contratos son 1,2 %: seguiría fuera del límite. El consejo de un
 *    producto de control de riesgo no puede fallar una regla de tres.
 *
 * Ahora el riesgo se CALCULA a partir del tamaño (0,5 % por contrato) y
 * el veredicto sale de compararlo con el límite, así que la aritmética no
 * puede volver a descuadrarse. Y pulsar cambia de verdad el estado: el
 * tamaño baja, el riesgo baja con él y el aviso pasa de bloqueado a
 * permitido, que es exactamente lo que la sección promete que hace la
 * aplicación.
 */

/** Riesgo que aporta cada contrato, en % de la cuenta. */
const RIESGO_POR_CONTRATO = 0.5;
/** Límite de riesgo por operación configurado en el ejemplo, en %. */
const LIMITE_RIESGO = 1;
const CONTRATOS_INICIALES = 4;
const CONTRATOS_AJUSTADOS = 2;

type EstadoGuardian = "bloqueado" | "ajustado" | "anulado";

/** `enPagina`: bajo un PageHeader que ya titula, la cabecera propia solo queda para lectores de pantalla. */
export function GuardianNew({ enPagina = false }: { enPagina?: boolean } = {}) {
  const { lang } = useLang();
  const es = lang === "es";

  const [estado, setEstado] = useState<EstadoGuardian>("bloqueado");
  // Anotado como `number` a propósito: sin la anotación, TypeScript lo
  // estrecha al literal `4 | 2` y marca como imposible la rama singular
  // del plural de abajo. Los dos valores son constantes HOY; el texto no
  // debe romperse el día que uno de ellos sea 1.
  const contratos: number = estado === "ajustado" ? CONTRATOS_AJUSTADOS : CONTRATOS_INICIALES;
  const riesgo = contratos * RIESGO_POR_CONTRATO;
  const dentroDelLimite = riesgo <= LIMITE_RIESGO;
  const pct = (n: number) => `${fmtNum(n, lang, 1)}${pctSep(lang)}`;

  return (
    <section
      id="guardian"
      className={`section relative overflow-clip scroll-mt-24 ${enPagina ? "" : "tj-banda"}`}
    >
      {/* P1 — contenedor unificado a `tj-container`: hereda los gutters
          fluidos (clamp(1.25rem, 4vw, 2.25rem)) y el page-w (1080px) de
          globals.css, sustituyendo al `max-w-[1240px] mx-auto px-5 md:px-8`
          hardcodeado. Paridad con StatsBandNew, MetricsShowcaseNew y Values. */}
      <div className="relative tj-container grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-12 items-center">
        {/* Columna de texto: primero en el documento para que en móvil y en
            un lector de pantalla el titular llegue antes que la ficha; en
            escritorio la ficha pasa a la izquierda con `lg:order-first`.
            Copy + 3 features
            P1 — envoltorios Reveal con stagger (0, 0.06, 0.12, 0.18) para
            que la columna derecha entre en escena coordinada con la
            tarjeta mockup de la izquierda (que tiene su propio motion.div).
            Antes la columna aparecía estática mientras la tarjeta izquierda
            no animaba; ahora las dos mitades se asientan a la par. */}
        <div>
          {!enPagina && (
          <Reveal>
            <div className="inline-flex items-center gap-3 mb-5">
              <span className="eyebrow">
                {es ? "DISCIPLINA" : "DISCIPLINE"}
              </span>
            </div>
          </Reveal>
          )}
          <Reveal delay={0.06}>
            <h2
              className={enPagina ? "sr-only" : "t-h2 m-0 text-primary"}
            >
              {es ? (
                <>
                  Disciplina que <span className="text-gradient">actúa</span>,
                  <br className="hidden sm:block" />
                  {" "}no que sermonea.
                </>
              ) : (
                <>
                  Discipline that <span className="text-gradient">acts</span>,
                  <br className="hidden sm:block" />
                  {" "}not lectures.
                </>
              )}
            </h2>
          </Reveal>
          {!enPagina && (
          <Reveal delay={0.12}>
            <p
              className="mt-5 mb-8"
              style={{
                fontSize: "clamp(1rem, 1.3vw, 1.1rem)",
                lineHeight: 1.62,
                color: "var(--ink-2)",
                maxWidth: "36em",
              }}
            >
              {es
                ? "El Guardián no te dice qué hacer: mide cada operación contra las reglas que tú fijaste y, si lo activas, te frena cuando las rompes."
                : "The Guardian doesn't tell you what to do: it measures every trade against the rules you set and, if you turn it on, stops you when you break them."}
            </p>
          </Reveal>
          )}
          {/* T2d — `space-y-5` (20px) entre features (era `space-y-4` 16px):
              el incremento refuerza la legibilidad móvil sin abrir un
              hueco tipográfico; a desktop el Δ es apenas perceptible.
              + `leading-[1.6]` en la descripción para parity con Values
              y con el spec de legibilidad de la home.
              P1 — envoltorio Reveal delay 0.18 para que las 3 features
              entren como bloque coordinado tras el titular. */}
          <Reveal delay={0.18}>
          <ul className="m-0 p-0 list-none border-b border-[var(--line)]">
            {[
              { i: ShieldCheck, t: es ? "Semáforo antes de registrar" : "A light before you log", d: es ? "Riesgo por operación, pérdida diaria y semanal, drawdown y operaciones del día, con el dato que lo pone en rojo." : "Risk per trade, daily and weekly loss, drawdown and trades per day, with the figure that turns it red." },
              { i: HandMetal, t: es ? "Freno duro, si tú lo activas" : "A hard brake, if you turn it on", d: es ? "Al tocar tu pérdida diaria, una racha o tu caída máxima, deja de admitir operaciones nuevas durante las horas que elijas." : "When you hit your daily loss, a losing streak or your max drawdown, it stops accepting new trades for the hours you choose." },
              { i: Timer, t: es ? "Saltárselo cuesta un motivo" : "Skipping it costs a reason", d: es ? "Levantar el freno exige escribir por qué, y queda en un registro que puedes leer en frío." : "Lifting the brake requires writing why, and it stays in a log you can read later with a cool head." },
            ].map((f) => {
              const Icon = f.i;
              return (
                <li key={f.t} className="flex items-start gap-4 border-t border-[var(--line)] py-5">
                  <Icon size={18} strokeWidth={1.6} aria-hidden className="mt-0.5 flex-none text-tertiary" />
                  <div>
                    <h3 className="m-0" style={{ fontSize: 15, fontWeight: 600, color: "var(--ink)" }}>{f.t}</h3>
                    <p className="m-0 mt-1" style={{ fontSize: 14, lineHeight: 1.6, color: "var(--ink-2)" }}>{f.d}</p>
                  </div>
                </li>
              );
            })}
          </ul>
          </Reveal>
        </div>
        {/* La comprobación previa como ficha de auditoría: barra con el
            rótulo, la línea de la operación, las reglas en filas con su
            estado en texto, y el veredicto. Divisiones con filetes, sin
            cajas rellenas dentro de la tarjeta ni sellos de color: el
            color queda para lo que lo necesita —la regla que falla y el
            veredicto—. */}
        <div data-entra className="tj-ficha lg:order-first">
          <p className="tj-ficha-barra">
            <span>
              {es ? "Semáforo de riesgo" : "Risk light"}
              <span className="hidden sm:inline">{es ? " · nueva operación" : " · new trade"}</span>
            </span>
            <span className="tj-ficha-vivo">{es ? "En vivo" : "Live"}</span>
          </p>
          <div className="tj-ficha-cuerpo" data-dibuja>
            <div className="tnum flex items-baseline gap-x-3 pb-4 border-b border-[var(--ficha-division)]">
              <span className="text-[17px] font-semibold tracking-[-0.01em] text-primary">NQ</span>
              <span className="text-[11px] font-medium uppercase tracking-[0.1em] text-[rgb(var(--pnl-pos))]">
                Long
              </span>
              <span className="text-[13px] text-secondary">
                {fmtInt(contratos, lang)} {es ? (contratos === 1 ? "contrato" : "contratos") : contratos === 1 ? "contract" : "contracts"}
              </span>
              <span className="ml-auto text-[13px] text-secondary">28 pts</span>
            </div>
            <ul className="m-0 p-0 list-none">
              {[
                { ok: true, l: es ? "Setup apto: ruptura NY" : "Valid setup: NY breakout" },
                { ok: true, l: es ? "R:R ≥ 1,5" : "R:R ≥ 1.5" },
                {
                  // El texto y el estado salen del cálculo, no de una
                  // constante: el riesgo es el tamaño por el riesgo
                  // unitario, y el veredicto, compararlo con el límite.
                  ok: dentroDelLimite,
                  l: es
                    ? `Riesgo ${pct(riesgo)} · límite ${pct(LIMITE_RIESGO)}`
                    : `Risk ${pct(riesgo)} · limit ${pct(LIMITE_RIESGO)}`,
                },
              ].map((c, i) => (
                /* Clave por posición: al ajustar, la fila cambia de texto y de
                   estado sin volver a montarse, así que no repite la entrada. */
                <li key={i} className="tj-ficha-fila tnum">
                  <span
                    aria-hidden
                    className="tj-d-marca w-4 flex-none text-[13px] font-semibold"
                    style={{ ["--i" as string]: i, color: c.ok ? "rgb(var(--pnl-pos))" : "rgb(var(--pnl-neg))" }}
                  >
                    {c.ok ? "✓" : "✕"}
                  </span>
                  <span className={`text-[14px] ${c.ok ? "text-secondary" : "text-primary"}`}>{c.l}</span>
                  <span className="tj-ficha-estado" style={c.ok ? undefined : { color: "rgb(var(--pnl-neg))" }}>
                    {c.ok ? (es ? "Cumple" : "Pass") : es ? "Excede" : "Over"}
                  </span>
                </li>
              ))}
            </ul>
            {(() => {
              /* El veredicto cambia con el estado, y se anuncia. `aria-live`
                 es imprescindible: al pulsar «Ajustar», lo que cambia está
                 en OTRA parte de la tarjeta, y sin anuncio un lector de
                 pantalla no se entera de que la operación ha pasado de
                 bloqueada a permitida. */
              const tono = estado === "anulado" ? "neutro" : dentroDelLimite ? "ok" : "mal";
              const color =
                tono === "ok" ? "rgb(var(--pnl-pos))" : tono === "mal" ? "rgb(var(--pnl-neg))" : "var(--ink-3)";
              const titulo =
                tono === "neutro"
                  ? es ? "Registrada fuera de tu regla" : "Logged against your rule"
                  : tono === "ok"
                    ? es ? "Semáforo en verde" : "Green light"
                    : es ? "Semáforo en rojo" : "Red light";
              const cuerpo =
                tono === "neutro"
                  ? es
                    ? "Queda anotada con el semáforo en rojo. Si activas el freno duro, al tocar tu pérdida diaria dejará de admitir operaciones nuevas."
                    : "It is logged with the light on red. If you turn on the hard brake, hitting your daily loss stops new trades from being logged."
                  : tono === "ok"
                    ? es
                      ? `Con ${fmtInt(contratos, lang)} contratos el riesgo baja a ${pct(riesgo)}, justo en tu límite.`
                      : `At ${fmtInt(contratos, lang)} contracts the risk drops to ${pct(riesgo)}, exactly at your limit.`
                    : es
                      ? `El riesgo supera tu máximo por operación. Con ${fmtInt(CONTRATOS_AJUSTADOS, lang)} contratos quedaría en ${pct(CONTRATOS_AJUSTADOS * RIESGO_POR_CONTRATO)}, dentro de tu límite.`
                      : `Risk is above your per-trade maximum. At ${fmtInt(CONTRATOS_AJUSTADOS, lang)} contracts it would be ${pct(CONTRATOS_AJUSTADOS * RIESGO_POR_CONTRATO)}, within your limit.`;
              const Icono = tono === "ok" ? ShieldCheck : AlertTriangle;
              return (
                <div role="status" aria-live="polite" className="tj-d-veredicto mt-1 pt-5 border-t border-[var(--ficha-division)]">
                  <p className="m-0 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.1em]" style={{ color }}>
                    <Icono size={14} strokeWidth={2} aria-hidden />
                    {titulo}
                  </p>
                  <p className="m-0 mt-2 max-w-[46ch] text-[14px] leading-[1.55] text-secondary">{cuerpo}</p>
                </div>
              );
            })()}
            {/* Los botones cambian con el estado y HACEN lo que dicen. Son
                los del resto del sitio: la acción principal rellena y la
                otra en texto con flecha, sin caja que compita. */}
            <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
              {estado === "bloqueado" ? (
                <>
                  <button type="button" onClick={() => setEstado("ajustado")} className="cta cta--primario tnum">
                    {es ? `Ajustar a ${fmtInt(CONTRATOS_AJUSTADOS, lang)} contratos` : `Adjust to ${fmtInt(CONTRATOS_AJUSTADOS, lang)} contracts`}
                  </button>
                  <button type="button" onClick={() => setEstado("anulado")} className="cta cta--secundario">
                    {es ? "Registrar igualmente" : "Log anyway"}
                  </button>
                </>
              ) : (
                <button type="button" onClick={() => setEstado("bloqueado")} className="cta cta--secundario">
                  {es ? "Volver al estado inicial" : "Back to the initial state"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
