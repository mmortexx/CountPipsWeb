#!/usr/bin/env python3
"""
Prepara las capturas del producto para la web.

QUÉ HACE Y POR QUÉ
==================

Los originales viven en `assets/capturas-originales/` como PNG sin pérdida,
fuera de `public/`, para poder rehacer esto sin volver a abrir la app. De
cada uno salen dos ficheros a `public/img/`: la pantalla para escritorio y
un DETALLE para móvil.

LO QUE SE RECORTA, Y LO QUE NO
==============================

La barra de título de la ventana (48 px: el icono, «CountPips», la cuenta
demo, el selector de periodo, los relojes de sesión y los tres botones de
Windows) SÍ se recorta. No por ocultar nada —hoy dice el nombre correcto y
no hay ningún sello de compilación—, sino porque la web ya dibuja su propia
barra de título: `WindowFrame` monta un cromo de ventana alrededor de la
captura, y con las dos superpuestas salían dos barras de título, una encima
de otra.

Abajo NO se recorta nada. La versión anterior quitaba 22 px de una barra de
estado que decía «✓ Compilación de desarrollo»: esa barra ya no existe en
la aplicación, y restar 22 px se comía la última fila de cifras. Medido
sobre las capturas nuevas: el contenido llega hasta el borde inferior.

La fila de menú (Resumen · Operaciones · Analítica…) tampoco se recorta: no
es cromo de ventana, es información del producto — enseña que la aplicación
tiene once secciones.

LOS DOS TEMAS
=============

Cada pantalla está capturada dos veces, clara y oscura, con el mismo
encuadre. Los ficheros oscuros llevan el sufijo `-oscuro` y se procesan
igual, con la MISMA región de detalle: la maqueta de la aplicación no
cambia con el tema, solo cambian los colores. La web sirve una u otra según
el tema activo (`ProductPlate`).

LA SEGUNDA MITAD: EL MÓVIL
==========================

A 390 px de ancho la lámina mide unos 350 px, y una captura de 1576 px se
muestra ahí al 0,22 de su tamaño: no se lee ni una cifra. Enseñar la
pantalla entera en el teléfono no demuestra nada.

Reducir más no arregla nada, y ampliar con scroll horizontal es pedirle al
visitante que trabaje. Lo que funciona es enseñar un DETALLE: un fragmento
de la misma captura, elegido para que se entienda a ese tamaño.

El criterio para elegirlo no es "dónde hay más texto" sino "qué se entiende
sin leer". El calendario del resumen se lee como calendario aunque no
distingas las cifras; una tabla de doce columnas, no. Cada región de aquí
abajo lleva escrito qué enseña y por qué es esa, y todas están medidas
contra las capturas de agosto de 2026, no heredadas del diseño anterior.
"""

import sys
from pathlib import Path

from PIL import Image

# La consola de Windows viene en cp1252 y este script imprime «→» y «×».
# Sin esto, el resumen final revienta con UnicodeEncodeError después de
# haber escrito ya todos los ficheros: falla el informe, no el trabajo.
sys.stdout.reconfigure(encoding="utf-8", errors="replace")

RAIZ = Path(__file__).resolve().parent.parent
ORIGEN = RAIZ / "assets" / "capturas-originales"
DESTINO = RAIZ / "public" / "img"

# Cromo de la ventana, medido sobre los originales de 1576 × 884.
BARRA_TITULO = 48   # icono, nombre, cuenta, periodo, relojes y botones
BARRA_ESTADO = 0    # ya no hay barra de estado que quitar

SUFIJO_OSCURO = "-oscuro"

CALIDAD = 82

