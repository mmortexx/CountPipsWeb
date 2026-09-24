/**
 * TEMA — quién decide si la página abre en papel o en tinta, y sin fogonazo
 *
 * ── Qué mide ──────────────────────────────────────────────────────────
 * El orden de mando del tema, y lo más difícil de ver: que al abrir con
 * el sistema en oscuro NO se cuele ni un fotograma blanco.
 *
 * El orden es: manda lo que el visitante eligió con el interruptor; si no
 * ha elegido nunca, manda su sistema operativo; y si su sistema no dice
 * nada, el papel. Eso obliga a tres cosas que se rompen por separado:
 *
 *  · La clave `tj-theme` significa «esto lo eligió una persona», así que
 *    NO puede escribirse sola al cargar. Si alguien vuelve a ponerla en
 *    un efecto de sincronización —como estuvo—, basta una primera visita
 *    para que el sistema no vuelva a contar nunca, y nada se ve raro.
 *  · El tema tiene que resolverse en el script del `<head>`, antes del
 *    primer pintado. Resolverlo ya montado en React significa un fogonazo
 *    blanco justo a quien puso el sistema en oscuro para no recibirlo.
 *  · Y la elección manual tiene que sobrevivir a la recarga aunque
 *    contradiga al sistema.
 *
 * ── Cómo se mide el fogonazo ──────────────────────────────────────────
 * No leyendo el DOM: el HTML estático llega con `data-theme="light"` y el
 * script lo corrige antes de pintar, así que una lectura de atributos
 * acusa un salto que nadie llega a ver. Se graban los fotogramas reales
 * del compositor por CDP, con la red frenada para estirar la carga, y se
 * mira el color de los márgenes —no el centro, donde hay botones claros
 * que dan un falso positivo—.
 *
 * ── Por qué hay pasada de CONTROL ─────────────────────────────────────
 * Esta guarda busca una ausencia —«ningún fotograma claro»— y eso pasa
 * siempre en cuanto el detector deje de detectar. Así que la misma
 * grabación se repite con el sistema en CLARO, donde TIENE que ver
 * fotogramas claros. Si ahí tampoco ve ninguno, se declara rota y falla.
 *
 * ── Qué encontró el día que se escribió (2026-09-20) ──────────────────
 * El sitio abría en claro pasara lo que pasara: `readSavedTheme()`
 * devolvía "light" sin consultar al sistema, y un efecto reescribía la
 * clave en cada carga. Se arregló a la vez que se escribió esta guarda.
 *
 * Uso:  node scripts/tema.mjs --serve out
 */
import { chromium } from "playwright";
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, extname } from "node:path";

const dir = process.argv.slice(2).find((a) => !a.startsWith("-")) || "out";
if (!existsSync(dir)) {
  console.log(`[tema] no encuentro el directorio «${dir}». ¿Falta compilar el sitio con \`npm run build\`?`);
  process.exit(1);
}
const PREFIJO = process.env.NEXT_PUBLIC_BASE_PATH || "";

const TIPOS = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css",
  ".webp": "image/webp", ".png": "image/png", ".svg": "image/svg+xml", ".avif": "image/avif",
  ".woff2": "font/woff2", ".json": "application/json", ".txt": "text/plain",
  ".xml": "application/xml", ".ico": "image/x-icon",
};

async function servir(raiz) {
  const server = createServer(async (req, res) => {
    try {
      let ruta = decodeURIComponent((req.url || "/").split("?")[0]);
      if (PREFIJO && ruta.startsWith(PREFIJO)) ruta = ruta.slice(PREFIJO.length) || "/";
      let fichero = join(raiz, ruta);
      try {
        if ((await stat(fichero)).isDirectory()) fichero = join(fichero, "index.html");
      } catch {
        fichero = extname(fichero) ? fichero : `${fichero}.html`;
      }
      const cuerpo = await readFile(fichero);
      res.writeHead(200, { "content-type": TIPOS[extname(fichero)] || "application/octet-stream" });
      res.end(cuerpo);
    } catch {
      res.writeHead(404).end("no está");
    }
  });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  return { server, base: `http://127.0.0.1:${server.address().port}${PREFIJO}` };
}

