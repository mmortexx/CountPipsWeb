/**
 * Fluidez del fondo — cuánto cuesta REVELAR el atlas mientras se baja.
 *
 * ── Por qué existe ────────────────────────────────────────────────────
 * El fondo de este sitio no es una imagen: es un atlas que se dibuja al
 * hacer scroll, y desde el revelado por trama (`EngravedAtlas`) cada
 * avance del trazo hace tres trabajos —dibujar la lámina en la máscara,
 * leer su cobertura y componer los puntos—. Eso es exactamente la clase
 * de coste que no sale en ninguna prueba, no ensucia la consola y sólo
 * se nota en la mano de quien mueve la rueda.
 *
 * Y ya mordió: la primera versión del revelado se rehacía 512 veces por
 * lámina, cuando la trama sólo tiene resolución para 160. El resultado
 * era el mismo dibujo, calculado tres veces de más — p99 del fotograma
 * de 6,8 ms a 25,5 ms.
 *
 * ── Qué mide, y por qué así ───────────────────────────────────────────
 * El tiempo entre fotogramas mientras un scroll continuo recorre la
 * página entera, que es cuando el trazo avanza sin parar y el revelado
 * trabaja en todos los fotogramas. La MEDIANA no sirve de nada aquí: el
 * fondo pasa la mayor parte del tiempo sólo estampando un lienzo ya
 * hecho, así que sale bien incluso cuando el revelado va fatal. Lo que
 * delata el problema es la COLA — p99 y peor caso.
 *
 * El presupuesto no se mide contra 60 Hz. Un monitor de 165 Hz da 6 ms
 * por fotograma, y es el que tiene el fundador; medir contra 16,7 ms
 * dejaría pasar un tirón que él vería todos los días.
 *
 * Uso:
 *   node scripts/fluidez.mjs --serve out
 *   node scripts/fluidez.mjs --base http://localhost:3000
 *   node scripts/fluidez.mjs --serve out --p99 20   (otro presupuesto)
 */
import { chromium } from "playwright";
import { createServer } from "node:http";
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { extname, join, normalize } from "node:path";

const args = process.argv.slice(2);
const arg = (nombre, pordefecto) => {
  const i = args.indexOf(nombre);
  return i >= 0 && args[i + 1] ? args[i + 1] : pordefecto;
};

const SERVIR = arg("--serve", null);
const PREFIJO = (process.env.NEXT_PUBLIC_BASE_PATH ?? "").replace(/\/$/, "");

/* ── EL PRESUPUESTO SALE DE UNA MEDIDA, NO DE UN DESEO ─────────────────
   La primera versión de este guardián puso el tope en 12 ms «porque un
   monitor de 165 Hz da 6». Ese número no lo cumplía ni la web SIN el
   revelado: medido sobre el sitio compilado, con el atlas trazado a
   línea, la propia página ya daba p99 de 22,6 a 26,8 ms. Un presupuesto
   que falla igual antes y después del cambio no mide el cambio.

   Estas son las tres versiones, medidas el mismo día en la misma
   máquina, 1440×900 y densidad 1, con Chromium sin ventana (que
   sincroniza a 60 Hz — de ahí que la mediana sea 17 ms en las tres).
   Cada celda es «p99 / peor», en milisegundos:

     ruta                 trazo de línea   trama       trama con asiento
     / (claro)            22,6 / 23,5      22,5 / 23,8   20,8 / 22,7
     / (oscuro)           23,3 / 36,9      23,4 / 30,1   21,2 / 23,0
     /features (claro)    26,8 / 27,1      31,0 / 34,7   24,3 / 25,5
     /features (oscuro)   22,8 / 23,4      25,9 / 30,1   24,5 / 26,5

   Dos cosas que no se sabrían sin medir. La primera: la trama sin más
   costaba unos 4 ms de cola en la página cargada. La segunda, y va contra
   la intuición: AÑADIR el asiento la hizo más rápida que el trazo de
   línea original en tres de las cuatro medidas. El motivo es que un punto
   recién nacido mide el 30 % de su tamaño final, y la mayoría cae por
   debajo del tercio de píxel a partir del cual `tramar` ni lo construye —
   así que el borde del dibujo, que es justo donde antes se acumulaba el
   trabajo, ahora se salta casi entero.

   ── QUIÉN JUZGA: p99, NO EL MÁXIMO ────────────────────────────────────
   El primer tope de esta medida se puso sobre el PEOR fotograma, y hubo
   que quitarlo: repitiendo la misma ejecución sin tocar una línea, el
   peor de /features en oscuro dio 26,5 ms y a la vuelta siguiente 38 ms.
   Es un único dato entre 259, y lo que lo mueve es cuándo le toca
   recoger basura al navegador, no lo que hace el fondo. Un guardián que
   falla la mitad de las veces por azar se acaba silenciando, y este
   proyecto ya tiene esa lección escrita.

   Así que manda **p99**, que entre ejecuciones se mueve una décima
   (24,3 → 24,4 → 24,7 en /features), y el máximo se queda con un tope
   deliberadamente flojo: ahí no busca un ajuste fino, busca un
   CONGELÓN — medio segundo de página parada — que ninguna estadística
   de cola cazaría si sólo pasa una vez.

   El tope de p99 es el peor medido más un margen corto. Si algún día se
   vuelve a optimizar, hay que BAJARLO: un guardián con holgura de sobra
   deja de vigilar. */
