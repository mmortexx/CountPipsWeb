"use client";

import { useLang } from "@/lib/i18n";
import { Reveal } from "@/components/tj/Reveal";
import { SectionHeader } from "@/components/layout/SectionHeader";
import { PROGRAMA, arranqueMedido } from "@/lib/producto";
import { fmtInt } from "@/lib/trading/format";

interface SpecRow {
  /** Rótulo y valor bilingües. */
  labelEs: string;
  labelEn: string;
  valueEs: string;
  valueEn: string;
  mono?: boolean;
}

/**
 * Ficha técnica como retícula de filetes con ocho pares etiqueta/valor
 * (`<dl>`/`<dt>`/`<dd>`). `border-t` en el contenedor cierra por arriba, cada
 * celda pone su `border-b` y la segunda columna añade `border-l` solo desde
 * `sm` (en móvil hay una columna).
 */
export function TechSpecs() {
  const { lang } = useLang();
  const es = lang === "es";

  const rows: SpecRow[] = [
    {
      labelEs: "Plataforma",
      labelEn: "Platform",
      valueEs: "Windows 10/11 de 64 bits (x64), nativa: WinUI 3",
      valueEn: "64-bit Windows 10/11 (x64), native: WinUI 3",
    },
    {
      labelEs: "Arranque",
      labelEn: "Startup",
      valueEs: arranqueMedido("es"),
      valueEn: arranqueMedido("en"),
    },
    {
      labelEs: "Carpeta de datos",
      labelEn: "Data folder",
      valueEs: PROGRAMA.carpetaDatos,
      valueEn: PROGRAMA.carpetaDatos,
      mono: true,
    },
    {
      labelEs: "Base de datos",
      labelEn: "Database",
      valueEs: "SQLite en modo WAL, un único archivo de base de datos",
      valueEn: "SQLite in WAL mode, a single database file",
    },
    {
      labelEs: "Cifrado en reposo",
      labelEn: "Encryption at rest",
      valueEs: "EFS de Windows, opcional; no en Windows Home",
      valueEn: "Windows EFS, optional; not on Windows Home",
    },
    {
      labelEs: "Copias cifradas",
      labelEn: "Encrypted copies",
      valueEs: `AES-256-GCM · PBKDF2 ${fmtInt(PROGRAMA.pbkdf2Iteraciones, "es")}, opcionales`,
      valueEn: `AES-256-GCM · PBKDF2 ${fmtInt(PROGRAMA.pbkdf2Iteraciones, "en")}, optional`,
      mono: true,
    },
    {
      labelEs: "Exportación",
      labelEn: "Export",
      valueEs: "CSV, JSON completo, PDF y Markdown",
      valueEn: "CSV, full JSON, PDF and Markdown",
    },
    {
      labelEs: "Idiomas",
      labelEn: "Languages",
      valueEs: "Español e inglés",
      valueEn: "Spanish and English",
    },
  ];

  return (
    <section id="ficha-tecnica" className="section relative overflow-clip scroll-mt-24">
      <div className="relative tj-container">
        <SectionHeader
          composicion="partida"
          etiqueta={es ? "Técnico" : "Technical"}
          titulo={
            es ? (
              <>
                Construido para durar.
              </>
            ) : (
              <>
                Built to last.
              </>
            )
          }
          entradilla={
            es
              ? "Aplicación nativa de Windows sin cuenta ni telemetría. Solo se conecta para lo que tú activas: la licencia, las actualizaciones que pidas y las funciones opcionales."
              : "A native Windows app with no account and no telemetry. It only connects for what you turn on: the licence, the updates you ask for and the optional features."
          }
        />
        <Reveal delay={0.1} y={28} className="mt-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 border-t border-[var(--line-2)]">
            {rows.map((r) => (
              <dl
                key={r.labelEn}
                data-entra="ciclo"
                className="flex flex-col gap-1 min-w-0 py-4 pr-6 border-b border-[var(--line)] sm:[&:nth-child(even)]:pl-6 sm:[&:nth-child(even)]:border-l sm:[&:nth-child(even)]:border-l-[var(--line)]"
              >
                <dt className="text-tertiary text-[12px]">
                  {es ? r.labelEs : r.labelEn}
                </dt>
                <dd className={`m-0 text-primary font-medium leading-snug [overflow-wrap:anywhere] ${r.mono ? "font-mono text-[13px]" : "text-sm tnum tracking-[-0.005em]"}`}>
                  {es ? r.valueEs : r.valueEn}
                </dd>
              </dl>
            ))}
          </div>
        </Reveal>

        <Reveal delay={0.2} className="mt-6">
          <p className="medida text-xs text-tertiary leading-[1.6]">
            <span>
              {es
                ? `Activar la licencia pide conexión una vez; después funciona sin ella. Se revalida como mucho una vez al día y aguanta ${PROGRAMA.graciaSinRedDias} días sin red; si caduca, la app pasa a solo lectura y puedes seguir consultando, exportando y copiando tus datos.`
                : `Activating the licence needs a connection once; after that it works offline. It is revalidated at most once a day and lasts ${PROGRAMA.graciaSinRedDias} days without a connection; if it lapses, the app switches to read-only and you can still view, export and back up your data.`}
            </span>
          </p>
        </Reveal>
      </div>
    </section>
  );
}
