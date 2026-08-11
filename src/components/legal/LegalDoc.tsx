"use client";

import { useLang } from "@/lib/i18n";
import { Reveal } from "@/components/tj/Reveal";
import type { Bloque, DocumentoLegal } from "@/lib/legal/documentos";
import { LEGAL_ACTUALIZADO } from "@/lib/legal/documentos";
import { titularIncompleto } from "@/lib/legal/titular";

/**
 * LegalDoc — el cuerpo de las cuatro páginas legales.
 *
 * Un solo componente para los cuatro documentos: son la misma estructura
 * —secciones numeradas con párrafos, listas y alguna tabla— y mantener
 * cuatro maquetaciones paralelas sería garantizar que se separen.
 *
 * ── Decisiones de lectura ─────────────────────────────────────────────
 * · Ancho de línea limitado a ~68 caracteres. Un texto legal a todo lo
 *   ancho de una pantalla de escritorio no se lee: el ojo pierde el
 *   renglón al volver. Es la única razón del `max-w`.
 * · Cada sección lleva su ancla propia, para poder enlazar una cláusula
 *   concreta desde un correo o desde el aviso de cookies.
 * · El índice va arriba y no en una columna lateral fija: en móvil una
 *   columna lateral se convierte en un bloque enorme antes del contenido,
 *   y estos documentos ya son largos de por sí.
 *
 * ── El aviso de borrador ──────────────────────────────────────────────
 * Sale mientras falten los datos fiscales del titular. No es decorativo:
 * mientras esté ahí, estos textos sirven para una web informativa pero no
 * para vender. Desaparece solo en cuanto se rellenen los campos de
 * `src/lib/legal/titular.ts` — nadie tiene que acordarse de quitarlo.
 */
