/**
 * Forma con la que se comparan la consulta y el texto en los buscadores del
 * sitio (FAQ, glosario, ventana del glosario): sin mayúsculas ni tildes, y
 * con un solo apóstrofo y con los espacios duros como espacios. Quien escribe
 * «calculo» busca «cálculo», el «what's» del teclado tiene que encontrar el
 * «What’s» tipográfico y «10 %» el «10\u00a0%» del texto.
 */
export function paraBuscar(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u200b\u2060]/g, "")
    .replace(/\s+/g, " ");
}

/** ¿Está cada palabra de la consulta en alguno de los textos, en cualquier orden? */
export function coincide(consulta: string, ...textos: string[]): boolean {
  const palabras = paraBuscar(consulta).split(" ").filter(Boolean);
  if (palabras.length === 0) return true;
  const texto = textos.map(paraBuscar).join("\n");
  return palabras.every((p) => texto.includes(p));
}

type VozBuscable = { term: string; nombreEs?: string; slug: string };

/**
 * Adónde lleva la caja de la página 404 («Métrica o duda…»): a la voz del
 * glosario si la consulta es su nombre en cualquier idioma, su sigla o lo que
 * va entre paréntesis («MAE (Maximum Adverse Excursion)»), o si es parte del
 * nombre de una sola voz («sharpe»); si no, a la FAQ filtrada. Recibe los
 * términos para que la 404 los cargue solo al buscar.
 */
export function destinoDeBusqueda(consulta: string, terminos: readonly VozBuscable[]): string {
  // Un sustituto suelto (U+D800…) haría lanzar a encodeURIComponent.
  const limpia = consulta.trim().replace(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/g, "\uFFFD");
  if (!limpia) return "/faq";
  const buscada = paraBuscar(limpia);
  const parciales: VozBuscable[] = [];
  for (const t of terminos) {
    const nombres = [t.term, t.nombreEs ?? ""].flatMap((n) => {
      const m = n.match(/^(.+?)\s*\((.+)\)$/);
      return m ? [n, m[1], m[2]] : [n];
    });
    if (nombres.some((n) => n && paraBuscar(n) === buscada)) return `/glosario/${t.slug}`;
    if (coincide(limpia, ...nombres)) parciales.push(t);
  }
  if (parciales.length === 1) return `/glosario/${parciales[0].slug}`;
  return `/faq?q=${encodeURIComponent(limpia)}`;
}
