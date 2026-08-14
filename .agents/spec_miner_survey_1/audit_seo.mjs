import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = process.cwd();
const OUT = join(ROOT, "out");

function getHtmlFiles(dir) {
  const entries = readdirSync(dir, { withFileTypes: true });
  let files = [];
  for (const e of entries) {
    const full = join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === "_next") continue;
      files.push(...getHtmlFiles(full));
    } else if (e.name.endsWith(".html")) {
      files.push(full);
    }
  }
  return files;
}

const htmlFiles = getHtmlFiles(OUT);
console.log("Total HTML files in out/:", htmlFiles.length);

const descIssues = [];
const titleIssues = [];
const h1Issues = [];
const canonicalIssues = [];
const hreflangIssues = [];
const ogIssues = [];
const twitterIssues = [];
const jsonLdSummary = {};
const routeMetadata = [];

for (const f of htmlFiles) {
  const rel = relative(OUT, f).replace(/\\/g, "/");
  const html = readFileSync(f, "utf8");

  // Skip 404 / _not-found
  if (rel.includes("404") || rel.includes("_not-found")) continue;

  // Title
  const titleMatch = html.match(/<title>([^<]*)<\/title>/i);
  const title = titleMatch ? titleMatch[1] : "";
  if (!title) {
    titleIssues.push({ file: rel, issue: "missing title" });
  }

  // Description
  const descMatch =
    html.match(/<meta\s+name=["']description["']\s+content=["']([^"']*)["']/i) ||
    html.match(/<meta\s+content=["']([^"']*)["']\s+name=["']description["']/i);
  const desc = descMatch ? descMatch[1] : "";
  if (!desc) {
    descIssues.push({ file: rel, issue: "missing description" });
  } else if (desc.length > 160) {
    descIssues.push({ file: rel, issue: `description too long (${desc.length} chars)`, desc });
  }

  // H1
  const h1Matches = html.match(/<h1\b[^>]*>[\s\S]*?<\/h1>/gi) || [];
  const cleanH1s = h1Matches.map((h) => h.replace(/<[^>]+>/g, "").trim().replace(/\s+/g, " "));
  if (h1Matches.length !== 1) {
    h1Issues.push({ file: rel, count: h1Matches.length, h1s: cleanH1s });
  }

  // Canonical
  const canonMatch =
    html.match(/<link\s+[^>]*rel=["']canonical["'][^>]*href=["']([^"']*)["']/i) ||
    html.match(/<link\s+[^>]*href=["']([^"']*)["'][^>]*rel=["']canonical["']/i);
  const canonical = canonMatch ? canonMatch[1] : "";
  if (!canonical) {
    canonicalIssues.push({ file: rel, issue: "missing canonical" });
  }

  // Hreflang
  const hreflangs = [];
  const hreflangRegex = /<link\s+[^>]*hreflang=["']([^"']+)["'][^>]*href=["']([^"']+)["'][^>]*>/gi;
  let hm;
  while ((hm = hreflangRegex.exec(html)) !== null) {
    hreflangs.push({ lang: hm[1], href: hm[2] });
  }
  const hreflangRegex2 = /<link\s+[^>]*href=["']([^"']+)["'][^>]*hreflang=["']([^"']+)["'][^>]*>/gi;
  let hm2;
  while ((hm2 = hreflangRegex2.exec(html)) !== null) {
    hreflangs.push({ lang: hm2[2], href: hm2[1] });
  }

  if (hreflangs.length === 0) {
    hreflangIssues.push({ file: rel, issue: "missing hreflang" });
  }

  // OG
  const ogTitleMatch = html.match(/<meta\s+[^>]*property=["']og:title["'][^>]*content=["']([^"']*)["']/i) ||
                       html.match(/<meta\s+[^>]*content=["']([^"']*)["'][^>]*property=["']og:title["']/i);
  const ogDescMatch = html.match(/<meta\s+[^>]*property=["']og:description["'][^>]*content=["']([^"']*)["']/i) ||
                      html.match(/<meta\s+[^>]*content=["']([^"']*)["'][^>]*property=["']og:description["']/i);
  const ogUrlMatch = html.match(/<meta\s+[^>]*property=["']og:url["'][^>]*content=["']([^"']*)["']/i) ||
                     html.match(/<meta\s+[^>]*content=["']([^"']*)["'][^>]*property=["']og:url["']/i);
  const ogImageMatch = html.match(/<meta\s+[^>]*property=["']og:image["'][^>]*content=["']([^"']*)["']/i) ||
                       html.match(/<meta\s+[^>]*content=["']([^"']*)["'][^>]*property=["']og:image["']/i);

  const ogTitle = ogTitleMatch ? ogTitleMatch[1] : "";
  const ogDesc = ogDescMatch ? ogDescMatch[1] : "";
  const ogUrl = ogUrlMatch ? ogUrlMatch[1] : "";
  const ogImage = ogImageMatch ? ogImageMatch[1] : "";

  if (!ogTitle || !ogImage) {
    ogIssues.push({ file: rel, ogTitle: !!ogTitle, ogImage: !!ogImage });
  }

  // Twitter
  const twCardMatch = html.match(/<meta\s+[^>]*name=["']twitter:card["'][^>]*content=["']([^"']*)["']/i) ||
                      html.match(/<meta\s+[^>]*content=["']([^"']*)["'][^>]*name=["']twitter:card["']/i);
  const twImageMatch = html.match(/<meta\s+[^>]*name=["']twitter:image["'][^>]*content=["']([^"']*)["']/i) ||
                       html.match(/<meta\s+[^>]*content=["']([^"']*)["'][^>]*name=["']twitter:image["']/i);
  const twCard = twCardMatch ? twCardMatch[1] : "";
  const twImage = twImageMatch ? twImageMatch[1] : "";
  if (!twCard || !twImage) {
    twitterIssues.push({ file: rel, twCard: !!twCard, twImage: !!twImage });
  }

  // JSON-LD
  const schemas = [];
  const jsonLdRegex = /<script\s+type=["']application\/ld\+json["']>([\s\S]*?)<\/script>/gi;
  let jm;
  while ((jm = jsonLdRegex.exec(html)) !== null) {
    try {
      const parsed = JSON.parse(jm[1]);
      if (Array.isArray(parsed)) {
        parsed.forEach((p) => {
          schemas.push(p["@type"]);
          jsonLdSummary[p["@type"]] = (jsonLdSummary[p["@type"]] || 0) + 1;
        });
      } else {
        schemas.push(parsed["@type"]);
        jsonLdSummary[parsed["@type"]] = (jsonLdSummary[parsed["@type"]] || 0) + 1;
      }
    } catch (e) {}
  }

  routeMetadata.push({
    file: rel,
    title,
    titleLen: title.length,
    desc,
    descLen: desc.length,
    h1Count: h1Matches.length,
    h1: cleanH1s[0] || "",
    canonical,
    hreflangsCount: hreflangs.length,
    ogImage,
    schemas,
  });
}

console.log("Audited pages count:", routeMetadata.length);
console.log("Description issues (missing or >160):", descIssues.length);
if (descIssues.length) console.log("Desc issues detail:", descIssues);

console.log("Title issues:", titleIssues.length);
console.log("H1 issues (count != 1):", h1Issues.length);
console.log("Canonical issues:", canonicalIssues.length);
console.log("Hreflang issues:", hreflangIssues.length);
console.log("OG issues:", ogIssues.length);
console.log("Twitter issues:", twitterIssues.length);
console.log("JSON-LD schemas breakdown:", jsonLdSummary);
