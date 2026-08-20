"use client";

import { useState } from "react";
import { useLang } from "@/lib/i18n";
import { Reveal } from "@/components/tj/Reveal";
import { ShieldCheck, AlertTriangle, HandMetal, Timer } from "lucide-react";

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
 *
 * `num` — ordinal del eyebrow. Por defecto el de la home ("05"); las
 * páginas internas pasan el suyo para mantener su propia secuencia.
 */

/** Riesgo que aporta cada contrato, en % de la cuenta. */
const RIESGO_POR_CONTRATO = 0.5;
/** Límite de riesgo por operación configurado en el ejemplo, en %. */
const LIMITE_RIESGO = 1;
const CONTRATOS_INICIALES = 4;
const CONTRATOS_AJUSTADOS = 2;

type EstadoGuardian = "bloqueado" | "ajustado" | "anulado";

export function GuardianNew({ num = "05" }: { num?: string }) {
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
  const pct = (n: number) =>
    `${n.toLocaleString(es ? "es-ES" : "en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}${es ? " %" : "%"}`;

  return (
    <section
      id="guardian"
      className="section bg-veil relative overflow-clip border-t border-[rgb(var(--divider)/0.06)] scroll-mt-24"
    >
      {/* P1 — contenedor unificado a `tj-container`: hereda los gutters
          fluidos (clamp(1.25rem, 4vw, 2.25rem)) y el page-w (1080px) de
          globals.css, sustituyendo al `max-w-[1240px] mx-auto px-5 md:px-8`
          hardcodeado. Paridad con StatsBandNew, MetricsShowcaseNew y Values. */}
      <div className="relative tj-container grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-12 items-center">
        {/* Mockup tarjeta "Comprobación previa"
            R20-3b / T2d — padding lateral y vertical escalado por
            breakpoint (p-5 20px · sm:p-6 24px · md:p-8 32px) para que la
            tarjeta respire en móvil y se sienta generosa en desktop.
            Antes era un `padding: 20` fijo en inline-style: en 390px eso
            dejaba ~247px de contenido útil dentro de la tarjeta y el
            texto se leía claustrofóbico. Moverlo a utility classes
            permite subir a 32px en desktop sin tocar móvil.
            P1 — envoltorio `motion.div` con `whileInView` para que la
            tarjeta entre en escena con el mismo gesto de soft-settle que
            el resto de la home, en vez de aparecer estática. */}
        <div
          data-entra
          // T3c — swap a `.tj-paper-dense`: contenido denso (fila de trade,
          // checklist de 3, aviso de bloqueo, 2 CTAs) necesita más opacidad
          // que el papel 72 % estándar para mantener WCAG AA. Sigue siendo
          // papel translúcido cálido (86 %) — el atlas sigue filtrándose por
          // los bordes. Estados rojo/verde (checklist + aviso bloqueo) se
          // conservan intactos: tienen sus propios fondos teñidos.
          className="tj-paper-dense relative rounded-[2px] p-5 sm:p-6 md:p-8"
          style={{
            border: "1px solid rgb(var(--divider) / 0.13)",
            // La sombra la pone el material, no esta línea. Aquí había un
            // `boxShadow` en NEGRO PURO al 22 %, y al ser inline ganaba
            // siempre: anulaba la sombra que `.tj-paper` define para el
            // tema claro, que va teñida con `--sombra` (19 29 38, el
            // grafito del material) y no con negro. En una chapa gris
            // clara el negro puro ensucia en vez de levantar, y esta es
            // la sección con más exposición del sitio — sale en la
            // portada y en /features/disciplina.
          }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <span
              className="tnum"
              style={{ fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--ink-3)" }}
            >
              {es ? "Comprobación previa · nueva operación" : "Pre-flight check · new trade"}
            </span>
            <span
              className="tnum inline-flex items-center gap-1.5 self-start sm:self-auto"
              style={{
                fontSize: 10,
                padding: "3px 9px",
                borderRadius: 4,
                background: "color-mix(in oklab, rgb(var(--accent-base)) 14%, transparent)",
                color: "rgb(var(--accent-base))",
                border: "1px solid color-mix(in oklab, rgb(var(--accent-base)) 30%, transparent)",
              }}
            >
              <span
                aria-hidden
                className="inline-block rounded-full"
                style={{
                  width: 5,
                  height: 5,
                  background: "rgb(var(--accent-base))",
                }}
              />
              {es ? "EN VIVO" : "LIVE"}
            </span>
          </div>
          {/* Fila del trade */}
          <div
            className="rounded-[2px] p-3 mb-4"
            style={{
              background: "color-mix(in oklab, var(--surface-2) 50%, transparent)",
              border: "1px solid rgb(var(--divider) / 0.06)",
            }}
          >
            <div className="flex items-center gap-3">
              <span
                className="tnum inline-block"
                style={{
                  padding: "4px 10px",
                  borderRadius: 4,
                  background: "color-mix(in oklab, rgb(var(--pnl-pos)) 14%, transparent)",
                  color: "rgb(var(--pnl-pos))",
                  fontSize: 11,
                  fontWeight: 700,
                }}
              >
                NQ · LONG
              </span>
              <span className="tnum" style={{ fontSize: 12, color: "var(--ink-2)" }}>
                {contratos} {es ? (contratos === 1 ? "contrato" : "contratos") : contratos === 1 ? "contract" : "contracts"}
              </span>
              <span className="tnum ml-auto" style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>28 {es ? "pts" : "pts"}</span>
            </div>
          </div>
          {/* Checklist — R20-3b: widened row spacing (space-y-2 → 2.5) +
              py-0.5 per row so each audit line breathes; added a faint
              inset divider tone via row padding to read as a true audit
              list rather than a stacked label.
              P1 — `space-y-2.5` (10 px) → `space-y-3` (12 px): las tres
              filas del checklist leen como auditoría sin apretarse, y el
              espacio separa mejor el sello ✓/✕ del texto cuando este
              envuelve a dos líneas en móvil estrecho. */}
          <div className="space-y-3 mb-4">
            {[
              { ok: true, l: es ? "Setup Apto: ruptura NY" : "Setup valid: NY break" },
              { ok: true, l: es ? "R:R ≥ 1,5" : "R:R ≥ 1.5" },
              {
                // El texto y el sello salen del cálculo, no de una
                // constante: el riesgo es el tamaño por el riesgo unitario,
                // y el veredicto, compararlo con el límite.
                ok: dentroDelLimite,
                l: dentroDelLimite
                  ? es
                    ? `Riesgo ${pct(riesgo)} — dentro de tu límite de ${pct(LIMITE_RIESGO)}`
                    : `Risk ${pct(riesgo)} — within your ${pct(LIMITE_RIESGO)} limit`
                  : es
                    ? `Riesgo ${pct(riesgo)} — supera tu límite de ${pct(LIMITE_RIESGO)}`
                    : `Risk ${pct(riesgo)} — over your ${pct(LIMITE_RIESGO)} limit`,
              },
            ].map((c, i) => (
              <div key={i} className="flex items-start gap-2.5 py-0.5">
                <span
                  className="inline-grid place-items-center rounded-[2px] flex-none mt-px"
                  style={{
                    width: 20,
                    height: 20,
                    background: c.ok
                      ? "color-mix(in oklab, rgb(var(--pnl-pos)) 18%, transparent)"
                      : "color-mix(in oklab, rgb(var(--pnl-neg)) 18%, transparent)",
                    color: c.ok ? "rgb(var(--pnl-pos))" : "rgb(var(--pnl-neg))",
                    // Sello del ✓/✕: borde sólido de 1px del color pnl
                    // correspondiente. Se retiró el anillo/glow por
                    // box-shadow (rule 2 — sin sombras de color); el borde
                    // real cumple la misma función de "sello".
                    border: `1px solid ${c.ok ? "rgb(var(--pnl-pos) / 0.45)" : "rgb(var(--pnl-neg) / 0.50)"}`,
                  }}
                >
                  <span style={{ fontSize: 11, fontWeight: 800, lineHeight: 1 }}>{c.ok ? "✓" : "✕"}</span>
                </span>
                <span style={{ fontSize: 13, lineHeight: 1.4, color: c.ok ? "var(--ink-2)" : "rgb(var(--pnl-neg))", fontWeight: c.ok ? 400 : 600 }}>{c.l}</span>
              </div>
            ))}
          </div>
          {/* Aviso bloqueo — R20-3b: 3px solid pnl-neg left rail (reads as
              a “blocked / hard stop” signal even on a quick glance),
              asymmetric horizontal padding (12px / 14px) so the rail
              breathes against the icon, plus a soft inset highlight so
              the box reads as a stamped alert rather than a flat tint.
              R24-1c: added an outer pnl-neg glow ring + AlertTriangle is
              now wrapped in a stamped circular container so the icon +
              the OPERACIÓN BLOQUEADA label read as a single stamped seal
              rather than a floating icon + text.
              T2d — padding lateral subido a 14px 16px 14px 18px (era
              12px 14px 12px 16px) para garantizar ≥16px de respiro
              horizontal entre el texto del aviso y el borde del box,
              cumpliendo el spec “el texto rojo no toca los bordes” en
              móviles estrechos (320px) donde antes se apretaba.
              P1 — padding subido a `16px 18px 16px 20px`: el spec pide
              ≥20 px de respiro en check-cards. El texto rojo del aviso
              de bloqueo ahora tiene 20 px de separación del rail izquierdo
              (era 18 px) y 18 px del borde derecho (era 16 px). El
              padding vertical pasa de 14 a 16 px para que la etiqueta
              SUPERIOR "OPERACIÓN BLOQUEADA" + el cuerpo de texto respiren
              sin pegarse a los bordes superior/inferior del box. */}
          {(() => {
            /* El aviso cambia con el estado, y se anuncia. `aria-live`
               es imprescindible aquí: al pulsar «Ajustar», lo que cambia
               está en OTRA parte de la tarjeta, así que sin anuncio un
               lector de pantalla no se entera de que la operación ha
               pasado de bloqueada a permitida. */
            const tono = estado === "anulado" ? "neutro" : dentroDelLimite ? "ok" : "mal";
            const color =
              tono === "ok"
                ? "rgb(var(--pnl-pos))"
                : tono === "mal"
                  ? "rgb(var(--pnl-neg))"
                  : "var(--ink-3)";
            const tinte =
              tono === "ok"
                ? "rgb(var(--pnl-pos))"
                : tono === "mal"
                  ? "rgb(var(--pnl-neg))"
                  : "rgb(var(--divider))";
            const titulo =
              tono === "neutro"
                ? es ? "Operación anulada" : "Trade cancelled"
                : tono === "ok"
                  ? es ? "Operación permitida" : "Trade allowed"
                  : es ? "Operación bloqueada" : "Trade blocked";
            const cuerpo =
              tono === "neutro"
                ? es
                  ? "No se ha registrado nada. El guardián no discute: si la anulas, se anula."
                  : "Nothing was recorded. The guardian does not argue: cancel it and it is cancelled."
                : tono === "ok"
                  ? es
                    ? `Con ${contratos} contratos el riesgo baja a ${pct(riesgo)}, justo en tu límite. Puedes abrirla.`
                    : `At ${contratos} contracts the risk drops to ${pct(riesgo)}, exactly at your limit. You can open it.`
                  : es
                    ? `Reduce el tamaño a ${CONTRATOS_AJUSTADOS} contratos para dejar el riesgo en ${pct(CONTRATOS_AJUSTADOS * RIESGO_POR_CONTRATO)}, dentro de tu límite.`
                    : `Reduce size to ${CONTRATOS_AJUSTADOS} contracts to bring risk to ${pct(CONTRATOS_AJUSTADOS * RIESGO_POR_CONTRATO)}, within your limit.`;
            return (
              <div
                role="status"
                aria-live="polite"
                className="rounded-[2px] mb-3 relative overflow-hidden"
                style={{
                  padding: "16px 18px 16px 20px",
                  background: `color-mix(in oklab, ${tinte} 10%, transparent)`,
                  border: `1px solid color-mix(in oklab, ${tinte} 28%, transparent)`,
                  boxShadow: "inset 0 1px 0 rgb(255 255 255 / 0.06)",
                }}
              >
                <span
                  aria-hidden
                  className="absolute left-0 top-0 bottom-0"
                  style={{ width: 3, background: tinte }}
                />
                <div className="flex items-center gap-2 mb-1">
                  <span
                    aria-hidden
                    className="inline-grid place-items-center rounded-[2px]"
                    style={{
                      width: 20,
                      height: 20,
                      background: `color-mix(in oklab, ${tinte} 18%, transparent)`,
                      color,
                      border: `1px solid color-mix(in oklab, ${tinte} 45%, transparent)`,
                    }}
                  >
                    {tono === "ok" ? (
                      <ShieldCheck size={12} strokeWidth={2.4} style={{ color }} />
                    ) : (
                      <AlertTriangle size={12} strokeWidth={2.4} style={{ color }} />
                    )}
                  </span>
                  <span
                    className="tnum"
                    style={{ fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color, fontWeight: 700 }}
                  >
                    {titulo}
                  </span>
                </div>
                <p className="m-0" style={{ fontSize: 12, lineHeight: 1.5, color: "var(--ink-2)" }}>
                  {cuerpo}
                </p>
              </div>
            );
          })()}
          {/* R21-3b: action buttons stack vertically on mobile (flex-col sm:flex-row)
              so the longest label "Ajustar a 2 contratos" / "Adjust to 2 contracts"
              (≈147px at 12px/600) fits without overflowing the ≈115px inner half-width
              on a 375px viewport. At sm+ the buttons resume their side-by-side layout.
              T2d — `height: 36` en inline-style era silenciado por `flex-1` (que
              expande `flex-basis: 0%`, cuyo valor NO-auto ignora la propiedad
              `height` en el eje principal del flex container). Resultado: los
              botones se renderizaban a 20px de alto (la altura del texto), muy
              por debajo del umbral táctil de 44px. Reemplazado por `min-h-[44px]`
              (que SÍ se respeta independientemente de flex-basis) + `px-4` para
              más respiro horizontal. Es un fix de accesibilidad real, no
              cosmético: los dos botones del mockup son los únicos CTAs visibles
              de la sección y deben ser tocables con el pulgar en móvil.
              P1 — `min-h-[44px]` → `min-h-[48px]`: subimos 4 px el umbral táctil
              de los dos botones del mockup para reforzar la lectura "tocable".
              + `transition-[background-color,border-color,transform]` con la
              curva var(--ease-suave) del sistema, `hover:-translate-y-0.5`
              y `focus-visible:ring` con acento, alineando el lenguaje de
              interacción con los CTAs del Hero y de FinalCTANew. */}
          {/* Los botones cambian con el estado y HACEN lo que dicen. */}
          <div className="flex flex-col sm:flex-row gap-2.5">
            {estado === "bloqueado" ? (
              <>
                <button
                  type="button"
                  onClick={() => setEstado("ajustado")}
                  className="tnum flex-1 min-w-0 min-h-[48px] px-4 inline-flex items-center justify-center outline-none transition-[background-color,border-color,transform] duration-200 ease-[var(--ease-suave)] hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-[rgb(var(--accent-base)/0.55)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)] active:translate-y-0"
                  style={{
                    borderRadius: 4,
                    background: "color-mix(in oklab, rgb(var(--accent-base)) 14%, transparent)",
                    color: "rgb(var(--accent-base))",
                    border: "1px solid color-mix(in oklab, rgb(var(--accent-base)) 35%, transparent)",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  {es
                    ? `Ajustar a ${CONTRATOS_AJUSTADOS} contratos`
                    : `Adjust to ${CONTRATOS_AJUSTADOS} contracts`}
                </button>
                <button
                  type="button"
                  onClick={() => setEstado("anulado")}
                  className="tnum flex-1 min-w-0 min-h-[48px] px-4 inline-flex items-center justify-center outline-none transition-[background-color,border-color,transform] duration-200 ease-[var(--ease-suave)] hover:-translate-y-0.5 hover:bg-[color-mix(in_srgb,var(--ink)_4%,transparent)] focus-visible:ring-2 focus-visible:ring-[rgb(var(--accent-base)/0.55)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)] active:translate-y-0"
                  style={{
                    borderRadius: 4,
                    background: "transparent",
                    color: "var(--ink-2)",
                    border: "1px solid rgb(var(--divider) / 0.13)",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  {es ? "Anular" : "Cancel"}
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setEstado("bloqueado")}
                className="tnum flex-1 min-w-0 min-h-[48px] px-4 inline-flex items-center justify-center outline-none transition-[background-color,border-color,transform] duration-200 ease-[var(--ease-suave)] hover:-translate-y-0.5 hover:bg-[color-mix(in_srgb,var(--ink)_4%,transparent)] focus-visible:ring-2 focus-visible:ring-[rgb(var(--accent-base)/0.55)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)] active:translate-y-0"
                style={{
                  borderRadius: 4,
                  background: "transparent",
                  color: "var(--ink-2)",
                  border: "1px solid rgb(var(--divider) / 0.13)",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {es ? "Volver al estado inicial" : "Back to the initial state"}
              </button>
            )}
          </div>
        </div>

        {/* Columna derecha: copy + 3 features
            P1 — envoltorios Reveal con stagger (0, 0.06, 0.12, 0.18) para
            que la columna derecha entre en escena coordinada con la
            tarjeta mockup de la izquierda (que tiene su propio motion.div).
            Antes la columna aparecía estática mientras la tarjeta izquierda
            no animaba; ahora las dos mitades se asientan a la par. */}
        <div>
          <Reveal>
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
                {es ? "DISCIPLINA" : "DISCIPLINE"}
              </span>
            </div>
          </Reveal>
          <Reveal delay={0.06}>
            <h2
              className="font-serif m-0"
              style={{
                fontSize: "clamp(1.75rem, 3.6vw, 3rem)",
                fontWeight: 400,
                letterSpacing: "-0.022em",
                lineHeight: 1.08,
                color: "var(--ink)",
                textWrap: "balance",
              }}
            >
              {es ? (
                <>
                  Disciplina que <span style={{ color: "rgb(var(--accent-base))" }}>actúa</span>,
                  <br className="hidden sm:block" />
                  {" "}no que sermonea.
                </>
              ) : (
                <>
                  Discipline that <span style={{ color: "rgb(var(--accent-base))" }}>acts</span>,
                  <br className="hidden sm:block" />
                  {" "}not lectures.
                </>
              )}
            </h2>
          </Reveal>
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
                ? "El Guardián no te dice qué hacer. Te bloquea cuando rompes tus propias reglas."
                : "The Guardian doesn't tell you what to do. It blocks you when you break your own rules."}
            </p>
          </Reveal>
          {/* T2d — `space-y-5` (20px) entre features (era `space-y-4` 16px):
              el incremento refuerza la legibilidad móvil sin abrir un
              hueco tipográfico; a desktop el Δ es apenas perceptible.
              + `leading-[1.6]` en la descripción para parity con Values
              y con el spec de legibilidad de la home.
              P1 — envoltorio Reveal delay 0.18 para que las 3 features
              entren como bloque coordinado tras el titular. */}
          <Reveal delay={0.18}>
          <ul className="m-0 p-0 list-none space-y-5">
            {[
              { i: ShieldCheck, t: es ? "Frena antes del error" : "Brakes before the error", d: es ? "Bloquea tamaños que excedan tu riesgo máximo por operación." : "Blocks sizes that exceed your max per-trade risk." },
              { i: HandMetal, t: es ? "Te obliga a respetar el plan" : "Forces you to respect the plan", d: es ? "Límites de drawdown diario y total configurables." : "Daily and total drawdown limits configurable." },
              /* Decía «Cada override queda registrado» justo debajo de un
                 titular que a eso mismo ya lo llama EXCEPCIÓN: dos
                 nombres para la misma cosa dentro del mismo renglón, y
                 uno en inglés en mitad de una frase en español. */
              { i: Timer, t: es ? "Audita tus excepciones" : "Audits your exceptions", d: es ? "Cada excepción queda registrada con su motivo y su resultado." : "Every exception is logged with its reason and its outcome." },
            ].map((f) => {
              const Icon = f.i;
              return (
                <li key={f.t} className="flex items-start gap-3">
                  <span
                    className="w-10 h-10 rounded-lg bg-[rgb(var(--accent-base)/0.06)] border border-[rgb(var(--accent-base)/0.15)] shadow-[inset_0_1px_0_rgb(var(--divider)/0.08)] flex-none inline-grid place-items-center text-[rgb(var(--accent-base))]"
                  >
                    <Icon size={18} aria-hidden />
                  </span>
                  <div>
                    <h3 className="m-0" style={{ fontSize: 15, fontWeight: 600, color: "var(--ink)" }}>{f.t}</h3>
                    <p className="m-0 mt-1" style={{ fontSize: 13.5, lineHeight: 1.6, color: "var(--ink-2)" }}>{f.d}</p>
                  </div>
                </li>
              );
            })}
          </ul>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
