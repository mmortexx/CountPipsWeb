import { Fragment, type CSSProperties } from "react";

/* Una palabra de una o dos letras no cierra renglón en un titular: se pega a
   la siguiente con un espacio duro, y así sube con ella en la misma máscara. */
const CORTA = /^[a-záéíóúñü]{1,2}$/i;
export const pegaCortas = (s: string) =>
  s.split(" ").reduce((acc, palabra, k, todas) => (k === 0 ? palabra : acc + (CORTA.test(todas[k - 1]) ? "\u00A0" : " ") + palabra), "");

/**
 * Titular que entra palabra a palabra: cada palabra sube desde detrás de su
 * propia máscara (`.tj-pal` en globals.css). La puntuación viaja con su
 * palabra: en su propia máscara el renglón podría partirse antes del punto.
 * Sin tramo realzado: los titulares son de un solo tono.
 */
export function Palabras({ texto }: { texto: string }) {
  const palabras = pegaCortas(texto).split(" ");
  return (
    <>
      {palabras.map((palabra, k) => (
        <Fragment key={k}>
          {k > 0 && " "}
          <span className="tj-pal">
            <span style={{ "--p": k } as CSSProperties}>{palabra}</span>
          </span>
        </Fragment>
      ))}
    </>
  );
}
