"use client";

import { memo, useMemo, useState, type CSSProperties } from "react";
import type { Metrics } from "@/lib/trading/data";
import { useLang } from "@/lib/i18n";
import { fmtMoney, LOCALE_FECHA } from "@/lib/trading/format";

interface EquityCurveProps {
  metrics: Metrics;
  height?: number;
  showAxis?: boolean;
  showDrawdown?: boolean;
  className?: string;
}

/** Curva de capital en SVG con la caída sombreada, entrada animada y tooltip al pasar. */
export const EquityCurve = memo(function EquityCurve({
  metrics,
  height = 220,
  showAxis = true,
  showDrawdown = true,
  className = "",
}: EquityCurveProps) {
  const { lang } = useLang();
  const { equityCurve, drawdownCeiling } = metrics;
  // Índice del dato, X del puntero y ancho/alto renderizados (px), para acotar
  // el tooltip y pasar la Y del viewBox a píxeles: el SVG se escala solo por
  // `aspect-ratio`. Ratón y táctil escriben aquí.
  const [hover, setHover] = useState<{
    idx: number;
    mx: number;
    width: number;
    height: number;
  } | null>(null);

  const W = 800;
  const H = height;
  const padL = showAxis ? 56 : 8;
  const padR = 12;
  const padT = 12;
  const padB = showAxis ? 24 : 8;

  const { linePath, areaPath, ddPath, points, minBal, maxBal } = useMemo(() => {
    if (!equityCurve.length) {
      return {
        linePath: "",
        areaPath: "",
        ddPath: "",
        points: [] as { x: number; y: number; date: Date; balance: number; perf: number; ceiling: number }[],
        minBal: 0,
        maxBal: 0,
      };
    }
    const balances = equityCurve.map((e) => e.balance);
    const minBal = Math.min(...balances);
    const maxBal = Math.max(...balances);
    const range = maxBal - minBal || 1;

    const pts = equityCurve.map((e, i) => {
      const x = padL + (i / (equityCurve.length - 1)) * (W - padL - padR);
      const y = padT + (1 - (e.balance - minBal) / range) * (H - padT - padB);
      return { x, y, ...e, ceiling: drawdownCeiling[i] };
    });

    const linePath = pts
      .map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
      .join(" ");
    const areaPath = `${linePath} L${pts[pts.length - 1].x.toFixed(1)},${H - padB} L${pts[0].x.toFixed(1)},${H - padB} Z`;

    const ddPath = pts
      .map((p, i) => {
        const ceilY = padT + (1 - (p.ceiling - minBal) / range) * (H - padT - padB);
        return `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${ceilY.toFixed(1)} L${p.x.toFixed(1)},${p.y.toFixed(1)}`;
      })
      .join(" ");

    return { linePath, areaPath, ddPath, points: pts, minBal, maxBal };
  }, [equityCurve, drawdownCeiling, padL, padR, padT, padB, H]);

  if (!equityCurve.length) {
    return <div className={`text-tertiary text-sm ${className}`} style={{ height }}>Sin datos</div>;
  }

  /** Resuelve el hover para ratón y táctil: convierte `clientX` en el índice
   * de dato más cercano y guarda el rect renderizado para posicionar el
   * tooltip en píxeles, no en unidades del viewBox. */
  const updateHover = (clientX: number, target: SVGElement) => {
    const rect = target.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const svgX = ((clientX - rect.left) / rect.width) * W;
    const idx = Math.round(((svgX - padL) / (W - padL - padR)) * (points.length - 1));
    if (idx >= 0 && idx < points.length) {
      setHover({ idx, mx: clientX - rect.left, width: rect.width, height: rect.height });
    }
  };

  const locale = LOCALE_FECHA[lang];
  const hoverPoint = hover && points[hover.idx];

  // La X del tooltip sigue al puntero sin salirse por los lados (~180 px de ancho).
  const TOOLTIP_HALF = 92;
  let tooltipLeft: number | null = null;
  let tooltipTop = 6;
  let tooltipTransform = "translateX(-50%)";
  if (hover && hoverPoint) {
    const w = hover.width || W;
    tooltipLeft = Math.max(TOOLTIP_HALF, Math.min(w - TOOLTIP_HALF, hover.mx));
    // La Y del viewBox se multiplica por la escala real; si no, el tooltip se
    // separaría del marcador en renders no 1:1 (móvil).
    const markerYPx = hoverPoint.y * (hover.height / H);
    // Sobre el marcador; debajo si queda cerca del borde superior.
    if (markerYPx < 92) {
      tooltipTop = markerYPx + 14;
      tooltipTransform = "translateX(-50%)";
    } else {
      tooltipTop = markerYPx - 10;
      tooltipTransform = "translate(-50%, -100%)";
    }
  }

  // Caída desde el pico acumulado en este punto.
  const drawdown = hoverPoint ? hoverPoint.ceiling - hoverPoint.balance : 0;

  return (
    <div
      data-entra
      className={`tj-realce relative tj-paper rounded-[4px] border border-[rgb(var(--divider)/0.13)] ${className}`}
      style={{ transformOrigin: "center" }}
    >
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-auto sm:h-[var(--eq-h)]"
        // En móvil (`h-auto`) el alto sale del aspect ratio del viewBox, sin
        // bandas vacías; desde `sm` rige la prop `height` (`--eq-h`), que
        // MiniCalendar iguala con `h-full`. `touch-action: pan-y` deja
        // desplazar la página en vertical y captura el arrastre horizontal.
        style={{
          "--eq-h": `${height}px`,
          aspectRatio: `${W} / ${H}`,
          touchAction: "pan-y",
        } as CSSProperties}
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label={lang === "es"
          ? `Curva de capital desde ${fmtMoney(minBal, lang, { decimals: 0 })} hasta ${fmtMoney(maxBal, lang, { decimals: 0 })}`
          : `Equity curve from ${fmtMoney(minBal, lang, { decimals: 0 })} to ${fmtMoney(maxBal, lang, { decimals: 0 })}`}
        onMouseLeave={() => setHover(null)}
        onMouseMove={(e) => updateHover(e.clientX, e.currentTarget as SVGElement)}
        onTouchStart={(e) => {
          const t = e.touches[0];
          if (t) updateHover(t.clientX, e.currentTarget as SVGElement);
        }}
        onTouchMove={(e) => {
          const t = e.touches[0];
          if (t) updateHover(t.clientX, e.currentTarget as SVGElement);
        }}
        onTouchEnd={() => setHover(null)}
        onTouchCancel={() => setHover(null)}
      >
        <defs>
          <linearGradient id="eq-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgb(var(--accent-base))" stopOpacity="0.15" />
            <stop offset="100%" stopColor="rgb(var(--accent-base))" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="eq-line" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="rgb(var(--accent-base))" />
            <stop offset="100%" stopColor="rgb(var(--accent-hover))" />
          </linearGradient>
        </defs>

        {/* Rejilla, decorativa. */}
        {showAxis &&
          [0, 0.25, 0.5, 0.75, 1].map((t) => {
            const y = padT + t * (H - padT - padB);
            return (
              <line key={t} x1={padL} y1={y} x2={W - padR} y2={y} stroke="rgb(var(--divider) / 0.06)" strokeWidth="1" />
            );
          })}

        {/* Etiquetas del eje Y, ocultas en móvil: el `font-size` del <text> va en
            unidades del viewBox y a ~295 px de ancho saldría de ~3,7 px. */}
        {showAxis && (
          <g className="hidden sm:block">
            {[0, 0.25, 0.5, 0.75, 1].map((t) => {
              const y = padT + t * (H - padT - padB);
              const val = maxBal - t * (maxBal - minBal);
              return (
                <text key={t} x={padL - 8} y={y + 3} textAnchor="end" className="text-[10px] tnum" fill="rgb(var(--txt-tertiary))">
                  {fmtMoney(val, lang, { decimals: 0 })}
                </text>
              );
            })}
          </g>
        )}

        {showDrawdown && (
          <path d={ddPath} fill="rgb(var(--pnl-neg) / 0.10)" stroke="none" />
        )}

        <path
          data-entra="5"
          d={areaPath}
          fill="url(#eq-area)"
        />
        <path
          data-entra
          d={linePath}
          fill="none"
          stroke="url(#eq-line)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {hoverPoint && (
          <g>
            <line
              x1={hoverPoint.x}
              y1={padT}
              x2={hoverPoint.x}
              y2={H - padB}
              stroke="rgb(var(--accent-base))"
              strokeWidth="1"
              strokeDasharray="3 3"
              opacity="0.4"
            />
            <line
              x1={padL}
              y1={hoverPoint.y}
              x2={W - padR}
              y2={hoverPoint.y}
              stroke="rgb(var(--accent-base))"
              strokeWidth="1"
              strokeDasharray="3 3"
              opacity="0.4"
            />
            <circle
              cx={hoverPoint.x}
              cy={hoverPoint.y}
              r="6"
              fill="none"
              stroke="rgb(var(--accent-base))"
              strokeWidth="1"
              opacity="0.4"
            />
            <circle
              cx={hoverPoint.x}
              cy={hoverPoint.y}
              r="4"
              fill="rgb(var(--accent-base))"
              stroke="rgb(var(--txt-primary))"
              strokeWidth="1.5"
            />
          </g>
        )}
      </svg>

      {/* Tooltip: fecha, balance, resultado desde el inicio y caída desde el pico. */}
      {hoverPoint && tooltipLeft !== null && (
        <div
          className="absolute pointer-events-none tj-paper tj-paper-dense rounded-[4px] border border-[rgb(var(--divider)/0.16)] px-3 py-2 text-xs whitespace-nowrap z-10"
          style={{
            left: tooltipLeft,
            top: tooltipTop,
            transform: tooltipTransform,
          }}
        >
          <div className="text-tertiary text-[10px]">
            {/* `timeZone: "UTC"`: las operaciones están fechadas en UTC (ver
                `data.ts`); sin fijarlo, la etiqueta puede salir un día antes. */}
            {hoverPoint.date.toLocaleDateString(locale, {
              day: "2-digit",
              month: "short",
              year: "numeric",
              timeZone: "UTC",
            })}
          </div>
          <div className="font-semibold tnum text-primary text-[13px] mt-0.5">
            {fmtMoney(hoverPoint.balance, lang, { decimals: 0 })}
          </div>
          <div className="flex items-center justify-between gap-3 mt-1 text-[11px]">
            <span className="text-tertiary">{lang === "es" ? "Desde inicio" : "Since start"}</span>
            <span className={`tnum font-medium ${hoverPoint.perf >= 0 ? "text-pnl-pos" : "text-pnl-neg"}`}>
              {fmtMoney(hoverPoint.perf, lang, { decimals: 0, sign: true })}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3 text-[11px]">
            <span className="text-tertiary">{lang === "es" ? "Desde pico" : "From peak"}</span>
            <span className={`tnum font-medium ${drawdown > 0 ? "text-pnl-neg" : "text-tertiary"}`}>
              {drawdown > 0
                ? fmtMoney(-drawdown, lang, { decimals: 0 })
                : "0"}
            </span>
          </div>
        </div>
      )}
    </div>
  );
});
