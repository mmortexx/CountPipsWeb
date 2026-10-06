"use client";

import { useState } from "react";
import { useLang } from "@/lib/i18n";
import { Reveal } from "@/components/tj/Reveal";
import { fmtInt, fmtNum, pctSep } from "@/lib/trading/format";

/**
 * Sección `#guardian`: comprobación previa de una operación y tres
 * características de cómo frena antes del error.
 *
 * El riesgo sale del tamaño (0,5 % por contrato) y el veredicto, de
 * compararlo con el límite: las cifras no se descuadran.
 *
 * Fiel al programa: las filas son reglas que el semáforo de la app evalúa de
 * verdad (`RiskFindingKind`). El aviso rojo es la frase de la app, sin
 * proponer un tamaño. El semáforo avisa pero no impide guardar: solo bloquea
 * el freno duro, si se activa.
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
  // `number` a propósito: sin la anotación TypeScript lo estrecha a `4 | 2` y
  // marca imposible la rama singular del plural de abajo.
  const contratos: number = estado === "ajustado" ? CONTRATOS_AJUSTADOS : CONTRATOS_INICIALES;
  const riesgo = contratos * RIESGO_POR_CONTRATO;
  const dentroDelLimite = riesgo <= LIMITE_RIESGO;
  const pct = (n: number) => `${fmtNum(n, lang, 1)}${pctSep(lang)}`;

  return (
    <section
      id="guardian"
      className={`section relative overflow-clip scroll-mt-24 ${enPagina ? "" : "tj-banda"}`}
    >
      <div className="relative tj-container tj-split grid grid-cols-1 gap-10 items-start">
        {/* Columna de texto: primero en el documento para que en móvil y para el
            lector el titular llegue antes que la ficha; en escritorio la ficha
            pasa a la izquierda con `lg:order-first`. */}
        <div>
          <Reveal delay={0.06}>
            <h2
              className={enPagina ? "sr-only" : "t-h2 m-0 text-primary"}
            >
              {es ? (
                <>
                  Disciplina que actúa,
                  <br className="hidden sm:block" />
                  {" "}no que sermonea.
                </>
              ) : (
                <>
                  Discipline that acts,
                  <br className="hidden sm:block" />
                  {" "}not lectures.
                </>
              )}
            </h2>
          </Reveal>
          {!enPagina && (
          <Reveal delay={0.12}>
            <p
              className="t-entradilla mt-5 mb-8"
              style={{
                color: "var(--ink-2)",
                maxWidth: "36em",
              }}
            >
              {es
                ? "El Guardián no te dice qué hacer: mide cada operación contra las reglas que tú fijaste y, si lo activas, te frena cuando las rompes."
                : "The Guardian doesn’t tell you what to do: it measures every trade against the rules you set and, if you turn it on, stops you when you break them."}
            </p>
          </Reveal>
          )}
          <Reveal delay={0.18}>
          <ul className="m-0 p-0 list-none border-b border-[var(--line)]">
            {[
              { t: es ? "Semáforo antes de registrar" : "A light before you log", d: es ? "Riesgo por operación, pérdida diaria y semanal, drawdown y operaciones del día, con el dato que lo pone en rojo." : "Risk per trade, daily and weekly loss, drawdown and trades per day, with the figure that turns it red." },
              { t: es ? "Freno duro, si tú lo activas" : "A hard brake, if you turn it on", d: es ? "Al tocar tu pérdida diaria, una racha o tu caída máxima, deja de admitir operaciones nuevas durante las horas que elijas." : "When you hit your daily loss, a losing streak or your max drawdown, it stops accepting new trades for the hours you choose." },
              { t: es ? "Saltárselo cuesta un motivo" : "Skipping it costs a reason", d: es ? "Levantar el freno exige escribir por qué, y queda en un registro que puedes leer en frío." : "Lifting the brake requires writing why, and it stays in a log you can read later with a cool head." },
            ].map((f) => (
              <li key={f.t} className="border-t border-[var(--line)] py-5">
                <h3 className="m-0 t-h5" style={{ color: "var(--ink)" }}>{f.t}</h3>
                <p className="medida m-0 mt-1" style={{ fontSize: 14, lineHeight: 1.6, color: "var(--ink-2)" }}>{f.d}</p>
              </li>
            ))}
          </ul>
          </Reveal>
        </div>
        {/* Ficha de auditoría: rótulo, línea de la operación, reglas en filas
            con su estado en texto y veredicto. El color queda para la regla
            que falla y el veredicto. */}
        <div data-entra className="tj-ficha lg:order-first">
          <p className="tj-ficha-barra">
            <span>{es ? "Semáforo de riesgo" : "Risk light"}</span>
            {/* Es un ejemplo que se puede tocar, no un dato en directo. */}
            <span>{es ? "Ejemplo" : "Example"}</span>
          </p>
          <div className="tj-ficha-cuerpo" data-dibuja>
            <div className="tnum flex items-baseline gap-x-3 pb-4 border-b border-[var(--ficha-division)]">
              <span className="text-[17px] font-semibold tracking-[-0.01em] text-primary">NQ</span>
              <span className="text-[11px] font-medium text-[rgb(var(--pnl-pos))]">
                Long
              </span>
              <span className="text-[13px] text-secondary">
                {fmtInt(contratos, lang)} {es ? (contratos === 1 ? "contrato" : "contratos") : contratos === 1 ? "contract" : "contracts"}
              </span>
              <span className="ml-auto text-[13px] text-secondary">28 pts</span>
            </div>
            <ul className="m-0 p-0 list-none">
              {[
                { ok: true, l: es ? `Pérdida del día ${pct(0.6)} · límite ${pct(3)}` : `Daily loss ${pct(0.6)} · limit ${pct(3)}` },
                { ok: true, l: es ? `Operaciones hoy ${fmtInt(2, lang)} · máximo ${fmtInt(5, lang)}` : `Trades today ${fmtInt(2, lang)} · max ${fmtInt(5, lang)}` },
                {
                  // Texto y estado salen del cálculo, no de una constante.
                  ok: dentroDelLimite,
                  l: es
                    ? `Riesgo ${pct(riesgo)} · límite ${pct(LIMITE_RIESGO)}`
                    : `Risk ${pct(riesgo)} · limit ${pct(LIMITE_RIESGO)}`,
                },
              ].map((c, i) => (
                /* Clave por posición: al ajustar, la fila cambia de texto y de
                   estado sin volver a montarse, así que no repite la entrada. */
                <li key={i} className="tj-ficha-fila tnum">
                  <span className={`text-[14px] ${c.ok ? "text-secondary" : "text-primary"}`}>{c.l}</span>
                  <span
                    className="tj-ficha-estado tj-d-marca"
                    style={{ ["--i" as string]: i, ...(c.ok ? {} : { color: "rgb(var(--pnl-neg))" }) }}
                  >
                    {c.ok ? (es ? "Cumple" : "Pass") : es ? "Excede" : "Over"}
                  </span>
                </li>
              ))}
            </ul>
            {(() => {
              /* El veredicto se anuncia (`aria-live`): al pulsar «Probar con…»
                 lo que cambia está en otra parte de la tarjeta. */
              const tono = estado === "anulado" ? "neutro" : dentroDelLimite ? "ok" : "mal";
              const color =
                tono === "ok" ? "rgb(var(--pnl-pos))" : tono === "mal" ? "rgb(var(--pnl-neg))" : "var(--ink-3)";
              const titulo =
                tono === "neutro"
                  ? es ? "Registrada con el semáforo en rojo" : "Logged on a red light"
                  : tono === "ok"
                    ? es ? "Semáforo en verde" : "Green light"
                    : es ? "Semáforo en rojo" : "Red light";
              const cuerpo =
                tono === "neutro"
                  ? es
                    ? "El semáforo avisa, no bloquea: la operación se guarda. Lo que bloquea es el freno duro, si lo activas, al tocar tu pérdida diaria, una racha o tu caída máxima."
                    : "The light warns, it doesn’t block: the trade is saved. What blocks is the hard brake, if you turn it on, when you hit your daily loss, a losing streak or your max drawdown."
                  : tono === "ok"
                    ? es
                      ? `Esta operación arriesga ${pct(riesgo)} de tu cuenta, dentro de tu límite por operación.`
                      : `This trade risks ${pct(riesgo)} of your account, within your per-trade limit.`
                    : es
                      ? `Esta operación arriesga ${pct(riesgo)} de tu cuenta; tu límite por operación es ${pct(LIMITE_RIESGO)}.`
                      : `This trade risks ${pct(riesgo)} of your account; your per-trade limit is ${pct(LIMITE_RIESGO)}.`;
              return (
                <div role="status" aria-live="polite" className="tj-d-veredicto mt-1 pt-5 border-t border-[var(--ficha-division)]">
                  <p className="m-0 text-[12px] font-semibold" style={{ color }}>
                    {titulo}
                  </p>
                  <p className="m-0 mt-2 max-w-[46ch] text-[14px] leading-[1.6] text-secondary">{cuerpo}</p>
                </div>
              );
            })()}
            <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
              {estado === "bloqueado" ? (
                <>
                  <button type="button" onClick={() => setEstado("ajustado")} className="cta cta--primario tnum">
                    {es ? `Probar con ${fmtInt(CONTRATOS_AJUSTADOS, lang)} contratos` : `Try ${fmtInt(CONTRATOS_AJUSTADOS, lang)} contracts`}
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
