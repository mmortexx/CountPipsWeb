"use client";

import { useState, useMemo, useId, useEffect } from "react";
import { useLang } from "@/lib/i18n";
import { QUESTIONS, type DimId } from "@/lib/trading/disciplineQuestions";

/**
 * DisciplineScore — diagnóstico de disciplina operativa.
 *
 * ── Qué cambió, y por qué ─────────────────────────────────────────────
 * Era un test de seis preguntas con una única cifra al final. Gustaba,
 * pero medía poco: todas las respuestas valían lo mismo y el resultado no
 * distinguía a quien lleva un registro impecable y arriesga a ciegas de
 * quien gestiona el riesgo de libro y no anota nada. Dos traders con
 * problemas opuestos salían con la misma puntuación y el mismo consejo.
 *
 * Ahora mide CINCO EJES por separado, con tres preguntas cada uno:
 *
 *   RIESGO      lo que decide si la cuenta sobrevive
 *   PLAN        si hay una decisión antes de la operación
 *   REGISTRO    si existen datos propios sobre los que decidir
 *   TEMPLE      qué pasa cuando el mercado va en contra
 *   CONSTANCIA  si lo anterior se sostiene en el tiempo
 *
 * ── Las preguntas NO pesan igual ──────────────────────────────────────
 * Mover el stop en contra revela mucho más sobre un trader que revisar el
 * diario los domingos: lo primero vacía cuentas y lo segundo las mejora
 * despacio. Cada pregunta lleva su peso (1 a 3) y la puntuación de cada
 * eje es la media ponderada de las suyas. La cifra global es la media de
 * los ejes ponderada por la importancia del eje, no la suma de aciertos.
 *
 * Consecuencia buscada: un punto flaco grave en riesgo hunde el resultado
 * aunque todo lo demás esté bien. Es lo que pasa en la realidad.
 *
 * ── El resultado dice DÓNDE, no sólo CUÁNTO ───────────────────────────
 * Una cifra sola no es accionable. Se devuelve el perfil de los cinco
 * ejes en barras, el eje más débil señalado, y una recomendación escrita
 * para ESE eje — no un consejo genérico por tramo de puntuación.
 *
 * ── Material ──────────────────────────────────────────────────────────
 * .tj-paper + .tj-paper-glow. Objetivos táctiles ≥44 px. Sin desbordes en
 * móvil: las opciones se apilan y el perfil es de una columna.
 */

type Dim = {
  id: DimId;
  es: string;
  en: string;
  /* Peso del eje en la cifra global. Riesgo pesa el doble que constancia
     porque un fallo ahí no se corrige con tiempo: se paga en el momento. */
  weight: number;
  tipEs: string;
  tipEn: string;
};

