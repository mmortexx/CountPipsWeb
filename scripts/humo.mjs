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
/** Carpeta estática a servir. Con esto la comprobación no necesita nada
 *  fuera del proyecto: ni `serve`, ni `wait-on`, ni un servidor aparte. */
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
 * Servidor estático mínimo para el export.
 *
 * Traduce `/features` y `/features/` a `features/index.html`, que es
 * como Next deja las páginas con `trailingSlash: true`. Sin esa
 * traducción, todas las rutas darían 404 y la comprobación fallaría por
 * el motivo equivocado.
 */
/* ── EL PREFIJO DE GITHUB PAGES ──────────────────────────────────────
   El sitio no se publica en la raíz de un dominio sino en
   `usuario.github.io/CountPipsWeb/`, así que el flujo de Actions
   construye con `NEXT_PUBLIC_BASE_PATH=/CountPipsWeb` y el HTML sale
   pidiendo `/CountPipsWeb/_next/...`. Este servidor servía la carpeta en
   la raíz, de modo que en CI TODAS esas peticiones daban 404: sin hoja
   de estilos la barra se monta sobre sí misma, el contenido desborda a
   lo ancho y el cajón no abre. Cuarenta y tantos fallos que no eran de
   la página sino de cómo se la estaba sirviendo — y la comprobación que
   existe para no desplegar roto era justo la que impedía desplegar.

   Se neutraliza el prefijo: si la petición empieza por él, se atiende
   igual. En local `NEXT_PUBLIC_BASE_PATH` no está definido y esto no
   hace nada, así que las dos formas de ejecutarlo coinciden. */
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
  /* Las tres de abajo entraron con la comprobación de idioma: la lista
     tenía cuatro rutas inglesas de las diez que existen, y las que
     faltaban eran justo donde vivía el problema — `/en/demo` enseñaba
     «Ruptura», «Reversión» y «Tendencia» en la tabla de operaciones, en
     el diario y en el detalle de cada una. Una comprobación de idioma que
     no visita la página del idioma no comprueba nada. */
  { ruta: "/en/demo", lang: "en" },
  { ruta: "/en/about", lang: "en" },
  { ruta: "/en/faq", lang: "en" },
];

/**
 * Palabras que sólo pueden estar en una página española.
 *
 * ── Por qué palabras función y no un diccionario ──────────────────────
 * Buscar sustantivos («operación», «ganancia») caza el texto traducido a
 * medias pero se le escapa el que nunca se tradujo, y encima falla con
 * los términos que en trading se dicen igual en los dos idiomas. Las
 * palabras de abajo —artículos, preposiciones, conjunciones— aparecen en
 * cualquier frase española de más de tres palabras y en ninguna inglesa,
 * así que detectan la frase entera sin depender de su tema.
 *
 * ── Ninguna palabra de dos letras ─────────────────────────────────────
 * La lista llevaba «el», «la», «un», «es», «su», «tu». Todas se fueron:
 * la comparación tiene que ser insensible a mayúsculas —hay rótulos con
 * `text-transform: uppercase`, y ahí es donde apareció el lema del
 * cargador en español— y en mayúsculas una palabra de dos letras es
 * indistinguible de una sigla. El pie dice «ES + EN» para anunciar los
 * dos idiomas, y ese «ES» contaba como la palabra «es» en las diez
 * páginas inglesas: una marca falsa, permanente y en todas, que es el
 * tipo de ruido por el que una comprobación acaba apagada.
 *
 * Basta UNA para dar el fallo. Ninguna de las que quedan existe en
 * inglés ni es un símbolo del mercado, así que su presencia no admite
 * segunda lectura — y exigir dos dejaba pasar frases cortas como
 * «Hecho para el trader manual serio», que sólo aporta «para».
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
/** Cada contraste que se ha llegado a medir, para poder auditar la propia
    comprobación: una que no mide nada también sale en verde. */
const contrastesMedidos = [];
/** Ídem para las láminas del producto: si la ruta con capturas se cae de la
    lista, la comprobación de legibilidad en móvil pasa a no mirar nada. */
