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
 * · Ancho de línea limitado por la clase `.medida`, en cada bloque de
 *   texto. Un texto legal a todo lo ancho de una pantalla de escritorio no
 *   se lee: el ojo pierde el renglón al volver. Aquí llegó a componer 115
 *   caracteres por línea, medidos, con un `max-w-[68ch]` puesto en el
 *   contenedor que no medía lo que su nombre decía — ver la nota de abajo
 *   y la larga de `globals.css`.
 * · Cada sección lleva su ancla propia, para poder enlazar una cláusula
 *   concreta desde un correo o desde el aviso de cookies.
 * · El índice va a un raíl lateral SÓLO desde `lg`. En móvil una columna
 *   lateral se convierte en un bloque enorme antes del contenido, y estos
 *   documentos ya son largos de por sí, así que ahí sigue arriba; en
 *   escritorio, donde sobraba media pantalla a la derecha, acompaña al
 *   desplazamiento y sirve para saltar de cláusula a cláusula.
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
    <section
      className="section-tight"
    >
      <div className="tj-container">
        {/* A 1.440 px el documento entero quedaba pegado al margen izquierdo
            y la mitad derecha de la página en blanco. Desde `lg` el índice
            se va a un raíl que acompaña al desplazamiento —así sirve para
            lo que existe, saltar de cláusula a cláusula en un texto largo—
            y el cuerpo conserva su medida. Por debajo de `lg` no cambia
            nada: el índice sigue arriba, entre la entradilla y la primera
            sección.

            ⚠ AQUÍ HABÍA UN `68ch` Y NO MEDÍA 68 CARACTERES. `ch` se
            resuelve con la tipografía del elemento que lo escribe, y el
            elemento era este `div`, que hereda el tamaño base del sitio: 68
            de sus caracteres daban 110 de los del párrafo de 15 px que
            lleva dentro. La medida de verdad la pone ahora `.medida` en
            cada bloque de texto; estas columnas sólo reparten el ancho
            entre cuerpo e índice, y por eso van en `rem`, que no depende de
            la tipografía. `justify-between` las separa a los dos extremos:
            con el cuerpo ya en su medida, sin esto quedaba un vacío grande
            entre el texto y el índice en lugar de márgenes. */}
        <div className="lg:grid lg:grid-cols-[minmax(0,44rem)_minmax(0,15rem)] lg:items-start lg:justify-between lg:gap-x-14">
        <div className="w-full max-w-[44rem] lg:col-start-1 lg:row-start-1">
          {/* Entradilla — lo que hay que saber sin leer el documento. */}
          <Reveal>
            <p className="medida m-0 text-[17px] leading-relaxed text-secondary">
              {es ? doc.entradaEs : doc.entradaEn}
            </p>
            <p className="mt-4 text-[14px] text-tertiary">
              {es ? "Última revisión: " : "Last reviewed: "}
              <time dateTime={LEGAL_ACTUALIZADO}>{fecha}</time>
            </p>
          </Reveal>

          {titularIncompleto && (
            <Reveal delay={0.05}>
              <div
                className="mt-6 border-y border-[var(--line-2)] py-4"
              >
                <p className="medida m-0 text-[14px] leading-relaxed text-secondary">
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

        </div>

          {/* Índice */}
          <Reveal
            delay={0.1}
            className="lg:sticky lg:top-28 lg:col-start-2 lg:row-start-1 lg:row-span-2"
          >
            <nav
              aria-label={es ? "Índice del documento" : "Document contents"}
              className="mt-10 rounded-[4px] border p-5 lg:mt-0 lg:border-0 lg:p-0"
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
                      /* `items-baseline`, no `items-center`: con un
                         título de dos líneas el número se quedaba
                         flotando entre las dos en vez de junto a la
                         primera. */
                      className="link-underline-host flex min-h-[44px] items-baseline gap-2.5 py-2 text-[14px] text-secondary transition-colors hover:text-primary"
                    >
                      <span
                        className="tnum shrink-0 text-[13px] font-semibold"
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
          <div className="mt-12 flex w-full max-w-[44rem] flex-col gap-11 lg:col-start-1 lg:row-start-2">
            {doc.secciones.map((s, i) => (
              <section key={s.id} id={s.id} className="scroll-mt-28">
                <h2 className="m-0 flex items-baseline gap-3 text-[15px] font-semibold tracking-tight text-primary">
                  <span
                    className="tnum text-[13px] font-semibold"
                    style={{ color: "rgb(var(--accent-base))" }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  {es ? s.tituloEs : s.tituloEn}
                </h2>
                <div className="mt-4 flex flex-col gap-4"
              >
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
      <p className="medida m-0 text-[15px] leading-[1.7] text-secondary">
        {es ? bloque.es : bloque.en}
      </p>
    );
  }

  if (bloque.tipo === "lista") {
    const items = es ? bloque.es : bloque.en;
    return (
      <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
        {items.map((t, i) => (
          <li key={i} className="medida flex gap-3 text-[15px] leading-[1.7] text-secondary">
            {/* El punto va como elemento propio y no como viñeta del
                navegador: así se alinea con la primera línea del texto y
                no se descuelga cuando el elemento ocupa varias líneas. */}
            <span
              aria-hidden
              className="mt-[0.62em] h-1 w-1 shrink-0 rounded-[1px]"
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
       la que se desplazaría sería la página entera.

       `tj-fila-sigue` añade el aviso de que sigue: sin él, la última
       columna queda partida contra el canto y eso no se lee como «hay
       más a la derecha» sino como una tabla cortada. Medido a 390 px:
       552 px de contenido en 358. */
    <div className="tj-fila-sigue tj-fila-sigue--sin-reserva -mx-1 overflow-x-auto px-1">
      <table className="w-full min-w-[34rem] border-collapse text-left text-[14px]">
        <thead>
          <tr>
            {cabeceras.map((c) => (
              <th
                key={c}
                scope="col"
                className="border-b px-3 py-2.5 align-bottom text-[12px] font-semibold uppercase tracking-[0.08em] text-tertiary"
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
