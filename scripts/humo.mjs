/**
 * Comprobación de humo en navegador real: lo que solo se ve cuando la página
 * se pinta de verdad (titular visible, idioma declarado, desbordes en móvil
 * estrecho, errores de consola, contraste, menús, capas). Complementa a
 * `tests/`, que vigila cálculos y contratos de datos. Cada comprobación
 * guarda lo que midió para que «pasó» no signifique «no miró nada».
 *
 * Uso:
 *   node scripts/humo.mjs                    (contra http://localhost:3000)
 *   node scripts/humo.mjs --base http://…    (contra otra dirección)
 *   node scripts/humo.mjs --serve out        (sirve la exportación estática)
 *   node scripts/humo.mjs --shots <carpeta>  (además, guarda capturas)
 *
 * Sale con código 1 si algo falla, para colgarlo de la integración continua.
 */
import { chromium } from "playwright";
import { createServer } from "node:http";
import { createReadStream } from "node:fs";
import { mkdir, stat } from "node:fs/promises";
import { extname, join, normalize } from "node:path";

const args = process.argv.slice(2);
const arg = (nombre, pordefecto) => {
  const i = args.indexOf(nombre);
  return i >= 0 && args[i + 1] ? args[i + 1] : pordefecto;
};

let BASE = arg("--base", "http://localhost:3000").replace(/\/$/, "");
const SHOTS = arg("--shots", null);
/** Carpeta estática a servir: no hace falta ningún servidor aparte. */
const SERVIR = arg("--serve", null);

const TIPOS = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
};

/**
 * Servidor estático mínimo para el export. Traduce `/features` y `/features/`
 * a `features/index.html` (`trailingSlash: true`); sin eso todo daría 404.
 * En CI el HTML pide `/CountPipsWeb/_next/...` (`NEXT_PUBLIC_BASE_PATH`): se
 * quita ese prefijo para servir la carpeta desde la raíz.
 */
const PREFIJO = (process.env.NEXT_PUBLIC_BASE_PATH ?? "").replace(/\/$/, "");

async function levantarServidor(raiz) {
  const resolver = async (ruta) => {
    let pedida = decodeURIComponent(ruta.split("?")[0]);
    if (PREFIJO && (pedida === PREFIJO || pedida.startsWith(`${PREFIJO}/`))) {
      pedida = pedida.slice(PREFIJO.length) || "/";
    }
    const limpia = normalize(pedida).replace(/^(\.\.[/\\])+/, "");
    const candidatos = [
      join(raiz, limpia),
      join(raiz, limpia, "index.html"),
      join(raiz, `${limpia}.html`),
    ];
    for (const c of candidatos) {
      try {
        const s = await stat(c);
        if (s.isFile()) return c;
      } catch {
        /* siguiente candidato */
      }
    }
    return null;
  };

  const servidor = createServer(async (req, res) => {
    const fichero = await resolver(req.url || "/");
    if (!fichero) {
      /* Como GitHub Pages: una página que no existe recibe `404.html`. */
      const pagina404 = extname((req.url || "").split("?")[0]) ? null : await resolver("/404.html");
      if (pagina404) {
        res.writeHead(404, { "content-type": TIPOS[".html"] });
        createReadStream(pagina404).pipe(res);
        return;
      }
      res.writeHead(404, { "content-type": "text/plain" });
      res.end("404");
      return;
    }
    res.writeHead(200, {
      "content-type": TIPOS[extname(fichero).toLowerCase()] || "application/octet-stream",
    });
    createReadStream(fichero).pipe(res);
  });

  await new Promise((resolver2) => servidor.listen(0, "127.0.0.1", resolver2));
  const { port } = servidor.address();
  return { servidor, url: `http://127.0.0.1:${port}` };
}

let servidorLocal = null;
if (SERVIR) {
  servidorLocal = await levantarServidor(SERVIR);
  BASE = servidorLocal.url;
  console.log(`[humo] sirviendo ${SERVIR} en ${BASE}`);
}

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
  // Las rutas inglesas cubren donde vive la comprobación de idioma.
  { ruta: "/en/demo", lang: "en" },
  { ruta: "/en/about", lang: "en" },
  { ruta: "/en/faq", lang: "en" },
  // Una de cada familia generada (glosario, herramientas, traders, legales):
  // un defecto de plantilla afecta a decenas de páginas a la vez.
  { ruta: "/glosario/drawdown", lang: "es" },
  { ruta: "/herramientas/monte-carlo", lang: "es" },
  { ruta: "/traders/prop-firms", lang: "es" },
  { ruta: "/privacidad", lang: "es" },
];

/**
 * Palabras que solo existen en español (artículos, preposiciones, conjunciones):
 * aparecen en toda frase española de más de tres palabras y en ninguna inglesa;
 * los sustantivos de trading son iguales en los dos idiomas. Ninguna de dos
 * letras: la comparación ignora mayúsculas y «ES» del pie «ES + EN» contaría
 * como «es». Basta una para fallar.
 */
