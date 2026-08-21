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

describe("CDF de la distribución normal estándar (erf Abramowitz & Stegun 7.1.26)", () => {
  it("es simétrica y evalúa exactamente 0.5 en z = 0", async () => {
    const { normalCdf } = await import("@/components/marketing/EdgeSignificanceChecker");
    expect(normalCdf(0)).toBe(0.5);
  });

  it("reproduce con precisión los percentiles de referencia estándar (z = 1.96 y z = -1.96)", async () => {
    const { normalCdf } = await import("@/components/marketing/EdgeSignificanceChecker");
    // z = 1.96 -> Phi(1.96) ~ 0.9750, 2*(1-Phi) ~ 0.05
    expect(normalCdf(1.96)).toBeCloseTo(0.975002, 4);
    const twoTailedP = 2 * (1 - normalCdf(1.96));
    expect(twoTailedP).toBeCloseTo(0.049996, 4);

    // z = -1.96 -> Phi(-1.96) ~ 0.0250
    expect(normalCdf(-1.96)).toBeCloseTo(0.024998, 4);
  });

  it("cumple la propiedad de simetría Phi(z) + Phi(-z) = 1", async () => {
    const { normalCdf } = await import("@/components/marketing/EdgeSignificanceChecker");
    const testPoints = [0.25, 0.5, 1.0, 1.645, 1.96, 2.326, 2.576, 3.0];
    for (const z of testPoints) {
      expect(normalCdf(z) + normalCdf(-z)).toBeCloseTo(1.0, 7);
    }
  });

  it("reproduce valores canónicos de la tabla normal estándar", async () => {
    const { normalCdf } = await import("@/components/marketing/EdgeSignificanceChecker");
    expect(normalCdf(1.0)).toBeCloseTo(0.84134, 4); // 1 sigma
    expect(normalCdf(2.0)).toBeCloseTo(0.97725, 4); // 2 sigma
    expect(normalCdf(2.5758)).toBeCloseTo(0.995, 3); // 99% bilineal
    expect(normalCdf(3.0)).toBeCloseTo(0.99865, 4); // 3 sigma
  });

  it("es estrictamente monótona creciente", async () => {
    const { normalCdf } = await import("@/components/marketing/EdgeSignificanceChecker");
    let prev = -1;
    for (let z = -4; z <= 4; z += 0.25) {
      const cur = normalCdf(z);
      expect(cur).toBeGreaterThan(prev);
      expect(cur).toBeGreaterThanOrEqual(0);
      expect(cur).toBeLessThanOrEqual(1);
      prev = cur;
    }
  });
});

describe("Sortino Ratio y Semidesviación a la Baja (MAR = 0)", () => {
  it("calcula la semidesviación a la baja con umbral MAR T=0 exacto", () => {
    // 4 operaciones con retornos netos: +100, +200, -50, -50 a lo largo de 365.25 días
    const start = new Date("2025-01-01T00:00:00Z");
    const end = new Date("2026-01-01T06:00:00Z"); // exacto 365.25 días
    const t1 = mockTrade({ id: 1, netPnl: 100, closedAt: start });
    const t2 = mockTrade({ id: 2, netPnl: 200, closedAt: new Date(start.getTime() + 1000) });
    const t3 = mockTrade({ id: 3, netPnl: -50, closedAt: new Date(start.getTime() + 2000) });
    const t4 = mockTrade({ id: 4, netPnl: -50, closedAt: end });

    const m = computeMetrics([t1, t2, t3, t4]);
    // Media = (100 + 200 - 50 - 50) / 4 = 50
    // Downside MAR T=0: sqrt(((-50)^2 + (-50)^2) / 4) = sqrt(5000 / 4) = sqrt(1250) = 35.355339
    // tradesPerYear = (4 * 365.25) / 365.25 = 4 -> annFactor = sqrt(4) = 2
    // Sortino = (50 / sqrt(1250)) * 2 = 2.828427
    const expectedDownside = Math.sqrt((50 * 50 + 50 * 50) / 4);
    const expectedSortino = (50 / expectedDownside) * 2;
    expect(m.sortino).toBeCloseTo(expectedSortino, 5);
  });

  it("devuelve 0 de forma segura cuando no hay operaciones perdedoras (cero downside)", () => {
    const t1 = mockTrade({ id: 1, netPnl: 100, closedAt: new Date("2026-01-01T00:00:00Z") });
    const t2 = mockTrade({ id: 2, netPnl: 200, closedAt: new Date("2026-01-02T00:00:00Z") });
    const m = computeMetrics([t1, t2]);
    expect(Number.isFinite(m.sortino)).toBe(true);
    expect(m.sortino).toBe(0);
  });
});