const DIMS: Dim[] = [
  {
    id: "riesgo",
    es: "Riesgo",
    en: "Risk",
    weight: 3,
    tipEs:
      "Tu punto flaco es el riesgo, y es el que no admite paciencia: una racha normal basta para vaciar una cuenta mal dimensionada. Antes de tocar nada más, fija cuánto pierdes por operación —en dinero, no en sensación— y un tope diario que te saque de la pantalla al tocarlo.",
    tipEn:
      "Your weak point is risk, and it is the one that grants no patience: an ordinary losing run empties a badly sized account. Before anything else, fix how much you lose per trade — in money, not in feel — and a daily cap that pulls you off the screen when hit.",
  },
  {
    id: "plan",
    es: "Plan",
    en: "Plan",
    weight: 2.5,
    tipEs:
      "Tu punto flaco es el plan. Operas decidiendo sobre la marcha, y eso hace imposible saber si algo funciona: cada operación es distinta, así que no hay nada que medir. Escribe tus dos o tres situaciones con reglas concretas de entrada, stop y objetivo, y no abras nada que no encaje en una.",
    tipEn:
      "Your weak point is the plan. You decide as you go, which makes it impossible to know whether anything works: every trade is different, so there is nothing to measure. Write your two or three setups with concrete entry, stop and target rules, and open nothing that fits none of them.",
  },
  {
    id: "registro",
    es: "Registro",
    en: "Record",
    weight: 2,
    tipEs:
      "Tu punto flaco es el registro. Sin datos propios estás opinando sobre tu operativa, no analizándola — y la memoria guarda las ganadoras y suaviza las perdedoras. Anota cada operación con su motivo y revisa expectancy y R medio con una periodicidad fija.",
    tipEn:
      "Your weak point is the record. Without your own data you are opining about your trading, not analysing it — and memory keeps the winners and softens the losers. Log every trade with its reason and review expectancy and average R on a fixed schedule.",
  },
  {
    id: "temple",
    es: "Temple",
    en: "Composure",
    weight: 2.5,
    tipEs:
      "Tu punto flaco es el temple. Sabes qué hacer y dejas de hacerlo justo cuando importa: después de perder, con prisa o con la cuenta en rojo. No se arregla con fuerza de voluntad sino con frenos externos — un tope de pérdida que cierre la sesión y una regla de no operar en la hora siguiente a una pérdida grande.",
    tipEn:
      "Your weak point is composure. You know what to do and stop doing it exactly when it counts: after a loss, in a hurry, with the account down. Willpower does not fix this — external brakes do: a loss cap that ends the session, and a rule against trading in the hour after a big loss.",
  },
  {
    id: "constancia",
    es: "Constancia",
    en: "Consistency",
    weight: 1.5,
    tipEs:
      "Tu punto flaco es la constancia. Haces las cosas bien a ratos, y a ratos no basta: la ventaja sólo aparece sobre muchas operaciones seguidas del mismo modo. Elige un método y sostenlo tres meses sin cambiarlo, midiendo. Cambiar de sistema tras cada mala racha es la forma más cara de no aprender nada.",
    tipEn:
      "Your weak point is consistency. You do things well in patches, and patches are not enough: an edge only shows over many trades done the same way. Pick one method and hold it for three months, measuring. Switching systems after every bad run is the most expensive way to learn nothing.",
  },
];

/* Las quince preguntas (tipo `Q` incluido) viven en
   `@/lib/trading/disciplineQuestions.ts`, no aquí. Un componente con
   `"use client"` no puede exportar datos planos hacia un componente de
   servidor —en el servidor el módulo se sustituye por un sustituto que
   sólo sabe hacer de componente—, y `/test` necesita este mismo array
   para construir el `Quiz` que exige Google. */

/** Puntos máximos de una pregunta: cuatro opciones, de 0 a 3. */
const MAX_OPT = 3;

/**
 * Dónde se recuerdan las respuestas. Son quince preguntas: perderlas por
 * recargar, cambiar de idioma o volver desde otra página es motivo
 * suficiente para no rehacer el test, y el test es la pieza que más
 * engancha del sitio.
 *
 * Vive en el navegador de quien responde y no sale de ahí — el sitio no
 * tiene servidor donde guardarlo ni falta que hace.
 */
const CLAVE_GUARDADO = "tj-test-disciplina-v1";

