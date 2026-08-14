"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useLang } from "@/lib/i18n";
import { type Trade } from "@/lib/trading/data";
import { fmtPrice, fmtNum } from "@/lib/trading/format";
import { Play, Pause, RotateCcw, Crosshair } from "lucide-react";

interface Candle {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  ma: number;
}

interface TradeCandleChartProps {
  trade: Trade;
  decimals?: number;
}

function seededRnd(seed: number) {
  let s = Math.abs(Math.floor(seed)) || 1;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

export function TradeCandleChart({ trade, decimals = 2 }: TradeCandleChartProps) {
  const { lang } = useLang();
  const es = lang === "es";

  const [timeframe, setTimeframe] = useState<"1m" | "5m" | "15m">("5m");
  const [isPlaying, setIsPlaying] = useState(false);
  const [replayIdx, setReplayIdx] = useState<number>(30);
  const [hoveredCandle, setHoveredCandle] = useState<Candle | null>(null);

  // Generate deterministic realistic candlestick path tailored to this exact trade
  const candles = useMemo(() => {
    const rnd = seededRnd(trade.id * 17 + (timeframe === "1m" ? 1 : timeframe === "5m" ? 5 : 15));
    const totalBars = 35;
    const entryIdx = 8;
    const exitIdx = 26;

    const list: Candle[] = [];
    const base = trade.entry;
    const isLong = trade.direction === "long";
    const isWin = trade.netPnl >= 0;

    let current = isLong ? base * 0.996 : base * 1.004;
    const maWindow: number[] = [];

    for (let i = 0; i < totalBars; i++) {
      let targetPrice = current;
      if (i < entryIdx) {
        // Pre-entry consolidation leading to breakout
        targetPrice = base + (rnd() - 0.5) * (base * 0.003);
      } else if (i === entryIdx) {
        // Entry bar
        targetPrice = trade.entry;
      } else if (i <= exitIdx) {
        // Active trade progress
        const progress = (i - entryIdx) / (exitIdx - entryIdx);
        if (isWin) {
          const trendDelta = isLong ? (trade.exit - trade.entry) : (trade.entry - trade.exit);
          targetPrice = isLong ? trade.entry + trendDelta * progress : trade.entry - trendDelta * progress;
        } else {
          const adverseDelta = isLong ? (trade.entry - trade.initialStop) : (trade.initialStop - trade.entry);
          targetPrice = isLong ? trade.entry - adverseDelta * progress : trade.entry + adverseDelta * progress;
        }
        targetPrice += (rnd() - 0.5) * (base * 0.002);
      } else {
        // Post-exit continuation/pullback
        targetPrice = trade.exit + (rnd() - 0.48) * (base * 0.003);
      }

      const o = current;
      const c = targetPrice;
      const h = Math.max(o, c) + rnd() * (base * 0.0015);
      const l = Math.min(o, c) - rnd() * (base * 0.0015);
      const vol = Math.floor(rnd() * 850 + 150) * (i === entryIdx || i === exitIdx ? 3 : 1);

      maWindow.push(c);
      if (maWindow.length > 7) maWindow.shift();
      const ma = maWindow.reduce((a, b) => a + b, 0) / maWindow.length;

      const date = new Date(trade.openedAt.getTime() + (i - entryIdx) * (timeframe === "1m" ? 60000 : timeframe === "5m" ? 300000 : 900000));
      const time = `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;

      list.push({ time, open: o, high: h, low: l, close: c, volume: vol, ma });
      current = c;
    }

    return list;
  }, [trade, timeframe]);

  // Replay animation effect
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setReplayIdx((curr) => {
        if (curr >= candles.length) {
          setIsPlaying(false);
          return candles.length;
        }
        return curr + 1;
      });
    }, 350);
    return () => clearInterval(interval);
  }, [isPlaying, candles.length]);

  const visibleCandles = useMemo(() => candles.slice(0, replayIdx), [candles, replayIdx]);

  // Canvas dimensions and coordinate scaling
  const allHighs = candles.map((c) => c.high);
  const allLows = candles.map((c) => c.low);
  const minPrice = Math.min(...allLows, trade.initialStop, trade.target) * 0.999;
  const maxPrice = Math.max(...allHighs, trade.initialStop, trade.target) * 1.001;
  const priceRange = maxPrice - minPrice || 1;

  const maxVol = Math.max(...candles.map((c) => c.volume), 1);

  const W = 620;
  const H = 280;
  const padL = 10;
  const padR = 65;
  const padT = 20;
  const padB = 40;
  const chartW = W - padL - padR;
  const chartH = H - padT - padB;

  const getY = (price: number) => padT + (1 - (price - minPrice) / priceRange) * chartH;
  const getX = (i: number) => padL + (i / (candles.length - 1)) * chartW;

  const entryY = getY(trade.entry);
  const stopY = getY(trade.initialStop);
  const targetY = getY(trade.target);

  return (
    <div className="demo-card p-4 sm:p-5 overflow-hidden">
      {/* Chart Header Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-[rgb(var(--divider)/0.1)]">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <span className="font-bold text-sm text-primary font-mono">{trade.instrument}</span>
            <span className="text-xs text-tertiary font-mono">· {trade.direction.toUpperCase()}</span>
          </div>

          {/* Timeframe selector */}
          <div className="flex items-center rounded-[2px] bg-[rgb(var(--divider)/0.06)] p-0.5 border border-[rgb(var(--divider)/0.1)]">
            {(["1m", "5m", "15m"] as const).map((tf) => (
              <button
                key={tf}
                type="button"
                onClick={() => {
                  setTimeframe(tf);
                  setReplayIdx(candles.length);
                }}
                className={`px-2 py-0.5 text-[10px] font-mono uppercase rounded-[1px] transition-colors ${
                  timeframe === tf
                    ? "bg-[rgb(var(--accent-base))] text-[rgb(var(--accent-ink))] font-bold"
                    : "text-tertiary hover:text-primary"
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>

        {/* Replay Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              if (replayIdx >= candles.length) setReplayIdx(8);
              setIsPlaying(!isPlaying);
            }}
            className="flex items-center gap-1.5 h-7 px-2.5 rounded-[2px] border border-[rgb(var(--accent-base)/0.3)] bg-[rgb(var(--accent-base)/0.1)] text-[rgb(var(--accent-base))] text-xs font-mono font-medium hover:bg-[rgb(var(--accent-base)/0.2)] transition-colors"
          >
            {isPlaying ? <Pause size={12} /> : <Play size={12} />}
            <span>{isPlaying ? (es ? "Pausar" : "Pause") : (es ? "Replay" : "Replay")}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setIsPlaying(false);
              setReplayIdx(candles.length);
            }}
            aria-label={es ? "Restablecer gráfico completo" : "Reset full chart"}
            className="h-7 w-7 rounded-[2px] border border-[rgb(var(--divider)/0.1)] text-tertiary hover:text-primary inline-flex items-center justify-center transition-colors"
          >
            <RotateCcw size={12} />
          </button>
        </div>
      </div>

      {/* SVG Interactive Candlestick Display */}
      <div className="relative w-full aspect-[2/1] min-h-[240px] max-h-[340px] bg-[rgb(var(--divider)/0.02)] rounded-[2px] border border-[rgb(var(--divider)/0.08)]">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full h-full select-none"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="volGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgb(var(--accent-base))" stopOpacity="0.25" />
              <stop offset="100%" stopColor="rgb(var(--accent-base))" stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0.2, 0.4, 0.6, 0.8].map((ratio) => {
            const y = padT + ratio * chartH;
            const priceVal = maxPrice - ratio * priceRange;
            return (
              <g key={ratio}>
                <line x1={padL} y1={y} x2={W - padR} y2={y} stroke="rgb(var(--divider)/0.08)" strokeDasharray="3 3" />
                <text x={W - padR + 6} y={y + 3} fill="var(--ink-3)" fontSize="9" fontFamily="monospace" textAnchor="start">
                  {fmtPrice(priceVal, decimals, lang)}
                </text>
              </g>
            );
          })}

          {/* Stop Loss Level (Red line) */}
          <g>
            <line x1={padL} y1={stopY} x2={W - padR} y2={stopY} stroke="rgb(var(--pnl-neg))" strokeWidth="1.2" strokeDasharray="4 2" />
            <rect x={W - padR + 2} y={stopY - 7} width={padR - 4} height={14} fill="rgb(var(--pnl-neg))" rx="2" />
            <text x={W - padR + 5} y={stopY + 3.5} fill="#fff" fontSize="8.5" fontWeight="bold" fontFamily="monospace">
              SL {fmtPrice(trade.initialStop, decimals, lang)}
            </text>
          </g>

          {/* Take Profit Target Level (Green line) */}
          <g>
            <line x1={padL} y1={targetY} x2={W - padR} y2={targetY} stroke="rgb(var(--pnl-pos))" strokeWidth="1.2" strokeDasharray="4 2" />
            <rect x={W - padR + 2} y={targetY - 7} width={padR - 4} height={14} fill="rgb(var(--pnl-pos))" rx="2" />
            <text x={W - padR + 5} y={targetY + 3.5} fill="#000" fontSize="8.5" fontWeight="bold" fontFamily="monospace">
              TP {fmtPrice(trade.target, decimals, lang)}
            </text>
          </g>

          {/* Entry Level (Accent line) */}
          <g>
            <line x1={padL} y1={entryY} x2={W - padR} y2={entryY} stroke="rgb(var(--accent-base))" strokeWidth="1" strokeDasharray="2 2" />
            <rect x={W - padR + 2} y={entryY - 7} width={padR - 4} height={14} fill="color-mix(in oklab, rgb(var(--accent-base)) 30%, transparent)" stroke="rgb(var(--accent-base))" rx="2" />
            <text x={W - padR + 5} y={entryY + 3.5} fill="var(--ink)" fontSize="8.5" fontWeight="bold" fontFamily="monospace">
              IN {fmtPrice(trade.entry, decimals, lang)}
            </text>
          </g>

          {/* Volume bars */}
          {visibleCandles.map((c, i) => {
            const x = getX(i);
            const vH = (c.volume / maxVol) * 38;
            return (
              <rect
                key={`vol-${i}`}
                x={x - 2}
                y={H - padB - vH}
                width={4}
                height={vH}
                fill="url(#volGrad)"
                rx="0.5"
              />
            );
          })}

          {/* Moving Average Curve */}
          <path
            d={visibleCandles.map((c, i) => `${i === 0 ? "M" : "L"} ${getX(i)} ${getY(c.ma)}`).join(" ")}
            fill="none"
            stroke="rgb(var(--accent-base))"
            strokeWidth="1.2"
            opacity="0.65"
          />

          {/* Candlesticks */}
          {visibleCandles.map((c, i) => {
            const x = getX(i);
            const isUp = c.close >= c.open;
            const stroke = isUp ? "rgb(var(--pnl-pos))" : "rgb(var(--pnl-neg))";
            const topY = getY(Math.max(c.open, c.close));
            const botY = getY(Math.min(c.open, c.close));
            const highY = getY(c.high);
            const lowY = getY(c.low);
            const bH = Math.max(1.5, botY - topY);

            const isEntryBar = i === 8;
            const isExitBar = i === 26;

            return (
              <g
                key={`candle-${i}`}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredCandle(c)}
                onMouseLeave={() => setHoveredCandle(null)}
              >
                {/* Wick */}
                <line x1={x} y1={highY} x2={x} y2={lowY} stroke={stroke} strokeWidth="1" />
                {/* Body */}
                <rect
                  x={x - 3.5}
                  y={topY}
                  width={7}
                  height={bH}
                  fill={stroke}
                  rx="0.5"
                />

                {/* Entry marker */}
                {isEntryBar && (
                  <g>
                    <polygon
                      points={`${x},${highY - 14} ${x - 5},${highY - 22} ${x + 5},${highY - 22}`}
                      fill="rgb(var(--accent-base))"
                    />
                    <text x={x} y={highY - 25} fill="rgb(var(--accent-base))" fontSize="9" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                      ENTRY
                    </text>
                  </g>
                )}

                {/* Exit marker */}
                {isExitBar && (
                  <g>
                    <polygon
                      points={`${x},${lowY + 14} ${x - 5},${lowY + 22} ${x + 5},${lowY + 22}`}
                      fill={trade.netPnl >= 0 ? "rgb(var(--pnl-pos))" : "rgb(var(--pnl-neg))"}
                    />
                    <text x={x} y={lowY + 32} fill={trade.netPnl >= 0 ? "rgb(var(--pnl-pos))" : "rgb(var(--pnl-neg))"} fontSize="9" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                      EXIT ({trade.rMultiple >= 0 ? "+" : ""}{trade.rMultiple}R)
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>

        {/* Live Hover HUD / Crosshair Readout */}
        {hoveredCandle && (
          <div className="absolute top-2 left-2 bg-[color-mix(in_oklab,var(--surface-1)_90%,transparent)] backdrop-blur border border-[rgb(var(--divider)/0.2)] rounded-[2px] p-2 text-[10.5px] font-mono text-secondary flex items-center gap-3">
            <span>T: <b className="text-primary">{hoveredCandle.time}</b></span>
            <span>O: <b className="text-primary">{fmtPrice(hoveredCandle.open, decimals, lang)}</b></span>
            <span>H: <b className="text-primary">{fmtPrice(hoveredCandle.high, decimals, lang)}</b></span>
            <span>L: <b className="text-primary">{fmtPrice(hoveredCandle.low, decimals, lang)}</b></span>
            <span>C: <b className="text-primary">{fmtPrice(hoveredCandle.close, decimals, lang)}</b></span>
            <span>Vol: <b className="text-primary">{hoveredCandle.volume}</b></span>
          </div>
        )}
      </div>

      {/* Chart Footer Telemetry */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-[11px] font-mono text-tertiary">
        <div className="flex items-center gap-4">
          <span>{es ? "Motor Gráfico Vectorial Nativo" : "Native Vector Chart Engine"}</span>
          <span>SMA (7): <b className="text-[rgb(var(--accent-base))]">{fmtPrice(trade.entry, decimals, lang)}</b></span>
        </div>
        <div className="flex items-center gap-3">
          <span>{es ? "Deslizamiento (Slippage)" : "Slippage"}: <b className="text-primary">0.00 pts</b></span>
          <span>{es ? "Conformidad" : "Rule Audit"}: <b className="text-[rgb(var(--pnl-pos))]">100% OK</b></span>
        </div>
      </div>
    </div>
  );
}