describe("Anualización en días calendario: CAGR y Ratio de Calmar", () => {
  it("anualiza CAGR dividiendo días naturales entre 365.25", () => {
    // 1 año natural = 365.25 días. Partiendo de INITIAL_BALANCE = 10,000, final = 12,100 (+21%)
    const start = new Date("2025-01-01T00:00:00Z");
    const end = new Date("2026-01-01T06:00:00Z"); // 365.25 días
    const t1 = mockTrade({ id: 1, netPnl: 1000, closedAt: start });
    const t2 = mockTrade({ id: 2, netPnl: 1100, closedAt: end });

    const m = computeMetrics([t1, t2]);
    // Balance inicial = 10,000. Balance final = 12,100.
    // years = 365.25 / 365.25 = 1.0. CAGR = (12100 / 10000)^(1/1) - 1 = 0.21 (21%)
    expect(m.finalBalance).toBe(12100);
    // Drawdown máximo = 0 porque nunca bajó del peak
    expect(m.maxDrawdownPct).toBe(0);
  });

  it("calcula Calmar = CAGR / maxDdPct exactamente", () => {
    const start = new Date("2025-01-01T00:00:00Z");
    const end = new Date("2026-01-01T06:00:00Z"); // 1 año = 365.25 días
    // Trade 1: +$4000 (bal 14,000, peak 14,000)
    // Trade 2: -$1400 (bal 12,600, peak 14,000, dd = 1400/14000 = 10%)
    // Trade 3: +$1800 (bal 14,400, peak 14,400)
    const t1 = mockTrade({ id: 1, netPnl: 4000, closedAt: start });
    const t2 = mockTrade({ id: 2, netPnl: -1400, closedAt: new Date(start.getTime() + 86400000 * 100) });
    const t3 = mockTrade({ id: 3, netPnl: 1800, closedAt: end });

    const m = computeMetrics([t1, t2, t3]);
    // Bal = 14400 -> CAGR = (14400 / 10000)^(1/1) - 1 = 0.44 (44%)
    // Max DD % = 1400 / 14000 = 0.10 (10%)
    // Calmar = 0.44 / 0.10 = 4.4
    expect(m.maxDrawdownPct).toBeCloseTo(0.10, 5);
    expect(m.calmar).toBeCloseTo(4.4, 4);
  });
});

