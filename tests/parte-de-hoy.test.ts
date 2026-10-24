import { describe, expect, it } from "vitest";
import { fraseOperacionesHoy, operacionesDeHoy, operacionesDelMismoDia } from "@/lib/trading/parteDeHoy";

const cerrada = (iso: string) => ({ closedAt: new Date(iso) });

describe("«El parte de hoy» de la demo cuenta las operaciones de hoy, también las registradas", () => {
  // Hora local a mediodía: el día local no depende del huso de la máquina.
  const ahora = new Date(2026, 9, 24, 12, 0, 0);

  it("sin operaciones de hoy, cero", () => {
    expect(operacionesDeHoy([], ahora)).toBe(0);
    expect(operacionesDeHoy([cerrada("2026-07-16T14:00:00Z")], ahora)).toBe(0);
  });

  it("una operación cerrada hoy cuenta; la de ayer y la de mañana no", () => {
    const hoy = { closedAt: new Date(2026, 9, 24, 9, 30) };
    const ayer = { closedAt: new Date(2026, 9, 23, 23, 59, 59) };
    const manana = { closedAt: new Date(2026, 9, 25, 0, 0, 0) };
    expect(operacionesDeHoy([hoy, ayer, manana], ahora)).toBe(1);
  });

  it("los límites del día local: 00:00:00 de hoy entra, 23:59:59 de hoy entra", () => {
    const trades = [{ closedAt: new Date(2026, 9, 24, 0, 0, 0) }, { closedAt: new Date(2026, 9, 24, 23, 59, 59) }];
    expect(operacionesDeHoy(trades, ahora)).toBe(2);
  });

  it("las operaciones del mismo día de la semana se leen en UTC, como se fechan", () => {
    // 2026-07-09 y 2026-07-16 son jueves (4); 2026-07-17, viernes (5).
    const trades = [cerrada("2026-07-16T14:00:00Z"), cerrada("2026-07-09T14:00:00Z"), cerrada("2026-07-17T14:00:00Z")];
    expect(operacionesDelMismoDia(trades, 4)).toBe(2);
    expect(operacionesDelMismoDia(trades, 5)).toBe(1);
    expect(operacionesDelMismoDia(trades, 3)).toBe(0);
    expect(operacionesDelMismoDia([], 4)).toBe(0);
  });

  it("la frase: ninguna, una y varias, en los dos idiomas", () => {
    expect(fraseOperacionesHoy(0, "es")).toBe("Todavía no has cerrado ninguna operación hoy.");
    expect(fraseOperacionesHoy(1, "es")).toBe("Hoy has cerrado 1 operación.");
    expect(fraseOperacionesHoy(3, "es")).toBe("Hoy has cerrado 3 operaciones.");
    expect(fraseOperacionesHoy(0, "en")).toBe("You have not closed any trade today.");
    expect(fraseOperacionesHoy(1, "en")).toBe("You have closed 1 trade today.");
    expect(fraseOperacionesHoy(3, "en")).toBe("You have closed 3 trades today.");
  });
});
