import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = process.cwd();

function getSourceFiles(dir) {
  const entries = readdirSync(dir, { withFileTypes: true });
  let files = [];
  for (const e of entries) {
    const full = join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === "node_modules" || e.name === ".next" || e.name === "out" || e.name === ".git") continue;
      files.push(...getSourceFiles(full));
    } else if (/\.(tsx|ts|mjs|js)$/.test(e.name)) {
      files.push(full);
    }
  }
  return files;
}

const allSrc = getSourceFiles(join(ROOT, "src"));

console.log("=== AUDIT D10: EDITORIAL & PROHIBITED TERMS ===");

const PROMISES_OF_PROFIT = [
  /\b(ganancias?\s+garantizada|rentabilidad\s+garantizada|guaranteed\s+profits?|guaranteed\s+returns?|hazte\s+rico|get\s+rich)\b/i,
  /\b(sin\s+riesgo|risk-free|100%\s+seguro|cero\s+riesgo)\b/i,
];

const suspiciousPhrases = [];
allSrc.forEach((f) => {
  const rel = relative(ROOT, f).replace(/\\/g, "/");
  const content = readFileSync(f, "utf8");
  PROMISES_OF_PROFIT.forEach((regex) => {
    const lines = content.split("\n");
    lines.forEach((l, idx) => {
      // Ignore comments and tests
      if (l.trim().startsWith("//") || l.trim().startsWith("/*") || l.trim().startsWith("*")) return;
      if (regex.test(l)) {
        suspiciousPhrases.push({ file: `${rel}:${idx + 1}`, line: l.trim() });
      }
    });
  });
});

console.log("Suspicious profit promise matches:", suspiciousPhrases.length);
if (suspiciousPhrases.length) console.log(suspiciousPhrases);

console.log("=== VERIFYING MANDATORY DISCLAIMERS ===");

// Check tool disclosures
const toolsFile = readFileSync(join(ROOT, "src/lib/herramientas.ts"), "utf8");
console.log("Equity projector arithmetic disclaimer present in herramientas.ts:", toolsFile.includes("aritmética, no una promesa"));
console.log("Savings calculator launch price disclaimer present in herramientas.ts:", toolsFile.includes("precios previstos de lanzamiento"));

const demoStore = readFileSync(join(ROOT, "src/lib/trading/demoStore.ts"), "utf8");
console.log("Demo store deterministic / sample disclaimer:", demoStore.includes("mulberry32") || demoStore.includes("muestra"));

const appDemo = readFileSync(join(ROOT, "src/components/demo/AppDemo.tsx"), "utf8");
console.log("App demo sample disclaimer present:", appDemo.includes("demoSampleData") || appDemo.includes("Datos de muestra"));
