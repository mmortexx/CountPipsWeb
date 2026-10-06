"use client";

import { useLang } from "@/lib/i18n";

/**
 * Rótulo único para «esto todavía no existe» (precios previstos, acceso
 * anticipado, funciones planificadas), para que todo el sitio lo diga igual.
 * Va recto, en tinta secundaria y sin color de alerta. No atenúa lo que
 * envuelve: lo previsto no está deshabilitado, solo llega después.
 */

export function SelloPrevisto({
  es: textoEs,
  en: textoEn,
  /** Una segunda línea, más pequeña, para cuando el «cuándo» importa. */
  detalleEs,
  detalleEn,
  className = "",
}: {
  es?: string;
  en?: string;
  detalleEs?: string;
  detalleEn?: string;
  className?: string;
}) {
  const { lang } = useLang();
  const es = lang === "es";
  const texto = es ? (textoEs ?? "Previsto") : (textoEn ?? "Planned");
  const detalle = es ? detalleEs : detalleEn;

  return (
    <span className={`sello-previsto ${className}`}>
      <span className="sello-previsto-texto">{texto}</span>
      {detalle ? <span className="sello-previsto-detalle">{detalle}</span> : null}
    </span>
  );
}
