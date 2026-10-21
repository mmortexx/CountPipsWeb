"use client";

import type { CSSProperties } from "react";
import { useViaje } from "@/hooks/use-viaje";

/** La pieza que viaja entre opciones (ver `useViaje`). Se pinta solo en la opción activa. */
export function Viajero({
  clave,
  className,
  style,
  ms,
  curva,
}: {
  clave: string;
  className?: string;
  style?: CSSProperties;
  ms?: number;
  curva?: string;
}) {
  const ref = useViaje<HTMLSpanElement>(clave, ms, curva);
  // `data-viajero`: en alto contraste se pinta del color de selección del sistema (globals.css).
  return <span ref={ref} data-viajero="" aria-hidden="true" className={className} style={style} />;
}