# Región del detalle que se enseña en móvil, en coordenadas del ORIGINAL.
#   (x, y, ancho, alto, por qué)
REGIONES_MOVIL = {
    "app-resumen": (818, 368, 706, 480,
        "El calendario del mes. Es la única pieza del producto que se "
        "entiende entera sin leer una sola cifra: una rejilla de días en "
        "verde y rojo, y los que aún no se han operado en gris."),
    "app-registro": (798, 185, 715, 340,
        "La columna del formulario: Long/Short, instrumento, entrada, "
        "salida, cantidad y stop. Los campos son cajas grandes y se leen "
        "como formulario aunque las etiquetas queden pequeñas."),
    "app-operaciones": (48, 296, 900, 400,
        "La fila de métricas —P&L total y win rate a 28 px, que sobreviven "
        "a la reducción— y debajo la cabecera del registro con sus primeras "
        "filas: instrumento, setup, sesión y el recorrido de la operación."),
    "app-analitica": (808, 400, 722, 390,
        "«Ganadoras vs perdedoras» con sus seis cifras grandes y, debajo, "
        "el veredicto «Ventaja confirmada» con su valor p. Las dos piezas "
        "que contestan la única pregunta que importa en esa pantalla."),
    "app-diario": (60, 268, 1300, 340,
        "El check-in del día: horas de sueño, estado mental y físico como "
        "barras de cinco pasos, y el interruptor de plan. Se entiende que "
        "son controles que se rellenan en veinte segundos."),
    "app-playbook": (48, 110, 485, 410,
        "Una sola ficha de setup, entera. Enseñar cinco a la vez a este "
        "tamaño no enseña ninguna; una sola conserva su curva, su muestra, "
        "su expectancy, su veredicto y su reparto de R."),
    "app-guardian": (65, 495, 950, 230,
        "El riesgo de la operación en dinero y en porcentaje de la cuenta, "
        "y debajo las tres bandas de aviso. Tres franjas apiladas con su "
        "icono se leen como «el programa está objetando» sin leer una letra."),
}


def recorta(img: Image.Image, caja: tuple[int, int, int, int]) -> Image.Image:
    x, y, w, h = caja
    return img.crop((x, y, x + w, y + h))


def clave_de(nombre: str) -> str:
    """`app-resumen-oscuro` → `app-resumen`. La región no cambia con el tema."""
    return nombre[: -len(SUFIJO_OSCURO)] if nombre.endswith(SUFIJO_OSCURO) else nombre


def main() -> int:
    if not ORIGEN.is_dir():
        print(f"[capturas] no encuentro {ORIGEN}")
        print("           los originales se archivan ahí la primera vez")
        return 1

    originales = sorted(ORIGEN.glob("app-*.png"))
    if not originales:
        print(f"[capturas] {ORIGEN} no tiene ningún `app-*.png`")
        return 1

    DESTINO.mkdir(parents=True, exist_ok=True)

    claras = {clave_de(r.stem) for r in originales if not r.stem.endswith(SUFIJO_OSCURO)}
    oscuras = {clave_de(r.stem) for r in originales if r.stem.endswith(SUFIJO_OSCURO)}
    if claras != oscuras:
        # Sin el par, la web enseñaría la captura clara en modo oscuro — que
        # es exactamente el defecto que este script existe para no repetir.
        print(f"[capturas] falta el par de tema en: {sorted(claras ^ oscuras)}")
        return 1

    # Las dos capturas de una misma lámina TIENEN que medir lo mismo: la web
    # las intercambia en el sitio, con un solo `width`/`height` declarado. Si
    # una fuera más alta, cambiar de tema movería la página.
    medidas: dict[str, tuple[int, int]] = {}
    for ruta in originales:
        with Image.open(ruta) as img:
            medidas[ruta.stem] = img.size
    for clave in sorted(claras):
        if medidas[clave] != medidas[clave + SUFIJO_OSCURO]:
            print(
                f"[capturas] {clave}: la captura clara mide {medidas[clave]} y la "
                f"oscura {medidas[clave + SUFIJO_OSCURO]} — tienen que coincidir"
            )
            return 1

    for ruta in originales:
        nombre = ruta.stem
        with Image.open(ruta) as img:
            img = img.convert("RGB")
            ancho, alto = img.size

            # 1) La captura sin cromo de ventana.
            sin_cromo = recorta(img, (0, BARRA_TITULO, ancho, alto - BARRA_TITULO - BARRA_ESTADO))
            sin_cromo.save(DESTINO / f"{nombre}.webp", "WEBP", quality=CALIDAD, method=6)

            # 2) El detalle para móvil.
            region = REGIONES_MOVIL.get(clave_de(nombre))
            if region is None:
                print(f"[capturas] {nombre}: sin región móvil declarada — se omite")
                continue
            x, y, w, h, _motivo = region
            if x + w > ancho or y + h > alto:
                print(f"[capturas] {nombre}: la región móvil se sale de la imagen")
                return 1
            detalle = recorta(img, (x, y, w, h))
            detalle.save(DESTINO / f"{nombre}-movil.webp", "WEBP", quality=CALIDAD, method=6)

            print(
                f"[capturas] {nombre}: {ancho}×{alto} → {sin_cromo.size[0]}×{sin_cromo.size[1]}"
                f"  ·  detalle móvil {w}×{h}"
            )

    print(f"[capturas] {len(originales)} capturas escritas en {DESTINO}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
