import { describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { renderToString } from "react-dom/server";

vi.mock("next/navigation", () => ({ usePathname: () => "/", useRouter: () => ({ push() {}, replace() {} }) }));

import { LanguageProvider } from "@/lib/i18n";
import { COSTES_POR_OPERACION, EquityProjector, PRESETS } from "@/components/marketing/EquityProjector";

/** Los deslizadores que pinta el proyector: mínimo, máximo, paso y valor. */
function deslizadores(): { min: number; max: number; step: number; value: number }[] {
  const html = renderToString(createElement(LanguageProvider, null, createElement(EquityProjector)));
  return [...html.matchAll(/<input[^>]*type="range"[^>]*>/g)].map((m) => {
    const atributo = (n: string) => Number(new RegExp(`\\s${n}="([^"]*)"`).exec(m[0])?.[1]);
    return { min: atributo("min"), max: atributo("max"), step: atributo("step"), value: atributo("value") };
  });
}

/** ¿Es `valor` uno de los que el deslizador puede tener (desde el mínimo, de paso en paso)? */
function enElPaso(valor: number, d: { min: number; max: number; step: number }): boolean {
  const pasos = (valor - d.min) / d.step;
  return valor >= d.min && valor <= d.max && Math.abs(pasos - Math.round(pasos)) < 1e-9;
}

describe("proyector de capital: los perfiles caen en el paso del deslizador", () => {
  const sliders = deslizadores();
  const por = (min: number, max: number) => {
    const d = sliders.find((s) => s.min === min && s.max === max);
    if (!d) throw new Error(`no encuentro el deslizador ${min}–${max}`);
    return d;
  };

  it.each(PRESETS.map((p) => [p.id, p] as const))("%s: cada cifra del perfil es un valor del deslizador", (_id, p) => {
    expect(enElPaso(p.tradesPerYear, por(12, 600)), `operaciones por año ${p.tradesPerYear}`).toBe(true);
    expect(enElPaso(p.winRate, por(25, 80)), `win rate ${p.winRate}`).toBe(true);
    expect(enElPaso(p.avgWinR, por(0.5, 6)), `ganancia media ${p.avgWinR}`).toBe(true);
    expect(enElPaso(p.avgLossR, por(0.25, 3)), `pérdida media ${p.avgLossR}`).toBe(true);
    expect(enElPaso(p.riskPct, por(0.1, 3)), `riesgo ${p.riskPct}`).toBe(true);
    // Los costes no son deslizador sino botones: sin uno igual, ninguno queda marcado.
    expect(COSTES_POR_OPERACION, `costes ${p.frictionR}`).toContain(p.frictionR);
  });
});
