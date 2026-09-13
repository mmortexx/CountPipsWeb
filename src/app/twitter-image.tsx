import { ImageResponse } from "next/og";

export const runtime = "nodejs";
// Obligatorio con `output: export`, igual que en la tarjeta Open Graph.
export const dynamic = "force-static";
export const alt = "CountPips — Tu operativa, medida.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * twitter-image — tarjeta de Twitter/X. Reutiliza el mismo diseño que
 * opengraph-image.tsx (la imagen dinámica generada por Next.js). Al
 * existir este archivo en la raíz de app/, Next la sirve en
 * /twitter-image y la inyecta automáticamente en los metadatos de
 * Twitter Card — sin necesidad de declarar `twitter.images` en
 * layout.tsx.
 */
export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#0c1116",
          backgroundImage:
            "radial-gradient(120% 80% at 50% -10%, rgba(199,167,107,0.10), transparent 55%), radial-gradient(80% 60% at 50% 110%, rgba(199,167,107,0.06), transparent 60%)",
          color: "#bbc2c8",
          fontFamily: "sans-serif",
          padding: "72px 80px",
          position: "relative",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 3,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "rgba(199,167,107,0.14)",
                border: "1px solid rgba(199,167,107,0.42)",
              }}
            >
              <div style={{ width: 14, height: 14, background: "#CDD9E4", borderRadius: 2 }} />
            </div>
            <span style={{ fontSize: 26, fontWeight: 600, letterSpacing: "-0.01em" }}>CountPips</span>
          </div>
          <span style={{ fontSize: 14, letterSpacing: "0.18em", textTransform: "uppercase", color: "#8a9096", fontWeight: 600 }}>
            Diario de trading · Windows
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 6, height: 6, background: "#CDD9E4", borderRadius: 1 }} />
            <span style={{ fontSize: 14, letterSpacing: "0.18em", textTransform: "uppercase", color: "#CDD9E4", fontWeight: 700 }}>
              Tu operativa, medida.
            </span>
          </div>
          <div style={{ display: "flex", fontSize: 78, fontWeight: 700, lineHeight: 1.02, letterSpacing: "-0.035em", maxWidth: 900 }}>
            Opera como una
            <br />
            mesa <span style={{ color: "#CDD9E4" }}>institucional.</span>
          </div>
          <div style={{ fontSize: 24, fontWeight: 300, color: "#9fa5ac", maxWidth: 720, lineHeight: 1.35 }}>
            40+ métricas institucionales, disciplina que te frena antes del error y tus datos 100 % en tu máquina.
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
          <div style={{ display: "flex", gap: 56 }}>
            {[
              { v: "40+", l: "Métricas" },
              { v: "100%", l: "Local" },
              { v: "↗", l: "Demo interactiva" },
            ].map((k) => (
              <div key={k.l} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <div style={{ fontSize: 38, fontWeight: 700, color: "#CDD9E4", lineHeight: 1 }}>{k.v}</div>
                <div style={{ fontSize: 13, letterSpacing: "0.16em", textTransform: "uppercase", color: "#8a9096", fontWeight: 600 }}>{k.l}</div>
              </div>
            ))}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "14px 22px",
              borderRadius: 3,
              background: "#CDD9E4",
              color: "#0c1116",
              fontSize: 18,
              fontWeight: 700,
            }}
          >
            Ver la demo interactiva
          </div>
        </div>

        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg, transparent, #CDD9E4 30%, #CDD9E4 70%, transparent)" }} />
      </div>
    ),
    { ...size }
  );
}
