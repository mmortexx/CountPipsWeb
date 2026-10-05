Empieza por [PROJECT.md](PROJECT.md): estado, sistema de diseño, puertas y mapa del
código. El despliegue está en [DESPLIEGUE.md](DESPLIEGUE.md) y el índice de pruebas en
[TEST_INFRA.md](TEST_INFRA.md).

Un cambio no está terminado sin las cuatro puertas en verde (`bun run typecheck`,
`lint`, `test`, `build`), y si se ve, sin las auditorías de
[PROJECT.md](PROJECT.md#puertas) sobre `out/`.
