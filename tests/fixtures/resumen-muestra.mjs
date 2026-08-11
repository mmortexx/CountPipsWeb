/**
 * Imprime un resumen estable de la muestra de demo, para compararlo entre
 * husos horarios. Lo usa `tests/husos.test.ts`, que lo ejecuta una vez
 * por huso en su propio proceso — `TZ` la lee el motor al arrancar y no
 * se puede cambiar a mitad de una prueba.
 *
 * Con `--local` recalcula el mapa de calor, el reparto por día y el
 * calendario con los métodos de HORA LOCAL, que es la versión
 * defectuosa. Sirve para demostrar que la comprobación puede fallar: si
 * ni siquiera así divergen los husos, es que la prueba no mide nada.
 */
import {
  METRICS,
  TRADES,
  heatmap,
  weekdayBreakdown,
  monthlyBreakdown,
  dailyPnlForMonth,
} from "../../src/lib/trading/data.ts";

const local = process.argv.includes("--local");

const redondo = (n) => (typeof n === "number" ? n.toFixed(6) : String(n));

/** Las mismas tres agregaciones, pero leyendo las fechas en hora local. */
function mapaCalorLocal(trades) {
  const grid = Array.from({ length: 5 }, () => Array(6).fill(0));
  for (const t of trades) {
    const d = t.closedAt.getDay();
    if (d === 0 || d === 6) continue;
    grid[d - 1][Math.min(5, Math.floor(t.closedAt.getHours() / 4))] += t.netPnl;
  }
  return grid;
}
function porDiaLocal(trades) {
  return Array.from({ length: 7 }, (_, i) =>
    trades
      .filter((t) => (t.closedAt.getDay() === 0 ? 6 : t.closedAt.getDay() - 1) === i)
      .reduce((s, t) => s + t.netPnl, 0),
  );
}
function porMesLocal(trades) {
  const m = new Map();
  for (const t of trades) {
    const k = t.closedAt.getMonth();
    m.set(k, (m.get(k) || 0) + t.netPnl);
  }
  return [...m.entries()].sort((a, b) => a[0] - b[0]);
}

const ultima = [...TRADES].sort((a, b) => b.closedAt - a.closedAt)[0].closedAt;
const anio = local ? ultima.getFullYear() : ultima.getUTCFullYear();
const mes = local ? ultima.getMonth() : ultima.getUTCMonth();

const salida = {
  // Las métricas agregadas: son lo que la portada publica como cifras.
  metricas: Object.fromEntries(
    Object.entries(METRICS).map(([k, v]) => [k, redondo(v)]),
  ),
  // Y las tres agregaciones que sí miran el calendario.
  mapaCalor: (local ? mapaCalorLocal(TRADES) : heatmap(TRADES)).map((f) =>
    f.map(redondo),
  ),
  porDia: local
    ? porDiaLocal(TRADES).map(redondo)
    : weekdayBreakdown(TRADES).map((d) => `${d.day}:${redondo(d.pnl)}`),
  porMes: local
    ? porMesLocal(TRADES).map(([m, v]) => `${m}:${redondo(v)}`)
    : monthlyBreakdown(TRADES).map((m) => `${m.month}:${redondo(m.pnl)}`),
  calendario: [...dailyPnlForMonth(TRADES, anio, mes).entries()]
    .sort((a, b) => Number(a[0]) - Number(b[0]))
    .map(([d, v]) => `${d}:${redondo(v)}`),
};

process.stdout.write(JSON.stringify(salida, null, 1));
