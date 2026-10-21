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

type VozBuscable = { term: string; nombreEs?: string; slug: string };

/**
 * Ad\u00f3nde lleva la caja de la p\u00e1gina 404 (\u00abM\u00e9trica o pregunta\u2026\u00bb): a la voz del
 * glosario si la consulta es su nombre en cualquier idioma, su sigla o lo que
 * va entre par\u00e9ntesis (\u00abMAE (Maximum Adverse Excursion)\u00bb); si no, a la FAQ
 * filtrada. Recibe los t\u00e9rminos para que la 404 los cargue solo al buscar.
 */
export function destinoDeBusqueda(consulta: string, terminos: readonly VozBuscable[]): string {
  const limpia = consulta.trim();
  if (!limpia) return "/faq";
  const buscada = paraBuscar(limpia);
  for (const t of terminos) {
    const nombres = [t.term, t.nombreEs ?? ""].flatMap((n) => {
      const m = n.match(/^(.+?)\s*\((.+)\)$/);
      return m ? [n, m[1], m[2]] : [n];
    });
    if (nombres.some((n) => n && paraBuscar(n) === buscada)) return `/glosario/${t.slug}`;
  }
  return `/faq?q=${encodeURIComponent(limpia)}`;
}
