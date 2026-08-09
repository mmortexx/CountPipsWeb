import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";
import { dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Este fichero llegó a tener VEINTISIETE reglas en "off" y ni un solo
 * comentario que dijera por qué. Un lint que no puede fallar no es una red:
 * es un `exit 0` con más pasos, y encima da la sensación contraria — el
 * despliegue lo ejecuta antes de publicar, así que parecía vigilado.
 *
 * Ahora cada regla apagada tiene su motivo escrito al lado. Si el motivo no
 * se puede escribir, la regla se enciende.
 */
const eslintConfig = [...nextCoreWebVitals, ...nextTypescript, {
  /* Un `eslint-disable` que ya no silencia nada es una nota que miente sobre
     el código que tiene debajo. La lista de reglas apagadas de este fichero
     nació así, en pequeño. */
  linterOptions: {
    reportUnusedDisableDirectives: "error",
  },
  rules: {
    // ── TypeScript ────────────────────────────────────────────────────
    /* Encendida: una variable sin usar suele ser el resto de un refactor a
       medias, y era exactamente el caso que la auditoría venía encontrando.
       El prefijo `_` sigue siendo la forma de decir "sé que no lo uso": hace
       falta en los manejadores que reciben argumentos por firma. */
    "@typescript-eslint/no-unused-vars": ["error", {
      argsIgnorePattern: "^_",
      varsIgnorePattern: "^_",
      caughtErrorsIgnorePattern: "^_",
      ignoreRestSiblings: true,
    }],
    /* La versión de TypeScript ya cubre esto y entiende tipos, enums e
       `import type`; la regla base da falsos positivos con los tres. */
    "no-unused-vars": "off",
    /* Encendida: es un error de escritura, no de estilo. */
    "@typescript-eslint/prefer-as-const": "error",
    /* Apagada a conciencia: el proyecto tipa lo suyo, pero las APIs del
       canvas, los `dataset` del DOM y los payloads de Web3Forms entran como
       `any` y tiparlos a mano sería inventarse un contrato que no controlamos.
       Vigilada por `typecheck`, que sí falla si un `any` se propaga a algo
       que declaramos nosotros. */
    "@typescript-eslint/no-explicit-any": "off",
    /* Apagada: `!` se usa en sitios donde el nulo es imposible por
       construcción (refs de canvas dentro de su propio efecto) y la
       alternativa es un `if` muerto que oscurece la lectura. */
    "@typescript-eslint/no-non-null-assertion": "off",
    /* Apagada: hay dos `@ts-expect-error` con motivo escrito encima. */
    "@typescript-eslint/ban-ts-comment": "off",

    // ── React ─────────────────────────────────────────────────────────
    /* AVISO, no error. Arreglar una dependencia que falta cambia CUÁNDO
       corre un efecto: hacerlo en masa rompe cosas en silencio. Se arregla
       caso a caso, y donde la omisión sea deliberada va un
       `eslint-disable-next-line` con el motivo escrito. */
    "react-hooks/exhaustive-deps": "warn",
    /* Encendida: avisa de efectos que leen algo que cambia durante el
       render, que es la fuente de los desajustes de hidratación — y este
       sitio es export estático, donde eso se ve en producción y no en dev. */
    "react-hooks/purity": "warn",
    /* Apagada: el copy va en español y está lleno de comillas angulares y
       apóstrofos tipográficos. Escaparlos en JSX haría el texto ilegible en
       el fuente sin cambiar una coma de lo que ve el visitante. */
    "react/no-unescaped-entities": "off",
    /* Apagadas: no aportan en un proyecto TypeScript con componentes con
       nombre; `prop-types` es el sistema de tipos anterior a TS. */
    "react/display-name": "off",
    "react/prop-types": "off",
    /* Aquí había `react-compiler/react-compiler: "off"` y
       `@typescript-eslint/no-unused-disable-directive: "off"`. Ninguna de las
       dos existe: el plugin no está instalado y la segunda es un nombre
       inventado. ESLint tolera reglas fantasma mientras estén en "off", así
       que llevaban ahí sin que nadie lo notara — dos de las veintisiete
       "reglas desactivadas" no desactivaban nada. */

    // ── Next.js ───────────────────────────────────────────────────────
    /* Apagada con motivo: `output: "export"` con `images.unoptimized`
       (next.config.ts) hace que `next/image` no aporte nada — no hay
       servidor que redimensione — y sí impone un `loader`. Está razonado en
       ProductPlate.tsx, que es quien sirve las capturas. */
    "@next/next/no-img-element": "off",
    /* Encendida: un `<a href="/pricing">` en vez de `<Link>` fuerza recarga
       completa. Si alguna vez hace falta, se pone el disable con el motivo. */
    "@next/next/no-html-link-for-pages": "error",

    // ── JavaScript ────────────────────────────────────────────────────
    /* Encendidas: cada una de éstas señala código que no hace lo que
       parece. Ninguna es cuestión de gusto. */
    "prefer-const": "error",
    "no-debugger": "error",
    "no-irregular-whitespace": "error",
    "no-case-declarations": "error",
    "no-fallthrough": "error",
    "no-mixed-spaces-and-tabs": "error",
    "no-redeclare": "error",
    "no-unreachable": "error",
    "no-useless-escape": "error",
    /* Encendida con excepción: el `catch {}` vacío es deliberado en los
       accesos a localStorage y matchMedia, donde el navegador puede lanzar
       (modo privado, permisos) y no hay nada que hacer al respecto. */
    "no-empty": ["error", { allowEmptyCatch: true }],
    /* Apagada: TypeScript ya resuelve los identificadores y conoce los
       globales del DOM; la regla base no ve las declaraciones de tipos. */
    "no-undef": "off",
    /* Apagada: los scripts de `scripts/` informan por consola a propósito, y
       en `src/` los avisos van detrás de comprobaciones de entorno. */
    "no-console": "off",
  },
}, {
  /* Google Apps Script, no forma parte del build: se pega tal cual en el
     editor de Google. `doPost` y `doGet` son los puntos de entrada que
     invoca la plataforma, así que ahí nadie los "usa" y nunca lo hará. */
  files: ["docs/waitlist-apps-script.js"],
  rules: { "@typescript-eslint/no-unused-vars": "off" },
}, {
  ignores: [
    "node_modules/**", ".next/**", "out/**", "build/**",
    "next-env.d.ts", "examples/**", "skills",
    /* Bundles que escribe `wrangler dev` al arrancar. Son artefactos, y
       encima entraban en el informe con errores que no se pueden arreglar
       porque el fichero se regenera. */
    "**/.wrangler/**",
  ],
}];

export default eslintConfig;
