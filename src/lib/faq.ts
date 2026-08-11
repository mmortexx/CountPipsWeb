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
    q: "¿Cuál es el estado de compra?",
    a: "La demo es pública y no pide registro ni tarjeta. Core $149 y Pro $249 son precios de lanzamiento previstos hasta que la entrega comercial esté abierta.",
  },
  {
    q: "¿Mis datos están seguros?",
    a: "Tus datos viven en un único archivo .sqlite dentro de tu equipo. Nunca se suben a ningún servidor: no hay servidor. Puedes cifrar la carpeta con BitLocker/VeraCrypt para una capa extra de seguridad.",
  },
  {
    q: "¿Puedo exportar mis datos?",
    a: "Sí. Puedes exportar todo tu diario a CSV (para Excel o Google Sheets), PDF (informes listos para compartir) y JSON (backup completo y reimportable). Tus datos son tuyos: puedes llevártelos cuando quieras, sin API que cerrar ni servidor que apagar.",
  },
  {
    q: "¿Funciona en Mac o Linux?",
    a: "CountPips es una app nativa de Windows (WinUI 3). En Mac o Linux puedes ejecutarla a través de una máquina virtual con Windows o Parallels. Estamos explorando activamente una versión local-first para Mac y Linux: si quieres entrar en el acceso anticipado, escríbenos.",
  },
  {
    q: "¿Puedo importar de otro diario?",
    a: "Sí. Aceptamos importación desde CSV (formato flexible con mapeo de columnas) y un importador dedicado para los diarios más conocidos. Si el tuyo exporta a CSV, lo tienes en tu CountPips en menos de 5 minutos.",
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
    a: "Core incluye el diario completo, 40+ métricas, 2 cuentas de trading, gestión de riesgo, disciplina e informes PDF básicos. Pro desbloquea además: cuentas ilimitadas, modo prop firm, simulador Monte Carlo, informe de track record, risk of ruin, informes PDF avanzados y el importador de rivales que migra tu diario anterior en 5 minutos.",
  },
  {
    q: "¿Cómo funcionará la privacidad de mis datos?",
    a: "La aplicación está diseñada local-first: las operaciones viven en tu equipo y la web no pide credenciales, capital, extractos ni datos financieros. El piloto privado valida el flujo sin exponer esos datos.",
  },
  {
    q: "¿Podré usarlo en varios ordenadores?",
    a: "La política de dispositivos se concretará antes de la venta. Durante el piloto privado recibirás instrucciones de instalación sólo si eres invitado.",
  },
  {
    q: "¿Qué ocurre si cambio de ordenador durante el piloto?",
    a: "El equipo de CountPips te indicará el procedimiento para mover tu entorno. No pediremos credenciales ni datos financieros para hacerlo.",
  },
];

export const FAQ_EN: QA[] = [
  {
    q: "What is the purchase status?",
    a: "The demo is public and requires no sign-up or card. Core is planned at $149 and Pro at $249 until commercial delivery opens.",
  },
  {
    q: "Are my data safe?",
    a: "Your data lives in a single .sqlite file on your machine. It never gets uploaded to any server: there is no server. You can encrypt the folder with BitLocker/VeraCrypt for an extra layer of security.",
  },
  {
    q: "Can I export my data?",
    a: "Yes. You can export your entire journal to CSV (for Excel or Google Sheets), PDF (ready-to-share reports), and JSON (full, re-importable backup). Your data is yours: take it with you whenever you want — no API to shut down, no server to turn off.",
  },
  {
    q: "Does it work on Mac or Linux?",
    a: "CountPips is a native Windows app (WinUI 3). On Mac or Linux you can run it through a Windows virtual machine or Parallels. We're actively exploring a local-first version for Mac and Linux — if you'd like early access, drop us a line.",
  },
  {
    q: "Can I import from another journal?",
    a: "Yes. We support CSV import (flexible format with column mapping) and a dedicated importer for popular journals. If your current journal exports to CSV, you'll have it in your CountPips in less than 5 minutes.",
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
    a: "Yes. Explore the live demo with deterministic data, no signup and nothing to download. The desktop installer is delivered only to invited private-pilot participants.",
  },
  {
    q: "What's the difference between Core and Pro?",
    a: "Core includes the full journal, 40+ metrics, 2 trading accounts, risk management, discipline, and basic PDF reports. Pro additionally unlocks unlimited accounts, prop firm mode, the Monte Carlo simulator, track record report, risk of ruin, advanced PDF reports, and the rival importer that migrates your old journal in 5 minutes.",
  },
  {
    q: "How will my data stay private?",
    a: "The app is designed local-first: trades live on your machine and the website never asks for credentials, capital, statements or financial data. The private pilot validates the workflow without exposing those data.",
  },
  {
    q: "Will I be able to use it on multiple computers?",
    a: "The device policy will be defined before sales open. During the private pilot, invited participants receive installation instructions.",
  },
  {
    q: "What if I change computers during the pilot?",
    a: "The CountPips team will provide the procedure to move your environment. We will not ask for credentials or financial data to do it.",
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
    a: "Core está previsto en $149 y Pro en $249. Son referencias de lanzamiento hasta que la entrega comercial, la licencia y el soporte estén abiertos.",
  },
  {
    q: "¿Qué datos no se solicitan?",
    a: "Nunca pedimos credenciales, capital, extractos ni datos financieros. Sólo preguntamos lo necesario para seleccionar el piloto y entender tu contexto de journal.",
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
    a: "Core is planned at $149 and Pro at $249. They are launch references until commercial delivery, licensing and support are open.",
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
