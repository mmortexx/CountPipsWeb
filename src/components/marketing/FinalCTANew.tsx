"use client";

import { Link } from "@/components/tj/LocaleLink";
import { ArrowRight, Check, Play } from "lucide-react";
import { useLang } from "@/lib/i18n";

/**
 * FinalCTANew — CTA de cierre, sin vídeo HLS (se omitió por la
 * complejidad y porque el sitio es dark por defecto — el vídeo
 * añadiría una dependencia externa más). El halo verde + el patrón
 * del HTML se conservan.
 *
 * ── ESTE FICHERO ERA EL QUE LE COBRABA FRAMER-MOTION A MEDIO SITIO ────
 * Llevaba cuatro `<motion.*>` con el patrón de siempre:
 * `initial={{opacity:0,y:16}} whileInView={{opacity:1,y:0}}` con
 * retardos de 0, 0,10, 0,18 y 0,30 s.
 *
 * El cierre aparece en TODAS las páginas de plantilla —las de glosario,
 * las de herramientas, las de perfil de trader—, y como `framer-motion`
 * viaja en un trozo compartido, esas páginas descargaban la biblioteca
 * entera (36 KB comprimidos) para animar cuatro entradas. Medido: una
 * página de glosario pedía 242 KB brotli y una legal, que no la lleva,
 * 205 KB.
 *
 * Los cuatro `data-entra` de abajo hacen lo mismo con el mecanismo que
 * ya usa el resto del sitio (`animation-timeline: view()`, ver
 * globals.css): los escalones 1-4 reproducen el mismo orden de lectura
 * que los retardos originales. Y son mejores en dos cosas concretas: el
 * progreso lo lleva el compositor —así que el movimiento sigue al dedo
 * en un scroll táctil en vez de reproducirse a su ritmo— y no dependen
 * de que arranque JavaScript, así que el texto se lee igual sin él.
 */
export function FinalCTANew() {
  const { lang } = useLang();
  const es = lang === "es";
  return (
    <section
      className="section relative overflow-clip border-t border-[rgb(var(--divider)/0.06)]"
    >
      {/* Halo "núcleo + corona" retirado (rediseño institucional). Eran
          DOS discos de acento difuminados y superpuestos detrás del
          titular de cierre. Buscaban un efecto premium, pero el
          resultado era una mancha dorada difusa justo donde debe mandar
          el mensaje de compra. El titular y el CTA se sostienen solos. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 80% at 50% 120%, transparent, var(--bg) 78%)",
        }}
      />
      <div className="tj-legible-text relative max-w-[820px] mx-auto px-[clamp(1.25rem,4vw,2.25rem)] text-center">
        <h2
          data-entra
          className="font-serif m-0"
          style={{
            fontSize: "clamp(2.4rem, 5.5vw, 4.5rem)",
            fontWeight: 400,
            letterSpacing: "-0.03em",
            lineHeight: 1.05,
            color: "var(--ink)",
            textWrap: "balance",
          }}
        >
          {es ? (
            <>
              Deja de operar a ciegas.<br />
              <span style={{ color: "rgb(var(--accent-base))" }}>Mira cómo se mide.</span>
            </>
          ) : (
            <>
              Stop trading blind.<br />
              <span style={{ color: "rgb(var(--accent-base))" }}>See how it is measured.</span>
            </>
          )}
        </h2>
        <p
          data-entra="2"
          className="mt-6 mx-auto"
          style={{
            fontSize: "clamp(1.05rem, 1.4vw, 1.2rem)",
            lineHeight: 1.62,
            color: "var(--ink-2)",
            maxWidth: "44em",
          }}
        >
          {es
            ? "40+ métricas, guardián de disciplina y tus datos en tu máquina. Explora la demo con datos de muestra y decide con criterio."
            : "40+ metrics, a discipline guardian, and your data on your machine. Explore the sample-data demo and decide with clarity."}
        </p>
        <div
          data-entra="3"
          // T2d — `gap-3.5` (14px) entre CTAs (era `gap-3` 12px) para
          // que el par primary/secondary respire cuando envuelven en
          // móvil estrecho. Sutil pero consistente con el gap-3.5 del
          // strip de garantías abajo.
          className="mt-9 flex flex-wrap items-center justify-center gap-3.5"
        >
          <Link
            href="/demo"
            // T2d — `px-6 sm:px-8` en ambos CTAs (era `px-8` fijo):
            // en 320px el botón primario de la demo + icono
            // medía ~281px y desbordaba los 280px de contenido útil
            // (320 − 2×20 de px-5 del contenedor). Bajar a 24px de
            // padding en móvil lo deja en ~265px y cabe con holgura;
            // en sm+ se restaura 32px para mantener el respiro premium.
            // P1-r2 — `transition-colors duration-150` →
            // `transition-[background-color,border-color,transform] duration-200
            // ease-[var(--ease-suave)]` + `hover:-translate-y-0.5` +
            // `active:translate-y-0`: paridad exacta con Hero. Los dos CTAs
            // de cierre ahora tienen el mismo gesto de lift que los del Hero,
            // cerrando el lenguaje de interacción de la home.
            className="inline-flex h-[52px] items-center gap-2.5 rounded-[2px] px-6 sm:px-8 text-base font-semibold outline-none transition-[background-color,border-color,transform] duration-200 ease-[var(--ease-suave)] hover:bg-[rgb(var(--accent-hover))] hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-[rgb(var(--accent-base)/0.55)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)] active:translate-y-0"
            style={{ background: "rgb(var(--accent-base))", color: "rgb(var(--accent-ink))" }}
          >
            {es ? "Ver la demo" : "See the demo"}
            <ArrowRight size={17} aria-hidden />
          </Link>
          <Link
            href="/pricing"
            className="inline-flex h-[52px] items-center gap-2.5 rounded-[2px] border px-6 sm:px-8 text-base font-semibold text-[var(--ink)] outline-none transition-[background-color,border-color,transform] duration-200 ease-[var(--ease-suave)] hover:bg-[color-mix(in_srgb,var(--ink)_6%,transparent)] hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-[rgb(var(--accent-base)/0.55)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)] active:translate-y-0"
            style={{ borderColor: "rgb(var(--divider) / 0.20)" }}
          >
            {/* R25-1e — Play icon prefix matches the Hero's "Ver la demo"
                button pattern so the two CTAs read as a coordinated pair
                across the site (primary = ArrowRight suffix, secondary =
                Play prefix). */}
            <Play size={15} fill="currentColor" aria-hidden />
            {es ? "Ver precios" : "See pricing"}
          </Link>
        </div>
        <div
          data-entra="4"
          // T2d — `gap-y-2.5` (10px) entre garantías cuando envuelven
          // (era `gap-y-2` 8px). En 320px las 4 garantías caen a 2
          // líneas; 10px de gap vertical las separa sin abrir un hueco
          // tipográfico.
          className="mt-9 flex flex-wrap items-center justify-center gap-x-6 gap-y-2.5"
        >
          {[
            es ? "Datos de muestra" : "Sample data",
            es ? "Sin registro para explorar" : "No sign-up to explore",
            es ? "Acceso anticipado privado" : "Private early access",
            "100 % local",
          ].map((g) => (
            <span
              key={g}
              className="inline-flex items-center gap-1.5"
              style={{ fontSize: 13, color: "var(--ink-2)" }}
            >
              <Check size={14} style={{ color: "rgb(var(--pnl-pos))" }} />
              {g}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
