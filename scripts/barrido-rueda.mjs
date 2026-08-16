// Barrido de rueda por rejilla de puntos en cada ruta: ningún recuadro debe atrapar.
import { chromium } from "playwright";

const args = process.argv.slice(2);
const flag = (n, d) => { const i = args.indexOf(`--${n}`); return i >= 0 ? args[i + 1] : d; };
const BASE = flag("base", "http://localhost:3000");
const RUTAS = ["/", "/features", "/features/metricas", "/features/disciplina", "/features/seguridad", "/pricing", "/demo", "/herramientas", "/glosario", "/faq", "/about", "/test", "/beta", "/traders/manual", "/traders/prop-firms"];

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

let totalPuntos = 0;
const atrapados = [];

for (const ruta of RUTAS) {
  await page.goto(BASE + ruta, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2600);
  const alto = await page.evaluate(() => document.documentElement.scrollHeight);
  // Toma hasta 5 posiciones de página repartidas por el documento.
  const paradas = [0];
  for (let s = 900; s < alto - 400; s += Math.max(900, Math.floor((alto - 900) / 4))) paradas.push(s);
  for (const parada of paradas.slice(0, 6)) {
    await page.evaluate((y) => window.scrollTo(0, y), parada);
    await page.waitForTimeout(500);
    // Rejilla de 8 puntos del viewport. Cada sonda parte de la MISMA
    // posición (las sondas acumulaban scroll y las últimas caían donde
    // ya no quedaba página que bajar).
    for (const [fx, fy] of [[0.15, 0.2], [0.5, 0.2], [0.85, 0.2], [0.15, 0.5], [0.5, 0.5], [0.85, 0.5], [0.15, 0.8], [0.5, 0.8], [0.85, 0.8]]) {
      const x = Math.round(1440 * fx);
      const y = Math.round(900 * fy);
      await page.evaluate((sy) => window.scrollTo(0, sy), parada);
      await page.waitForTimeout(250);
      const antes = await page.evaluate(
        () => [window.scrollY, ...[...document.querySelectorAll("*")].filter(el => {
          const cs = getComputedStyle(el);
          return (cs.overflowY === "auto" || cs.overflowY === "scroll") && el.scrollHeight > el.clientHeight + 4;
        }).slice(0, 8).map(el => el.scrollTop)]
      );
      await page.mouse.move(x, y);
      await page.mouse.wheel(0, 240);
      await page.waitForTimeout(140);
      const despues = await page.evaluate(
        () => [window.scrollY, ...[...document.querySelectorAll("*")].filter(el => {
          const cs = getComputedStyle(el);
          return (cs.overflowY === "auto" || cs.overflowY === "scroll") && el.scrollHeight > el.clientHeight + 4;
        }).slice(0, 8).map(el => el.scrollTop)]
      );
      totalPuntos++;
      const delta = despues[0] - antes[0];
      // Algo se mueve (página o un scrollable interno): el gesto vive.
      const internoSeMueve = despues.some((d, i) => i > 0 && antes[i] !== undefined && d !== antes[i]);
      if (delta < 60 && !internoSeMueve) {
        const info = await page.evaluate(([px, py]) => {
          const el = document.elementFromPoint(px, py);
          if (!el) return "nada";
          let a = el;
          const cad = [];
          while (a && a !== document.documentElement && cad.length < 4) {
            const cs = getComputedStyle(a);
            if (cs.overflowX !== "visible" || cs.overflowY !== "visible" || cs.overscrollBehavior !== "auto")
              cad.push(`${a.tagName.toLowerCase()}.${(typeof a.className === "string" ? a.className : "").split(" ")[0]} ob=${cs.overscrollBehavior}`);
            a = a.parentElement;
          }
          return `${el.tagName.toLowerCase()}.${typeof el.className === "string" ? el.className.split(" ")[0] : ""} < ${cad.join(" < ")}`;
        }, [x, y]);
        // Al final del documento no hay abajo que bajar: no es atrapamiento.
        const alFinal = alto - (despues[0] + 900) < 60;
        if (!alFinal) atrapados.push(`${ruta} @scroll ${parada} punto(${x},${y}) delta=${delta} → ${info}`);
      }
    }
  }
  console.log(`barrido ${ruta}: ok`);
}

await browser.close();
console.log(`\n${totalPuntos} puntos probados en ${RUTAS.length} rutas`);
if (atrapados.length) {
  console.log("PUNTOS ATRAPADOS:");
  atrapados.forEach((a) => console.log("  " + a));
  process.exit(1);
} else {
  console.log("NINGÚN punto atrapa la rueda");
}