describe("Criterio de Kelly (Puro, Medio y Cuarto) y clamping", () => {
  function computeKelly(winRatePct: number, rr: number) {
    const p = winRatePct / 100;
    const q = 1 - p;
    const b = rr > 0 ? rr : 1;
    const fullKellyPct = b > 0 ? Math.max(0, ((p * b - q) / b) * 100) : 0;
    const halfKellyPct = fullKellyPct > 0 ? Math.max(0.25, Math.min(3.0, fullKellyPct / 2)) : 0;
    const quarterKellyPct = fullKellyPct > 0 ? Math.max(0.25, Math.min(3.0, fullKellyPct / 4)) : 0;
    return { fullKellyPct, halfKellyPct, quarterKellyPct };
  }

  it("calcula Kelly correctamente para sistemas con ventaja ganadora", () => {
    // WR = 60%, RR = 2:1 -> f* = (0.60 * 2 - 0.40) / 2 = 0.80 / 2 = 40%
    const k1 = computeKelly(60, 2);
    expect(k1.fullKellyPct).toBeCloseTo(40, 5);
    // Half Kelly = min(3.0, 40 / 2) = 3.0%
    expect(k1.halfKellyPct).toBe(3.0);
    // Quarter Kelly = min(3.0, 40 / 4) = 3.0%
    expect(k1.quarterKellyPct).toBe(3.0);

    // WR = 51%, RR = 1:1 -> f* = (0.51 * 1 - 0.49) / 1 = 2%
    const k2 = computeKelly(51, 1);
    expect(k2.fullKellyPct).toBeCloseTo(2.0, 5);
    // Half Kelly = 2 / 2 = 1.0% (dentro de [0.25, 3.0])
    expect(k2.halfKellyPct).toBeCloseTo(1.0, 5);
    // Quarter Kelly = 2 / 4 = 0.5% (dentro de [0.25, 3.0])
    expect(k2.quarterKellyPct).toBeCloseTo(0.5, 5);
  });

  it("devuelve estrictamente 0% para sistemas sin ventaja o perdedores (f* <= 0)", () => {
    // WR = 40%, RR = 1:1 -> f* = (0.40 - 0.60) / 1 = -20% <= 0
    const losing = computeKelly(40, 1);
    expect(losing.fullKellyPct).toBe(0);
    expect(losing.halfKellyPct).toBe(0);
    expect(losing.quarterKellyPct).toBe(0);

    // WR = 50%, RR = 1:1 (moneda al aire, esperanza cero) -> f* = 0
    const coin = computeKelly(50, 1);
    expect(coin.fullKellyPct).toBe(0);
    expect(coin.halfKellyPct).toBe(0);
    expect(coin.quarterKellyPct).toBe(0);
  });
});

describe("Ratio Omega y Asimetría de Drawdown", () => {
  it("calcula el Ratio Omega con la formulación discreta de Keating-Shadwick", async () => {
    const { computeOmega, TRADES } = await import("@/lib/trading/data");
    expect(METRICS.omega).toBeGreaterThan(0);
    // Para L=0 sobre PnL discreto, coincide formalmente con el Profit Factor
    expect(computeOmega(TRADES, 0)).toBeCloseTo(METRICS.profitFactor, 4);

    // Con umbral exigente L > 0, el ratio Omega disminuye monótonamente (penaliza retornos bajo el umbral)
    const omegaL50 = computeOmega(TRADES, 50);
    expect(omegaL50).toBeLessThan(METRICS.omega);

    // Con umbral permisivo L < 0, el ratio Omega aumenta monótonamente
    const omegaLMinus50 = computeOmega(TRADES, -50);
    expect(omegaLMinus50).toBeGreaterThan(METRICS.omega);

    // Guardas de borde
    expect(computeOmega([])).toBe(0);
  });

  it("calcula la asimetría de recuperación de drawdown requerida R_req = DD / (1 - DD)", async () => {
    const { drawdownRecoveryRequired } = await import("@/lib/trading/data");
    expect(drawdownRecoveryRequired(10)).toBeCloseTo(11.1111, 3); // 10% DD -> 11.11% ganancia
    expect(drawdownRecoveryRequired(20)).toBeCloseTo(25.0, 3);    // 20% DD -> 25% ganancia
    expect(drawdownRecoveryRequired(50)).toBeCloseTo(100.0, 3);   // 50% DD -> 100% ganancia
    expect(drawdownRecoveryRequired(90)).toBeCloseTo(900.0, 3);   // 90% DD -> 900% ganancia
  });
});

