/**
 * Color de la barra del navegador móvil (`<meta name="theme-color">`) y del
 * manifiesto: el fondo de cada tema, `--bg` de `[data-palette="clasico"]` en
 * globals.css. Módulo sin "use client" para que lo lean `layout.tsx` y
 * `manifest.ts`. `scripts/tema.mjs` comprueba que barra y fondo coincidan.
 */
export const COLOR_BARRA = { light: "#ffffff", dark: "#0a0c0f" } as const;
