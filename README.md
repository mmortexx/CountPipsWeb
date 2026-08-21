# CountPips Web

> Vitrina oficial, documentación y demo interactiva en el navegador de **CountPips**, el diario de trading profesional nativo para Windows 10/11.

---

## ¿Qué es este repositorio?

Este proyecto contiene la **aplicación web estática** y la **vitrina de producto** de CountPips.

- **Demo en el navegador**: Simulador determinista en cliente con ~200 operaciones pregeneradas (PRNG `mulberry32`), analítica institucional y gráficos interactivos sin registro.
- **Motor Cuantitativo**: Cálculo puro de más de 40 métricas estadísticas (Sharpe, Sortino, Calmar, Ratio Omega Keating–Shadwick, SQN Van Tharp, Half Kelly, Índice de Úlcera, Asimetría de Drawdown e Intervalos Wilson al 95%).
- **Arquitectura Local-First**: La web refleja la filosofía de la aplicación nativa WinUI 3 (cero telemetría en el binario de escritorio, base de datos SQLite en disco y privacidad absoluta).
- **Backend Serverless (Beta API)**: Cloudflare Worker en `services/beta-api/` con base de datos D1 (SQLite), rate limiting en KV y verificación anti-bot con Turnstile para el acceso anticipado.

> [!NOTE]
> Este repositorio **no** contiene el código fuente de la aplicación de escritorio Windows (WinUI 3 / C# / SQLite).

---

## Stack Tecnológico

- **Framework**: Next.js 16 (Static Export `output: "export"`)
- **Librería UI**: React 19
- **Estilos**: Tailwind CSS v4, Motion (Framer Motion)
- **Iconografía**: Lucide React
- **Testing**: Vitest, Playwright (smoke testing)
- **Servicios**: Cloudflare Workers, Cloudflare D1, Cloudflare Turnstile, PostHog EU (sólo bajo consentimiento)

---

## Estructura del Proyecto

```
web-trading-journal/
├── src/
│   ├── app/                # Enrutador App Router (rutas ES en / y EN en /en/)
│   ├── components/
│   │   ├── charts/         # Curvas de equity, heatmaps, histogramas
│   │   ├── demo/           # Vistas del espacio de trabajo interactivo
│   │   ├── marketing/      # Secciones de producto, vitrinas y calculadoras
│   │   └── tj/             # Primitivas de diseño y componentes base
│   └── lib/
│       ├── trading/        # Motor matemático, PRNG y contratos de datos
│       ├── legal/          # Textos legales y tabla de almacenamiento
│       └── i18n/           # Diccionarios y paridad bilingüe
├── services/
│   └── beta-api/           # Worker de Cloudflare para gestión del acceso beta
└── tests/                  # Suite de tests unitarios y matemáticos (Vitest)
```

---

## Comandos Disponibles

```bash
# Instalar dependencias
npm install

# Servidor de desarrollo
npm run dev

# Ejecutar suite de pruebas cuantitativas y de interfaz
npm test

# Verificación de tipos estáticos
npx tsc --noEmit

# Compilación estática de producción (export a /out)
npm run build
```

---

## Privacidad y Seguridad

- **Software de escritorio**: 100 % local, almacena la información exclusivamente en el disco del usuario mediante SQLite cifrado, sin telemetría ni comunicación con servidores externos.
- **Sitio web**: Sitio estático. La medición agregada y anónima sólo se carga si el usuario otorga su consentimiento expreso en el banner de privacidad.
