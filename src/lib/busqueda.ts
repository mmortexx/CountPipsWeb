/**
 * Forma con la que se comparan la consulta y el texto en los buscadores del
 * sitio (FAQ, glosario, ventana del glosario): sin mayúsculas ni tildes, y
 * con un solo apóstrofo. Quien escribe «calculo» busca «cálculo», y el
 * «what's» del teclado tiene que encontrar el «What’s» tipográfico.
 */
export function paraBuscar(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\u2018\u2019]/g, "'");
}
