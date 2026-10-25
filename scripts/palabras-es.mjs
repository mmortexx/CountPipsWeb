/**
 * Palabras españolas que no deben aparecer en el texto inglés que copia una
 * herramienta. Va aparte de `copiado.mjs` porque ese script abre un navegador
 * al importarse y `tests/palabras-es.test.ts` necesita probar solo la expresión.
 */
export const PALABRAS_ES = [
  "del", "las", "los", "una", "unas", "unos", "por", "para", "pero", "porque",
  "cuando", "donde", "según", "también", "además", "aunque", "mientras", "hacia",
  "desde", "hasta", "entre", "sobre", "cada", "todo", "todos", "toda", "todas",
  "otro", "otra", "esto", "esta", "este", "estos", "estas", "más", "muy", "así",
  "solo", "siempre", "nunca", "año", "años", "mes", "meses", "día", "días",
  "operación", "operaciones", "ganancia", "pérdida", "riesgo", "cuenta", "cuentas",
  "inicial", "neta", "neto", "beneficio", "fuga", "brecha", "desglose", "resumen",
  "perfil", "ventaja", "puntuación", "objetivo", "tamaño", "entrada", "dirección",
];

/* Sin `\b`: solo cuenta como letra la ASCII y «así» (acaba en «í») nunca casaría. */
const deLista = (lista) => new RegExp("(?<!\\p{L})(?:" + lista.join("|") + ")(?!\\p{L})", "giu");
export const RE_ES = deLista(PALABRAS_ES);

/**
 * Las que no deben salir en una página /en (`cifras.mjs`). Lista corta a
 * propósito: si una da un falso positivo, se quita de aquí antes que relajar
 * la regla. «sólo» y no «solo», que también es inglés.
 */
export const PALABRAS_ES_PAGINA = [
  "del", "las", "los", "una", "unas", "unos", "por", "para", "pero", "porque",
  "cuando", "donde", "según", "también", "además", "aunque", "mientras", "hacia",
  "desde", "hasta", "entre", "sobre", "cada", "todo", "todos", "toda", "todas",
  "otro", "otra", "esto", "esta", "este", "estos", "estas", "más", "muy", "así",
  "sólo", "siempre", "nunca", "año", "años", "mes", "meses", "día", "días",
  "operaciones", "ganancia", "pérdida", "riesgo", "cuenta", "cuentas", "inicial",
];
export const RE_ES_PAGINA = deLista(PALABRAS_ES_PAGINA);
