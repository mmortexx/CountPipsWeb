/**
 * Las preguntas frecuentes, en un solo sitio.
 *
 * ── POR QUÉ ESTE FICHERO EXISTE ──────────────────────────────────────
 * Estas trece preguntas estaban escritas DOS veces: una en el acordeón
 * que ve el visitante y otra, a mano, en el `FAQPage` de datos
 * estructurados que lee el buscador. Y habían divergido. A la pregunta
 * «¿Qué métodos de pago aceptáis?» la página respondía lo cierto —que
 * la compra se abrirá más adelante y que el acceso anticipado no es una
 * preventa— mientras el dato estructurado le decía a Google «Tarjeta de
 * crédito/débito y PayPal. Emitimos factura con IVA si procede.».
 *
 * Es la peor forma de este fallo: la mentira no está en la página, así
 * que mirándola no se ve, y va dirigida justo al canal que la publica
 * en los resultados de búsqueda. Doce de las trece respuestas
 * declaradas no existían en la página.
 *
 * Con una sola fuente no pueden volver a divergir: el JSON-LD se genera
 * de aquí con `jsonLdFaq()`. Hay una prueba que falla si alguien vuelve
 * a escribir un `acceptedAnswer` a mano bajo `src/app/`.
 */

export type QA = { q: string; a: string };

export const FAQ_ES: QA[] = [
  {
    q: "¿Ya se puede comprar?",
    a: "Todavía no. La compra se abrirá con el lanzamiento; hasta entonces, la demo es pública y no pide registro ni tarjeta. Core 149\u00a0$ y Pro 249\u00a0$ son los precios de lanzamiento previstos.",
  },
  {
    q: "¿Mis datos están seguros?",
    a: "Tus operaciones viven en una base de datos SQLite dentro de tu equipo. No hay cuenta ni telemetría, y CountPips no tiene servidores donde guardarlas. Puedes activar el cifrado EFS de Windows sobre la carpeta de datos. Solo sale algo del equipo si activas una función que lo necesita, como la copia cifrada en tu propia carpeta de nube; la lista completa está en la página de seguridad.",
  },
  {
    q: "¿Puedo exportar mis datos?",
    a: "Sí. Puedes exportar tus posiciones a CSV (para Excel o Google Sheets), la cuenta completa a JSON e informes a PDF. Leer y exportar tus datos nunca depende de la licencia: si caduca, la app pasa a solo lectura y todo sigue siendo tuyo.",
  },
  {
    q: "¿Funciona en Mac o Linux?",
    a: "No. CountPips es una app nativa de Windows (WinUI 3) para Windows 10 y 11 de 64 bits. Una versión para macOS está planificada como app hermana solo después de validar las ventas en Windows; Linux no está en el plan.",
  },
  {
    q: "¿Puedo importar de otro diario?",
    a: "Sí, si exporta a CSV: el asistente de importación mapea las columnas y guarda la receta para la próxima vez. Trae plantillas para Interactive Brokers, MetaTrader 4 y 5, TradingView, Binance y Bybit, y Binance puede sincronizarse en solo lectura. Los importadores dedicados de TradeZella, Tradervue y Edgewonk todavía no existen.",
  },
  {
    q: "¿Cómo se selecciona el acceso anticipado?",
    a: "Revisamos las solicitudes por perfil y fase del producto, no por orden de llegada. Si encaja con el piloto privado, escribiremos con los pasos de invitación.",
  },
  {
    q: "¿Qué está listo y qué se está validando?",
    a: "La demo, el diario, las métricas y los recorridos de riesgo están listos para explorar. El piloto privado valida la instalación y el flujo con usuarios reales; la página de estado explica lo que todavía no prometemos.",
  },
  {
    q: "¿Qué métodos de pago aceptáis?",
    a: "La demo no tiene coste. La compra se abrirá cuando la entrega comercial, la licencia y el soporte estén listos; el acceso anticipado no es una preventa.",
  },
  {
    q: "¿Puedo ver el producto antes de solicitar acceso?",
    a: "Sí. Puedes explorar la demo en vivo con datos deterministas, sin registro y sin descargar nada. La aplicación instalada se entrega sólo a participantes del piloto privado invitados.",
  },
  {
    q: "¿Cuál es la diferencia entre Core y Pro?",
    a: "Core incluye el diario, las métricas, el calendario y la curva de equity, la gestión de riesgo, psicología y disciplina, el playbook, la importación CSV, las copias de seguridad, el informe mensual en PDF y 2 cuentas de trading. Pro añade cuentas ilimitadas, el modo prop firm con su informe de evaluación en PDF, el módulo fiscal, la página Negocio, los experimentos, el simulador Monte Carlo, el riesgo de ruina, la API local y, en Mercados, las alertas, la curva de tipos y la fortaleza de divisas.",
  },
  {
    q: "¿Qué datos pide esta web?",
    a: "Ninguno financiero: ni credenciales, ni capital, ni extractos. Las calculadoras hacen sus cuentas en tu navegador. Los formularios piden sólo lo que ves en ellos —el de contacto, nombre, email y mensaje; el de acceso anticipado, email, perfil, experiencia, mercados y cómo llevas hoy tu diario—, y la analítica de visitas sólo se activa si la aceptas en el aviso de cookies.",
  },
  {
    q: "¿Podré usarlo en varios ordenadores?",
    a: "La política de dispositivos se concretará antes de la venta. Durante el piloto privado recibirás instrucciones de instalación sólo si eres invitado.",
  },
  {
    q: "¿Qué ocurre si cambio de ordenador durante el piloto?",
    a: "Tus datos viven en un único archivo: crea una copia de seguridad desde el programa y restáurala en el ordenador nuevo. No pediremos credenciales ni datos financieros para hacerlo.",
  },
];

