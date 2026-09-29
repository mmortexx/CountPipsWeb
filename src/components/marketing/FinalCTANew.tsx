"use client";

import { Link } from "@/components/tj/LocaleLink";
import { useLang } from "@/lib/i18n";
import { trackEvent } from "@/lib/analytics";
import { OPERACIONES_MUESTRA } from "@/lib/trading/muestra";
import { fmtInt } from "@/lib/trading/format";

/** Cierre de página, compuesto como el final de un informe: un filete, el
 *  titular a la izquierda y las acciones a la derecha, sin recuadro. Antes
 *  era una lámina de cristal centrada, y un titular dentro de una caja con
 *  dos botones debajo es el cierre de cualquier plantilla.
 *  En /demo la llamada principal pasa a ser el acceso: ya se está en la demo.
 *  En /pricing la secundaria también: «Ver precios» enlazaba a la misma página.
 *
 *  ── Por qué hay tres textos y no uno ──────────────────────────────────
 *  Este bloque sale en 79 páginas españolas y sus 79 inglesas, y hasta
 *  ahora decía lo mismo en todas. De esas 79, sesenta y seis son fichas de
 *  glosario y calculadoras: a quien acaba de mirar qué significa «Sortino»
 *  o de calcular su tamaño de posición no se le cierra con «deja de operar
 *  a ciegas», porque no ha venido a eso. La variante `herramienta` recoge
 *  lo que esa persona sí acaba de hacer y le ofrece el paso siguiente; la
 *  de `glosario`, lo mismo para quien ha leído una definición y no ha hecho
 *  ninguna cuenta —«La cuenta ya te sale» no le decía nada—. Luego se vio
 *  que el general seguía repitiéndose en nueve páginas seguidas del
 *  recorrido de producto, así que hay un texto por familia de página
 *  (producto, empresa, precios), no uno por página: eso sería ruido e
 *  imposible de mantener en dos idiomas. */
const TEXTOS = {
  general: {
    es: ["Deja de operar a ciegas.", "Mira cómo se mide.", "40+ métricas, un guardián de disciplina y tus datos en tu equipo. Explora la demo, sin registro, y decide con criterio."],
    /* Sin contracción, «See how it is measured» suena a manual técnico justo
       al lado de «Stop trading blind», que es directo y hablado. Los dos
       trozos de la misma frase tienen que sonar a la misma voz. */
    en: ["Stop trading blind.", "See how it’s measured.", "40+ metrics, a discipline guardian and your data on your machine. Explore the demo, no sign-up, and decide with clarity."],
  },
  herramienta: {
    es: ["La cuenta ya te sale.", "Hazla con las tuyas.", "Esto mismo, pero sobre tu historial entero y al día con cada operación que registras. La demo lo enseña con datos de muestra."],
    en: ["The numbers add up.", "Now run your own.", "The same thing, over your whole history and updated with every trade you log. The demo shows it with sample data."],
  },
  /* Las páginas de producto (/features y sus tres ejes): quien llega aquí ya
     ha leído qué hace el programa; lo que falta es verlo funcionar. */
  producto: {
    es: ["Lo has leído por partes.", "Míralo funcionar junto.", "La demo es la aplicación con {n} operaciones de muestra: lo que describe esta página, en marcha y sin registro."],
    en: ["You have read it in parts.", "Now watch it work together.", "The demo is the app with {n} sample trades: what this page describes, running, no sign-up."],
  },
  /* Quién lo hace y las dudas (/about, /faq, perfiles de trader). */
  empresa: {
    es: ["Menos promesas.", "Más programa.", "Lo que se cuenta aquí se comprueba en la demo: la aplicación con datos de muestra, en el navegador y sin registro."],
    en: ["Fewer promises.", "More software.", "What is said here can be checked in the demo: the app with sample data, in your browser, no sign-up."],
  },
  /* En /demo ya se ha visto: lo que queda es pedir la versión de escritorio. */
  demo: {
    es: ["Si encaja con tu forma de operar,", "pide acceso anticipado.", "La versión de escritorio calcula lo mismo que acabas de ver, sobre tu propio historial y sin sacarlo de tu equipo."],
    en: ["If it fits the way you trade,", "request early access.", "The desktop version computes what you just saw, over your own history and without it leaving your machine."],
  },
  /* /pricing: la decisión es de compra, y la compra aún no está abierta. */
  precios: {
    es: ["Antes de pagar,", "míralo funcionar.", "La demo enseña el programa con {n} operaciones de muestra. La compra se abrirá con el lanzamiento."],
    en: ["Before you pay,", "watch it work.", "The demo shows the program with {n} sample trades. Purchase opens at launch."],
  },
  glosario: {
    // «{n}» es OPERACIONES_MUESTRA, la misma constante que usa el generador.
    es: ["Del término a la cifra.", "Míralo en la demo.", "La demo aplica este vocabulario a {n} operaciones de muestra: cada ratio con su muestra y cada error con lo que cuesta."],
    en: ["From the term to the number.", "See it in the demo.", "The demo applies this vocabulary to {n} sample trades: every ratio with its sample size, every mistake with what it costs."],
  },
} as const;

export function FinalCTANew({
  enDemo = false,
  enPrecios = false,
  variante,
}: { enDemo?: boolean; enPrecios?: boolean; variante?: keyof typeof TEXTOS } = {}) {
  const { lang } = useLang();
  const es = lang === "es";
  const texto = variante ?? (enDemo ? "demo" : enPrecios ? "precios" : "general");
  const [titular, tenue, entradillaCruda] = TEXTOS[texto][lang];
  const entradilla = entradillaCruda.replace("{n}", fmtInt(OPERACIONES_MUESTRA, lang));
  return (
    <section className="section relative">
      <div className="tj-container">
        <div className="tj-cierre">
          {/* `t-h2` y no `t-display`. El cierre es una sección más, y con
              `t-display` medía 84 px cuando el titular de la propia página
              mide 60: en las 79 páginas españolas que lo llevan —y sus 79
              inglesas— el pie gritaba más fuerte que el asunto de la página.
              A 48 px se lee como lo que es, el titular de la última sección,
              y queda por debajo del h1 en todas las páginas del sitio,
              incluida la portada (84). */}
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
