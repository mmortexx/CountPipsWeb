"use client";

import { useLang } from "@/lib/i18n";
import { asset } from "@/lib/asset";

/**
 * ProductPlate — la captura real del producto, presentada como lámina.
 *
 * ── Por qué existe ────────────────────────────────────────────────────
 * La web no enseñaba el producto. Ni una vez, en 155 páginas, mientras
 * `layout.tsx` le declaraba tres capturas a Google en el JSON-LD y ocho
 * ficheros reales dormían sin usar en `public/img/`. Una web de software
 * de escritorio que no enseña su ventana está pidiendo un acto de fe.
 *
 * ── Por qué como lámina y no como "mockup" ────────────────────────────
 * El sitio ya tiene un vocabulario para presentar una figura: el atlas
 * dibuja láminas y `PlateInterlude` les pone su pie numerado. Meter aquí
 * un marco de ventana con brillos y sombra sería un segundo idioma para
 * lo mismo. La captura entra por la misma puerta que el resto de figuras
 * —numeración, filete doble, pie que dice qué se está viendo— y así el
 * grabado deja de ser un envoltorio bonito y pasa a enmarcar la prueba.
 *
 * ── EL RECORTE DE LA BARRA DE TÍTULO NO ES ESTÉTICO ───────────────────
 * Las ocho capturas se tomaron ANTES del renombrado y su barra de título
 * dice «Trading Journal», no «CountPips». Publicarlas enteras sería
 * enseñar el producto con el nombre de otro. Se recortan por CSS —no se
 * duplican ficheros retocados, que es deuda que nadie vuelve a mirar—
 * mediante un contenedor con `overflow:hidden` y un desplazamiento
 * negativo proporcional.
 *
 * Es además lo que recomienda la práctica actual para capturas de
 * escritorio: recortar ceñido a la función en lugar de repetir el marco
 * de ventana entero, que no aporta información y sí cuesta píxeles.
 *
 * ── Las cifras se quedan DENTRO de la captura ─────────────────────────
 * A propósito no hay cifras anotadas encima ni al lado. Las de la app y
 * las del motor de la web salen de juegos de datos de muestra distintos,
 * y ponerlas juntas enseñaría dos verdades que no cuadran. Dentro de la
 * captura, un número es «lo que este programa calcula»; fuera, en un
 * titular, se lee como un resultado prometido.
 */

/** Dimensiones nativas de las capturas, en píxeles. */
const ANCHO_NATIVO = 1500;
const ALTO_NATIVO = 856;

/**
 * Alto, en píxeles del original, de la barra de título que hay que cortar.
 * Medido sobre la captura: la barra termina y empieza la fila de menú.
 */
const BARRA_TITULO_PX = 46;

/**
 * OJO CON LA UNIDAD: `margin-top` en porcentaje se resuelve contra el ANCHO
 * del contenedor, nunca contra el alto — es así en la especificación, y es
 * el error que hace que un recorte "del 5 %" se coma el doble de lo que
 * parece en una imagen apaisada. Aquí se convierte a porcentaje de ancho
 * multiplicando por la proporción de la imagen.
 */
const CORTE_PCT_ANCHO = (BARRA_TITULO_PX / ALTO_NATIVO) * (ALTO_NATIVO / ANCHO_NATIVO) * 100;

export type LaminaProducto = {
  /** Nombre del fichero en `public/img/`, sin ruta. */
  archivo: string;
  /** Numeración de la lámina, en romanos, como el resto del atlas. */
  roman: string;
  tituloEs: string;
  tituloEn: string;
  /** Qué se está viendo y por qué importa. Una frase. */
  notaEs: string;
  notaEn: string;
  /** Texto alternativo: describe el CONTENIDO, no el continente. */
  altEs: string;
  altEn: string;
};

export function ProductPlate({
  lamina,
  priority = false,
}: {
  lamina: LaminaProducto;
  priority?: boolean;
}) {
  const { lang } = useLang();
  const es = lang === "es";
  const { archivo, roman, tituloEs, tituloEn, notaEs, notaEn, altEs, altEn } = lamina;

  return (
    <figure className="tj-lamina-producto">
      <div className="tj-lamina-marco">
        <div className="tj-lamina-ventana">
          {/* `img` y no `next/image`: el build es `output: "export"` con
              `images.unoptimized`, así que next/image no optimizaría nada
              y sí añadiría envoltorio. */}
          <img
            src={asset(`/img/${archivo}`)}
            alt={es ? altEs : altEn}
            width={ANCHO_NATIVO}
            height={ALTO_NATIVO}
            loading={priority ? "eager" : "lazy"}
            decoding="async"
            fetchPriority={priority ? "high" : "auto"}
            style={{ marginTop: `${-CORTE_PCT_ANCHO}%` }}
          />
        </div>
      </div>
      <figcaption className="tj-lamina-pie">
        <div aria-hidden className="tj-interlude-rule" />
        <span className="tj-lamina-num">
          {es ? `Lámina ${roman}` : `Plate ${roman}`}
        </span>
        <h3 className="tj-lamina-titulo">{es ? tituloEs : tituloEn}</h3>
        <p className="tj-lamina-nota">{es ? notaEs : notaEn}</p>
      </figcaption>
    </figure>
  );
}
