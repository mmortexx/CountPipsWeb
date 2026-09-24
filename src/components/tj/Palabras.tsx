import { Fragment, type CSSProperties } from "react";

/* Una palabra de una o dos letras no cierra renglón en un titular: se pega a
   la siguiente con un espacio duro, y así sube con ella en la misma máscara. */
const CORTA = /^[a-záéíóúñü]{1,2}$/i;
export const pegaCortas = (s: string) =>
  s.split(" ").reduce((acc, palabra, k, todas) => (k === 0 ? palabra : acc + (CORTA.test(todas[k - 1]) ? "\u00A0" : " ") + palabra), "");

/**
 * Titular que entra palabra a palabra: cada palabra sube desde detrás de su
 * propia máscara (`.tj-pal` en globals.css). `realce` es el tramo que va en
 * el tono secundario; puede empezar o acabar a mitad de palabra («disciplina.»)
 * sin separar la puntuación de su palabra, que partiría el renglón por ahí.
 */
export function Palabras({ texto, realce }: { texto: string; realce?: string }) {
  const t = pegaCortas(texto);
  const r = realce ? pegaCortas(realce) : "";
  const ini = r ? t.lastIndexOf(r) : -1;
  const fin = ini < 0 ? -1 : ini + r.length;

  const palabras = t.split(" ");
  const inicios = palabras.map((_, k) => palabras.slice(0, k).reduce((n, p) => n + p.length + 1, 0));
  return (
    <>
      {palabras.map((palabra, k) => {
        const a = inicios[k];
        const b = a + palabra.length;
        const corte = (x: number) => Math.min(Math.max(x, a), b) - a;
        const [i0, i1] = ini < 0 ? [0, 0] : [corte(ini), corte(fin)];
        return (
          <Fragment key={k}>
            {k > 0 && " "}
            <span className="tj-pal">
              <span style={{ "--p": k } as CSSProperties}>
                {i1 > i0 ? (
                  <>
                    {palabra.slice(0, i0)}
                    <span className="text-gradient">{palabra.slice(i0, i1)}</span>
                    {palabra.slice(i1)}
                  </>
                ) : (
                  palabra
                )}
              </span>
            </span>
          </Fragment>
        );
      })}
    </>
  );
}
