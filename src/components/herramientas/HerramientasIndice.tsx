"use client";

import { Link } from "@/components/tj/LocaleLink";
import { useLang } from "@/lib/i18n";
import { Reveal } from "@/components/tj/Reveal";
import { HERRAMIENTAS } from "@/lib/herramientas";

/**
 * El índice de herramientas se lee como un catálogo de instrumentos,
 * no como una parrilla de tarjetas. Cada fila es una pieza con código
 * de catálogo, nombre, qué entrega y un disparador. Quien llega aquí
 * busca una calculadora concreta: la lista densa se recorre más rápido
 * que ocho recuadros con el mismo gesto.
 */

const ENTREGA: Record<string, { es: string; en: string }> = {
  "calculadora-de-riesgo": { es: "Lotes · contratos", en: "Lots · contracts" },
  "significancia-estadistica": { es: "Ventaja vs azar", en: "Edge vs chance" },
  "monte-carlo": { es: "Abanico de curvas", en: "Curve fan" },
  "proyector-de-capital": { es: "Curva a N años", en: "N-year curve" },
  "coste-de-indisciplina": { es: "Fuga anual", en: "Annual leak" },
  "reloj-de-sesiones": { es: "Sesión · solape", en: "Session · overlap" },
  "ahorro-vs-suscripcion": { es: "Escenario de coste", en: "Cost scenario" },
  "impacto-de-comisiones": { es: "Break-even real", en: "True break-even" },
};

