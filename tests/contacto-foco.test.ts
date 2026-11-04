// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";

let ruta = "/contacto";
vi.mock("next/navigation", () => ({ usePathname: () => ruta, useRouter: () => ({ push() {}, replace() {} }) }));

const submitForm = vi.hoisted(() => vi.fn());
vi.mock("@/lib/forms", async (original) => ({ ...(await original<typeof import("@/lib/forms")>()), submitForm }));

import { LanguageProvider } from "@/lib/i18n";
import { ContactForm } from "@/components/marketing/ContactForm";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let cont: HTMLElement;
let raiz: Root;

beforeEach(() => {
  vi.stubGlobal("matchMedia", () => ({ matches: true, addEventListener() {}, removeEventListener() {} }));
  submitForm.mockReset();
  cont = document.createElement("div");
  document.body.appendChild(cont);
  raiz = createRoot(cont);
});
afterEach(() => {
  act(() => raiz.unmount());
  cont.remove();
  vi.unstubAllGlobals();
  ruta = "/contacto";
});

function escribe(id: string, texto: string) {
  const el = cont.querySelector<HTMLInputElement | HTMLTextAreaElement>(`#${id}`)!;
  const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  act(() => {
    Object.getOwnPropertyDescriptor(proto, "value")!.set!.call(el, texto);
    el.dispatchEvent(new Event("input", { bubbles: true }));
  });
}

async function envia(url: string, resultado: unknown, rellena = true) {
  ruta = url;
  submitForm.mockResolvedValue(resultado);
  act(() => raiz.render(createElement(LanguageProvider, null, createElement(ContactForm))));
  if (rellena) {
    escribe("cf-name", "Ana");
    escribe("cf-email", "ana@example.com");
    escribe("cf-msg", "Hola");
  }
  await act(async () => {
    cont.querySelector("form")!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
  });
}

const aviso = () => cont.querySelector<HTMLElement>('[role="alert"]')!;

describe("Contacto: si el envío falla, el foco va al aviso (el botón se desactivó al enviar y lo perdía)", () => {
  it.each([
    ["/contacto", "network", "No hemos podido conectar. Revisa tu conexión e inténtalo de nuevo."],
    ["/en/contacto", "network", "We couldn’t connect. Check your connection and try again."],
    ["/contacto", "rejected", "El envío ha fallado por un problema nuestro. Inténtalo de nuevo en unos minutos."],
  ])("en %s, con el fallo «%s»", async (url, reason, texto) => {
    await envia(url, { ok: false, reason });
    expect(submitForm).toHaveBeenCalledTimes(1);
    expect(aviso().textContent).toBe(texto);
    expect(document.activeElement).toBe(aviso());
  });

  it("el aviso se puede enfocar por código pero no entra en el orden de tabulación", () => {
    return envia("/contacto", { ok: false, reason: "network" }).then(() => {
      expect(aviso().getAttribute("tabindex")).toBe("-1");
    });
  });

  it("un reintento que falla otra vez vuelve a llevar el foco al aviso", async () => {
    await envia("/contacto", { ok: false, reason: "network" });
    act(() => cont.querySelector<HTMLInputElement>("#cf-name")!.focus());
    await act(async () => {
      cont.querySelector("form")!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    });
    expect(submitForm).toHaveBeenCalledTimes(2);
    expect(document.activeElement).toBe(aviso());
  });

  it("si lo que falla es un campo vacío, el foco sigue yendo a ese campo, no al aviso", async () => {
    await envia("/contacto", { ok: true }, false);
    expect(submitForm).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(cont.querySelector("#cf-name"));
  });
});
