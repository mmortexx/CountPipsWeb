import { describe, expect, it } from "vitest";
import { diaDelCommit } from "@/lib/dia-del-commit";

/**
 * El pie dice «Sitio actualizado el …» y firma el copyright con el año de
 * este día. El 2026-09-25 decía «24 de septiembre» de un commit hecho el 25
 * a la 01:40 en España, porque el día se sacaba en UTC.
 */
describe("diaDelCommit", () => {
  it("el día es el del commit, no el de UTC", () => {
    expect(diaDelCommit("2026-09-25T01:40:57+02:00")).toBe("2026-09-25");
    expect(diaDelCommit("2026-09-24T23:10:00-05:00")).toBe("2026-09-24");
  });
  it("el 1 de enero de madrugada ya es el año nuevo", () => {
    expect(diaDelCommit("2027-01-01T00:30:00+01:00").slice(0, 4)).toBe("2027");
  });
  it("con la salida de git tal cual, salto de línea incluido", () => {
    expect(diaDelCommit("2026-09-25T09:00:00Z\n")).toBe("2026-09-25");
  });
  it("lo que no es una fecha de git da cadena vacía", () => {
    expect(diaDelCommit("")).toBe("");
    expect(diaDelCommit("fatal: not a git repository")).toBe("");
    expect(diaDelCommit("2026-13-45T00:00:00Z")).toBe("");
  });
});
