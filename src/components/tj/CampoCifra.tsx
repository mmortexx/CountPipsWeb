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
 * Campo de cifra que escribe como el idioma de la página.
 *
 * `type="number"` pinta y lee el decimal según el idioma del NAVEGADOR, no
 * el de la página: en la web española salía «1.24» junto a «43.200 $», y
 * según el navegador una coma escrita a mano se rechazaba. Aquí el texto
 * es libre, se acepta coma o punto, y mientras se escribe no se reformatea
 * nada: el valor se limpia al salir del campo.
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
 * Campo de cifra con su unidad dentro: el de las calculadoras, del mismo
 * alto y cuerpo que los de la calculadora de riesgo (44 px y 16 px, que
 * Safari de iOS no amplía al enfocar). La unidad va centrada en vertical
 * y del lado que pide el idioma: «1,24 $» en español, «$1.24» en inglés
 * (`antes`); las que no son divisa («ticks») van siempre detrás.
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
