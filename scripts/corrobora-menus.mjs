// Corroboración funcional de menús y navegación de toda la web.
import { chromium } from "playwright";

const args = process.argv.slice(2);
const flag = (n, d) => { const i = args.indexOf(`--${n}`); return i >= 0 ? args[i + 1] : d; };
const BASE = flag("base", "http://localhost:3000");
const res = [];
const ok = (nombre, cond, detalle = "") =>
  res.push(`${cond ? "OK " : "FALLA"} · ${nombre}${detalle ? " — " + detalle : ""}`);

const browser = await chromium.launch();

/* ─────────── Escritorio ─────────── */
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(BASE + "/", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(3500);

// 1. Megamenú Producto: hover abre.
await page.getByRole("button", { name: "Producto" }).hover();
await page.waitForTimeout(600);
const menuItems = await page.getByRole("menuitem").count();
ok("megamenú abre al hover", menuItems >= 4, `${menuItems} entradas`);

// 2. Navega por una entrada del megamenú.
await page.getByRole("menuitem").filter({ hasText: /Disciplina|Discipline/ }).first().click();
await page.waitForURL("**/features/disciplina", { timeout: 8000 });
ok("megamenú navega a /features/disciplina", page.url().endsWith("/features/disciplina"));

// 3. Barra: enlaces directos.
for (const [ruta, patron] of [
  ["/demo", /^Demo$/],
  ["/traders/manual", /^Manual$/],
]) {
  await page.locator("header").getByRole("link", { name: patron }).first().click();
  await page.waitForURL(`**${ruta}`, { timeout: 8000 });
  ok(`barra navega a ${ruta}`, page.url().includes(ruta));
}

// 4. La paleta de comandos ⌘K se retiro del sitio: un sitio de
//    marketing con siete enlaces de navegacion no tenia que buscar. Lo
//    que queda es comprobar que el atajo NO abre nada, para que no vuelva
//    a colarse por descuido.
await page.keyboard.press("Control+k");
await page.waitForTimeout(700);
ok("Ctrl+K ya no abre ninguna paleta", (await page.getByRole("combobox").count()) === 0);

// 5. Glosario Ctrl+G (modal Radix; nombre del DialogTitle).
await page.keyboard.press("Control+g");
await page.waitForTimeout(900);
const glossary = page.getByRole("dialog", { name: /Términos de trading|Trading terms/ });
ok("Ctrl+G abre el glosario modal", (await glossary.count()) === 1);
const terminos = await glossary.getByRole("option").count();
ok("glosario lista términos", terminos > 10, `${terminos} términos`);
await page.keyboard.press("Escape");
await page.waitForTimeout(500);

// 6. Ayuda de atajos con «?».
await page.keyboard.press("?");
await page.waitForTimeout(700);
ok(
  "«?» abre la ayuda de atajos",
  (await page.getByRole("dialog", { name: /Atajos de teclado|Keyboard shortcuts/ }).count()) === 1
);
await page.keyboard.press("Escape");

// 7. Pie.
await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
await page.waitForTimeout(900);
const footer = page.getByRole("contentinfo");
const enlacesPie = await footer.getByRole("link").count();
ok("pie con enlaces", enlacesPie >= 8, `${enlacesPie} enlaces`);
ok(
  "pie enlaza aviso legal",
  (await footer.getByRole("link", { name: /Aviso legal|Legal/ }).count()) >= 1
);

// 8. Volver arriba.
const subir = page.getByRole("button", { name: /arriba|top/i }).first();
if (!(await subir.count())) {
  ok("botón volver arriba presente", false, "no encontrado");
} else {
  await subir.click();
  await page.waitForTimeout(1400);
  const y = await page.evaluate(() => window.scrollY);
  ok("volver arriba funciona", y < 60, `scrollY=${Math.round(y)}`);
}

// 9. Cambio de idioma ES → EN con el selector listbox de la barra.
await page.getByRole("button", { name: /Idioma|Language/ }).first().click().catch(async () => {
  await page.locator('header [aria-haspopup="listbox"]').first().click();
});
await page.waitForTimeout(500);
await page.getByRole("option", { name: "English" }).click();
await page.waitForURL("**/en/**", { timeout: 9000 }).catch(() => {});
const enUrl = /\/en/.test(page.url());
ok("selector de idioma lleva a /en", enUrl, page.url());
if (enUrl) {
  await page.waitForTimeout(1200);
  const htmlLang = await page.evaluate(() => document.documentElement.lang);
  ok("<html lang> corrige a en", htmlLang === "en", htmlLang);
  const h1 = await page.locator("h1").first().innerText();
  ok("h1 en inglés", !/[áéíóúñ]/.test(h1), h1.slice(0, 44));
  // Lo que comprobaba la paleta en ingles —que se puede llegar a
  // /en/pricing desde la version inglesa— lo comprueba ahora la barra,
  // que es por donde se navega desde que la paleta se retiro.
  // «Precios» no es un enlace de primer nivel de la barra: vive en el
  // megamenu y en el pie. Se busca en toda la pagina.
  await page.getByRole("link", { name: /^Pricing$/ }).first().click();
  await page.waitForURL("**/en/pricing**", { timeout: 8000 }).catch(() => {});
  ok("la barra EN navega a /en/pricing", /\/en\/pricing/.test(page.url()), page.url());
}

/* ─────────── Móvil 390×844 ─────────── */
const mob = await browser.newPage({ viewport: { width: 390, height: 844 } });
await mob.goto(BASE + "/", { waitUntil: "domcontentloaded" });
await mob.waitForTimeout(3000);

// 10. Cajón móvil.
const menuBtn = mob.getByRole("button", { name: /Abrir menú|Open menu/ });
if (!(await menuBtn.count())) {
  ok("botón de menú en móvil", false, "no encontrado");
} else {
  const box = await menuBtn.first().boundingBox();
  ok(
    "botón menú ≥44px",
    !!box && box.height >= 44,
    box ? `${Math.round(box.width)}x${Math.round(box.height)}` : ""
  );
  await menuBtn.first().click();
  await mob.waitForTimeout(800);
  const cajonLinks = await mob.locator('[data-visible="true"] a').count();
  ok("cajón móvil abre con enlaces", cajonLinks >= 4, `${cajonLinks} enlaces`);
  const destino = mob.locator('[data-visible="true"] a[href*="pricing"]').first();
  if ((await destino.count()) === 1) {
    await destino.click();
    await mob.waitForURL("**/pricing", { timeout: 9000 });
    await mob.waitForTimeout(700);
    const visibleTrasNavegar = await mob.locator('[data-visible="true"] a').count();
    ok("cajón navega y se cierra", visibleTrasNavegar === 0);
  } else {
    ok("cajón contiene enlace a precios", false);
  }
}

// 11. Sin desbordamiento horizontal en móvil.
for (const ruta of ["/", "/features", "/pricing", "/demo", "/herramientas", "/glosario", "/faq"]) {
  await mob.goto(BASE + ruta, { waitUntil: "domcontentloaded" });
  await mob.waitForTimeout(1800);
  const over = await mob.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth
  );
  ok(`sin overflow móvil ${ruta}`, over <= 0, `${over}px`);
}

await browser.close();
console.log(res.join("\n"));
const fallos = res.filter((r) => r.startsWith("FALLA"));
console.log(`\n${res.length - fallos.length}/${res.length} comprobaciones correctas`);
process.exit(fallos.length ? 1 : 0);
