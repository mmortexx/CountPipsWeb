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
sobre las capturas de septiembre de 2026: en Operaciones y Analítica el
contenido llega hasta el borde inferior.

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
contra las capturas de septiembre de 2026 (las de agosto enseñaban otra
maqueta y sus coordenadas caían en cualquier sitio).
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
    "app-resumen": (818, 428, 706, 432,
        "El calendario del mes. Es la única pieza del producto que se "
        "entiende entera sin leer una sola cifra: una rejilla de días, los "
        "de pérdida en rojo, los de ganancia en gris oscuro y los que aún "
        "no han llegado en blanco, con el total de cada semana al margen."),
    "app-registro": (798, 180, 720, 255,
        "El formulario: instrumento, Long/Short, entrada, stop, objetivo y "
        "salida, y debajo el riesgo en dinero y en porcentaje de la cuenta "
        "con su regla stop–entrada–1 R. Las cajas y la regla se leen como "
        "formulario aunque las etiquetas queden pequeñas."),
    "app-operaciones": (48, 330, 830, 340,
        "La fila «Lo que hay en pantalla» —el P&L total a 28 px, que "
        "sobrevive a la reducción— y debajo la cabecera del registro con "
        "sus dos primeras filas: dirección, instrumento, setup, sesión, el "
        "recorrido de la operación y su duración."),
    "app-analitica": (818, 560, 706, 324,
        "«Ganadoras vs perdedoras» con sus seis cifras grandes y, debajo, "
        "el veredicto «Ventaja confirmada» con su valor p. Las dos piezas "
        "que contestan la única pregunta que importa en esa pantalla."),
    "app-diario": (60, 268, 880, 372,
        "El check-in del día —horas de sueño y estado mental como barras "
        "de cinco pasos— y debajo las dos veces que el programa reconoce "
        "que aún no sabe: no hay check-ins bastantes, y el aviso naranja de "
        "que faltan días para comparar. Más estrecho que la pantalla y más "
        "alto que la tira del check-in sola, que a 350 px medía 72 de alto "
        "y no se leía como nada. La frase larga del centro queda cortada "
        "por el borde: el pie dice que es un detalle."),
    "app-playbook": (48, 505, 483, 398,
        "Una sola ficha de setup, entera y con su marco: la de reversión. "
        "Enseñar cinco a la vez a este tamaño no enseña ninguna; una sola "
        "conserva su curva, su muestra, su expectancy, su sello de «no "
        "concluyente» y su reparto de R."),
    "app-guardian": (798, 332, 720, 262,
        "El riesgo de la operación en dinero y en porcentaje de la cuenta, "
        "y debajo los dos avisos. Los triángulos naranjas apilados se leen "
        "como «el programa está objetando» sin leer una letra."),
}


# Las capturas de agosto traían la barra de desplazamiento del programa: dos
# columnas a 6-7 px del borde derecho que en la web se leían como una raya
# suelta junto al marco. Las de septiembre ya no la traen (medido: las once
# columnas del borde tienen el color del fondo). En vez de seguir tapando algo
# que no existe, se comprueba: si vuelve a colarse, el script para y lo dice.
BORDE_DERECHO = 8       # columnas que se vigilan
COLUMNA_FONDO = 10      # la que se toma como fondo
TOLERANCIA = 24         # diferencia de nivel que ya se ve
MAXIMO_DISTINTOS = 0.02 # fracción de píxeles distintos que se admite


def tiene_barra_desplazamiento(img: Image.Image) -> bool:
    ancho, alto = img.size
    fondo = [img.getpixel((ancho - COLUMNA_FONDO, y)) for y in range(BARRA_TITULO, alto)]
    for d in range(1, BORDE_DERECHO + 1):
        distintos = sum(
            1
            for y, f in zip(range(BARRA_TITULO, alto), fondo)
            if max(abs(a - b) for a, b in zip(img.getpixel((ancho - d, y)), f)) > TOLERANCIA
        )
        if distintos > MAXIMO_DISTINTOS * (alto - BARRA_TITULO):
            return True
    return False


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
            # Todo se comprueba ANTES de escribir nada: un fallo a mitad del
            # bucle de abajo dejaría `public/img` con unas capturas nuevas y
            # otras viejas.
            if tiene_barra_desplazamiento(img.convert("RGB")):
                print(
                    f"[capturas] {ruta.stem}: trae la barra de desplazamiento del "
                    f"programa en el borde derecho — recaptúrala sin ella"
                )
                return 1
            region = REGIONES_MOVIL.get(clave_de(ruta.stem))
            if region is not None:
                x, y, w, h, _motivo = region
                if x + w > img.size[0] or y + h > img.size[1]:
                    print(f"[capturas] {ruta.stem}: la región móvil se sale de la imagen")
                    return 1
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
