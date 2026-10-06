"use client";

import { Link } from "@/components/tj/LocaleLink";
import { useLang } from "@/lib/i18n";
import { trackEvent } from "@/lib/analytics";
import { OPERACIONES_MUESTRA } from "@/lib/trading/muestra";
import { fmtInt } from "@/lib/trading/format";

/** Cierre de página como el final de un informe: filete, titular a la izquierda
 *  y acciones a la derecha, sin recuadro.
 *  En /demo la llamada principal pasa a ser el acceso; en /pricing también la
 *  secundaria («Ver precios» enlazaría a la misma página).
 *
 *  Hay un texto por familia de página (general, herramienta, glosario,
 *  producto, empresa, demo, precios), no uno por página: la mayoría de las
 *  páginas son fichas de glosario y calculadoras, y un único texto no encaja
 *  con quien acaba de calcular algo o leer una definición. */
const TEXTOS = {
  general: {
    es: ["Deja de operar a ciegas.", "Mira cómo se mide.", "40+ métricas, un guardián de disciplina y tus datos en tu equipo. Explora la demo, sin registro, y decide con criterio."],
    /* Con contracción («it’s»): sin ella suena a manual junto a «Stop trading blind». */
    en: ["Stop trading blind.", "See how it’s measured.", "40+ metrics, a discipline guardian and your data on your machine. Explore the demo, no sign-up, and decide with clarity."],
  },
  herramienta: {
    es: ["La cuenta ya te sale.", "Hazla con las tuyas.", "Esto mismo, pero sobre tu historial entero y al día con cada operación que registras. La demo lo enseña con datos de muestra."],
    en: ["The numbers add up.", "Now run your own.", "The same thing, over your whole history and updated with every trade you log. The demo shows it with sample data."],
  },
  /* Páginas de producto (/features y sus tres ejes). */
  producto: {
    es: ["Lo has leído por partes.", "Míralo funcionar junto.", "La demo es la aplicación con {n} operaciones de muestra: lo que describe esta página, en marcha y sin registro."],
    en: ["You have read it in parts.", "Now watch it work together.", "The demo is the app with {n} sample trades: what this page describes, running, no sign-up."],
  },
  /* /about, /faq y perfiles de trader. */
  empresa: {
    es: ["Menos promesas.", "Más programa.", "Lo que se cuenta aquí se comprueba en la demo: la aplicación con datos de muestra, en el navegador y sin registro."],
    en: ["Fewer promises.", "More software.", "What is said here can be checked in the demo: the app with sample data, in your browser, no sign-up."],
  },
  /* /demo: ya se ha visto, queda pedir la versión de escritorio. */
  demo: {
    es: ["Si encaja con tu forma de operar,", "pide acceso anticipado.", "La versión de escritorio calcula lo mismo que acabas de ver, sobre tu propio historial y sin sacarlo de tu equipo."],
    en: ["If it fits the way you trade,", "request early access.", "The desktop version computes what you just saw, over your own history and without it leaving your machine."],
  },
  /* /pricing: la compra aún no está abierta. */
  precios: {
    es: ["Antes de pagar,", "míralo funcionar.", "La demo enseña el programa con {n} operaciones de muestra. La compra se abrirá con el lanzamiento."],
    en: ["Before you pay,", "watch it work.", "The demo shows the program with {n} sample trades. Purchase opens at launch."],
  },
  glosario: {
    // «{n}» es OPERACIONES_MUESTRA.
    es: ["Del término a la cifra.", "Míralo en la demo.", "La demo aplica este vocabulario a {n} operaciones de muestra: cada ratio con su muestra y cada error con lo que cuesta."],
    en: ["From the term to the number.", "See it in the demo.", "The demo applies this vocabulary to {n} sample trades: every ratio with its sample size, every mistake with what it costs."],
  },
} as const;

export function FinalCTANew({
  enDemo = false,
  enPrecios = false,
  variante,
  sinFilete = false,
}: {
  enDemo?: boolean;
  enPrecios?: boolean;
  variante?: keyof typeof TEXTOS;
  /** La sección anterior ya acaba en filete: no se dibuja un segundo. */
  sinFilete?: boolean;
} = {}) {
  const { lang } = useLang();
  const es = lang === "es";
  const texto = variante ?? (enDemo ? "demo" : enPrecios ? "precios" : "general");
  const [titular, tenue, entradillaCruda] = TEXTOS[texto][lang];
  const entradilla = entradillaCruda.replace("{n}", fmtInt(OPERACIONES_MUESTRA, lang));
  return (
    <section className="section relative">
      <div className="tj-container">
        <div className={sinFilete ? "tj-cierre tj-cierre--sin-filete" : "tj-cierre"}>
          {/* `t-h2` y no `t-display`: el cierre debe quedar por debajo del h1 de
              todas las páginas (con `t-display` medía 84 px). */}
          <h2 data-entra className="tj-cierre-titular t-h2 m-0 max-w-[20ch] text-balance">
            {titular}{" "}
            <span className="tj-frase-nueva">{tenue}</span>
          </h2>
          <p data-entra="2" className="m-0 max-w-[34rem] t-entradilla tj-cierre-tenue">
            {entradilla}
          </p>
          <div data-entra="3" className="tj-cierre-acciones">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
              <Link
                href={enDemo ? "/beta" : "/demo"}
                onClick={enDemo ? () => trackEvent("demo_early_access_clicked") : undefined}
                className="cta cta--primario"
              >
                {enDemo ? (es ? "Solicitar acceso" : "Request access") : es ? "Ver la demo" : "See the demo"}
              </Link>
              <Link
                href={enPrecios ? "/beta" : "/pricing"}
                onClick={enDemo ? () => trackEvent("demo_pricing_clicked") : undefined}
                className="cta cta--secundario"
              >
                {enPrecios
                  ? es ? "Solicitar acceso anticipado" : "Request early access"
                  : es ? "Ver precios" : "See pricing"}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
