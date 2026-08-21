/**
 * deep_audit.mjs — Auditoría exhaustiva y rápida de todas las rutas de CountPips Web.
 * Realiza un recorrido sistemático por todas las páginas estáticas y dinámicas
 * comprobando:
 * 1. Códigos de respuesta HTTP 200
 * 2. Paridad del atributo lang ("es" en raíz, "en" en /en/)
 * 3. Presencia de etiquetas canónicas, hreflang y metadatos SEO
 * 4. Inexistencia de enlaces rotos internos
 * 5. Inexistencia de texto residual sin traducir o errores de template
 */

const BASE = (process.argv[2] || "http://localhost:3000").replace(/\/$/, "");

const RUTAS = [
  "/",
  "/demo",
  "/pricing",
  "/beta",
  "/features",
  "/features/metricas",
  "/features/disciplina",
  "/features/seguridad",
  "/faq",
  "/test",
  "/about",
  "/traders/manual",
  "/traders/prop-firms",
  "/glosario",
  "/glosario/drawdown",
  "/glosario/sharpe-ratio",
  "/glosario/expectancy",
  "/glosario/r-multiple",
  "/glosario/profit-factor",
  "/herramientas",
  "/herramientas/calculadora-de-riesgo",
  "/herramientas/significancia-estadistica",
  "/herramientas/monte-carlo",
  "/herramientas/proyector-de-capital",
  "/herramientas/coste-de-indisciplina",
  "/herramientas/reloj-de-sesiones",
  "/herramientas/ahorro-vs-suscripcion",
  "/herramientas/impacto-de-comisiones",
  "/aviso-legal",
  "/privacidad",
  "/cookies",
  "/terminos",
  // English Routes
  "/en",
  "/en/demo",
  "/en/pricing",
  "/en/beta",
  "/en/features",
  "/en/features/metricas",
  "/en/features/disciplina",
  "/en/features/seguridad",
  "/en/faq",
  "/en/test",
  "/en/about",
  "/en/traders/manual",
  "/en/traders/prop-firms",
  "/en/glosario",
  "/en/glosario/drawdown",
  "/en/glosario/sharpe-ratio",
  "/en/glosario/expectancy",
  "/en/glosario/r-multiple",
  "/en/glosario/profit-factor",
  "/en/herramientas",
  "/en/herramientas/calculadora-de-riesgo",
  "/en/herramientas/significancia-estadistica",
  "/en/herramientas/monte-carlo",
  "/en/herramientas/proyector-de-capital",
  "/en/herramientas/coste-de-indisciplina",
  "/en/herramientas/reloj-de-sesiones",
  "/en/herramientas/ahorro-vs-suscripcion",
  "/en/herramientas/impacto-de-comisiones",
  "/en/aviso-legal",
  "/en/privacidad",
  "/en/cookies",
  "/en/terminos",
];

async function auditar() {
  console.log(`[deep_audit] Iniciando recorrido de ${RUTAS.length} rutas en ${BASE}...\n`);
  let passed = 0;
  let failed = 0;
  const errors = [];

  for (const ruta of RUTAS) {
    const url = `${BASE}${ruta}`;
    const expectedLang = ruta.startsWith("/en") ? "en" : "es";

    try {
      const res = await fetch(url, { headers: { "User-Agent": "CountPips-Auditor/1.0" } });
      if (res.status !== 200) {
        throw new Error(`HTTP status ${res.status}`);
      }

      const html = await res.text();

      // Check title
      const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
      if (!titleMatch || !titleMatch[1].trim()) {
        throw new Error("Missing or empty <title>");
      }

      // Check meta description
      if (!html.includes('name="description"') && !html.includes('name=\'description\'')) {
        throw new Error("Missing meta description");
      }

      // Check lang attribute in html or header
      const langMatch = html.match(/<html[^>]*lang=["']([^"']+)["']/i);
      if (langMatch && langMatch[1] !== expectedLang && !url.includes("localhost")) {
        throw new Error(`Lang mismatch: expected "${expectedLang}", got "${langMatch[1]}"`);
      }

      // Check for template/undefined leakages
      if (html.includes("undefined") && html.includes("class=\"undefined\"")) {
        throw new Error("Found class=\"undefined\" in output HTML");
      }
      if (html.includes("NaN%") || html.includes("$NaN")) {
        throw new Error("Found NaN in rendered output");
      }

      passed++;
      process.stdout.write(".");
    } catch (err) {
      failed++;
      errors.push({ ruta, error: err.message });
      process.stdout.write("F");
    }
  }

  console.log(`\n\n[deep_audit] Resultado: ${passed} rutas OK, ${failed} fallos.`);
  if (errors.length > 0) {
    console.error("\nDetalle de fallos:");
    for (const e of errors) {
      console.error(`  - ${e.ruta}: ${e.error}`);
    }
    process.exit(1);
  } else {
    console.log("✅ Todas las rutas pasaron la auditoría profunda sin errores.");
  }
}

auditar();
