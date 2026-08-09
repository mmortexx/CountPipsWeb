/**
 * Comprobación de humo en navegador real.
 *
 * No sustituye a las pruebas de `tests/`: aquellas vigilan cálculos y
 * contratos de datos, y ésta vigila lo que sólo se ve cuando la página se
 * pinta de verdad — que el titular exista y esté visible, que el idioma
 * declarado sea el que toca, que nada se salga por el lado en un móvil
 * estrecho, y que la consola no escupa errores.
 *
 * El caso que la motivó: el `h1` de todas las páginas interiores se
 * servía con opacidad cero y sólo aparecía si arrancaba el JavaScript.
 * Ninguna comprobación de tipos ni de código lo habría visto; un
 * navegador con el JavaScript apagado lo ve en el primer intento.
 *
 * Uso:
 *   node scripts/humo.mjs                    (contra http://localhost:3000)
 *   node scripts/humo.mjs --base http://…    (contra otra dirección)
 *   node scripts/humo.mjs --shots <carpeta>  (además, guarda capturas)
 *
 * Sale con código 1 si algo falla, para poder colgarlo de la integración
 * continua.
 */
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";

const args = process.argv.slice(2);
const arg = (nombre, pordefecto) => {
  const i = args.indexOf(nombre);
  return i >= 0 && args[i + 1] ? args[i + 1] : pordefecto;
};

const BASE = arg("--base", "http://localhost:3000").replace(/\/$/, "");
const SHOTS = arg("--shots", null);

/** Rutas que se comprueban, con el idioma que deben declarar. */
const RUTAS = [
  { ruta: "/", lang: "es" },
  { ruta: "/demo", lang: "es" },
  { ruta: "/pricing", lang: "es" },
  { ruta: "/beta", lang: "es" },
  { ruta: "/features", lang: "es" },
  { ruta: "/faq", lang: "es" },
  { ruta: "/test", lang: "es" },
  { ruta: "/about", lang: "es" },
  { ruta: "/en", lang: "en" },
  { ruta: "/en/pricing", lang: "en" },
  { ruta: "/en/features", lang: "en" },
  { ruta: "/en/beta", lang: "en" },
];

/**
 * Milisegundos que puede tardar el titular en ser legible desde que la
 * página termina de cargar. La portada tiene una secuencia de intro que
 * llegó a costar unos 3 s; con ella apretada queda sobre 1,8 s. El
 * margen deja sitio para la variabilidad de una máquina cargada sin
 * dejar que el gesto vuelva a crecer en silencio.
 */
const PRESUPUESTO_H1_MS = 2500;

/** Escritorio ancho y el móvil estrecho de referencia. */
const PANTALLAS = [
  { nombre: "escritorio", width: 1440, height: 900 },
  // Justo por encima del umbral (1.120 px) donde la barra completa
  // vuelve a mostrarse: es el ancho en el que va más apretada y donde
  // cualquier elemento que crezca volverá a provocar solapes.
  { nombre: "portatil", width: 1180, height: 800 },
  // Por debajo del umbral: aquí debe salir el cajón lateral. Es el ancho
  // en el que la barra completa se montaba sobre sí misma — la marca
  // sobre el primer enlace, el menú sobre el reloj, el reloj sobre el
  // idioma — sin que nada lo delatara.
  { nombre: "tableta", width: 820, height: 1180 },
  { nombre: "movil", width: 390, height: 844 },
];

const fallos = [];
const avisos = [];

/* Ruido de terceros y del servidor de desarrollo que no dice nada del
   sitio. Se filtra para que un fallo real no se pierda entre él. */
const RUIDO =
  /favicon|ERR_CONNECTION|net::ERR_|Download the React DevTools|posthog|challenges\.cloudflare|\[Fast Refresh\]|webpack-hmr|Warning: Extra attributes from the server/i;

const navegador = await chromium.launch();

if (SHOTS) await mkdir(SHOTS, { recursive: true });

