import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const runtime = "nodejs";
// Obligatorio con `output: export`. Sin esta línea Next no da por hecho que la
// imagen puede generarse una sola vez durante la compilación, y aborta al
// recopilar las páginas en vez de producir el PNG.
export const dynamic = "force-static";
export const alt = "CountPips — Tu operativa, medida.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * opengraph-image — tarjeta Open Graph dinámica generada por Next.js.
 *
 * Sustituye al `og.png` estático (que vivía en `public/` y se
 * referenciaba vía una URL absoluta dependiente de SITE_URL). Con
 * este archivo, Next genera la imagen en runtime/build y la sirve
 * desde `/opengraph-image` en la RAÍZ del dominio donde se publique
 * el sitio — sin importar si es countpips.com, GitHub Pages o el
 * preview del sandbox. La tarjeta siempre coincide con la web real.
 *
 * ── Diseño ────────────────────────────────────────────────────────────
 * Fondo oscuro cálido (#0c1116, el --bg del tema oscuro del sitio).
 * Acento azul acero (#CDD9E4, --accent-base). Tipografía sans
 * institucional. Marca arriba-izquierda, titular grande centrado,
 * bajada de 3 KPIs abajo. Estilo Anthropic: minimalista, espaciado
 * generoso, jerarquía tipográfica fuerte.
 */

/**
 * El logotipo, incrustado como datos.
 *
 * Aquí arriba a la izquierda había un cuadrado dorado dentro de otro
 * cuadrado: un marcador de posición, no la marca. Y ésta es justamente la
 * imagen que se ve cuando alguien pega el enlace en WhatsApp, X o
 * LinkedIn — el sitio donde la marca más trabaja hacia fuera.
 *
 * Se lee el PNG en vez de dibujar el SVG a mano por una razón práctica:
 * esta tarjeta la compone Satori, que soporta un subconjunto de SVG, y
 * un fallo suyo NO da un logotipo feo, aborta la compilación entera y
 * deja el sitio sin publicar. Un PNG en base64 es lo que Satori maneja
 * sin sorpresas.
 *
 * Se lee UNA vez al cargar el módulo, no en cada invocación: son ocho
 * rutas las que generan tarjeta y todas reexportan de aquí.
 */
const LOGO_DATA_URI = `data:image/png;base64,${readFileSync(
  join(process.cwd(), "public", "logo.png"),
).toString("base64")}`;

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
        {/* Marco superior — marca + etiqueta */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {/* El logotipo: el cuaderno con las tres velas, el mismo que
                la barra del sitio y el icono del escritorio. Conserva su
                fondo de papel —no se recorta— porque la tapa es marrón
                oscuro y sobre el #0c1116 de esta tarjeta se perdería. */}
            <img
              src={LOGO_DATA_URI}
              alt=""
              width={44}
              height={44}
              style={{ borderRadius: 3 }}
            />
            <span style={{ fontSize: 26, fontWeight: 600, letterSpacing: "-0.01em" }}>CountPips</span>
          </div>
          <span
            style={{
              fontSize: 14,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "#8a9096",
              fontWeight: 600,
            }}
          >
            Diario de trading · Windows
          </span>
        </div>

        {/* Centro — titular */}
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 6, height: 6, background: "#CDD9E4", borderRadius: 1 }} />
            <span style={{ fontSize: 14, letterSpacing: "0.18em", textTransform: "uppercase", color: "#CDD9E4", fontWeight: 700 }}>
              Tu operativa, medida.
            </span>
          </div>
          {/* El titular salía como «Opera como unamesainstitucion»:
              pegado, sin el salto de línea y cortado por el borde
              derecho. Y salía así en las diez tarjetas del sitio, que es
              exactamente lo que ve quien pega el enlace en WhatsApp o en
              LinkedIn.

              La causa es una diferencia de Satori —el motor que compone
              esta imagen— con un navegador: aquí un contenedor `flex`
              coloca a TODOS sus hijos en una fila horizontal, y los
              trozos de texto sueltos cuentan como hijos. El `<br>` se
              descartaba, los espacios entre trozos desaparecían al
              tratarse como cajas contiguas, y la fila seguía creciendo
              hacia la derecha porque una fila flex no se parte sola
              (`maxWidth` no la envuelve sin `flexWrap`).

              Por eso ahora las dos líneas son explícitas, en columna, y
              el espacio entre «mesa» e «institucional.» lo pone un `gap`
              en vez de un espacio de texto que se perdería igual. */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              fontSize: 78,
              fontWeight: 700,
              lineHeight: 1.02,
              letterSpacing: "-0.035em",
              maxWidth: 900,
            }}
          >
            <div style={{ display: "flex" }}>Opera como una</div>
            <div style={{ display: "flex", gap: 20 }}>
              <span>mesa</span>
              <span style={{ color: "#CDD9E4" }}>institucional.</span>
            </div>
          </div>
          <div style={{ fontSize: 24, fontWeight: 300, color: "#9fa5ac", maxWidth: 720, lineHeight: 1.35 }}>
            40+ métricas institucionales, disciplina que te frena antes del error y tus datos 100 % en tu máquina.
          </div>
        </div>

        {/* Pie — dos cifras reales y una curva. Lo que había aquí delataba la
            plantilla por dos sitios:

            · El tercer «KPI» era una flecha «↗» con el rótulo «Demo
              interactiva». Satori no tiene esa flecha en la tipografía del
              sistema y la resolvía por el camino del EMOJI, así que en la
              tarjeta salía un cuadrado azul brillante — el único color
              saturado de una pieza por lo demás en pizarra, y justo el
              detalle que se ve primero. Y además no era una métrica: junto a
              «40+» y «100 %» ocupaba el sitio de un dato con un adorno.

            · Y había un BOTÓN. Una vista previa de enlace es una imagen: no
              se puede pulsar. Dibujar un botón dentro promete una acción que
              no existe, que es la definición de adorno que engaña.

            En su lugar, la mitad derecha —que estaba vacía— la ocupa una
            curva de resultado hecha con barras. Es lo único que se entiende
            sin leer una palabra a tamaño de miniatura, dice «trading» al
            instante, y se dibuja con `div`s: nada de SVG, que en Satori no
            falla feo sino que aborta la compilación entera (ver la nota del
            logotipo). */}
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 48 }}>
          <div style={{ display: "flex", gap: 56 }}>
            {[
              { v: "40+", l: "Métricas" },
              { v: "100 %", l: "En tu equipo" },
            ].map((k) => (
              <div key={k.l} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <div style={{ fontSize: 38, fontWeight: 700, color: "#CDD9E4", lineHeight: 1 }}>{k.v}</div>
                <div style={{ fontSize: 13, letterSpacing: "0.16em", textTransform: "uppercase", color: "#8a9096", fontWeight: 600 }}>{k.l}</div>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 14 }}>
            {/* Serie fija, escrita a mano: una curva que sube con sus
                retrocesos. No se genera al azar — la tarjeta tiene que salir
                idéntica en cada compilación. */}
            <div style={{ display: "flex", alignItems: "flex-end", gap: 5, height: 96 }}>
              {[18, 22, 16, 27, 31, 26, 34, 30, 41, 47, 43, 52, 48, 58, 63, 57, 66, 72, 68, 79, 85, 80, 88, 96].map(
                (alto, i, todos) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      width: 7,
                      height: alto,
                      background: "#CDD9E4",
                      // Se aclara hacia la derecha: el ojo lee la dirección
                      // antes que las alturas.
                      opacity: 0.22 + (i / (todos.length - 1)) * 0.68,
                    }}
                  />
                ),
              )}
            </div>
            <div style={{ fontSize: 13, letterSpacing: "0.16em", textTransform: "uppercase", color: "#8a9096", fontWeight: 600 }}>
              Demo interactiva · sin registro
            </div>
          </div>
        </div>

        {/* Filete gold superior */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg, transparent, #CDD9E4 30%, #CDD9E4 70%, transparent)" }} />
      </div>
    ),
    { ...size }
  );
}