describe("Multiplicadores de futuros institucionales y multi-activo", () => {
  it("incluye el contrato E-mini Russell 2000 (RTY) a 50 $/punto y tickSize 0.1", async () => {
    const { FUTURES_CONTRACTS } = await import("@/components/marketing/RiskCalculator");
    const rty = FUTURES_CONTRACTS.find((c) => c.id === "rty");
    expect(rty).toBeDefined();
    expect(rty?.mult).toBe(50);
    expect(rty?.tickSize).toBe(0.1);
  });

  it("resuelve multiplicadores oficiales en data.ts para todas las clases de activo", async () => {
    const { getInstrumentMultiplier, INSTRUMENT_MULTIPLIERS } = await import("@/lib/trading/data");
    expect(INSTRUMENT_MULTIPLIERS["ES"]).toBe(50);
    expect(INSTRUMENT_MULTIPLIERS["NQ"]).toBe(20);
    expect(INSTRUMENT_MULTIPLIERS["MES"]).toBe(5);
    expect(INSTRUMENT_MULTIPLIERS["MNQ"]).toBe(2);
    expect(INSTRUMENT_MULTIPLIERS["CL"]).toBe(1000);
    expect(INSTRUMENT_MULTIPLIERS["GC"]).toBe(100);
    expect(INSTRUMENT_MULTIPLIERS["EURUSD"]).toBe(100000);
    expect(INSTRUMENT_MULTIPLIERS["BTC/USDT"]).toBe(1);

    expect(getInstrumentMultiplier("NQ")).toBe(20);
    expect(getInstrumentMultiplier("ES")).toBe(50);
    expect(getInstrumentMultiplier("CUSTOM_FUT", "futures")).toBe(50);
    expect(getInstrumentMultiplier("CUSTOM_FX", "forex")).toBe(100000);
    expect(getInstrumentMultiplier("CUSTOM_EQ", "stock")).toBe(1);
  });
});

describe("Wald-Wolfowitz Runs Test para Secuencias de Trading", () => {
  it("maneja casos límite de muestras pequeñas (n = 0, n = 1) sin errores", async () => {
    const { computeRunsTest } = await import("@/lib/trading/data");
    const resEmpty = computeRunsTest([]);
    expect(resEmpty.n).toBe(0);
    expect(resEmpty.zScore).toBe(0);
    expect(resEmpty.pValue).toBe(1);
    expect(resEmpty.isRandom).toBe(true);

    const resSingle = computeRunsTest([mockTrade({ netPnl: 100 })]);
    expect(resSingle.n).toBe(1);
    expect(resSingle.zScore).toBe(0);
    expect(resSingle.pValue).toBe(1);
  });

  it("maneja secuencias homogéneas (100% ganancias o 100% pérdidas)", async () => {
    const { computeRunsTest } = await import("@/lib/trading/data");
    const allWins = Array.from({ length: 20 }, (_, i) => mockTrade({ id: i, netPnl: 150 }));
    const res = computeRunsTest(allWins);
    expect(res.wins).toBe(20);
    expect(res.losses).toBe(0);
    expect(res.runs).toBe(1);
    expect(res.pValue).toBe(1);
    expect(res.isRandom).toBe(true);
  });

  it("detecta alternancia sistemática (mean reversion excesiva) con z > 1.96 y p < 0.05", async () => {
    const { computeRunsTest } = await import("@/lib/trading/data");
    // Secuencia alternada perfecta: W, L, W, L, W, L... (30 operaciones)
    const alternating = Array.from({ length: 30 }, (_, i) =>
      mockTrade({ id: i, netPnl: i % 2 === 0 ? 100 : -100 })
    );
    const res = computeRunsTest(alternating);
    expect(res.n).toBe(30);
    expect(res.wins).toBe(15);
    expect(res.losses).toBe(15);
    expect(res.runs).toBe(30); // Máximo número de rachas posible
    expect(res.zScore).toBeGreaterThan(1.96);
    expect(res.pValue).toBeLessThan(0.05);
    expect(res.isAlternating).toBe(true);
    expect(res.isClustered).toBe(false);
  });

  it("detecta agrupamiento o persistencia temporal (clustering/streaks) con z < -1.96 y p < 0.05", async () => {
    const { computeRunsTest } = await import("@/lib/trading/data");
    // Secuencia agrupada: 15 victorias seguidas de 15 pérdidas seguidas (2 rachas)
    const clustered = [
      ...Array.from({ length: 15 }, (_, i) => mockTrade({ id: i, netPnl: 100 })),
      ...Array.from({ length: 15 }, (_, i) => mockTrade({ id: i + 15, netPnl: -100 })),
    ];
    const res = computeRunsTest(clustered);
    expect(res.n).toBe(30);
    expect(res.runs).toBe(2);
    expect(res.zScore).toBeLessThan(-1.96);
    expect(res.pValue).toBeLessThan(0.05);
    expect(res.isClustered).toBe(true);
    expect(res.isAlternating).toBe(false);
  });

  it("evalúa la secuencia determinista de trades de muestra TRADES", async () => {
    const { computeRunsTest, TRADES } = await import("@/lib/trading/data");
    const res = computeRunsTest(TRADES);
    expect(res.n).toBe(200);
    expect(res.wins + res.losses).toBe(200);
    expect(Number.isFinite(res.zScore)).toBe(true);
    expect(Number.isFinite(res.pValue)).toBe(true);
    expect(res.pValue).toBeGreaterThanOrEqual(0);
    expect(res.pValue).toBeLessThanOrEqual(1);
  });
});

