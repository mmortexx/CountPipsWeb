"use client";

import { useLang, tx } from "@/lib/i18n";
import { Link } from "@/components/tj/LocaleLink";
import { Reveal } from "@/components/tj/Reveal";
import { SectionHeader } from "@/components/layout/SectionHeader";

/**
 * Los cuatro principios del producto en una retícula 2×2 de filetes: cada uno
 * con su afirmación y el sitio donde el visitante puede comprobarla.
 */

interface Value {
  titleEs: string;
  titleEn: string;
  titlePt?: string;
  titleFr?: string;
  titleDe?: string;
  titleIt?: string;
  descEs: string;
  descEn: string;
  descPt?: string;
  descFr?: string;
  descDe?: string;
  descIt?: string;
  /** Dónde se puede ir a comprobar este principio. */
  href: string;
  pruebaEs: string;
  pruebaEn: string;
  pruebaPt?: string;
  pruebaFr?: string;
  pruebaDe?: string;
  pruebaIt?: string;
}

const VALUES: Value[] = [
  {
    titleEs: "Local siempre",
    titleEn: "Local always",
    titlePt: "Sempre local",
    titleFr: "Toujours en local",
    titleDe: "Immer lokal",
    titleIt: "Sempre in locale",
    descEs:
      "Tus operaciones son tuyas. Viven en tu equipo y solo salen si activas una función que lo necesita; la analítica de esta web solo se activa con tu consentimiento.",
    descEn:
      "Your trading data is yours. It lives on your machine and only leaves if you turn on a feature that needs it; this site’s analytics only activates with your consent.",
    descPt:
      "Suas operações pertencem a você. Elas ficam na sua máquina e só saem se você ativar uma função necessária; a análise deste site só é ativada com seu consentimento.",
    descFr:
      "Vos données de trading vous appartiennent. Elles restent sur votre machine et ne la quittent que si vous activez une option dédiée ; les analyses de ce site n’opèrent qu’avec votre consentement.",
    descDe:
      "Ihre Trading-Daten gehören Ihnen. Sie bleiben auf Ihrem Rechner und verlassen ihn nur, wenn Sie eine entsprechende Funktion aktivieren; Web-Analysen laufen nur mit Ihrer Einwilligung.",
    descIt:
      "I tuoi dati di trading ti appartengono. Restano sulla tua macchina e ne escono solo se attivi una funzione che lo richiede; le analisi di questo sito si attivano solo con il tuo consenso.",
    href: "/features/seguridad",
    pruebaEs: "Qué se guarda y dónde",
    pruebaEn: "What is stored, and where",
    pruebaPt: "O que é salvo e onde",
    pruebaFr: "Ce qui est stocké et où",
    pruebaDe: "Was gespeichert wird und wo",
    pruebaIt: "Cosa viene salvato e dove",
  },
  {
    titleEs: "Demo honesta, sin atajos",
    titleEn: "An honest demo, no shortcuts",
    titlePt: "Demo honesta, sem atalhos",
    titleFr: "Une démo honnête, sans artifice",
    titleDe: "Ehrliche Demo, ohne Umwege",
    titleIt: "Una demo onesta, senza scorciatoie",
    descEs:
      "Datos de muestra, sin tarjeta ni instalación. El piloto privado valida el producto con usuarios reales antes de abrir la venta.",
    descEn:
      "Sample data, no card and no installation. The private pilot validates the product with real users before sales open.",
    descPt:
      "Dados de exemplo, sem cartão e sem instalação. O piloto privado valida o produto com usuários reais antes de abrir as vendas.",
    descFr:
      "Des données d’exemple, sans carte bancaire ni installation. Le pilote privé valide le produit auprès d’utilisateurs réels avant l’ouverture des ventes.",
    descDe:
      "Beispieldaten, ohne Kreditkarte und ohne Installation. Das private Pilotprojekt prüft das Produkt mit echten Nutzern vor dem Verkaufsstart.",
    descIt:
      "Dati di esempio, nessuna carta richiesta e nessuna installazione. Il progetto pilota convalida il prodotto con utenti reali prima dell’apertura delle vendite.",
    href: "/demo",
    pruebaEs: "Recorrer la demo entera",
    pruebaEn: "Walk the whole demo",
    pruebaPt: "Percorrer a demo inteira",
    pruebaFr: "Parcourir toute la démo",
    pruebaDe: "Gesamte Demo ansehen",
    pruebaIt: "Esplora l’intera demo",
  },
  {
    titleEs: "Disciplina antes que métricas",
    titleEn: "Discipline before metrics",
    titlePt: "Disciplina antes das métricas",
    titleFr: "La discipline avant les métriques",
    titleDe: "Disziplin vor Kennzahlen",
    titleIt: "La disciplina prima delle metriche",
    descEs:
      "Las métricas sin disciplina son ruido. El Guardián te avisa antes de romper tus reglas y, si lo activas, te frena.",
    descEn:
      "Metrics without discipline are noise. The Guardian warns you before you break your rules and, if you turn it on, stops you.",
    descPt:
      "Métricas sem disciplina são ruído. O Guardião avisa antes de quebrar suas regras e, se ativado, interrompe você.",
    descFr:
      "Les métriques sans discipline ne sont que du bruit. Le Gardien vous avertit avant d’enfreindre vos règles et, si vous l’activez, vous bloque.",
    descDe:
      "Kennzahlen ohne Disziplin sind Rauschen. Der Guard warnt Sie vor Regelverstößen und bremst Sie bei Bedarf.",
    descIt:
      "Le metriche senza disciplina sono solo rumore. Il Guardiano ti avvisa prima di infrangere le tue regole e, se lo attivi, ti ferma.",
    href: "/features/disciplina",
    pruebaEs: "Cómo frena el Guardián",
    pruebaEn: "How the brake works",
    pruebaPt: "Como o Guardião freia",
    pruebaFr: "Comment agit le frein",
    pruebaDe: "Wie die Bremse wirkt",
    pruebaIt: "Come agisce il Guardiano",
  },
  {
    /* Un principio tiene que poder comprobarse: este se comprueba en la ficha técnica. */
    titleEs: "Hecha para tenerla abierta mientras operas",
    titleEn: "Built to stay open while you trade",
    titlePt: "Feito para ficar aberto enquanto você opera",
    titleFr: "Conçu pour rester ouvert pendant vos sessions",
    titleDe: "Gebaut, um beim Trading offen zu bleiben",
    titleIt: "Creata per restare aperta durante il trading",
    descEs:
      "Una app de escritorio que arranca en menos de un segundo, funciona sin conexión y no te pide cuenta.",
    descEn:
      "A desktop app that starts in under a second, works offline and asks for no account.",
    descPt:
      "Um app desktop que inicia em menos de um segundo, funciona offline e não pede conta.",
    descFr:
      "Une application de bureau qui démarre en moins d’une seconde, fonctionne hors ligne et ne réclame aucun compte.",
    descDe:
      "Eine Desktop-App, die in unter einer Sekunde startet, offline funktioniert und kein Konto verlangt.",
    descIt:
      "Un’applicazione desktop che si avvia in meno di un secondo, funziona offline e non richiede alcun account.",
    href: "/features/seguridad#ficha-tecnica",
    pruebaEs: "Ver la ficha técnica",
    pruebaEn: "See the spec sheet",
    pruebaPt: "Ver a ficha técnica",
    pruebaFr: "Consulter la fiche technique",
    pruebaDe: "Datenblatt ansehen",
    pruebaIt: "Consulta la scheda tecnica",
  },
];

