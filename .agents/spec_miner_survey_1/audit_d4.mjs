import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { STR } from "../../src/lib/i18n.js";
import { GLOSSARY } from "../../src/lib/trading/glossary.js";
import { HERRAMIENTAS } from "../../src/lib/herramientas.js";
import { FAQ_ES, FAQ_EN, PRICING_FAQ_ES, PRICING_FAQ_EN } from "../../src/lib/faq.js";
import { DOCUMENTOS_LEGALES } from "../../src/lib/legal/documentos.js";

const ROOT = process.cwd();

console.log("=== AUDIT D4: BILINGUAL PARITY ===");
console.log("1. STR dictionary keys count:", Object.keys(STR).length);
const strKeysMissing = [];
for (const [k, v] of Object.entries(STR)) {
  if (!v.es || !v.en) {
    strKeysMissing.push(k);
  }
}
console.log("   Missing ES or EN in STR:", strKeysMissing);

console.log("2. Glossary terms count:", GLOSSARY.length);
const glossaryMissing = [];
GLOSSARY.forEach((t) => {
  if (!t.term || !t.es || !t.en || !t.category) {
    glossaryMissing.push(t.term || "unknown");
  }
});
console.log("   Glossary terms with missing fields:", glossaryMissing);

console.log("3. Tools count:", HERRAMIENTAS.length);
const toolsMissing = [];
HERRAMIENTAS.forEach((h) => {
  if (!h.slug || !h.tituloEs || !h.tituloEn || !h.h1Es || !h.h1En || !h.descripcionEs || !h.descripcionEn) {
    toolsMissing.push(h.slug);
  }
});
console.log("   Tools with missing bilingual fields:", toolsMissing);

console.log("4. FAQ counts:");
console.log("   FAQ_ES:", FAQ_ES.length, "| FAQ_EN:", FAQ_EN.length);
console.log("   PRICING_FAQ_ES:", PRICING_FAQ_ES.length, "| PRICING_FAQ_EN:", PRICING_FAQ_EN.length);

console.log("5. Legal documents count:", DOCUMENTOS_LEGALES.length);
DOCUMENTOS_LEGALES.forEach((d) => {
  console.log(`   - ${d.slug}: ${d.secciones.length} sections`);
  d.secciones.forEach((s) => {
    if (!s.tituloEs || !s.tituloEn) {
      console.log(`     Section ${s.id} missing title translation!`);
    }
  });
});