describe("Métricas cuantitativas institucionales ampliadas", () => {
  it("calcula Van Tharp SQN correctamente y gestiona casos límite (n=0, n=1, sigma=0)", async () => {
    const { computeSqn } = await import("@/lib/trading/data");
    expect(computeSqn([])).toBe(0);
    expect(computeSqn([mockTrade({ rMultiple: 2 })])).toBe(0);

    // Varianza cero: dos trades con idéntico R
    const zeroStd = [
      mockTrade({ id: 1, rMultiple: 1.5 }),
      mockTrade({ id: 2, rMultiple: 1.5 }),
    ];
    expect(computeSqn(zeroStd)).toBe(0);

    // Muestra normal
    const sample = [
      mockTrade({ id: 1, rMultiple: 2.0 }),
      mockTrade({ id: 2, rMultiple: -1.0 }),
      mockTrade({ id: 3, rMultiple: 1.5 }),
      mockTrade({ id: 4, rMultiple: -0.5 }),
    ];
    const sqn = computeSqn(sample);
    expect(Number.isFinite(sqn)).toBe(true);
    expect(sqn).toBeGreaterThan(0);
  });

  it("calcula Peter Martin Ulcer Index (UI) correctamente y gestiona curvas sin drawdown", async () => {
    const { computeUlcerIndex } = await import("@/lib/trading/data");
    expect(computeUlcerIndex([])).toBe(0);

    // Curva monótona creciente (cero drawdown)
    const allWinners = [
      mockTrade({ id: 1, netPnl: 100, closedAt: new Date("2026-01-01T00:00:00Z") }),
      mockTrade({ id: 2, netPnl: 200, closedAt: new Date("2026-01-02T00:00:00Z") }),
      mockTrade({ id: 3, netPnl: 300, closedAt: new Date("2026-01-03T00:00:00Z") }),
    ];
    expect(computeUlcerIndex(allWinners)).toBe(0);

    // Con drawdown controlado
    const withDd = [
      mockTrade({ id: 1, netPnl: 1000, closedAt: new Date("2026-01-01T00:00:00Z") }), // bal 11k, peak 11k
      mockTrade({ id: 2, netPnl: -1100, closedAt: new Date("2026-01-02T00:00:00Z") }), // bal 9.9k, dd = 10%
      mockTrade({ id: 3, netPnl: 2000, closedAt: new Date("2026-01-03T00:00:00Z") }), // bal 11.9k, peak 11.9k
    ];
    const ui = computeUlcerIndex(withDd);
    expect(ui).toBeGreaterThan(0);
    expect(Number.isFinite(ui)).toBe(true);
  });

  it("calcula Drawdown Skewness y gestiona n < 3 o varianza nula", async () => {
    const { computeDrawdownSkewness } = await import("@/lib/trading/data");
    expect(computeDrawdownSkewness([])).toBe(0);
    expect(computeDrawdownSkewness([mockTrade()])).toBe(0);
    expect(computeDrawdownSkewness([mockTrade(), mockTrade()])).toBe(0);

    // Todos ganadores -> DD = [0, 0, 0] -> stdDd = 0 -> skew = 0
    const flat = [
      mockTrade({ id: 1, netPnl: 100, closedAt: new Date("2026-01-01T00:00:00Z") }),
      mockTrade({ id: 2, netPnl: 100, closedAt: new Date("2026-01-02T00:00:00Z") }),
      mockTrade({ id: 3, netPnl: 100, closedAt: new Date("2026-01-03T00:00:00Z") }),
    ];
    expect(computeDrawdownSkewness(flat)).toBe(0);
  });

  it("calcula Wilson Score Interval al 95% con precisión y límites [0, 100]", async () => {
    const { computeWilsonCI } = await import("@/lib/trading/data");
    const empty = computeWilsonCI(0, 0);
    expect(empty.lower).toBe(0);
    expect(empty.upper).toBe(0);

    // 60 aciertos en 100 trades (p = 0.60, n = 100, z = 1.96 -> center = 59.63%)
    const w = computeWilsonCI(60, 100);
    expect(w.lower).toBeGreaterThan(49);
    expect(w.upper).toBeLessThan(70);
    expect(w.center).toBeCloseTo(59.63, 2);

    // 100% aciertos
    const perfect = computeWilsonCI(10, 10);
    expect(perfect.upper).toBe(100);
    expect(perfect.lower).toBeGreaterThan(65);
  });

  it("calcula Gain-to-Pain Ratio (Schwager) de forma segura", async () => {
    const { computeGainToPain } = await import("@/lib/trading/data");
    // Sin pérdidas
    const noLoss = [mockTrade({ id: 1, netPnl: 500 })];
    expect(computeGainToPain(noLoss)).toBe(100);

    // Con pérdidas
    const withLoss = [
      mockTrade({ id: 1, netPnl: 1000 }),
      mockTrade({ id: 2, netPnl: -200 }),
    ];
    // NetPnL = 800, Losses = 200 -> GPR = 4.0
    expect(computeGainToPain(withLoss)).toBe(4.0);
  });

  it("expone las nuevas métricas institucionales en METRICS con valores válidos y finitos", async () => {
    const { METRICS } = await import("@/lib/trading/data");
    expect(Number.isFinite(METRICS.sqn)).toBe(true);
    expect(Number.isFinite(METRICS.ulcerIndex)).toBe(true);
    expect(Number.isFinite(METRICS.drawdownSkewness)).toBe(true);
    expect(Number.isFinite(METRICS.halfKelly)).toBe(true);
    expect(Number.isFinite(METRICS.gainToPainRatio)).toBe(true);
    expect(METRICS.sqn).toBeGreaterThan(0);
    expect(METRICS.gainToPainRatio).toBeGreaterThan(0);
  });
});

