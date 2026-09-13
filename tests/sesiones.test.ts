import { describe, expect, it } from "vitest";
import { PLAZAS, estaAbierta, proximaApertura, ventanaUtc } from "@/lib/sesiones";

const plaza = (id: string) => PLAZAS.find((p) => p.id === id)!;
const utc = (iso: string) => new Date(iso);

describe("plazas de mercado en hora local, como la app", () => {
  it("aplica el cambio de hora de Londres", () => {
    expect(estaAbierta(plaza("london"), utc("2026-07-13T07:15:00Z"))).toBe(true);
    expect(estaAbierta(plaza("london"), utc("2026-01-12T07:15:00Z"))).toBe(false);
    expect(estaAbierta(plaza("london"), utc("2026-01-12T08:15:00Z"))).toBe(true);
  });

  it("Nueva York abre a las 09:30 locales", () => {
    expect(estaAbierta(plaza("newyork"), utc("2026-09-14T13:29:00Z"))).toBe(false);
    expect(estaAbierta(plaza("newyork"), utc("2026-09-14T13:30:00Z"))).toBe(true);
  });

  it("cierra en fin de semana mirando el día local de la plaza", () => {
    expect(estaAbierta(plaza("london"), utc("2026-09-12T12:00:00Z"))).toBe(false);
    expect(estaAbierta(plaza("sydney"), utc("2026-09-13T22:00:00Z"))).toBe(true);
  });

  it("expresa la ventana de hoy en UTC", () => {
    expect(ventanaUtc(plaza("london"), utc("2026-09-14T10:00:00Z"))).toEqual({ desde: 420, hasta: 930 });
    expect(ventanaUtc(plaza("london"), utc("2026-01-12T10:00:00Z"))).toEqual({ desde: 480, hasta: 990 });
  });

  it("la próxima apertura salta el fin de semana", () => {
    const r = proximaApertura(utc("2026-09-12T12:00:00Z"));
    expect(r?.plaza.id).toBe("sydney");
    expect(r?.minutos).toBe(33 * 60);
  });
});
