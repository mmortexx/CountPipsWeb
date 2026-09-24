import { describe, expect, it } from "vitest";
import { destinoTrampaTab } from "@/components/demo/DemoCommandPalette";

// La trampa de Tab de DemoCommandPalette decide, en cada pulsación de Tab
// o Shift+Tab, si el foco debe saltar a un extremo del panel o seguir su
// curso normal. `destinoTrampaTab` es la decisión pura, sin DOM: dado
// dónde está el foco y qué tecla se pulsó, dice a qué extremo saltar (o
// `null` si el Tab no necesita intervención).
describe("destinoTrampaTab", () => {
  it("Tab en el último elemento salta al primero", () => {
    expect(
      destinoTrampaTab({ dentro: true, esPrimero: false, esUltimo: true, shiftKey: false })
    ).toBe("primero");
  });

  it("Shift+Tab en el primer elemento salta al último", () => {
    expect(
      destinoTrampaTab({ dentro: true, esPrimero: true, esUltimo: false, shiftKey: true })
    ).toBe("ultimo");
  });

  it("Tab en un elemento intermedio no interviene", () => {
    expect(
      destinoTrampaTab({ dentro: true, esPrimero: false, esUltimo: false, shiftKey: false })
    ).toBeNull();
    expect(
      destinoTrampaTab({ dentro: true, esPrimero: false, esUltimo: false, shiftKey: true })
    ).toBeNull();
  });

  it("si el foco está fuera del panel, Tab lo trae de vuelta al primero y Shift+Tab al último", () => {
    // Esto es lo que le pasaría a un foco que se ha escapado del panel
    // (el fallo original: sin trampa, Tab sale del diálogo entero).
    expect(
      destinoTrampaTab({ dentro: false, esPrimero: false, esUltimo: false, shiftKey: false })
    ).toBe("primero");
    expect(
      destinoTrampaTab({ dentro: false, esPrimero: false, esUltimo: false, shiftKey: true })
    ).toBe("ultimo");
  });

  it("con un único elemento enfocable (primero === último), Tab y Shift+Tab lo devuelven a sí mismo", () => {
    expect(
      destinoTrampaTab({ dentro: true, esPrimero: true, esUltimo: true, shiftKey: false })
    ).toBe("primero");
    expect(
      destinoTrampaTab({ dentro: true, esPrimero: true, esUltimo: true, shiftKey: true })
    ).toBe("ultimo");
  });
});
