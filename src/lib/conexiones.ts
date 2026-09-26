/**
 * Todo lo que el programa conecta a internet, en un solo sitio.
 *
 * La tabla de /features/seguridad sale de aquí, y las promesas que la
 * resumen (la FAQ, la entradilla de esa página) tienen que nombrar cada
 * conexión que va SOLA, sin que el usuario la active. En septiembre de
 * 2026 tres textos decían «lo que se conecta a internet lo activas tú»
 * con la licencia, que se comprueba sola una vez al día, en la fila de
 * al lado. `tests/conexiones.test.ts` lo ata.
 */

type Texto = { nombre: string; que: string };
export type Conexion = { automatica: boolean; es: Texto; en: Texto };

export const CONEXIONES: Conexion[] = [
  {
    automatica: true,
    es: { nombre: "Licencia", que: "La clave y el identificador de esta instalación, como mucho una vez al día" },
    en: { nombre: "Licence", que: "The key and this installation’s identifier, at most once a day" },
  },
  {
    automatica: false,
    es: { nombre: "Actualizaciones", que: "Solo cuando las pides" },
    en: { nombre: "Updates", que: "Only when you ask for them" },
  },
  {
    automatica: false,
    es: { nombre: "Mercados", que: "Datos públicos (BCE, Tesoro de EE. UU., CFTC, SEC, FMI, Kraken) al pulsar Actualizar" },
    en: { nombre: "Markets", que: "Public data (ECB, US Treasury, CFTC, SEC, IMF, Kraken) when you press Refresh" },
  },
  {
    automatica: false,
    es: { nombre: "Binance", que: "Tu histórico en solo lectura, si configuras la sincronización" },
    en: { nombre: "Binance", que: "Your history in read-only mode, if you set up the sync" },
  },
  {
    automatica: false,
    es: { nombre: "Webhooks", que: "Un aviso a la dirección que tú pongas, si los activas" },
    en: { nombre: "Webhooks", que: "An alert to the address you choose, if you turn them on" },
  },
  {
    automatica: false,
    es: { nombre: "Nube", que: "Una copia cifrada en tu propia carpeta de nube, si la activas" },
    en: { nombre: "Cloud", que: "An encrypted copy in your own cloud folder, if you turn it on" },
  },
];

const licencia = CONEXIONES.find((c) => c.automatica)!;
const enMinuscula = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

/** Lo que va solo, dicho en una frase para los textos que resumen la tabla. */
export const LO_QUE_VA_SOLO = {
  es: `Lo único que se conecta solo es la licencia: ${enMinuscula(licencia.es.que)}`,
  en: `The only thing that connects on its own is the licence check: ${enMinuscula(licencia.en.que)}`,
};

export const RESUMEN_SEGURIDAD = {
  es: "Sin cuenta, sin telemetría y sin servidores de CountPips: tus operaciones viven en tu equipo y solo salen si tú lo activas. Lo único que se conecta solo es la licencia.",
  en: "No account, no telemetry and no CountPips servers: your trades live on your machine and only leave if you turn something on. The only thing that connects on its own is the licence check.",
};
