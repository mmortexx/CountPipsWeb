"use client";

import { usePathname } from "next/navigation";
import { useLang } from "@/lib/i18n";
import { plateAt } from "@/lib/atlas";

/**
 * PlateInterlude — la lámina a página completa.
 *
 * Una franja de altura casi completa, sin contenido y sin velo, donde el
 * atlas del fondo se ve ENTERO: marco, retícula, figura, graduación de
 * margen y cartela. Es el momento que el fondo no tenía.
 *
 * ── Por qué esto y no un panel lateral ────────────────────────────────
 * La alternativa era darle al atlas media pantalla fija. Se ve siempre,
 * sí, pero deja de ser un fondo: pasa a ser una ilustración al margen, y
 * el texto se queda encajonado en una columna durante todo el recorrido.
 * Un tratado no hace eso. Intercala láminas a página completa entre los
 * capítulos: el texto ocupa su página entera, la figura ocupa la suya. A
 * eso responde este componente.
 *
 * ── El pie de figura ──────────────────────────────────────────────────
 * Una pausa sin pie sería un hueco, y un hueco es un defecto. El pie es
 * lo que la convierte en una página del libro: numeración, título y una
 * línea que dice qué se está viendo y por qué importa. Va abajo, alineado
 * a la mancha del texto, con el filete doble encima — la posición y el
 * remate exactos de un pie de lámina impreso.
 *
 * ── `data-plate` ──────────────────────────────────────────────────────
 * Cada pausa se marca con su índice. EngravedAtlas lee esas marcas y
 * ajusta su progreso para que la lámina número N termine de dibujarse
 * justo cuando la pausa número N llena la pantalla. Sin esa
 * sincronización, la pausa podría caer en mitad de una transición y
 * enseñar dos figuras a medias — que es justo lo contrario de lo que
 * viene a hacer.
 */
export function PlateInterlude({ index }: { index: number }) {
  const { lang } = useLang();
  const es = lang === "es";
  const pathname = usePathname();
  /* El pie NO se escribe en la página: se deduce de la ruta y del índice.
     Antes cada `<PlateInterlude>` llevaba su título y su texto a mano, y
     eso solo funciona mientras nadie reordene las láminas de esa
     sección — el día que alguien las cambia, el pie sigue describiendo
     la figura anterior y no hay nada que avise. La fuente única está en
     `@/lib/atlas`, la misma que usa el canvas para dibujar. */
  const meta = plateAt(pathname, index);
  if (!meta) return null;
  const { roman, titleEs, titleEn, noteEs, noteEn } = meta;

  /* La pausa dura casi una pantalla en la portada y dos tercios en las
     demás. No es capricho: `/features` llegó a tener TRES láminas a
     88vh entre cinco secciones —3.222 px de fondo sin contenido en una
     página de 8.700, el 37 % del recorrido—, y eso no se lee como una
     pausa editorial sino como que la página se ha acabado. En la
     portada la proporción se sostiene porque hay seis secciones de
     texto entre cuatro láminas. */
  const esPortada = pathname === "/" || pathname === "/en";

  return (
    <section
      className={`tj-interlude${esPortada ? " tj-interlude-amplio" : ""}`}
      data-plate={index}
      aria-label={es ? `Lámina ${roman}` : `Plate ${roman}`}
    >
      <div className="tj-interlude-caption">
        <div aria-hidden className="tj-interlude-rule" />
        <span className="tj-interlude-num">
          {es ? `Lámina ${roman}` : `Plate ${roman}`}
        </span>
        <h2 className="tj-interlude-title">{es ? titleEs : titleEn}</h2>
        <p className="tj-interlude-note">{es ? noteEs : noteEn}</p>
      </div>
    </section>
  );
}
