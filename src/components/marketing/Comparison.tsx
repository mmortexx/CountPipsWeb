"use client";

import { useLang, tx, type Lang, type TextosIdioma } from "@/lib/i18n";
import { Reveal } from "@/components/tj/Reveal";
import { SectionHeader } from "@/components/layout/SectionHeader";
import { METRICAS, PROGRAMA } from "@/lib/producto";

const N = PROGRAMA.metricasMinimo;

/* Las celdas de texto llevan su idioma; los símbolos los traduce `Celda`. */
type Texto = TextosIdioma<string>;
type Cell = "yes" | "yes-pro" | "no" | "partial" | Texto;
type Row = { label: TextosIdioma<string>; cells: [Cell, Cell, Cell] };

const ROWS: Row[] = [
  {
    label: {
      es: "Dónde viven tus datos",
      en: "Where your data lives",
      pt: "Onde seus dados ficam",
      fr: "Où vivent vos données",
      de: "Wo Ihre Daten liegen",
      it: "Dove risiedono i tuoi dati",
    },
    cells: [
      {
        es: "Tu equipo",
        en: "Your machine",
        pt: "Sua máquina",
        fr: "Votre machine",
        de: "Ihr Rechner",
        it: "Il tuo computer",
      },
      {
        es: "Servidor del proveedor",
        en: "The vendor’s server",
        pt: "Servidor do provedor",
        fr: "Serveur du fournisseur",
        de: "Server des Anbieters",
        it: "Server del fornitore",
      },
      {
        es: "Tu equipo",
        en: "Your machine",
        pt: "Sua máquina",
        fr: "Votre machine",
        de: "Ihr Rechner",
        it: "Il tuo computer",
      },
    ],
  },
  {
    label: {
      es: "Modelo de pago",
      en: "Payment model",
      pt: "Modelo de pagamento",
      fr: "Modèle de paiement",
      de: "Zahlungsmodell",
      it: "Modello di pagamento",
    },
    cells: [
      {
        es: "Pago único previsto",
        en: "Planned one-time payment",
        pt: "Pagamento único previsto",
        fr: "Paiement unique prévu",
        de: "Einmalzahlung geplant",
        it: "Pagamento unico previsto",
      },
      {
        es: "Suscripción mensual o anual",
        en: "Monthly or annual subscription",
        pt: "Assinatura mensal ou anual",
        fr: "Abonnement mensuel ou annuel",
        de: "Monats- oder Jahresabo",
        it: "Abbonamento mensile o annuale",
      },
      {
        es: "Sin coste añadido",
        en: "No extra cost",
        pt: "Sem custo adicional",
        fr: "Sans surcoût",
        de: "Keine Zusatzkosten",
        it: "Senza costi aggiuntivi",
      },
    ],
  },
  {
    label: {
      es: "Métricas calculadas solas",
      en: "Metrics computed for you",
      pt: "Métricas calculadas sozinhas",
      fr: "Métriques calculées automatiquement",
      de: "Automatisch berechnete Kennzahlen",
      it: "Metriche calcolate in automatico",
    },
    cells: [
      { es: `Más de ${N}`, en: METRICAS, pt: `Mais de ${N}`, fr: `Plus de ${N}`, de: `Über ${N}`, it: `Oltre ${N}` },
      "yes",
      {
        es: "A mano, con fórmulas",
        en: "By hand, with formulas",
        pt: "Manualmente, com fórmulas",
        fr: "À la main, avec des formules",
        de: "Manuell, mit Formeln",
        it: "A mano, con formule",
      },
    ],
  },
  {
    label: {
      es: "Funciona sin internet",
      en: "Works offline",
      pt: "Funciona sem internet",
      fr: "Fonctionne sans connexion",
      de: "Funktioniert offline",
      it: "Funziona offline",
    },
    cells: ["yes", "no", "yes"],
  },
  {
    label: {
      es: "Tu historial si dejas de pagar",
      en: "Your history if you stop paying",
      pt: "Seu histórico se parar de pagar",
      fr: "Votre historique si vous cessez de payer",
      de: "Ihre Historie bei Zahlungsstopp",
      it: "La tua cronologia se smetti di pagare",
    },
    cells: [
      {
        es: "Siempre legible y exportable",
        en: "Always readable and exportable",
        pt: "Sempre legível e exportável",
        fr: "Toujours lisible et exportable",
        de: "Immer lesbar und exportierbar",
        it: "Sempre leggibile ed esportabile",
      },
      {
        es: "Depende del proveedor",
        en: "Up to the vendor",
        pt: "Depende do provedor",
        fr: "Dépend du fournisseur",
        de: "Hängt vom Anbieter ab",
        it: "Dipende dal fornitore",
      },
      {
        es: "Tuyo",
        en: "Yours",
        pt: "Seu",
        fr: "À vous",
        de: "Ihnen",
        it: "Tuo",
      },
    ],
  },
  {
    label: {
      es: "Español nativo",
      en: "Native Spanish and English",
      pt: "Espanhol e inglês nativos",
      fr: "Espagnol et anglais natifs",
      de: "Spanisch und Englisch nativ",
      it: "Spagnolo e inglese nativi",
    },
    cells: ["yes", "no", "yes"],
  },
  {
    label: {
      es: "Sin crear una cuenta",
      en: "No account to create",
      pt: "Sem criar conta",
      fr: "Sans création de compte",
      de: "Ohne Kontoerstellung",
      it: "Senza creare un account",
    },
    cells: ["yes", "no", "yes"],
  },
  {
    label: {
      es: "Modo prop firm",
      en: "Prop firm mode",
      pt: "Modo prop firm",
      fr: "Mode prop firm",
      de: "Prop-Firm-Modus",
      it: "Modalità prop firm",
    },
    cells: ["yes-pro", "partial", "no"],
  },
];

