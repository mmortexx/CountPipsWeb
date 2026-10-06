"use client";

import type { CSSProperties, ReactNode } from "react";
import { Link } from "@/components/tj/LocaleLink";
import { useLang } from "@/lib/i18n";
import { Reveal } from "@/components/tj/Reveal";
import { FECHA_PUBLICACION } from "@/lib/publicacion";
import { LOCALE_FECHA } from "@/lib/trading/format";

/**
 * Banda de credenciales de la home: tres cifras que definen el producto
 * (métricas calculadas, datos que no salen del equipo y calculadoras abiertas),
 * cada una con su nota de fuente y la fecha de corte.
 */
export function StatsBandNew({ herramientas }: { herramientas: number }) {
  const { lang } = useLang();
  const es = lang === "es";
  const stats = [
    { v: "40+", l: es ? "métricas institucionales calculadas con cada operación" : "institutional metrics computed with every trade" },
    { v: "0", l: es ? "servidores de CountPips con tus operaciones: viven en tu equipo" : "CountPips servers holding your trades: they live on your machine" },
    /* La tercera cifra es real y comprobable: las herramientas abiertas hoy.
       La pasa la página al construir (`HERRAMIENTAS`), así que cambia sola. */
    {
      v: String(herramientas),
      l: es
        ? "herramientas gratis en la web: sin registro ni instalación"
        : "free tools on the site: no sign-up, no install",
    },
  ];
  /* Fuente y fecha de corte: una cifra con su llamada y su fecha se lee como
     dato. La fecha es la de publicación, no la del reloj de quien mira. */
  const enlace = (href: string, texto: string) => (
    <Link href={href} className="link-underline-host text-secondary hover:text-primary">
      {texto}
    </Link>
  );
  const notas: ReactNode[] = es
    ? [
        <>Por operación y por periodo, en la versión en pruebas del programa.</>,
        <>Las operaciones se guardan en un archivo de tu disco; lo que sale a internet está listado en {enlace("/features/seguridad", "Seguridad")}.</>,
        <>Las calculadoras abiertas hoy en {enlace("/herramientas", "Herramientas")}; el test de disciplina no entra en la cuenta.</>,
      ]
    : [
        <>Per trade and per period, in the pre-release version of the application.</>,
        <>Trades are stored in a file on your disk; everything that goes online is listed under {enlace("/features/seguridad", "Security")}.</>,
        <>The calculators open today under {enlace("/herramientas", "Tools")}; the discipline test is not counted.</>,
      ];
  const corte = FECHA_PUBLICACION
    ? new Date(FECHA_PUBLICACION).toLocaleDateString(LOCALE_FECHA[es ? "es" : "en"], { year: "numeric", month: "long", timeZone: "UTC" })
    : "";

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
          {corte && <p>{es ? `Cifras a ${corte}.` : `Figures as of ${corte}.`}</p>}
        </div>
      </div>
    </section>
  );
}
