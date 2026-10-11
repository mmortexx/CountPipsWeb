import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { CONEXIONES } from "@/lib/conexiones";
import { PROGRAMA } from "@/lib/producto";

/**
 * Lo que la web cita del programa de escritorio, frente a su código. El programa vive
 * en otro repositorio privado, así que solo corre con `COUNTPIPS_REPO` apuntando a una
 * copia suya: `COUNTPIPS_REPO=../countpips bun run test tests/programa.test.ts`.
 * Un fichero o un patrón que ya no está hace fallar la prueba, no la salta.
 */

const REPO = process.env.COUNTPIPS_REPO;

function fuente(ruta: string): string {
  return readFileSync(join(REPO!, "03-mvp", "app", ruta), "utf8");
}

function unico(texto: string, patron: RegExp, donde: string): string {
  const m = texto.match(patron);
  if (!m) throw new Error(`${donde}: no encaja ${patron}`);
  return m[1];
}

function todos(texto: string, patron: RegExp, donde: string): string[] {
  const vistos = [...texto.matchAll(patron)].map((m) => m[1]);
  if (vistos.length === 0) throw new Error(`${donde}: no encaja ${patron}`);
  return vistos;
}

const numero = (s: string) => Number(s.replace(/_/g, ""));

describe.skipIf(!REPO)("lo que la web dice del programa es lo que hace", () => {
  it("la carpeta de datos", () => {
    const rutas = fuente("src/CountPips.Data/AppPaths.cs");
    const carpeta = unico(rutas, /FolderName = "([^"]+)"/, "AppPaths.cs");
    expect(rutas).toMatch(/SpecialFolder\.LocalApplicationData/);
    expect(PROGRAMA.carpetaDatos).toBe(`%LOCALAPPDATA%\\${carpeta}`);
  });

  it("los días de gracia sin red y la revalidación de la licencia", () => {
    const evaluador = fuente("src/CountPips.Core/Licensing/LicenseEvaluator.cs");
    expect(numero(unico(evaluador, /GraceDays = (\d+);/, "LicenseEvaluator.cs"))).toBe(PROGRAMA.graciaSinRedDias);
    const servicio = fuente("src/CountPips.Data/Services/Licensing/LicenseService.cs");
    const dias = unico(servicio, /ValidationInterval = TimeSpan\.FromDays\((\d+)\)/, "LicenseService.cs");
    expect(numero(dias)).toBe(PROGRAMA.revalidacionDias);
  });

  it("las iteraciones de PBKDF2 de las copias cifradas", () => {
    const politica = fuente("src/CountPips.Data/Services/Pbkdf2Policy.cs");
    expect(numero(unico(politica, /const int Iterations = ([\d_]+);/, "Pbkdf2Policy.cs"))).toBe(PROGRAMA.pbkdf2Iteraciones);
  });

  it("las cuentas de Core", () => {
    const gate = fuente("src/CountPips.Core/Licensing/LicenseGate.cs");
    expect(numero(unico(gate, /CoreAccountLimit = (\d+);/, "LicenseGate.cs"))).toBe(PROGRAMA.cuentasCore);
  });

  it("las plantillas de prop firm, en su orden", () => {
    const plantillas = fuente("src/CountPips.Core/Prop/PropFirmTemplates.cs");
    expect(todos(plantillas, /new\("[a-z0-9]+", "([^"]+)"/g, "PropFirmTemplates.cs")).toEqual([...PROGRAMA.plantillasProp]);
  });

  it("las plantillas de importación CSV", () => {
    const brokers = fuente("src/CountPips.Core/Import/BrokerTemplates.cs");
    const nombres = todos(brokers, /BrokerName = "([^"]+)"/g, "BrokerTemplates.cs").map((n) => n.replace(/ \(.*\)$/, ""));
    expect([...nombres].sort()).toEqual([...PROGRAMA.plantillasCsv].sort());
  });

  it("cada salida de red del programa está en la lista de conexiones, y ninguna más", () => {
    const salidas = fuente("tests/CountPips.App.Tests/SalidasDeRedTests.cs");
    const bloque = unico(salidas, /string\[\] Salidas =\s*\[([\s\S]*?)\];/, "SalidasDeRedTests.cs");
    const delPrograma = todos(bloque, /"([^"]+)"/g, "SalidasDeRedTests.cs");
    const deLaWeb = CONEXIONES.flatMap((c) => c.hosts);
    expect([...deLaWeb].sort()).toEqual([...delPrograma].sort());
  });
});
