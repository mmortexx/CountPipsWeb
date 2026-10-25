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
export const RE_ES = new RegExp("(?<!\\p{L})(?:" + PALABRAS_ES.join("|") + ")(?!\\p{L})", "giu");
