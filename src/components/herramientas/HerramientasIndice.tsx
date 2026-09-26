"use client";

import { Link } from "@/components/tj/LocaleLink";
import { useLang } from "@/lib/i18n";
import { Reveal } from "@/components/tj/Reveal";
import { HERRAMIENTAS } from "@/lib/herramientas";

/**
 * El índice de herramientas se lee como un catálogo de instrumentos,
 * no como una parrilla de tarjetas: nombre, qué entrega y un disparador.
 * Quien llega aquí busca una calculadora concreta, y la lista densa se
 * recorre más rápido que una parrilla de recuadros.
 *
 * Sin código de catálogo («H-01»…): numeraba un orden que no existe, y
 * era la columna que más pesaba de la fila sin decir nada.
 */

const COLUMNAS = "sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_4.5rem]";

export function HerramientasIndice() {
  const { lang } = useLang();
  const es = lang === "es";

  const filas = [
    ...HERRAMIENTAS.map((h) => ({
      href: `/herramientas/${h.slug}`,
      titulo: es ? h.tituloEs : h.tituloEn,
      resumen: es ? h.resumenEs : h.resumenEn,
      entrega: es ? h.entregaEs : h.entregaEn,
    })),
    {
      href: "/test",
      titulo: es ? "Test de disciplina" : "Discipline test",
      resumen: es
        ? "Quince preguntas sobre lo que haces cuando el mercado va en contra."
        : "Fifteen questions about what you do when the market turns against you.",
      entrega: es ? "Perfil en 5 ejes" : "5-axis profile",
    },
  ];

  return (
    <section className="section-tight">
      <div className="tj-container">
        <div className="border-t border-[var(--line)]">
          <div
            className={`hidden items-center gap-4 border-b border-[var(--line)] py-2.5 sm:grid ${COLUMNAS}`}
            aria-hidden
          >
            <span className="text-[12px] font-medium text-tertiary">
              {es ? "Instrumento" : "Instrument"}
            </span>
            <span className="text-[12px] font-medium text-tertiary">
              {es ? "Resultado" : "Output"}
            </span>
            {/* La tercera columna no lleva rótulo: decía «Abrir» encima de
                celdas que ya dicen «Abrir →». */}
            <span />
          </div>

          <ul className="m-0 list-none p-0">
            {filas.map((f, i) => (
              <li key={f.href} className="border-b border-[var(--line)] last:border-b-0">
                <Reveal delay={i * 0.03}>
                  <Link
                    href={f.href}
                    className={`group grid min-h-[72px] grid-cols-1 items-center gap-1 py-4 transition-colors duration-150 hover:bg-[color-mix(in_srgb,var(--ink)_4%,transparent)] focus-visible:bg-[color-mix(in_srgb,var(--ink)_4%,transparent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[rgb(var(--accent-base)/0.55)] sm:min-h-[64px] sm:gap-4 sm:py-2.5 ${COLUMNAS}`}
                  >
                    <span className="min-w-0">
                      <span className="block text-[15.5px] font-semibold tracking-tight text-primary">
                        {f.titulo}
                      </span>
                      <span className="mt-0.5 block text-[14px] leading-[1.45] text-secondary">
                        {f.resumen}
                      </span>
                    </span>
                    <span className="tnum hidden text-[13px] text-tertiary sm:block">
                      {f.entrega}
                    </span>
                    <span
                      aria-hidden
                      className="mt-1 text-[13px] font-medium text-primary sm:mt-0 sm:justify-self-end"
                    >
                      {es ? "Abrir →" : "Open →"}
                    </span>
                  </Link>
                </Reveal>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