export function Values() {
  const { lang } = useLang();

  return (
    <section id="values" className="section relative overflow-clip scroll-mt-24">

      <div className="relative z-10 tj-container">
        <SectionHeader
          composicion="partida"
          titulo={tx(lang, {
            es: <>Lo que creemos.</>,
            en: <>What we believe.</>,
            pt: <>No que acreditamos.</>,
            fr: <>Ce que nous croyons.</>,
            de: <>Woran wir glauben.</>,
            it: <>In cosa crediamo.</>,
          })}
          entradilla={tx(lang, {
            es: "Cuatro ideas que no son negociables. Si algún día dejamos de cumplirlas, la app deja de tener sentido.",
            en: "Four ideas that aren’t negotiable. If we ever stop delivering on them, the app stops making sense.",
            pt: "Quatro ideias não negociáveis. Se um dia deixarmos de cumpri-las, o app perde o sentido.",
            fr: "Quatre principes non négociables. Si nous cessions de les respecter, l’application perdrait tout son sens.",
            de: "Vier nicht verhandelbare Grundsätze. Sollten wir sie je aufgeben, verliert die App ihren Sinn.",
            it: "Quattro principi non negoziabili. Se un giorno smettessimo di rispettarli, l’app perderebbe ogni significato.",
          })}
        />

        <div className="mt-10 grid md:grid-cols-2 border-t border-[var(--line)]">
          {VALUES.map((v, i) => (
            <Reveal key={v.href} delay={0.1 + i * 0.08} className="h-full">
              <article
                className={`group relative flex h-full flex-col border-b border-[var(--line)] py-6 md:py-10 ${
                  i % 2 === 1 ? "md:border-l md:pl-12" : "md:pr-12"
                }`}
              >
                <h3 className="t-h3 text-primary">
                  {tx(lang, { es: v.titleEs, en: v.titleEn, pt: v.titlePt, fr: v.titleFr, de: v.titleDe, it: v.titleIt })}
                </h3>
                <p className="mt-2.5 text-[15px] text-secondary leading-[1.7] max-w-[42em]">
                  {tx(lang, { es: v.descEs, en: v.descEn, pt: v.descPt, fr: v.descFr, de: v.descDe, it: v.descIt })}
                </p>

                {/* `mt-auto`: los enlaces de una fila quedan a la misma altura aunque
                    los cuerpos midan dos o tres líneas. */}
                <Link
                  href={v.href}
                  className="link-underline-host mt-auto pt-2 inline-flex min-h-[44px] items-center text-sm font-medium text-primary outline-none focus-visible:rounded-[4px] focus-visible:ring-2 focus-visible:ring-[rgb(var(--accent-base)/0.55)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]"
                >
                  <span className="link-underline">{tx(lang, { es: v.pruebaEs, en: v.pruebaEn, pt: v.pruebaPt, fr: v.pruebaFr, de: v.pruebaDe, it: v.pruebaIt })}</span>
                </Link>
              </article>
            </Reveal>
          ))}
        </div>

      </div>
    </section>
  );
}
