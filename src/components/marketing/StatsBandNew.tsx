"use client";

import type { CSSProperties, ReactNode } from "react";
import { Link } from "@/components/tj/LocaleLink";
import { useLang, tx } from "@/lib/i18n";
import { Reveal } from "@/components/tj/Reveal";
import { FECHA_PUBLICACION, notaCorte } from "@/lib/publicacion";
import { METRICAS } from "@/lib/producto";

/**
 * Banda de credenciales de la home: tres cifras que definen el producto
 * (métricas calculadas, datos que no salen del equipo y calculadoras abiertas),
 * cada una con su nota de fuente y la fecha de corte.
 */
export function StatsBandNew({ herramientas }: { herramientas: number }) {
  const { lang } = useLang();
  const stats = [
    {
      v: `${METRICAS}`,
      l: tx(lang, {
        es: "métricas institucionales calculadas con cada operación",
        en: "institutional metrics computed with every trade",
        pt: "métricas institucionais calculadas a cada operação",
        fr: "métriques institutionnelles calculées à chaque trade",
        de: "institutionelle Kennzahlen, bei jedem Trade berechnet",
        it: "metriche istituzionali calcolate per ogni operazione",
      }),
    },
    {
      v: "0",
      l: tx(lang, {
        es: "servidores de CountPips con tus operaciones: viven en tu equipo",
        en: "CountPips servers holding your trades: they live on your machine",
        pt: "servidores do CountPips com suas operações: ficam na sua máquina",
        fr: "serveur CountPips hébergeant vos opérations\u00a0: elles restent sur votre machine",
        de: "CountPips-Server mit Ihren Trades: sie bleiben auf Ihrem Rechner",
        it: "server CountPips con le tue operazioni: risiedono sul tuo computer",
      }),
    },
    /* La tercera cifra es real y comprobable: las herramientas abiertas hoy.
       La pasa la página al construir (`HERRAMIENTAS`), así que cambia sola. */
    {
      v: String(herramientas),
      l: tx(lang, {
        es: "herramientas gratis en la web: sin registro ni instalación",
        en: "free tools on the site: no sign-up, no install",
        pt: "ferramentas gratuitas no site: sem cadastro nem instalação",
        fr: "outils gratuits sur le site\u00a0: sans inscription ni installation",
        de: "kostenlose Online-Tools: ohne Registrierung oder Installation",
        it: "strumenti gratuiti sul sito: senza registrazione né installazione",
      }),
    },
  ];
  /* Fuente y fecha de corte: una cifra con su llamada y su fecha se lee como
     dato. La fecha es la de publicación, no la del reloj de quien mira. */
  const enlace = (href: string, texto: string) => (
    <Link href={href} className="link-underline-host text-secondary hover:text-primary">
      {texto}
    </Link>
  );
  const notas: ReactNode[] = [
    tx<ReactNode>(lang, {
      es: <>Por operación y por periodo, en la versión en pruebas del programa.</>,
      en: <>Per trade and per period, in the pre-release version of the application.</>,
      pt: <>Por operação e por período, na versão de testes do programa.</>,
      fr: <>Par opération et par période, dans la version préliminaire de l’application.</>,
      de: <>Pro Trade und pro Zeitraum, in der Testversion der Anwendung.</>,
      it: <>Per operazione e per periodo, nella versione di prova dell’applicazione.</>,
    }),
    tx<ReactNode>(lang, {
      es: <>Las operaciones se guardan en un archivo de tu disco; lo que sale a internet está listado en {enlace("/features/seguridad", "Seguridad")}.</>,
      en: <>Trades are stored in a file on your disk; everything that goes online is listed under {enlace("/features/seguridad", "Security")}.</>,
      pt: <>As operações são salvas em um arquivo no seu disco; o que sai para a internet está listado em {enlace("/features/seguridad", "Segurança")}.</>,
      fr: <>Les opérations sont stockées dans un fichier local{"\u00a0"}; tout ce qui transite en ligne est listé dans {enlace("/features/seguridad", "Sécurité")}.</>,
      de: <>Trades werden in einer Datei auf Ihrer Festplatte gespeichert; alle Netzwerkverbindungen sind unter {enlace("/features/seguridad", "Sicherheit")} gelistet.</>,
      it: <>Le operazioni vengono salvate in un file sul tuo disco; ciò che esce su internet è indicato in {enlace("/features/seguridad", "Sicurezza")}.</>,
    }),
    tx<ReactNode>(lang, {
      es: <>Las calculadoras abiertas hoy en {enlace("/herramientas", "Herramientas")}; el test de disciplina no entra en la cuenta.</>,
      en: <>The calculators open today under {enlace("/herramientas", "Tools")}; the discipline test is not counted.</>,
      pt: <>As calculadoras disponíveis hoje em {enlace("/herramientas", "Ferramentas")}; o teste de disciplina não entra na contagem.</>,
      fr: <>Les calculateurs disponibles aujourd’hui dans {enlace("/herramientas", "Outils")} ; le test de discipline n’est pas compté.</>,
      de: <>Verfügbare Rechner unter {enlace("/herramientas", "Tools")}; der Disziplintest zählt nicht dazu.</>,
      it: <>I calcolatori disponibili oggi su {enlace("/herramientas", "Strumenti")}; il test di disciplina non è conteggiato.</>,
    }),
  ];
  const nota = notaCorte(lang, FECHA_PUBLICACION);

  return (
    <section className="section-tight relative">
      <div className="tj-container">
        {/* Filete encima de cada cifra, no entre ellas. En móvil, cifra y texto
            en la misma fila para no ocupar una pantalla entera. */}
        <div className="grid grid-cols-1 gap-y-5 sm:grid-cols-3 sm:gap-x-8">
          {stats.map((s, i) => (
            <Reveal key={s.v} delay={i * 0.06} y={10} className="grid grid-cols-[5.5rem_minmax(0,1fr)] items-center gap-x-4 border-t border-[var(--line-2)] pt-5 sm:flex sm:flex-col sm:items-stretch sm:pt-6">
              <div
                className="tnum text-primary"
                style={{
                  fontSize: "clamp(2.5rem, 4vw, 3.5rem)",
                  fontWeight: 400,
                  letterSpacing: "-0.04em",
                  lineHeight: 1,
                }}
              >
                <span
                  className="tj-cifra-cuenta"
                  style={{ "--hasta": parseInt(s.v, 10) || 0, "--sufijo": `"${s.v.replace(/^\d+/, "")}"` } as CSSProperties}
                >
                  <span className="tj-cifra-real">{s.v}</span>
                </span>
                <sup aria-hidden className="tj-llamada">{i + 1}</sup>
              </div>
              <div className="max-w-[22em] text-balance text-[15px] leading-snug text-secondary sm:mt-3">{s.l}</div>
            </Reveal>
          ))}
        </div>
        <div className="tj-notas-cifras">
          <ol>
            {notas.map((n, i) => (
              <li key={i}>
                <span aria-hidden className="tj-notas-num">{i + 1}</span>
                <span>{n}</span>
              </li>
            ))}
          </ol>
          {nota && <p>{nota}</p>}
        </div>
      </div>
    </section>
  );
}
