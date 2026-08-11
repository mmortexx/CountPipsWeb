/**
 * El año en que se publicó esta compilación del sitio.
 *
 * ── Por qué existe un módulo para un número ───────────────────────────
 * El aviso de copyright del pie y el del cajón de navegación lo sacaban
 * de `new Date().getFullYear()`, o sea del reloj de quien mira la página.
 * Eso falla de dos maneras distintas y las dos empiezan el 1 de enero:
 *
 *   · El HTML se compila una vez y se sirve congelado, así que en cuanto
 *     cambia el año el servidor dice uno y el navegador otro sobre el
 *     mismo nodo de texto. React lo detecta al hidratar y escribe
 *     `Minified React error #418` en la consola de TODAS las páginas,
 *     hasta que alguien vuelva a publicar. Es el mismo defecto —y el
 *     mismo error— que traían las fechas de la muestra de demo por
 *     leerse en la hora local; ver la cabecera de `trading/data.ts`.
 *   · Y un aviso de copyright no declara en qué año estamos: declara
 *     cuándo se publicó la obra por última vez. El reloj del visitante no
 *     tiene forma de saber eso.
 *
 * El valor lo inyecta `next.config.ts` como literal del paquete, sacado
 * de la fecha del último commit — el mismo criterio que usa
 * `src/lib/fechas.ts` para el mapa del sitio. Ese fichero no se puede
 * importar desde un componente de cliente porque lee
 * `node:child_process`, y de ahí que la constante viaje por el entorno y
 * aterrice aquí.
 *
 * El respaldo no es decorativo: `process.env` puede llegar vacío si
 * alguien compila sin pasar por `next.config.ts` (las pruebas, por
 * ejemplo). Un año en blanco en el pie se ve; una excepción, no.
 */
export const ANIO_PUBLICACION: string =
  process.env.NEXT_PUBLIC_ANIO_PUBLICACION || "2026";
