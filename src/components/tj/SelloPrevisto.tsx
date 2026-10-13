"use client";

import { useLang, tx } from "@/lib/i18n";

/**
 * Rótulo único para «esto todavía no existe» (precios previstos, acceso
 * anticipado, funciones planificadas), para que todo el sitio lo diga igual.
 * Va recto, en tinta secundaria y sin color de alerta. No atenúa lo que
 * envuelve: lo previsto no está deshabilitado, solo llega después.
 */

export function SelloPrevisto({
  es: textoEs,
  en: textoEn,
  pt: textoPt,
  fr: textoFr,
  de: textoDe,
  it: textoIt,
  detalleEs,
  detalleEn,
  detallePt,
  detalleFr,
  detalleDe,
  detalleIt,
  className = "",
}: {
  es?: string;
  en?: string;
  pt?: string;
  fr?: string;
  de?: string;
  it?: string;
  detalleEs?: string;
  detalleEn?: string;
  detallePt?: string;
  detalleFr?: string;
  detalleDe?: string;
  detalleIt?: string;
  className?: string;
}) {
  const { lang } = useLang();
  const texto = tx(lang, {
    es: textoEs ?? "Previsto",
    en: textoEn ?? "Planned",
    pt: textoPt ?? "Previsto",
    fr: textoFr ?? "Prévu",
    de: textoDe ?? "Geplant",
    it: textoIt ?? "Previsto",
  });
  const detalle = tx(lang, {
    es: detalleEs,
    en: detalleEn,
    pt: detallePt,
    fr: detalleFr,
    de: detalleDe,
    it: detalleIt,
  });

  return (
    <span className={`sello-previsto ${className}`}>
      <span className="sello-previsto-texto">{texto}</span>
      {detalle ? <span className="sello-previsto-detalle">{detalle}</span> : null}
    </span>
  );
}
