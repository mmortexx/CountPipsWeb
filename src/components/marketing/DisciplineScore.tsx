"use client";

import { useState, useMemo, useId, useEffect, useRef } from "react";
import { useLang } from "@/lib/i18n";
import { pctSep, fmtInt } from "@/lib/trading/format";
import { BotonCopiar } from "@/components/tj/BotonCopiar";
import { ResultadoAnunciado } from "@/components/tj/ResultadoAnunciado";
import { componerInforme } from "@/lib/informe";
import { moverConFlechas } from "@/lib/flechas";
import { QUESTIONS, type DimId } from "@/lib/trading/disciplineQuestions";

/**
 * Diagnóstico de disciplina operativa: cinco ejes (riesgo, plan, registro,
 * temple y constancia) con tres preguntas cada uno.
 *
 * Las preguntas pesan distinto (1 a 3). El eje puntúa con la media ponderada
 * de las suyas y la cifra global es la media de los ejes ponderada por el
 * peso del eje, no la suma de aciertos: un fallo grave en riesgo hunde el
 * resultado. El resultado muestra el perfil por ejes, el más débil y una
 * recomendación escrita para ese eje.
 */

type Dim = {
  id: DimId;
  es: string;
  en: string;
  /* Peso del eje en la cifra global: un fallo en riesgo se paga al momento,
     no se corrige con tiempo. */
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
      "Tu punto flaco es el riesgo, y es el que no admite paciencia: una racha normal basta para vaciar una cuenta mal dimensionada. Antes de tocar nada más, fija cuánto pierdes por operación —\u2060en dinero, no en sensación\u2060— y un tope diario que te saque de la pantalla al tocarlo.",
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
      "Tu punto flaco es el registro. Sin datos propios estás opinando sobre tu operativa, no analizándola, y la memoria guarda las ganadoras y suaviza las perdedoras. Anota cada operación con su motivo y revisa expectancy y R medio con una periodicidad fija.",
    tipEn:
      "Your weak point is the record. Without your own data you are opining about your trading, not analysing it — and memory keeps the winners and softens the losers. Log every trade with its reason and review expectancy and average R on a fixed schedule.",
  },
  {
    id: "temple",
    es: "Temple",
    en: "Composure",
    weight: 2.5,
    tipEs:
      "Tu punto flaco es el temple. Sabes qué hacer y dejas de hacerlo justo cuando importa: después de perder, con prisa o con la cuenta en rojo. No se arregla con fuerza de voluntad sino con frenos externos: un tope de pérdida que cierre la sesión y una regla de no operar en la hora siguiente a una pérdida grande.",
    tipEn:
      "Your weak point is composure. You know what to do and stop doing it exactly when it counts: after a loss, in a hurry, with the account down. Willpower does not fix this — external brakes do: a loss cap that ends the session, and a rule against trading in the hour after a big loss.",
  },
  {
    id: "constancia",
    es: "Constancia",
    en: "Consistency",
    weight: 1.5,
    tipEs:
      "Tu punto flaco es la constancia. Haces las cosas bien a ratos, y a ratos no basta: la ventaja solo aparece sobre muchas operaciones seguidas del mismo modo. Elige un método y sostenlo tres meses sin cambiarlo, midiendo. Cambiar de sistema tras cada mala racha es la forma más cara de no aprender nada.",
    tipEn:
      "Your weak point is consistency. You do things well in patches, and patches are not enough: an edge only shows over many trades done the same way. Pick one method and hold it for three months, measuring. Switching systems after every bad run is the most expensive way to learn nothing.",
  },
];

/* Las quince preguntas viven en `@/lib/trading/disciplineQuestions.ts`: un
   módulo `"use client"` no puede exportar datos a un componente de servidor,
   y `/test` necesita el mismo array para el `Quiz` de Google. */

/** Puntos máximos de una pregunta: cuatro opciones, de 0 a 3. */
const MAX_OPT = 3;
/** Desde aquí, el eje más bajo ya no es un punto flaco sino uno que vigilar. */
const UMBRAL_SIN_PUNTO_FLACO = 85;

