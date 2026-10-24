import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { CAJA_MARCA, TRAZO_MARCA } from "@/components/tj/BrandGlyph";
import { INITIAL_BALANCE_CONST, METRICS } from "@/lib/trading/data";

/**
 * Tarjeta para compartir (Open Graph y X), la misma pieza en cada ruta con
 * su propio titular. Composición de membrete: marca y antetítulo sobre un
 * filete, el titular en serif como única pieza grande y, abajo, la curva de
 * capital de la demo como un solo trazo fino, sin cifras de rentabilidad ni
 * color: fuera de la web no hay espacio para decir que es de muestra más que
 * en el pie. Todo lo que no se lee a 400 px de ancho (lo que ocupa en un
 * chat) se ha quitado.
 *
 * Satori no lee woff2: caras TTF estáticas.
 */
const leer = (...ruta: string[]) => readFileSync(join(process.cwd(), ...ruta));
const SERIF = leer("src", "app", "fonts", "og", "Newsreader-500.ttf");
const SANS = leer("src", "app", "fonts", "og", "InstrumentSans-400.ttf");
const SANS_FUERTE = leer("src", "app", "fonts", "og", "InstrumentSans-600.ttf");

const FONDO = "#0B0D10";
const TINTA = "#ECEFF2";
const TINTA_2 = "#9AA3AD";
const TINTA_3 = "#6B747E";
const FILETE = "rgba(236,239,242,0.12)";
/** Plata del acento del sitio (`--accent-base` en oscuro). */
const PLATA = "#CDD9E4";

const ANCHO = 1200;
const MARGEN = 80;

const MARCA = `data:image/svg+xml;base64,${Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="${CAJA_MARCA}"><path d="${TRAZO_MARCA}" fill="${TINTA}"/></svg>`,
).toString("base64")}`;

const CURVA_W = ANCHO - 2 * MARGEN;
const CURVA_H = 120;

/** La curva de la demo en un trazo: entra tenue por la izquierda y acaba en un punto plata. */
const CURVA = (() => {
  const saldos = [INITIAL_BALANCE_CONST, ...METRICS.equityCurve.map((e) => e.balance)];
  const min = Math.min(...saldos);
  const max = Math.max(...saldos);
  const margen = (max - min || 1) * 0.08;
  const x = (i: number) => (i / Math.max(1, saldos.length - 1)) * (CURVA_W - 8) + 2;
  const y = (v: number) => (1 - (v - (min - margen)) / (max - min + 2 * margen)) * CURVA_H;
  const linea = `M${saldos.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join("L")}`;
  const area = `${linea}L${x(saldos.length - 1)},${CURVA_H}L${x(0)},${CURVA_H}Z`;
  const fx = x(saldos.length - 1);
  const fy = y(saldos[saldos.length - 1]);
  const base = y(INITIAL_BALANCE_CONST).toFixed(1);
  return `data:image/svg+xml;base64,${Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${CURVA_W}" height="${CURVA_H}" viewBox="0 0 ${CURVA_W} ${CURVA_H}">
      <defs>
        <linearGradient id="t" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${TINTA}" stop-opacity="0.08"/><stop offset="0.55" stop-color="${TINTA}" stop-opacity="0.45"/><stop offset="1" stop-color="${TINTA}" stop-opacity="0.9"/></linearGradient>
        <linearGradient id="a" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${TINTA}" stop-opacity="0.05"/><stop offset="1" stop-color="${TINTA}" stop-opacity="0"/></linearGradient>
      </defs>
      <line x1="0" x2="${CURVA_W}" y1="${base}" y2="${base}" stroke="${TINTA}" stroke-opacity="0.1" stroke-dasharray="2 6"/>
      <path d="${area}" fill="url(#a)"/>
      <path d="${linea}" fill="none" stroke="url(#t)" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round"/>
      <circle cx="${fx.toFixed(1)}" cy="${fy.toFixed(1)}" r="3.5" fill="${PLATA}"/>
    </svg>`,
  ).toString("base64")}`;
})();

export type Tarjeta = { antetitulo: string; titulo: string; subtitulo: string; lang?: "es" | "en" };

const ROTULOS = {
  es: { pie: "Windows 10 y 11 · tus datos en tu equipo", muestra: "Curva de la demo, datos de muestra" },
  en: { pie: "Windows 10 and 11 · your data on your machine", muestra: "Demo equity curve, sample data" },
};

export function tarjetaSocial({ antetitulo, titulo, subtitulo, lang = "es" }: Tarjeta) {
  const r = ROTULOS[lang];
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          position: "relative",
          padding: `52px ${MARGEN}px 44px`,
          backgroundColor: FONDO,
          fontFamily: "Instrument Sans",
          color: TINTA,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: 26, borderBottom: `1px solid ${FILETE}` }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            <img src={MARCA} width={28} height={28} alt="" />
            <div style={{ display: "flex", marginLeft: 12, fontSize: 24, fontWeight: 600, letterSpacing: "-0.015em" }}>CountPips</div>
          </div>
          <div style={{ display: "flex", fontSize: 15, fontWeight: 600, letterSpacing: "0.16em", textTransform: "uppercase", color: TINTA_3 }}>
            {antetitulo}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            marginTop: 58,
            maxWidth: 900,
            fontFamily: "Newsreader",
            fontSize: titulo.length > 40 ? 66 : 76,
            lineHeight: 1.03,
            letterSpacing: "-0.03em",
            textWrap: "balance",
          }}
        >
          {titulo}
        </div>
        <div style={{ display: "flex", marginTop: 22, maxWidth: 780, fontSize: 24, lineHeight: 1.45, color: TINTA_2, textWrap: "balance" }}>
          {subtitulo}
        </div>

        <img
          src={CURVA}
          width={CURVA_W}
          height={CURVA_H}
          alt=""
          style={{ position: "absolute", left: MARGEN, bottom: 92 }}
        />

        <div
          style={{
            display: "flex",
            position: "absolute",
            left: MARGEN,
            right: MARGEN,
            bottom: 44,
            justifyContent: "space-between",
            fontSize: 15,
            color: TINTA_3,
          }}
        >
          <div style={{ display: "flex" }}>{r.pie}</div>
          <div style={{ display: "flex" }}>{r.muestra}</div>
        </div>
      </div>
    ),
    {
      width: ANCHO,
      height: 630,
      fonts: [
        { name: "Newsreader", data: SERIF, weight: 500, style: "normal" },
        { name: "Instrument Sans", data: SANS, weight: 400, style: "normal" },
        { name: "Instrument Sans", data: SANS_FUERTE, weight: 600, style: "normal" },
      ],
    },
  );
}
