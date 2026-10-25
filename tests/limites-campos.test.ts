import { describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { renderToString } from "react-dom/server";

vi.mock("next/navigation", () => ({ usePathname: () => "/", useRouter: () => ({ push() {}, replace() {} }) }));

type PropsCampo = { min?: number; max?: number; "aria-label"?: string; id?: string };
const campos: PropsCampo[] = [];
vi.mock("@/components/tj/CampoCifra", () => {
  const registra = (props: PropsCampo) => {
    campos.push(props);
    return null;
  };
  return { CampoCifra: registra, CampoUnidad: registra };
});

import { LanguageProvider } from "@/lib/i18n";
import { RiskCalculator } from "@/components/marketing/RiskCalculator";
import { CommissionDragCalculator } from "@/components/marketing/CommissionDragCalculator";
import { DisciplineCost } from "@/components/marketing/DisciplineCost";
import { LIMITES } from "@/lib/trading/limites";
import { validaRegistro } from "@/lib/trading/validaPlan";

/** Los campos de cifra que pinta una herramienta, tal como los configura. */
function camposDe(herramienta: () => ReturnType<typeof createElement>): PropsCampo[] {
  campos.length = 0;
  renderToString(createElement(LanguageProvider, null, herramienta()));
  return [...campos];
}

const rango = (c: PropsCampo) => ({ min: c.min, max: c.max });

describe("cada campo de cifra de las herramientas tiene su rango, de un solo sitio", () => {
  it("calculadora de riesgo: balance y tres precios", () => {
    const c = camposDe(() => createElement(RiskCalculator));
    expect(c.map(rango)).toEqual([LIMITES.balance, LIMITES.precio, LIMITES.precio, LIMITES.precio]);
  });

  it("coste de comisiones: comisión y deslizamiento", () => {
    const c = camposDe(() => createElement(CommissionDragCalculator));
    expect(c.map(rango)).toEqual([LIMITES.comision, LIMITES.deslizamiento]);
  });

  it("coste de indisciplina: resultado medio dentro y fuera de plan", () => {
    const c = camposDe(() => createElement(DisciplineCost));
    expect(c.map(rango)).toEqual([LIMITES.resultadoPorOperacion, LIMITES.resultadoPorOperacion]);
  });
});

describe("LIMITES", () => {
  it("todos tienen mínimo y máximo finitos y ordenados", () => {
    for (const [nombre, { min, max }] of Object.entries(LIMITES)) {
      expect(Number.isFinite(min) && Number.isFinite(max) && min < max, nombre).toBe(true);
    }
  });
});

describe("el registro de la demo tampoco admite cifras enormes", () => {
  const bueno = { direccion: "long", entrada: 21500, stop: 21400, salida: 21600, cantidad: 2 } as const;

  it("el máximo exacto pasa y el siguiente no", () => {
    const { max } = LIMITES.precio;
    expect(validaRegistro({ ...bueno, entrada: max, stop: max - 1, salida: max })).not.toBeNull();
    expect(validaRegistro({ ...bueno, entrada: max + 1 })).toBeNull();
    expect(validaRegistro({ ...bueno, stop: max + 1 })).toBeNull();
    expect(validaRegistro({ ...bueno, salida: max + 1 })).toBeNull();
    expect(validaRegistro({ ...bueno, cantidad: LIMITES.cantidad.max })).not.toBeNull();
    expect(validaRegistro({ ...bueno, cantidad: LIMITES.cantidad.max + 1 })).toBeNull();
  });
});
