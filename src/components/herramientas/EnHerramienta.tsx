"use client";

import { createContext, useContext } from "react";

/** Verdadero dentro de la página propia de una herramienta: allí el h1 ya titula y el h2 de la calculadora sobra. */
export const EnHerramienta = createContext(false);

export const useEnHerramienta = () => useContext(EnHerramienta);