export const FAQ_EN: QA[] = [
  {
    q: "Can I buy it yet?",
    a: "Not yet. Purchases open at launch; until then, the demo is public and requires no sign-up or card. Core is planned at $149 and Pro at $249 as launch prices.",
  },
  {
    q: "Are my data safe?",
    a: "Your trades live in a SQLite database on your machine. There is no account and no telemetry, and CountPips has no servers to store them. You can turn on Windows EFS encryption for the data folder. Something only leaves your machine if you turn on a feature that needs it, such as the encrypted copy in your own cloud folder; the full list is on the security page.",
  },
  {
    q: "Can I export my data?",
    a: "Yes. You can export your positions to CSV (for Excel or Google Sheets), the full account to JSON and reports to PDF. Reading and exporting your data never depends on the licence: if it lapses, the app switches to read-only and everything stays yours.",
  },
  {
    q: "Does it work on Mac or Linux?",
    a: "No. CountPips is a native Windows app (WinUI 3) for 64-bit Windows 10 and 11. A macOS version is planned as a sister app only after sales are validated on Windows; Linux is not on the plan.",
  },
  {
    q: "Can I import from another journal?",
    a: "Yes, if it exports to CSV: the import wizard maps the columns and saves the recipe for next time. It ships templates for Interactive Brokers, MetaTrader 4 and 5, TradingView, Binance and Bybit, and Binance can sync in read-only mode. Dedicated importers for TradeZella, Tradervue and Edgewonk do not exist yet.",
  },
  {
    q: "How is early access selected?",
    a: "We review applications by profile and product phase, not by order of arrival. If it fits the private pilot, we will write with invitation steps.",
  },
  {
    q: "What is ready and what is being validated?",
    a: "The demo, journal, metrics and risk journeys are ready to explore. The private pilot validates installation and workflow with real users; the product status page explains what is not promised yet.",
  },
  {
    q: "What payment methods do you accept?",
    a: "The demo is free. Purchase opens when commercial delivery, licensing and support are ready; early access is not a pre-order.",
  },
  {
    q: "Can I see the product before requesting access?",
    a: "Yes. Explore the live demo with deterministic data, no sign-up and nothing to download. The desktop installer is delivered only to invited private-pilot participants.",
  },
  {
    q: "What's the difference between Core and Pro?",
    a: "Core includes the journal, the metrics, the calendar and equity curve, risk management, psychology and discipline, the playbook, CSV import, backups, the monthly PDF report and 2 trading accounts. Pro adds unlimited accounts, prop firm mode with its PDF evaluation report, the tax module, the Business page, experiments, the Monte Carlo simulator, risk of ruin, the local API and, in Markets, alerts, the yield curve and currency strength.",
  },
  {
    q: "What data does this website ask for?",
    a: "Nothing financial: no credentials, no capital, no statements. The calculators do their maths in your browser. The forms ask only for what you see in them — the contact form, name, email and message; the early-access form, email, profile, experience, markets and how you keep your journal today — and visit analytics only switch on if you accept them in the cookie notice.",
  },
  {
    q: "Will I be able to use it on multiple computers?",
    a: "The device policy will be defined before sales open. During the private pilot, invited participants receive installation instructions.",
  },
  {
    q: "What if I change computers during the pilot?",
    a: "Your data lives in a single file: create a backup from the app and restore it on the new computer. We will not ask for credentials or financial data to do it.",
  },
];

