"use client";

import { Lock } from "lucide-react";
import { useLang } from "@/lib/i18n";
import { Reveal } from "@/components/tj/Reveal";
import { SectionHeader } from "@/components/layout/SectionHeader";

interface SpecRow {
  /** Bilingual label and value. */
  labelEs: string;
  labelEn: string;
  valueEs: string;
  valueEn: string;
}

/**
 * Ficha técnica — plataforma, almacenamiento, RAM, importación y
 * exportación, idiomas, actualizaciones y privacidad.
 *
 * Se publica como RETÍCULA, no como tarjeta: ocho pares etiqueta/valor
 * en una cuadrícula de filetes, sin fondo, sin sombra y sin esquina. El
 * marcado sigue siendo `<dl>` / `<dt>` / `<dd>`, que es lo que
 * corresponde a un par término-definición.
 *
 * Los filetes: `border-t` en el contenedor cierra la retícula por
 * arriba, cada celda pone su `border-b`, y la segunda columna añade un
 * `border-l` sólo a partir de `sm` — en móvil hay una sola columna y esa
 * raya no separaría nada. Ninguna celda descuelga su borde inferior: el
 * último trazo es el que cierra la cuadrícula.
 */
export function TechSpecs() {
  const { lang } = useLang();
  const es = lang === "es";

  const rows: SpecRow[] = [
    {
      labelEs: "Plataforma",
      labelEn: "Platform",
      valueEs: "Windows 10/11 (64-bit)",
      valueEn: "Windows 10/11 (64-bit)",
    },
    {
      labelEs: "Almacenamiento",
      labelEn: "Storage",
      valueEs: "SQLite en %LOCALAPPDATA%\CountPips",
      valueEn: "SQLite in %LOCALAPPDATA%\CountPips",
    },
    {
      labelEs: "Arranque",
      labelEn: "Startup",
      valueEs: "0,7 s con 50.000 operaciones (medido)",
      valueEn: "0.7 s with 50,000 trades (measured)",
    },
    {
      labelEs: "Importación",
      labelEn: "Import",
      valueEs: "Cualquier CSV con mapeo de columnas · Binance en solo lectura",
      valueEn: "Any CSV with column mapping · read-only Binance sync",
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
      valueEs: "Español + Inglés",
      valueEn: "Spanish + English",
    },
    {
      labelEs: "Actualizaciones",
      labelEn: "Updates",
      valueEs: "Solo cuando las pides; nunca se instala sola",
      valueEn: "Only when you ask; never installs by itself",
    },
    {
      labelEs: "Privacidad",
      labelEn: "Privacy",
      valueEs: "Sin cuenta y sin telemetría",
      valueEn: "No account and no telemetry",
    },
  ];

  return (
    <section className="section relative overflow-clip">
      <div className="relative tj-container">
        <SectionHeader
          composicion="partida"
          etiqueta={es ? "Técnico" : "Technical"}
          titulo={
            es ? (
              <>
                Construido <span className="text-gradient">para durar.</span>
              </>
            ) : (
              <>
                Built <span className="text-gradient">to last.</span>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 border-t border-[rgb(var(--divider)/0.14)]">
            {rows.map((r) => (
              <dl
                key={r.labelEn}
                data-entra="ciclo"
                /* El filete vertical sólo en la segunda columna y sólo
                   cuando hay dos: en móvil la retícula es una sola
                   columna y una raya a la izquierda no separaría nada. */
                className="flex flex-col gap-1 min-w-0 py-4 pr-6 border-b border-[rgb(var(--divider)/0.14)] sm:[&:nth-child(even)]:pl-6 sm:[&:nth-child(even)]:border-l sm:[&:nth-child(even)]:border-l-[rgb(var(--divider)/0.14)]"
              >
                {/* Sin el punto de acento que llevaba delante. Con el
                    acento ya acromático era un lunar gris que no decía
                    nada, y en una retícula el separador es el filete. */}
                <dt className="text-tertiary text-[11px] uppercase tracking-[0.08em] font-semibold tnum">
                  {es ? r.labelEs : r.labelEn}
                </dt>
                <dd className="text-primary text-sm font-medium leading-snug tnum tracking-[-0.005em]">
                  {es ? r.valueEs : r.valueEn}
                </dd>
              </dl>
            ))}
          </div>
        </Reveal>

        {/* Footnote */}
        <Reveal delay={0.2} className="mt-6">
          {/* R25-1e — Lock icon prefix promotes the footnote from fine
              print to a deliberate "offline / privacy" callout. The
              accent-tinted icon ties to the section's accent palette. */}
          <p className="text-xs text-tertiary leading-[1.6] flex items-start gap-1.5">
            <Lock size={13} aria-hidden className="mt-0.5 shrink-0 text-[rgb(var(--accent-base)/0.70)]" />
            <span>
              {es
                ? "Funciona sin conexión. La licencia se revalida como mucho una vez al día y aguanta 30 días sin red; si caduca, la app pasa a solo lectura y tus datos siguen siendo tuyos."
                : "Works offline. The licence is revalidated at most once a day and lasts 30 days without a connection; if it lapses, the app switches to read-only and your data stays yours."}
            </span>
          </p>
        </Reveal>
      </div>
    </section>
  );
}
