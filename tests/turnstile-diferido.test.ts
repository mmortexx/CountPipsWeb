import { describe, expect, it } from "vitest";
import { pasoTurnstile } from "@/components/beta/BetaApplication";

/**
 * Con clave de Turnstile, abrir /beta no debe contactar con Cloudflare: la API
 * se trae cuando alguien empieza a rellenar el formulario.
 */
describe("Turnstile en /beta", () => {
  it("al abrir la página, aunque haya clave, no se trae nada", () => {
    expect(pasoTurnstile({ clave: "0x4AAA", empezado: false, apiCargada: false })).toBe("nada");
    expect(pasoTurnstile({ clave: "0x4AAA", empezado: false, apiCargada: true })).toBe("nada");
  });

  it("al empezar a rellenar, se trae la API o se pinta el widget si ya estaba", () => {
    expect(pasoTurnstile({ clave: "0x4AAA", empezado: true, apiCargada: false })).toBe("cargar");
    expect(pasoTurnstile({ clave: "0x4AAA", empezado: true, apiCargada: true })).toBe("pintar");
  });

  it("sin clave, nunca", () => {
    expect(pasoTurnstile({ clave: "", empezado: true, apiCargada: false })).toBe("nada");
  });
});