/**
 * Las cuatro preguntas de la pagina de precios. Mismo motivo que las de
 * arriba: estaban escritas en el acordeon y otra vez, aparte, en el dato
 * estructurado. Aqui los dos textos SI coincidian, pero nada lo impedia.
 */
export const PRICING_FAQ_ES: QA[] = [
  {
    q: "¿Qué recibo al solicitar acceso anticipado?",
    a: "Revisamos cada solicitud por perfil y fase del producto. Si encaja con el piloto privado, recibirás una invitación con los siguientes pasos. No mostramos una posición en cola.",
  },
  {
    q: "¿La demo tiene algún coste?",
    a: "No. La demo es pública, funciona con datos de muestra y no pide tarjeta, registro ni instalación.",
  },
  {
    q: "¿Qué incluyen los precios de lanzamiento?",
    a: "Core está previsto en 149\u00a0$ y Pro en 249\u00a0$. Son referencias de lanzamiento hasta que la entrega comercial, la licencia y el soporte estén abiertos.",
  },
  {
    q: "¿Qué datos no se solicitan?",
    a: "Nunca pedimos credenciales, capital, extractos ni datos financieros. Sólo preguntamos lo necesario para seleccionar el piloto y entender tu contexto de diario.",
  },
];

export const PRICING_FAQ_EN: QA[] = [
  {
    q: "What do I receive when I request early access?",
    a: "We review every request by profile and product phase. If it fits the private pilot, you receive an invitation with next steps. We do not show a queue position.",
  },
  {
    q: "Does the demo cost anything?",
    a: "No. The demo is public, uses sample data, and requires no card, sign-up or installation.",
  },
  {
    q: "What do the launch prices include?",
    a: "Core is planned at $149 and Pro at $249. Both are indicative launch prices until commercial delivery, licensing and support go live.",
  },
  {
    q: "What data do you not request?",
    a: "We never ask for credentials, capital, statements or financial data. We only ask what is needed to select the pilot and understand your journaling context.",
  },
];

/**
 * El `FAQPage` de schema.org a partir de las MISMAS preguntas que se
 * pintan. Recibe la lista ya elegida por idioma para que no haya forma
 * de publicar una respuesta que la página no da.
 */
export function jsonLdFaq(items: QA[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((it) => ({
      "@type": "Question",
      name: it.q,
      acceptedAnswer: { "@type": "Answer", text: it.a },
    })),
  };
}
