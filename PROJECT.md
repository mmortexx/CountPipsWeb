# CountPips Web — guía de trabajo

Estado del repositorio y reglas para tocarlo. El despliegue está en
[DESPLIEGUE.md](DESPLIEGUE.md) y el índice de pruebas en [TEST_INFRA.md](TEST_INFRA.md).
El porqué de cada decisión pasada vive en el historial de git y en el comentario
del propio código, no aquí.

## Qué es

Sitio estático de marketing y demo interactiva del diario de trading nativo de
Windows (WinUI 3, en otro repositorio).

- **Base**: Next.js 16 (App Router, `output: "export"`), React 19, TypeScript estricto, Bun.
- **Estilos**: Tailwind CSS v4 y tokens en `src/app/globals.css` (`--surface-*`,
  `--accent-*`, `--pnl-*`, `--sig-*`). Animación sólo con CSS/WAAPI: sin librería de
  movimiento (`tests/sin-framer.test.ts`).
- **Idiomas**: español en `/`, inglés en `/en/`, con paridad 1:1 vigilada por
  `tests/e2e/d4_bilingual_parity.test.ts`.
- **Demo**: datos de muestra deterministas (`mulberry32`), cuatro pestañas y el
  detalle de operación; estado en `src/lib/trading/demoStore.ts`
  (`useSyncExternalStore`).
- **Analítica**: PostHog UE, sólo tras consentimiento explícito.
- **Formularios**: contacto por Web3Forms; acceso anticipado por el Worker de
  `services/beta-api/` (D1, KV, Turnstile), el Apps Script de
  `docs/waitlist-apps-script.js` o, sin ninguno, por Web3Forms al correo
  (`DESPLIEGUE.md`).

## Sistema de diseño

- **Color**: blanco y negro con neutro frío. El color se reserva para el dinero
  (verde, rojo, ámbar) y las sesiones. El botón primario es tinta plena.
- **Tintas por familia**: `--accent-ink`, `--pnl-ink` y `--sig-ink` giran con el
  tema; ningún componente escribe `#fff` o `#000` a mano sobre un fondo de color.
- **Tipografía**: Newsreader sólo en `h1`/`h2`; todo lo demás en Instrument Sans;
  cifras en sans con `.tnum`.
- **Superficies**: `.tj-paper` opaca, `.tj-hoja` con canto de 1 px. Radios 3/4/6/8 px.
  Caja de contenido `.tj-container` (1200 px).
- **Una idea por pantalla**: bajo un `PageHeader` las secciones reciben `enPagina` y
  no repiten titular; cada página cierra con una sola llamada a la acción.
- **Cifras que caben**: `.caja-cifra` + `.cifra-xl/-lg/-sm` (consultas de contenedor),
  nunca `clamp()` contra el ancho de la ventana.
- **Toque**: 44 px en puntero grueso (`.toque-comodo`); campos a 16 px en móvil.
- **Afirmaciones técnicas**: sólo lo comprobado en el código del programa. Las cifras y
  listas que cita la web viven en `PROGRAMA` (`src/lib/producto.ts`) y las conexiones en
  `src/lib/conexiones.ts`; `tests/programa.test.ts` las compara con el código del programa
  si `COUNTPIPS_REPO` apunta a una copia (sin ella, se salta).

## Pendiente de decidir por el dueño

- Las capturas del programa sólo existen en español.

## Puertas

Nada está terminado sin estas cuatro en verde. El CI las corre, con la prueba de humo, en
cada PR (`comprobar.yml`) y otra vez antes de publicar (`deploy.yml`). En cada PR, además,
compila el sitio como se servirá en `countpips.com` (raíz, sin prefijo) y lo recorre, también
con las cabeceras de seguridad de `public/_headers` puestas (`cabeceras.mjs`):

```bash
bun run typecheck
bun run lint
bun run test
bun run build
```

Si el cambio se ve, además las auditorías sobre el sitio compilado (`out/`). Cada
script explica en su cabecera qué mide:

