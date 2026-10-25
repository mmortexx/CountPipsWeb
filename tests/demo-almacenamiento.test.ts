import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { addTrade, deleteTrade, getCustomTrades, resetToSample, updateTrade } from "@/lib/trading/demoStore";

/** `localStorage` en memoria que se puede estropear: cuota llena o bloqueado del todo. */
function ventanaFalsa() {
  const datos = new Map<string, string>();
  const estado = { escribe: true, lee: true };
  const eventos: string[] = [];
  return {
    estado,
    eventos,
    window: {
      localStorage: {
        getItem: (k: string) => {
          if (!estado.lee) throw new DOMException("bloqueado", "SecurityError");
          return datos.get(k) ?? null;
        },
        setItem: (k: string, v: string) => {
          if (!estado.escribe) throw new DOMException("cuota", "QuotaExceededError");
          datos.set(k, v);
        },
        removeItem: (k: string) => void datos.delete(k),
      },
      dispatchEvent: (e: Event) => {
        eventos.push(e.type);
        return true;
      },
      addEventListener: () => {},
      removeEventListener: () => {},
    },
  };
}

const operacion = (nota = "") =>
  ({
    instrument: "ES", setup: "Breakout", direction: "long", entry: 5800, exit: 5810, qty: 1, netPnl: 125,
    rMultiple: 1, compliance: "yes", closedAt: "2026-07-01T10:00:00Z", note: nota,
  }) as const;

describe("demo: si el almacenamiento falla, lo registrado no se pierde (queda en memoria)", () => {
  let v: ReturnType<typeof ventanaFalsa>;
  beforeEach(() => {
    v = ventanaFalsa();
    vi.stubGlobal("window", v.window);
    // El id de cada operación es la marca de tiempo: dos en el mismo milisegundo chocarían.
    let ahora = 1_800_000_000_000;
    vi.spyOn(Date, "now").mockImplementation(() => ahora++);
    resetToSample();
    v.eventos.length = 0;
  });
  afterEach(() => {
    resetToSample();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("con la cuota llena, la operación registrada sigue en la lista y avisa para repintar", () => {
    v.estado.escribe = false;
    const registrada = addTrade(operacion("sin sitio"));
    expect(getCustomTrades().map((t) => t.id)).toEqual([registrada.id]);
    expect(v.eventos).toContain("tj-demo-trades-changed");
  });

  it("con el almacenamiento bloqueado del todo (ni leer ni escribir), también", () => {
    v.estado.escribe = false;
    v.estado.lee = false;
    const a = addTrade(operacion("a"));
    const b = addTrade({ ...operacion("b"), closedAt: "2026-07-02T10:00:00Z" });
    expect(getCustomTrades().map((t) => t.id).sort()).toEqual([a.id, b.id].sort());
  });

  it("se pueden editar y borrar en memoria", () => {
    v.estado.escribe = false;
    const t = addTrade(operacion("antes"));
    expect(updateTrade(t.id, { note: "después" })?.note).toBe("después");
    expect(getCustomTrades()[0].note).toBe("después");
    expect(deleteTrade(t.id)).toBe(true);
    expect(getCustomTrades()).toEqual([]);
  });

  it("«Reiniciar demo» (resetToSample) también vacía la copia en memoria", () => {
    v.estado.escribe = false;
    addTrade(operacion());
    resetToSample();
    expect(getCustomTrades()).toEqual([]);
  });

  it("cuando el almacenamiento vuelve, se guarda todo junto y nada se duplica", () => {
    v.estado.escribe = false;
    const a = addTrade(operacion("a"));
    v.estado.escribe = true;
    const b = addTrade({ ...operacion("b"), closedAt: "2026-07-02T10:00:00Z" });
    expect(getCustomTrades().map((t) => t.id).sort()).toEqual([a.id, b.id].sort());
    v.estado.lee = true;
    expect(JSON.parse(v.window.localStorage.getItem("tj-demo-trades")!)).toHaveLength(2);
  });

  it("una entrada guardada con la fecha de cierre ilegible se descarta y las demás se conservan", () => {
    const buena = addTrade(operacion("buena"));
    const guardadas = JSON.parse(v.window.localStorage.getItem("tj-demo-trades")!);
    v.window.localStorage.setItem(
      "tj-demo-trades",
      JSON.stringify([...guardadas, { ...buena, id: buena.id + 1, closedAt: "no-es-una-fecha" }, { ...buena, id: buena.id + 2, closedAt: "" }])
    );
    expect(getCustomTrades().map((t) => t.id)).toEqual([buena.id]);
  });

  it("con el almacenamiento sano todo sigue igual: se guarda y se lee de ahí", () => {
    const t = addTrade(operacion("normal"));
    expect(JSON.parse(v.window.localStorage.getItem("tj-demo-trades")!)).toEqual([t]);
    expect(getCustomTrades()).toEqual([t]);
  });
});
