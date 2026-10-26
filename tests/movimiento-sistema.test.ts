import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * El sistema de movimiento de PROJECT.md («Movimiento»), leído en la hoja y en
 * los componentes: cuatro duraciones y dos curvas como tokens, y ninguna
 * animación ni transición que se salga de ellos. Una duración escrita a mano
 * (`0.9s`, `duration-300`) o una curva copiada (`cubic-bezier(…)`) es justo lo
 * que hizo que la portada tardara 2 s en asentarse con quince tempos distintos.
 */

const SRC = join(process.cwd(), "src");
const CSS = readFileSync(join(SRC, "app", "globals.css"), "utf8");

type Regla = { padres: string[]; cuerpo: string };

/** Reglas con sus declaraciones directas y la cadena de selectores y @-reglas que las envuelven. */
function reglas(css: string): Regla[] {
  const limpio = css.replace(/\/\*[\s\S]*?\*\//g, "");
  const out: Regla[] = [];
  const recorrer = (texto: string, padres: string[]) => {
    let directo = "";
    let inicio = 0;
    let i = 0;
    while (i < texto.length) {
      const c = texto[i];
      if (c === "{") {
        const prelude = texto.slice(inicio, i).trim();
        let d = 1;
        let j = i + 1;
        while (d && j < texto.length) {
          if (texto[j] === "{") d++;
          else if (texto[j] === "}") d--;
          j++;
        }
        recorrer(texto.slice(i + 1, j - 1), [...padres, prelude]);
        i = j;
        inicio = j;
        continue;
      }
      if (c === ";") {
        directo += texto.slice(inicio, i + 1);
        inicio = i + 1;
      }
      i++;
    }
    directo += texto.slice(inicio);
    if (padres.length) out.push({ padres, cuerpo: directo });
  };
  recorrer(limpio, []);
  return out;
}

function declaraciones(cuerpo: string): Array<[string, string]> {
  return cuerpo
    .split(";")
    .map((d) => d.trim())
    .filter((d) => d.includes(":"))
    .map((d) => {
      const k = d.indexOf(":");
      return [d.slice(0, k).trim(), d.slice(k + 1).replace(/!important/, "").trim()] as [string, string];
    });
}

/** Parte por comas de primer nivel (no las de dentro de `var()` o `calc()`). */
function porComas(valor: string): string[] {
  const out: string[] = [];
  let d = 0;
  let ini = 0;
  for (let i = 0; i < valor.length; i++) {
    if (valor[i] === "(") d++;
    else if (valor[i] === ")") d--;
    else if (valor[i] === "," && d === 0) {
      out.push(valor.slice(ini, i).trim());
      ini = i + 1;
    }
  }
  out.push(valor.slice(ini).trim());
  return out;
}

const PROPS_TIEMPO = /^(transition|animation)(-duration|-delay)?$/;
const PROPS_CURVA = /^(transition|animation)(-timing-function)?$/;
const reducido = (r: Regla) => r.padres.some((p) => /prefers-reduced-motion:\s*reduce/.test(p));

/** Duraciones escritas a mano: cualquier cifra con `s`/`ms` fuera de un `var()`. Cero no cuenta. */
function tiemposSueltos(css: string): string[] {
  const hallados: string[] = [];
  for (const r of reglas(css)) {
    for (const [prop, valor] of declaraciones(r.cuerpo)) {
      if (!PROPS_TIEMPO.test(prop)) continue;
      for (const m of valor.matchAll(/(?<![\w.-])(\d*\.?\d+)(ms|s)\b/g)) {
        if (Number(m[1]) === 0) continue;
        // La regla global de movimiento reducido lleva todo a 0,01 ms a propósito.
        if (reducido(r) && m[0] === "0.01ms") continue;
        hallados.push(`${r.padres.at(-1)} { ${prop}: ${valor} }`);
        break;
      }
    }
  }
  return hallados;
}

/** Curvas que no son uno de los dos tokens (o `linear`, el reloj de las animaciones atadas al scroll). */
function curvasSueltas(css: string): string[] {
  const hallados: string[] = [];
  for (const r of reglas(css)) {
    for (const [prop, valor] of declaraciones(r.cuerpo)) {
      if (!PROPS_CURVA.test(prop) || /^(none|initial|inherit)$/.test(valor)) continue;
      for (const item of porComas(valor)) {
        const sinTokens = item.replace(/var\(--ease-(suave|acelera)\)/g, "");
        const suelta = /cubic-bezier|steps\(|\bease(-in|-out|-in-out)?\b|var\(--ease-/.test(sinTokens);
        // Una transición abreviada sin curva usa `ease`, el defecto de CSS: también es suelta,
        // salvo que no dure nada (`visibility 0s`).
        const sinCurva =
          prop === "transition" &&
          !/var\(--ease-(suave|acelera)\)|\blinear\b/.test(item) &&
          !/^[\w-]+\s+0m?s(\s|$)/.test(item) &&
          item !== "none";
        if (suelta || sinCurva) {
          hallados.push(`${r.padres.at(-1)} { ${prop}: ${item} }`);
        }
      }
    }
  }
  return hallados;
}

function tokens(css: string, prefijo: string): Map<string, string> {
  const out = new Map<string, string>();
  for (const r of reglas(css)) {
    if (r.padres.at(-1) !== ":root") continue;
    for (const [prop, valor] of declaraciones(r.cuerpo)) if (prop.startsWith(prefijo)) out.set(prop, valor);
  }
  return out;
}

const ms = (v: string) => (v.endsWith("ms") ? Number(v.slice(0, -2)) : Number(v.slice(0, -1)) * 1000);

/* En los componentes el tiempo se escribe de cuatro maneras: clases de
   Tailwind, estilos en línea, opciones de `el.animate()` y el plazo de
   `usePresencia`. Todas tienen su forma con token. */
const EN_CODIGO: Array<[string, RegExp]> = [
  ["clase de duración o retardo con número", /(?<![\w-])(duration|delay)-(\d|\[)/],
  ["clase de curva propia", /(?<![\w-])ease-(\[|in\b|out\b|in-out\b)/],
  ["curva copiada", /cubic-bezier\(/],
  ["tiempo a mano en un estilo", /(transition|animation|Delay|Duration|"--dm-[a-z]+")\w*"?\s*:\s*[`"'][^`"']*(?<![\w.$-])\d*\.?\d+m?s\b/],
  ["número en `animate()`", /\b(duration|delay)\s*:\s*\d/],
  ["plazo propio de `usePresencia`", /usePresencia\([^()]*,/],
];

function codigoSuelto(nombre: string, texto: string): string[] {
  const hallados: string[] = [];
  texto.split(/\r?\n/).forEach((linea, i) => {
    for (const [que, re] of EN_CODIGO) if (re.test(linea)) hallados.push(`${nombre}:${i + 1} ${que}: ${linea.trim()}`);
  });
  return hallados;
}

// `motion.ts` guarda los valores de respaldo de los tokens: es la única excepción.
const CODIGO = readdirSync(SRC, { recursive: true, encoding: "utf8" })
  .filter((f) => /\.tsx?$/.test(f) && !/(^|[\\/])lib[\\/]motion\.ts$/.test(f))
  .map((f) => [f.replace(/\\/g, "/"), readFileSync(join(SRC, f), "utf8")] as const);

describe("las duraciones y las curvas salen de sus tokens", () => {
  it("el detector caza lo que tiene que cazar", () => {
    const muestra = `
      .a { transition: opacity 0.9s var(--ease-suave); }
      .b { animation: x var(--dur-entra) cubic-bezier(0.1, 0.9, 0.2, 1) both; }
      .c { transition: color 0.2s; }
      .d { transition: opacity var(--dur-estado) var(--ease-suave), visibility 0s; }
      @media (prefers-reduced-motion: reduce) { * { transition-duration: 0.01ms !important; } }
    `;
    expect(tiemposSueltos(muestra)).toEqual([".a { transition: opacity 0.9s var(--ease-suave) }", ".c { transition: color 0.2s }"]);
    expect(curvasSueltas(muestra)).toEqual([
      ".b { animation: x var(--dur-entra) cubic-bezier(0.1, 0.9, 0.2, 1) both }",
      ".c { transition: color 0.2s }",
    ]);
  });

  it("cuatro duraciones, la más larga de 320 ms, y un escalón de cascada", () => {
    const dur = tokens(CSS, "--dur-");
    expect([...dur.keys()].sort()).toEqual(["--dur-abre", "--dur-entra", "--dur-estado", "--dur-pulsa"]);
    expect(Math.max(...[...dur.values()].map(ms))).toBe(320);
    expect(ms(dur.get("--dur-estado")!), "el hover no pasa de 150 ms").toBeLessThanOrEqual(150);
    expect(tokens(CSS, "--escalon").get("--escalon")).toBe("40ms");
  });

  it("dos curvas: una para lo que llega y otra para lo que se va", () => {
    expect([...tokens(CSS, "--ease-").keys()].sort()).toEqual(["--ease-acelera", "--ease-suave"]);
  });

  it("ninguna animación ni transición de globals.css escribe su duración a mano", () => {
    expect(tiemposSueltos(CSS)).toEqual([]);
  });

  it("ninguna escribe su curva a mano ni se queda con el `ease` por defecto", () => {
    expect(curvasSueltas(CSS)).toEqual([]);
  });

  it("el detector de componentes caza cada forma de escribir el tiempo a mano", () => {
    const muestra = [
      `<a className="transition-colors duration-150 ease-[var(--x)]" />`,
      `<b className="motion-safe:delay-[250ms] ease-out" />`,
      `style={{ transition: "width 0.3s var(--ease-suave)", "--dm-dur": "0.6s", animationDelay: "0.2s" }}`,
      `el.animate(k, { duration: 350, easing: "cubic-bezier(0.22, 1, 0.36, 1)" });`,
      `const p = usePresencia(open, 180);`,
      `<ok className="duration-(--dur-abre) ease-(--ease-suave)" style={{ "--dm-retardo": \`calc(var(--escalon) * \${i})\` }} />`,
    ].join("\n");
    expect(codigoSuelto("m", muestra).map((h) => h.slice(0, h.indexOf(": ")))).toEqual([
      "m:1 clase de duración o retardo con número",
      "m:1 clase de curva propia",
      "m:2 clase de duración o retardo con número",
      "m:2 clase de curva propia",
      "m:3 tiempo a mano en un estilo",
      "m:4 curva copiada",
      "m:4 número en `animate()`",
      "m:5 plazo propio de `usePresencia`",
    ]);
  });

  it("ningún componente escribe su duración, su retardo ni su curva a mano", () => {
    expect(CODIGO.length).toBeGreaterThan(50);
    expect(CODIGO.flatMap(([f, t]) => codigoSuelto(f, t))).toEqual([]);
  });
});

/* Lo que se mueve, se mueve con transform u opacidad: el navegador lo hace sin
   recalcular la página. Los cambios de tono de un estado (color, fondo, filete,
   anillo de foco, filtro de tono) también valen: no mueven nada de sitio. Lo
   demás, solo con su porqué escrito aquí. */
const PROPS_LIBRES = new Set([
  "transform", "translate", "scale", "rotate", "opacity", "visibility",
  "color", "background-color", "border-color", "outline-color", "text-decoration-color",
  "fill", "stroke", "filter", "box-shadow",
]);

const EXCEPCIONES_CSS: Array<[RegExp, string, string]> = [
  [/tj-pliegue|tj-dm-despliega|tj-dm-pliega/, "grid-template-rows", "un pliegue que se abre empuja lo de debajo, y eso solo lo hace la maqueta"],
  [/tj-dm-anillo|tj-dm-traza/, "stroke-dashoffset", "un trazo SVG que se dibuja: no hay transform que lo haga"],
  [/tj-metricas-trazo|lamina/, "clip-path", "la curva y la captura se descubren recortadas, sin deformarse"],
  [/\.tj-dm-ancho/, "width", "barra que sigue a un valor dentro de una pista de tamaño fijo: escalarla deformaría su radio en reposo"],
  [/\.tj-dm-alto/, "height", "la misma barra, en vertical"],
  [/\.tj-metricas-(guia|punto)/, "left", "trasladada, la guía de 1 px quedaba a medio píxel y borrosa; son piezas sueltas"],
  [/\.tj-metricas-punto/, "top", "el punto que acompaña a la guía"],
];

/** Propiedades que anima cada regla: las de sus `transition` y las de sus `@keyframes`. */
function propsAnimadas(css: string): Array<[string, string]> {
  const out: Array<[string, string]> = [];
  for (const r of reglas(css)) {
    const marco = r.padres.find((p) => p.startsWith("@keyframes"));
    for (const [prop, valor] of declaraciones(r.cuerpo)) {
      if (marco) {
        if (prop !== "animation-timing-function") out.push([marco, prop]);
      } else if (prop === "transition-property") {
        for (const p of porComas(valor)) out.push([r.padres.at(-1)!, p]);
      } else if (prop === "transition" && valor !== "none") {
        for (const item of porComas(valor)) out.push([r.padres.at(-1)!, item.split(/\s+/)[0]]);
      }
    }
  }
  return out;
}

function cssFueraDeSistema(css: string): string[] {
  return propsAnimadas(css)
    .filter(([, prop]) => !PROPS_LIBRES.has(prop) && !prop.startsWith("--"))
    .filter(([quien, prop]) => !EXCEPCIONES_CSS.some(([re, p]) => p === prop && re.test(quien)))
    .map(([quien, prop]) => `${quien}: ${prop}`);
}

/* En los componentes, nada de `transition-all` (anima también la maqueta) y,
   en las listas explícitas, las mismas propiedades. Las barras de valor de las
   herramientas son la excepción de `.tj-dm-ancho`, contadas por fichero: una
   barra nueva que anime su ancho tiene que pasar por aquí. */
const ANCHOS_DE_VALOR: Record<string, number> = {
  "components/marketing/EdgeSignificanceChecker.tsx": 1,
  "components/marketing/DisciplineScore.tsx": 2,
  "components/marketing/DisciplineCost.tsx": 1,
  "components/beta/TraderProfilePage.tsx": 1,
};
const TRAZOS_SVG = new Set(["components/demo/pages/JournalPage.tsx"]);

function tsxFueraDeSistema(nombre: string, texto: string): string[] {
  const hallados = [...texto.matchAll(/(?<![\w-])transition-all\b/g)].map(() => "transition-all");
  const props = [
    ...[...texto.matchAll(/transition-\[([^\]]+)\]/g)].flatMap((m) => m[1].split(",")),
    ...[...texto.matchAll(/transition:\s*["`]([^"`]+)["`]/g)].flatMap((m) => porComas(m[1]).map((i) => i.split(/\s+/)[0])),
  ];
  const anchos = props.filter((p) => p === "width").length;
  if (anchos !== (ANCHOS_DE_VALOR[nombre] ?? 0)) hallados.push(`width ×${anchos}`);
  for (const p of props) {
    if (PROPS_LIBRES.has(p) || p === "width") continue;
    if (p === "stroke-dashoffset" && TRAZOS_SVG.has(nombre)) continue;
    hallados.push(p);
  }
  return hallados.map((h) => `${nombre}: ${h}`);
}

describe("solo se anima transform y opacidad, salvo excepción escrita", () => {
  it("el detector caza la maqueta animada en la hoja y en los componentes", () => {
    const hoja = `
      .a { transition: left var(--dur-pulsa) linear, opacity var(--dur-estado) var(--ease-suave); }
      @keyframes b { from { width: 0; } }
      .tj-pliegue { transition: grid-template-rows var(--dur-abre) var(--ease-suave); }
      .c { transition-property: color, height; }
    `;
    expect(cssFueraDeSistema(hoja)).toEqual([".a: left", "@keyframes b: width", ".c: height"]);
    expect(tsxFueraDeSistema("x.tsx", `className="transition-all" className="transition-[left]" style={{ transition: "width var(--dur-abre) var(--ease-suave)" }}`)).toEqual([
      "x.tsx: transition-all",
      "x.tsx: width ×1",
      "x.tsx: left",
    ]);
  });

  it("globals.css no anima la maqueta fuera de sus excepciones", () => {
    expect(cssFueraDeSistema(CSS)).toEqual([]);
  });

  it("cada excepción sigue en uso", () => {
    const animadas = propsAnimadas(CSS);
    for (const [re, prop] of EXCEPCIONES_CSS) expect(animadas.some(([q, p]) => p === prop && re.test(q)), `${re} ${prop}`).toBe(true);
  });

  it("ningún componente anima la maqueta ni usa `transition-all`", () => {
    expect(CODIGO.flatMap(([f, t]) => tsxFueraDeSistema(f, t))).toEqual([]);
  });
});
