import { describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { join } from "node:path";

/**
 * La muestra de demo debe dar lo mismo en cualquier huso: leer las horas en
 * hora local daba un desajuste de hidratación (`React error #418`) que solo
 * se veía en el sitio publicado. Cada huso corre en un proceso aparte (el
 * motor lee `TZ` al arrancar y `data.ts` calcula la muestra al importarse).
 *
 * Husos: UTC (el del servidor), Europe/Madrid y Pacific/Kiritimati (+14: los
 * husos por delante de UTC mueven una operación al día siguiente).
 */

const RAIZ = process.cwd();

const GUION = join(RAIZ, "tests", "fixtures", "resumen-muestra.mjs");

/**
 * Ejecuta el resumen de la muestra bajo un huso concreto, en su propio
 * proceso y con el mismo motor que corre la suite (`process.execPath`: bun o
 * node, que importan el `.ts` directamente). `--no-warnings` silencia el
 * aviso de módulo sin tipo de node.
 */
function resumenBajoHuso(tz: string, ...extra: string[]): string {
  return execFileSync(process.execPath, ["--no-warnings", GUION, ...extra], {
    encoding: "utf8",
    env: { ...process.env, TZ: tz },
    cwd: RAIZ,
    timeout: 60_000,
  }).trim();
}

describe("la muestra de demo no depende del huso horario de la máquina", () => {
  const HUSOS = ["UTC", "Europe/Madrid", "Pacific/Kiritimati"];

  it("las métricas, el mapa de calor y el calendario salen idénticos en los tres", () => {
    const [utc, ...resto] = HUSOS.map((tz) => resumenBajoHuso(tz));
    for (let i = 0; i < resto.length; i++) {
      expect(
        resto[i],
        `Bajo ${HUSOS[i + 1]} la muestra no coincide con la de UTC. Alguna ` +
          `fecha se está escribiendo o leyendo en hora local: busca ` +
          `\`setHours\`, \`getDay\`, \`getHours\`, \`getMonth\`, \`getDate\` o un ` +
          `\`Intl.DateTimeFormat\` sin \`timeZone\` sobre la fecha de una ` +
          `operación.`,
      ).toBe(utc);
    }
  });

  it("la prueba puede fallar: en hora local los tres husos SÍ divergen", () => {
    // Sin esto, la prueba de arriba seguiría en verde aunque mirase un valor
    // que no depende de la fecha: se recalcula con los métodos locales (la
    // versión defectuosa) y se exige que los husos discrepen.
    const local = HUSOS.map((tz) => resumenBajoHuso(tz, "--local"));
    expect(
      new Set(local).size,
      "Leyendo las mismas fechas en hora local, los tres husos deberían dar " +
        "resultados distintos. Si dan el mismo, la comprobación de arriba no " +
        "está demostrando nada.",
    ).toBeGreaterThan(1);
  });
});
