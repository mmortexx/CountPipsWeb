/**
 * La política de contenido de `public/_headers` solo deja conectar con lo que
 * el sitio usa. El Worker de acceso anticipado es opcional: si la compilación
 * lo usa (`NEXT_PUBLIC_BETA_API_URL`), `postbuild.mjs` añade su origen exacto
 * a `connect-src` en `out/_headers`. Lanza si no encuentra dónde ponerlo.
 */
export function cabecerasConWorker(texto: string, urlWorker: string | undefined): string {
  const url = (urlWorker ?? "").trim();
  if (!url) return texto;
  const origen = new URL(url).origin;
  let cambios = 0;
  const resultado = texto.replace(/^(\s+Content-Security-Policy:.*?\bconnect-src\b)([^;\n]*)/m, (_, antes: string, fuentes: string) => {
    cambios++;
    return fuentes.trim().split(/\s+/).includes(origen) ? antes + fuentes : `${antes}${fuentes} ${origen}`;
  });
  if (cambios !== 1) throw new Error("[csp] _headers no tiene una Content-Security-Policy con connect-src");
  return resultado;
}
