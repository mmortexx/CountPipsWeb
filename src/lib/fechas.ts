import { execFileSync } from "node:child_process";

/**
 * La fecha real de la última actualización del sitio.
 *
 * ── El problema que resuelve ──────────────────────────────────────────
 * El mapa del sitio declaraba `2025-01-01` en todas sus direcciones, y los
 * cuatro artículos de características llevaban esa misma fecha clavada.
 * Congelada, literalmente: daba igual cuántas veces se publicara, el sitio
 * seguía diciendo que no se tocaba nada desde el uno de enero.
 *
 * Para un buscador eso no es un detalle. La frescura pesa, y un sitio que
 * afirma llevar más de año y medio sin cambiar se rastrea menos a menudo.
 * Peor aún: la fecha era ANTERIOR a cambios que sí ocurrieron, así que no
 * es que faltara información — es que la que había era falsa.
 *
 * ── Por qué no vale `new Date()` ──────────────────────────────────────
 * Era el motivo original de congelarla, y era un motivo correcto: con la
 * hora del sistema, cada compilación produciría un mapa distinto aunque no
 * hubiera cambiado ni una coma, y publicar dos veces seguidas ya sería un
 * cambio a ojos del buscador.
 *
 * La fecha del último commit no tiene ese problema: es estable mientras el
 * contenido lo sea, cambia exactamente cuando cambia el sitio, y dos
 * compilaciones del mismo código dan el mismo resultado.
 *
 * ── Si no hay git ─────────────────────────────────────────────────────
 * Se usa el respaldo y el sitio se publica igual. Compilar NO puede fallar
 * por no poder fechar un XML. El único entorno donde esto importa es el de
 * publicación, y ahí git siempre está — es de donde sale el código.
 */

/** Último recurso: sólo se usa si `git` no responde. */
const RESPALDO = "2026-08-01T00:00:00.000Z";

function leerFechaDeGit(): Date | null {
  try {
    /* `execFileSync` y no `execSync`: la segunda pasa la orden por un
       intérprete de comandos. Aquí la orden es una constante y no hay nada
       que un tercero pueda inyectar, pero sin intérprete la posibilidad
       ni siquiera existe — y además arranca más rápido. */
    const iso = execFileSync("git", ["log", "-1", "--format=%cI"], {
      encoding: "utf8",
      /* La salida de error se descarta: fuera de un repositorio, git
         escribe en ella y ensuciaría el registro de compilación con algo
         que aquí no es un problema. */
      stdio: ["ignore", "pipe", "ignore"],
      timeout: 5_000,
    }).trim();
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? null : d;
  } catch {
    return null;
  }
}

/**
 * Se calcula UNA vez al cargar el módulo, no en cada llamada: el mapa del
 * sitio la pide para 73 direcciones y no tiene sentido lanzar 73 procesos.
 */
export const ULTIMA_ACTUALIZACION: Date = leerFechaDeGit() ?? new Date(RESPALDO);

/** La misma fecha en `AAAA-MM-DD`, que es lo que piden los datos estructurados. */
export const ULTIMA_ACTUALIZACION_ISO: string = ULTIMA_ACTUALIZACION.toISOString().slice(0, 10);

/**
 * Cuándo se publicó esto por primera vez.
 *
 * Las ocho páginas de `/features/*` declaraban `datePublished:
 * "2025-01-01"`, escrito a mano. No es una fecha: es un relleno con
 * forma de dato, y encima anterior a la existencia del repositorio.
 * Google la lee como la fecha real de publicación del artículo.
 *
 * Ésta es la del primer commit —2026-07-20—, que es la única fecha de
 * publicación que existe de verdad. Va como constante y no leída de git
 * en cada compilación porque el primer commit no cambia nunca; si algún
 * día se reescribe la historia, este número deja de ser cierto y hay que
 * tocarlo a mano, que es exactamente lo que debe pasar con un dato que
 * afirma algo sobre el pasado.
 */
export const PUBLICACION_ISO = "2026-07-20";

/**
 * Hasta cuándo se anuncia válido el precio, en los datos estructurados de
 * la oferta.
 *
 * Estaba escrito a mano como `2026-12-31`, y ese es el tipo de dato que
 * funciona hasta el día que deja de funcionar sin que nadie se entere:
 * pasada la fecha, el buscador da la oferta por caducada y retira el
 * precio del resultado. Nadie va a acordarse de actualizar una constante
 * dentro de un objeto de datos estructurados.
 *
 * Un año desde la última publicación. Se mueve solo con cada despliegue y
 * nunca queda en el pasado.
 */
export const PRECIO_VALIDO_HASTA: string = new Date(
  Date.UTC(
    ULTIMA_ACTUALIZACION.getUTCFullYear() + 1,
    ULTIMA_ACTUALIZACION.getUTCMonth(),
    ULTIMA_ACTUALIZACION.getUTCDate(),
  ),
)
  .toISOString()
  .slice(0, 10);
