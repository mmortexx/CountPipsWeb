// Tarjeta de X: el mismo diseño que la Open Graph. Las dos constantes se
// declaran literales porque Next las lee del texto y no sigue reexportaciones.
export const runtime = "nodejs";
export const dynamic = "force-static";
export { default, alt, size, contentType } from "./opengraph-image";
