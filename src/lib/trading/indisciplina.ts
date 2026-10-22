/**
 * Coste de indisciplina (calculadora DisciplineCost): lo que se deja de ganar
 * en las operaciones fuera de plan frente a las de dentro, al mes y al año.
 * Si fuera de plan rinde igual o más que dentro, no hay fuga que facturar:
 * la brecha se queda en cero y `sinCoste` lo dice.
 */
export function costeIndisciplina(
  totalTrades: number,
  breachPct: number,
  inPlanExp: number,
  offPlanExp: number,
) {
  const offPlanTrades = Math.round((totalTrades * breachPct) / 100);
  const inPlanTrades = Math.max(0, totalTrades - offPlanTrades);
  const gapBruta = inPlanExp - offPlanExp;
  const gap = Math.max(0, gapBruta);
  const totalLeakMonthly = offPlanTrades * gap;
  return {
    offPlanTrades,
    inPlanTrades,
    gap,
    sinCoste: gapBruta <= 0,
    planPierde: inPlanExp < 0,
    inPlanTotal: inPlanTrades * inPlanExp,
    offPlanTotal: offPlanTrades * offPlanExp,
    totalLeakMonthly,
    totalLeakAnnual: totalLeakMonthly * 12,
  };
}
