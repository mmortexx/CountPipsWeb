"use client";

import type { CSSProperties } from "react";
import { useViaje } from "@/hooks/use-viaje";

/** La pieza que viaja entre opciones (ver `useViaje`). Se pinta solo en la opción activa. */
export function Viajero({
  clave,
  className,
  style,
}: {
  clave: string;
  className?: string;
  style?: CSSProperties;
}) {
  const ref = useViaje<HTMLSpanElement>(clave);
  // `data-viajero`: en alto contraste se pinta del color de selección del sistema (globals.css).
  return <span ref={ref} data-viajero="" aria-hidden="true" className={className} style={style} />;
}
