/**
 * Todo lo que el programa conecta a internet. La tabla de /features/seguridad
 * sale de aquí, y los textos que la resumen (FAQ, entradilla) deben nombrar
 * cada conexión que va sola; `tests/conexiones.test.ts` lo exige.
 */

type Texto = { nombre: string; que: string };
/** `hosts`: a dónde llama el programa (`SalidasDeRedTests` del programa); vacío si lo decide
 *  quien lo usa o si no llama nadie. */
export type Conexion = { automatica: boolean; hosts: string[]; es: Texto; en: Texto };

export const CONEXIONES: Conexion[] = [
  {
    automatica: true,
    hosts: ["api.lemonsqueezy.com"],
    es: { nombre: "Licencia", que: "La clave y el identificador de esta instalación, como mucho una vez al día; al activarla, también el nombre del equipo" },
    en: { nombre: "Licence", que: "The key and this installation’s identifier, at most once a day; on activation, also the computer’s name" },
  },
  {
    automatica: false,
    hosts: [],
    es: { nombre: "Actualizaciones", que: "Solo cuando las pides" },
    en: { nombre: "Updates", que: "Only when you ask for them" },
  },
  {
    automatica: false,
    hosts: [
      "data-api.ecb.europa.eu",
      "www.ecb.europa.eu",
      "home.treasury.gov",
      "publicreporting.cftc.gov",
      "www.sec.gov",
      "api.imf.org",
      "api.kraken.com",
    ],
    es: { nombre: "Mercados", que: "Datos públicos (BCE, Tesoro de EE. UU., CFTC, SEC, FMI, Kraken) al pulsar Actualizar, tras darle permiso" },
    en: { nombre: "Markets", que: "Public data (ECB, US Treasury, CFTC, SEC, IMF, Kraken) when you press Refresh, once you allow it" },
  },
  {
    automatica: false,
    hosts: ["api.binance.com"],
    es: { nombre: "Binance", que: "Tu histórico en solo lectura, si configuras la sincronización" },
    en: { nombre: "Binance", que: "Your history in read-only mode, if you set up the sync" },
  },
  {
    automatica: false,
    hosts: [],
    es: { nombre: "Webhooks", que: "Un aviso a la dirección que tú pongas, si los activas" },
    en: { nombre: "Webhooks", que: "An alert to the address you choose, if you turn them on" },
  },
  {
    automatica: false,
    hosts: [],
    es: { nombre: "Nube", que: "Una copia cifrada en una carpeta que tu OneDrive, Dropbox o Google Drive ya sincroniza, si la activas; la sube tu servicio de nube, no el programa" },
    en: { nombre: "Cloud", que: "An encrypted copy in a folder your OneDrive, Dropbox or Google Drive already syncs, if you turn it on; your cloud service uploads it, not the app" },
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
