"use client";

import { useEffect, useRef, useState } from "react";
import { useLang } from "@/lib/i18n";

type Estado = "listo" | "copiado" | "fallo";

/**
 * El botón «Copiar» de las herramientas. Cada una tenía el suyo, con tres
 * tamaños de letra, dos juegos de iconos y, en cuatro, ningún aviso si el
 * navegador negaba el portapapeles: el botón no hacía nada y no decía nada.
 * Aquí el fallo se dice en el propio botón, y una región viva aparte lo
 * repite para que un lector de pantalla lo oiga.
 */
export function BotonCopiar({
  texto,
  rotulo,
  hecho,
  disabled = false,
}: {
  /** Se compone al pulsar, con las cifras de ese momento. */
  texto: () => string;
  rotulo: string;
  hecho: string;
  disabled?: boolean;
}) {
  const { lang } = useLang();
  const [estado, setEstado] = useState<Estado>("listo");
  const reloj = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (reloj.current) clearTimeout(reloj.current);
  }, []);

  const copiar = async () => {
    let ok = false;
    try {
      await navigator.clipboard.writeText(texto());
      ok = true;
    } catch {
      ok = false;
    }
    setEstado(ok ? "copiado" : "fallo");
    if (reloj.current) clearTimeout(reloj.current);
    reloj.current = setTimeout(() => setEstado("listo"), ok ? 2200 : 4000);
  };

  const fallo = lang === "es" ? "No se pudo copiar" : "Could not copy";

  return (
    <button
      type="button"
      onClick={copiar}
      disabled={disabled}
      className="toque-comodo inline-flex items-center gap-1.5 whitespace-nowrap text-xs font-semibold text-primary outline-none transition-colors hover:text-[rgb(var(--accent-base))] focus-visible:ring-2 focus-visible:ring-[rgb(var(--accent-base)/0.55)] disabled:cursor-not-allowed disabled:opacity-40"
    >
      <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        {estado === "copiado" ? (
          <path d="M3 8.5l3 3 7-7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        ) : (
          <>
            <rect x="5" y="5" width="9" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
            <path d="M11 5V3.5A1.5 1.5 0 0 0 9.5 2h-6A1.5 1.5 0 0 0 2 3.5v6A1.5 1.5 0 0 0 3.5 11H5" stroke="currentColor" strokeWidth="1.3" />
          </>
        )}
      </svg>
      <span>{estado === "copiado" ? hecho : estado === "fallo" ? fallo : rotulo}</span>
      {/* La región viva nace vacía: con el rótulo dentro, el lector de
          pantalla leía «Copiar resumen» al cargar la página. */}
      <span role="status" className="sr-only">
        {estado === "copiado" ? hecho : estado === "fallo" ? fallo : ""}
      </span>
    </button>
  );
}