/** Dónde se recuerdan las respuestas (solo en el navegador de quien responde). */
const CLAVE_GUARDADO = "tj-test-disciplina-v1";

/** `enPagina`: bajo un PageHeader que ya titula, la cabecera propia solo queda para lectores de pantalla. */
export function DisciplineScore({ enPagina = false }: { enPagina?: boolean } = {}) {
  const { lang } = useLang();
  const es = lang === "es";
  const [answers, setAnswers] = useState<(number | null)[]>(QUESTIONS.map(() => null));

  /* Una pregunta por pantalla. El índice va aparte de las respuestas para
     poder volver atrás sin perder lo contestado. */
  const [actual, setActual] = useState(0);

  /* Recuperar lo respondido, en un efecto y no en el estado inicial: el HTML
     se genera en el build, y leer el almacenamiento al primer pintado haría
     que servidor y cliente dibujaran cosas distintas. */
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    try {
      const crudo = localStorage.getItem(CLAVE_GUARDADO);
      if (!crudo) return;
      const guardado: unknown = JSON.parse(crudo);
      /* La longitud se comprueba: si cambia el número de preguntas, un
         guardado antiguo desplazaría las respuestas y daría un diagnóstico
         falso sin error visible. */
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
      /* Almacenamiento bloqueado o dato corrupto: el test sigue sin memoria. */
    }
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    try {
      localStorage.setItem(CLAVE_GUARDADO, JSON.stringify(answers));
    } catch {
      /* Sin almacenamiento no se guarda. */
    }
  }, [answers]);

  const answeredCount = answers.filter((a) => a !== null).length;
  const allAnswered = answeredCount === QUESTIONS.length;

  /* Puntuación por eje: media ponderada de sus preguntas, en 0-100. Las no
     respondidas no cuentan, así que el perfil ya dice algo antes de terminar. */
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

  /* Cifra global: media de los ejes ponderada por su peso, no el porcentaje
     de aciertos. */
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
        resumenEn: "There’s a base. What’s missing is holding it when it’s hard.",
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

  /* El eje más flojo, sobre el que va la recomendación. En empate gana el de
     más peso. */
  const weakest = useMemo(() => {
    if (!allAnswered) return null;
    return [...perDim].sort(
      (a, b) => a.pct - b.pct || b.dim.weight - a.dim.weight,
    )[0];
  }, [perDim, allAnswered]);

  /* El eje más bajo siempre existe, aunque esté al 100 %. Por encima del
     umbral no hay punto flaco que señalar, sino un eje que vigilar. */
  const sinPuntoFlaco = weakest !== null && weakest.pct >= UMBRAL_SIN_PUNTO_FLACO;
  const consejo = !weakest
    ? null
    : sinPuntoFlaco
      ? weakest.pct >= 100
        ? es
          ? `Los cinco ejes están al 100${pctSep(lang)}. Lo que toca es sostenerlo con datos y no con memoria: revisa cada mes tu ${weakest.dim.es.toLowerCase()}, que es el eje que más pesa y el primero que cede cuando las cosas se tuercen.`
          : `All five axes are at 100%. The job now is to hold it with data, not memory: review your ${weakest.dim.en.toLowerCase()} every month, the axis that weighs most and the first to give way when things turn.`
        : es
          ? `No hay un punto flaco claro: los cinco ejes están en el ${UMBRAL_SIN_PUNTO_FLACO}${pctSep(lang)} o más. Lo que toca es sostenerlo con datos y no con memoria: revisa cada mes tu ${weakest.dim.es.toLowerCase()} (${weakest.pct}${pctSep(lang)}), el eje con menos margen.`
          : `No clear weak spot: all five axes are at ${UMBRAL_SIN_PUNTO_FLACO}% or above. The job now is to hold it with data, not memory: review your ${weakest.dim.en.toLowerCase()} (${weakest.pct}%) every month, the axis with the least margin.`
      : es
        ? weakest.dim.tipEs
        : weakest.dim.tipEn;
  const rotuloConsejo = sinPuntoFlaco ? (es ? "Para sostenerlo" : "To keep it") : es ? "Empieza por aquí" : "Start here";

  /* El foco sigue a la pregunta (el botón pulsado puede desaparecer). Solo se
     mueve tras un gesto, nunca al cargar. */
  const enunciadoRef = useRef<HTMLParagraphElement>(null);
  const resultadoRef = useRef<HTMLDivElement>(null);
  const moverFoco = useRef(false);
  useEffect(() => {
    if (!moverFoco.current) return;
    moverFoco.current = false;
    enunciadoRef.current?.focus();
  }, [actual, answers]);
  const irA = (i: number) => {
    moverFoco.current = true;
    setActual(Math.min(QUESTIONS.length - 1, Math.max(0, i)));
  };
  const verResultado = () => {
    resultadoRef.current?.focus();
    resultadoRef.current?.scrollIntoView({ block: "start" });
  };


  const informe = () =>
    componerInforme(
      es ? "Diagnóstico de disciplina" : "Discipline assessment",
      [
        {
          lineas: [
            level && `${es ? "Puntuación global" : "Overall score"}: ${fmtInt(score, lang)} / 100 (${level.label})`,
          ],
        },
        {
          rotulo: es ? "Por ejes" : "By axis",
          lineas: perDim.map(({ dim, pct }) => `${es ? dim.es : dim.en}: ${pct}${pctSep(lang)}`),
        },
        {
          rotulo: rotuloConsejo,
          lineas: [consejo],
        },
      ],
      es ? "/test/" : "/en/test/",
    );

  /* Reiniciar vuelve a la pregunta 1. */
  const reset = () => {
    setAnswers(QUESTIONS.map(() => null));
    irA(0);
  };

  const setAnswer = (qi: number, oi: number) =>
    setAnswers((prev) => {
      const next = [...prev];
      next[qi] = oi;
      return next;
    });

  /* `useId` y no un contador: con dos diagnósticos en una página, los `id`
     repetidos romperían la asociación pregunta-respuestas para el lector. */
  const uid = useId();
  const idPregunta = (qi: number) => `${uid}-q${qi}`;


  const barColor = (pct: number) =>
    pct < 40
      ? "rgb(var(--pnl-neg))"
      : pct < 65
        ? "rgb(var(--sig-amber))"
        : pct < 85
          ? "rgb(var(--accent-base))"
          : "rgb(var(--pnl-pos))";

  return (
    <section className="section-tight">
      <div className="tj-container">
        {/* ── Encabezado ─────────────────────────────────────────────── */}
        <div className={enPagina ? "sr-only" : "mb-8 max-w-[46em]"}>
          <div className="inline-flex items-center gap-3 mb-5">
            <span className="eyebrow">
              {es ? "Diagnóstico" : "Diagnosis"}
            </span>
          </div>
          <h2 className="t-h2 m-0 text-primary">
            {es ? (
              <>
                Mídete. Por dónde flojeas.
              </>
            ) : (
              <>
                Measure yourself. Where you’re weak.
              </>
            )}
          </h2>
          <p
            className="t-entradilla mt-5"
            style={{ color: "var(--ink-2)" }}
          >
            {es
              ? "Quince preguntas sobre cinco ejes: riesgo, plan, registro, temple y constancia. No todas pesan igual: mover un stop en contra dice más de un trader que revisar el diario los domingos. Al final: tu perfil por ejes, la cifra global y qué arreglar primero. Sin email."
              : "Fifteen questions across five axes: risk, plan, record, composure and consistency. They don’t all weigh the same — moving a stop against you says more about a trader than reviewing the journal on Sundays. At the end: your profile by axis, the overall figure and what to fix first. No email."}
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
                  style={{ fontSize: 12, color: "var(--ink-3)" }}
                >
                  {/* «Respondidas» y no «Progreso»: otro contador con el mismo
                      formato (la pregunta en curso) se leería como contradicción. */}
                  {es ? "Respondidas" : "Answered"}
                </span>
                <span className="tnum" style={{ fontSize: 13, fontWeight: 600, color: "var(--ink-2)" }}>
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
                /* Solo se dibuja la pregunta en curso. */
                if (qi !== actual) return null;
                const dim = DIMS.find((d) => d.id === q.dim);
                return (
                  <li key={qi} className="pt-2">
                    <div className="flex items-baseline gap-2 mb-1">
                      <span
                        className="tnum"
                        style={{ fontSize: 13, fontWeight: 500, color: "var(--ink-3)" }}
                      >
                        {String(qi + 1).padStart(2, "0")}
                      </span>
                      <span
                        className="tnum"
                        style={{ fontSize: 12, color: "var(--ink-3)" }}
                      >
                        {dim ? (es ? dim.es : dim.en) : ""}
                      </span>
                    </div>
                    <p
                      ref={enunciadoRef}
                      tabIndex={-1}
                      id={idPregunta(qi)}
                      className="t-h4 m-0 mb-5 outline-none"
                      style={{ color: "var(--ink)" }}
                    >
                      {es ? q.qEs : q.qEn}
                    </p>
                    {/* Una columna en móvil y dos desde `sm`. `radiogroup` + `radio`
                        y no `aria-pressed`: el lector anuncia la pregunta y cada
                        opción como «2 de 4», y cada grupo es una sola parada de
                        tabulador (dentro, con flechas). */}
                    <div
                      role="radiogroup"
                      aria-labelledby={idPregunta(qi)}
                      className="grid grid-cols-1 sm:grid-cols-2 gap-2"
                    >
                      {q.options.map((o, oi) => {
                        const activa = answers[qi] === oi;
                        /* Una parada de tabulador por grupo: la elegida, o la
                           primera si aún no hay ninguna. */
                        const enfocable = answers[qi] === null ? oi === 0 : activa;
                        return (
                          <button
                            key={oi}
                            type="button"
                            role="radio"
                            aria-checked={activa}
                            tabIndex={enfocable ? 0 : -1}
                            onClick={() => setAnswer(qi, oi)}
                            onKeyDown={(e) => moverConFlechas(e, oi, (d) => setAnswer(qi, d))}
                            className="text-left rounded-[4px] transition-[background-color,color] duration-200 hover:text-[var(--ink)]"
                            style={{
                              minHeight: 48,
                              padding: "12px 14px",
                              fontSize: 15,
                              lineHeight: 1.35,
                              cursor: "pointer",
                              color: activa ? "var(--bg)" : "var(--ink-2)",
                              background: activa ? "var(--ink)" : "transparent",
                              boxShadow: activa ? "none" : "inset 0 0 0 1px var(--ficha-filo)",
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

            {/* El avance no es automático al responder: permite cambiar de
                opinión sin retroceder. Por debajo de `sm` el contador ocupa su
                línea y los botones se reparten la de abajo; a 320 px no caben
                los tres en una línea y empujaban la página de lado. */}
            <div className="mt-8 flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
              <button
                type="button"
                onClick={() => irA(actual - 1)}
                disabled={actual === 0}
                className="order-2 inline-flex items-center gap-2 rounded-[4px] transition-colors duration-200 disabled:opacity-35 disabled:cursor-not-allowed sm:order-none"
                style={{ minHeight: 44, padding: "10px 16px", fontSize: 14, cursor: "pointer",
                         color: "var(--ink-2)", border: "1px solid transparent" }}
              >
                <span aria-hidden>←</span> {es ? "Anterior" : "Back"}
              </button>

              <span className="tnum order-1 w-full text-center sm:order-none sm:w-auto sm:text-left" style={{ fontSize: 13, color: "var(--ink-3)" }}>
                {es
                  ? `Pregunta ${actual + 1} de ${QUESTIONS.length}`
                  : `Question ${actual + 1} of ${QUESTIONS.length}`}
              </span>

              {actual < QUESTIONS.length - 1 ? (
                <button
                  type="button"
                  onClick={() => irA(actual + 1)}
                  /* Se puede seguir sin responder; el resultado avisa de las que faltan. */
                  className="cta cta--primario order-3 sm:order-none"
                >
                  {es ? "Siguiente" : "Next"} <span aria-hidden>→</span>
                </button>
              ) : (
                <button type="button" onClick={verResultado} className="cta cta--primario order-3 sm:order-none">
                  {es ? "Ver resultado" : "See result"} <span aria-hidden>→</span>
                </button>
              )}
            </div>

            {answeredCount > 0 && (
              <button
                type="button"
                onClick={reset}
                className="mt-5 inline-flex items-center gap-2 rounded-[4px]"
                style={{
                  minHeight: 44,
                  padding: "10px 18px",
                  fontSize: 14,
                  cursor: "pointer",
                  color: "var(--ink-2)",
                  background: "transparent",
                  border: "1px solid transparent",
                }}
              >
                {es ? "Empezar de nuevo" : "Start over"}
              </button>
            )}
          </div>

          {/* ── Resultado ────────────────────────────────────────────── */}
          <div className="lg:sticky lg:top-24">
            <ResultadoAnunciado
              texto={
                allAnswered && level && weakest
                  ? es
                    ? `${level.label}: ${fmtInt(score, lang)} de 100. ${sinPuntoFlaco ? "Sin punto flaco claro." : `Punto flaco: ${weakest.dim.es.toLowerCase()}.`}`
                    : `${level.label}: ${fmtInt(score, lang)} out of 100. ${sinPuntoFlaco ? "No clear weak spot." : `Weak spot: ${weakest.dim.en.toLowerCase()}.`}`
                  : ""
              }
            />
            <div ref={resultadoRef} tabIndex={-1} aria-labelledby={`${uid}-perfil`} className="tj-ficha scroll-mt-24 outline-none">
              <p className="tj-ficha-barra">
                <span id={`${uid}-perfil`}>{es ? "Tu perfil" : "Your profile"}</span>
                <span>{es ? "5 ejes" : "5 axes"}</span>
              </p>
              <div className="tj-ficha-cuerpo">

              {/* Cifra global */}
              <div className="flex items-end gap-3 mb-1">
                <span
                  className="tj-cifra"
                  style={{
                    color: level ? level.color : "var(--ink-3)",
                    transition: "color 0.25s ease",
                  }}
                >
                  {/* Sin respuestas no hay cifra: un «0» se leería como nota. */}
                  {answeredCount > 0 ? fmtInt(score, lang) : "—"}
                </span>
                <span className="tnum" style={{ fontSize: 15, color: "var(--ink-3)", paddingBottom: 4 }}>
                  / 100
                </span>
                {level && (
                  <span
                    className="tnum ml-auto pb-1"
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: level.color,
                    }}
                  >
                    {level.label}
                  </span>
                )}
              </div>
              <p className="m-0 mb-5" style={{ fontSize: 13, lineHeight: 1.6, color: "var(--ink-3)" }}>
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
                      <span style={{ fontSize: 13, color: "var(--ink-2)" }}>{es ? dim.es : dim.en}</span>
                      <span
                        className="tnum"
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: respondidas ? barColor(pct) : "var(--ink-3)",
                        }}
                      >
                        {respondidas ? `${pct}${pctSep(lang)}` : "—"}
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
                  <div className="border-t border-[var(--ficha-division)] pt-4">
                    <div className="tnum mb-2 text-[12px] font-medium text-tertiary">
                      {rotuloConsejo}
                    </div>
                    <p className="m-0 text-sm leading-relaxed text-secondary">
                      {consejo}
                    </p>
                    <div className="mt-3">
                      <BotonCopiar
                        texto={informe}
                        rotulo={es ? "Copiar diagnóstico completo" : "Copy full assessment"}
                        hecho={es ? "Diagnóstico copiado" : "Assessment copied"}
                      />
                    </div>
                  </div>
                </>
              ) : (
                <p className="m-0 text-xs leading-relaxed text-tertiary">
                  {es
                    ? `Responde las ${QUESTIONS.length} preguntas para ver tu perfil completo y por dónde empezar.`
                    : `Answer all ${QUESTIONS.length} questions to see your full profile and where to start.`}
                </p>
              )}

              </div>
              <p className="tj-ficha-barra tj-ficha-barra--pie">
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
