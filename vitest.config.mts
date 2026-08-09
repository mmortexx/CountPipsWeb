import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

/**
 * Configuración de pruebas.
 *
 * El proyecto no tenía NINGUNA prueba. Eso no era un descuido menor: el
 * histograma de la portada llevaba las pérdidas pintadas de verde y las
 * ganancias de rojo, el rótulo anunciaba 60 operaciones sobre una muestra
 * de 200, el drawdown se declaraba dos puntos mejor de lo que era, y el
 * campo trampa antibot del Worker leía un nombre que ningún cliente
 * envía. Los cuatro son fallos que una prueba de tres líneas caza al
 * instante y que una lectura del código puede pasar por alto durante
 * meses — como pasó.
 *
 * El objetivo de esta carpeta no es cobertura: es que las cosas que ya se
 * rompieron una vez no puedan volver a romperse en silencio.
 *
 * `environment: "node"` a propósito — aquí no se prueban componentes de
 * React, se prueban los cálculos y los contratos de datos, que es donde
 * estaban los fallos y donde una prueba no necesita un navegador para ser
 * útil.
 */
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
});
