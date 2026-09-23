import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { CAJA_MARCA, TRAZO_MARCA } from "@/components/tj/BrandGlyph";
import { INITIAL_BALANCE_CONST, METRICS } from "@/lib/trading/data";
import { getRDistribution } from "@/lib/trading/fixtures";

/**
 * Tarjeta para compartir (Open Graph y X), la misma pieza en cada ruta con
 * su propio titular. Mesa oscura con luz difusa y un panel de cristal con la
 * curva de capital y la distribución de R de las operaciones de muestra de
 * la demo, sin cifras de rentabilidad: fuera de la web no hay espacio para
 * decir que son de muestra más que en la etiqueta.
 *
 * Satori no lee woff2 ni `backdrop-filter`: caras TTF estáticas y el cristal
 * se dibuja con degradados y un filo de luz.
 */
const leer = (...ruta: string[]) => readFileSync(join(process.cwd(), ...ruta));
const SERIF = leer("src", "app", "fonts", "og", "Newsreader-500.ttf");
const SANS = leer("src", "app", "fonts", "og", "InstrumentSans-400.ttf");
const SANS_FUERTE = leer("src", "app", "fonts", "og", "InstrumentSans-600.ttf");

const TINTA = "#F1F3F5";
const TINTA_2 = "#A3ABB4";
const TINTA_3 = "#747D87";
const POS = "63,206,146";
const NEG = "240,119,106";