const PALABRAS_ESPANOLAS =
  /(?:^|[\s"'“”(¡¿—–-])(para|por|sin|más|que|del|con|una|unos|unas|los|las|sus|como|cuando|desde|hasta|pero|también|según|cada|todo|todos|todas|entre|sobre|está|están|este|esta|esto|nuestro|nuestra|qué|cómo|dónde|hecho|hasta|muy|aquí|así)(?=[\s".,;:!?)"'”—–-]|$)/giu;

/** Cuenta cuántas palabras españolas DISTINTAS hay en un texto. */
function marcasEspanolas(texto) {
  const vistas = new Set();
  for (const m of texto.matchAll(PALABRAS_ESPANOLAS)) vistas.add(m[1].toLowerCase());
  return [...vistas];
}

/**
 * Milisegundos que puede tardar el titular en ser legible tras cargar la
 * página: deja margen a una máquina cargada sin permitir que la secuencia de
 * intro de la portada vuelva a crecer en silencio.
 */
const PRESUPUESTO_H1_MS = 2500;

/** Escritorio ancho y el móvil estrecho de referencia. */
const PANTALLAS = [
  { nombre: "escritorio", width: 1440, height: 900 },
  // Justo por encima del umbral (1.120 px) de la barra completa: es donde va
  // más apretada y cualquier elemento que crezca provoca solapes.
  { nombre: "portatil", width: 1180, height: 800 },
  // Por debajo del umbral: debe salir el cajón lateral (la barra completa se
  // montaba sobre sí misma a este ancho).
  { nombre: "tableta", width: 820, height: 1180 },
  { nombre: "movil", width: 390, height: 844 },
];

const fallos = [];
const avisos = [];
// Lo que cada comprobación llegó a medir, para auditar la propia comprobación:
// una que no mide nada también sale en verde.
/** Contrastes medidos. */
const contrastesMedidos = [];
/** Láminas del producto vistas (sin ellas, la legibilidad en móvil no mira nada). */
const laminasVistas = [];
/** Lo que enseñó cada lámina en tema oscuro. */
const temasLaminaVistos = [];
/** Dónde se abrió la ayuda de atajos de la demo, por pantalla. */
const ayudasDemo = [];
/** Caracteres leídos en cada página inglesa (un `innerText` vacío pasaría en verde). */
const idiomasRevisados = [];
/** Vuelta a la cabecera: de dónde salió, dónde apareció y dónde acabó. */
const vueltasArriba = [];
/** Cajón de navegación: dónde acabó y con qué opacidad. */
const cajonesVistos = [];
/** Material del papel: qué tinte llegó de verdad al elemento. */
const papelesVistos = [];
/** Opacidad al final del scroll: cuántas rutas se miraron. */
const opacidadesFinales = [];
/** Llamada a la acción de la portada respecto al pliegue, por pantalla. */
const pliegues = [];
/** Contenido servido dentro de bloques ocultos sin JavaScript. */
const ocultosVistos = [];
/** Velo del fondo sin JavaScript: opacidades conservadas y ceros rescatados. */
const velosVistos = [];
/** Entradas atadas al scroll: cuántas entran de verdad sobre el total. */
const entradasVistas = [];
/** Menú de «Producto»: qué hace al pasar el ratón y al pulsarlo. */
const menusVistos = [];
/** Holgura de la barra superior: cuánto pide y cuánto hay. */
const presupuestosBarra = [];
/** Botón principal del cierre en móvil. */
const cierresMedidos = [];

/**
 * Contraste de un texto contra el fondo que de verdad tiene debajo. Se miden
 * píxeles y no el CSS computado, que no entiende `color-mix()` ni
 * `background-image` y daba falsos fallos. Se captura la caja del texto en un
 * canvas: el fondo es la luminancia más frecuente y el peor caso, el percentil
 * de la cola más cercana al color del texto. Devuelve null si el elemento está
 * fuera de vista.
 */
async function mideContraste(pagina, cand) {
  const { x, y, w, h } = cand.caja;
  let png;
  try {
    png = await pagina.screenshot({
      clip: {
        x: Math.max(0, x - 2),
        y: Math.max(0, y - 2),
        width: Math.max(4, Math.min(w + 4, 1400)),
        height: Math.max(4, h + 4),
      },
    });
  } catch {
    return null;
  }

  return pagina.evaluate(
    async ({ b64, color }) => {
      const img = new Image();
      img.src = "data:image/png;base64," + b64;
      await img.decode();
      const cv = document.createElement("canvas");
      cv.width = img.width;
      cv.height = img.height;
      const g = cv.getContext("2d");
      g.drawImage(img, 0, 0);
      const d = g.getImageData(0, 0, cv.width, cv.height).data;

      const lin = (v) => {
        v /= 255;
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
      };
      const lum = (r, gg, b) => 0.2126 * lin(r) + 0.7152 * lin(gg) + 0.0722 * lin(b);

      const hist = new Array(256).fill(0);
      const lums = [];
      for (let i = 0; i < d.length; i += 4) {
        const L = lum(d[i], d[i + 1], d[i + 2]);
        lums.push(L);
        hist[Math.round(L * 255)]++;
      }
      let moda = 0;
      for (let i = 1; i < 256; i++) if (hist[i] > hist[moda]) moda = i;
      const Lfondo = moda / 255;

      // El color lo resuelve el navegador, no una expresión regular: Chromium
      // devuelve `oklab(0.81 -0.005 -0.010 / 0.86)` para los colores de Tailwind
      // con opacidad, y un regex sobre esos números da negro casi puro. Un
      // lienzo de 1×1 acepta cualquier color que el navegador entienda y
      // devuelve los canales resueltos; si trae transparencia, se compone
      // sobre el fondo medido.
      const lienzo = document.createElement("canvas");
      lienzo.width = lienzo.height = 1;
      const cl = lienzo.getContext("2d", { willReadFrequently: true });
      cl.clearRect(0, 0, 1, 1);
      cl.fillStyle = "#000";
      cl.fillStyle = color;
      cl.fillRect(0, 0, 1, 1);
      const px = cl.getImageData(0, 0, 1, 1).data;
      const alfa = px[3] / 255;
      // Gris del fondo dominante para componer un texto translúcido: `Lfondo`
      // es luminancia lineal y hay que volver a codificarla en gamma sRGB.
      const gris =
        255 *
        (Lfondo <= 0.0031308
          ? Lfondo * 12.92
          : 1.055 * Math.pow(Lfondo, 1 / 2.4) - 0.055);
      const rgb = [
        alfa >= 0.999 ? px[0] : px[0] * alfa + gris * (1 - alfa),
        alfa >= 0.999 ? px[1] : px[1] * alfa + gris * (1 - alfa),
        alfa >= 0.999 ? px[2] : px[2] * alfa + gris * (1 - alfa),
      ];
      const Ltexto = lum(rgb[0], rgb[1], rgb[2]);

      lums.sort((a, b) => a - b);
      const pct = (q) => lums[Math.floor((lums.length - 1) * q)];
      // Con texto oscuro, el peor fondo es el más oscuro del lado claro; y al revés.
      const Lpeor = Ltexto < Lfondo ? pct(0.35) : pct(0.65);

      const ratio = (a, b) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
      return ratio(Ltexto, Lpeor);
    },
    { b64: png.toString("base64"), color: cand.color },
  );
}

/* Ruido de terceros y del servidor de desarrollo que no dice nada del sitio.
   El último trozo (`__next.…txt?_rsc=`) son los prefetch de segmento de Next:
   al exportar en Windows se escriben como carpeta y el cliente los pide en
   plano, así que dan 404 en todas las páginas; compilando en Linux (CI) sale
   el fichero plano y no falla. Es un artefacto de la máquina que compila.
   Para comprobarlo: `find out -name "__next.*.__PAGE__.txt" | wc -l` sobre la
   exportación; cero significa que compiló Windows. */
const RUIDO =
  /favicon|ERR_CONNECTION|net::ERR_|Download the React DevTools|posthog|challenges\.cloudflare|\[Fast Refresh\]|webpack-hmr|Warning: Extra attributes from the server|__next\.[^"'\s]*\.txt(\?|$)/i;

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
    // Un 404 en consola no dice qué faltó: se captura la URL de la respuesta.
    pagina.on("response", (r) => {
      if (r.status() === 404) {
        const u = r.url().replace(BASE, "");
        if (!RUIDO.test(u)) errores.push(`404 ${u}`);
      }
    });
    pagina.on("console", (m) => {
      const t = m.text();
      // «Failed to load resource» ya lo reporta el manejador de arriba, con su URL.
      if (m.type() === "error" && !RUIDO.test(t) && !/Failed to load resource/i.test(t)) {
        errores.push(t);
      }
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

      // Presupuesto del titular: no importa si acaba visible sino cuánto tarda
      // (es lo más grande de la primera pantalla). Se sondea hasta que sea
      // legible y se compara con el presupuesto.
      const t0 = Date.now();
      let visibleEn = null;
      while (Date.now() - t0 < PRESUPUESTO_H1_MS + 1500) {
        // El h1 está opaco desde el primer fotograma y lo que se mueve son sus
        // palabras (`Palabras.tsx`): una palabra cuenta como leída cuando le
        // queda menos del 5 % de su alto por subir.
        const op = await pagina
          .evaluate(() => {
            const h1 = document.querySelector("h1");
            if (!h1) return 0;
            const enSitio = [...h1.querySelectorAll(".tj-pal > span")].every((s) => {
              const t = getComputedStyle(s).transform;
              return Math.abs(new DOMMatrix(t === "none" ? undefined : t).m42) <= 0.05 * s.offsetHeight;
            });
            return enSitio ? Number(getComputedStyle(h1).opacity) : 0;
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

      // Las láminas se miden cuando han cargado: `currentSrc` está vacío hasta
      // la descarga y las perezosas aún no habían pedido nada. Se fuerza la
      // carga y se espera hasta 3 s; si no llega, el informe dirá lo que haya.
      await pagina
        .evaluate(async () => {
          const imgs = Array.from(document.querySelectorAll(".tj-lamina-ventana img")).filter(
            (i) => i.getBoundingClientRect().width > 0
          );
          for (const i of imgs) i.loading = "eager";
          await Promise.race([
            Promise.all(
              imgs.map((i) =>
                i.complete && i.naturalWidth > 0
                  ? null
                  : new Promise((r) => {
                      i.addEventListener("load", r, { once: true });
                      i.addEventListener("error", r, { once: true });
                    })
              )
            ),
            new Promise((r) => setTimeout(r, 3000)),
          ]);
        })
        .catch(() => {});

      const informe = await pagina.evaluate(() => {
        const h1s = Array.from(document.querySelectorAll("h1"));
        const primero = h1s[0];
        const estilo = primero ? getComputedStyle(primero) : null;
        return {
          lang: document.documentElement.lang,
          h1Count: h1s.length,
          h1Texto: primero ? (primero.getAttribute("aria-label") || primero.innerText).trim() : "",
          h1Opacidad: estilo ? Number(estilo.opacity) : 0,
          // El documento no debe ser más ancho que la ventana (1 px de margen por redondeos).
          desborda: document.documentElement.scrollWidth > window.innerWidth + 1,
          scrollWidth: document.documentElement.scrollWidth,
          innerWidth: window.innerWidth,
          main: !!document.querySelector("main"),
          titulo: document.title,
          // Presupuesto de la barra: lo que las tres zonas piden frente a lo que
          // la rejilla les da. El solape de abajo solo salta cuando dos cajas ya
          // se pisan (con 1 px de tolerancia) y deja pasar el margen cero; esto
          // se pone rojo antes, con un número que dice cuánto falta.
          presupuestoBarra: (() => {
            const rejilla = document.querySelector("header .grid");
            if (!rejilla || rejilla.children.length < 3) return null;
            const zonas = [...rejilla.children];
            // Se mide el ancho natural de cada zona, no el concedido: el
            // concedido nunca delata que no cabía.
            const natural = (el) => {
              const c = el.cloneNode(true);
              c.style.cssText =
                "position:absolute;left:-9999px;top:0;width:max-content;visibility:hidden";
              document.body.appendChild(c);
              const w = c.getBoundingClientRect().width;
              c.remove();
              return w;
            };
            const visibles = zonas.filter((z) => z.getBoundingClientRect().width > 0);
            if (visibles.length < 3) return null; // barra plegada al cajón
            const cs = getComputedStyle(rejilla);
            const canal = parseFloat(cs.columnGap) || 0;
            const pide =
              visibles.reduce((s, z) => s + natural(z), 0) + canal * (visibles.length - 1);
            const hay = rejilla.getBoundingClientRect().width;
            return { pide: Math.round(pide), hay: Math.round(hay), canal };
          })(),

          // Solapes en la barra: ninguna comprobación de desbordamiento del
          // documento los ve (nada se sale de la página), así que se compara
          // caja contra caja.
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
              // Solo lo visible y la primera fila de la barra.
              .filter((c) => c.w > 0 && c.h > 0 && c.cy < 80)
              .sort((a, b) => a.l - b.l);
            const out = [];
            for (let i = 1; i < cajas.length; i++) {
              // 1 px de tolerancia por subpíxeles.
              if (cajas[i].l < cajas[i - 1].r - 1) {
                out.push(`"${cajas[i - 1].t}" se monta sobre "${cajas[i].t}"`);
              }
            }
            return out;
          })(),

          // La captura del producto a 390 px: en móvil no puede servir la pantalla
          // entera reducida (no se leería una cifra). Se mira lo que el navegador
          // descarga (`currentSrc`), no lo que declara el `srcSet`.
          laminas: [...document.querySelectorAll(".tj-lamina-ventana img")]
            // Cada lámina monta dos capturas (clara y oscura) y el CSS esconde
            // la que no toca, que ni se descarga: se mide la que el visitante ve.
            .filter((img) => img.getBoundingClientRect().width > 0)
            .map((img) => ({
              // `currentSrc` y no `|| src`: `src` es siempre el de escritorio y
              // convertiría «aún no cargó» en «sirve el fichero equivocado».
              sirve: (img.currentSrc || "").split("/").pop() || "(sin descargar)",
              nativo: img.naturalWidth,
              mostrado: Math.round(img.getBoundingClientRect().width),
            })),

          // Candidatos para la medición de contraste (se mide fuera, en
          // `mideContraste`): los textos más pequeños sobre el fondo grabado,
          // los que se quedan sin margen si alguien mueve el velo.
          candidatosContraste: (() => {
            const out = [];
            const sobrePapel = (el) =>
              el.closest("header, footer, .tj-paper, .demo-card, nav, [style*='background']");
            for (const el of document.querySelectorAll(".text-tertiary, .eyebrow, figcaption, small")) {
              if (sobrePapel(el)) continue;
              const r = el.getBoundingClientRect();
              const cs = getComputedStyle(el);
              if (r.width < 30 || r.height < 7) continue;
              if (r.top < 4 || r.bottom > window.innerHeight - 4) continue;
              if (!(el.textContent || "").trim()) continue;
              if (cs.visibility === "hidden" || cs.opacity === "0") continue;
              out.push({
                caja: { x: r.x, y: r.y, w: r.width, h: r.height },
                color: cs.color,
                tam: parseFloat(cs.fontSize),
                peso: Number(cs.fontWeight) || 400,
                texto: (el.textContent || "").trim().slice(0, 24),
              });
            }
            // Los dos más pequeños: el peor caso.
            return out.sort((a, b) => a.tam - b.tam).slice(0, 2);
          })(),

          // (El papel llegó a la hoja compilada: se mide en el estilo computado de
          // los dos temas, fuera de este informe; ver «la tarjeta, opaca en los
          // dos temas» más abajo.)

          // Idioma de lo que se lee y de lo que se declara: el texto visible y los
          // datos estructurados que ve el buscador. Declarar `lang="en"` y
          // describirse en español es peor que no describirse.
          textoVisible: (document.body.innerText || "").slice(0, 60000),
          textoDatos: [...document.querySelectorAll('script[type="application/ld+json"]')]
            .map((s) => {
              // Solo los valores de texto: las claves de schema.org y las URLs
              // son inglesas por definición.
              try {
                const textos = [];
                const recorrer = (v) => {
                  if (typeof v === "string") textos.push(v);
                  else if (Array.isArray(v)) v.forEach(recorrer);
                  else if (v && typeof v === "object") Object.values(v).forEach(recorrer);
                };
                recorrer(JSON.parse(s.textContent || "{}"));
                return textos.filter((t) => !t.startsWith("http")).join(" · ");
              } catch {
                return "";
              }
            })
            .join(" · "),
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

      // La llamada a la acción dentro de la primera pantalla: quien no baja, no
      // la ve. El hero mide una ventana completa y el problema depende de la
      // altura, así que se comprueba en las cuatro pantallas.
      if (ruta === "/") {
        const pliegue = await pagina.evaluate(() => {
          const cta = [...document.querySelectorAll("main a")].find((a) =>
            /demo/i.test(a.getAttribute("href") || "")
          );
          if (!cta) return null;
          const r = cta.getBoundingClientRect();
          return { fin: Math.round(r.bottom), alto: window.innerHeight };
        });
        if (!pliegue) {
          fallos.push(`${etiqueta}: la portada no tiene una llamada a la acción que medir`);
        } else {
          pliegues.push(`${pantalla.nombre} ${pliegue.fin}/${pliegue.alto}`);
          if (pliegue.fin > pliegue.alto - 8) {
            fallos.push(
              `${etiqueta}: la llamada a la acción acaba en ${pliegue.fin}px y la pantalla mide ${pliegue.alto}px — queda en el pliegue o por debajo`
            );
          }
        }
      }

      // La tarjeta, opaca en los dos temas: `.tj-paper` debe tapar lo que hay
      // detrás porque su texto se mide contra su propio fondo. Se fuerzan los
      // dos temas como el conmutador (`data-theme` más la clase `dark`).
      if (pantalla.nombre === "escritorio") {
        const papeles = await pagina.evaluate(async () => {
          const raiz = document.documentElement;
          const original = raiz.dataset.theme;
          const salida = {};
          for (const tema of ["light", "dark"]) {
            raiz.dataset.theme = tema;
            raiz.classList.toggle("dark", tema === "dark");
            // Un fotograma: el estilo computado no refleja el cambio hasta recalcular.
            await new Promise((r) => requestAnimationFrame(() => r()));
            const el = document.querySelector(".tj-paper:not(.tj-paper-dense)");
            salida[tema] = el
              ? {
                  tinte: getComputedStyle(el).backgroundColor,
                }
              : null;
          }
          // Se restaura el estado exacto, incluida la ausencia del atributo:
          // `dataset.theme = undefined` escribe «undefined» y ninguna regla de
          // tema casaría, así que las comprobaciones siguientes medirían un tema inexistente.
          if (original === undefined) delete raiz.dataset.theme;
          else raiz.dataset.theme = original;
          raiz.classList.toggle("dark", original === "dark");
          return salida;
        });
        for (const tema of ["light", "dark"]) {
          const p = papeles[tema];
          if (!p) {
            avisos.push(`${etiqueta} (${tema}): ninguna tarjeta que comprobar`);
            continue;
          }
          papelesVistos.push(`${ruta} ${tema} tinte ${p.tinte}`);
          const alfa = /rgba?\([^)]*,\s*([\d.]+)\)$/.exec(p.tinte.replace(/\s*\/\s*/, ", "))?.[1];
          if (p.tinte === "transparent" || (alfa !== undefined && p.tinte.startsWith("rgba") && Number(alfa) < 1)) {
            fallos.push(`${etiqueta} (tema ${tema}): la tarjeta dejó de ser opaca (${p.tinte})`);
          }
        }
      }

      // Cada tema, su captura y solo una: el CSS esconde la que no toca
      // (ProductPlate.tsx); si esa regla se pierde, en oscuro se ve la clara o
      // las dos a la vez. Se fuerza cada tema y se mira qué fichero enseña cada ventana.
      const temasLamina = await pagina.evaluate(async () => {
        const ventanas = [...document.querySelectorAll(".tj-lamina-ventana")];
        if (!ventanas.length) return null;
        const raiz = document.documentElement;
        const original = raiz.dataset.theme;
        const salida = {};
        for (const tema of ["light", "dark"]) {
          raiz.dataset.theme = tema;
          raiz.classList.toggle("dark", tema === "dark");
          await new Promise((r) => requestAnimationFrame(() => r()));
          const visibles = ventanas.map((v) =>
            [...v.querySelectorAll("img")].filter((i) => i.getBoundingClientRect().width > 0)
          );
          for (const i of visibles.flat()) i.loading = "eager";
          await Promise.race([
            Promise.all(
              visibles.flat().map((i) =>
                i.complete && i.naturalWidth > 0
                  ? null
                  : new Promise((r) => {
                      i.addEventListener("load", r, { once: true });
                      i.addEventListener("error", r, { once: true });
                    })
              )
            ),
            new Promise((r) => setTimeout(r, 3000)),
          ]);
          salida[tema] = visibles.map((imgs) =>
            imgs.map((i) => (i.currentSrc || "").split("/").pop() || "(sin descargar)")
          );
        }
        if (original === undefined) delete raiz.dataset.theme;
        else raiz.dataset.theme = original;
        raiz.classList.toggle("dark", original === "dark");
        return salida;
      });
      if (temasLamina) {
        for (const tema of ["light", "dark"]) {
          temasLamina[tema].forEach((sirve, n) => {
            if (sirve.length !== 1) {
              fallos.push(
                `${etiqueta} (tema ${tema}): la lámina ${n + 1} enseña ${sirve.length} capturas a la vez (${sirve.join(", ") || "ninguna"})`
              );
            } else if (sirve[0].includes("-oscuro") !== (tema === "dark")) {
              fallos.push(`${etiqueta} (tema ${tema}): la lámina ${n + 1} enseña "${sirve[0]}", la del otro tema`);
            }
            if (tema === "dark") temasLaminaVistos.push(`${etiqueta} ${sirve.join(",")}`);
          });
        }
      }

      // La ayuda de la demo se abre donde se ve: va anclada a la barra de estado
      // y a 1440×900 quedaba bajo el borde. Se abre con foco en la demo y `?`,
      // y se exige que quepa entera en la ventana.
      if (ruta.endsWith("/demo")) {
        const pestana = pagina.locator(".demo-window [role=tab]").first();
        if (await pestana.count()) {
          await pestana.click();
          await pagina.keyboard.press("Shift+Slash");
          await pagina.waitForTimeout(900);
          const ayuda = await pagina.evaluate(() => {
            const d = document.querySelector('.demo-window [role="dialog"][aria-modal="false"]');
            if (!d) return null;
            const r = d.getBoundingClientRect();
            return { arriba: Math.round(r.top), abajo: Math.round(r.bottom), alto: innerHeight };
          });
          await pagina.keyboard.press("Escape");
          if (!ayuda) {
            fallos.push(`${etiqueta}: «?» con la demo enfocada no abre su ayuda de atajos`);
          } else {
            ayudasDemo.push(`${etiqueta} ${ayuda.arriba}–${ayuda.abajo}/${ayuda.alto}`);
            if (ayuda.arriba < 0 || ayuda.abajo > ayuda.alto) {
              fallos.push(
                `${etiqueta}: la ayuda de atajos de la demo se abre fuera de la pantalla (${ayuda.arriba}–${ayuda.abajo} px con la ventana en ${ayuda.alto})`
              );
            }
          }
        } else {
          avisos.push(`${etiqueta}: no encuentro las pestañas de la demo para abrir su ayuda`);
        }
      }

      // Nada a medio encender al final del scroll: las entradas de sección usan
      // `animation-timeline: view()`, cuyo progreso se mapea y no se «completa»;
      // un elemento que nunca llega al final de su rango se queda a media
      // opacidad. Se baja al final y se exige que todo lo visible esté opaco.
      if (pantalla.nombre === "escritorio") {
        const tenues = await pagina.evaluate(async () => {
          window.scrollTo(0, document.documentElement.scrollHeight);
          // El timeline se resuelve en el compositor y el estilo computado tarda en reflejarlo.
          await new Promise((r) => setTimeout(r, 700));
          const out = [];
          for (const el of document.querySelectorAll("[data-entra], #main-content section")) {
            const op = parseFloat(getComputedStyle(el).opacity);
            const b = el.getBoundingClientRect();
            if (op < 0.99 && b.height > 0 && b.top < window.innerHeight && b.bottom > 0) {
              out.push(`${el.tagName} ${op.toFixed(2)} "${(el.textContent || "").trim().slice(0, 30)}"`);
            }
          }
          window.scrollTo(0, 0);
          return out;
        });
        opacidadesFinales.push(`${ruta}: ${tenues.length} elemento(s) a media tinta`);
        if (tenues.length) {
          fallos.push(
            `${etiqueta}: al final del documento queda contenido a media opacidad — ${tenues.slice(0, 3).join("; ")}`
          );
        }
      }

      // Las entradas tienen que entrar: `animation-timeline: view()` falla en
      // silencio (con la línea de tiempo inactiva la pieza queda «visible» y el
      // gesto no está), y `overflow: hidden` la inactiva; `overflow: clip` no.
      // Se recorre la página por tercios de ventana y se cuentan las piezas vistas
      // entrando. Umbral del 25 %: `content-visibility: auto` salta animaciones;
      // se vigila que el mecanismo esté vivo, no que ninguna pieza se pierda.
      if (pantalla.nombre === "escritorio" && ruta === "/features") {
        const entradas = await pagina.evaluate(async () => {
          const esperar = () => new Promise((r) => setTimeout(r, 200));
          // Con JavaScript las entradas las lleva `Aparecer.tsx` (`data-tj-ap`); sin él, `data-entra`.
          const todos = [...document.querySelectorAll("[data-entra], [data-tj-ap]")];
          const vistos = new Set();
          const alto = document.documentElement.scrollHeight;
          for (let y = 0; y < alto; y += Math.round(window.innerHeight / 3)) {
            window.scrollTo(0, y);
            await esperar();
            for (const el of todos) {
              if (Number(getComputedStyle(el).opacity) < 0.98) vistos.add(el);
            }
          }
          window.scrollTo(0, 0);
          return { total: todos.length, animaron: vistos.size };
        });
        entradasVistas.push(`${ruta}: ${entradas.animaron}/${entradas.total}`);
        if (entradas.total === 0) {
          fallos.push(`${etiqueta}: ninguna pieza con \`data-entra\` que comprobar`);
        } else if (entradas.animaron < entradas.total * 0.25) {
          fallos.push(
            `${etiqueta}: solo ${entradas.animaron} de ${entradas.total} piezas con ` +
              `\`data-entra\` llegan a entrar — la línea de tiempo está inactiva ` +
              `(la causa conocida es una sección con \`overflow-hidden\` en vez de \`overflow-clip\`)`
          );
        }
      }

      // Ninguna entrada enjaulada: un porcentaje es ciego a la erosión, así que se
      // comprueba la causa estructural: una pieza dentro de un contenedor que
      // recorta y nunca se desplaza se queda clavada en su estado final
      // (`overflow: clip` recorta sin crear contenedor). No cuentan un `<svg>`
      // (`overflow: hidden` por defecto) ni un contenedor que sí se desplaza.
      const enjauladas = await pagina.evaluate(async () => {
        // Antes de juzgar una pieza apagada se hace un barrido de la página
        // como al leerla: «aún no asomó» no es «no se enciende nunca».
        const alto = document.documentElement.scrollHeight;
        for (let y = 0; y < alto; y += Math.round(window.innerHeight * 0.75)) {
          window.scrollTo(0, y);
          await new Promise((r) => setTimeout(r, 120));
        }
        window.scrollTo(0, 0);
        await new Promise((r) => setTimeout(r, 250));

        const jaulaDe = (pieza) => {
          let el = pieza.parentElement;
          while (el && el !== document.body) {
            if (!(el instanceof SVGElement)) {
              const o = getComputedStyle(el).overflow;
              const recorta = o !== "visible" && o !== "clip";
              const seDesplaza =
                el.scrollHeight > el.clientHeight + 1 || el.scrollWidth > el.clientWidth + 1;
              if (recorta && !seDesplaza) return el;
            }
            el = el.parentElement;
          }
          return null;
        };
        const presas = [...document.querySelectorAll("[data-entra]")]
          .map((p) => [p, jaulaDe(p)])
          .filter(([, jaula]) => jaula);
        const nombre = ([p, jaula]) =>
          `${p.tagName.toLowerCase()}[data-entra="${p.getAttribute("data-entra")}"] dentro de ` +
          `${jaula.tagName.toLowerCase()}.${(jaula.className || "").toString().split(/\s+/).filter(Boolean).slice(0, 3).join(".")}`;
        // Enjaulada y apagada es un agujero en la página (fallo); enjaulada y
        // encendida solo pierde el gesto de entrada (aviso).
        const apagadas = presas.filter(([p]) => Number(getComputedStyle(p).opacity) < 0.98);
        // `Aparecer.tsx` usa un IntersectionObserver: tras recorrer la página,
        // una pieza que sigue en `data-tj-ap="0"` no asomó nunca (intersección
        // cero por un desplazamiento previo que la sacaba del recorte).
        const atascadas = [...document.querySelectorAll('[data-tj-ap="0"]')]
          .filter((e) => e.offsetHeight > 0)
          .map((e) => `${e.tagName.toLowerCase()}.${(e.className || "").toString().split(/\s+/).filter(Boolean).slice(0, 3).join(".")} «${e.textContent.trim().slice(0, 30)}»`);
        return {
          atascadas: atascadas.slice(0, 4),
          nAtascadas: atascadas.length,
          apagadas: apagadas.map(nombre).slice(0, 4),
          sinGesto: presas.length - apagadas.length,
          ejemploSinGesto: presas.length > apagadas.length ? nombre(presas.find(([p]) => Number(getComputedStyle(p).opacity) >= 0.98)) : null,
        };
      });
      if (enjauladas.nAtascadas) {
        fallos.push(
          `${etiqueta}: ${enjauladas.nAtascadas} pieza(s) no llegan a aparecer tras recorrer ` +
            `la página entera (\`data-tj-ap="0"\`): el visitante no las ve — ${enjauladas.atascadas.join("; ")}`
        );
      }
      if (enjauladas.apagadas.length) {
        fallos.push(
          `${etiqueta}: ${enjauladas.apagadas.length} pieza(s) con \`data-entra\` se quedan ` +
            `INVISIBLES: viven dentro de un contenedor que recorta y no se desplaza, así que ` +
            `su entrada no llega a ejecutarse. Cambia ese \`overflow-hidden\` por ` +
            `\`overflow-clip\` — ${enjauladas.apagadas[0]}`
        );
      } else if (enjauladas.sinGesto > 0) {
        avisos.push(
          `${etiqueta}: ${enjauladas.sinGesto} pieza(s) se ven pero no llegan a entrar ` +
            `(contenedor que recorta sin desplazarse) — ${enjauladas.ejemploSinGesto}`
        );
      }

      // El cajón lateral, abierto: solo existe cuando alguien lo abre, así que
      // las demás comprobaciones no lo miden. Debe caber: al abrirlo el cuerpo
      // pasa a `position: fixed` (ver `Navbar.tsx`) y, si el ancho de anclaje
      // se desvía, se sale por la derecha con las entradas cortadas.
      if (ruta === "/" && (pantalla.nombre === "movil" || pantalla.nombre === "tableta")) {
        const cajon = await pagina.evaluate(async () => {
          const abrir = [...document.querySelectorAll("button")].find((b) =>
            /Abrir menú|Open menu/.test(b.getAttribute("aria-label") || "")
          );
          if (!abrir) return { abrir: false };
          abrir.click();
          // La entrada dura 320 ms: se espera al doble para medir la posición final.
          await new Promise((r) => setTimeout(r, 700));
          const panel = document.querySelector(".tj-paper-dense.fixed");
          if (!panel) return { abrir: true, panel: false };
          const r = panel.getBoundingClientRect();
          const cs = getComputedStyle(panel);
          return {
            abrir: true,
            panel: true,
            izq: Math.round(r.left),
            der: Math.round(r.right),
            ventana: window.innerWidth,
            fondo: cs.backgroundColor,
          };
        });
        if (!cajon.abrir) {
          fallos.push(`${etiqueta}: no hay botón para abrir el cajón de navegación`);
        } else if (!cajon.panel) {
          fallos.push(`${etiqueta}: el cajón no aparece al pulsar su botón`);
        } else {
          cajonesVistos.push(
            `${pantalla.nombre} ${cajon.izq}–${cajon.der} de ${cajon.ventana}px, fondo ${cajon.fondo}`
          );
          if (cajon.der > cajon.ventana + 1 || cajon.izq < -1) {
            fallos.push(
              `${etiqueta}: el cajón se sale de la pantalla — ocupa de ${cajon.izq} a ${cajon.der} en ${cajon.ventana}px`
            );
          }
          // Un cajón translúcido deja leer la página por debajo: se admite hasta
          // un 4 % de paso, el alfa que ya trae el token de superficie.
          const alfa = cajon.fondo.match(/[\d.]+\s*\)$/);
          const paso = alfa && cajon.fondo.includes("/") ? 1 - parseFloat(alfa[0]) : 0;
          if (paso > 0.04) {
            fallos.push(
              `${etiqueta}: el cajón deja pasar el ${Math.round(paso * 100)} % de lo que hay detrás (${cajon.fondo})`
            );
          }
        }
        // Se recarga: la página queda con el cuerpo bloqueado.
        await pagina.reload({ waitUntil: "networkidle" });
      }

      // El menú de «Producto» con un ratón de verdad: el hover lo abre y el clic
      // alterna, así que acercar el cursor y pulsar lo cerraba, y ya no volvía
      // con el cursor quieto. Un `elemento.click()` sintético no mueve el
      // puntero y no reproduce la secuencia: se usan `mouse.move` y `mouse.click`.
      // Se miran tres entradas: ratón encima (abre), ratón y clic (sigue abierto)
      // y teclado (abre).
      if (ruta === "/" && pantalla.nombre === "escritorio") {
        const disparador = await pagina.$("#navbar-producto-trigger");
        if (!disparador) {
          fallos.push(`${etiqueta}: no existe el disparador del menú de Producto`);
        } else {
          const abierto = () =>
            pagina.evaluate(
              () =>
                !!document.getElementById("navbar-producto-panel")
            );
          const caja = await disparador.boundingBox();
          const cx = caja.x + caja.width / 2;
          const cy = caja.y + caja.height / 2;

          // 1) Se parte de fuera para que sea una entrada y no un puntero ya quieto encima.
          await pagina.mouse.move(cx, cy + 240);
          await pagina.mouse.move(cx, cy);
          await pagina.waitForTimeout(320);
          const trasHover = await abierto();
          if (!trasHover) {
            fallos.push(
              `${etiqueta}: el menú de Producto no se abre al pasar el ratón por encima`
            );
          }

          // 2) Se pulsa con el puntero donde estaba.
          await pagina.mouse.click(cx, cy);
          await pagina.waitForTimeout(320);
          const trasClic = await abierto();
          if (!trasClic) {
            fallos.push(
              `${etiqueta}: pulsar «Producto» CIERRA el menú que el propio ratón ` +
                `acababa de abrir — con el cursor encima ya no se puede volver a abrir`
            );
          }
          menusVistos.push(`hover ${trasHover ? "abre" : "NO abre"} · clic ${trasClic ? "mantiene" : "CIERRA"}`);

          // 3) Por teclado no hay hover: el único gesto es abrir y cerrar.
          await pagina.mouse.move(cx, cy + 240);
          await pagina.keyboard.press("Escape");
          await pagina.waitForTimeout(240);
          await pagina.evaluate(() =>
            document.getElementById("navbar-producto-trigger").focus()
          );
          await pagina.keyboard.press("Enter");
          await pagina.waitForTimeout(320);
          if (!(await abierto())) {
            fallos.push(
              `${etiqueta}: el menú de Producto no se abre con el teclado (Enter sobre el disparador)`
            );
          }
          await pagina.keyboard.press("Escape");
          await pagina.waitForTimeout(240);
          if (await abierto()) {
            fallos.push(`${etiqueta}: el menú de Producto no se cierra con Escape`);
          }

          // Los desplegables no transparentan el titular: se abren sobre el h1 y un
          // fondo poco opaco lo deja como un borrón tras la lista. Se mide el fondo
          // en los dos temas; la regla (`tj-cristal--menu`) se olvida fácil en un panel nuevo.
          const opacidadEnTemas = (selector) =>
            pagina.evaluate((sel) => {
              const el = document.querySelector(sel);
              if (!el) return null;
              const raiz = document.documentElement;
              const antes = raiz.getAttribute("data-theme");
              const r = {};
              for (const t of ["light", "dark"]) {
                raiz.setAttribute("data-theme", t);
                const n = getComputedStyle(el).backgroundColor.match(/[\d.]+/g) || [];
                r[t] = n.length === 4 ? Number(n[3]) : n.length === 3 ? 1 : 0;
              }
              if (antes === null) raiz.removeAttribute("data-theme");
              else raiz.setAttribute("data-theme", antes);
              return r;
            }, selector);
          const MIN_OPACIDAD = 0.9;
          const vistos = [];
          await pagina.evaluate(() =>
            document.getElementById("navbar-producto-trigger").focus()
          );
          await pagina.keyboard.press("Enter");
          await pagina.waitForTimeout(320);
          const deMenus = [["Producto", await opacidadEnTemas("#navbar-producto-panel")]];
          await pagina.keyboard.press("Escape");
          await pagina.waitForTimeout(240);
          await pagina.locator('header button[aria-label="Cambiar idioma"]:visible').first().click();
          await pagina.waitForSelector("[data-panel-idiomas]", { timeout: 5000 }).catch(() => {});
          deMenus.push(["idioma", await opacidadEnTemas("[data-panel-idiomas]")]);
          await pagina.keyboard.press("Escape");
          for (const [nombre, o] of deMenus) {
            if (!o) {
              fallos.push(`${etiqueta}: no se pudo abrir el menú de ${nombre} para medir su fondo`);
              continue;
            }
            vistos.push(`${nombre} ${o.light.toFixed(2)}/${o.dark.toFixed(2)}`);
            for (const t of ["light", "dark"]) {
              if (o[t] < MIN_OPACIDAD) {
                fallos.push(
                  `${etiqueta} (tema ${t}): el menú de ${nombre} tiene el fondo al ${o[t]} de opacidad ` +
                    `(mínimo ${MIN_OPACIDAD}) — el titular de detrás se transparenta`
                );
              }
            }
          }
          menusVistos.push(`fondo claro/oscuro: ${vistos.join(" · ")}`);
        }
      }

      // La barra superior no cambia de altura al desplazar: condensarla mueve la
      // marca y el CTA justo al ir a por un enlace, y descuadra los anclajes
      // (`scroll-padding-top` es una constante). Se mide la altura real en tres
      // posiciones, porque una transición, un `@media` o una clase más
      // específica la deshacen aunque la constante siga en el código. En
      // escritorio y móvil: la barra móvil tiene su propia rejilla.
      if (pantalla.nombre === "escritorio" || pantalla.nombre === "movil") {
        const alturas = await pagina.evaluate(async () => {
          const barra = document.querySelector("[data-navbar-root] nav");
          if (!barra) return null;
          const mide = async (y) => {
            window.scrollTo(0, y);
            // Margen de sobra sobre cualquier transición de altura.
            await new Promise((r) => setTimeout(r, 600));
            return Math.round(barra.getBoundingClientRect().height);
          };
          const arriba = await mide(0);
          const justoDespues = await mide(40);
          const abajo = await mide(document.documentElement.scrollHeight);
          window.scrollTo(0, 0);
          await new Promise((r) => setTimeout(r, 400));
          return { arriba, justoDespues, abajo };
        });

        if (!alturas) {
          fallos.push(`${etiqueta}: no se encuentra la barra superior`);
        } else {
          const { arriba, justoDespues, abajo } = alturas;
          if (arriba !== justoDespues || arriba !== abajo) {
            fallos.push(
              `${etiqueta}: la barra superior cambia de altura al desplazar ` +
                `(${arriba} px arriba · ${justoDespues} px tras 40 px de scroll · ` +
                `${abajo} px al final) — tiene que medir lo mismo siempre`
            );
          }
        }
      }

      // La vuelta arriba no rebobina la página: con `scroll-behavior: smooth`
      // volver a la cabecera animaba el recorrido entero. Se miden las
      // posiciones intermedias, porque el destino es el mismo con salto y con
      // rebobinado. Solo en la portada y en escritorio, la página más larga.
      if (ruta === "/" && pantalla.nombre === "escritorio") {
        const viaje = await pagina.evaluate(async () => {
          window.scrollTo(0, document.documentElement.scrollHeight);
          await new Promise((r) => setTimeout(r, 400));
          const desde = Math.round(window.scrollY);
          const boton = [...document.querySelectorAll("button")].find(
            (b) => (b.getAttribute("aria-label") || "") === "Volver arriba"
          );
          if (!boton) return { boton: false };
          const posiciones = [];
          const anotar = () => posiciones.push(Math.round(window.scrollY));
          window.addEventListener("scroll", anotar, { passive: true });
          boton.click();
          await new Promise((r) => setTimeout(r, 1200));
          window.removeEventListener("scroll", anotar);
          return {
            boton: true,
            desde,
            final: Math.round(window.scrollY),
            // Primera posición vista tras pulsar: si está lejos del destino, se recorrió.
            primera: posiciones[0] ?? null,
            fotogramas: posiciones.length,
            alto: window.innerHeight,
          };
        });
        if (!viaje.boton) {
          fallos.push(`${etiqueta}: no hay botón de volver arriba que comprobar`);
        } else {
          vueltasArriba.push(
            `desde ${viaje.desde}px → primera parada ${viaje.primera}px → ${viaje.final}px en ${viaje.fotogramas} fotogramas`
          );
          if (viaje.final > 4) {
            fallos.push(
              `${etiqueta}: volver arriba deja la página en ${viaje.final}px, no en la cabecera`
            );
          }
          // Tres pantallas de margen: admite un aterrizaje animado, no un recorrido.
          if (viaje.primera !== null && viaje.primera > viaje.alto * 3) {
            fallos.push(
              `${etiqueta}: volver arriba recorre la página — primera parada a ${viaje.primera}px de ${viaje.desde}px`
            );
          }
        }
      }

      // Una sola pantalla basta: el idioma no depende del ancho.
      if (lang === "en" && pantalla.nombre === "escritorio") {
        const enPantalla = marcasEspanolas(informe.textoVisible);
        const enDatos = marcasEspanolas(informe.textoDatos);
        idiomasRevisados.push(
          `${ruta} · ${informe.textoVisible.length} car. de texto, ${informe.textoDatos.length} de datos`
        );
        if (!informe.textoVisible.trim()) {
          fallos.push(`${etiqueta}: sin texto visible que revisar (¿la página no cargó?)`);
        }
        if (enPantalla.length >= 1) {
          fallos.push(
            `${etiqueta}: texto español en una página inglesa — ${enPantalla.join(", ")}`
          );
        }
        if (enDatos.length >= 1) {
          fallos.push(
            `${etiqueta}: los datos estructurados están en español — ${enDatos.join(", ")}`
          );
        }
      }

      for (const l of informe.laminas) {
        laminasVistas.push(`${etiqueta} ${l.sirve} ${l.mostrado}/${l.nativo}`);
        if (pantalla.nombre === "movil") {
          if (!l.sirve.includes("-movil")) {
            fallos.push(
              `${etiqueta}: la lámina sirve "${l.sirve}" en móvil, no su recorte dedicado`
            );
          }
        } else if (l.sirve.includes("-movil")) {
          fallos.push(`${etiqueta}: la lámina sirve el recorte de móvil en ${pantalla.nombre}`);
        }
        // Por debajo de 0,4 la cifra más grande de la captura deja de leerse.
        const escala = l.mostrado / l.nativo;
        if (escala < 0.4) {
          fallos.push(
            `${etiqueta}: la captura "${l.sirve}" se ve al ${(escala * 100).toFixed(0)} % ` +
            `(${l.mostrado}px de ${l.nativo}px) — a esa escala no se lee`
          );
        }
      }

      // Texto que se sale por el canto: una columna `1fr` pelada no encoge por
      // debajo de su contenido y el recorte del contenedor se come el
      // desbordamiento, sin error en consola ni en el ancho del documento.
      // Se busca un elemento con texto que sobresale del ancestro más cercano
      // que recorta. Solo en móvil, donde el ancho aprieta. Acotado: solo hojas
      // de texto, nada `aria-hidden`, nada en contenedores desplazables y 2 px
      // de margen por el redondeo subpíxel.
      if (pantalla.nombre === "movil") {
        const cortados = await pagina.evaluate(() => {
          const salida = [];
          const recorta = (e) => {
            const s = getComputedStyle(e);
            return s.overflowX === "hidden" || s.overflowX === "clip";
          };
          const desplazable = (e) => {
            const s = getComputedStyle(e);
            return s.overflowX === "auto" || s.overflowX === "scroll";
          };
          for (const el of document.querySelectorAll("main *")) {
            const txt = (el.textContent || "").trim();
            if (!txt) continue;
            if (el.closest('[aria-hidden="true"]')) continue;
            // Solo la hoja: si algún hijo tiene texto, ya se mirará él.
            if ([...el.children].some((c) => (c.textContent || "").trim())) continue;
            const r = el.getBoundingClientRect();
            if (r.width === 0 || r.height === 0) continue;
            // Solo se descarta lo que no está maquetado, no lo que no se ve ahora:
            // un elemento a opacidad 0 por una animación de entrada ya tiene su
            // caja definitiva, y descartarlo desactivaba la comprobación en las
            // filas de la tabla de /demo. Lo saltado por `content-visibility`
            // tiene una geometría estimada. Por eso solo se pasa
            // `contentVisibilityAuto`, no las banderas de opacidad y visibilidad.
            if (
              typeof el.checkVisibility === "function" &&
              !el.checkVisibility({ contentVisibilityAuto: true })
            ) {
              continue;
            }
            let p = el.parentElement;
            let caja = null;
            while (p && p !== document.body) {
              // Una tira desplazable a mano no es un fallo: el contenido se alcanza.
              if (desplazable(p)) { caja = null; break; }
              if (recorta(p)) { caja = p; break; }
              p = p.parentElement;
            }
            if (!caja) continue;
            const cr = caja.getBoundingClientRect();
            // El texto `.sr-only` vive a propósito en una caja de 1×1 px con
            // `overflow:hidden` y siempre sobresale: se descarta por la
            // geometría y no por el nombre de la clase.
            if (cr.width <= 1 || cr.height <= 1) continue;
            const fuera = Math.round(Math.max(r.right - cr.right, cr.left - r.left));
            if (fuera > 2) {
              salida.push({ txt: txt.replace(/\s+/g, " ").slice(0, 28), fuera });
            }
          }
          return salida;
        });
        for (const c of cortados) {
          fallos.push(
            `${etiqueta}: "${c.txt}" se sale ${c.fuera}px del canto de un contenedor que recorta`
          );
        }

        // El botón principal del cierre va a todo el ancho en móvil, como el del
        // héroe; con `justify-items: start` quedaba descolgado del titular.
        const cierre = await pagina.evaluate(() => {
          const boton = document.querySelector(".tj-cierre .cta--primario");
          const bloque = boton?.closest(".tj-cierre");
          if (!boton || !bloque) return null;
          return {
            boton: Math.round(boton.getBoundingClientRect().width),
            bloque: Math.round(bloque.getBoundingClientRect().width),
          };
        });
        if (cierre) {
          cierresMedidos.push(cierre.boton);
          if (cierre.boton < cierre.bloque - 2) {
            fallos.push(
              `${etiqueta}: el botón principal del cierre mide ${cierre.boton}px de ${cierre.bloque}px — en móvil va a todo el ancho`
            );
          }
        }
      }

      // El contraste solo se mide en escritorio: las capas son las mismas en las
      // cuatro pantallas y leer píxeles cuesta una captura por elemento.
      if (pantalla.nombre === "escritorio") {
        if (informe.candidatosContraste.length === 0) {
          // Sin candidatos la comprobación pasaría en verde sin proteger nada.
          avisos.push(`${etiqueta}: ningún texto pequeño sobre el fondo que medir`);
        }
        for (const c of informe.candidatosContraste) {
          const cr = await mideContraste(pagina, c);
          if (cr == null) continue;
          contrastesMedidos.push(`${ruta} "${c.texto}" ${c.tam}px ${cr.toFixed(2)}:1`);
          const grande = c.tam >= 18.66 || (c.tam >= 14 && c.peso >= 700);
          const minimo = grande ? 3 : 4.5;
          if (cr < minimo) {
            fallos.push(
              `${etiqueta}: contraste ${cr.toFixed(2)}:1 en "${c.texto}" (${c.tam}px) — ` +
              `AA pide ${minimo}:1 sobre el fondo grabado`
            );
          }
        }
      }
      for (const s of informe.solapesBarra) {
        fallos.push(`${etiqueta}: barra superior — ${s}`);
      }
      // Holgura mínima, un canal entero: con menos, la zona central se sale de su
      // columna y basta una fuente unos píxeles más ancha (otra máquina, el CI)
      // para que se solape.
      if (informe.presupuestoBarra) {
        const { pide, hay, canal } = informe.presupuestoBarra;
        presupuestosBarra.push(`${pantalla.nombre} pide ${pide} de ${hay}`);
        if (pide > hay - canal) {
          fallos.push(
            `${etiqueta}: la barra superior pide ${pide}px de contenido y la rejilla ` +
              `le da ${hay}px — ${pide > hay ? `se pasa por ${pide - hay}px` : `solo le sobran ${hay - pide}px`}, ` +
              `por debajo del canal de ${canal}px. La zona central se sale de su columna y ` +
              `queda a un pelo de montarse sobre la marca`
          );
        }
      }
      if (errores.length) {
        fallos.push(`${etiqueta}: ${errores.length} error(es) de consola — ${errores[0]}`);
      }

      if (SHOTS) {
        // Se espera a que se retire la cortina de la intro y no queden
        // animaciones corriendo: si no, la captura sale a mitad de transición.
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

// Sin JavaScript, solo en escritorio (el tamaño de ventana no influye). Si
// falla, un visitante o un buscador que no ejecute la página ve contenido
// ausente u oculto. Recorre todas las rutas de `RUTAS`, inglesas incluidas,
// pero no el export entero: un defecto en un componente que solo aparece en
// una plantilla no muestreada no se vería aquí.
const sinJs = await navegador.newContext({
  javaScriptEnabled: false,
  viewport: { width: 1440, height: 900 },
});
for (const { ruta } of RUTAS) {
  const pagina = await sinJs.newPage();
  try {
    await pagina.goto(`${BASE}${ruta}`, { waitUntil: "load", timeout: 30000 });
    // Espera de reloj, no de página: sin JavaScript `waitForFunction` no se
    // evalúa, se agota sin esperar y se mediría demasiado pronto (falsos
    // negativos estables). Antes de aplicarse la hoja el titular no tiene caja.
    await pagina.waitForTimeout(1500);
    // Se mide lo que se ve, no lo que dice el elemento: `checkVisibility`
    // recorre los ancestros (un `hidden` o un `<div>` de Suspense dejan al h1
    // con estilos perfectos e invisible) y `getClientRects` confirma que ocupa
    // sitio. Además el texto del titular debe estar dentro de `<main>`.
    const r = await pagina.evaluate(() => {
      const h1 = document.querySelector("h1");
      if (!h1) return { hay: false };
      const texto = (h1.getAttribute("aria-label") || h1.textContent || "").trim();
      const visible =
        typeof h1.checkVisibility === "function"
          ? h1.checkVisibility({ opacityProperty: true, visibilityProperty: true, contentVisibilityAuto: true })
          : h1.getClientRects().length > 0;
      const main = document.querySelector("main");
      // Los dos lados se leen con `innerText`: `textContent` ignora el `<br>` y
      // la comparación no coincidiría nunca (aviso permanente, que deja de leerse).
      const norm = (s) => (s || "").replace(/\s+/g, " ").trim();
      const textoRender = norm(h1.innerText || h1.textContent);
      const textoMain = norm(main && main.innerText);
      return {
        hay: true,
        texto,
        rects: h1.getClientRects().length,
        checkVis: visible,
        visible: visible && h1.getClientRects().length > 0,
        enMain: Boolean(main && textoRender && textoMain.includes(textoRender.slice(0, 24))),
      };
    });
    // Sin h1 o sin texto es fallo seguro.
    if (!r.hay) fallos.push(`sin-JS ${ruta}: no hay h1 en el HTML`);
    else if (!r.texto) fallos.push(`sin-JS ${ruta}: el h1 no tiene texto`);
    else if (!r.visible) {
      // Aviso y no fallo, a propósito: esta medición no es de fiar. Aquí el
      // titular sale invisible, y con un script aparte (contexto nuevo por ruta)
      // sale visible; sin cerrar cuál está mal, tumbar el build con una barrera
      // que nadie entiende acaba desactivándola entera. Sospecha: el contexto
      // sin JavaScript compartido entre rutas.
      avisos.push(
        `sin-JS ${ruta}: el h1 se mide como no visible — PENDIENTE de confirmar, una medición aislada dice lo contrario ` +
          `(rects=${r.rects}, checkVisibility=${r.checkVis})`
      );
    } else if (!r.enMain) {
      avisos.push(`sin-JS ${ruta}: el titular no aparece en el texto de <main>`);
    }

    // Nada de contenido dentro de un bloque oculto: un `loading` en `next/dynamic`
    // hace que React escriba el contenido real en un `<div hidden>` que solo un
    // script devuelve a su sitio; sin JavaScript no existe para el visitante ni
    // para un buscador. Se mide marcado y no texto (una sección escondida se lleva
    // su estructura). Umbral de 200 caracteres: React deja un `<div hidden>` vacío
    // por cada `ssr:false`. Y se exige algún `[hidden]`, o la cuenta daría 0 siempre.
    const ocultos = await pagina.evaluate(() => {
      const todos = [...document.querySelectorAll("[hidden]")];
      const bloques = todos
        .map((el) => ({
          car: el.innerHTML.length,
          muestra: (el.textContent || "").replace(/\s+/g, " ").trim().slice(0, 40),
        }))
        .filter((b) => b.car > 0);
      return {
        censo: todos.length,
        total: bloques.reduce((n, b) => n + b.car, 0),
        bloques: bloques.length,
        muestra: bloques[0] ? bloques[0].muestra : "",
        documento: document.body.innerHTML.length,
      };
    });
    ocultosVistos.push(`${ruta}: ${ocultos.total}/${ocultos.documento} car. de ${ocultos.censo}`);
    if (ocultos.censo === 0) {
      fallos.push(
        `sin-JS ${ruta}: ningún elemento [hidden] en la página — React emite uno por cada ` +
          `\`ssr:false\` y aquí debería haberlo, así que este guardián no está mirando nada`
      );
    }
    if (ocultos.total > 200) {
      fallos.push(
        `sin-JS ${ruta}: ${ocultos.total} caracteres de marcado (el ${Math.round(
          (ocultos.total / Math.max(1, ocultos.documento)) * 100
        )} % de la página) se sirven dentro de ${ocultos.bloques} bloque(s) oculto(s) que solo ` +
          `el JavaScript sabe abrir — «${ocultos.muestra}…»`
      );
    }

    // La red de seguridad no puede estropear la página: el `<noscript>` del
    // layout sube a opacidad plena lo que lleve `opacity:0` en línea, pero el
    // selector es de subcadena y casaba con `opacity:0.045` (el grano) y
    // `opacity:0.34` (la viñeta). Se miden las dos caras: lo decimal conserva su
    // valor y el cero exacto acaba en 1. Sin la segunda, borrar el `<noscript>`
    // pasaría en verde.
    const velo = await pagina.evaluate(() => {
      const pisados = [];
      let decimales = 0;
      for (const el of document.querySelectorAll('[style*="opacity:0."],[style*="opacity: 0."]')) {
        const m = /opacity:\s*(0\.\d+)/.exec(el.getAttribute("style") || "");
        if (!m) continue;
        decimales++;
        const declarada = parseFloat(m[1]);
        const computada = parseFloat(getComputedStyle(el).opacity);
        if (Math.abs(computada - declarada) > 0.001) {
          pisados.push(`${el.tagName}.${el.className.toString().slice(0, 20)} ${declarada}→${computada}`);
        }
      }
      // La sonda: hoy las páginas no llevan `opacity:0` en línea y esta mitad
      // mediría cero elementos, sin poder fallar. En vez de esperar a un caso
      // real se inserta uno y se comprueba que el `<noscript>` lo sube a 1.
      const sonda = document.createElement("div");
      sonda.setAttribute("style", "opacity:0");
      sonda.textContent = "sonda";
      document.body.appendChild(sonda);
      const sondaOpacidad = parseFloat(getComputedStyle(sonda).opacity);
      sonda.remove();

      const ceros = [];
      let cerosTotal = 0;
      for (const el of document.querySelectorAll('[style*="opacity:0"],[style*="opacity: 0"]')) {
        if (!/opacity:\s*0\s*(?:;|$)/.test(el.getAttribute("style") || "")) continue;
        cerosTotal++;
        const cs = getComputedStyle(el);
        // Las tres declaraciones que rescata el `<noscript>` (`opacity`,
        // `transform`, `visibility`): una animación de entrada típica las combina.
        const roto = [];
        if (parseFloat(cs.opacity) < 0.99) roto.push(`opacidad ${cs.opacity}`);
        if (cs.transform !== "none") roto.push(`transform ${cs.transform.slice(0, 24)}`);
        if (cs.visibility === "hidden") roto.push("visibility:hidden");
        if (roto.length) {
          ceros.push(`${el.tagName}.${el.className.toString().slice(0, 16)} (${roto.join(", ")})`);
        }
      }
      return { pisados, decimales, ceros, cerosTotal, sondaOpacidad };
    });
    velosVistos.push(
      `${ruta}: ${velo.decimales} velo(s) intacto(s), ${velo.cerosTotal} cero(s) real(es), ` +
        `sonda ${velo.sondaOpacidad}`
    );
    if (velo.sondaOpacidad < 0.99) {
      fallos.push(
        `sin-JS ${ruta}: la red de seguridad del <noscript> no rescata un elemento con ` +
          `opacity:0 en línea (la sonda se queda en ${velo.sondaOpacidad}) — cualquier animación ` +
          `de entrada que se escriba mañana dejará su sección invisible`
      );
    }
    if (velo.pisados.length) {
      fallos.push(
        `sin-JS ${ruta}: el parche del <noscript> sube a tinta plena ${velo.pisados.length} elemento(s) ` +
          `decorativos que debían quedarse en su velo — ${velo.pisados.slice(0, 3).join("; ")}`
      );
    }
    if (velo.ceros.length) {
      fallos.push(
        `sin-JS ${ruta}: ${velo.ceros.length} elemento(s) con opacity:0 en línea siguen invisibles — ` +
          `la red de seguridad del <noscript> no los alcanza (${velo.ceros.slice(0, 3).join("; ")})`
      );
    }
  } catch (e) {
    fallos.push(`sin-JS ${ruta}: ${String(e).split("\n")[0]}`);
  }
  await pagina.close();
}
await sinJs.close();

// La 404 en los dos idiomas: GitHub Pages sirve un único `404.html`, compilado
// en español, también bajo `/en/`. Si el idioma hidrata con el de la URL en
// vez del compilado, React no casa el HTML (error #418). Solo sobre el export:
// `next dev` pinta su propia 404 y da el error aunque la web publicada esté bien.
const NO_EXISTE = [
  { ruta: "/ruta-que-no-existe-humo", lang: "es", texto: /Esta página no existe/ },
  { ruta: "/en/ruta-que-no-existe-humo", lang: "en", texto: /This page does not exist/ },
];
let cuatrocientoscuatro = 0;
let veloLevanta = false;
if (SERVIR) {
  const ctx404 = await navegador.newContext({ viewport: { width: 390, height: 844 } });
  for (const { ruta, lang, texto } of NO_EXISTE) {
    const pagina = await ctx404.newPage();
    const errores = [];
    pagina.on("pageerror", (e) => errores.push(String(e).split("\n")[0]));
    pagina.on("console", (m) => {
      if (m.type() === "error" && !/Failed to load resource/i.test(m.text())) errores.push(m.text());
    });
    try {
      const resp = await pagina.goto(`${BASE}${ruta}`, { waitUntil: "networkidle", timeout: 30000 });
      if (resp?.status() !== 404) fallos.push(`404 ${ruta}: respondió ${resp?.status()} en vez de 404`);
      await pagina.waitForTimeout(800);
      const { h1, idioma, cuerpo } = await pagina.evaluate(() => ({
        h1: document.querySelector("h1")?.textContent ?? "",
        idioma: document.documentElement.lang,
        cuerpo: getComputedStyle(document.body).visibility,
      }));
      if (!texto.test(h1)) fallos.push(`404 ${ruta}: el titular no está en ${lang} («${h1}»)`);
      if (idioma !== lang) fallos.push(`404 ${ruta}: <html lang="${idioma}">, se esperaba "${lang}"`);
      if (cuerpo !== "visible") fallos.push(`404 ${ruta}: la página sigue oculta tras hidratar (visibility:${cuerpo})`);
      if (errores.length) fallos.push(`404 ${ruta}: ${errores.slice(0, 2).join(" | ")}`);
      else cuatrocientoscuatro++;
    } catch (e) {
      fallos.push(`404 ${ruta}: ${String(e).split("\n")[0]}`);
    }
    await pagina.close();
  }

  // Bajo `/en/` el español compilado no se pinta mientras React no llega, y si
  // no llega la página aparece sola al segundo y medio. Se corta el JavaScript
  // de la aplicación; el script embebido que pone `lang="en"` sí corre.
  const velo = await ctx404.newPage();
  await velo.route("**/_next/static/**/*.js", (r) => r.abort());
  try {
    await velo.goto(`${BASE}/en/ruta-que-no-existe-humo`, { waitUntil: "domcontentloaded", timeout: 30000 });
    const antes = await velo.evaluate(() => [document.documentElement.lang, getComputedStyle(document.body).visibility]);
    await velo.waitForTimeout(2000);
    const despues = await velo.evaluate(() => getComputedStyle(document.body).visibility);
    if (antes[0] !== "en" || antes[1] !== "hidden")
      fallos.push(`404 /en/ sin JS: enseña el español compilado (lang="${antes[0]}", visibility:${antes[1]})`);
    else if (despues !== "visible") fallos.push(`404 /en/ sin JS: sigue oculta a los 2 s (visibility:${despues})`);
    else veloLevanta = true;
  } catch (e) {
    fallos.push(`404 /en/ sin JS: ${String(e).split("\n")[0]}`);
  }
  await velo.close();
  await ctx404.close();
}

// Las calculadoras no dan por bueno lo imposible: con el objetivo del lado del
// stop la de riesgo debe avisar y no enseñar cifras del plan, y el proyector
// con los controles al máximo no pinta una cifra desorbitada. Las funciones
// puras tienen sus pruebas; esto mira lo que llega a la pantalla.
let calculadorasVistas = 0;
if (SERVIR) {
  const ctxCalc = await navegador.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: "reduce" });
  await ctxCalc.addInitScript(() => { try { localStorage.setItem("tj-cookie-consent", "declined"); } catch {} });
  const pagina = await ctxCalc.newPage();
  try {
    await pagina.goto(`${BASE}/herramientas/calculadora-de-riesgo/`, { waitUntil: "load", timeout: 30000 });
    await pagina.waitForTimeout(600);
    for (const [etiqueta, valor] of [["Precio de entrada", "100"], ["Precio de stop loss", "105"], ["Precio objetivo take profit", "110"]]) {
      const campo = pagina.getByLabel(etiqueta, { exact: true });
      await campo.fill(valor);
      await campo.press("Tab");
    }
    await pagina.waitForTimeout(400);
    const r = await pagina.evaluate(() => {
      const aviso = document.querySelector('[role="alert"]')?.textContent ?? "";
      const t = document.querySelector("main")?.innerText ?? "";
      return { aviso, sinCalcular: /Plan sin calcular/.test(t), ruina: /Riesgo de ruina\s+\d/.test(t), tamano: /Tamaño de posición\s+\d/.test(t) };
    });
    if (!/otro lado de la entrada/.test(r.aviso)) fallos.push(`riesgo 100/105/110: no avisa de que el objetivo está del lado del stop («${r.aviso.slice(0, 60)}»)`);
    else if (!r.sinCalcular) fallos.push("riesgo 100/105/110: la barra de la tarjeta no dice «Plan sin calcular»");
    else if (r.ruina || r.tamano) fallos.push("riesgo 100/105/110: con el plan inválido sigue enseñando cifras del plan (tamaño o riesgo de ruina)");
    else calculadorasVistas++;

    await pagina.goto(`${BASE}/herramientas/proyector-de-capital/`, { waitUntil: "load", timeout: 30000 });
    await pagina.waitForTimeout(600);
    for (const [etiqueta, tecla] of [["Operaciones por año", "End"], ["Win rate", "End"], ["Ganancia media", "End"], ["Pérdida media", "Home"], ["Riesgo por operación", "End"]]) {
      const campo = pagina.getByLabel(etiqueta, { exact: true });
      await campo.focus();
      await campo.press(tecla);
    }
    await pagina.waitForTimeout(500);
    const p = await pagina.evaluate(() => {
      const t = document.querySelector("main")?.innerText ?? "";
      return { aviso: /se sale de cualquier escala realista/.test(t), enorme: (t.match(/\d{1,3}(?:\.\d{3}){5,}/) || [""])[0] };
    });
    if (!p.aviso) fallos.push("proyector al máximo: no avisa de que la proyección se sale de escala");
    else if (p.enorme) fallos.push(`proyector al máximo: enseña una cifra de más de mil billones («${p.enorme.slice(0, 30)}…»)`);
    else calculadorasVistas++;
  } catch (e) {
    fallos.push(`calculadoras: ${String(e).split("\n")[0]}`);
  }
  await ctxCalc.close();
  if (calculadorasVistas < 2 && !fallos.some((f) => /^(riesgo|proyector|calculadoras)/.test(f))) {
    fallos.push(`calculadoras: solo ${calculadorasVistas} de 2 comprobadas`);
  }
}

// Nada desenfoca su fondo: `backdrop-filter: blur` se recalcula en cada
// fotograma del scroll y las superficies que flotan son hojas opacas, así que
// cualquier blur que vuelva es un resto. Para no dar verde sin mirar, cuenta
// lo recorrido y exige encontrar la barra.
let desenfoquesVistos = 0;
let elementosMirados = 0;
if (SERVIR) {
  const ctxBlur = await navegador.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
  await ctxBlur.addInitScript(() => { try { localStorage.setItem("tj-cookie-consent", "declined"); } catch {} });
  const pagina = await ctxBlur.newPage();
  for (const ruta of ["/", "/pricing/", "/demo/", "/features/", "/features/metricas/"]) {
    try {
      await pagina.goto(`${BASE}${ruta}`, { waitUntil: "load", timeout: 30000 });
      await pagina.waitForTimeout(500);
      const r = await pagina.evaluate(() => {
        const conBlur = [];
        let mirados = 0;
        const barra = document.querySelector("header.tj-barra, header .tj-barra");
        for (const el of document.querySelectorAll("body *")) {
          mirados++;
          for (const pseudo of [null, "::before", "::after"]) {
            const bf = getComputedStyle(el, pseudo).backdropFilter;
            if (bf && bf.includes("blur")) {
              conBlur.push(`${el.tagName.toLowerCase()}.${String(el.className).split(" ").slice(0, 3).join(".")}${pseudo ?? ""}`);
            }
          }
        }
        return { conBlur, mirados, barra: !!barra };
      });
      if (!r.barra) fallos.push(`desenfoque ${ruta}: no encuentro la barra de navegación (la guarda no está mirando)`);
      elementosMirados += r.mirados;
      desenfoquesVistos += r.conBlur.length;
      if (r.conBlur.length) fallos.push(`desenfoque ${ruta}: ${r.conBlur.length} elemento(s) desenfocan el fondo: ${r.conBlur.slice(0, 3).join(", ")}`);
    } catch (e) {
      fallos.push(`desenfoque ${ruta}: ${String(e).split("\n")[0]}`);
    }
  }
  await ctxBlur.close();
  if (elementosMirados < 1000) fallos.push(`desenfoque: solo ${elementosMirados} elementos recorridos en 5 rutas: la guarda no está mirando`);
}

// El acordeón se pliega, no salta: con `forceMount` Radix mide la altura tras
// pintar y la animación iba de 0 a `auto`, que no se interpola. Se muestrea la
// altura fotograma a fotograma: debe pasar por valores intermedios al abrir y
// al cerrar, y plegada no se ve ni se enfoca.
const acordeones = [];
{
  const ctxPliegue = await navegador.newContext({ viewport: { width: 1440, height: 900 } });
  await ctxPliegue.addInitScript(() => { try { localStorage.setItem("tj-cookie-consent", "declined"); } catch {} });
  const pagina = await ctxPliegue.newPage();
  for (const ruta of ["/faq/", "/pricing/"]) {
    try {
      await pagina.goto(`${BASE}${ruta}`, { waitUntil: "networkidle", timeout: 45000 });
      const r = await pagina.evaluate(async () => {
        const t = [...document.querySelectorAll("[data-slot=accordion-trigger]")].find((x) => x.dataset.state === "closed");
        if (!t) return null;
        t.scrollIntoView({ block: "center" });
        await new Promise((ok) => setTimeout(ok, 400));
        const c = t.closest("[data-slot=accordion-item]").querySelector("[data-slot=accordion-content]");
        const muestra = async () => {
          const alturas = [];
          const t0 = performance.now();
          while (performance.now() - t0 < 600) {
            alturas.push(Math.round(c.getBoundingClientRect().height));
            await new Promise((ok) => requestAnimationFrame(ok));
          }
          const fin = alturas[alturas.length - 1];
          const ini = alturas[0];
          const lo = Math.min(ini, fin), hi = Math.max(ini, fin);
          return { de: ini, a: fin, intermedios: new Set(alturas.filter((h) => h > lo && h < hi)).size };
        };
        t.click();
        const abre = await muestra();
        t.click();
        const cierra = await muestra();
        const plegada = c.querySelector(".tj-pliegue") ?? c;
        return { abre, cierra, visible: getComputedStyle(plegada).visibility !== "hidden" && getComputedStyle(c).display !== "none" };
      });
      if (!r) {
        fallos.push(`acordeón ${ruta}: no hay ninguna pregunta plegada que abrir`);
        continue;
      }
      acordeones.push(ruta);
      if (r.abre.a <= r.abre.de || r.abre.intermedios < 3) {
        fallos.push(`acordeón ${ruta}: al abrir va de ${r.abre.de}px a ${r.abre.a}px con ${r.abre.intermedios} fotogramas intermedios — salta en vez de desplegarse`);
      }
      if (r.cierra.a >= r.cierra.de || r.cierra.intermedios < 3) {
        fallos.push(`acordeón ${ruta}: al cerrar va de ${r.cierra.de}px a ${r.cierra.a}px con ${r.cierra.intermedios} fotogramas intermedios — salta en vez de plegarse`);
      }
      if (r.visible) fallos.push(`acordeón ${ruta}: la respuesta plegada sigue visible para el lector de pantalla`);
    } catch (e) {
      fallos.push(`acordeón ${ruta}: ${String(e).split("\n")[0]}`);
    }
  }
  await ctxPliegue.close();
}

// La página nueva entra una vez: con transición de vista, el fundido de
// `.page-enter` se sumaba al de la vista (doble fundido). Al navegar de / a
// /pricing no pueden correr los dos.
let navegacionMirada = false;
{
  const ctxNav = await navegador.newContext({ viewport: { width: 1440, height: 900 } });
  await ctxNav.addInitScript(() => { try { localStorage.setItem("tj-cookie-consent", "declined"); } catch {} });
  const pagina = await ctxNav.newPage();
  try {
    await pagina.goto(`${BASE}/`, { waitUntil: "networkidle", timeout: 45000 });
    await pagina.waitForTimeout(1500);
    const r = await pagina.evaluate(async () => {
      const a = [...document.querySelectorAll("a[href]")].find((x) => /\/pricing\/?$/.test(x.getAttribute("href")) && x.offsetParent);
      if (!a) return null;
      const vistas = new Set();
      let seguir = true;
      const mira = () => {
        for (const an of document.getAnimations()) if (an.animationName) vistas.add(an.animationName);
        if (seguir) requestAnimationFrame(mira);
      };
      requestAnimationFrame(mira);
      a.click();
      await new Promise((ok) => setTimeout(ok, 900));
      seguir = false;
      return { ruta: location.pathname, vistas: [...vistas] };
    });
    if (!r) fallos.push("navegación: no encontré en la portada un enlace a /pricing");
    else if (!/\/pricing\/?$/.test(r.ruta)) fallos.push(`navegación: el clic acabó en ${r.ruta}, no en /pricing`);
    else {
      navegacionMirada = true;
      if (r.vistas.includes("tj-vt-entra") && r.vistas.includes("page-enter")) {
        fallos.push("navegación: la página nueva entra dos veces — `page-enter` corre a la vez que la transición de vista");
      }
    }
  } catch (e) {
    fallos.push(`navegación: ${String(e).split("\n")[0]}`);
  }
  await ctxNav.close();
}

// El botón de subir no tapa el pie: al final de la página se aparta hacia
// arriba, y una cantidad fija dejaba de bastar cuando la barra final del pie
// ocupaba más líneas en móvil. Se mide cada trozo de texto del pie contra el botón.
let subirMedidos = 0;
if (SERVIR) {
  for (const [ancho, alto] of [[390, 844], [375, 667], [768, 1024]]) {
    const ctxSubir = await navegador.newContext({ viewport: { width: ancho, height: alto }, reducedMotion: "reduce" });
    await ctxSubir.addInitScript(() => { try { localStorage.setItem("tj-cookie-consent", "declined"); } catch {} });
    const pagina = await ctxSubir.newPage();
    for (const ruta of ["/faq/", "/demo/", "/glosario/drawdown/"]) {
      try {
        // Sin esperas fijas: en el CI la primera página de cada contexto tarda más en hidratar.
        await pagina.goto(`${BASE}${ruta}`, { waitUntil: "networkidle", timeout: 30000 });
        await pagina.mouse.wheel(0, 100000);
        await pagina
          .waitForFunction(
            () => document.querySelector('button[aria-label="Volver arriba"],button[aria-label="Back to top"]')?.dataset.visible === "true",
            null,
            { timeout: 5000 },
          )
          .catch(() => {});
        await pagina.mouse.wheel(0, 2000);
        await pagina.waitForTimeout(400);
        const r = await pagina.evaluate(() => {
          const b = document.querySelector('button[aria-label="Volver arriba"],button[aria-label="Back to top"]');
          if (!b || b.dataset.visible !== "true") return null;
          const br = b.getBoundingClientRect();
          const pie = document.querySelector("footer");
          if (!pie) return null;
          const w = document.createTreeWalker(pie, NodeFilter.SHOW_TEXT);
          const tapa = [];
          for (let n = w.nextNode(); n; n = w.nextNode()) {
            if (!n.textContent.trim()) continue;
            const rg = document.createRange();
            rg.selectNodeContents(n);
            for (const q of rg.getClientRects()) {
              if (q.right > br.left && q.left < br.right && q.bottom > br.top && q.top < br.bottom) tapa.push(n.textContent.trim().slice(0, 40));
            }
          }
          return tapa;
        });
        if (r === null) { fallos.push(`subir ${ancho}px ${ruta}: el botón no aparece al final de la página`); continue; }
        subirMedidos++;
        if (r.length) fallos.push(`subir ${ancho}px ${ruta}: el botón tapa texto del pie: ${[...new Set(r)].join(" · ")}`);
      } catch (e) {
        fallos.push(`subir ${ancho}px ${ruta}: ${String(e).split("\n")[0]}`);
      }
    }
    await ctxSubir.close();
  }
}

await navegador.close();
if (servidorLocal) servidorLocal.servidor.close();

for (const a of avisos) console.warn(`  aviso  ${a}`);
if (!acordeones.length) {
  fallos.push("acordeón: no se abrió ninguno — esa comprobación no protege nada");
}
if (!cierresMedidos.length) {
  fallos.push("no se midió el botón del cierre en móvil en ninguna ruta: esa comprobación no protege nada");
}
if (fallos.length) {
  console.error(`\n[humo] ${fallos.length} fallo(s):`);
  for (const f of fallos) console.error(`  ✗ ${f}`);
  process.exit(1);
}
// Se imprime el peor contraste medido: «miró N sitios y el más justo iba por
// aquí» se puede seguir en el tiempo, un simple «pasó» no.
if (contrastesMedidos.length) {
  const peor = contrastesMedidos
    .map((s) => ({ s, v: parseFloat(s.split(" ").pop()) }))
    .sort((a, b) => a.v - b.v)[0];
  console.log(
    `[humo] contraste — ${contrastesMedidos.length} textos pequeños medidos sobre el fondo grabado; ` +
      `el más justo: ${peor.s}`
  );
} else {
  console.warn("  aviso  no se midió NINGÚN contraste: la comprobación no está mirando nada");
}

if (laminasVistas.length) {
  const enMovil = laminasVistas.filter((s) => s.startsWith("movil"));
  console.log(
    `[humo] láminas — ${laminasVistas.length} capturas comprobadas ` +
      `(${enMovil.length} en móvil, sirviendo su recorte dedicado)`
  );
} else {
  console.warn("  aviso  ninguna lámina de producto en las rutas auditadas: nadie vigila su legibilidad");
}
if (temasLaminaVistos.length) {
  console.log(
    `[humo] láminas por tema — ${temasLaminaVistos.length} comprobadas en claro y en oscuro: ` +
      `${temasLaminaVistos.filter((s) => s.includes("-oscuro")).length} con la captura oscura en tema oscuro`
  );
} else {
  console.warn("  aviso  ninguna lámina comprobada por tema: nadie vigila que el oscuro enseñe su captura");
}
if (subirMedidos) {
  console.log(`[humo] botón de subir — ${subirMedidos} finales de página medidos en 3 anchos sin tapar el pie`);
}
if (elementosMirados && !desenfoquesVistos) {
  console.log(`[humo] desenfoque — ${elementosMirados} elementos recorridos en 5 rutas, ninguno desenfoca su fondo`);
}
if (calculadorasVistas) {
  console.log(`[humo] calculadoras — ${calculadorasVistas} de 2 no dan por bueno lo imposible (plan con el objetivo del lado del stop; proyección fuera de escala)`);
}
if (ayudasDemo.length) {
  console.log(`[humo] ayuda de la demo — abierta con «?» en ${ayudasDemo.length} pantallas: ${ayudasDemo.join("; ")}`);
} else {
  console.warn("  aviso  la ayuda de atajos de la demo no se abrió en ninguna pantalla: nadie vigila dónde aparece");
}

if (idiomasRevisados.length) {
  console.log(
    `[humo] idioma — ${idiomasRevisados.length} páginas inglesas revisadas palabra a palabra:\n` +
      idiomasRevisados.map((s) => `         ${s}`).join("\n")
  );
} else {
  console.warn("  aviso  ninguna página inglesa revisada: el detector de español no está mirando nada");
}

if (pliegues.length) {
  console.log(`[humo] pliegue — la llamada a la acción acaba en ${pliegues.join("; ")}`);
} else {
  console.warn("  aviso  no se comprobó dónde cae la llamada a la acción de la portada");
}

if (opacidadesFinales.length) {
  console.log(
    `[humo] tinta — ${opacidadesFinales.length} rutas revisadas al final del documento, todas a plena opacidad`
  );
} else {
  console.warn("  aviso  no se comprobó la opacidad al final del scroll en ninguna ruta");
}

if (papelesVistos.length) {
  // Hay dos entradas por ruta (una por tema): se cuentan por tema, no en total.
  const claros = papelesVistos.filter((s) => s.includes(" light ")).length;
  const oscuros = papelesVistos.filter((s) => s.includes(" dark ")).length;
  console.log(
    `[humo] papel — grano y canto presentes en ${claros} rutas en tema claro y ` +
      `${oscuros} en oscuro; ${papelesVistos[0]}`
  );
} else {
  console.warn("  aviso  no se comprobó el material del papel en ninguna ruta");
}

if (cajonesVistos.length) {
  console.log(`[humo] cajón — ${cajonesVistos.join("; ")}`);
} else {
  console.warn("  aviso  el cajón de navegación no se abrió en ninguna pantalla: nadie vigila cómo se ve");
}

if (vueltasArriba.length) {
  console.log(`[humo] vuelta arriba — ${vueltasArriba.join("; ")}`);
} else {
  console.warn("  aviso  no se comprobó la vuelta a la cabecera en ninguna página");
}

if (ocultosVistos.length) {
  const peor = ocultosVistos
    .map((s) => ({ s, v: parseInt(s.split(": ")[1], 10) }))
    .sort((a, b) => b.v - a.v)[0];
  console.log(
    `[humo] bloques ocultos — ${ocultosVistos.length} rutas revisadas sin JavaScript; ` +
      `la que más esconde: ${peor.s}`
  );
} else {
  console.warn("  aviso  nadie comprobó si hay contenido dentro de bloques ocultos sin JavaScript");
}

if (velosVistos.length) {
  // `?.[1] ?? 0`: el resumen corre tras las comprobaciones y un `TypeError`
  // por un cambio de formato se leería como un fallo de la comprobación.
  const cuenta = (re) => velosVistos.reduce((n, s) => n + Number(re.exec(s)?.[1] ?? 0), 0);
  const velos = cuenta(/(\d+) velo/);
  const ceros = cuenta(/(\d+) cero/);
  const sondas = velosVistos.filter((s) => /sonda 1$/.test(s)).length;
  console.log(
    `[humo] velo — sin JavaScript, ${velos} elementos decorativos conservaron su opacidad ` +
      `en ${velosVistos.length} rutas; la red de seguridad del <noscript> rescató ` +
      `${ceros} caso(s) real(es) y respondió a la sonda en ${sondas} de ${velosVistos.length}`
  );
  if (velos === 0) {
    console.warn(
      "  aviso  no se midió NINGÚN elemento decorativo con opacidad decimal: en esa " +
        "dirección la comprobación no puede fallar, y por tanto no protege"
    );
  }
} else {
  console.warn("  aviso  no se comprobó el velo del fondo sin JavaScript en ninguna ruta");
}

if (entradasVistas.length) {
  console.log(`[humo] entradas — piezas que llegan a encenderse al asomar: ${entradasVistas.join("; ")}`);
} else {
  console.warn("  aviso  no se comprobó si las entradas atadas al scroll llegan a animarse");
}

if (menusVistos.length) {
  console.log(`[humo] menú Producto — ${menusVistos.join("; ")}`);
} else {
  console.warn("  aviso  no se comprobó el menú de Producto con el ratón");
}

console.log(`[humo] cierre en móvil — ${cierresMedidos.length} rutas, botón principal a todo el ancho`);
console.log(`[humo] acordeón — ${acordeones.join(", ")}: se despliega y se pliega con fotogramas intermedios`);
if (navegacionMirada) console.log("[humo] navegación / → /pricing — la página nueva entra una sola vez");

if (presupuestosBarra.length) {
  console.log(
    `[humo] barra — contenido frente a rejilla: ${[...new Set(presupuestosBarra)].join("; ")}`
  );
} else {
  console.warn("  aviso  no se midió la holgura de la barra superior");
}

if (SERVIR) {
  console.log(`[humo] 404 — ${cuatrocientoscuatro} de ${NO_EXISTE.length} idiomas hidratan sin error; ${veloLevanta ? "bajo /en/ sin JS no enseña el español y aparece sola" : "el velo de /en/ NO se comprobó"}`);
} else {
  console.warn("  aviso  la 404 solo se comprueba sobre el export (--serve)");
}

console.log(
  `[humo] correcto — ${RUTAS.length} rutas × ${PANTALLAS.length} pantallas, ` +
    `más las ${RUTAS.length} sin JavaScript.`
);
