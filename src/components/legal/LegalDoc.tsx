"use client";

import { useLang } from "@/lib/i18n";
import { Reveal } from "@/components/tj/Reveal";
import type { Bloque, DocumentoLegal } from "@/lib/legal/documentos";
import { LEGAL_ACTUALIZADO } from "@/lib/legal/documentos";
import { titularIncompleto } from "@/lib/legal/titular";
import { LOCALE_FECHA } from "@/lib/trading/format";

/**
 * Cuerpo de las cuatro páginas legales: secciones numeradas con párrafos,
 * listas y tablas, cada una con su ancla. La medida de línea la pone `.medida`
 * en cada bloque de texto. El índice va a un raíl lateral desde `lg`; en móvil
 * queda arriba. El aviso de borrador sale mientras falten los datos fiscales de
 * `src/lib/legal/titular.ts` y desaparece solo al rellenarlos.
 */
export function LegalDoc({ doc }: { doc: DocumentoLegal }) {
  const { lang } = useLang();
  const es = lang === "es";

  // `timeZone: "UTC"`: `LEGAL_ACTUALIZADO` es una fecha sin hora (medianoche
  // UTC). Sin fijarlo, al oeste de Greenwich se lee el día anterior y la
  // hidratación no coincide con el HTML compilado.
  const fecha = new Date(LEGAL_ACTUALIZADO).toLocaleDateString(
    LOCALE_FECHA[es ? "es" : "en"],
    { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" },
  );

  return (
    <section
      className="section-tight"
    >
      <div className="tj-container">
        {/* Desde `lg` el índice va a un raíl lateral que acompaña al scroll.
            Las columnas van en `rem` y no en `ch`: `ch` se resuelve con la
            tipografía de quien lo escribe y aquí no medía lo que decía. La
            medida real la pone `.medida`; `justify-between` reparte el hueco. */}
        <div className="lg:grid lg:grid-cols-[minmax(0,44rem)_minmax(0,15rem)] lg:items-start lg:justify-between lg:gap-x-14">
        <div className="w-full max-w-[44rem] lg:col-start-1 lg:row-start-1">
          <Reveal>
            <p className="medida m-0 t-entradilla text-secondary">
              {es ? doc.entradaEs : doc.entradaEn}
            </p>
            <p className="mt-4 text-[14px] text-tertiary">
              {es ? "Última revisión: " : "Last reviewed: "}
              <time dateTime={LEGAL_ACTUALIZADO}>{fecha}</time>
            </p>
          </Reveal>

          {titularIncompleto && (
            <Reveal delay={0.05}>
              {/* La medida va en la caja para que los filetes acaben con el texto. */}
              <div className="medida mt-6 border-y border-[var(--line-2)] py-4 text-[14px]">
                <p className="m-0 leading-[1.6] text-secondary">
                  <strong className="text-primary">
                    {es ? "Documento en preparación. " : "Draft document. "}
                  </strong>
                  {es
                    ? "Faltan los datos fiscales del titular, que la ley exige en cuanto haya venta. Hasta entonces este texto describe con exactitud cómo funciona la web, pero no sustituye a la revisión de un profesional."
                    : "The owner’s tax details are missing; the law requires them as soon as sales begin. Until then this text describes accurately how the site works, but it does not replace review by a professional."}
                </p>
              </div>
            </Reveal>
          )}

        </div>

          <Reveal
            delay={0.1}
            className="lg:sticky lg:top-28 lg:col-start-2 lg:row-start-1 lg:row-span-2"
          >
            <nav
              aria-label={es ? "Índice del documento" : "Document contents"}
              className="mt-10 lg:mt-0"
            >
              <p className="eyebrow m-0">{es ? "Contenido" : "Contents"}</p>
              <ol className="mt-1 m-0 flex list-none flex-col p-0">
                {doc.secciones.map((s, i) => (
                  /* `min-h-[44px]` en el enlace, no en el `<li>`. */
                  <li key={s.id}>
                    <a
                      href={`#${s.id}`}
                      /* `items-baseline`: el número queda junto a la primera línea del título. */
                      className="link-underline-host flex min-h-[44px] items-baseline gap-2.5 py-2 text-[14px] text-secondary transition-colors hover:text-primary"
                    >
                      <span
                        className="tnum shrink-0 text-[13px] font-semibold"
                        style={{ color: "rgb(var(--accent-base))" }}
                      >
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className="link-underline link-underline--al-pasar">
                        {es ? s.tituloEs : s.tituloEn}
                      </span>
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
          </Reveal>

          <div className="mt-12 flex w-full max-w-[44rem] flex-col gap-11 lg:col-start-1 lg:row-start-2">
            {doc.secciones.map((s, i) => (
              <section key={s.id} id={s.id} className="scroll-mt-28">
                {/* `t-h3`: todo h2 sale en serif y a 15 px quedaría más débil que el cuerpo. */}
                <h2 className="m-0 flex items-baseline gap-3 t-h3 text-primary">
                  <span
                    className="tnum font-sans text-[13px] font-semibold"
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
            {/* Punto propio, no viñeta del navegador: se alinea con la primera línea. */}
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
    <>
    {/* En móvil, una ficha por fila: la tabla de tres columnas no cabe. */}
    <div className="border-t border-[var(--line-2)] sm:hidden">
      {bloque.filas.map((f, i) => {
        const [nombre, ...resto] = es ? f.es : f.en;
        return (
          <div key={i} className="border-b border-[var(--line)] py-3.5">
            <p className="m-0 text-[14px] font-medium text-primary">{nombre}</p>
            <dl className="m-0 mt-2 grid gap-y-1.5 text-[14px] leading-[1.6]">
              {resto.map((c, j) => (
                <div key={j}>
                  <dt className="text-[13px] text-tertiary">{cabeceras[j + 1]}</dt>
                  <dd className="m-0 leading-[1.6] text-secondary">{c}</dd>
                </div>
              ))}
            </dl>
          </div>
        );
      })}
    </div>
    <div className="hidden sm:block">
      <table className="w-full border-collapse text-left text-[14px]">
        <thead>
          <tr>
            {cabeceras.map((c) => (
              <th
                key={c}
                scope="col"
                className="border-b border-[var(--line-2)] px-3 py-2.5 align-bottom text-[13px] font-medium text-tertiary"
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
                    className="border-b border-[var(--line)] px-3 py-3 align-top leading-[1.6] text-secondary"
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
    </>
  );
}
