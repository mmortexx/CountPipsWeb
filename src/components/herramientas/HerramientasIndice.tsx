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
 * que una parrilla de recuadros con el mismo gesto.
 */

export function HerramientasIndice() {
  const { lang } = useLang();
  const es = lang === "es";

  return (
    <section className="section-tight">
      <div className="tj-container">
        <div className="border-t border-[var(--line)]">
          <div
            className="hidden items-center gap-4 border-b border-[var(--line)] py-2.5 sm:grid sm:grid-cols-[4.5rem_minmax(0,1.4fr)_minmax(0,1fr)_4.5rem]"
            aria-hidden
          >
            <span className="tnum text-[12px] font-semibold text-tertiary">
              {es ? "Cód." : "Code"}
            </span>
            <span className="tnum text-[12px] font-semibold text-tertiary">
              {es ? "Instrumento" : "Instrument"}
            </span>
            <span className="tnum text-[12px] font-semibold text-tertiary">
              {es ? "Resultado" : "Output"}
            </span>
            {/* La cuarta columna no lleva rótulo: decía «Abrir» encima de
                nueve celdas que ya dicen «Abrir →». */}
            <span />
          </div>

          <ul className="m-0 list-none p-0">
            {HERRAMIENTAS.map((h, i) => {
              const codigo = `H-${String(i + 1).padStart(2, "0")}`;
              return (
                <li key={h.slug} className="border-b border-[var(--line)]">
                  <Reveal delay={i * 0.03}>
                    <Link
                      href={`/herramientas/${h.slug}`}
                      className="group grid min-h-[72px] grid-cols-1 items-center gap-1 py-4 transition-colors duration-150 hover:bg-[color-mix(in_srgb,var(--ink)_4%,transparent)] focus-visible:bg-[color-mix(in_srgb,var(--ink)_4%,transparent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[rgb(var(--accent-base)/0.55)] sm:min-h-[64px] sm:grid-cols-[4.5rem_minmax(0,1.4fr)_minmax(0,1fr)_4.5rem] sm:gap-4 sm:py-0"
                    >
                      <span
                        className="tnum text-[13px] font-semibold tracking-wide"
                        style={{ color: "rgb(var(--accent-base))" }}
                      >
                        {codigo}
                      </span>
                      <span className="min-w-0">
                        <span className="block text-[15.5px] font-semibold tracking-tight text-primary">
                          {es ? h.tituloEs : h.tituloEn}
                        </span>
                        <span className="mt-0.5 block text-[14px] leading-[1.45] text-secondary">
                          {es ? h.resumenEs : h.resumenEn}
                        </span>
                      </span>
                      <span className="tnum hidden text-[13px] text-tertiary sm:block">
                        {es ? h.entregaEs : h.entregaEn}
                      </span>
                      <span
                        aria-hidden
                        className="mt-1 text-[13px] font-medium sm:mt-0 sm:justify-self-end"
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
                  className="group grid min-h-[72px] grid-cols-1 items-center gap-1 py-4 transition-colors duration-150 hover:bg-[color-mix(in_srgb,var(--ink)_4%,transparent)] focus-visible:bg-[color-mix(in_srgb,var(--ink)_4%,transparent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[rgb(var(--accent-base)/0.55)] sm:min-h-[64px] sm:grid-cols-[4.5rem_minmax(0,1.4fr)_minmax(0,1fr)_4.5rem] sm:gap-4 sm:py-0"
                >
                  <span
                    className="tnum text-[13px] font-semibold tracking-wide"
                    style={{ color: "rgb(var(--accent-base))" }}
                  >
                    T-01
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[15.5px] font-semibold tracking-tight text-primary">
                      {es ? "Test de disciplina" : "Discipline test"}
                    </span>
                    <span className="mt-0.5 block text-[14px] leading-[1.45] text-secondary">
                      {es
                        ? "Quince preguntas sobre lo que haces cuando el mercado va en contra."
                        : "Fifteen questions about what you do when the market turns against you."}
                    </span>
                  </span>
                  <span className="tnum hidden text-[13px] text-tertiary sm:block">
                    {es ? "Perfil en 5 ejes" : "5-axis profile"}
                  </span>
                  <span
                    aria-hidden
                    className="mt-1 text-[13px] font-medium sm:mt-0 sm:justify-self-end"
                    style={{ color: "rgb(var(--accent-base))" }}
                  >
                    {es ? "Abrir →" : "Open →"}
                  </span>
                </Link>
              </Reveal>
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}