const { server, base } = await servir(dir);
const navegador = await chromium.launch();

const fallos = [];
const comprueba = (nombre, ok, detalle) => {
  console.log(`  ${ok ? "·" : "✗"} ${nombre}${detalle ? "  — " + detalle : ""}`);
  if (!ok) fallos.push(nombre);
};

const lee = (p) =>
  p.evaluate(() => ({
    tema: document.documentElement.dataset.theme,
    oscuro: document.documentElement.classList.contains("dark"),
    guardado: (() => {
      try {
        return localStorage.getItem("tj-theme");
      } catch {
        return "?";
      }
    })(),
  }));

async function abrir(sistema) {
  const ctx = await navegador.newContext({ colorScheme: sistema, viewport: { width: 1280, height: 800 } });
  const p = await ctx.newPage();
  await p.goto(base + "/", { waitUntil: "load", timeout: 30000 });
  await p.waitForTimeout(500);
  return { ctx, p };
}

// ── 1 y 2. sin elección, manda el sistema ─────────────────────────────
for (const [sistema, esperado] of [["light", "light"], ["dark", "dark"]]) {
  const { ctx, p } = await abrir(sistema);
  const r = await lee(p);
  comprueba(`sistema ${sistema === "dark" ? "oscuro" : "claro"} y nadie ha elegido → ${esperado}`, r.tema === esperado && r.oscuro === (esperado === "dark"), `tema=${r.tema}`);
  /* Si esto se guardara, el sistema dejaría de contar a partir de la
     segunda visita — el fallo original, y no se nota mirando la web. */
  comprueba(`   y no se guarda nada: el sistema sigue mandando mañana`, r.guardado === null, `guardado=${JSON.stringify(r.guardado)}`);
  await ctx.close();
}

// ── 3. el interruptor manda sobre el sistema, y aguanta la recarga ────
{
  const { ctx, p } = await abrir("dark");
  const boton = p.locator('button[data-theme-toggle="true"]:visible').first();
  if (!(await boton.count())) {
    comprueba("hay un interruptor de tema visible", false, "no se encontró `button[data-theme-toggle]` visible a 1280px");
  } else {
    await boton.click();
    await p.waitForTimeout(700);
    const r = await lee(p);
    comprueba("con el sistema oscuro, elegir papel → papel", r.tema === "light", `tema=${r.tema}`);
    comprueba("   y ahora SÍ se guarda", r.guardado === "light", `guardado=${JSON.stringify(r.guardado)}`);
    await p.reload({ waitUntil: "load" });
    await p.waitForTimeout(600);
    const r2 = await lee(p);
    comprueba("   y aguanta la recarga aunque el sistema diga lo contrario", r2.tema === "light", `tema=${r2.tema}`);
  }
  await ctx.close();
}

// ── 4. ningún fotograma claro al abrir con el sistema en oscuro ───────
/** Graba la carga y devuelve la luz de los márgenes de cada fotograma. */
async function luces(sistema, ruta) {
  const ctx = await navegador.newContext({ colorScheme: sistema, viewport: { width: 1280, height: 800 } });
  const p = await ctx.newPage();
  const cdp = await ctx.newCDPSession(p);
  const fotogramas = [];
  cdp.on("Page.screencastFrame", async (ev) => {
    fotogramas.push(ev.data);
    try {
      await cdp.send("Page.screencastFrameAck", { sessionId: ev.sessionId });
    } catch {
      /* la sesión ya está cerrada */
    }
  });
  await cdp.send("Page.startScreencast", { format: "png", everyNthFrame: 1 });
  /* Con la red a tope la carga cabe en dos fotogramas y un fogonazo
     podría no llegar a grabarse. Frenada, la ventana se abre. */
  await cdp.send("Network.enable");
  await cdp.send("Network.emulateNetworkConditions", { offline: false, latency: 120, downloadThroughput: 300 * 1024, uploadThroughput: 300 * 1024 });
  await p.goto(base + ruta, { waitUntil: "load", timeout: 60000 });
  await p.waitForTimeout(900);
  await cdp.send("Page.stopScreencast");

  /* Decodificar en otra pestaña evita añadir una dependencia de imagen
     al proyecto solo para leer un píxel. */
  /* Por tandas: con las entradas animadas de la portada la grabación pasa
     del centenar de fotogramas, y mandarlos todos de una vez a la pestaña
     lectora la dejaba sin memoria y se cerraba a mitad de la medida. */
  const lector = await ctx.newPage();
  const TANDA = 25;
  const medidas = [];
  for (let i = 0; i < fotogramas.length; i += TANDA) {
    medidas.push(...(await medirTanda(lector, fotogramas.slice(i, i + TANDA))));
  }
  await ctx.close();
  return medidas;
}