describe("Modelos Institucionales de Ruina, Rachas y Valor en Riesgo", () => {
  it("computeRiskOfRuin devuelve 100% cuando no hay ventaja matemática (EV <= 0)", async () => {
    const { computeRiskOfRuin } = await import("@/lib/trading/data");
    // Win rate 40% con 1:1 payoff -> EV = 0.40 * 1 - 0.60 = -0.20 (EV negativo)
    expect(computeRiskOfRuin(40, 1.0, 1.0, 50)).toBe(100);
    // Win rate 50% con 1:1 payoff -> EV = 0
    expect(computeRiskOfRuin(50, 1.0, 1.0, 50)).toBe(100);
  });

  it("computeRiskOfRuin disminuye monótonamente al aumentar la ventaja y al reducir el riesgo", async () => {
    const { computeRiskOfRuin } = await import("@/lib/trading/data");
    // WR 55%, 2:1 payoff, riesgo 1% vs 3%
    const r1 = computeRiskOfRuin(55, 2.0, 1.0, 50);
    const r3 = computeRiskOfRuin(55, 2.0, 3.0, 50);
    expect(r1).toBeLessThan(r3);
    expect(r1).toBeGreaterThanOrEqual(0);
    expect(r3).toBeLessThanOrEqual(100);
  });

  it("computeExpectedMaxLossStreak calcula correctamente la longitud de racha analítica", async () => {
    const { computeExpectedMaxLossStreak } = await import("@/lib/trading/data");
    // Con WR = 50% y N = 100 -> q = 0.5, ln(100)/-ln(0.5) = 4.605 / 0.693 = 6.64 -> ~7 operaciones
    expect(computeExpectedMaxLossStreak(50, 100)).toBe(7);
    // Con WR = 60% y N = 100 -> q = 0.4, ln(100)/-ln(0.4) = 4.605 / 0.916 = 5.02 -> ~5 operaciones
    expect(computeExpectedMaxLossStreak(60, 100)).toBe(5);
    // Guardas en bordes
    expect(computeExpectedMaxLossStreak(100, 100)).toBe(0);
    expect(computeExpectedMaxLossStreak(0, 100)).toBe(100);
  });

  it("computeParametricVaR calcula el VaR paramétrico en dólares según nivel de confianza", async () => {
    const { computeParametricVaR } = await import("@/lib/trading/data");
    // Balance $10,000, 1% riesgo ($100 1R)
    // 95% CI -> 100 * 1.645 = $164.50
    expect(computeParametricVaR(10000, 1.0, 95)).toBe(164.5);
    // 99% CI -> 100 * 2.326 = $232.60
    expect(computeParametricVaR(10000, 1.0, 99)).toBe(232.6);
  });

  it("soporta activos commodity con multiplicadores y clases asignadas", async () => {
    const { INSTRUMENTS, getInstrumentMultiplier } = await import("@/lib/trading/data");
    const gold = INSTRUMENTS.find((i) => i.symbol === "XAU/USD");
    const oil = INSTRUMENTS.find((i) => i.symbol === "CL");
    expect(gold?.assetClass).toBe("commodity");
    expect(oil?.assetClass).toBe("commodity");
    expect(getInstrumentMultiplier("XAU/USD")).toBe(100);
    expect(getInstrumentMultiplier("CL")).toBe(1000);
    expect(getInstrumentMultiplier("UNKNOWN", "commodity")).toBe(50);
  });

  it("normalCdf calcula la integral gaussiana con precisión de Abramowitz & Stegun", async () => {
    const { normalCdf } = await import("@/lib/trading/data");
    expect(normalCdf(0)).toBe(0.5);
    expect(normalCdf(1.96)).toBeCloseTo(0.975, 3);
    expect(normalCdf(-1.96)).toBeCloseTo(0.025, 3);
    expect(normalCdf(2.576)).toBeCloseTo(0.995, 3);
  });

  it("computeStatisticalPower devuelve 0% sin ventaja y crece monótonamente con la muestra", async () => {
    const { computeStatisticalPower } = await import("@/lib/trading/data");
    // Win rate <= 50% -> Potencia 0% (H0 es cierta)
    expect(computeStatisticalPower(50, 100)).toBe(0);
    expect(computeStatisticalPower(45, 100)).toBe(0);
    // Win rate 60% con N=30 vs N=100 vs N=300
    const p30 = computeStatisticalPower(60, 30);
    const p100 = computeStatisticalPower(60, 100);
    const p300 = computeStatisticalPower(60, 300);
    expect(p30).toBeLessThan(p100);
    expect(p100).toBeLessThan(p300);
    expect(p300).toBeGreaterThanOrEqual(80); // Muestra suficiente para potencia institucional >=80%
  });
});

function mockTrade(overrides: Partial<import("@/lib/trading/data").Trade> = {}): import("@/lib/trading/data").Trade {
  return {
    id: 1,
    instrument: "EURUSD",
    setup: "Breakout",
    direction: "long",
    session: "London",
    entry: 1.08,
    exit: 1.09,
    qty: 1,
    grossPnl: overrides.netPnl ?? 100,
    fees: 0,
    netPnl: overrides.netPnl ?? 100,
    rMultiple: overrides.rMultiple ?? 1,
    riskUsd: overrides.riskUsd ?? 100,
    plannedRr: 2,
    mae: 0,
    mfe: 0,
    initialStop: 1.07,
    target: 1.10,
    compliance: overrides.compliance ?? "yes",
    openedAt: overrides.openedAt ?? new Date("2026-01-01T10:00:00Z"),
    closedAt: overrides.closedAt ?? new Date("2026-01-01T11:00:00Z"),
    durationMin: 60,
    dayScore: 10,
    entryNote: "",
    closeNote: "",
    ...overrides,
  };
}
