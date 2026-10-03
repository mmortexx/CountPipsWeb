"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { Deslizador } from "@/components/tj/Deslizador";
import { BotonCopiar } from "@/components/tj/BotonCopiar";
import { componerInforme } from "@/lib/informe";
import { useLang } from "@/lib/i18n";
import { fmtInt, fmtNum, fmtOperaciones, fmtPct, fmtR, pctSep } from "@/lib/trading/format";
import { ResultadoAnunciado } from "@/components/tj/ResultadoAnunciado";
import {
  leerEscenario,
  RANGOS_FONDEO,
  simularFondeo,
  type EscenarioFondeo,
  type TipoDrawdown,
} from "@/lib/trading/fondeo";

/**
 * Simulador de prueba de fondeo: cuántos de 2.000 intentos con tu forma de
 * operar tocan el objetivo antes que el drawdown. La semilla es fija para
 * que el resultado no baile al mover un control: lo que cambia es tuyo.
 */
const CAMINOS = 2000;
/* Una ventaja pequeña (+0,04 R), la de la mayoría: con +0,35 R la prueba
   salía aprobada el 96 % de las veces y la herramienta parecía prometerlo. */
const DEFECTO: EscenarioFondeo = { tipo: "estatico", objetivo: 8, dd: 10, riesgo: 1, acierto: 40, payoff: 1.6, ops: 200 };
const sinSuscripcion = () => () => {};

