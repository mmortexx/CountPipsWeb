import { describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { join } from "node:path";

/**
 * LA MUESTRA DE DEMO TIENE QUE DAR LO MISMO EN CUALQUIER HUSO HORARIO.
 *
 * ── El fallo que cierra ───────────────────────────────────────────────
 * `data.ts` presume determinismo en su primera línea —semilla fija, nada
 * de azar— y `metricas.test.ts` lo daba por comprobado con una prueba que
 * llamaba dos veces al mismo cálculo en el mismo proceso. Eso demuestra
 * que la función es pura; no demuestra nada sobre el ENTORNO.
 *
 * Y el entorno decidía. Las horas de cierre se fijaban con `setHours` y
 * se leían con `getDay`/`getHours`/`getMonth`, que trabajan en la hora
 * local de la máquina. El sitio se compila en un servidor en UTC y se
 * mira desde el navegador del visitante: dos husos, dos conjuntos de
 * operaciones, los mismos 200 números de partida.
 *
 * Lo que llegaba a pantalla era `Minified React error #418` en la portada
 * publicada —desajuste de hidratación, dos veces—, con la peor caída
 * anunciada como −10,6 % en el HTML servido y −10,0 % un instante
 * después. En local NO se veía: quien compila y quien mira están en el
 * mismo huso, así que la única forma de reproducirlo era abrir el sitio
 * ya publicado. Una prueba que sólo corre en la máquina de casa nunca lo
 * habría visto tampoco — de ahí que ésta cambie el huso a propósito.
 *
 * ── Por qué en un proceso aparte ──────────────────────────────────────
 * `TZ` la lee el motor UNA vez, al arrancar, y `data.ts` calcula la
 * muestra al importarse. Cambiar `process.env.TZ` a mitad de prueba no
 * mueve nada, y borrar el módulo del caché tampoco sirve: el reloj del
 * proceso ya está fijado. La única forma honesta de comprobarlo es
 * levantar un proceso por huso.
 *
 * ── Los tres husos ────────────────────────────────────────────────────
 * · UTC — el del servidor que compila.
 * · Europe/Madrid — el del fundador, +1/+2 según la estación.
 * · Pacific/Kiritimati — +14, el extremo del mundo. Está aquí porque los
 *   husos por delante de UTC son los que mueven una operación al día
 *   SIGUIENTE, y ése es el caso que cambia el mes, la fila del calendario
 *   y el reparto por día de la semana. Un huso por detrás y otro por
 *   delante no son redundantes: fallan por lados distintos.
 */

const RAIZ = process.cwd();

const GUION = join(RAIZ, "tests", "fixtures", "resumen-muestra.mjs");

/**
 * Ejecuta el resumen de la muestra bajo un huso concreto, en su propio
 * proceso.
 *
 * Se lanza con `process.execPath`, o sea con el mismo motor que está
 * corriendo la suite: bun cuando se ejecuta `bun run test`, node si
 * alguien la arranca con node. Los dos importan el `.ts` directamente
 * —bun de siempre, node quitando los tipos desde la 23.6—, así que esto
 * no añade ninguna dependencia ni un paso de compilación.
 *
 * `--no-warnings` silencia el aviso de «módulo sin tipo declarado» que
 * node escribe al importar un `.ts` suelto: no dice nada sobre lo que
 * aquí se mide y ensuciaría la salida de la suite.
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
    /* Sin esto, la comprobación de arriba pasaría igual de verde el día
       que alguien la deje mirando un valor que no depende de la fecha.
       Aquí se recalcula a propósito con los métodos locales —la versión
       defectuosa— y se exige que los tres husos discrepen. Si algún día
       dejaran de hacerlo, es que este fichero ya no está midiendo lo que
       cree medir. */
    const local = HUSOS.map((tz) => resumenBajoHuso(tz, "--local"));
    expect(
      new Set(local).size,
      "Leyendo las mismas fechas en hora local, los tres husos deberían dar " +
        "resultados distintos. Si dan el mismo, la comprobación de arriba no " +
        "está demostrando nada.",
    ).toBeGreaterThan(1);
  });
});
