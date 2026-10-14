import { describe, expect, it } from "vitest";
import { rutaEnIdioma, type Lang } from "@/lib/locale";

/**
 * El selector enlaza cada idioma con esta ruta; el mismo cálculo lo usaba
 * `setLang` para navegar. Los esperados salen de las reglas de prefijo, no de
 * lo que devuelve la función.
 */
describe("rutaEnIdioma: la dirección de la página en otro idioma", () => {
  it.each<[string, Lang, string]>([
    ["/", "en", "/en"],
    ["/en", "es", "/"],
    ["/en/", "es", "/"],
    ["/pricing", "fr", "/fr/pricing"],
    ["/fr/pricing", "de", "/de/pricing"],
    ["/pt/pricing", "en", "/en/pricing"],
    ["/en/faq", "es", "/faq"],
    ["/", "es", "/"],
  ])("%s → %s = %s", (pathname, destino, esperada) => {
    expect(rutaEnIdioma(pathname, destino)).toBe(esperada);
  });
});
