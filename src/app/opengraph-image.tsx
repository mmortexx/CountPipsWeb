import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const runtime = "nodejs";
// Obligatorio con `output: export`: sin esto Next no genera el PNG en la compilación.
export const dynamic = "force-static";
export const alt = "CountPips — Opera como una mesa institucional.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Tarjeta Open Graph (y de X: `twitter-image.tsx` reexporta esta). Blanca,
 * titular en la serif de la web y la captura real del programa saliendo por
 * la esquina. Satori no lee woff2 ni webp: por eso las caras son TTF
 * estáticos (`src/app/fonts/og/`) y la captura un JPEG (`assets/og/`).
 * Todo se lee una vez al cargar el módulo; lo reexportan todas las rutas.
 */
const leer = (...ruta: string[]) => readFileSync(join(process.cwd(), ...ruta));
const SERIF = leer("src", "app", "fonts", "og", "Newsreader-500.ttf");
const SANS = leer("src", "app", "fonts", "og", "InstrumentSans-400.ttf");
const SANS_FUERTE = leer("src", "app", "fonts", "og", "InstrumentSans-600.ttf");
const CAPTURA = `data:image/jpeg;base64,${leer("assets", "og", "captura-analitica.jpg").toString("base64")}`;

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          background: "#ffffff",
          fontFamily: "Instrument Sans",
          color: "#0b0f14",
          overflow: "hidden",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", padding: "64px 0 0 72px", width: 600 }}>
          <div style={{ display: "flex", fontSize: 28, fontWeight: 600, letterSpacing: "-0.02em" }}>CountPips</div>
          <div
            style={{
              display: "flex",
              marginTop: 72,
              fontSize: 15,
              fontWeight: 600,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "#58616b",
            }}
          >
            Diario de trading para Windows
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 20,
              fontFamily: "Newsreader",
              fontSize: 68,
              lineHeight: 1.02,
              letterSpacing: "-0.03em",
            }}
          >
            Opera como una mesa institucional.
          </div>
          <div style={{ display: "flex", marginTop: 26, fontSize: 24, lineHeight: 1.45, color: "#3a424b", maxWidth: 500 }}>
            40+ métricas, un guardián de disciplina y tus datos en tu máquina.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            position: "absolute",
            left: 640,
            top: 150,
            width: 1100,
            border: "1px solid rgba(11, 15, 20, 0.15)",
            borderRadius: 10,
            overflow: "hidden",
            boxShadow: "0 30px 70px -30px rgba(11, 15, 20, 0.35)",
          }}
        >
          <img src={CAPTURA} width={1100} height={584} alt="" />
        </div>

        <div
          style={{
            display: "flex",
            position: "absolute",
            left: 72,
            bottom: 52,
            fontSize: 17,
            color: "#58616b",
          }}
        >
          Demo interactiva · sin registro · datos 100 % locales
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Newsreader", data: SERIF, weight: 500, style: "normal" },
        { name: "Instrument Sans", data: SANS, weight: 400, style: "normal" },
        { name: "Instrument Sans", data: SANS_FUERTE, weight: 600, style: "normal" },
      ],
    },
  );
}