export function LegalDoc({ doc }: { doc: DocumentoLegal }) {
  const { lang } = useLang();
  const es = lang === "es";

  /* `timeZone: "UTC"` no es un detalle: `LEGAL_ACTUALIZADO` es una fecha
     sin hora, y el navegador la interpreta como medianoche UTC. Sin
     fijarlo, cualquier visitante al oeste de Greenwich —toda América—
     leía el día ANTERIOR en la fecha de un documento legal. Y como el
     servidor que compila sí está en UTC, el texto servido y el pintado no
     coincidían: un desajuste de hidratación además de una fecha falsa. */
  const fecha = new Date(LEGAL_ACTUALIZADO).toLocaleDateString(
    es ? "es-ES" : "en-GB",
    { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" },
  );

  return (
    <section className="section-tight">
      <div className="tj-container">
        <div className="mx-auto w-full max-w-[68ch]">
          {/* Entradilla — lo que hay que saber sin leer el documento. */}
          <Reveal>
            <p className="m-0 text-[17px] leading-relaxed text-secondary">
              {es ? doc.entradaEs : doc.entradaEn}
            </p>
            <p className="mt-4 text-[13px] text-tertiary">
              {es ? "Última revisión: " : "Last reviewed: "}
              <time dateTime={LEGAL_ACTUALIZADO}>{fecha}</time>
            </p>
          </Reveal>

          {titularIncompleto && (
            <Reveal delay={0.05}>
              <div
                className="mt-6 rounded-[2px] border p-4"
                style={{
                  borderColor: "rgb(var(--sig-amber) / 0.35)",
                  background: "color-mix(in oklab, rgb(var(--sig-amber)) 8%, transparent)",
                }}
              >
                <p className="m-0 text-[13.5px] leading-relaxed text-secondary">
                  <strong className="text-primary">
                    {es ? "Documento en preparación. " : "Draft document. "}
                  </strong>
                  {es
                    ? "Faltan los datos fiscales del titular, que la ley exige en cuanto haya venta. Hasta entonces este texto describe con exactitud cómo funciona la web, pero no sustituye a la revisión de un profesional."
                    : "The owner's tax details are missing; the law requires them as soon as sales begin. Until then this text describes accurately how the site works, but it does not replace review by a professional."}
                </p>
              </div>
            </Reveal>
          )}

          {/* Índice */}
          <Reveal delay={0.1}>
            <nav
              aria-label={es ? "Índice del documento" : "Document contents"}
              className="mt-10 rounded-[2px] border p-5"
              style={{ borderColor: "rgb(var(--divider) / 0.12)" }}
            >
              <p className="eyebrow m-0">{es ? "Contenido" : "Contents"}</p>
              <ol className="mt-1 m-0 flex list-none flex-col p-0">
                {doc.secciones.map((s, i) => (
                  /* `min-h-[44px]` en el enlace, no en el `<li>`: son doce
                     entradas en la más larga de las cuatro páginas, y
                     medían 21 px de alto. */
                  <li key={s.id}>
                    <a
                      href={`#${s.id}`}
                      className="link-underline-host flex min-h-[44px] items-center gap-2.5 text-[14px] text-secondary transition-colors hover:text-primary"
                    >
                      <span
                        className="tnum shrink-0 text-[12px] font-semibold"
                        style={{ color: "rgb(var(--accent-base))" }}
                      >
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className="link-underline">
                        {es ? s.tituloEs : s.tituloEn}
                      </span>
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
          </Reveal>

          {/* Secciones */}
          <div className="mt-12 flex flex-col gap-11">
            {doc.secciones.map((s, i) => (
              <section key={s.id} id={s.id} className="scroll-mt-28">
                <h2 className="m-0 flex items-baseline gap-3 text-[20px] font-semibold tracking-tight text-primary">
                  <span
                    className="tnum text-[12px] font-semibold"
                    style={{ color: "rgb(var(--accent-base))" }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  {es ? s.tituloEs : s.tituloEn}
                </h2>
                <div className="mt-4 flex flex-col gap-4">
                  {s.bloques.map((b, j) => (
                    <BloqueLegal key={j} bloque={b} es={es} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function BloqueLegal({ bloque, es }: { bloque: Bloque; es: boolean }) {
  if (bloque.tipo === "parrafo") {
    return (
      <p className="m-0 text-[15px] leading-[1.7] text-secondary">
        {es ? bloque.es : bloque.en}
      </p>
    );
  }

  if (bloque.tipo === "lista") {
    const items = es ? bloque.es : bloque.en;
    return (
      <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
        {items.map((t, i) => (
          <li key={i} className="flex gap-3 text-[15px] leading-[1.7] text-secondary">
            {/* El punto va como elemento propio y no como viñeta del
                navegador: así se alinea con la primera línea del texto y
                no se descuelga cuando el elemento ocupa varias líneas. */}
            <span
              aria-hidden
              className="mt-[0.62em] h-1 w-1 shrink-0 rounded-full"
              style={{ background: "rgb(var(--accent-base))" }}
            />
            <span>{t}</span>
          </li>
        ))}
      </ul>
    );
  }

  const cabeceras = es ? bloque.cabecerasEs : bloque.cabecerasEn;
  return (
    /* La tabla se desplaza dentro de su propia caja. Una tabla de tres
       columnas con frases dentro no cabe en 376 px, y sin este envoltorio
       la que se desplazaría sería la página entera. */
    <div className="-mx-1 overflow-x-auto px-1">
      <table className="w-full min-w-[34rem] border-collapse text-left text-[14px]">
        <thead>
          <tr>
            {cabeceras.map((c) => (
              <th
                key={c}
                scope="col"
                className="border-b px-3 py-2.5 align-bottom text-[11px] font-semibold uppercase tracking-[0.1em] text-tertiary"
                style={{ borderColor: "rgb(var(--divider) / 0.16)" }}
              >
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {bloque.filas.map((f, i) => {
            const celdas = es ? f.es : f.en;
            return (
              <tr key={i}>
                {celdas.map((c, j) => (
                  <td
                    key={j}
                    className="border-b px-3 py-3 align-top leading-[1.6] text-secondary"
                    style={{ borderColor: "rgb(var(--divider) / 0.08)" }}
                  >
                    {c}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
