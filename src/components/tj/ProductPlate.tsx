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

/**
 * Las capturas NO miden todas lo mismo, y por eso las medidas viajan en cada
 * lámina en vez de estar aquí como dos constantes. El playbook enseña cinco
 * fichas de setup: en la ventana con la que se capturó el resto, las dos de
 * abajo salían cortadas por la mitad, así que esa pantalla está capturada en
 * una ventana más alta. Declarar un alto único obligaba a elegir entre una
 * lámina con franjas o una lámina con las fichas serradas.
 *
 * Lo que sí se exige —y lo comprueba `tests/capturas.test.ts` leyendo la
 * cabecera de los ficheros— es que los cuatro ficheros de UNA lámina (los
 * dos temas × pantalla y detalle) encajen con lo que declara: si no, el
 * navegador reserva un hueco de un tamaño y luego pinta otro, y la página
 * pega un salto al cargar.
 */

/** Por debajo de aquí se sirve el detalle en lugar de la pantalla entera. */
const CORTE_MOVIL_PX = 767;

export type LaminaProducto = {
  /** Nombre del fichero en `public/img/`, sin ruta. */
  archivo: string;
  /** Medidas reales de esa captura ya recortada, en píxeles. */
  ancho: number;
  alto: number;
  /** Numeración de la lámina, en romanos, como el resto del atlas. */
  roman: string;
  /**
   * El nombre corto de la pantalla —el mismo que lleva en la barra de
   * navegación del programa—, para la galería de `/features`. El título de
   * la lámina no sirve ahí: es una frase, y una pestaña necesita una
   * palabra.
   */
  pestanaEs: string;
  pestanaEn: string;
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
  const { archivo, ancho, alto, roman, tituloEs, tituloEn, notaEs, notaEn, altEs, altEn } = lamina;
  const alt = es ? altEs : altEn;

  /* Los cuatro ficheros de cada lámina: pantalla y detalle, en los dos
     temas. Los nombres los fija `scripts/capturas.py` y los comprueba
     `tests/capturas.test.ts`; aquí sólo se derivan. */
  const variante = (sufijo: string) => archivo.replace(/\.webp$/, `${sufijo}.webp`);

  return (
    /* ── LA LÁMINA TAMBIÉN ENTRA ──────────────────────────────────────
       Todo lo que la rodea —la etiqueta, el titular, la entradilla, el
       pie— entra al asomar, y la captura, que es el asunto entero de la
       sección, aparecía de golpe ya puesta. En una página donde hasta un
       filete se traza, la pieza principal era la única sin gesto.

       Va con `data-entra`, el mismo mecanismo que el resto (una línea de
       tiempo de scroll, cero JavaScript), y con el escalón 2 para que
       llegue justo después de su cabecera y no a la vez: primero se lee
       de qué va, y entonces aparece. */
    <figure className="tj-lamina-producto" data-entra="2">
      <div className="tj-lamina-marco">
        <div className="tj-lamina-ventana">
          {/* `img` y no `next/image`: el build es `output: "export"` con
              `images.unoptimized`, así que next/image no optimizaría nada
              y sí añadiría envoltorio.

              DOS CAPTURAS, UNA POR TEMA. La página enseñaba la captura
              CLARA también en modo oscuro: una lámina blanca de 1576 px
              en mitad de una página casi negra, que además contradecía lo
              que la propia app hace cuando la abres de noche. No se puede
              resolver con `<picture>` y `prefers-color-scheme` porque el
              tema de este sitio no lo decide el sistema, lo decide
              `data-theme` en el `:root` (hay interruptor propio). Así que
              van las dos y el CSS enseña la que toca — con `lazy` en la
              que no se ve, que es lo que evita que el navegador se baje
              las dos. */}
          {(
            [
              { clase: "tj-captura--oscura", sufijo: "-oscuro", movil: "-oscuro-movil" },
              { clase: "tj-captura--clara", sufijo: "", movil: "-movil" },
            ] as const
          ).map(({ clase, sufijo, movil }) => (
            <picture key={clase} className={clase}>
              <source
                media={`(max-width: ${CORTE_MOVIL_PX}px)`}
                srcSet={asset(`/img/${variante(movil)}`)}
              />
              <img
                src={asset(`/img/${variante(sufijo)}`)}
                alt={alt}
                width={ancho}
                height={alto}
                loading={priority ? "eager" : "lazy"}
                decoding="async"
                fetchPriority={priority ? "high" : "auto"}
              />
            </picture>
          ))}
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
