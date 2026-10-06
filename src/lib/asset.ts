/**
 * Antepone el `basePath` a una ruta absoluta de recurso. Next no lo añade a
 * los `src` que empiezan por "/" (`<img src="/img/foo.webp">`), que con
 * `output: "export"` + `basePath` dan 404 en GitHub Pages. Úsala en toda ruta
 * de recurso escrita a mano: `<Image src={asset("/img/foo.webp")} />`.
 */
const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export function asset(path: string): string {
  if (!path) return path;
  // Ya prefijada, externa o `data:`: se deja igual.
  if (path.startsWith(BASE) || /^https?:\/\//.test(path) || path.startsWith("data:")) {
    return path;
  }
  if (!path.startsWith("/")) {
    return `${BASE}/${path}`;
  }
  return `${BASE}${path}`;
}

/**
 * Lo contrario de `asset()`: quita el prefijo del sitio de una ruta que ya lo
 * lleva. `location.pathname` y el `.href` de un `<a>` incluyen el basePath;
 * `router.push()` y `usePathname()` trabajan sin él, y pasarle una ruta ya
 * prefijada da `/CountPipsWeb/CountPipsWeb/demo` y un 404. Se compara contra
 * `${BASE}/` para que `/CountPipsWebFoo` no pierda un trozo.
 */
export function rutaDeRouter(pathname: string): string {
  if (!BASE) return pathname;
  if (pathname === BASE) return "/";
  if (pathname.startsWith(`${BASE}/`)) return pathname.slice(BASE.length);
  return pathname;
}
