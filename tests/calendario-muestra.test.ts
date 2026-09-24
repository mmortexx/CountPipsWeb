import { describe, expect, it } from "vitest";
import { getCal, getSetups } from "@/lib/trading/fixtures";
import { TRADES, cumplimientoMensual, contextoDelDia, ENFRIAMIENTO_MIN } from "@/lib/trading/data";
import { OPERACIONES_MUESTRA } from "@/lib/trading/muestra";

const CRIPTO = new Set(["BTC/USDT", "ETH/USDT"]);
const AHORA = new Date("2026-07-16T18:00:00Z");

/* El calendario de /features ponía el 1 de julio de 2026 en sábado y
   terminaba en el 30: el desfase iba escrito a mano, y con él salían
   operaciones en fin de semana. */
describe("el calendario de muestra es un mes de verdad", () => {
  const { cells, label } = getCal();
  const dias = cells.filter((c) => c.day !== "");

  it("julio de 2026 empieza en miércoles y tiene 31 días", () => {
    expect(label.es).toBe("julio 2026");
    const primero = cells.findIndex((c) => c.day === "1");
    expect(primero % 7).toBe((new Date(Date.UTC(2026, 6, 1)).getUTCDay() + 6) % 7);
    expect(dias.map((c) => Number(c.day))).toEqual(Array.from({ length: 31 }, (_, i) => i + 1));
  });

  it("las semanas van completas", () => {
    expect(cells.length % 7).toBe(0);
  });
});

/* El generador repartía los cierres por los 180 días sin mirar el
   calendario: 58 de 200 caían en sábado o domingo, con el índice, el
   oro o el EURUSD cerrados. Sólo la cripto cotiza el fin de semana. */
/* La ficha de playbooks era una maqueta con +2,1R por operación. Ahora
   sale de la muestra, y su titular promete «cuáles no»: tiene que haber
   alguno que no dé ventaja. */
describe("los setups de /features son los de la muestra", () => {
  const setups = getSetups();

  it("cubren todas las operaciones, de mejor a peor", () => {
    expect(setups.reduce((s, x) => s + x.n, 0)).toBe(TRADES.length);
    const r = setups.map((s) => s.expectativaR);
    expect(r).toEqual([...r].sort((a, b) => b - a));
  });

  it("hay alguno con ventaja y alguno sin ella, en cifras creíbles", () => {
    expect(setups.some((s) => s.expectativaR > 0)).toBe(true);
    expect(setups.some((s) => s.expectativaR <= 0)).toBe(true);
    expect(setups.every((s) => Math.abs(s.expectativaR) < 1)).toBe(true);
  });
});

describe("la muestra no opera con el mercado cerrado", () => {
  it("ningún cierre en fin de semana salvo cripto", () => {
    const enFinde = TRADES.filter(
      (t) => [0, 6].includes(t.closedAt.getUTCDay()) && !CRIPTO.has(t.instrument)
    );
    expect(enFinde.map((t) => t.closedAt.toISOString().slice(0, 10))).toEqual([]);
  });

  it("mover la fecha no toca el sorteo: mismas operaciones, mismo resultado", () => {
    expect(TRADES).toHaveLength(200);
    expect(TRADES.reduce((s, t) => s + t.netPnl, 0).toFixed(2)).toBe("6807.72");
    expect(TRADES.every((t) => t.closedAt.getTime() <= AHORA.getTime())).toBe(true);
  });

  /* El cierre de las fichas del glosario cita la cifra sin cargar TRADES. */
  it("la constante del tamaño de la muestra es el tamaño de la muestra", () => {
    expect(TRADES).toHaveLength(OPERACIONES_MUESTRA);
  });
});

/* «Cumplimiento mensual» del diario llevaba cinco meses inventados y, bajo
   «Jul», el cumplimiento de los 180 días. */
describe("el cumplimiento mensual sale de la muestra", () => {
  const meses = cumplimientoMensual(TRADES);

  it("son los seis meses naturales que acaban en el de la última operación", () => {
    expect(meses.map((m) => m.inicio.toISOString().slice(0, 7))).toEqual([
      "2026-02", "2026-03", "2026-04", "2026-05", "2026-06", "2026-07",
    ]);
  });

  it("cada mes cuenta sus operaciones y su fracción con el criterio de las métricas", () => {
    for (const m of meses) {
      const del = TRADES.filter((t) => t.closedAt.toISOString().slice(0, 7) === m.inicio.toISOString().slice(0, 7));
      expect(m.n).toBe(del.length);
      expect(m.fraccion).toBeCloseTo(del.filter((t) => t.compliance === "yes").length / del.length, 10);
    }
    expect(new Set(meses.map((m) => m.fraccion.toFixed(3))).size).toBeGreaterThan(1);
  });

  it("sin operaciones no inventa meses", () => {
    expect(cumplimientoMensual([])).toEqual([]);
  });
});

/* «Dónde cayó dentro del día» era igual para las 200 operaciones: tercera
   del día, ocho minutos después de otra, −84,60 $ previos. */
describe("el contexto del día sale de las operaciones de ese día", () => {
  const base = TRADES[0];
  const op = (id: number, abre: string, cierra: string, netPnl: number, instrument = "ES") => ({
    ...base, id, instrument, netPnl, openedAt: new Date(abre), closedAt: new Date(cierra),
  });
  const dia = [
    op(1, "2026-07-01T08:00:00Z", "2026-07-01T08:30:00Z", -50),
    op(2, "2026-07-01T08:40:00Z", "2026-07-01T09:00:00Z", 20, "NQ"),
    op(3, "2026-07-01T09:10:00Z", "2026-07-01T09:50:00Z", 30),
    op(4, "2026-06-30T23:00:00Z", "2026-07-01T07:00:00Z", 100),
  ];

  it("cuenta las abiertas antes ese día, el tiempo desde el último cierre y el resultado ya cerrado", () => {
    expect(contextoDelDia(dia[2], dia)).toEqual({ ordinal: 3, minDesdeAnterior: 10, pnlPrevio: 70, revancha: false });
    expect(contextoDelDia(dia[0], dia)).toEqual({ ordinal: 1, minDesdeAnterior: 60, pnlPrevio: 100, revancha: false });
  });

  it("marca revancha solo si vuelve al mismo instrumento tras una pérdida y dentro del enfriamiento", () => {
    const vuelta = op(5, "2026-07-01T08:35:00Z", "2026-07-01T08:50:00Z", 10);
    expect(contextoDelDia(vuelta, [...dia, vuelta]).revancha).toBe(true);
    const minutoDespues = (m: number) => new Date(dia[0].closedAt.getTime() + m * 60000).toISOString();
    const justo = op(6, minutoDespues(ENFRIAMIENTO_MIN), "2026-07-01T11:00:00Z", 10);
    const pasado = op(7, minutoDespues(ENFRIAMIENTO_MIN + 1), "2026-07-01T11:00:00Z", 10);
    expect(contextoDelDia(justo, [dia[0], justo]).revancha).toBe(true);
    expect(contextoDelDia(pasado, [dia[0], pasado]).revancha).toBe(false);
    const otroInstrumento = op(8, minutoDespues(5), "2026-07-01T11:00:00Z", 10, "NQ");
    expect(contextoDelDia(otroInstrumento, [dia[0], otroInstrumento]).revancha).toBe(false);
  });

  it("en la muestra no es el mismo para todas", () => {
    const vistos = new Set(TRADES.map((t) => JSON.stringify(contextoDelDia(t, TRADES))));
    expect(vistos.size).toBeGreaterThan(50);
  });
});