for (const pantalla of PANTALLAS) {
  const contexto = await navegador.newContext({
    viewport: { width: pantalla.width, height: pantalla.height },
    deviceScaleFactor: 1,
  });

  for (const { ruta, lang } of RUTAS) {
    const pagina = await contexto.newPage();
    const errores = [];
    pagina.on("console", (m) => {
      if (m.type() === "error" && !RUIDO.test(m.text())) errores.push(m.text());
    });
    pagina.on("pageerror", (e) => {
      if (!RUIDO.test(String(e))) errores.push(String(e));
    });

    const etiqueta = `${pantalla.nombre} ${ruta}`;
    try {
      const resp = await pagina.goto(`${BASE}${ruta}`, {
        waitUntil: "networkidle",
        timeout: 45000,
      });
      if (!resp || resp.status() >= 400) {
        fallos.push(`${etiqueta}: HTTP ${resp ? resp.status() : "sin respuesta"}`);
        await pagina.close();
        continue;
      }

      /* ── PRESUPUESTO DEL TITULAR ────────────────────────────────────
         No basta con mirar la opacidad una vez: la portada tiene una
         secuencia de intro y el titular llega con retardo. Lo que
         importa no es si acaba visible —acaba— sino CUÁNTO TARDA, porque
         es el elemento más grande de la primera pantalla y por tanto lo
         que el navegador mide como tiempo de carga percibido.

         Se sondea hasta que sea legible y se compara con el presupuesto.
         Así, si alguien vuelve a alargar la intro, la comprobación lo
         dice en vez de dejarlo pasar. */
      const t0 = Date.now();
      let visibleEn = null;
      while (Date.now() - t0 < PRESUPUESTO_H1_MS + 1500) {
        const op = await pagina
          .evaluate(() => {
            const h1 = document.querySelector("h1");
            return h1 ? Number(getComputedStyle(h1).opacity) : 0;
          })
          .catch(() => 0);
        if (op >= 0.99) {
          visibleEn = Date.now() - t0;
          break;
        }
        await pagina.waitForTimeout(100);
      }
      if (visibleEn === null) {
        fallos.push(
          `${etiqueta}: el h1 nunca llega a ser visible (más de ${PRESUPUESTO_H1_MS + 1500} ms)`
        );
      } else if (visibleEn > PRESUPUESTO_H1_MS) {
        fallos.push(
          `${etiqueta}: el h1 tarda ${visibleEn} ms en ser legible (presupuesto ${PRESUPUESTO_H1_MS} ms)`
        );
      }

      const informe = await pagina.evaluate(() => {
        const h1s = Array.from(document.querySelectorAll("h1"));
        const primero = h1s[0];
        const estilo = primero ? getComputedStyle(primero) : null;
        return {
          lang: document.documentElement.lang,
          h1Count: h1s.length,
          h1Texto: primero ? (primero.getAttribute("aria-label") || primero.innerText).trim() : "",
          h1Opacidad: estilo ? Number(estilo.opacity) : 0,
          // Desbordamiento horizontal: el documento no debe ser más ancho
          // que la ventana. Se deja 1 px de margen por redondeos.
          desborda: document.documentElement.scrollWidth > window.innerWidth + 1,
          scrollWidth: document.documentElement.scrollWidth,
          innerWidth: window.innerWidth,
          main: !!document.querySelector("main"),
          titulo: document.title,
          /* ── SOLAPES EN LA BARRA SUPERIOR ──────────────────────────
             La rejilla de la barra era `1fr auto 1fr`, y como en CSS
             `1fr` no puede encogerse por debajo de su contenido, la
             navegación central se quedaba sin sitio y desbordaba encima
             de la marca: a 1.267 px «CountPips» acababa en 212 y
             «Producto» empezaba en 199. No lo caza ninguna comprobación
             de desbordamiento del documento, porque nada se sale de la
             página — los elementos se pisan entre ellos y ya está.
             Aquí se compara caja contra caja. */
          solapesBarra: (() => {
            const cabecera = document.querySelector("header");
            if (!cabecera) return [];
            const cajas = Array.from(
              cabecera.querySelectorAll("a, button")
            )
              .map((el) => {
                const b = el.getBoundingClientRect();
                return {
                  t: (el.textContent || el.getAttribute("aria-label") || "?").trim().slice(0, 18),
                  l: b.left,
                  r: b.right,
                  cy: b.top + b.height / 2,
                  w: b.width,
                  h: b.height,
                };
              })
              // Sólo lo visible y sólo la primera fila de la barra.
              .filter((c) => c.w > 0 && c.h > 0 && c.cy < 80)
              .sort((a, b) => a.l - b.l);
            const out = [];
            for (let i = 1; i < cajas.length; i++) {
              // 1 px de tolerancia por redondeos de subpíxel.
              if (cajas[i].l < cajas[i - 1].r - 1) {
                out.push(`"${cajas[i - 1].t}" se monta sobre "${cajas[i].t}"`);
              }
            }
            return out;
          })(),
        };
      });

      if (informe.lang !== lang) {
        fallos.push(`${etiqueta}: lang="${informe.lang}", se esperaba "${lang}"`);
      }
      if (informe.h1Count !== 1) {
        fallos.push(`${etiqueta}: ${informe.h1Count} elementos h1 (debe haber exactamente 1)`);
      }
      if (!informe.h1Texto) {
        fallos.push(`${etiqueta}: el h1 no tiene texto accesible`);
      }
      if (informe.desborda) {
        fallos.push(
          `${etiqueta}: desbordamiento horizontal — ${informe.scrollWidth}px de contenido en ${informe.innerWidth}px de ventana`
        );
      }
      if (!informe.main) avisos.push(`${etiqueta}: sin elemento <main>`);
      for (const s of informe.solapesBarra) {
        fallos.push(`${etiqueta}: barra superior — ${s}`);
      }
      if (errores.length) {
        fallos.push(`${etiqueta}: ${errores.length} error(es) de consola — ${errores[0]}`);
      }

      if (SHOTS) {
        // Esperar a que la cortina de la intro se haya retirado del DOM y
        // a que no queden animaciones corriendo: si no, la captura sale a
        // mitad de la transición, con la barra superior medio tapada, y
        // no sirve para juzgar nada.
        await pagina
          .waitForFunction(() => !document.getElementById("tj-loader"), null, { timeout: 6000 })
          .catch(() => {});
        await pagina
          .waitForFunction(
            () => document.getAnimations().every((a) => a.playState !== "running"),
            null,
            { timeout: 4000 }
          )
          .catch(() => {});
        const nombre = ruta === "/" ? "home" : ruta.slice(1).replace(/\//g, "-");
        await pagina.screenshot({
          path: `${SHOTS}/${pantalla.nombre}-${nombre}.png`,
          fullPage: false,
        });
      }
    } catch (e) {
      fallos.push(`${etiqueta}: ${String(e).split("\n")[0]}`);
    }
    await pagina.close();
  }
  await contexto.close();
}

/* ── El titular, sin JavaScript ──────────────────────────────────────
   La comprobación que motivó todo esto. Se repite sólo en escritorio:
   el problema no dependía del tamaño de la ventana. */
const sinJs = await navegador.newContext({
  javaScriptEnabled: false,
  viewport: { width: 1440, height: 900 },
});
for (const { ruta } of RUTAS.slice(0, 8)) {
  const pagina = await sinJs.newPage();
  try {
    await pagina.goto(`${BASE}${ruta}`, { waitUntil: "domcontentloaded", timeout: 30000 });
    const r = await pagina.evaluate(() => {
      const h1 = document.querySelector("h1");
      if (!h1) return { hay: false, opacidad: 0, texto: "" };
      const e = getComputedStyle(h1);
      return {
        hay: true,
        opacidad: Number(e.opacity),
        texto: (h1.getAttribute("aria-label") || h1.textContent || "").trim(),
        oculto: e.visibility === "hidden" || e.display === "none",
      };
    });
    if (!r.hay) fallos.push(`sin-JS ${ruta}: no hay h1 en el HTML`);
    else if (!r.texto) fallos.push(`sin-JS ${ruta}: el h1 no tiene texto`);
    else if (r.oculto || r.opacidad < 0.99) {
      fallos.push(`sin-JS ${ruta}: el h1 no es visible sin JavaScript (opacidad ${r.opacidad})`);
    }
  } catch (e) {
    fallos.push(`sin-JS ${ruta}: ${String(e).split("\n")[0]}`);
  }
  await pagina.close();
}
await sinJs.close();

await navegador.close();

for (const a of avisos) console.warn(`  aviso  ${a}`);
if (fallos.length) {
  console.error(`\n[humo] ${fallos.length} fallo(s):`);
  for (const f of fallos) console.error(`  ✗ ${f}`);
  process.exit(1);
}
console.log(
  `[humo] correcto — ${RUTAS.length} rutas × ${PANTALLAS.length} pantallas, más el titular sin JavaScript.`
);
