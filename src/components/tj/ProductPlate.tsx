"use client";

import { useRef, useState } from "react";
import { Maximize2, X } from "lucide-react";
import { useLang } from "@/lib/i18n";
import { asset } from "@/lib/asset";

/**
 * La captura real del producto como lámina: marco de 1 px (`.tj-lamina-marco`)
 * y un pie que dice qué se ve. El recorte (sin barra de título ni de estado)
 * vive en los ficheros, generados con `scripts/capturas.py`.
 *
 * En móvil se sirve un recorte dedicado (detalle) por `<picture>`, porque la
 * pantalla entera a 390 px no se lee; el pie avisa de que es un detalle. No hay
 * cifras anotadas fuera de la captura: las de la app y las del motor web salen
 * de datos de muestra distintos.
 *
 * Las medidas viajan en cada lámina porque las capturas no miden lo mismo.
 * `tests/capturas.test.ts` exige que los cuatro ficheros de una lámina
 * (dos temas × pantalla y detalle) encajen con ellas, o la página salta al cargar.
 */

/** Por debajo de aquí se sirve el detalle en lugar de la pantalla entera. */
const CORTE_MOVIL_PX = 767;

export type LaminaProducto = {
  /** Nombre del fichero en `public/img/`, sin ruta. */
  archivo: string;
  /** Medidas reales de esa captura ya recortada, en píxeles. */
  ancho: number;
  alto: number;
  /** Las del recorte móvil (`-movil.webp`), de otra proporción. Las comprueba `capturas.test.ts`. */
  anchoMovil: number;
  altoMovil: number;
  /** Ordinal romano de la captura (hoy no se pinta). */
  roman: string;
  /** Nombre corto de la pantalla (el de la barra del programa), para la galería de `/features`. */
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
  /** Nombre del fragmento que se enseña en pantalla estrecha, para el pie. */
  detalleEs: string;
  detalleEn: string;
};

// Cada tema, su captura. Las dos van en el HTML y el CSS oculta la que no toca
// (`.tj-captura-clara` / `.tj-captura-oscura`): el tema lo elige también el
// botón de la web, y `<source media="(prefers-color-scheme)">` no lo vería.
// Con `loading="lazy"` no se descarga la oculta.
const TEMAS = [
  { sufijo: "", clase: "tj-captura-clara" },
  { sufijo: "-oscuro", clase: "tj-captura-oscura" },
] as const;

export function ProductPlate({ lamina }: { lamina: LaminaProducto }) {
  const { lang } = useLang();
  const es = lang === "es";
  const { archivo, ancho, alto, anchoMovil, altoMovil, tituloEs, tituloEn, notaEs, notaEn, altEs, altEn } = lamina;
  const alt = es ? altEs : altEn;

  // Los nombres de los cuatro ficheros los fija `scripts/capturas.py` y los
  // comprueba `tests/capturas.test.ts`; aquí solo se derivan.
  const variante = (sufijo: string) => archivo.replace(/\.webp$/, `${sufijo}.webp`);

  // Visor en un `<dialog>` nativo (foco, Escape y capa superior los pone el
  // navegador). La imagen grande solo se pide al abrir.
  const visor = useRef<HTMLDialogElement>(null);
  const [abierto, setAbierto] = useState(false);
  const abrir = () => {
    setAbierto(true);
    visor.current?.showModal();
  };
  const cerrar = () => visor.current?.close();

  return (
    // `data-entra="2"`: entra con el resto de la sección, justo después de su cabecera.
    <figure className="tj-lamina-producto" data-entra="2">
      <div className="tj-lamina-marco">
        <button
          type="button"
          className="tj-lamina-ventana tj-lamina-ampliable"
          onClick={abrir}
          aria-label={es ? `Ampliar captura: ${tituloEs}` : `Enlarge screenshot: ${tituloEn}`}
        >
          {/* `img` y no `next/image`: con `output: "export"` e
              `images.unoptimized` no optimizaría nada. Sin carga
              prioritaria: la lámina queda muy por debajo del primer pliegue. */}
          {TEMAS.map(({ sufijo, clase }) => (
            <picture key={clase} className={clase}>
              <source
                media={`(max-width: ${CORTE_MOVIL_PX}px)`}
                srcSet={asset(`/img/${variante(`${sufijo}-movil`)}`)}
                width={anchoMovil}
                height={altoMovil}
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
        <h3 className="tj-lamina-titulo t-h3">{es ? tituloEs : tituloEn}</h3>
        <p className="tj-lamina-nota">{es ? notaEs : notaEn}</p>
        <p className="tj-lamina-detalle">
          {es ? `Detalle: ${lamina.detalleEs}.` : `Detail: ${lamina.detalleEn}.`}
        </p>
      </figcaption>
    </figure>
  );
}
