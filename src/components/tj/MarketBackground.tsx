"use client";

import { useEffect, useRef } from "react";
import { useInView } from "./useInView";

interface Candle {
  o: number;
  h: number;
  l: number;
  c: number;
}

interface MarketBackgroundProps {
  /** Density of candles. */
  density?: number;
  /** Scroll speed (candles per second). Slow = cinematic. */
  speed?: number;
  /** Opacity of the whole layer. */
  opacity?: number;
  /** Volatility of the random walk. */
  volatility?: number;
  className?: string;
  /** Show the slow equity line overlay. */
  showEquityLine?: boolean;
}

/**
 * Animated candlestick chart that scrolls slowly in the background —
 * a "live market feed" in slow motion. Canvas-based for 60fps.
 * Respects prefers-reduced-motion (renders a static frame).
 */
export function MarketBackground({
  density = 80,
  speed = 1.8,
  opacity = 0.12,
  volatility = 0.012,
  className = "",
  showEquityLine = true,
}: MarketBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { ref: wrapRef, inView } = useInView<HTMLDivElement>({ rootMargin: "200px" });

  useEffect(() => {
    if (!inView) return;
    const canvasEl = canvasRef.current;
    if (!canvasEl) return;
    const context = canvasEl.getContext("2d");
    if (!context) return;
    const canvas = canvasEl;
    const ctx = context;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let W = 0, H = 0;
    let candles: Candle[] = [];
    let candleW = 0;
    let offset = 0;
    let price = 0.5;
    let raf = 0;
    let lastT = performance.now();
    let visible = true;

    function resize() {
      const rect = canvas.getBoundingClientRect();
      W = rect.width;
      H = rect.height;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      candleW = W / density;
      // (re)seed candles
      const count = density + 4;
      candles = [];
      price = 0.5;
      for (let i = 0; i < count; i++) {
        candles.push(genCandle());
      }
    }

    function genCandle(): Candle {
      const drift = (Math.random() - 0.5) * volatility * 2;
      const o = price;
      price = Math.max(0.1, Math.min(0.9, price + drift));
      const c = price;
      const wickUp = Math.random() * volatility * 1.5;
      const wickDn = Math.random() * volatility * 1.5;
      const h = Math.max(o, c) + wickUp;
      const l = Math.min(o, c) - wickDn;
      return { o, h, l, c };
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      const accent = getComputedStyle(document.documentElement)
        .getPropertyValue("--accent-base")
        .trim();
      const posColor = getComputedStyle(document.documentElement)
        .getPropertyValue("--pnl-pos")
        .trim();
      const negColor = getComputedStyle(document.documentElement)
        .getPropertyValue("--pnl-neg")
        .trim();

      const padY = H * 0.15;
      const usableH = H - padY * 2;

      // Draw candles
      for (let i = 0; i < candles.length; i++) {
        const cd = candles[i];
        const x = i * candleW - offset;
        if (x < -candleW * 2 || x > W + candleW * 2) continue;
        const isUp = cd.c >= cd.o;
        const color = isUp ? `rgb(${posColor})` : `rgb(${negColor})`;
        const bodyTop = padY + (1 - Math.max(cd.o, cd.c)) * usableH;
        const bodyBot = padY + (1 - Math.min(cd.o, cd.c)) * usableH;
        const wickTop = padY + (1 - cd.h) * usableH;
        const wickBot = padY + (1 - cd.l) * usableH;
        const cx = x + candleW / 2;

        // wick
        ctx.strokeStyle = color;
        ctx.globalAlpha = 0.5;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(cx, wickTop);
        ctx.lineTo(cx, wickBot);
        ctx.stroke();

        // body
        ctx.globalAlpha = 0.85;
        ctx.fillStyle = color;
        const bw = Math.max(1, candleW * 0.55);
        ctx.fillRect(cx - bw / 2, bodyTop, bw, Math.max(1, bodyBot - bodyTop));
      }
      ctx.globalAlpha = 1;

      // Slow equity line overlay (close prices)
      if (showEquityLine) {
        ctx.strokeStyle = `rgb(${accent})`;
        ctx.globalAlpha = 0.5;
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        for (let i = 0; i < candles.length; i++) {
          const x = i * candleW - offset + candleW / 2;
          const y = padY + (1 - candles[i].c) * usableH;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();

        // Soft area under the line
        ctx.lineTo(candles.length * candleW - offset, H);
        ctx.lineTo(0 - offset, H);
        ctx.closePath();
        const grad = ctx.createLinearGradient(0, 0, 0, H);
        // `accent` is a space-separated CSS triplet (e.g. "126 140 160").
        // Use the modern rgb(R G B / A) syntax; rgba(R G B, A) would be invalid.
        grad.addColorStop(0, `rgb(${accent} / 0.10)`);
        grad.addColorStop(1, `rgb(${accent} / 0)`);
        ctx.fillStyle = grad;
        ctx.globalAlpha = 1;
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    function tick(now: number) {
      raf = requestAnimationFrame(tick);
      // Skip the simulation step (and its redraw) when the tab is hidden:
      // rAF is throttled to ~1fps anyway, but `dt` would balloon on resume
      // and the candles would jump-scroll several seconds forward in one
      // frame. Resetting `lastT` on visibilitychange keeps the resume
      // seamless.
      if (!visible) {
        lastT = now;
        return;
      }
      const dt = Math.min((now - lastT) / 1000, 0.1);
      lastT = now;
      if (!reduce) {
        offset += speed * candleW * dt;
        // When one candle scrolls fully off, recycle it to the end
        while (offset >= candleW) {
          offset -= candleW;
          candles.shift();
          candles.push(genCandle());
        }
      }
      draw();
    }

    const onVis = () => { visible = !document.hidden; };
    document.addEventListener("visibilitychange", onVis);

    resize();
    window.addEventListener("resize", resize);
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("resize", resize);
    };
  }, [density, speed, volatility, showEquityLine, inView]);

  return (
    <div ref={wrapRef} className={`pointer-events-none ${className}`} style={{ width: "100%", height: "100%" }} aria-hidden="true">
      {inView && (
        <canvas
          ref={canvasRef}
          style={{ opacity, width: "100%", height: "100%" }}
        />
      )}
    </div>
  );
}
