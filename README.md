# CountPips Web

Sitio y demo en el navegador de **CountPips**, el diario de trading nativo para Windows.

- **Demo sin registro**: unas 200 operaciones de muestra deterministas con la analítica
  del programa, calculada en el navegador.
- **Herramientas**: calculadoras de riesgo, fondeo, comisiones, Monte Carlo y un test
  de disciplina, en español e inglés.
- **Privacidad**: sitio estático; la analítica (PostHog UE) sólo se carga con
  consentimiento expreso.

Este repositorio no contiene la aplicación de escritorio.

## Desarrollo

Requiere [Bun](https://bun.sh) 1.3.

```bash
bun install
bun run dev        # http://localhost:3000
bun run typecheck
bun run lint
bun run test
bun run build      # exporta el sitio estático a out/
```

## Documentación

- [PROJECT.md](PROJECT.md): qué hay, sistema de diseño, puertas y mapa del código.
- [DESPLIEGUE.md](DESPLIEGUE.md): cómo se publica y qué variables necesita.
- [TEST_INFRA.md](TEST_INFRA.md): qué vigila cada prueba.
- [services/beta-api/README.md](services/beta-api/README.md): el Worker de acceso anticipado.