```bash
node scripts/humo.mjs --serve out          # contraste, entradas, menú, sin JavaScript
node scripts/legible.mjs --serve out       # contraste de todo el texto sobre fondo plano
node scripts/tinta.mjs --serve out         # texto sobre fondos de color, en los dos temas
node scripts/arranque.mjs --serve out --cpu 4  # tiempo hasta titular legible
node scripts/metadatos.mjs out             # título, descripción, canónico, hreflang, lang, ld+json
node scripts/enlaces.mjs out               # enlaces rotos o que cambian de idioma
node scripts/cifras.mjs out                # convenciones de idioma y restos de plantilla
node scripts/rotulos.mjs out               # lo que oye un lector de pantalla
node scripts/equipaje.mjs out              # JS que cada página carga sin pedirlo
node scripts/copiado.mjs --serve out       # texto de los botones «Copiar»
node scripts/medida.mjs --serve out        # caracteres por línea
node scripts/papel.mjs --serve out         # impresión completa
node scripts/pesos.mjs --serve out         # grosores de la serif
node scripts/rejillas.mjs --serve out      # alineación de fichas, columnas y cifras
node scripts/escala.mjs --serve out        # escala tipográfica e interlineado
node scripts/movimiento.mjs --serve out    # «reducir movimiento» respetado
node scripts/orden.mjs --serve out         # primera pantalla en orden de lectura; cambio de página sin solape
node scripts/proporcion.mjs --serve out    # textos de gráficos SVG sin estirar (también dentro de la demo)
node scripts/tema.mjs --serve out          # elección de tema y sin fogonazo blanco
node scripts/anuncios.mjs --serve out      # resultados anunciados a lectores de pantalla
node scripts/deslizadores.mjs --serve out  # relleno, marcas y alturas de los deslizadores
node scripts/viudas.mjs --serve out        # titulares sin palabra sola al final
node scripts/teclado.mjs --serve out       # todo el sitio sin ratón
node scripts/cabeceras.mjs --serve out     # nada bloqueado por la CSP de `_headers` (dominio propio)
node scripts/corrobora-menus.mjs --base <url>  # menús; contra `npx serve out` (sin -s)
```

Trampas de medida conocidas: `npx serve -s` devuelve la portada en todas las rutas;
el banner de cookies tapa media pantalla si no se descarta; Chromium sin ventana va
a ~60 Hz y no ve tirones a más frecuencia.

## Contratos de interfaz

- `src/lib/theme.tsx`: leer o guardar tema y paleta nunca lanza, aunque
  `localStorage` dé `SecurityError`.
- `src/components/tj/OverlayHost.tsx`: Ctrl/⌘+G abre el glosario. La web no tiene
  paleta de comandos; sólo la demo (`DemoCommandPalette`).
- `src/components/marketing/EquityProjector.tsx`: `cagr` nunca devuelve `NaN`.
- `src/lib/trading/data.ts`: todas las métricas dan números finitos y deterministas
  con n=0, n=1, 100 % aciertos, 100 % pérdidas y desviación 0.

## Mapa de código

- `src/app/`: rutas (español en la raíz, inglés bajo `/en/`).
- `src/components/ui/`: primitivas sobre Radix (accordion, dialog, input, toast).
- `src/components/tj/`: maqueta, navegación, capas, consentimiento, capturas reales.
- `src/components/marketing/` y `herramientas/`: secciones de producto y calculadoras.
- `src/components/demo/`: la demo interactiva.
- `src/components/glosario/`, `legal/`, `beta/`: sus páginas.
- `src/hooks/`: hooks compartidos (`use-viaje` anima la demo sin librería).
- `src/lib/`: idioma, tema, consentimiento, glosario, FAQ, formularios, sitio.
- `src/lib/trading/`: motor cuantitativo y datos de la demo.
- `scripts/`: auditorías, `postbuild.mjs`, marca (`generate-brand.py`) y capturas
  (`capturas.py`, originales en `assets/capturas-originales/`).
- `services/beta-api/`: Worker de acceso anticipado ([README](services/beta-api/README.md)).
- `tests/`: contratos del sitio; `tests/e2e/`: dimensiones de calidad.
