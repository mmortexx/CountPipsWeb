import { afterEach, describe, expect, it, vi } from "vitest";
import { guardaPaleta, guardaTema, readSavedTheme } from "@/lib/theme";

/**
 * Contrato de PROJECT.md: leer o guardar el tema nunca lanza, aunque
 * `localStorage` dé `SecurityError` (navegación privada, cookies bloqueadas)
 * o `QuotaExceededError` (lleno).
 */
const lanza = (nombre: string) => () => {
  throw new DOMException("bloqueado", nombre);
};

describe("tema con un almacenamiento que lanza", () => {
  afterEach(() => vi.unstubAllGlobals());

  it.each(["SecurityError", "QuotaExceededError"])("guardar el tema o la paleta no lanza (%s)", (nombre) => {
    const setItem = vi.fn(lanza(nombre));
    vi.stubGlobal("localStorage", { getItem: lanza(nombre), setItem });
    expect(() => guardaTema("dark")).not.toThrow();
    expect(() => guardaPaleta("clasico")).not.toThrow();
    expect(setItem).toHaveBeenCalledWith("tj-theme", "dark");
    expect(setItem).toHaveBeenCalledWith("tj-palette", "clasico");
  });

  it("leer no lanza aunque fallen a la vez el almacenamiento y la consulta del sistema", () => {
    vi.stubGlobal("window", {});
    vi.stubGlobal("localStorage", { getItem: lanza("SecurityError") });
    vi.stubGlobal("matchMedia", lanza("SecurityError"));
    expect(readSavedTheme()).toBe("light");
  });

  it("lo guardado se lee al arrancar", () => {
    const datos = new Map<string, string>();
    vi.stubGlobal("window", {});
    vi.stubGlobal("localStorage", { getItem: (k: string) => datos.get(k) ?? null, setItem: (k: string, v: string) => void datos.set(k, v) });
    vi.stubGlobal("matchMedia", () => ({ matches: false }));
    guardaTema("dark");
    expect(readSavedTheme()).toBe("dark");
  });
});
