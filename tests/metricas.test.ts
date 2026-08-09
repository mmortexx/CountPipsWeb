import { describe, expect, it } from "vitest";
import { METRICS, TRADES, computeMetrics } from "@/lib/trading/data";
import { getRDistribution } from "@/lib/trading/fixtures";

/**
 * El motor de métricas y la distribución que alimenta la portada.
 *
 * Estas pruebas existen por un fallo concreto: la sección insignia de la
 * home dibujaba su histograma con nueve alturas escritas a mano y elegía
 * el color por el ÍNDICE de la barra, no por el signo de la operación. El
 * resultado era que las pérdidas salían verdes y las ganancias rojas, en
 * un diario de trading, durante meses.
 */

describe("motor de métricas", () => {
  it("es determinista: dos cálculos sobre las mismas operaciones dan lo mismo", () => {
    const a = computeMetrics(TRADES);
    const b = computeMetrics(TRADES);
    expect(a.netPnl).toBe(b.netPnl);
    expect(a.sharpe).toBe(b.sharpe);
    expect(a.expectancyR).toBe(b.expectancyR);
  });

  it("las ganadoras más las perdedoras no superan el total de operaciones", () => {
    expect(METRICS.wins + METRICS.losses).toBeLessThanOrEqual(METRICS.closedCount);
  });

  it("el porcentaje de ganadoras se corresponde con el recuento de ganadoras", () => {
    expect(METRICS.winRate).toBeCloseTo(METRICS.wins / METRICS.closedCount, 6);
  });

  it("la esperanza en R es la media de los R-múltiplos", () => {
    const rs = TRADES.map((t) => t.rMultiple).filter(Number.isFinite);
    const media = rs.reduce((s, r) => s + r, 0) / rs.length;
    expect(METRICS.expectancyR).toBeCloseTo(media, 6);
  });

  it("el profit factor es coherente con el signo del resultado neto", () => {
    // Con resultado neto positivo, el factor tiene que estar por encima
    // de 1. Si esto falla, uno de los dos está mal calculado.
    if (METRICS.netPnl > 0) expect(METRICS.profitFactor).toBeGreaterThan(1);
    if (METRICS.netPnl < 0) expect(METRICS.profitFactor).toBeLessThan(1);
  });

  it("el drawdown máximo es un porcentaje entre 0 y 1", () => {
    expect(METRICS.maxDrawdownPct).toBeGreaterThan(0);
    expect(METRICS.maxDrawdownPct).toBeLessThan(1);
  });

  it("la muestra es plausible: ni un sistema milagroso ni uno roto", () => {
    // No fija cifras exactas —cambiarían al tocar el generador— pero sí
    // marca el rango de lo defendible en una web pública. Una muestra que
    // se saliera de aquí sería propaganda, no demostración.
    expect(METRICS.winRate).toBeGreaterThan(0.3);
    expect(METRICS.winRate).toBeLessThan(0.75);
    expect(METRICS.profitFactor).toBeLessThan(4);
    expect(METRICS.expectancyR).toBeLessThan(1);
  });
});

describe("distribución de R que dibuja la portada", () => {
  const bins = getRDistribution();

  it("no está vacía", () => {
    expect(bins.length).toBeGreaterThan(0);
  });

  it("cuenta exactamente todas las operaciones, ni una más ni una menos", () => {
    const suma = bins.reduce((s, b) => s + b.count, 0);
    expect(suma).toBe(TRADES.filter((t) => Number.isFinite(t.rMultiple)).length);
  });

  it("los cubos son contiguos y del mismo ancho", () => {
    for (let i = 1; i < bins.length; i++) {
      expect(bins[i].from).toBeCloseTo(bins[i - 1].to, 6);
    }
    const ancho = bins[0].to - bins[0].from;
    for (const b of bins) expect(b.to - b.from).toBeCloseTo(ancho, 6);
  });

  it("EL FALLO QUE HUBO: marca como pérdida todo cubo que acabe en cero o menos", () => {
    // Este es el invariante que faltaba. El componente pinta en rojo si
    // `losing` y en verde si no; si esta bandera se calculara otra vez por
    // posición en la lista en vez de por el signo de la R, esta prueba
    // falla antes de que nadie lo vea en pantalla.
    for (const b of bins) {
      expect(b.losing).toBe(b.to <= 0);
    }
  });

  it("ningún cubo de pérdida contiene operaciones ganadoras, y al revés", () => {
    for (const b of bins) {
      const dentro = TRADES.filter(
        (t) => t.rMultiple >= b.from && t.rMultiple < b.to
      );
      if (b.losing) {
        expect(dentro.every((t) => t.rMultiple < 0)).toBe(true);
      } else {
        expect(dentro.every((t) => t.rMultiple >= 0)).toBe(true);
      }
    }
  });

  it("el reparto de ganadoras del gráfico coincide con el del motor", () => {
    // La contradicción original: el gráfico dibujaba un 63 % de ganadoras
    // y el pie declaraba 50 %. Al salir los dos del mismo cálculo ya no
    // pueden discrepar, y esta prueba lo deja fijado.
    const total = bins.reduce((s, b) => s + b.count, 0);
    const ganadoras = bins.filter((b) => !b.losing).reduce((s, b) => s + b.count, 0);
    expect(ganadoras / total).toBeCloseTo(METRICS.winRate, 2);
  });
});
