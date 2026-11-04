/**
 * La comparación de WCAG 2.5.3 («etiqueta en el nombre»), en un solo sitio: la
 * usan `rotulos.mjs` sobre el HTML compilado y `tests/etiqueta-en-nombre.test.ts`
 * sobre lo que solo se pinta en el navegador (la demo).
 */

const ENTIDADES = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };

export const decodifica = (s) =>
  s.replace(/&(?:#x([0-9a-f]+)|#(\d+)|(\w+));/gi, (m, hex, dec, nombre) =>
    hex ? String.fromCodePoint(parseInt(hex, 16)) : dec ? String.fromCodePoint(Number(dec)) : (ENTIDADES[nombre.toLowerCase()] ?? m)
  );

/** Palabras sueltas, sin mayúsculas, tildes ni signos: lo que se compara entre el texto visible y el nombre. */
export const palabras = (s) =>
  decodifica(s).normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();

/** Solo el texto con letras es una etiqueta: un icono («×», «→») o una cifra suelta no lo es. */
export const esEtiqueta = (visible) => /\p{L}/u.test(visible);

/** Las palabras del texto visible aparecen seguidas en el nombre: «ES» no cabe en «Cambiar idioma». */
export const contieneEtiqueta = (nombre, visible) => ` ${palabras(nombre)} `.includes(` ${palabras(visible)} `);

/**
 * Un interruptor que enseña su estado («Con plan») y lo da como descripción
 * (`aria-describedby`) no tiene ese texto por etiqueta: su nombre es el rótulo
 * de al lado y el estado lo anuncian `aria-checked` y la descripción
 * (`tests/interruptor-plan.test.ts`).
 */
export const esEstadoDescrito = (visible, descripcion) => palabras(descripcion) !== "" && palabras(descripcion) === palabras(visible);
