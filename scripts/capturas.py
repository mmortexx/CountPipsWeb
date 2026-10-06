#!/usr/bin/env python3
"""
Prepara las capturas del producto para la web.

Lee los PNG sin pérdida de `assets/capturas-originales/` (claro y `-oscuro`)
y escribe en `public/img/` dos WebP por pantalla: la pantalla entera para
escritorio y un detalle para móvil.

- Se recorta la barra de título de Windows (48 px). La fila de menú y la
  parte inferior se conservan: son contenido del producto.
- Claro y oscuro usan la misma región de detalle; la maqueta no cambia con
  el tema. La web elige una u otra según el tema activo (`ProductPlate`).
- A 390 px una captura entera se ve al 0,22 de su tamaño y no se lee. El
  detalle móvil es un fragmento que se entiende sin leer cifras; cada
  región de abajo dice qué enseña y está medida sobre los originales
  actuales (1576 × 884). Si cambian las capturas, hay que volver a medirlas.
"""

import sys
from pathlib import Path

from PIL import Image

# La consola de Windows usa cp1252 y el script imprime «→» y «×».
sys.stdout.reconfigure(encoding="utf-8", errors="replace")

RAIZ = Path(__file__).resolve().parent.parent
ORIGEN = RAIZ / "assets" / "capturas-originales"
DESTINO = RAIZ / "public" / "img"

# Cromo de la ventana, sobre originales de 1576 × 884.
BARRA_TITULO = 48   # icono, nombre, cuenta, periodo, relojes y botones
BARRA_ESTADO = 0    # ya no hay barra de estado que quitar

SUFIJO_OSCURO = "-oscuro"

CALIDAD = 82

# Región del detalle móvil, en coordenadas del original: (x, y, ancho, alto, por qué).
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


# Las capturas no deben traer la barra de desplazamiento del programa (se vería
# como una raya suelta junto al marco): si vuelve a colarse, el script para.
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
        # Sin el par, la web enseñaría la captura clara en modo oscuro.
        print(f"[capturas] falta el par de tema en: {sorted(claras ^ oscuras)}")
        return 1

    # Las dos capturas de una lámina deben medir lo mismo: la web las intercambia
    # con un solo `width`/`height`, y si no, cambiar de tema movería la página.
    medidas: dict[str, tuple[int, int]] = {}
    for ruta in originales:
        with Image.open(ruta) as img:
            medidas[ruta.stem] = img.size
            # Todo se comprueba antes de escribir nada, para no dejar `public/img` a medias.
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