export function PropChallengeSimulator() {
  const { lang } = useLang();
  const es = lang === "es";
  const pct = (v: number, dec = 0) => `${fmtNum(v, lang, dec)}${pctSep(lang)}`;

  /* Un escenario compartido llega en la dirección. En el servidor no hay
     dirección —el HTML estático se genera sin ella— y la lectura da vacío;
     en el navegador, la de verdad. Encima va solo lo que el visitante toca. */
  const busqueda = useSyncExternalStore(sinSuscripcion, () => window.location.search, () => "");
  const [cambios, setCambios] = useState<Partial<EscenarioFondeo>>({});
  const esc: EscenarioFondeo = { ...DEFECTO, ...leerEscenario(busqueda), ...cambios };
  const { tipo, objetivo, dd, riesgo, acierto, payoff, ops: maxOps } = esc;
  const poner =
    <K extends keyof EscenarioFondeo>(clave: K) =>
    (v: EscenarioFondeo[K]) =>
      setCambios((c) => ({ ...c, [clave]: v }));
  const setTipo = poner("tipo");
  const setObjetivo = poner("objetivo");
  const setDd = poner("dd");
  const setRiesgo = poner("riesgo");
  const setAcierto = poner("acierto");
  const setPayoff = poner("payoff");
  const setMaxOps = poner("ops");

  const c = useMemo(() => {
    const base = {
      objetivo: objetivo / 100,
      ddMaximo: dd / 100,
      riesgo: riesgo / 100,
      acierto: acierto / 100,
      payoff,
      maxOperaciones: maxOps,
      caminos: CAMINOS,
      semilla: 1,
    };
    const vacio = { aprueba: 0, suspende: 0, sinResolver: 1, medianaAprobar: null, medianaSuspender: null, caminos: CAMINOS };
    return {
      r: simularFondeo({ ...base, drawdown: tipo }) ?? vacio,
      otro: simularFondeo({ ...base, drawdown: tipo === "estatico" ? "dinamico" : "estatico" }) ?? vacio,
      esperanza: (acierto / 100) * payoff - (1 - acierto / 100),
    };
  }, [tipo, objetivo, dd, riesgo, acierto, payoff, maxOps]);

  const { r, otro, esperanza } = c;
  const nombreTipo = (t: TipoDrawdown) =>
    t === "estatico" ? (es ? "estático" : "static") : es ? "dinámico" : "trailing";
  const otroTipo: TipoDrawdown = tipo === "estatico" ? "dinamico" : "estatico";

  const diagnostico =
    esperanza <= 0
      ? es
        ? "Sin expectancy positiva, aprobar depende de la suerte: cuantas más operaciones hagas, más probable es tocar el drawdown."
        : "Without positive expectancy, passing is down to luck: the more trades you take, the likelier the drawdown."
      : r.aprueba < r.suspende
        ? es
          ? "La expectancy es positiva, pero con este riesgo el drawdown llega antes que el objetivo en la mayoría de intentos. Con menos riesgo por operación, la ventaja tiene más operaciones para notarse."
          : "Expectancy is positive, but at this risk the drawdown arrives before the target in most attempts. With less risk per trade, the edge gets more trades to show."
        : r.sinResolver > 0.2
          ? es
            ? `Más de uno de cada cinco intentos sigue abierto tras ${fmtOperaciones(maxOps, lang)}: con este riesgo, el objetivo queda lejos para ese plazo.`
            : `More than one attempt in five is still open after ${fmtOperaciones(maxOps, lang)}: at this risk, the target is far for that horizon.`
          : es
            ? `${r.aprueba >= 0.95 ? "Aprobarías casi todos los intentos" : `Aprobarías unos ${fmtInt(Math.round(r.aprueba * 10), lang)} de cada 10 intentos`}${r.medianaAprobar !== null ? `, en ${fmtOperaciones(r.medianaAprobar, lang)} de mediana` : ""}. Es una simulación con reglas simplificadas, no una promesa.`
            : `${r.aprueba >= 0.95 ? "You would pass almost every attempt" : `You would pass about ${fmtInt(Math.round(r.aprueba * 10), lang)} in 10 attempts`}${r.medianaAprobar !== null ? `, taking ${fmtOperaciones(r.medianaAprobar, lang)} at the median` : ""}. It is a simulation with simplified rules, not a promise.`;

  const filas = [
    {
      clave: "aprueba",
      etiqueta: es ? "Aprueba" : "Passes",
      valor: r.aprueba,
      color: "rgb(var(--sig-green))",
      ops: r.medianaAprobar,
    },
    {
      clave: "suspende",
      etiqueta: es ? "Suspende" : "Fails",
      valor: r.suspende,
      color: "rgb(var(--sig-red))",
      ops: r.medianaSuspender,
    },
    {
      clave: "abierto",
      etiqueta: es ? "Sin resolver" : "Unresolved",
      valor: r.sinResolver,
      color: "var(--ink-3)",
      ops: null,
    },
  ];

  const informe = () =>
    componerInforme(
      es ? "Prueba de fondeo simulada" : "Simulated prop firm challenge",
      [
        {
          lineas: [
            `${es ? "Objetivo" : "Target"}: ${pct(objetivo, 1)}`,
            `Drawdown: ${pct(dd, 1)} ${nombreTipo(tipo)}`,
            `${es ? "Riesgo por operación" : "Risk per trade"}: ${pct(riesgo, 2)} ${es ? "del saldo inicial" : "of starting balance"}`,
            `${es ? "Acierto" : "Win rate"}: ${pct(acierto)} · payoff ${fmtNum(payoff, lang, 1)}`,
            `Expectancy: ${fmtR(esperanza, lang)} ${es ? "por operación" : "per trade"}`,
          ],
        },
        {
          rotulo: es
            ? `Resultado en ${fmtOperaciones(maxOps, lang)}, ${fmtInt(CAMINOS, lang)} intentos simulados`
            : `Result within ${fmtOperaciones(maxOps, lang)}, ${fmtInt(CAMINOS, lang)} simulated attempts`,
          lineas: [
            `${es ? "Aprueba" : "Passes"}: ${fmtPct(r.aprueba, lang)}`,
            `${es ? "Suspende" : "Fails"}: ${fmtPct(r.suspende, lang)}`,
            `${es ? "Sin resolver" : "Unresolved"}: ${fmtPct(r.sinResolver, lang)}`,
          ],
        },
      ],
      `${es ? "" : "/en"}/herramientas/prueba-de-fondeo/`,
    );

  return (
    <section className="section-tight">
      <ResultadoAnunciado
        texto={
          es
            ? `Aprueba el ${fmtPct(r.aprueba, lang)} de los intentos, suspende el ${fmtPct(r.suspende, lang)} y queda sin resolver el ${fmtPct(r.sinResolver, lang)}.`
            : `${fmtPct(r.aprueba, lang)} of attempts pass, ${fmtPct(r.suspende, lang)} fail and ${fmtPct(r.sinResolver, lang)} stay unresolved.`
        }
      />
      <div className="tj-container">
        <div className="mb-5 inline-flex items-center gap-3">
          <span className="eyebrow" data-titular-herramienta>
            {es ? "Prueba de fondeo" : "Prop firm challenge"}
          </span>
        </div>

        {/* En móvil, el resultado va justo después de los controles. */}
        <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <h2 data-titular-herramienta className="t-h2 m-0 max-w-[24ch] text-primary">
              {es ? (
                <>
                  Cuántas veces la pasarías.
                </>
              ) : (
                <>
                  How often you would pass.
                </>
              )}
            </h2>
            <p className="medida mt-3 text-sm leading-relaxed text-secondary md:text-base">
              {es
                ? "Pon las reglas de la prueba y tu forma de operar, y mira qué parte de dos mil intentos llega antes al objetivo que al drawdown."
                : "Set the challenge rules and how you trade, and see what share of two thousand attempts reaches the target before the drawdown."}
            </p>

            <div className="mt-6">
              <span className="mb-2 block text-[12px] text-tertiary">{es ? "Tipo de drawdown" : "Drawdown type"}</span>
              <div className="tj-segmentado sm:max-w-sm" role="group" aria-label={es ? "Tipo de drawdown" : "Drawdown type"}>
                {(["estatico", "dinamico"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    aria-pressed={tipo === t}
                    onClick={() => setTipo(t)}
                    className="toque-comodo"
                  >
                    {t === "estatico" ? (es ? "Estático" : "Static") : es ? "Dinámico" : "Trailing"}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
              <Deslizador
                etiqueta={es ? "Objetivo de beneficio" : "Profit target"}
                texto={pct(objetivo, 1)}
                valor={objetivo}
                min={RANGOS_FONDEO.objetivo[0]}
                max={RANGOS_FONDEO.objetivo[1]}
                paso={RANGOS_FONDEO.objetivo[2]}
                onValor={setObjetivo}
              />
              <Deslizador
                etiqueta={es ? "Drawdown máximo" : "Maximum drawdown"}
                texto={pct(dd, 1)}
                valor={dd}
                min={RANGOS_FONDEO.dd[0]}
                max={RANGOS_FONDEO.dd[1]}
                paso={RANGOS_FONDEO.dd[2]}
                onValor={setDd}
              />
              <Deslizador
                etiqueta={es ? "Riesgo por operación (del saldo inicial)" : "Risk per trade (of starting balance)"}
                texto={pct(riesgo, 2)}
                valor={riesgo}
                min={RANGOS_FONDEO.riesgo[0]}
                max={RANGOS_FONDEO.riesgo[1]}
                paso={RANGOS_FONDEO.riesgo[2]}
                onValor={setRiesgo}
              />
              <Deslizador
                etiqueta={es ? "Porcentaje de aciertos" : "Win rate"}
                texto={pct(acierto)}
                valor={acierto}
                min={RANGOS_FONDEO.acierto[0]}
                max={RANGOS_FONDEO.acierto[1]}
                paso={RANGOS_FONDEO.acierto[2]}
                onValor={setAcierto}
              />
              <Deslizador
                etiqueta={es ? "Payoff (ganancia media / pérdida media)" : "Payoff (average win / average loss)"}
                texto={fmtNum(payoff, lang, 1)}
                valor={payoff}
                min={RANGOS_FONDEO.payoff[0]}
                max={RANGOS_FONDEO.payoff[1]}
                paso={RANGOS_FONDEO.payoff[2]}
                onValor={setPayoff}
              />
              <Deslizador
                etiqueta={es ? "Operaciones disponibles" : "Trades available"}
                texto={fmtInt(maxOps, lang)}
                valor={maxOps}
                min={RANGOS_FONDEO.ops[0]}
                max={RANGOS_FONDEO.ops[1]}
                paso={RANGOS_FONDEO.ops[2]}
                onValor={setMaxOps}
              />
            </div>
          </div>

          <div className="tj-ficha lg:sticky lg:top-24">
            <p className="tj-ficha-barra">
              <span>{es ? "Resultado de la prueba" : "Challenge outcome"}</span>
              <span>
                {fmtInt(CAMINOS, lang)} {es ? "intentos" : "attempts"}
              </span>
            </p>
            <div className="tj-ficha-cuerpo">
              <span className="block text-[12px] text-tertiary">{es ? "Aprueba" : "Passes"}</span>
              <div className="tj-cifra mt-1 text-primary">
                {fmtPct(r.aprueba, lang)}
              </div>
              <p className="m-0 mt-2 text-[13px] leading-[1.6] text-secondary">
                {es
                  ? `Con drawdown ${nombreTipo(otroTipo)}, ${fmtPct(otro.aprueba, lang)}.`
                  : `With a ${nombreTipo(otroTipo)} drawdown, ${fmtPct(otro.aprueba, lang)}.`}
              </p>

              <div
                aria-hidden
                className="mt-6 flex h-2 overflow-hidden rounded-[2px] bg-[var(--ficha-division)]"
              >
                {filas.map((f) =>
                  f.valor > 0 ? (
                    <span
                      key={f.clave}
                      style={{ width: `${f.valor * 100}%`, background: f.color, opacity: f.clave === "abierto" ? 0.35 : 1 }}
                    />
                  ) : null,
                )}
              </div>

              <dl className="m-0 mt-4">
                {filas.map((f) => (
                  <div key={f.clave} className="tj-ficha-fila text-[13px]">
                    <dt className="flex items-center gap-2 text-secondary">
                      <span
                        aria-hidden
                        className="inline-block h-2 w-2 rounded-full"
                        style={{ background: f.color, opacity: f.clave === "abierto" ? 0.5 : 1 }}
                      />
                      {f.etiqueta}
                    </dt>
                    <dd className="tnum m-0 ml-auto font-semibold text-primary">{fmtPct(f.valor, lang)}</dd>
                    <dd className="tnum m-0 w-[7.5rem] text-right text-[12px] text-tertiary">
                      {f.ops === null ? "" : es ? `${fmtInt(f.ops, lang)} ops de mediana` : `${fmtOperaciones(f.ops, lang)} median`}
                    </dd>
                  </div>
                ))}
              </dl>

              <p className="m-0 mt-4 border-t border-[var(--ficha-division)] pt-4 text-[13px] leading-[1.6] text-secondary">
                {diagnostico}
              </p>
              <p className="m-0 mt-3 text-[12px] leading-relaxed text-tertiary">
                {es
                  ? `Expectancy ${fmtR(esperanza, lang)} por operación. El dinámico sigue al máximo del saldo hasta el saldo inicial. No incluye el límite de pérdida diaria ni reglas de consistencia.`
                  : `Expectancy ${fmtR(esperanza, lang)} per trade. The trailing floor follows the balance high up to the starting balance. Daily loss limits and consistency rules are not included.`}
              </p>
            </div>
            <div className="tj-ficha-barra tj-ficha-barra--pie">
              <BotonCopiar
                texto={informe}
                rotulo={es ? "Copiar resumen" : "Copy summary"}
                hecho={es ? "Resumen copiado" : "Summary copied"}
              />
              <span className="text-tertiary">{es ? "Privado en tu navegador" : "Private in your browser"}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