const svg = (w: number, h: number, cuerpo: string) =>
  `data:image/svg+xml;base64,${Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${cuerpo}</svg>`,
  ).toString("base64")}`;

const MARCA = `data:image/svg+xml;base64,${Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="${CAJA_MARCA}"><path d="${TRAZO_MARCA}" fill="${TINTA}"/></svg>`,
).toString("base64")}`;

const CURVA_W = 424;
const CURVA_H = 190;

const CURVA = (() => {
  const saldos = [INITIAL_BALANCE_CONST, ...METRICS.equityCurve.map((e) => e.balance)];
  const techos = [INITIAL_BALANCE_CONST, ...METRICS.drawdownCeiling];
  const min = Math.min(...saldos);
  const max = Math.max(...saldos);
  const margen = (max - min || 1) * 0.12;
  const x = (i: number) => (i / Math.max(1, saldos.length - 1)) * (CURVA_W - 14) + 2;
  const y = (v: number) => (1 - (v - (min - margen)) / (max - min + 2 * margen)) * CURVA_H;
  const pts = (s: number[]) => s.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`);
  const linea = `M${pts(saldos).join("L")}`;
  const area = `${linea}L${x(saldos.length - 1)},${CURVA_H}L${x(0)},${CURVA_H}Z`;
  const agua = `M${pts(techos).join("L")}L${pts(saldos).reverse().join("L")}Z`;
  const fx = x(saldos.length - 1);
  const fy = y(saldos[saldos.length - 1]);
  const base = y(INITIAL_BALANCE_CONST);
  return svg(
    CURVA_W,
    CURVA_H,
    `<defs>
      <linearGradient id="a" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${TINTA}" stop-opacity="0.16"/><stop offset="1" stop-color="${TINTA}" stop-opacity="0"/></linearGradient>
      <linearGradient id="l" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${TINTA}" stop-opacity="0.35"/><stop offset="0.6" stop-color="${TINTA}" stop-opacity="0.85"/><stop offset="1" stop-color="${TINTA}"/></linearGradient>
      <radialGradient id="h"><stop offset="0" stop-color="${TINTA}" stop-opacity="0.35"/><stop offset="1" stop-color="${TINTA}" stop-opacity="0"/></radialGradient>
    </defs>
    <line x1="0" x2="${CURVA_W}" y1="${base}" y2="${base}" stroke="${TINTA}" stroke-opacity="0.16" stroke-dasharray="3 5"/>
    <path d="${area}" fill="url(#a)"/>
    <path d="${agua}" fill="rgb(${NEG})" fill-opacity="0.2"/>
    <path d="${linea}" fill="none" stroke="url(#l)" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"/>
    <circle cx="${fx}" cy="${fy}" r="16" fill="url(#h)"/>
    <circle cx="${fx}" cy="${fy}" r="4.5" fill="${TINTA}"/>`,
  );
})();

const BINS = getRDistribution();
const BIN_MAX = Math.max(1, ...BINS.map((b) => b.count));

export type Tarjeta = { antetitulo: string; titulo: string; subtitulo: string; lang?: "es" | "en" };

const ROTULOS = {
  es: { pie: "Windows 10 y 11 · demo sin registro · tus datos en tu equipo", curva: "Curva de capital", muestra: "Datos de muestra", distribucion: "Distribución de R", metricas: "40+ métricas" },
  en: { pie: "Windows 10 and 11 · demo without sign-up · your data on your machine", curva: "Equity curve", muestra: "Sample data", distribucion: "R distribution", metricas: "40+ metrics" },
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
          position: "relative",
          backgroundColor: "#0A0C0F",
          backgroundImage:
            "radial-gradient(circle at 30% 18%, rgba(236,240,244,0.09) 0%, rgba(236,240,244,0) 58%)",
          fontFamily: "Instrument Sans",
          color: TINTA,
          overflow: "hidden",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "56px 0 52px 72px", width: 640 }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            <img src={MARCA} width={34} height={34} alt="" />
            <div style={{ display: "flex", marginLeft: 12, fontSize: 26, fontWeight: 600, letterSpacing: "-0.02em" }}>CountPips</div>
          </div>

          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", fontSize: 15, fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", color: TINTA_3 }}>
              {antetitulo}
            </div>
            <div
              style={{
                display: "flex",
                marginTop: 22,
                maxWidth: 560,
                fontFamily: "Newsreader",
                fontSize: titulo.length > 34 ? 54 : 62,
                lineHeight: 1.04,
                letterSpacing: "-0.028em",
                textWrap: "balance",
              }}
            >
              {titulo}
            </div>
            <div style={{ display: "flex", marginTop: 24, maxWidth: 500, fontSize: 22, lineHeight: 1.45, color: TINTA_2, textWrap: "balance" }}>{subtitulo}</div>
          </div>

          <div style={{ display: "flex", fontSize: 16, color: TINTA_3 }}>{r.pie}</div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            position: "absolute",
            right: 64,
            top: 118,
            width: 472,
            padding: "26px 24px 24px",
            borderRadius: 14,
            border: "1px solid rgba(255,255,255,0.11)",
            backgroundImage: "linear-gradient(165deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.035) 45%, rgba(255,255,255,0.02) 100%)",
            boxShadow: "0 50px 90px -40px rgba(0,0,0,0.75)",
          }}
        >
          <div
            style={{
              display: "flex",
              position: "absolute",
              top: -1,
              left: 48,
              right: 48,
              height: 1,
              backgroundImage: "linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.55) 50%, rgba(255,255,255,0) 100%)",
            }}
          />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", fontSize: 15, color: TINTA_2 }}>{r.curva}</div>
            <div
              style={{
                display: "flex",
                padding: "4px 11px",
                borderRadius: 4,
                fontSize: 12,
                letterSpacing: "0.04em",
                color: TINTA_2,
                backgroundColor: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              {r.muestra}
            </div>
          </div>

          <img src={CURVA} width={CURVA_W} height={CURVA_H} alt="" style={{ marginTop: 18 }} />

          <div style={{ display: "flex", height: 1, marginTop: 20, backgroundColor: "rgba(255,255,255,0.08)" }} />

          <div style={{ display: "flex", marginTop: 18, justifyContent: "space-between", alignItems: "flex-end" }}>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", fontSize: 13, color: TINTA_3 }}>{r.distribucion}</div>
              <div style={{ display: "flex", alignItems: "flex-end", height: 44, marginTop: 10 }}>
                {BINS.map((b) => (
                  <div
                    key={b.from}
                    style={{
                      display: "flex",
                      width: 15,
                      marginRight: 5,
                      height: Math.max(2, Math.round((b.count / BIN_MAX) * 44)),
                      borderRadius: "3px 3px 1px 1px",
                      backgroundImage: `linear-gradient(0deg, rgba(${b.losing ? NEG : POS},0.45), rgba(${b.losing ? NEG : POS},0.9))`,
                    }}
                  />
                ))}
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
              <div style={{ display: "flex", fontSize: 13, color: TINTA_3 }}>{r.metricas}</div>
              <div style={{ display: "flex", marginTop: 8, fontSize: 16, color: TINTA }}>Sharpe · Sortino · Calmar</div>
              <div style={{ display: "flex", marginTop: 4, fontSize: 16, color: TINTA_2 }}>Expectancy · Max DD</div>
            </div>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: [
        { name: "Newsreader", data: SERIF, weight: 500, style: "normal" },
        { name: "Instrument Sans", data: SANS, weight: 400, style: "normal" },
        { name: "Instrument Sans", data: SANS_FUERTE, weight: 600, style: "normal" },
      ],
    },
  );
}
