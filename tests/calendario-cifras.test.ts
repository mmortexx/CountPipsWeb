import { describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { renderToString } from "react-dom/server";

vi.mock("next/navigation", () => ({ usePathname: () => "/", useRouter: () => ({ push() {}, replace() {} }) }));

import { LanguageProvider } from "@/lib/i18n";
import { MiniCalendar } from "@/components/charts/MiniCalendar";
import { TRADES } from "@/lib/trading/data";

// Cada día con operaciones dice su resultado: los días pequeños salían
// teñidos y sin cifra, y en móvil no hay puntero que abra el detalle.
describe("MiniCalendar con la operativa de la demo", () => {
  const html = renderToString(createElement(LanguageProvider, null, createElement(MiniCalendar, { trades: TRADES })));
  const dias = (html.match(/class="cal-day-num"/g) ?? []).length;
  const cifras = (html.match(/cal-day-pnl/g) ?? []).length;

  it("hay días operados en el mes que enseña", () => {
    expect(dias).toBeGreaterThan(3);
  });

  it("todo día operado lleva su cifra", () => {
    expect(cifras).toBe(dias);
  });
});