async function medirTanda(lector, tanda) {
  return lector.evaluate(async (lista) => {
    const out = [];
    for (const b64 of lista) {
      const img = new Image();
      img.src = "data:image/png;base64," + b64;
      try {
        await img.decode();
      } catch {
        continue;
      }
      const c = document.createElement("canvas");
      c.width = img.width;
      c.height = img.height;
      const g = c.getContext("2d");
      g.drawImage(img, 0, 0);
      /* Los MÁRGENES, no el centro: en el centro hay botones claros y
         capturas de producto que dan un falso positivo —midiendo ahí,
         la portada acusaba dos fotogramas «claros» que resultaron ser
         el botón principal sobre un fondo perfectamente oscuro—. */
      const puntos = [
        [Math.floor(img.width * 0.03), Math.floor(img.height * 0.5)],
        [Math.floor(img.width * 0.97), Math.floor(img.height * 0.5)],
        [Math.floor(img.width * 0.03), Math.floor(img.height * 0.85)],
      ];
      const vals = puntos.map(([x, y]) => {
        const d = g.getImageData(x, y, 1, 1).data;
        return (d[0] + d[1] + d[2]) / 3;
      });
      out.push(Math.min(...vals));
    }
    return out;
  }, tanda);
}

const UMBRAL_CLARO = 140;
const RUTAS_FOTO = ["/", "/pricing/"];
let clarosEnOscuro = 0;
let clarosEnClaro = 0;
let fotogramasTotales = 0;

for (const ruta of RUTAS_FOTO) {
  const enOscuro = await luces("dark", ruta);
  const enClaro = await luces("light", ruta);
  fotogramasTotales += enOscuro.length + enClaro.length;
  const co = enOscuro.filter((l) => l > UMBRAL_CLARO).length;
  const cc = enClaro.filter((l) => l > UMBRAL_CLARO).length;
  clarosEnOscuro += co;
  clarosEnClaro += cc;
  comprueba(`${ruta} abre sin un solo fotograma blanco con el sistema en oscuro`, co === 0, `${co} de ${enOscuro.length} fotogramas claros`);
}

await navegador.close();
server.close();

console.log(`\n[tema] ${fotogramasTotales} fotogramas grabados · control con el sistema en claro: ${clarosEnClaro} fotogramas claros`);

/* La pasada de control. Con el sistema en claro la página ES clara, así
   que si el detector no ve ni un fotograma claro ahí, no está midiendo
   nada y su respuesta sobre el fogonazo no vale. */
if (clarosEnClaro === 0) {
  console.log("[tema] el detector no ve claro ni cuando la página ES clara: está roto, y su respuesta no vale");
  console.log("[tema] revisa los puntos de muestreo o el umbral en `luces()`");
  process.exit(1);
}
if (fallos.length) {
  console.log(`[tema] ${fallos.length} comprobación(es) fallan`);
  console.log("[tema] el orden lo fija `readSavedTheme()` en `src/lib/theme.tsx`, y el script del `<head>` de `src/app/layout.tsx` tiene que resolverlo igual");
  console.log("[tema] si falla el fogonazo: el tema se está decidiendo después del primer pintado");
  console.log("[tema] si falla «no se guarda nada»: algo escribe `tj-theme` sin que nadie toque el interruptor");
  process.exit(1);
}
console.log(`[tema] correcto — manda la elección, luego el sistema, y con el sistema en oscuro no se cuela ni un fotograma blanco (${clarosEnOscuro})`);
