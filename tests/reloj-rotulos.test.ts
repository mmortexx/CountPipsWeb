// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";

vi.mock("next/navigation", () => ({ usePathname: () => "/herramientas/reloj-de-sesiones/", useRouter: () => ({ push() {}, replace() {} }) }));

import { LanguageProvider } from "@/lib/i18n";
import { SessionClock } from "@/components/marketing/SessionClock";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

/* La raya de «ahora» tachaba el nombre de la sesión por la que pasaba
   («Lond|res»), y el nombre de la sesión abierta iba en tinta sobre una banda
   de 55 % de tinta: negro sobre gris oscuro, 3,8:1. La hora se fija un lunes a
   las 9:30 UTC, con Londres abierta y Sídney cerrada; a otra hora, o en fin de
   semana, la auditoría de contraste no ve ninguna banda abierta. */
describe("reloj de sesiones: el nombre de cada banda se lee", () => {
  let cont: HTMLElement;
  let raiz: Root;

  beforeEach(async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-26T09:30:00Z"));
    cont = document.createElement("div");
    document.body.appendChild(cont);
    raiz = createRoot(cont);
    await act(async () => raiz.render(createElement(LanguageProvider, null, createElement(SessionClock))));
  });

  afterEach(() => {
    act(() => raiz.unmount());
    cont.remove();
    vi.useRealTimers();
  });

  const banda = (nombre: string) => {
    const b = [...cont.querySelectorAll<HTMLElement>("[role=img]")].find((e) => e.getAttribute("aria-label")?.startsWith(nombre));
    if (!b) throw new Error(`sin banda ${nombre}`);
    const rotulo = b.querySelector<HTMLElement>("span");
    if (!rotulo) throw new Error(`banda ${nombre} sin rótulo`);
    return { b, rotulo };
  };

  it("la raya de «ahora» existe y el rótulo queda por encima con el fondo de su banda", () => {
    expect(cont.querySelector(".w-\\[2px\\]")).not.toBeNull();
    for (const nombre of ["Londres", "Sídney"]) {
      const { b, rotulo } = banda(nombre);
      expect(rotulo.className).toMatch(/\bz-\[1\]/);
      // Opaca: mezclada con el fondo de la ficha, no con transparente.
      expect(b.style.getPropertyValue("--banda")).toContain("var(--ficha-fondo)");
      expect(b.style.background).toBe("var(--banda)");
      expect(rotulo.style.background).toBe("var(--banda)");
    }
  });

  it("la banda abierta lleva el nombre en color de papel y la cerrada en tinta", () => {
    expect(banda("Londres").b.style.getPropertyValue("--banda")).toContain("55%");
    expect(banda("Londres").rotulo.style.color).toBe("var(--ficha-fondo)");
    expect(banda("Sídney").rotulo.style.color).toBe("var(--ink)");
  });
});
