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
 * ── EL RECORTE YA NO ES COSA DE ESTE COMPONENTE ───────────────────────
 * Aquí había una maquinaria para tapar por CSS la barra de título —dice
 * «Trading Journal», el nombre anterior al renombrado— y la de estado
 * —dice «✓ Compilación de desarrollo»—: un contenedor con `overflow`
 * oculto, un alto forzado en porcentaje y un `margin-top` negativo con su
 * conversión de unidades, porque los porcentajes verticales se resuelven
 * contra el ANCHO.
 *
 * Funcionaba, y arreglaba exactamente una cosa: la página pintada. El
 * JSON-LD del layout seguía entregándole a Google los ficheros ENTEROS, con
 * el nombre viejo y el sello de desarrollo dentro, desde las 155 páginas; y
 * quien abría la imagen directamente los veía igual. Ahora el recorte vive
 * en el fichero (`scripts/capturas.py`, con los originales archivados en
 * `assets/capturas-originales/`), así que no hay nada que tapar en ningún
 * sitio y este componente se limita a colocar una imagen.
 *
 * ── EN MÓVIL NO SE ENSEÑA LA PANTALLA: SE ENSEÑA UN DETALLE ───────────
 * A 390 px la lámina mide unos 350, y una captura de 1500 se ve al 0,23 de
 * su tamaño: no se lee ni una cifra. El componente decía estar demostrando
 * densidad real y en el teléfono no demostraba nada.
 *
 * Reducir más no arregla nada y el scroll horizontal es pedirle trabajo al
 * visitante. Lo que se sirve es un recorte dedicado —una región elegida
 * mirando cada captura, no una reducción— y el pie dice qué se está
 * mirando, porque enseñar un trozo sin avisar de que es un trozo es la otra
 * manera de mentir con una captura.
 *
 * Se resuelve con `<picture>`: la elección la hace el navegador antes de
 * descargar, así que el escritorio nunca pide la versión móvil ni al revés.
 *
 * ── Las cifras se quedan DENTRO de la captura ─────────────────────────
 * A propósito no hay cifras anotadas encima ni al lado. Las de la app y
 * las del motor de la web salen de juegos de datos de muestra distintos,
 * y ponerlas juntas enseñaría dos verdades que no cuadran. Dentro de la
 * captura, un número es «lo que este programa calcula»; fuera, en un
 * titular, se lee como un resultado prometido.
 */

/** Dimensiones de las capturas ya recortadas, en píxeles. */
const ANCHO_NATIVO = 1500;
const ALTO_NATIVO = 788;

/** Por debajo de aquí se sirve el detalle en lugar de la pantalla entera. */
const CORTE_MOVIL_PX = 767;

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
  /**
   * Cómo se llama el fragmento que se enseña en pantalla estrecha, para
   * poder decirlo en el pie: «detalle: el calendario del mes». Sin esto el
   * visitante de móvil ve un recorte y no sabe que lo es.
   */
  detalleEs: string;
  detalleEn: string;
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
  const movil = archivo.replace(/\.webp$/, "-movil.webp");

  return (
    <figure className="tj-lamina-producto">
      <div className="tj-lamina-marco">
        <div className="tj-lamina-ventana">
          {/* `img` y no `next/image`: el build es `output: "export"` con
              `images.unoptimized`, así que next/image no optimizaría nada
              y sí añadiría envoltorio. */}
          <picture>
            <source
              media={`(max-width: ${CORTE_MOVIL_PX}px)`}
              srcSet={asset(`/img/${movil}`)}
            />
            <img
              src={asset(`/img/${archivo}`)}
              alt={es ? altEs : altEn}
              width={ANCHO_NATIVO}
              height={ALTO_NATIVO}
              loading={priority ? "eager" : "lazy"}
              decoding="async"
              fetchPriority={priority ? "high" : "auto"}
            />
          </picture>
        </div>
      </div>
      <figcaption className="tj-lamina-pie">
        <div aria-hidden className="tj-interlude-rule" />
        {/* NO lleva número de lámina. Lo llevaba, y la portada acababa con
            dos «Lámina I»: ésta y la primera figura grabada del atlas, que
            numera aparte. El rótulo dice de qué serie es —una pantalla del
            programa, no una figura dibujada—, que además es la distinción
            que importa aquí: una es la cosa y la otra su ilustración. */}
        <span className="tj-lamina-num">
          {es ? `Pantalla ${roman}` : `Screen ${roman}`}
        </span>
        <h3 className="tj-lamina-titulo">{es ? tituloEs : tituloEn}</h3>
        <p className="tj-lamina-nota">{es ? notaEs : notaEn}</p>
        {/* Sólo se ve donde de verdad se está enseñando el recorte. Va con
            el mismo interruptor de ancho que el `<picture>` de arriba: si
            uno cambia y el otro no, el pie miente. */}
        <p className="tj-lamina-detalle">
          {es ? `Detalle: ${lamina.detalleEs}.` : `Detail: ${lamina.detalleEn}.`}
        </p>
      </figcaption>
    </figure>
  );
}