export function HerramientasIndice() {
  const { lang } = useLang();
  const es = lang === "es";

  return (
    <section className="section-tight">
      <div className="tj-container">
        <div className="tj-paper tj-paper-dense overflow-hidden rounded-[2px] border border-[rgb(var(--divider)/0.13)]">
          <div
            className="hidden items-center gap-4 border-b border-[rgb(var(--divider)/0.10)] px-5 py-2.5 sm:grid sm:grid-cols-[4.5rem_minmax(0,1.4fr)_minmax(0,1fr)_auto]"
            aria-hidden
          >
            <span className="tnum text-[10.5px] font-semibold uppercase tracking-[0.16em] text-tertiary">
              {es ? "Cód." : "Code"}
            </span>
            <span className="tnum text-[10.5px] font-semibold uppercase tracking-[0.16em] text-tertiary">
              {es ? "Instrumento" : "Instrument"}
            </span>
            <span className="tnum text-[10.5px] font-semibold uppercase tracking-[0.16em] text-tertiary">
              {es ? "Entrega" : "Output"}
            </span>
            <span className="tnum text-[10.5px] font-semibold uppercase tracking-[0.16em] text-tertiary">
              {es ? "Abrir" : "Open"}
            </span>
          </div>

          <ul className="m-0 list-none p-0">
            {HERRAMIENTAS.map((h, i) => {
              const codigo = `H-${String(i + 1).padStart(2, "0")}`;
              const entrega = ENTREGA[h.slug];
              return (
                <li key={h.slug} className="border-b border-[rgb(var(--divider)/0.08)] last:border-b-0">
                  <Reveal delay={i * 0.03}>
                    <Link
                      href={`/herramientas/${h.slug}`}
                      className="group grid min-h-[72px] grid-cols-1 items-center gap-1 px-5 py-4 transition-colors duration-150 hover:bg-[color-mix(in_srgb,var(--ink)_4%,transparent)] focus-visible:bg-[color-mix(in_srgb,var(--ink)_4%,transparent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[rgb(var(--accent-base)/0.55)] sm:min-h-[64px] sm:grid-cols-[4.5rem_minmax(0,1.4fr)_minmax(0,1fr)_auto] sm:gap-4 sm:py-0"
                    >
                      <span
                        className="tnum text-[11.5px] font-semibold tracking-wide"
                        style={{ color: "rgb(var(--accent-base))" }}
                      >
                        {codigo}
                      </span>
                      <span className="min-w-0">
                        <span className="block text-[15.5px] font-semibold tracking-tight text-primary">
                          {es ? h.tituloEs : h.tituloEn}
                        </span>
                        <span className="mt-0.5 block text-[13px] leading-[1.45] text-secondary">
                          {es ? h.resumenEs : h.resumenEn}
                        </span>
                      </span>
                      <span className="tnum hidden text-[12.5px] text-tertiary sm:block">
                        {es ? entrega?.es : entrega?.en}
                      </span>
                      <span
                        aria-hidden
                        className="mt-1 text-[12.5px] font-medium sm:mt-0 sm:justify-self-end"
                        style={{ color: "rgb(var(--accent-base))" }}
                      >
                        {es ? "Abrir →" : "Open →"}
                      </span>
                    </Link>
                  </Reveal>
                </li>
              );
            })}

            <li>
              <Reveal delay={HERRAMIENTAS.length * 0.03}>
                <Link
                  href="/test"
                  className="group grid min-h-[72px] grid-cols-1 items-center gap-1 px-5 py-4 transition-colors duration-150 hover:bg-[color-mix(in_srgb,var(--ink)_4%,transparent)] focus-visible:bg-[color-mix(in_srgb,var(--ink)_4%,transparent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[rgb(var(--accent-base)/0.55)] sm:min-h-[64px] sm:grid-cols-[4.5rem_minmax(0,1.4fr)_minmax(0,1fr)_auto] sm:gap-4 sm:py-0"
                >
                  <span
                    className="tnum text-[11.5px] font-semibold tracking-wide"
                    style={{ color: "rgb(var(--accent-base))" }}
                  >
                    T-01
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[15.5px] font-semibold tracking-tight text-primary">
                      {es ? "Test de disciplina" : "Discipline test"}
                    </span>
                    <span className="mt-0.5 block text-[13px] leading-[1.45] text-secondary">
                      {es
                        ? "Quince preguntas sobre lo que haces cuando el mercado va en contra."
                        : "Fifteen questions about what you do when the market turns against you."}
                    </span>
                  </span>
                  <span className="tnum hidden text-[12.5px] text-tertiary sm:block">
                    {es ? "Perfil en 5 ejes" : "5-axis profile"}
                  </span>
                  <span
                    aria-hidden
                    className="mt-1 text-[12.5px] font-medium sm:mt-0 sm:justify-self-end"
                    style={{ color: "rgb(var(--accent-base))" }}
                  >
                    {es ? "Abrir →" : "Open →"}
                  </span>
                </Link>
              </Reveal>
            </li>
          </ul>
        </div>

        <Reveal delay={0.3}>
          {/* ── EL ARGUMENTO DE PRIVACIDAD NO ES UN PIE DE PÁGINA ──────
              Esta línea dice lo que más distingue al producto —que las
              ocho herramientas no mandan nada a ningún sitio— y estaba
              puesta como una nota al pie: `text-tertiary`, el color más
              apagado del sistema, a 13,5 px, centrada y justo sobre la
              zona más densa del grabado. Era, literalmente, el texto
              menos legible de la página, y el que más peso comercial
              tiene.

              Se apoya en papel, que es el recurso que este sitio usa
              cuando un texto tiene que ganarle al fondo, sube a tinta
              secundaria y se le pone delante su sello. Así se lee como
              lo que es: una garantía firmada al cierre de la sección, no
              un descargo de responsabilidad. */}
          <div className="tj-paper mx-auto mt-12 flex max-w-[46rem] flex-col items-center gap-3 rounded-[2px] border border-[rgb(var(--divider)/0.13)] px-6 py-4 sm:flex-row sm:gap-5 sm:py-3.5">
            <span
              className="shrink-0 font-mono text-[10px] uppercase"
              style={{ letterSpacing: "0.16em", color: "rgb(var(--sig-green))" }}
            >
              {es ? "Sin servidor" : "No server"}
            </span>
            <span
              aria-hidden
              className="hidden h-4 w-px shrink-0 sm:block"
              style={{ background: "rgb(var(--divider) / 0.22)" }}
            />
            <p className="m-0 text-center text-[13.5px] leading-relaxed text-secondary sm:text-left">
              {es
                ? "Todas funcionan en tu navegador. No se envía nada a ningún servidor, no piden correo y no hay registro."
                : "They all run in your browser. Nothing is sent to any server, no email is asked for and there is no sign-up."}
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
