"use client";

import { useRef, useState } from "react";
import { Maximize2, X } from "lucide-react";
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
 * La captura va en un marco de 1 px con sombra suave (`.tj-lamina-marco`),
 * el mismo que la de la portada, y un pie que dice qué se está viendo.
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
  /** Ordinal romano de la captura (hoy no se pinta). */
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

/* CADA TEMA, SU CAPTURA. Hasta septiembre de 2026 iba la clara en los dos:
   se escribió que la oscura «perdía el contraste al reducirse», pero medido
   (desviación de luminancia a tamaño de lámina) la oscura tiene tanto o más
   que la clara en las siete pantallas, y en tema oscuro la clara era un
   bloque blanco en mitad de la página.

   Las dos van en el HTML y el CSS oculta la que no toca
   (`.tj-captura-clara` / `.tj-captura-oscura`, globals.css): el tema lo
   elige el botón de la web y no solo el sistema, así que un
   `<source media="(prefers-color-scheme)">` se equivocaría con el botón.
   Con `loading="lazy"` el navegador no descarga la que está oculta. */
const TEMAS = [
  { sufijo: "", clase: "tj-captura-clara" },
  { sufijo: "-oscuro", clase: "tj-captura-oscura" },
] as const;

export function ProductPlate({ lamina }: { lamina: LaminaProducto }) {
  const { lang } = useLang();
  const es = lang === "es";
  const { archivo, ancho, alto, tituloEs, tituloEn, notaEs, notaEn, altEs, altEn } = lamina;
  const alt = es ? altEs : altEn;

  /* Los cuatro ficheros de cada lámina: pantalla y detalle, en los dos
     temas. Los nombres los fija `scripts/capturas.py` y los comprueba
     `tests/capturas.test.ts`; aquí solo se derivan. */
  const variante = (sufijo: string) => archivo.replace(/\.webp$/, `${sufijo}.webp`);

  /* Visor: la captura entera a su tamaño, en un `<dialog>` nativo (foco,
     Escape y capa superior los pone el navegador). La imagen grande solo se
     pide al abrir. */
  const visor = useRef<HTMLDialogElement>(null);
  const [abierto, setAbierto] = useState(false);
  const abrir = () => {
    setAbierto(true);
    visor.current?.showModal();
  };
  const cerrar = () => visor.current?.close();

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
        <button
          type="button"
          className="tj-lamina-ventana tj-lamina-ampliable"
          onClick={abrir}
          aria-label={es ? `Ampliar captura: ${tituloEs}` : `Enlarge screenshot: ${tituloEn}`}
        >
          {/* `img` y no `next/image`: el build es `output: "export"` con
              `images.unoptimized`, así que next/image no optimizaría nada
              y sí añadiría envoltorio.

              Sin carga prioritaria: la lámina de la portada empieza a unos
              2340 px (medido a 1440, 1920 y 390), y pedirla al cargar le
              quitaba ancho de banda a lo que sí se ve. */}
          {TEMAS.map(({ sufijo, clase }) => (
            <picture key={clase} className={clase}>
              <source
                media={`(max-width: ${CORTE_MOVIL_PX}px)`}
                srcSet={asset(`/img/${variante(`${sufijo}-movil`)}`)}
              />
              <img
                src={asset(`/img/${variante(sufijo)}`)}
                alt={alt}
                width={ancho}
                height={alto}
                loading="lazy"
                decoding="async"
              />
            </picture>
          ))}
          <span className="tj-lamina-lupa tj-cristal tj-cristal--denso" aria-hidden>
            <Maximize2 size={15} />
          </span>
        </button>
      </div>
      <dialog
        ref={visor}
        className="tj-visor"
        aria-label={es ? tituloEs : tituloEn}
        onClose={() => setAbierto(false)}
        onClick={(e) => {
          if (e.target === e.currentTarget) cerrar();
        }}
      >
        {abierto && (
          <div className="tj-visor-lienzo" onClick={cerrar}>
            {TEMAS.map(({ sufijo, clase }) => (
              <img
                key={clase}
                className={clase}
                src={asset(`/img/${variante(sufijo)}`)}
                alt={alt}
                width={ancho}
                height={alto}
                loading="lazy"
                decoding="async"
              />
            ))}
          </div>
        )}
        <button
          type="button"
          className="tj-visor-cerrar tj-cristal tj-cristal--denso"
          onClick={cerrar}
          aria-label={es ? "Cerrar" : "Close"}
        >
          <X size={18} aria-hidden />
        </button>
      </dialog>
      <figcaption className="tj-lamina-pie">
        <h3 className="tj-lamina-titulo">{es ? tituloEs : tituloEn}</h3>
        <p className="tj-lamina-nota">{es ? notaEs : notaEn}</p>
        <p className="tj-lamina-detalle">
          {es ? `Detalle: ${lamina.detalleEs}.` : `Detail: ${lamina.detalleEn}.`}
        </p>
      </figcaption>
    </figure>
  );
}