export function DisciplineScore({ num = "04" }: { num?: string }) {
  const { lang } = useLang();
  const es = lang === "es";
  const [answers, setAnswers] = useState<(number | null)[]>(QUESTIONS.map(() => null));

  /* ── Una pregunta por pantalla ────────────────────────────────────
     El test enseñaba las quince preguntas apiladas. Con sesenta
     opciones a la vista de golpe, lo primero que hace quien llega no
     es responder: es calcular cuánto le va a costar. Y ese cálculo es
     el que hace que se vaya. Un diagnóstico se contesta de una en una
     —es como funciona cualquier cuestionario serio— y además concentra
     la atención en la pregunta que toca en lugar de repartirla entre
     quince.
     El índice vive aparte de las respuestas: se puede volver atrás a
     revisar sin perder nada de lo contestado. */
  const [actual, setActual] = useState(0);

  /* Recuperar lo respondido. Va en un efecto y no en el estado inicial a
     propósito: el HTML se genera en el build, sin navegador, y leer el
     almacenamiento durante el primer pintado haría que servidor y cliente
     dibujaran cosas distintas — React lo detecta y descarta el árbol.
     Primero se pinta el test vacío, después se rellena. */
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    try {
      const crudo = localStorage.getItem(CLAVE_GUARDADO);
      if (!crudo) return;
      const guardado: unknown = JSON.parse(crudo);
      /* La comprobación de longitud NO es paranoia de más: el día que se
         añada o quite una pregunta, un guardado antiguo encajaría a medias
         y desplazaría cada respuesta a la pregunta equivocada, dando un
         diagnóstico falso sin que nada fallara a la vista. */
      if (
        Array.isArray(guardado) &&
        guardado.length === QUESTIONS.length &&
        guardado.every(
          (v) => v === null || (Number.isInteger(v) && v >= 0 && v <= MAX_OPT),
        )
      ) {
        setAnswers(guardado as (number | null)[]);
      }
    } catch {
      /* Almacenamiento bloqueado (modo privado, cookies de terceros) o
         dato corrupto. El test funciona igual, solo que sin memoria. */
    }
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    try {
      localStorage.setItem(CLAVE_GUARDADO, JSON.stringify(answers));
    } catch {
      /* Sin almacenamiento no se guarda, y no pasa nada más. */
    }
  }, [answers]);

  const answeredCount = answers.filter((a) => a !== null).length;
  const allAnswered = answeredCount === QUESTIONS.length;

  /* Puntuación por eje: media ponderada de sus preguntas, en 0-100. Las
     preguntas sin responder no cuentan ni a favor ni en contra, así que el
     perfil ya dice algo antes de terminar. */
  const perDim = useMemo(() => {
    const acc: Record<DimId, { got: number; max: number }> = {
      riesgo: { got: 0, max: 0 },
      plan: { got: 0, max: 0 },
      registro: { got: 0, max: 0 },
      temple: { got: 0, max: 0 },
      constancia: { got: 0, max: 0 },
    };
    QUESTIONS.forEach((q, i) => {
      const a = answers[i];
      if (a === null) return;
      acc[q.dim].got += a * q.weight;
      acc[q.dim].max += MAX_OPT * q.weight;
    });
    return DIMS.map((d) => ({
      dim: d,
      pct: acc[d.id].max > 0 ? Math.round((acc[d.id].got / acc[d.id].max) * 100) : 0,
      respondidas: acc[d.id].max > 0,
    }));
  }, [answers]);

  /* Cifra global: media de los ejes ponderada por la importancia del eje.
     NO es el porcentaje de aciertos — un fallo en riesgo pesa el doble
     que uno en constancia, igual que en la operativa real. */
  const score = useMemo(() => {
    let got = 0;
    let max = 0;
    QUESTIONS.forEach((q, i) => {
      const a = answers[i];
      if (a === null) return;
      const dim = DIMS.find((d) => d.id === q.dim);
      const w = q.weight * (dim ? dim.weight : 1);
      got += a * w;
      max += MAX_OPT * w;
    });
    return max > 0 ? Math.round((got / max) * 100) : 0;
  }, [answers]);

  const level = useMemo(() => {
    if (!allAnswered) return null;
    if (score < 40)
      return {
        label: es ? "Frágil" : "Fragile",
        color: "rgb(var(--pnl-neg))",
        resumenEs: "Ahora mismo el resultado depende del mercado, no de ti.",
        resumenEn: "Right now the outcome depends on the market, not on you.",
      };
    if (score < 65)
      return {
        label: es ? "En construcción" : "Building",
        color: "rgb(var(--sig-amber))",
        resumenEs: "Hay base. Lo que falta es que se sostenga cuando cuesta.",
        resumenEn: "There's a base. What's missing is holding it when it's hard.",
      };
    if (score < 85)
      return {
        label: es ? "Sólido" : "Solid",
        color: "rgb(var(--accent-base))",
        resumenEs: "Operativa medida. Queda afinar los bordes.",
        resumenEn: "Measured trading. The edges remain to be sharpened.",
      };
    return {
      label: es ? "Institucional" : "Institutional",
      color: "rgb(var(--pnl-pos))",
      resumenEs: "Sobrevives a la varianza, que es lo que deja cobrar una ventaja.",
      resumenEn: "You survive variance, which is what lets an edge pay out.",
    };
  }, [allAnswered, score, es]);

  /* El eje más flojo, que es de lo que va la recomendación. A igualdad de
     porcentaje gana el de más peso: si riesgo y constancia empatan, lo
     urgente es riesgo. */
  const weakest = useMemo(() => {
    if (!allAnswered) return null;
    return [...perDim].sort(
      (a, b) => a.pct - b.pct || b.dim.weight - a.dim.weight,
    )[0];
  }, [perDim, allAnswered]);

  const [copied, setCopied] = useState(false);

  const copyAssessment = async () => {
    if (!allAnswered || !level) return;
    const lines = [
      es ? "Diagnóstico de Disciplina — CountPips" : "Discipline Assessment — CountPips",
      "─".repeat(32),
      `${es ? "Puntuación Global" : "Global Score"}: ${score} / 100 (${level.label})`,
      "",
      es ? "Desglose por Ejes:" : "Axis Breakdown:",
      ...perDim.map(({ dim, pct }) => `  · ${es ? dim.es : dim.en}: ${pct}%`),
      "",
      `${es ? "Punto a reforzar" : "Priority focus"}: ${weakest ? (es ? weakest.dim.es : weakest.dim.en) : "—"}`,
      weakest ? (es ? weakest.dim.tipEs : weakest.dim.tipEn) : "",
      "─".repeat(32),
      "https://countpips.com/test",
    ];
    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      // clipboard fallback
    }
  };

  const reset = () => setAnswers(QUESTIONS.map(() => null));

  const setAnswer = (qi: number, oi: number) =>
    setAnswers((prev) => {
      const next = [...prev];
      next[qi] = oi;
      return next;
    });

  /* `useId` y no un contador: si algún día el diagnóstico saliera dos
     veces en la misma página, dos `id="q-0"` romperían la asociación
     entre la pregunta y su grupo de respuestas — y el fallo sería
     invisible salvo con lector de pantalla. */
  const uid = useId();
  const idPregunta = (qi: number) => `${uid}-q${qi}`;

  /* Flechas dentro de un grupo de opciones. Es el comportamiento que un
     lector de pantalla ANUNCIA al entrar en el grupo ("1 de 4"), así que
     si no estuviera implementado estaríamos prometiendo algo que no
     ocurre. Home/End saltan a los extremos; la selección sigue al foco,
     que es como se comporta un grupo de opción nativo. */
  const onKeyOption = (
    e: React.KeyboardEvent<HTMLButtonElement>,
    qi: number,
    oi: number,
    total: number,
  ) => {
    let destino: number;
    switch (e.key) {
      case "ArrowRight":
      case "ArrowDown":
        destino = (oi + 1) % total;
        break;
      case "ArrowLeft":
      case "ArrowUp":
        destino = (oi - 1 + total) % total;
        break;
      case "Home":
        destino = 0;
        break;
      case "End":
        destino = total - 1;
        break;
      default:
        return;
    }
    e.preventDefault();
    setAnswer(qi, destino);
    const grupo = e.currentTarget.parentElement;
    grupo?.querySelectorAll<HTMLButtonElement>('[role="radio"]')[destino]?.focus();
  };

  const barColor = (pct: number) =>
    pct < 40
      ? "rgb(var(--pnl-neg))"
      : pct < 65
        ? "rgb(var(--sig-amber))"
        : pct < 85
          ? "rgb(var(--accent-base))"
          : "rgb(var(--pnl-pos))";

  return (
    <section className="section-tight bg-veil border-t border-[rgb(var(--divider)/0.06)]">
      <div className="tj-container">
        {/* ── Encabezado ─────────────────────────────────────────────── */}
        <div className="mb-8 max-w-[46em]">
          <div className="inline-flex items-center gap-3 mb-5">
            <span
              className="tnum"
              style={{ fontSize: 12, fontWeight: 500, letterSpacing: "0.04em", color: "rgb(var(--accent-base))" }}
            >
              § {num}
            </span>
            <span aria-hidden style={{ width: 22, height: 1, background: "rgb(var(--divider) / 0.13)" }} />
            <span className="tnum" style={{ fontSize: 11, letterSpacing: "0.2em", color: "var(--ink-3)" }}>
              {es ? "DIAGNÓSTICO" : "DIAGNOSIS"}
            </span>
          </div>
          <h2
            className="font-serif m-0"
            style={{
              fontSize: "clamp(1.95rem, 3.5vw, 3rem)",
              fontWeight: 400,
              letterSpacing: "-0.022em",
              lineHeight: 1.08,
              color: "var(--ink)",
              textWrap: "balance",
            }}
          >
            {es ? (
              <>
                Mídete. <span style={{ color: "rgb(var(--accent-base))" }}>Por dónde flojeas.</span>
              </>
            ) : (
              <>
                Measure yourself. <span style={{ color: "rgb(var(--accent-base))" }}>Where you're weak.</span>
              </>
            )}
          </h2>
          <p
            className="mt-5"
            style={{ fontSize: "clamp(1rem, 1.3vw, 1.1rem)", lineHeight: 1.62, color: "var(--ink-2)" }}
          >
            {es
              ? "Quince preguntas sobre cinco ejes: riesgo, plan, registro, temple y constancia. No todas pesan igual — mover un stop en contra dice más de un trader que revisar el diario los domingos. Al final: tu perfil por ejes, la cifra global y qué arreglar primero. Sin email."
              : "Fifteen questions across five axes: risk, plan, record, composure and consistency. They don't all weigh the same — moving a stop against you says more about a trader than reviewing the journal on Sundays. At the end: your profile by axis, the overall figure and what to fix first. No email."}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_1fr] gap-8 items-start">
          {/* ── Cuestionario ─────────────────────────────────────────── */}
          <div>
            {/* Progreso */}
            <div className="mb-4">
              <div className="mb-2 flex items-center justify-between">
                <span
                  className="tnum"
                  style={{ fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--ink-3)" }}
                >
                  {es ? "Progreso" : "Progress"}
                </span>
                <span className="tnum" style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-2)" }}>
                  {answeredCount} / {QUESTIONS.length}
                </span>
              </div>
              <div className="h-1 rounded-[1px] overflow-hidden" style={{ background: "rgb(var(--divider) / 0.13)" }}>
                <div
                  className="h-full rounded-[1px]"
                  style={{
                    width: `${(answeredCount / QUESTIONS.length) * 100}%`,
                    background: "rgb(var(--accent-base))",
                    transition: "width 0.22s var(--ease-suave)",
                  }}
                />
              </div>
            </div>

            <ol className="list-none p-0 m-0 flex flex-col gap-5">
              {QUESTIONS.map((q, qi) => {
                /* Solo se dibuja la pregunta en curso. Se recorre el
                   array entero en vez de indexar directamente para no
                   tocar nada del cuerpo que ya funciona —índices,
                   accesibilidad, teclado—: lo único que cambia es
                   cuántas se pintan. */
                if (qi !== actual) return null;
                const dim = DIMS.find((d) => d.id === q.dim);
                return (
                  <li key={qi} className="tj-paper rounded-[2px] p-4">
                    <div className="flex items-baseline gap-2 mb-1">
                      <span
                        className="tnum"
                        style={{ fontSize: 10, fontWeight: 700, color: "rgb(var(--accent-base))" }}
                      >
                        {String(qi + 1).padStart(2, "0")}
                      </span>
                      <span
                        className="tnum"
                        style={{ fontSize: 9.5, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--ink-3)" }}
                      >
                        {dim ? (es ? dim.es : dim.en) : ""}
                      </span>
                    </div>
                    <p
                      id={idPregunta(qi)}
                      className="m-0 mb-3"
                      style={{ fontSize: 14.5, lineHeight: 1.5, color: "var(--ink)" }}
                    >
                      {es ? q.qEs : q.qEn}
                    </p>
                    {/* Una columna en móvil y dos desde `sm`: las respuestas
                        son frases, no etiquetas, y en 390 px apiladas se
                        leen sin cortes.

                        `radiogroup` + `radio`, y no cuatro botones con
                        `aria-pressed` como estaba: `aria-pressed` describe
                        un interruptor que se queda hundido, así que quien
                        usa lector de pantalla oía cuatro interruptores
                        independientes —sin saber que son excluyentes, ni
                        cuántos hay, ni a qué pregunta responden—. Con el
                        grupo se anuncia la pregunta al entrar y cada
                        opción como "2 de 4".

                        El tabulador, además, pasaba por las 60 opciones
                        del test una a una. Ahora cada grupo es UNA parada
                        y dentro se elige con las flechas: 60 → 15. */}
                    <div
                      role="radiogroup"
                      aria-labelledby={idPregunta(qi)}
                      className="grid grid-cols-1 sm:grid-cols-2 gap-2"
                    >
                      {q.options.map((o, oi) => {
                        const activa = answers[qi] === oi;
                        /* Un grupo de opción tiene UNA parada de tabulador:
                           la elegida, o la primera si aún no hay ninguna. */
                        const enfocable = answers[qi] === null ? oi === 0 : activa;
                        return (
                          <button
                            key={oi}
                            type="button"
                            role="radio"
                            aria-checked={activa}
                            tabIndex={enfocable ? 0 : -1}
                            onClick={() => setAnswer(qi, oi)}
                            onKeyDown={(e) => onKeyOption(e, qi, oi, q.options.length)}
                            className="text-left rounded-[2px] transition-[background-color,border-color,color] duration-200"
                            style={{
                              minHeight: 44,
                              padding: "10px 12px",
                              fontSize: 13,
                              lineHeight: 1.35,
                              cursor: "pointer",
                              color: activa ? "rgb(var(--accent-base))" : "var(--ink-2)",
                              background: activa
                                ? "color-mix(in oklab, rgb(var(--accent-base)) 12%, transparent)"
                                : "color-mix(in oklab, var(--surface-2) 45%, transparent)",
                              border: activa
                                ? "1px solid color-mix(in oklab, rgb(var(--accent-base)) 50%, transparent)"
                                : "1px solid rgb(var(--divider) / 0.12)",
                            }}
                          >
                            {es ? o.es : o.en}
                          </button>
                        );
                      })}
                    </div>
                  </li>
                );
              })}
            </ol>

            {/* ── Recorrido ────────────────────────────────────────────
                Anterior y Siguiente, más la posición en el conjunto. El
                avance NO es automático al responder: en un test de
                autodiagnóstico la gente cambia de opinión sobre la
                marcha, y saltar solo al tocar una opción impide
                corregir sin tener que retroceder. Se avanza cuando uno
                decide que ha terminado con la pregunta. */}
            <div className="mt-6 flex items-center justify-between gap-4 border-t pt-4"
                 style={{ borderColor: "rgb(var(--divider) / 0.14)" }}>
              <button
                type="button"
                onClick={() => setActual((i) => Math.max(0, i - 1))}
                disabled={actual === 0}
                className="inline-flex items-center gap-2 rounded-[2px] transition-colors duration-200 disabled:opacity-35 disabled:cursor-not-allowed"
                style={{ minHeight: 44, padding: "10px 16px", fontSize: 13, cursor: "pointer",
                         color: "var(--ink-2)", border: "1px solid rgb(var(--divider) / 0.16)" }}
              >
                ← {es ? "Anterior" : "Back"}
              </button>

              <span className="tnum" style={{ fontSize: 12, color: "var(--ink-3)" }}>
                {actual + 1} / {QUESTIONS.length}
              </span>

              {actual < QUESTIONS.length - 1 ? (
                <button
                  type="button"
                  onClick={() => setActual((i) => Math.min(QUESTIONS.length - 1, i + 1))}
                  /* Se puede seguir sin responder: obligar a contestar
                     para avanzar convierte un diagnóstico en un peaje.
                     El resultado ya avisa de cuántas faltan. */
                  className="inline-flex items-center gap-2 rounded-[2px] transition-colors duration-200"
                  style={{ minHeight: 44, padding: "10px 18px", fontSize: 13, fontWeight: 600,
                           cursor: "pointer", color: "rgb(var(--accent-ink))",
                           background: "rgb(var(--accent-base))" }}
                >
                  {es ? "Siguiente" : "Next"} →
                </button>
              ) : (
                <span className="tnum" style={{ fontSize: 12, color: "var(--ink-3)" }}>
                  {es ? "Última" : "Last"}
                </span>
              )}
            </div>

            {answeredCount > 0 && (
              <button
                type="button"
                onClick={reset}
                className="mt-5 inline-flex items-center gap-2 rounded-[2px]"
                style={{
                  minHeight: 44,
                  padding: "10px 18px",
                  fontSize: 13,
                  cursor: "pointer",
                  color: "var(--ink-2)",
                  background: "transparent",
                  border: "1px solid rgb(var(--divider) / 0.16)",
                }}
              >
                {es ? "Empezar de nuevo" : "Start over"}
              </button>
            )}
          </div>

          {/* ── Resultado ────────────────────────────────────────────── */}
          <div className="lg:sticky lg:top-24">
            <div className="tj-paper tj-paper-glow rounded-[2px] p-5">
              <div
                className="tnum mb-4"
                style={{ fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--ink-3)" }}
              >
                {es ? "Tu perfil" : "Your profile"}
              </div>

              {/* Cifra global */}
              <div className="flex items-end gap-3 mb-1">
                <span
                  className="tnum"
                  style={{
                    fontSize: 46,
                    fontWeight: 700,
                    lineHeight: 1,
                    color: level ? level.color : "var(--ink-3)",
                    transition: "color 0.25s ease",
                  }}
                >
                  {score}
                </span>
                <span className="tnum" style={{ fontSize: 15, color: "var(--ink-3)", paddingBottom: 4 }}>
                  / 100
                </span>
                {level && (
                  <span
                    className="tnum ml-auto px-2.5 py-1 rounded-[2px]"
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                      color: level.color,
                      background: `color-mix(in oklab, ${level.color} 14%, transparent)`,
                      border: `1px solid color-mix(in oklab, ${level.color} 40%, transparent)`,
                    }}
                  >
                    {level.label}
                  </span>
                )}
              </div>
              <p className="m-0 mb-5" style={{ fontSize: 12.5, lineHeight: 1.5, color: "var(--ink-3)" }}>
                {level
                  ? es
                    ? level.resumenEs
                    : level.resumenEn
                  : es
                    ? "Ponderado por eje: un fallo en riesgo pesa más que uno en constancia."
                    : "Weighted by axis: a gap in risk weighs more than one in consistency."}
              </p>

              {/* Perfil por ejes */}
              <div className="flex flex-col gap-3 mb-5">
                {perDim.map(({ dim, pct, respondidas }) => (
                  <div key={dim.id}>
                    <div className="flex items-baseline justify-between mb-1">
                      <span style={{ fontSize: 12.5, color: "var(--ink-2)" }}>{es ? dim.es : dim.en}</span>
                      <span
                        className="tnum"
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          color: respondidas ? barColor(pct) : "var(--ink-3)",
                        }}
                      >
                        {respondidas ? `${pct} %` : "—"}
                      </span>
                    </div>
                    <div
                      className="h-1.5 rounded-[1px] overflow-hidden"
                      style={{ background: "rgb(var(--divider) / 0.12)" }}
                    >
                      <div
                        className="h-full rounded-[1px]"
                        style={{
                          width: `${respondidas ? pct : 0}%`,
                          background: barColor(pct),
                          transition: "width 0.3s var(--ease-suave), background-color 0.3s ease",
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Qué arreglar primero */}
              {weakest ? (
                <>
                  <div className="rounded-[2px] p-4 bg-[var(--surface-2)]/50 border border-[rgb(var(--divider)/0.1)]">
                    <div className="tnum mb-2 text-[10px] uppercase tracking-[0.14em] text-[rgb(var(--accent-base))] font-semibold">
                      {es ? "Empieza por aquí" : "Start here"}
                    </div>
                    <p className="m-0 text-sm leading-relaxed text-secondary">
                      {es ? weakest.dim.tipEs : weakest.dim.tipEn}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={copyAssessment}
                    className="mt-3.5 w-full inline-flex items-center justify-center gap-2 min-h-[44px] px-4 rounded-[2px] text-xs font-mono font-semibold transition-colors duration-150 border border-[rgb(var(--accent-base)/0.35)] bg-[rgb(var(--accent-base)/0.12)] text-[rgb(var(--accent-base))] hover:bg-[rgb(var(--accent-base)/0.2)] outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--accent-base)/0.55)] cursor-pointer"
                  >
                    {copied ? (
                      <>
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                          <path d="M3 8.5l3 3 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <span>{es ? "Diagnóstico copiado" : "Assessment copied"}</span>
                      </>
                    ) : (
                      <>
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                          <rect x="5" y="5" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
                          <path d="M3 11V3.5A1.5 1.5 0 014.5 2H11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                        <span>{es ? "Copiar diagnóstico completo" : "Copy full assessment"}</span>
                      </>
                    )}
                  </button>
                </>
              ) : (
                <p className="m-0 text-xs leading-relaxed text-tertiary">
                  {es
                    ? `Responde las ${QUESTIONS.length} preguntas para ver tu perfil completo y por dónde empezar.`
                    : `Answer all ${QUESTIONS.length} questions to see your full profile and where to start.`}
                </p>
              )}

              <p className="m-0 mt-4" style={{ fontSize: 11, lineHeight: 1.5, color: "var(--ink-3)" }}>
                {es
                  ? "Autoevaluación orientativa: mide hábitos declarados, no resultados. Lo que de verdad te retrata son tus propios datos operación a operación."
                  : "Indicative self-assessment: it measures declared habits, not results. What really portrays you is your own trade-by-trade data."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
