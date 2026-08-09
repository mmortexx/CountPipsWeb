#!/usr/bin/env python3
"""
Prepara las capturas del producto para la web.

QUÉ HACE Y POR QUÉ
==================

Las ocho capturas se tomaron ANTES del renombrado. Su barra de título dice
«Trading Journal» y su barra de estado, «✓ Compilación de desarrollo». En la
página eso se tapaba recortando por CSS, que arregla lo que se ve y nada
más: el JSON-LD del layout le entrega a Google los ficheros ENTEROS, con el
nombre viejo y el sello de desarrollo dentro, en las 155 páginas. Y quien
abre la imagen directamente —Google Imágenes, un enlace compartido— también
los ve.

Así que el recorte deja de ser un truco de CSS y pasa al fichero. Mismos
nombres, así que ni el JSON-LD ni ningún componente cambian de ruta; lo que
cambia es que ya no hay nada que tapar. Los originales se archivan en
`assets/capturas-originales/`, fuera de `public/`, para poder rehacer esto.

LA SEGUNDA MITAD: EL MÓVIL
==========================

A 390 px de ancho la lámina mide unos 350 px, y una captura de 1500 px se
muestra ahí al 0,23 de su tamaño: no se lee ni una cifra. El componente
afirmaba estar demostrando densidad real y en el teléfono no demostraba
nada.

Reducir más no arregla nada, y ampliar con scroll horizontal es pedirle al
visitante que trabaje. Lo que funciona es enseñar un DETALLE: un fragmento
de la misma captura, elegido para que se entienda a ese tamaño.

El criterio para elegirlo no es "dónde hay más texto" sino "qué se entiende
sin leer". El calendario del resumen se lee como calendario aunque no
distingas las cifras; una tabla de veinte columnas, no. Cada región de aquí
abajo lleva escrito qué enseña y por qué es esa.
"""

from pathlib import Path
from PIL import Image

RAIZ = Path(__file__).resolve().parent.parent
ORIGEN = RAIZ / "assets" / "capturas-originales"
DESTINO = RAIZ / "public" / "img"

# Cromo de la ventana, medido sobre el original de 1500 × 856.
BARRA_TITULO = 46   # dice «Trading Journal», el nombre anterior al renombrado
BARRA_ESTADO = 22   # dice «✓ Compilación de desarrollo»

# La fila de menú (Resumen · Operaciones · Analítica…) NO se recorta: no es
# cromo de ventana, es información del producto — enseña que la aplicación
# tiene ocho secciones.

CALIDAD = 82

# Región del detalle que se enseña en móvil, en coordenadas del ORIGINAL.
#   (x, y, ancho, alto, por qué)
REGIONES_MOVIL = {
    "app-resumen": (788, 485, 712, 355,
        "El calendario del mes. Es la única pieza del producto que se "
        "entiende entera sin leer una sola cifra: una rejilla de días en "
        "verde y rojo ya cuenta cómo ha ido el mes."),
    "app-analitica": (36, 596, 628, 240,
        "«Ganadoras vs perdedoras» con las cuatro cifras grandes: media "
        "ganadora, media perdedora, payoff y expectancy. Son números de "
        "20 px, que a esta escala siguen leyéndose."),
    "app-curva": (40, 430, 985, 390,
        "La curva de rendimiento con sus dos trazos: el real y el "
        "discontinuo de lo que habría dado respetando el plan. La "
        "distancia entre ambos se ve de un vistazo, y es el argumento."),
    "app-operaciones": (30, 435, 790, 330,
        "La cabecera de la tabla y sus primeras filas. Enseña la forma del "
        "registro —instrumento, setup, sesión, cumplimiento— sin pedir que "
        "se lea cada celda."),
    "app-diario": (40, 262, 960, 250,
        "El check-in del día: horas de sueño, estado mental y físico como "
        "barras. Se entiende que son controles que se rellenan en veinte "
        "segundos, que es justo lo que la sección promete."),
    "app-detalle": (405, 180, 745, 205,
        "El P&L de la operación y la barra del recorrido, con MAE y MFE "
        "rotulados en los extremos. La cifra va a 28 px y la barra es "
        "geometría: las dos cosas sobreviven a la reducción."),
    "app-playbook": (32, 100, 490, 350,
        "Una sola tarjeta de setup, entera. Enseñar cinco a la vez a este "
        "tamaño no enseña ninguna; una sola conserva su curva, su muestra, "
        "su expectancy y su veredicto."),
    "app-nueva": (780, 213, 720, 495,
        "La columna del formulario: Long/Short, instrumento, entrada, "
        "salida, stop, objetivo. Los campos son cajas grandes y se leen "
        "como formulario aunque las etiquetas queden pequeñas."),
}


def recorta(img: Image.Image, caja: tuple[int, int, int, int]) -> Image.Image:
    x, y, w, h = caja
    return img.crop((x, y, x + w, y + h))


def main() -> int:
    if not ORIGEN.is_dir():
        print(f"[capturas] no encuentro {ORIGEN}")
        print("           los originales se archivan ahí la primera vez")
        return 1

    originales = sorted(ORIGEN.glob("app-*.webp"))
    if not originales:
        print(f"[capturas] {ORIGEN} está vacío")
        return 1

    for ruta in originales:
        nombre = ruta.stem
        with Image.open(ruta) as img:
            ancho, alto = img.size

            # 1) La captura sin cromo de ventana.
            sin_cromo = recorta(img, (0, BARRA_TITULO, ancho, alto - BARRA_TITULO - BARRA_ESTADO))
            sin_cromo.save(DESTINO / f"{nombre}.webp", "WEBP", quality=CALIDAD, method=6)

            # 2) El detalle para móvil.
            region = REGIONES_MOVIL.get(nombre)
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
