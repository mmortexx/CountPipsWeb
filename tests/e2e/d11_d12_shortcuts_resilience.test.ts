import { afterEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { normalCdf } from "@/components/marketing/EdgeSignificanceChecker";
import { readRecent, writeRecent } from "@/components/tj/GlossaryModal";
import { validaPlan } from "@/lib/trading/validaPlan";
import { contrasteVentaja } from "@/lib/trading/estadistica";
import { FUTURES_CONTRACTS, PARES_FOREX, calculaPlan, type EntradaPlan } from "@/lib/trading/plan";
import { proyectaCapital, type ParametrosProyeccion } from "@/lib/trading/proyeccion";

/** Acciones, entrada igual al stop. */
const PLAN_BASE: EntradaPlan = {
  mercado: "equities",
  balance: 10000,
  riesgoPct: 1,
  entrada: 100,
  stop: 100,
  objetivo: 110,
  friccion: true,
  futuro: FUTURES_CONTRACTS[0],
  lote: "standard",
  par: PARES_FOREX[0],
  tipoReferencia: null,
};
const calculaPlanSinStop = calculaPlan(PLAN_BASE);

/**
 * Dimensiones D11 y D12: atajos, manejo de errores y resiliencia. Tier 1 lee
 * el código de los atajos (Ctrl+G, `?`, T, L, prefijo `g`), la protección al
 * escribir en campos, el try-catch de localStorage y las validaciones de las
 * herramientas. Tier 2 lleva al límite el código real: `proyectaCapital` y
 * `calculaPlan` con NaN, ceros y negativos, `normalCdf` con z extremas, y los
 * vistos hace poco del glosario (`readRecent`/`writeRecent`) con errores de
 * almacenamiento y JSON corrupto.
 */

const ROOT = join(import.meta.dirname, "..", "..");
const readSrc = (rel: string) => readFileSync(join(ROOT, rel), "utf8");

describe("Dimension D11 & D12: Shortcuts & Resilience (Tier 1 Feature Coverage)", () => {
  it("T1.1: OverlayHost and GlobalShortcuts bind Ctrl+G and ? keybindings correctly", () => {
    const overlayHost = readSrc("src/components/tj/OverlayHost.tsx");
    const globalShortcuts = readSrc("src/components/tj/GlobalShortcuts.tsx");

    // El glosario es el único atajo con modificador que queda.
    expect(overlayHost).toContain('(e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "g"');
    expect(overlayHost).toContain("e.preventDefault()");
    expect(overlayHost).not.toContain("CommandPalette");

    expect(globalShortcuts).toContain('key === "?"');
    expect(globalShortcuts).toContain('e.shiftKey && (key === "/" || e.code === "Slash")');
    expect(globalShortcuts).toContain("openShortcutsHelp()");
  });

  it("T1.2: GlobalShortcuts supports T (Theme), L (Language), and 'g' navigation sequences", () => {
    const globalShortcuts = readSrc("src/components/tj/GlobalShortcuts.tsx");

    expect(globalShortcuts).toContain('lower === "t"');
    expect(globalShortcuts).toContain("toggleTheme()");
    expect(globalShortcuts).toContain('lower === "l"');
    expect(globalShortcuts).toContain("toggleLang()");

    expect(globalShortcuts).toContain('lower === "g"');
    expect(globalShortcuts).toContain("armPrefix()");
    expect(globalShortcuts).toContain("G_PREFIX_TIMEOUT = 1000");
    expect(globalShortcuts).toContain("G_NAV_MAP");
    expect(globalShortcuts).toContain('key === "Escape" && gPrefixActive.current');
  });

  it("T1.3: Form field typing protection skips shortcut handling during text input", () => {
    const globalShortcuts = readSrc("src/components/tj/GlobalShortcuts.tsx");

    expect(globalShortcuts).toContain('tag === "INPUT"');
    expect(globalShortcuts).toContain('tag === "TEXTAREA"');
    expect(globalShortcuts).toContain('tag === "SELECT"');
    expect(globalShortcuts).toContain("target.isContentEditable");
  });

  it("T1.4: LocalStorage calls are protected with try-catch for private browsing compatibility", () => {
    const glossaryModal = readSrc("src/components/tj/GlossaryModal.tsx");

    expect(glossaryModal).toMatch(/function readRecent\(\)[^{]*\{[\s\S]*?try\s*\{[\s\S]*?window\.localStorage\.getItem/);
    expect(glossaryModal).toMatch(/function writeRecent\([^)]*\)[^{]*\{[\s\S]*?try\s*\{[\s\S]*?window\.localStorage\.setItem/);
  });

  it("T1.5: Interactive tools validate input parameters and provide clear validation alerts", () => {
    const riskCalc = readSrc("src/components/marketing/RiskCalculator.tsx");
    const equityProj = readSrc("src/components/marketing/EquityProjector.tsx");
    const edgeChecker = readSrc("src/components/marketing/EdgeSignificanceChecker.tsx");

    // RiskCalculator delega el cálculo en calculaPlan, que valida con
    // validaPlan, y sigue mostrando alerta si no es válido.
    expect(riskCalc).toContain("calculaPlan(");
    expect(calculaPlanSinStop.valido).toBe(false);
    expect(riskCalc).toContain('role="alert"');
    expect(validaPlan(0, 95, 115).valido).toBe(false);
    expect(validaPlan(100, 100, 115).valido).toBe(false);
    expect(validaPlan(100, 95, 100).valido).toBe(false);
    expect(validaPlan(100, 95, 110).valido).toBe(true); // largo: stop abajo, objetivo arriba
    expect(validaPlan(100, 105, 90).valido).toBe(true); // corto: stop arriba, objetivo abajo
    const objetivoLadoDelStop = validaPlan(100, 105, 110);
    expect(objetivoLadoDelStop.valido).toBe(false);
    expect(objetivoLadoDelStop.motivo).toBe("lado");
    const largoConObjetivoAbajo = validaPlan(100, 95, 90);
    expect(largoConObjetivoAbajo.valido).toBe(false);
    expect(largoConObjetivoAbajo.motivo).toBe("lado");
    expect(validaPlan(NaN, 95, 115).valido).toBe(false);
    expect(validaPlan(100, NaN, 115).valido).toBe(false);
    expect(validaPlan(100, 95, NaN).valido).toBe(false);

    // EquityProjector avisa con esperanza negativa.
    expect(equityProj).toContain("!c.hasEdge &&");
    expect(equityProj).toContain('role="alert"');

    // EdgeSignificanceChecker no da veredicto por debajo de n·p0·(1−p0) ≥ 5
    expect(edgeChecker).toContain("contrasteVentaja(");
    expect(contrasteVentaja(15, 70, 1, 1).veredicto).toBe("muestra-insuficiente");
    expect(contrasteVentaja(20, 70, 1, 1).veredicto).not.toBe("muestra-insuficiente");
  });
});

describe("Dimension D11 & D12: Shortcuts & Resilience (Tier 2 Boundary & Corner Cases)", () => {
  afterEach(() => vi.unstubAllGlobals());

  /** Ningún campo numérico del resultado es NaN ni Infinity. */
  function sinNaN(resultado: Record<string, unknown>, contexto: string) {
    for (const [campo, valor] of Object.entries(resultado)) {
      if (typeof valor === "number") expect(Number.isFinite(valor), `${contexto}: ${campo} = ${valor}`).toBe(true);
    }
  }

  it("T2.1: Mathematical calculators handle NaN, Infinity, negative values, and zero division gracefully", () => {
    const proyeccion: ParametrosProyeccion = {
      startBalance: 10000,
      tradesPerYear: 200,
      winRate: 55,
      avgWinR: 2,
      avgLossR: 1,
      riskPct: 1,
      years: 5,
      reinvestMode: "compound",
      monthlyContribution: 0,
      frictionR: 0,
    };

    // Balance cero: no hay tasa anual que calcular, ni división por cero.
    const sinBalance = proyectaCapital({ ...proyeccion, startBalance: 0 });
    sinNaN({ ...sinBalance }, "balance 0");
    expect(sinBalance.cagr).toBe(-1);
    expect(sinBalance.finalBalance).toBe(0);
    expect(sinBalance.totalReturnPct).toBe(0);

    // Cero años: la curva se queda en el punto de partida.
    const sinAnios = proyectaCapital({ ...proyeccion, years: 0 });
    sinNaN({ ...sinAnios }, "0 años");
    expect(sinAnios.cagr).toBe(-1);
    expect(sinAnios.finalBalance).toBe(10000);
    expect(sinAnios.yearlyBreakdown).toEqual([]);

    // Esperanza negativa (100 % de pérdidas): el balance baja sin hacerse negativo.
    const todoPerdidas = proyectaCapital({ ...proyeccion, winRate: 0, riskPct: 2 });
    sinNaN({ ...todoPerdidas }, "0 % de acierto");
    expect(todoPerdidas.grossExpectancyR).toBe(-1);
    expect(todoPerdidas.hasEdge).toBe(false);
    expect(todoPerdidas.fullKellyPct).toBeNull(); // sin ganancias no hay payoff medible
    expect(todoPerdidas.monthsToDouble).toBeNull();
    expect(todoPerdidas.cagr).toBeGreaterThanOrEqual(-1);
    expect(todoPerdidas.cagr).toBeLessThan(0);
    expect(todoPerdidas.monthlyPoints.every((p) => p.balance >= 0)).toBe(true);

    // Distancia cero (entrada igual al stop): plan no válido, sin tamaño ni R:R.
    expect(calculaPlanSinStop.valido).toBe(false);
    expect(calculaPlanSinStop.rr).toBe(0);
    expect(calculaPlanSinStop.tamano).toBe(0);
    sinNaN({ ...calculaPlanSinStop }, "entrada = stop");
    // Balance cero o una entrada NaN tampoco dan un tamaño.
    const plan = { ...PLAN_BASE, stop: 95 };
    for (const [contexto, entrada] of [
      ["balance 0", { ...plan, balance: 0 }],
      ["entrada NaN", { ...plan, entrada: NaN }],
      ["riesgo negativo", { ...plan, riesgoPct: -1 }],
    ] as const) {
      const r = calculaPlan(entrada);
      sinNaN({ ...r }, contexto);
      expect(r.tamano, contexto).toBe(0);
    }

    // `normalCdf` con puntuaciones z extremas.
    expect(normalCdf(0)).toBe(0.5);
    expect(normalCdf(100)).toBeCloseTo(1.0, 5);
    expect(normalCdf(-100)).toBeCloseTo(0.0, 5);
    expect(Number.isFinite(normalCdf(NaN))).toBe(false); // NaN se propaga de forma predecible
  });

  /** Los vistos hace poco del glosario, sobre un `localStorage` que puede fallar. */
  function almacenGlosario() {
    const datos: Record<string, string> = {};
    const fallos = { seguridad: false, cuota: false };
    vi.stubGlobal("window", {
      localStorage: {
        getItem(clave: string): string | null {
          if (fallos.seguridad) throw new Error("SecurityError: The operation is insecure.");
          return datos[clave] ?? null;
        },
        setItem(clave: string, valor: string): void {
          if (fallos.seguridad) throw new Error("SecurityError: The operation is insecure.");
          if (fallos.cuota) throw new Error("QuotaExceededError: DOMException 22");
          datos[clave] = valor;
        },
      },
    });
    return { datos, fallos };
  }

  it("T2.2: LocalStorage SecurityError and QuotaExceededError simulations recover safely", () => {
    const { datos, fallos } = almacenGlosario();

    writeRecent(["Sharpe", "Sortino", "Calmar", "Kelly"]);
    expect(readRecent()).toEqual(["Sharpe", "Sortino", "Calmar"]);

    // SecurityError (navegación privada): ni leer ni escribir lanzan.
    fallos.seguridad = true;
    expect(readRecent()).toEqual([]);
    expect(() => writeRecent(["Drawdown"])).not.toThrow();

    // QuotaExceededError: la escritura se pierde y lo guardado sigue igual.
    fallos.seguridad = false;
    fallos.cuota = true;
    expect(() => writeRecent(["Drawdown"])).not.toThrow();
    expect(JSON.parse(datos["tj-glossary-recent"])).toEqual(["Sharpe", "Sortino", "Calmar"]);
  });

  it("T2.5: Corrupted JSON in localStorage parses safely with graceful fallback", () => {
    const { datos } = almacenGlosario();
    const leeCon = (guardado: string | null) => {
      if (guardado === null) delete datos["tj-glossary-recent"];
      else datos["tj-glossary-recent"] = guardado;
      return readRecent();
    };

    expect(leeCon(null)).toEqual([]);
    expect(leeCon("")).toEqual([]);
    expect(leeCon("{invalid json")).toEqual([]);
    expect(leeCon("12345")).toEqual([]);
    expect(leeCon('{"a": 1}')).toEqual([]);
    expect(leeCon('["Alpha", 42, null, true, "Beta", "Gamma", "Delta"]')).toEqual(["Alpha", "Beta", "Gamma"]);
  });
});
