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
      valueEs: "SQLite local (~5MB por 1000 operaciones)",
      valueEn: "Local SQLite (~5MB per 1000 trades)",
    },
    {
      labelEs: "RAM",
      labelEn: "RAM",
      valueEs: "< 200MB en uso",
      valueEn: "< 200MB in use",
    },
    {
      labelEs: "Importación",
      labelEn: "Import",
      valueEs: "CSV universal, mapeo de columnas",
      valueEn: "Universal CSV, column mapping",
    },

    {
      labelEs: "Exportación",
      labelEn: "Export",
      valueEs: "PDF, CSV, JSON",
      valueEn: "PDF, CSV, JSON",
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
      valueEs: "Gratis en tu versión mayor",
      valueEn: "Free within your major version",
    },
    {
      labelEs: "Privacidad",
      labelEn: "Privacy",
      valueEs: "App 100 % local, cero telemetría",
      valueEn: "100% local app, zero telemetry",
    },
  ];

  return (
    <section className="section bg-veil relative overflow-clip">
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
              ? "La aplicación de escritorio no tiene dependencias externas, procesos en segundo plano ni telemetría. Una vez instalada, es tuya."
              : "The desktop application has no external dependencies, no background processes, and zero telemetry. Once installed, it's yours."
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
                <dt className="text-tertiary text-[10px] uppercase tracking-[0.14em] font-semibold tnum">
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
                ? "Sin requisitos de conexión. Funciona en tu equipo aunque mañana cierren internet."
                : "No connection requirements. Runs on your machine even if the internet shuts down tomorrow."}
            </span>
          </p>
        </Reveal>
      </div>
    </section>
  );
}
