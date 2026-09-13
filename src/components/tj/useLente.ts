"use client";

import { useCallback } from "react";
import { LENTES, montarLente } from "@/lib/lente";

/** Ref de callback que monta el cristal líquido sobre el elemento. */
export function useLente(tipo: keyof typeof LENTES) {
  return useCallback((el: HTMLElement | null) => (el ? montarLente(el, LENTES[tipo]) : undefined), [tipo]);
}