const TOPE_P99 = Number(arg("--p99", "28"));
const TOPE_PEOR = Number(arg("--peor", "120"));

/* Las rutas con más lámina por píxel: la portada, que lleva las cuatro
   pausas sincronizadas, y una interior con su propio juego de figuras. */
const RUTAS = ["/", "/features"];

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

async function levantarServidor(raiz) {
  const resolver = async (ruta) => {
    let pedida = decodeURIComponent(ruta.split("?")[0]);
    if (PREFIJO && (pedida === PREFIJO || pedida.startsWith(`${PREFIJO}/`))) {
      pedida = pedida.slice(PREFIJO.length) || "/";
    }
    const limpia = normalize(pedida).replace(/^(\.\.[/\\])+/, "");
    for (const c of [
      join(raiz, limpia),
      join(raiz, limpia, "index.html"),
      join(raiz, `${limpia}.html`),
    ]) {
      try {
        if ((await stat(c)).isFile()) return c;
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
      "content-type":
        TIPOS[extname(fichero).toLowerCase()] || "application/octet-stream",
    });
    createReadStream(fichero).pipe(res);
  });
  await new Promise((ok) => servidor.listen(0, "127.0.0.1", ok));
  return { servidor, url: `http://127.0.0.1:${servidor.address().port}` };
}

/**
 * Recorre la página de arriba abajo y devuelve la distribución del tiempo
 * entre fotogramas.
 *
 * El recorrido y la medición viven los dos DENTRO de la página, en un
 * único `evaluate`. Hacerlo desde fuera —un `mouse.wheel` por paso desde
 * Node— mete el ida y vuelta del protocolo en cada muestra y acaba
 * midiendo la latencia del puente en vez del trabajo del fondo.
 */
async function medir(pagina) {
  return pagina.evaluate(async () => {
    const esperas = [];
    let previo = performance.now();
    let midiendo = true;
    const tic = () => {
      const t = performance.now();
      esperas.push(t - previo);
      previo = t;
      if (midiendo) requestAnimationFrame(tic);
    };
    window.scrollTo(0, 0);
    await new Promise((r) => setTimeout(r, 500));
    requestAnimationFrame(tic);

    /* Un paso por fotograma, no por temporizador: así el recorrido va al
       ritmo real de la pantalla y cada muestra corresponde a un avance
       de scroll, que es lo que se quiere medir. */
    const alto = document.documentElement.scrollHeight - innerHeight;
    const pasos = 260;
    for (let i = 0; i <= pasos; i++) {
      window.scrollTo(0, Math.round((alto * i) / pasos));
      await new Promise((r) => requestAnimationFrame(() => r()));
    }
    midiendo = false;
    await new Promise((r) => setTimeout(r, 60));

    /* Los tres primeros fotogramas se tiran: llevan dentro el arranque
       del propio bucle de medición. */
    const a = esperas.slice(3).sort((x, y) => x - y);
    const q = (f) => a[Math.min(a.length - 1, Math.floor(a.length * f))];
    return {
      n: a.length,
      p50: +q(0.5).toFixed(1),
      p90: +q(0.9).toFixed(1),
      p99: +q(0.99).toFixed(1),
      peor: +a[a.length - 1].toFixed(1),
    };
  });
}

const fallos = [];
let servidor = null;
let BASE = arg("--base", "http://localhost:3000");
if (SERVIR) {
  const s = await levantarServidor(SERVIR);
  servidor = s.servidor;
  BASE = s.url + PREFIJO;
}

const navegador = await chromium.launch();
try {
  const contexto = await navegador.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
  });
  const pagina = await contexto.newPage();

  for (const ruta of RUTAS) {
    await pagina.goto(`${BASE}${ruta}`, { waitUntil: "load", timeout: 30000 });
    /* La secuencia de entrada bloquea el scroll durante su primer pase.
       Medir encima de ella daría números del loader, no del fondo. */
    await pagina.waitForTimeout(2500);

    for (const tema of ["light", "dark"]) {
      await pagina.evaluate((t) => {
        document.documentElement.dataset.theme = t;
        document.documentElement.classList.toggle("dark", t === "dark");
      }, tema);
      await pagina.waitForTimeout(400);

      const r = await medir(pagina);
      const etiqueta = `${ruta} (${tema})`;
      console.log(
        `[fluidez] ${etiqueta.padEnd(22)} ${r.n} fotogramas · ` +
          `p50 ${r.p50} · p90 ${r.p90} · p99 ${r.p99} · peor ${r.peor} ms`
      );
      if (r.p99 > TOPE_P99)
        fallos.push(
          `${etiqueta}: p99 ${r.p99} ms supera el presupuesto de ${TOPE_P99} ms — ` +
            `el revelado del fondo está robando fotogramas al scroll`
        );
      if (r.peor > TOPE_PEOR)
        fallos.push(
          `${etiqueta}: peor fotograma ${r.peor} ms supera ${TOPE_PEOR} ms`
        );
    }
  }
} finally {
  await navegador.close();
  servidor?.close();
}

if (fallos.length) {
  console.error("\n[fluidez] FALLA:");
  for (const f of fallos) console.error(`  ✗ ${f}`);
  process.exit(1);
}
console.log("[fluidez] correcto — el fondo no le quita fotogramas al scroll.");