/** Comparativa: CountPips frente a diarios en la nube y hoja de cálculo. */
export function Comparison() {
  const { lang } = useLang();

  const cols = [
    { key: "tj", label: "CountPips", sub: tx(lang, { es: "Esta app", en: "This app", pt: "Este app", fr: "Cette app", de: "Diese App", it: "Questa app" }) },
    {
      key: "cloud",
      label: tx(lang, { es: "Diarios en la nube", en: "Cloud journals", pt: "Diários na nuvem", fr: "Journaux cloud", de: "Cloud-Journale", it: "Journal su cloud" }),
      sub: tx(lang, { es: "Suscripción", en: "Subscription", pt: "Assinatura", fr: "Abonnement", de: "Abo", it: "Abbonamento" }),
    },
    {
      key: "excel",
      label: "Excel / Sheets",
      sub: tx(lang, { es: "Hoja de cálculo", en: "Spreadsheet", pt: "Planilha", fr: "Tableur", de: "Tabellenkalkulation", it: "Foglio di calcolo" }),
    },
  ];

  const fondo = { backgroundColor: "var(--bg)" };
  const banda = { backgroundColor: "var(--surface)" };

  return (
    <section className="section cv-auto relative overflow-clip">
      <div className="relative z-10 tj-container">
        <SectionHeader
          composicion="partida"
          etiqueta={tx(lang, { es: "Comparativa", en: "Comparison", pt: "Comparativo", fr: "Comparatif", de: "Vergleich", it: "Confronto" })}
          titulo={tx(lang, {
            es: <>No es lo mismo medir que apuntar.</>,
            en: <>Measuring is not writing it down.</>,
            pt: <>Medir não é o mesmo que anotar.</>,
            fr: <>Mesurer n’est pas simplement noter.</>,
            de: <>Messen ist nicht bloßes Notieren.</>,
            it: <>Misurare non è solo annotare.</>,
          })}
          entradilla={tx(lang, {
            es: "Una hoja de cálculo guarda lo que apuntas; un diario en la nube lo calcula en su servidor. CountPips lo calcula en tu equipo.",
            en: "A spreadsheet stores what you write down; a cloud journal computes it on its server. CountPips computes it on your machine.",
            pt: "Uma planilha guarda o que você anota; um diário na nuvem calcula no servidor dele. O CountPips calcula na sua máquina.",
            fr: "Un tableur conserve ce que vous notez ; un journal cloud calcule sur son serveur. CountPips calcule sur votre machine.",
            de: "Eine Tabelle speichert, was Sie notieren; ein Cloud-Journal rechnet auf dem Server. CountPips rechnet auf Ihrem Rechner.",
            it: "Un foglio di calcolo memorizza ciò che segni; un journal cloud calcola sui suoi server. CountPips calcola sul tuo computer.",
          })}
        />

        {/* En móvil, una ficha por fila: la tabla de cuatro columnas no cabe. */}
        <Reveal delay={0.08} className="mt-8 md:hidden">
          <div className="border-t border-[var(--line-2)]">
            {ROWS.map((row) => (
              <div key={row.label.es} className="border-b border-[var(--line)] py-4">
                <h3 className="t-h5 m-0 text-primary">{tx(lang, row.label)}</h3>
                <dl className="m-0 mt-2.5 grid grid-cols-[minmax(0,8.5rem)_minmax(0,1fr)] items-baseline gap-x-4 gap-y-1.5">
                  {cols.map((c, j) => (
                    <div key={c.key} className="contents">
                      <dt className={`text-sm ${j === 0 ? "font-medium text-primary" : "text-tertiary"}`}>{c.label}</dt>
                      <dd className="m-0">
                        <Celda cell={row.cells[j]} destacada={j === 0} lang={lang} />
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            ))}
          </div>
        </Reveal>

        <Reveal delay={0.08} className="mt-10 hidden md:block">
          <div className="relative overflow-x-auto lg:overflow-x-clip">
            <div className="relative w-full min-w-[680px]">
              <table className="w-full table-fixed text-sm tnum">
                <colgroup>
                  <col className="w-[31%]" />
                  <col className="w-[27%]" />
                  <col className="w-[21%]" />
                  <col className="w-[21%]" />
                </colgroup>
                <thead>
                  <tr className="border-b border-[var(--line-2)]">
                    <th scope="col" className="sticky left-0 z-20 p-5 pl-0 text-left align-bottom text-[13px] font-medium text-tertiary md:p-6 md:pl-0" style={fondo}>
                      <span className="sr-only">{tx(lang, { es: "Característica", en: "Feature", pt: "Recurso", fr: "Fonctionnalité", de: "Merkmal", it: "Funzionalità" })}</span>
                    </th>
                    {cols.map((c, j) => (
                      <th
                        key={c.key}
                        scope="col"
                        className="p-5 text-left align-bottom md:p-6"
                        style={j === 0 ? banda : fondo}
                      >
                        <div className="t-h5 text-primary">{c.label}</div>
                        <div className="mt-0.5 text-[13px] font-normal text-tertiary">{c.sub}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ROWS.map((row) => (
                    <tr data-entra="ciclo" key={row.label.es} className="border-b border-[var(--line)]">
                      <th scope="row" className="sticky left-0 z-10 h-16 p-5 pl-0 text-left align-middle text-[14px] font-normal text-secondary md:p-6 md:pl-0" style={fondo}>
                        {tx(lang, row.label)}
                      </th>
                      {row.cells.map((cell, j) => (
                        <td
                          key={j}
                          className="h-16 p-5 align-middle md:p-6"
                          style={j === 0 ? banda : undefined}
                        >
                          <Celda cell={cell} destacada={j === 0} lang={lang} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.12} className="mt-6">
          <p className="medida m-0 text-[13px] leading-[1.6] text-tertiary">
            {tx(lang, {
              es: "Diarios en la nube: TradeZella, TraderSync, TradesViz y Tradervue, según sus webs en septiembre de 2026; TradesViz y Tradervue tienen además un plan gratuito limitado. Hoja de cálculo sin plantillas avanzadas.",
              en: "Cloud journals: TradeZella, TraderSync, TradesViz and Tradervue, as published on their websites in September 2026; TradesViz and Tradervue also offer a limited free plan. Spreadsheet without advanced templates.",
              pt: "Diários na nuvem: TradeZella, TraderSync, TradesViz e Tradervue, segundo seus sites em setembro de 2026; TradesViz e Tradervue oferecem também um plano gratuito limitado. Planilha sem modelos avançados.",
              fr: "Journaux cloud : TradeZella, TraderSync, TradesViz et Tradervue, selon leurs sites en septembre 2026 ; TradesViz et Tradervue proposent aussi un forfait gratuit limité. Tableur sans modèles avancés.",
              de: "Cloud-Journale: TradeZella, TraderSync, TradesViz und Tradervue laut deren Websites im September 2026; TradesViz und Tradervue bieten zudem einen begrenzten Gratis-Tarif. Tabellenkalkulation ohne erweiterte Vorlagen.",
              it: "Journal su cloud: TradeZella, TraderSync, TradesViz e Tradervue, secondo i loro siti a settembre 2026; TradesViz e Tradervue offrono anche un piano gratuito limitato. Foglio di calcolo senza template avanzati.",
            })}
          </p>
        </Reveal>
      </div>
    </section>
  );
}

function Celda({ cell, destacada, lang }: { cell: Cell; destacada: boolean; lang: Lang }) {
  if (cell === "yes" || cell === "yes-pro") {
    return (
      <span className={`text-[14px] ${destacada ? "font-medium text-primary" : "text-secondary"}`}>
        {cell === "yes-pro"
          ? tx(lang, {
              es: "Sí, en Pro",
              en: "Yes, in Pro",
              pt: "Sim, no Pro",
              fr: "Oui, dans Pro",
              de: "Ja, in Pro",
              it: "Sì, in Pro",
            })
          : tx(lang, {
              es: "Sí",
              en: "Yes",
              pt: "Sim",
              fr: "Oui",
              de: "Ja",
              it: "Sì",
            })}
      </span>
    );
  }
  if (cell === "no") {
    return (
      <span className="text-[14px] text-tertiary">
        {tx(lang, { es: "No", en: "No", pt: "Não", fr: "Non", de: "Nein", it: "No" })}
      </span>
    );
  }
  if (cell === "partial") {
    return (
      <span className="text-[14px] text-tertiary">
        {tx(lang, { es: "Parcial", en: "Partial", pt: "Parcial", fr: "Partiel", de: "Teilweise", it: "Parziale" })}
      </span>
    );
  }
  return <span className={`text-[14px] ${destacada ? "font-medium text-primary" : "text-secondary"}`}>{tx(lang, cell)}</span>;
}
