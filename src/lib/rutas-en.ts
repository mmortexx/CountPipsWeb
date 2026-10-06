import { TERMINOS } from "@/lib/glosario";
import { HERRAMIENTAS } from "@/lib/herramientas";
import { RUTAS_FIJAS_EN } from "@/lib/locale";

/** Todas las rutas con versión inglesa, fichas incluidas, para el sitemap y las
 *  pruebas. Arrastra los datos del glosario: no debe importarse desde cliente. */
export const LOCALIZED_PATHS: readonly string[] = [
  ...RUTAS_FIJAS_EN,
  ...TERMINOS.map((t) => `/glosario/${t.slug}`),
  ...HERRAMIENTAS.map((h) => `/herramientas/${h.slug}`),
];
