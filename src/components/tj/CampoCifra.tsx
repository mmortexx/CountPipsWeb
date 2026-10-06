"use client";

import { useState, type InputHTMLAttributes, type KeyboardEvent } from "react";
import { useLang } from "@/lib/i18n";
import { cifraEditable, leeCifra } from "@/lib/trading/format";

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "type" | "min" | "max" | "step"> & {
  valor: number;
  onValor: (n: number) => void;
  min?: number;
  max?: number;
  /** Lo que suben o bajan las flechas del teclado. Sin él, las flechas no tocan la cifra. */
  paso?: number;
};

/**
 * Campo de cifra que escribe como el idioma de la página. No usa
 * `type="number"`, que formatea según el idioma del navegador y puede rechazar
 * la coma. El texto es libre (coma o punto), no se reformatea al escribir y se
 * limpia al salir del campo.
 */
export function CampoCifra({ valor, onValor, min, max, paso, onFocus, onBlur, onKeyDown, ...resto }: Props) {
  const { lang } = useLang();
  const [borrador, setBorrador] = useState<string | null>(null);

  const acota = (n: number) => Math.min(max ?? Infinity, Math.max(min ?? -Infinity, n));
  const redondea = (n: number) => Math.round(n * 1e6) / 1e6;

  return (
    <input
      {...resto}
      type="text"
      inputMode="decimal"
      autoComplete="off"
      spellCheck={false}
      value={borrador ?? cifraEditable(valor, lang)}
      onFocus={(e) => {
        setBorrador(cifraEditable(valor, lang));
        onFocus?.(e);
      }}
      onChange={(e) => {
        setBorrador(e.target.value);
        const n = leeCifra(e.target.value);
        if (n !== null) onValor(acota(n));
      }}
      onBlur={(e) => {
        setBorrador(null);
        onBlur?.(e);
      }}
      onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
        if (paso && (e.key === "ArrowUp" || e.key === "ArrowDown")) {
          e.preventDefault();
          const n = acota(redondea(valor + (e.key === "ArrowUp" ? paso : -paso)));
          onValor(n);
          setBorrador(cifraEditable(n, lang));
        }
        onKeyDown?.(e);
      }}
    />
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
    <div className="relative">
      <CampoCifra
        {...props}
        className={`tj-campo tnum w-full min-h-[44px] text-base font-medium ${antes ? "pl-7 pr-3" : "pl-3 pr-14"} ${className}`}
      />
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute top-1/2 -translate-y-1/2 text-[13px] text-tertiary ${antes ? "left-3" : "right-3"}`}
      >
        {unidad}
      </span>
    </div>
  );
}
