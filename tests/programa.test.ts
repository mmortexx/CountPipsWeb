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

  it("los días de prueba sin clave", () => {
    const prueba = fuente("src/CountPips.Core/Licensing/Trial.cs");
    expect(numero(unico(prueba, /public const int Days = (\d+);/, "Trial.cs"))).toBe(PROGRAMA.pruebaDias);
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

  it("las métricas que calcula pasan de las que cita la web", () => {
    const resultado = fuente("src/CountPips.Core/Metrics/MetricsResult.cs");
    const metricas = todos(resultado, /^\s*public (?:decimal|double|int)\? ([A-Z]\w+)/gm, "MetricsResult.cs");
    expect(metricas.length).toBeGreaterThanOrEqual(PROGRAMA.metricasMinimo);
  });

  // Lo que la ficha técnica (`TechSpecs.tsx`), las integraciones y «Cómo funciona» cuentan con palabras.
  it.each([
    ["SQLite en modo WAL", "src/CountPips.Data/SqliteConnectionFactory.cs", /PRAGMA journal_mode = WAL;/],
    ["cifrado EFS de Windows", "src/CountPips.App/Services/LocalEncryptionControl.cs", /EFS de Windows/],
    ["copias cifradas con AES-256-GCM", "src/CountPips.Data/Services/EncryptedBackupService.cs", /new AesGcm\(key, TagSizeBytes\)/],
    ["exportación a Markdown", "src/CountPips.App/Views/SettingsPage.xaml.cs", /\("Markdown", "\.md"\)/],
    ["Interactive Brokers por Flex Query", "src/CountPips.Core/Import/BrokerTemplates.cs", /BrokerName = "Interactive Brokers \(Flex Query\)"/],
    ["Ctrl + 3 abre Analítica", "src/CountPips.App/MainWindow.Navegacion.cs", /VirtualKey\.Number3 => "analytics"/],
    ["Ctrl + 4 abre el Diario", "src/CountPips.App/MainWindow.Navegacion.cs", /VirtualKey\.Number4 => "journal"/],
  ])("%s", (_, ruta, patron) => {
    expect(fuente(ruta)).toMatch(patron);
  });

  it("cada salida de red del programa está en la lista de conexiones, y ninguna más", () => {
    const salidas = fuente("tests/CountPips.App.Tests/SalidasDeRedTests.cs");
    const bloque = unico(salidas, /string\[\] Salidas =\s*\[([\s\S]*?)\];/, "SalidasDeRedTests.cs");
    const delPrograma = todos(bloque, /"([^"]+)"/g, "SalidasDeRedTests.cs");
    const deLaWeb = CONEXIONES.flatMap((c) => c.hosts);
    expect([...deLaWeb].sort()).toEqual([...delPrograma].sort());
  });
});
