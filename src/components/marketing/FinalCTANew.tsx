"use client";

import { Link } from "@/components/tj/LocaleLink";
import { useLang, tx } from "@/lib/i18n";
import { OPERACIONES_MUESTRA } from "@/lib/trading/muestra";
import { fmtInt } from "@/lib/trading/format";
import { METRICAS } from "@/lib/producto";

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
    es: ["Deja de operar a ciegas.", "Mira cómo se mide.", `${METRICAS} métricas, un guardián de disciplina y tus datos en tu equipo. Explora la demo, sin registro, y decide con criterio.`],
    /* Con contracción («it’s»): sin ella suena a manual junto a «Stop trading blind». */
    en: ["Stop trading blind.", "See how it’s measured.", `${METRICAS} metrics, a discipline guardian and your data on your machine. Explore the demo, no sign-up, and decide with clarity.`],
    pt: ["Pare de operar às cegas.", "Veja como isso é medido.", `${METRICAS} métricas, um guardião de disciplina e seus dados na sua máquina. Explore a demo, sem cadastro, e decida com clareza.`],
    fr: ["Cessez de trader à l’aveugle.", "Voyez comment tout est mesuré.", `${METRICAS} métriques, un gardien de discipline et vos données sur votre machine. Explorez la démo sans inscription et décidez avec clarté.`],
    de: ["Hören Sie auf, blind zu handeln.", "Sehen Sie, wie gemessen wird.", `${METRICAS} Kennzahlen, ein Disziplin-Wächter und Ihre Daten auf Ihrem Rechner. Testen Sie die Demo ohne Anmeldung und entscheiden Sie mit Klarheit.`],
    it: ["Smetti di fare trading alla cieca.", "Guarda come viene misurato.", `${METRICAS} metriche, un guardiano della disciplina e i tuoi dati sulla tua macchina. Esplora la demo senza registrazione e decidi con chiarezza.`],
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
    pt: ["Antes de pagar,", "veja-o funcionar.", "A demo mostra o software com {n} operações de exemplo. As compras serão abertas no lançamento."],
    fr: ["Avant de payer,", "voyez-le fonctionner.", "La démo présente le logiciel avec {n} opérations d’exemple. L’achat sera ouvert au lancement."],
    de: ["Bevor Sie zahlen,", "sehen Sie es im Einsatz.", "Die Demo zeigt das Programm mit {n} Beispiel-Trades. Der Kauf öffnet zum Verkaufsstart."],
    it: ["Prima di pagare,", "guardalo in azione.", "La demo mostra il programma con {n} operazioni di esempio. L’acquisto sarà disponibile al lancio."],
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
  const texto = variante ?? (enDemo ? "demo" : enPrecios ? "precios" : "general");
  const [titular, tenue, entradillaCruda] = tx(
    lang,
    TEXTOS[texto] as { es: readonly [string, string, string]; en: readonly [string, string, string]; pt?: readonly [string, string, string]; fr?: readonly [string, string, string]; de?: readonly [string, string, string]; it?: readonly [string, string, string] },
  );
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
                className="cta cta--primario"
              >
                {enDemo
                  ? tx(lang, { es: "Solicitar acceso", en: "Request access", pt: "Solicitar acesso", fr: "Demander l’accès", de: "Zugang anfordern", it: "Richiedi l’accesso" })
                  : tx(lang, { es: "Ver la demo", en: "See the demo", pt: "Ver a demo", fr: "Voir la démo", de: "Demo ansehen", it: "Guarda la demo" })}
              </Link>
              <Link
                href={enPrecios ? "/beta" : "/pricing"}
                className="cta cta--secundario"
              >
                {enPrecios
                  ? tx(lang, { es: "Solicitar acceso anticipado", en: "Request early access", pt: "Solicitar acesso antecipado", fr: "Demander l’accès anticipé", de: "Vorabzugang anfordern", it: "Richiedi l’accesso anticipato" })
                  : tx(lang, { es: "Ver precios", en: "See pricing", pt: "Ver preços", fr: "Voir les tarifs", de: "Preise ansehen", it: "Vedi i prezzi" })}
              </Link>
            </div>
            {/* Portada, producto y empresa: quien ya está convencido no tiene que
                subir al menú para pedir acceso. */}
            {texto === "general" || texto === "producto" || texto === "empresa" ? (
              <Link
                href="/beta"
                className="-my-2 inline-flex min-h-[44px] items-center text-[14px] text-secondary underline underline-offset-2 decoration-[color-mix(in_srgb,currentColor_40%,transparent)] transition-[color,text-decoration-color] hover:text-primary hover:decoration-current"
              >
                {tx(lang, { es: "o solicita acceso anticipado", en: "or request early access", pt: "ou solicite acesso antecipado", fr: "ou demandez l’accès anticipé", de: "oder Vorabzugang anfordern", it: "o richiedi l’accesso anticipato" })}
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
