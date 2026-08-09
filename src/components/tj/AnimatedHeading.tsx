interface AnimatedHeadingProps {
  text: string;
  className?: string;
  style?: React.CSSProperties;
  /**
   * Optional substring of `text` whose characters should render with the
   * project's `text-gradient` class. Lets a heading keep its original
   * "rest + gradient emphasis" design while still animating every char
   * individually. The substring must live within a single line of
   * `text` (no `\n` inside the highlight) — multi-line highlights are
   * not supported and degrade to no highlight.
   */
  highlight?: string;
}

/**
 * AnimatedHeading — splits text by \n into lines, then each line into
 * individual characters. Each character starts at opacity:0 and
 * translateX(-18px), then transitions to opacity:1 and translateX(0).
 * Staggered delay: (lineIndex * lineLength * 30) + (charIndex * 30) + 200ms.
 * Each character transition is 500ms.
 * Spaces render as \u00A0 (non-breaking space).
 *
 * If `highlight` is provided, every char that falls within the substring
 * (matched inside a single line, by code-point index) additionally gets
 * the `text-gradient` class — applied to the char's own span so the
 * gradient reliably renders even though each char is `display: inline-block`.
 */
/* ── TRES COSAS QUE CAMBIARON, Y POR QUÉ ───────────────────────────────

   1. YA NO ES UN COMPONENTE DE CLIENTE. La animación la hacía React:
      `useState(false)` + `useEffect`, con cada letra renderizada a
      `opacity: 0` en línea. En una exportación estática eso deja el
      titular de TODAS las páginas interiores invisible en el HTML
      servido, y sólo aparece si el JavaScript arranca. Ahora la hace el
      CSS (`.tj-char`, en globals.css): el estado final es el que está
      escrito en la hoja, así que el titular se ve aunque no haya
      JavaScript, y el componente puede renderizarse en servidor.

   2. EL ESCALONADO TIENE TECHO. Eran 30 ms por letra sin límite: un
      título de 48 caracteres tardaba 200 + 1.440 + 500 ≈ 2,1 s en
      terminar de escribirse, siendo el elemento más grande de la
      primera pantalla. Ahora el reparto total no pasa de
      `STAGGER_TOTAL`: un titular largo escalona más fino en vez de
      tardar más.

   3. EL RETARDO MULTILÍNEA ESTABA MAL. Usaba `lineIndex * line.length`,
      la longitud de la línea ACTUAL y no la suma de las anteriores, así
      que con líneas de distinta longitud la segunda podía empezar antes
      de que acabara la primera. Ahora se cuenta un índice global. */

/** Techo del reparto: ninguna entrada se alarga más que esto. */
const STAGGER_TOTAL = 420;
/** Retardo antes del primer carácter. */
const INITIAL_DELAY = 80;
/** Tope por carácter, para que un titular corto no entre de golpe. */
const CHAR_DELAY_MAX = 26;

export function AnimatedHeading({ text, className = "", style, highlight }: AnimatedHeadingProps) {
  const lines = text.split("\n");

  // Cuanto más largo el titular, más fino el escalonado. El total nunca
  // pasa de STAGGER_TOTAL.
  const totalChars = Math.max(1, Array.from(text.replace(/\n/g, "")).length);
  const charDelay = Math.min(CHAR_DELAY_MAX, STAGGER_TOTAL / totalChars);

  // Caracteres acumulados antes de cada línea, para que el escalonado sea
  // continuo de una línea a la siguiente.
  const charsBefore: number[] = [];
  lines.reduce((acc, line) => {
    charsBefore.push(acc);
    return acc + Array.from(line).length;
  }, 0);

  // Pre-compute, per line, the [start, end) code-point range of the
  // highlight substring (if it appears in that line). A range of
  // [-1, -1] means "no highlight in this line". The match is performed
  // on the line's code-point array (via Array.from) so multi-code-unit
  // characters (e.g. é, ñ, emoji) are matched correctly.
  const highlightChars = highlight ? Array.from(highlight) : null;
  const highlightRangesByLine: { start: number; end: number }[] = lines.map((line) => {
    if (!highlightChars || highlightChars.length === 0) {
      return { start: -1, end: -1 };
    }
    const lineChars = Array.from(line);
    let start = -1;
    outer: for (let i = 0; i <= lineChars.length - highlightChars.length; i++) {
      for (let j = 0; j < highlightChars.length; j++) {
        if (lineChars[i + j] !== highlightChars[j]) continue outer;
      }
      start = i;
      break outer;
    }
    if (start < 0) return { start: -1, end: -1 };
    return { start, end: start + highlightChars.length };
  });

  return (
    /* aria-label con el texto completo + \u00E1rbol visual aria-hidden: los
       lectores de pantalla leen la frase entera de una vez en lugar de
       letra a letra (cada char vive en su propio span). */
    <h1 className={className} style={style} aria-label={text.replace(/\n/g, " ")}>
      <span aria-hidden="true">
        {lines.map((line, lineIndex) => {
          const range = highlightRangesByLine[lineIndex];
          /* Agrupar por PALABRAS: cada palabra es un span inline-block
             con white-space:nowrap y los espacios son nodos de texto
             normales. As\u00ED el navegador solo puede partir la l\u00EDnea en los
             espacios \u2014 antes, con cada car\u00E1cter como inline-block
             independiente, el salto pod\u00EDa caer en mitad de una palabra
             ("pa|ra") sin guion. La animaci\u00F3n char-a-char no cambia:
             los delays siguen contados por \u00EDndice global de car\u00E1cter. */
          const words = line.split(" ");
          let charCursor = 0; // \u00EDndice de car\u00E1cter dentro de la l\u00EDnea
          return (
            <span key={lineIndex} style={{ display: "block" }}>
              {words.map((word, wordIndex) => {
                const wordStart = charCursor;
                const chars = Array.from(word);
                charCursor += chars.length + 1; // +1 por el espacio
                return (
                  <span key={wordIndex}>
                    {wordIndex > 0 && " "}
                    <span
                      style={{ display: "inline-block", whiteSpace: "nowrap" }}
                    >
                      {chars.map((char, ci) => {
                        const charIndex = wordStart + ci;
                        const inHighlight =
                          range.start >= 0 &&
                          charIndex >= range.start &&
                          charIndex < range.end;
                        /* \u00CDndice GLOBAL de car\u00E1cter: se acumulan los de las
                           l\u00EDneas anteriores, no la longitud de \u00E9sta. */
                        const globalIndex = charsBefore[lineIndex] + charIndex;
                        const delay = INITIAL_DELAY + globalIndex * charDelay;
                        return (
                          <span
                            key={ci}
                            className={
                              inHighlight ? "tj-char text-gradient" : "tj-char"
                            }
                            style={
                              {
                                "--tj-char-delay": `${Math.round(delay)}ms`,
                              } as React.CSSProperties
                            }
                          >
                            {char}
                          </span>
                        );
                      })}
                    </span>
                  </span>
                );
              })}
            </span>
          );
        })}
      </span>
    </h1>
  );
}