const laminasVistas = [];
/** Ídem para el idioma: cuántos caracteres se han llegado a leer en cada
    página inglesa. Un `innerText` vacío pasaría la comprobación en verde
    sin haber mirado una sola palabra. */
const idiomasRevisados = [];
/** Ídem para la vuelta a la cabecera: de dónde salió, dónde apareció y
    dónde acabó. Sin el dato, «pasó» no distingue un salto de un viaje. */
const vueltasArriba = [];
/** Ídem para el cajón de navegación: dónde acabó y con qué opacidad. */
const cajonesVistos = [];
/** Ídem para el material del papel: qué tinte llegó de verdad al
    elemento. «Pasó» sin decir qué se miró es lo que dejó que este
    defecto viviera tanto tiempo. */
const papelesVistos = [];
/** Ídem para la opacidad al final del scroll: cuántas rutas se llegaron
    a mirar. Cero rutas miradas también sale en verde. */
const opacidadesFinales = [];
/** Ídem para la llamada a la acción de la portada: dónde acaba respecto
    al pliegue, en cada una de las cuatro pantallas. */
const pliegues = [];

/**
 * Contraste de un texto contra el fondo que DE VERDAD tiene debajo.
 *
 * POR QUÉ SE MIDEN PÍXELES Y NO EL CSS COMPUTADO. La primera versión de
 * esta comprobación componía el fondo subiendo por los ancestros y
 * mezclando sus `background-color`. Daba veinticinco fallos, todos falsos:
 * no entendía `color-mix()` —que el navegador devuelve como
 * `color(srgb …)`—, ni los fondos declarados en `background-image` (que es
 * justo cómo está hecho el velo de sección), ni los estilos en línea de la
 * maqueta de la aplicación. Llegó a informar de 1,04:1 en un texto que se
 * lee sin esfuerzo.
 *
 * Una comprobación que se equivoca en la dirección alarmista se acaba
 * desactivando, y entonces no protege nada. Así que se hace lo caro y
 * fiable: se captura la caja del texto, se mete el PNG de vuelta en la
 * página, se dibuja en un canvas y se leen sus píxeles. El fondo es la
 * luminancia más frecuente de la caja —la mayoría de los píxeles de una
 * línea de texto no son letra— y el peor caso, el percentil de la cola
 * que se acerca al color del texto, que es donde el grabado ensucia.
 *
 * Devuelve null si la captura no se puede hacer (elemento fuera de vista).
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

      const n = (color.match(/[\d.]+/g) || []).map(Number);
      const rgb = color.startsWith("color(") ? n.slice(0, 3).map((v) => v * 255) : n.slice(0, 3);
      const Ltexto = lum(rgb[0], rgb[1], rgb[2]);

      lums.sort((a, b) => a - b);
      const pct = (q) => lums[Math.floor((lums.length - 1) * q)];
      // Si el texto es oscuro, el fondo que peor le va es el más oscuro
      // del lado claro; y al revés.
      const Lpeor = Ltexto < Lfondo ? pct(0.35) : pct(0.65);

      const ratio = (a, b) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
      return ratio(Ltexto, Lpeor);
    },
    { b64: png.toString("base64"), color: cand.color },
  );
}

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
    /* Un 404 en consola no dice QUÉ ha faltado, y sin eso el aviso es
       inútil. Se captura la URL de la respuesta y se recorta a la parte
       que identifica el recurso. */
    pagina.on("response", (r) => {
      if (r.status() === 404) {
        const u = r.url().replace(BASE, "");
        if (!RUIDO.test(u)) errores.push(`404 ${u}`);
      }
    });
    pagina.on("console", (m) => {
      const t = m.text();
      // El "Failed to load resource" ya lo reporta el manejador de arriba
      // con la URL concreta; aquí sólo estorbaría duplicado y sin ella.
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

          /* ── LA CAPTURA DEL PRODUCTO, A 390 px ──────────────────────
             La lámina afirma estar enseñando la densidad real del
             programa. Durante un tiempo, en móvil enseñaba la pantalla
             entera reducida al 0,23 de su tamaño: no se leía ni una
             cifra, y el componente seguía diciendo que demostraba algo.

             Se comprueba lo que el navegador DESCARGA (`currentSrc`),
             no lo que declara el `srcSet`: un `<picture>` mal escrito
             tiene buena pinta en el fuente y sirve el fichero
             equivocado. */
          laminas: [...document.querySelectorAll(".tj-lamina-ventana img")].map((img) => ({
            sirve: (img.currentSrc || img.src).split("/").pop(),
            nativo: img.naturalWidth,
            mostrado: Math.round(img.getBoundingClientRect().width),
          })),

          /* Candidatos para la medición de contraste, que se hace fuera
             (ver `mideContraste`): los textos MÁS PEQUEÑOS que están
             sobre el fondo grabado, que son los que se quedan sin margen
             cuando alguien mueve el velo. Aquí sólo se eligen; medirlos
             desde el CSS computado no funciona —hay que leer píxeles—, y
             el porqué está escrito en `mideContraste`. */
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
            // Los dos más pequeños: son el peor caso por definición.
            return out.sort((a, b) => a.tam - b.tam).slice(0, 2);
          })(),

          /* ── ¿EL PAPEL LLEGÓ A LA HOJA COMPILADA? ───────────────────
             Una declaración CSS que el compilador descarta no avisa: no
             hay error, no hay traza, y la web simplemente se ve peor sin
             que nada explique por qué.

             Pasó, y estuvo pasando bastante tiempo: el bloque de
             `.tj-paper` con el tinte translúcido, el grano de fibra y la
             luz de borde no llegaba al CSS del tema oscuro. Las
             superficies salían con un color plano — el aspecto de «esto
             está un poco soso» que abrió la revisión, sin una sola línea
             de código que se pudiera señalar. La variante clara sí
             llegaba, así que ni siquiera había una diferencia escrita
             entre los dos temas que apuntara al problema.

             Se comprueba en el ESTILO COMPUTADO y no leyendo el CSS
             generado: lo que importa no es que la regla exista en algún
             fichero, sino que le llegue al elemento. */
          papel: (() => {
            const el = document.querySelector(".tj-paper:not(.tj-paper-dense)");
            if (!el) return null;
            const cs = getComputedStyle(el);
            return {
              grano: cs.backgroundImage !== "none",
              tinte: cs.backgroundColor,
              canto: cs.boxShadow !== "none",
            };
          })(),

          /* ── EL IDIOMA DE LO QUE SE LEE Y DE LO QUE SE DECLARA ───────
             Dos textos distintos y los dos importan: el que ve la
             persona y el que ve el buscador. El segundo estuvo mal en
             las 76 páginas inglesas —los tres esquemas del sitio se
             emitían desde el layout raíz en español— y ninguna
             comprobación lo miraba, porque el `lang` del documento sí
             era correcto. Declarar `lang="en"` y describirse en español
             es peor que no describirse. */
          textoVisible: (document.body.innerText || "").slice(0, 60000),
          textoDatos: [...document.querySelectorAll('script[type="application/ld+json"]')]
            .map((s) => {
              // Sólo los valores de texto: las claves de schema.org y las
              // URLs son inglesas por definición y no dicen nada del
              // idioma de la página.
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

      /* ── LA LLAMADA A LA ACCIÓN, DENTRO DE LA PRIMERA PANTALLA ─────
         El hero alineaba su contenido abajo para dejar sitio a la
         figura, y en un portátil corriente eso empujaba el botón
         principal justo al borde: medido a 900 px de alto, el botón
         acababa a 810. Quien no baja, no lo ve.

         No basta con mirarlo en una pantalla: el hero mide una ventana
         completa, así que el problema aparece y desaparece según la
         altura. Se comprueba en las cuatro. */
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

      if (pantalla.nombre === "escritorio") {
        if (!informe.papel) {
          avisos.push(`${etiqueta}: ninguna superficie de papel que comprobar`);
        } else {
          papelesVistos.push(`${ruta} tinte ${informe.papel.tinte}`);
          if (!informe.papel.grano) {
            fallos.push(
              `${etiqueta}: el papel perdió su grano — la declaración no llega al elemento`
            );
          }
          if (!informe.papel.canto) {
            fallos.push(`${etiqueta}: el papel perdió su luz de borde`);
          }
        }
      }

      /* ── NADA SE QUEDA A MEDIO ENCENDER AL FINAL DEL SCROLL ────────
         Las entradas de sección son ahora CSS atado a la posición del
         elemento en la ventana (`animation-timeline: view()`), y eso
         trae un riesgo propio que el mecanismo anterior no tenía: el
         progreso de la animación no se «completa», se MAPEA. Un
         elemento que nunca llegue al final de su rango —porque está
         tan abajo que el documento se acaba antes— se quedaría en un
         fotograma intermedio de forma PERMANENTE: a media opacidad y
         unos píxeles desplazado, sin que nada lo devuelva a su sitio.

         Es exactamente el mismo defecto que se acaba de corregir
         —contenido servido a media tinta— por un camino distinto, así
         que se comprueba en vez de suponerse: se baja al final del
         documento y se exige que todo lo visible esté a plena
         opacidad. */
      if (pantalla.nombre === "escritorio") {
        const tenues = await pagina.evaluate(async () => {
          window.scrollTo(0, document.documentElement.scrollHeight);
          // Dos fotogramas y un respiro: el timeline se resuelve en el
          // compositor y el estilo computado tarda en reflejarlo.
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

      /* ── EL CAJÓN LATERAL, ABIERTO ─────────────────────────────────
         Todo lo que se comprueba arriba mira la página en reposo, y el
         cajón de navegación sólo existe cuando alguien lo abre: ni su
         posición ni su opacidad ni el texto que tapa entran en ninguna
         de las otras comprobaciones. Se abre y se mide.

         Lo que se busca es que quepa. Al abrirlo, el cuerpo de la
         página pasa a `position: fixed` para que no se desplace por
         detrás —ver el porqué en `Navbar.tsx`—, y ese cambio reordena
         el ancho contra el que se ancla un elemento fijo. Si el cálculo
         se desvía, el cajón se sale por la derecha y sus entradas
         aparecen cortadas a media palabra. */
      if (ruta === "/" && (pantalla.nombre === "movil" || pantalla.nombre === "tableta")) {
        const cajon = await pagina.evaluate(async () => {
          const abrir = [...document.querySelectorAll("button")].find((b) =>
            /Abrir menú|Open menu/.test(b.getAttribute("aria-label") || "")
          );
          if (!abrir) return { abrir: false };
          abrir.click();
          // La entrada dura 320 ms; se espera al doble para medir la
          // posición final y no un fotograma de la animación.
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
          /* Un cajón translúcido deja leer la página por debajo de sus
             entradas. Se admite hasta un 4 % de paso, que es el alfa
             que el propio token de superficie ya trae. */
          const alfa = cajon.fondo.match(/[\d.]+\s*\)$/);
          const paso = alfa && cajon.fondo.includes("/") ? 1 - parseFloat(alfa[0]) : 0;
          if (paso > 0.04) {
            fallos.push(
              `${etiqueta}: el cajón deja pasar el ${Math.round(paso * 100)} % de lo que hay detrás (${cajon.fondo})`
            );
          }
        }
        // Se recarga: la página queda con el cuerpo bloqueado y el
        // resto de comprobaciones de esta pantalla medirían otra cosa.
        await pagina.reload({ waitUntil: "networkidle" });
      }

      /* ── LA VUELTA ARRIBA NO PUEDE REBOBINAR LA PÁGINA ─────────────
         `html` llevaba `scroll-behavior: smooth`, y con él volver a la
         cabecera desde el pie de la portada animaba las diez pantallas
         de recorrido: el sitio entero pasando hacia atrás. Aquí se
         MIDEN las posiciones intermedias, que es lo único que distingue
         un salto de un rebobinado — el destino es el mismo en los dos
         casos, así que comprobar dónde acaba no habría cazado nada.

         Sólo en la portada y en escritorio: es la página más larga del
         sitio y donde el botón aparece antes. */
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
            /* El primer sitio en el que se ve la página tras pulsar. Si
               está a diez pantallas del destino, se recorrieron. */
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
          // Tres pantallas de margen: el aterrizaje son 220 px, y el
          // umbral deja sitio a una animación algo más larga sin dar
          // por bueno un recorrido de verdad.
          if (viaje.primera !== null && viaje.primera > viaje.alto * 3) {
            fallos.push(
              `${etiqueta}: volver arriba recorre la página — primera parada a ${viaje.primera}px de ${viaje.desde}px`
            );
          }
        }
      }

      /* Una sola pantalla basta: el idioma no depende del ancho, y
         repetirlo cuatro veces sólo multiplicaría el mismo fallo. */
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
        /* Por debajo de 0,4 la cifra más grande de la captura deja de
           leerse. Es el umbral por el que existe el recorte. */
        const escala = l.mostrado / l.nativo;
        if (escala < 0.4) {
          fallos.push(
            `${etiqueta}: la captura "${l.sirve}" se ve al ${(escala * 100).toFixed(0)} % ` +
            `(${l.mostrado}px de ${l.nativo}px) — a esa escala no se lee`
          );
        }
      }

      /* ── TEXTO QUE SE SALE POR EL CANTO ──────────────────────────────
         El fallo que motivó esto: en la demo, la tira «Riesgo de esta
         operación» usaba `grid-cols-[1fr_1px_1fr_1px_1fr]`. Un `1fr`
         pelado es `minmax(auto,1fr)`, así que la columna NO encoge por
         debajo de su contenido: con «520,00 US$» dentro, la tira medía
         262px en un hueco de 224 y el «5,20 %» quedaba cortado por el
         canto de la tarjeta, que tiene `overflow:hidden`. Nada fallaba
         —ni consola, ni tests, ni el ancho del documento, porque el
         recorte se come el desbordamiento— y sólo se veía mirando la
         página en un teléfono.

         Se busca justo esa forma: un elemento CON TEXTO que sobresale
         del rectángulo del ancestro más cercano que recorta.

         Por qué sólo en móvil: es donde el ancho aprieta y donde una
         rejilla que no encoge revienta. En escritorio sobra sitio y
         estas mismas rejillas caben.

         Acotado para que no mienta: sólo hojas de texto (si un hijo
         también tiene texto, el desbordamiento se le imputa al hijo y no
         se cuenta dos veces), nada marcado `aria-hidden` —lo decorativo
         se sale a propósito—, nada dentro de un contenedor que se pueda
         desplazar en horizontal a propósito, y un margen de 2px para el
         redondeo subpíxel. */
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
            // Sólo la hoja: si algún hijo tiene texto, ya se mirará él.
            if ([...el.children].some((c) => (c.textContent || "").trim())) continue;
            const r = el.getBoundingClientRect();
            if (r.width === 0 || r.height === 0) continue;
            /* ── SÓLO SE DESCARTA LO QUE NO ESTÁ MAQUETADO ──────────────
               Aquí hay una distinción que costó una prueba contra el fallo.

               El primer intento descartaba todo lo que `checkVisibility`
               diera por invisible, con las tres banderas puestas. Eso quitó
               los seis falsos positivos de /about —secciones con
               `content-visibility:auto` que el navegador ni siquiera
               maqueta, así que su geometría no significa nada— pero de paso
               DESACTIVÓ la comprobación entera en /demo: las filas de la
               tabla entran con `opacity:0` y sólo suben a 1 cuando el
               scroller interno las revela, así que el fallo real de la
               tabla dejó de detectarse. Se comprobó revirtiendo el arreglo
               a propósito: la comprobación decía «correcto».

               La diferencia que importa no es «se ve ahora», es «está
               maquetado»: un elemento a opacidad 0 por una animación de
               entrada SÍ se va a ver, y su caja ya es la definitiva; uno
               saltado por `content-visibility` no está renderizado y su
               caja es una estimación del navegador. Por eso sólo se pasa la
               bandera `contentVisibilityAuto` y NO las de opacidad y
               visibilidad. */
            if (
              typeof el.checkVisibility === "function" &&
              !el.checkVisibility({ contentVisibilityAuto: true })
            ) {
              continue;
            }
            let p = el.parentElement;
            let caja = null;
            while (p && p !== document.body) {
              // Una tira desplazable a mano no es un fallo: ahí el
              // contenido SE PUEDE alcanzar. El fallo es lo recortado.
              if (desplazable(p)) { caja = null; break; }
              if (recorta(p)) { caja = p; break; }
              p = p.parentElement;
            }
            if (!caja) continue;
            const cr = caja.getBoundingClientRect();
            /* El texto sólo para lectores de pantalla (`.sr-only`) vive a
               propósito dentro de una caja de 1×1 px con `overflow:hidden`:
               ahí el contenido SIEMPRE sobresale, y está bien que lo haga.
               Se descarta por la geometría y no por el nombre de la clase,
               que puede cambiar. Encontrado al probar esto: daba «"informada."
               se sale 246px» en /pricing, que era el titular del lector de
               pantalla haciendo exactamente su trabajo. */
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
      }

      /* El contraste sólo se mide en escritorio: la composición de capas
         es la misma en las cuatro pantallas y leer píxeles cuesta una
         captura por elemento. */
      if (pantalla.nombre === "escritorio") {
        if (informe.candidatosContraste.length === 0) {
          /* Una comprobación que no encuentra nada que comprobar pasa en
             verde y no protege nada. Si una ruta deja de tener textos
             pequeños sobre el fondo, que se sepa. */
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
    /* ── SONDEAR, NO ESPERAR UN RATO ────────────────────────────────
       Aquí hubo primero `domcontentloaded` sin espera, y después una
       espera fija de 600 ms. Las dos daban falsos negativos: hasta que
       la hoja de estilos no se aplica, el titular no tiene caja de
       maquetación, `getClientRects()` devuelve 0 y la comprobación
       falla por un motivo que no existe. Con la espera fija fallaba de
       forma INTERMITENTE según la carga de la máquina, que es todavía
       peor: una comprobación que a veces miente deja de creerse, y
       entonces ya no sirve para nada.

       Se sondea hasta que el titular sea visible o se agote el plazo.
       Si se agota, el fallo es real. */
    await pagina.goto(`${BASE}${ruta}`, { waitUntil: "load", timeout: 30000 });
    // Espera de reloj, no de página: con el JavaScript desactivado,
    // `waitForFunction` no puede evaluarse dentro del documento, se agota
    // sin esperar nada y se vuelve al problema de medir demasiado pronto.
    // Se intentó y dio ocho falsos negativos estables, que engañan más
    // que los intermitentes porque parecen un hallazgo.
    await pagina.waitForTimeout(1500);
    /* ── SE MIDE LO QUE SE VE, NO LO QUE DICE EL ELEMENTO ────────────
       Esta comprobación miraba `getComputedStyle(h1)` — opacidad,
       `visibility`, `display` — SOBRE EL PROPIO `h1`. Eso no sirve: un
       ancestro con `hidden`, `display:none` o un `<div>` de Suspense
       deja al `h1` con sus tres valores perfectos y aun así invisible.
       Daba verde con la página en blanco.

       `checkVisibility` recorre la cadena de ancestros; `getClientRects`
       confirma que ocupa sitio de verdad. Y se comprueba además que el
       texto del titular esté dentro de `<main>`, para que no baste con
       que exista escondido en el árbol. */
    const r = await pagina.evaluate(() => {
      const h1 = document.querySelector("h1");
      if (!h1) return { hay: false };
      const texto = (h1.getAttribute("aria-label") || h1.textContent || "").trim();
      const visible =
        typeof h1.checkVisibility === "function"
          ? h1.checkVisibility({ opacityProperty: true, visibilityProperty: true, contentVisibilityAuto: true })
          : h1.getClientRects().length > 0;
      const main = document.querySelector("main");
      /* ── SE COMPARA TEXTO RENDERIZADO CONTRA TEXTO RENDERIZADO ──────
         `textContent` e `innerText` no producen la misma cadena para el
         mismo elemento: un `<br>` no aporta nada al primero y vale un
         salto de línea en el segundo. El titular de la portada
         —«Opera como una<br/>mesa institucional.»— salía como
         "…unamesa…" por un lado y "…una\nmesa…" por el otro, así que la
         comparación no podía coincidir NUNCA. Eso dejó un aviso
         permanente que no señalaba nada de la página, y un aviso que
         siempre está encendido deja de leerse.

         Ahora los dos lados se obtienen por la misma vía (`innerText`) y
         se les colapsa la secuencia de espacios. Lo que la comprobación
         sigue detectando es lo que importaba: que el texto del titular
         esté DENTRO de `<main>` y no escondido en otra rama del árbol.
         Se comprueba contra el fallo moviendo el h1 fuera de `<main>`. */
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
    /* Estas dos SÍ son fallos: si el titular no está en el HTML o no
       tiene texto, no hay nada que discutir. */
    if (!r.hay) fallos.push(`sin-JS ${ruta}: no hay h1 en el HTML`);
    else if (!r.texto) fallos.push(`sin-JS ${ruta}: el h1 no tiene texto`);
    else if (!r.visible) {
      /* ── POR QUÉ ESTO ES UN AVISO Y NO UN FALLO ────────────────────
         La visibilidad medida aquí NO es de fiar todavía, y decirlo es
         más útil que fingir lo contrario.

         Medida con este script, el titular sale invisible en las ocho
         rutas. Medido con un script aparte contra el MISMO sitio
         construido y el mismo navegador —contexto nuevo, espera de
         1,2 s— sale visible: `checkVisibility()` verdadero, una caja de
         maquetación y ningún ancestro oculto. Las dos mediciones no
         pueden ser ciertas a la vez, así que una de las dos está mal
         montada y no he cerrado cuál.

         Mientras eso no se resuelva, esto no puede tumbar la
         compilación: una barrera que se dispara sin que nadie sepa por
         qué se acaba desactivando entera, y entonces se pierden también
         las comprobaciones que sí valen. Queda como aviso, con los
         valores medidos delante, para que quien lo retome no empiece de
         cero. Lo que hay que averiguar es por qué difieren las dos
         formas de medir; el candidato es cómo se crea el contexto sin
         JavaScript en este script (uno solo para las ocho rutas) frente
         al de la prueba aislada (uno por ruta). */
      avisos.push(
        `sin-JS ${ruta}: el h1 se mide como no visible — PENDIENTE de confirmar, una medición aislada dice lo contrario ` +
          `(rects=${r.rects}, checkVisibility=${r.checkVis})`
      );
    } else if (!r.enMain) {
      avisos.push(`sin-JS ${ruta}: el titular no aparece en el texto de <main>`);
    }
  } catch (e) {
    fallos.push(`sin-JS ${ruta}: ${String(e).split("\n")[0]}`);
  }
  await pagina.close();
}
await sinJs.close();

await navegador.close();
if (servidorLocal) servidorLocal.servidor.close();

for (const a of avisos) console.warn(`  aviso  ${a}`);
if (fallos.length) {
  console.error(`\n[humo] ${fallos.length} fallo(s):`);
  for (const f of fallos) console.error(`  ✗ ${f}`);
  process.exit(1);
}
/* El peor contraste medido, dicho en voz alta. Es la diferencia entre
   "la comprobación pasó" y "la comprobación miró N sitios y el más justo
   iba por aquí": lo segundo se puede seguir en el tiempo, lo primero no. */
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
  console.log(`[humo] papel — grano y canto presentes en ${papelesVistos.length} rutas; ${papelesVistos[0]}`);
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

console.log(
  `[humo] correcto — ${RUTAS.length} rutas × ${PANTALLAS.length} pantallas, más el titular sin JavaScript.`
);
