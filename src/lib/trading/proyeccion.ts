import { sinRuido } from "./estadistica";

/** Racha máxima de pérdidas al nivel de confianza fijado en el motor. */
export const CONFIANZA_RACHA = 0.99;

/** Techo de un balance proyectado que se enseña como cifra: por encima (o si deja de ser finito) es un desbordamiento, no una proyección. */
export const LIMITE_PROYECCION_USD = 1e12;

export type ModoReinversion = "compound" | "linear";

export interface ParametrosProyeccion {
  startBalance: number;
  tradesPerYear: number;
  winRate: number; // %
  avgWinR: number;
  avgLossR: number;
  riskPct: number; // %
  years: number;
  reinvestMode: ModoReinversion;
  monthlyContribution: number;
  frictionR: number;
}

export interface PuntoMensual {
  month: number;
  year: number;
  trades: number;
  balance: number;
  lowerBalance: number;
  upperBalance: number;
  totalDeposited: number;
  netProfit: number;
}

export interface FilaAnual {
  year: number;
  startBal: number;
  endBal: number;
  trades: number;
  yearProfit: number;
  yearReturnPct: number;
  cumulativeProfit: number;
  estDrawdownPct: number;
}

export interface ResultadoProyeccion {
  grossExpectancyR: number;
  netExpectancyR: number;
  hasEdge: boolean;
  profitFactor: number;
  fullKellyPct: number;
  halfKellyPct: number;
  growthPerTrade: number;
  monthlyPoints: PuntoMensual[];
  finalBalance: number;
  finalNetProfit: number;
  totalDeposited: number;
  totalReturnPct: number;
  cagr: number;
  maxConsecLosses: number;
  estMaxDDpct: number;
  monthsToDouble: number | null;
  expectancyUsdInitial: number;
  yearlyUsdInitial: number;
  yearlyBreakdown: FilaAnual[];
  /** true si en algún mes el balance dejó de ser finito o superó `LIMITE_PROYECCION_USD`.
   *  El crecimiento no se recorta: solo se marca para dejar de enseñar la cifra. */
  fueraDeEscala: boolean;
}

/**
 * Motor cuantitativo de EquityProjector, como función pura. Con expectancy y
 * riesgo altos y un horizonte largo el balance puede desbordar a Infinity
 * (ver `fueraDeEscala`).
 */
