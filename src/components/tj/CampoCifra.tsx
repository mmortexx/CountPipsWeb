"use client";

import { useEffect, useId, useState, type InputHTMLAttributes, type KeyboardEvent } from "react";
import { useLang } from "@/lib/i18n";
import { leeBorrador, mensajeRango } from "@/lib/trading/campo";
import { cifraEditable, cifraReposo } from "@/lib/trading/format";

/** Lo que se espera sin cambios antes de marcar el campo: «5» camino de «5000»
 *  bajo un mínimo de 100 no debe parpadear en rojo ni anunciarse. */
const ESPERA_AVISO_MS = 600;

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "type" | "min" | "max" | "step"> & {
  valor: number;
  onValor: (n: number) => void;
  min?: number;
  max?: number;
  /** Lo que suben o bajan las flechas del teclado. Sin él, las flechas no tocan la cifra. */
  paso?: number;
  /** Decimales que admite el campo: deciden si un «10.000» es 10 o 10000. */
  decimales: number;
  /** Unidad dentro del campo, del lado que pide `antes` (ver `CampoUnidad`). */
  unidad?: string;
  antes?: boolean;
};

/**
 * Campo de cifra que escribe como el idioma de la página. No usa
 * `type="number"`, que formatea según el idioma del navegador y puede rechazar
 * la coma. El texto es libre (coma o punto), no se reformatea al escribir y se
 * limpia al salir del campo.
 */
export function CampoCifra({ valor, onValor, min, max, paso, decimales, unidad, antes = false, onFocus, onBlur, onKeyDown, ...resto }: Props) {
  const { lang } = useLang();
  const idAviso = useId();
  const [borrador, setBorrador] = useState<string | null>(null);
  const [avisado, setAvisado] = useState(false);

  /* El teclado decimal del iPhone no tiene el signo menos: donde el campo admite
     negativos se ofrece el de texto; en los demás, el decimal. */
  const admiteNegativos = min === undefined || min < 0;

  const acota = (n: number) => Math.min(max ?? Infinity, Math.max(min ?? -Infinity, n));
  const redondea = (n: number) => Math.round(n * 1e6) / 1e6;

  /* Lo escrito que no se lee o cae fuera del rango no se recorta ni se cambia
     por otro valor en silencio: el cálculo conserva el último bueno y el campo
     se marca con el rango que vale. Al salir, el campo vuelve a ese valor. */
  const invalido = borrador !== null && leeBorrador(borrador, lang, decimales, min, max).tipo === "invalida";
  useEffect(() => {
    if (!invalido) return;
    const t = setTimeout(() => setAvisado(true), ESPERA_AVISO_MS);
    return () => clearTimeout(t);
  }, [invalido, borrador]);
  const avisa = invalido && avisado;

  return (
    <span className="block min-w-0">
      <span className="relative block">
        <input
          {...resto}
          type="text"
          inputMode={admiteNegativos ? "text" : "decimal"}
          autoComplete="off"
          spellCheck={false}
          aria-invalid={avisa ? true : undefined}
          aria-describedby={avisa ? idAviso : resto["aria-describedby"]}
          value={borrador ?? cifraReposo(valor, lang)}
          onFocus={(e) => {
            setBorrador(cifraEditable(valor, lang));
            onFocus?.(e);
          }}
          onChange={(e) => {
            setBorrador(e.target.value);
            const lectura = leeBorrador(e.target.value, lang, decimales, min, max);
            if (lectura.tipo === "valor") onValor(lectura.valor);
            if (lectura.tipo !== "invalida") setAvisado(false);
          }}
          onBlur={(e) => {
            setBorrador(null);
            setAvisado(false);
            onBlur?.(e);
          }}
          onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
            if (paso && (e.key === "ArrowUp" || e.key === "ArrowDown")) {
              e.preventDefault();
              const n = acota(redondea(valor + (e.key === "ArrowUp" ? paso : -paso)));
              onValor(n);
              setBorrador(cifraEditable(n, lang));
              setAvisado(false);
            }
            onKeyDown?.(e);
          }}
        />
        {unidad ? (
          <span
            aria-hidden="true"
            className={`pointer-events-none absolute top-1/2 -translate-y-1/2 text-[13px] text-tertiary ${antes ? "left-3" : "right-3"}`}
          >
            {unidad}
          </span>
        ) : null}
      </span>
      {/* Todo `span`: el campo vive dentro de `label`, que solo admite contenido en línea.
          `w-0 min-w-full`: el aviso se parte al ancho del campo y no lo ensancha. */}
      {avisa ? (
        <span id={idAviso} role="alert" className="mt-1 block w-0 min-w-full text-xs text-pnl-neg">
          {mensajeRango(min, max, lang)}
        </span>
      ) : null}
    </span>
  );
}

/**
 * Campo de cifra con su unidad dentro, el de las calculadoras (44 px y 16 px:
 * Safari de iOS no amplía al enfocar). La unidad va del lado que pide el
 * idioma (`antes`: «$1.24» en inglés, «1,24 $» en español); las que no son
 * divisa («ticks») van siempre detrás.
 */
export function CampoUnidad({
  unidad,
  antes = false,
  className = "",
  ...props
}: Props & { unidad: string; antes?: boolean }) {
  return (
    <CampoCifra
      {...props}
      unidad={unidad}
      antes={antes}
      className={`tj-campo tnum w-full min-h-[44px] text-base font-medium ${antes ? "pl-7 pr-3" : "pl-3 pr-14"} ${className}`}
    />
  );
}