export function proyectaCapital(p: ParametrosProyeccion): ResultadoProyeccion {
  const {
    startBalance,
    tradesPerYear,
    winRate,
    avgWinR,
    avgLossR,
    riskPct,
    years,
    reinvestMode,
    monthlyContribution,
    frictionR,
  } = p;

  const wr = winRate / 100;
  const lr = 1 - wr;

  const grossExpectancyR = sinRuido(wr * avgWinR - lr * avgLossR);
  const netExpectancyR = sinRuido(grossExpectancyR - frictionR);
  const hasEdge = netExpectancyR > 0;

  const grossWinTotal = wr * avgWinR;
  const grossLossTotal = lr * avgLossR;
  const profitFactor = grossLossTotal > 0 ? grossWinTotal / grossLossTotal : 0;

  const b = avgLossR > 0 ? avgWinR / avgLossR : 1;
  const fullKellyPct = b > 0 ? Math.max(0, ((wr * b - lr) / b) * 100) : 0;
  const halfKellyPct = fullKellyPct / 2;

  const diffWin = avgWinR - grossExpectancyR;
  const diffLoss = -avgLossR - grossExpectancyR;
  const varPerTradeR = Math.max(0, wr * (diffWin * diffWin) + lr * (diffLoss * diffLoss));
  const stdPerTradeR = Math.sqrt(varPerTradeR);

  const growthPerTrade = (netExpectancyR * riskPct) / 100;
  const tradesPerMonth = tradesPerYear / 12;

  const totalMonths = years * 12;
  const monthlyPoints: PuntoMensual[] = [];

  let currentBalance = startBalance;
  let totalDeposited = startBalance;
  let fueraDeEscala = false;

  monthlyPoints.push({
    month: 0,
    year: 0,
    trades: 0,
    balance: currentBalance,
    lowerBalance: currentBalance,
    upperBalance: currentBalance,
    totalDeposited,
    netProfit: 0,
  });

  const z80 = 1.282; // z-score para una banda del 80 % (p10 a p90), bilateral
  const monthlyGrowthFactor = Math.pow(1 + Math.max(-0.99, growthPerTrade), tradesPerMonth);

  for (let m = 1; m <= totalMonths; m++) {
    if (reinvestMode === "compound") {
      currentBalance = Math.max(0, currentBalance * monthlyGrowthFactor + monthlyContribution);
    } else {
      const monthlyProfit = startBalance * growthPerTrade * tradesPerMonth;
      currentBalance = Math.max(0, currentBalance + monthlyProfit + monthlyContribution);
    }

    if (!Number.isFinite(currentBalance) || currentBalance > LIMITE_PROYECCION_USD) {
      fueraDeEscala = true;
    }

    totalDeposited += monthlyContribution;

    const cumulativeTrades = Math.round(m * tradesPerMonth);
    const stdCumulativeReturn = stdPerTradeR * (riskPct / 100) * Math.sqrt(cumulativeTrades);
    const expectedLogGrowth = cumulativeTrades * Math.log(Math.max(0.001, 1 + growthPerTrade));
    const upperFactor = Math.exp(expectedLogGrowth + z80 * stdCumulativeReturn);
    const lowerFactor = Math.exp(Math.max(-5, expectedLogGrowth - z80 * stdCumulativeReturn));

    const upperBalance = Math.max(0, startBalance * upperFactor + (totalDeposited - startBalance));
    const lowerBalance = Math.max(0, startBalance * lowerFactor + (totalDeposited - startBalance));

    monthlyPoints.push({
      month: m,
      year: Number((m / 12).toFixed(2)),
      trades: cumulativeTrades,
      balance: currentBalance,
      lowerBalance,
      upperBalance,
      totalDeposited,
      netProfit: currentBalance - totalDeposited,
    });
  }

  const finalBalance = monthlyPoints[monthlyPoints.length - 1].balance;
  const finalNetProfit = finalBalance - totalDeposited;
  const totalReturnPct = totalDeposited > 0 ? (finalNetProfit / totalDeposited) * 100 : 0;

  if (!Number.isFinite(finalBalance) || Math.abs(finalBalance) > LIMITE_PROYECCION_USD) {
    fueraDeEscala = true;
  }

  // Tasa anual ponderada por tiempo: se encadena la rentabilidad de cada mes
  // descontando los aportes, que no son rentabilidad.
  let factorAcumulado = 1;
  for (let m = 1; m < monthlyPoints.length && factorAcumulado > 0; m++) {
    const antes = monthlyPoints[m - 1].balance;
    const resultadoDelMes = monthlyPoints[m].balance - monthlyContribution - antes;
    factorAcumulado *= antes > 0 ? Math.max(0, 1 + resultadoDelMes / antes) : 0;
  }
  const cagr = startBalance > 0 && years > 0 ? Math.pow(factorAcumulado, 1 / years) - 1 : -1;

  const totalTrades = tradesPerYear * years;
  const maxConsecLosses =
    lr > 0 && lr < 1 && wr > 0 && totalTrades > 0
      ? Math.max(1, Math.log(-Math.log(CONFIANZA_RACHA) / (totalTrades * wr)) / Math.log(lr))
      : 0;
  const perdidaPorOp = Math.min(0.99, avgLossR * (riskPct / 100));
  const estMaxDDpct =
    reinvestMode === "compound"
      ? (1 - Math.pow(1 - perdidaPorOp, maxConsecLosses)) * 100
      : Math.min(100, maxConsecLosses * perdidaPorOp * 100);

  // Meses que tarda la estrategia, sin aportes, en duplicar el balance inicial, con la regla de la curva: compuesto multiplica, riesgo fijo suma.
  let monthsToDouble: number | null = null;
  if (hasEdge && growthPerTrade > 0 && tradesPerMonth > 0) {
    const meses =
      reinvestMode === "compound"
        ? Math.log(2) / Math.log(monthlyGrowthFactor)
        : 1 / (growthPerTrade * tradesPerMonth);
    monthsToDouble = Number.isFinite(meses) && meses > 0 ? meses : null;
  }

  const expectancyUsdInitial = netExpectancyR * (riskPct / 100) * startBalance;

  const yearlyBreakdown: FilaAnual[] = [];
  for (let y = 1; y <= years; y++) {
    const startM = (y - 1) * 12;
    const endM = y * 12;
    const startBalYear = monthlyPoints[startM].balance;
    const endBalYear = monthlyPoints[endM].balance;
    const depositsThisYear = monthlyContribution * 12;
    const yearProfit = endBalYear - startBalYear - depositsThisYear;
    const yearReturnPct = startBalYear > 0 ? (yearProfit / startBalYear) * 100 : 0;
    const cumulativeProfit = endBalYear - monthlyPoints[endM].totalDeposited;

    yearlyBreakdown.push({
      year: y,
      startBal: startBalYear,
      endBal: endBalYear,
      trades: tradesPerYear,
      yearProfit,
      yearReturnPct,
      cumulativeProfit,
      estDrawdownPct: estMaxDDpct,
    });
  }
  // El «primer año» anunciado es el año 1 de la tabla, no una suma lineal.
  const yearlyUsdInitial = yearlyBreakdown[0]?.yearProfit ?? expectancyUsdInitial * tradesPerYear;

  return {
    grossExpectancyR,
    netExpectancyR,
    hasEdge,
    profitFactor,
    fullKellyPct,
    halfKellyPct,
    growthPerTrade,
    monthlyPoints,
    finalBalance,
    finalNetProfit,
    totalDeposited,
    totalReturnPct,
    cagr,
    maxConsecLosses: Math.max(0, Math.round(maxConsecLosses)),
    estMaxDDpct: Math.max(0, estMaxDDpct),
    monthsToDouble,
    expectancyUsdInitial,
    yearlyUsdInitial,
    yearlyBreakdown,
    fueraDeEscala,
  };
}
