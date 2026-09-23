#!/usr/bin/env python3
"""
Genera los artefactos de la marca de CountPips en la web: el logo «Corte»,
una C gruesa abierta hacia arriba a la derecha con un pip cuadrado que sale
por el hueco (decisión del propietario, 23/09/2026).

    public/logo.png        512x512  — dato estructurado de Organization
                                      (es el logotipo que toma Google) e
                                      icono de la PWA (src/app/manifest.ts)
    src/app/apple-icon.png 180x180  — icono al añadir a pantalla de inicio
    src/app/favicon.ico    16/32/48 — reserva para navegadores que no
                                      resuelven src/app/icon.svg
    src/app/icon.svg       vector   — favicon principal

LA GEOMETRÍA NO VIVE AQUÍ
La define una sola vez el generador de la aplicación de escritorio,
Agenda Trading/02-diseno/logo/countpips-assets.gen.py, que también saca el
icono del .exe y el logo de su barra de título. Este script lo importa y lo
usa tal cual —geometría, rasterizado y colores (el acento de la paleta de
la app, que es el mismo que el `--accent-base` de la web)—, así que web y
aplicación no pueden dibujar dos logos distintos. Se busca en el repositorio
hermano; otra ruta se da con la variable COUNTPIPS_MARCA.

Los iconos llevan la placa oscura con la marca clara, como el de la app. El
glifo de la página (BrandGlyph.tsx) va sin placa y se pinta con
rgb(var(--accent-base)), así que sigue al tema.

USO
    python scripts/generate-brand.py          # escribe los artefactos
    python scripts/generate-brand.py --tsx    # imprime las constantes TSX
"""

import importlib.util
import os
import re
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
MARCA_APP = Path(
    os.environ.get(
        "COUNTPIPS_MARCA",
        ROOT.parent / "Agenda Trading" / "02-diseno" / "logo" / "countpips-assets.gen.py",
    )
)

# Apple recorta el icono con su propia máscara y pinta de negro lo
# transparente: va a sangre, sin esquinas propias, y con la marca algo más
# pequeña que en los iconos con placa redondeada para que el recorte no la
# toque.
APPLE_ESCALA = 0.62


def generador_de_la_app():
    if not MARCA_APP.is_file():
        raise SystemExit(
            f"No encuentro el generador de la marca en {MARCA_APP}. "
            "Clona el repositorio de la app al lado de este o da la ruta en COUNTPIPS_MARCA."
        )
    spec = importlib.util.spec_from_file_location("marca_app", MARCA_APP)
    modulo = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(modulo)
    return modulo


def trazo(gen):
    """El `d` de la marca, tal cual lo escribe el generador de la app."""
    m = re.fullmatch(r'<path d="([^"]+)"/>', gen.svg_de_la_marca())
    if not m:
        raise SystemExit("svg_de_la_marca() ya no devuelve un único <path d>")
    return m.group(1)


def caja(gen):
    x, y, lado = gen.MARCA_CAJA
    return f"{x:g} {y:g} {lado:g} {lado:g}"


def apple_icon(gen, lado, placa_rgb, marca_rgb):
    mx, my, mlado = gen.MARCA_CAJA
    c = mlado / APPLE_ESCALA
    marca = gen.mascara(lado, mx + mlado / 2 - c / 2, my + mlado / 2 - c / 2, lado / c, ["arco", "pip"])
    fondo = Image.new("RGB", (lado, lado), placa_rgb)
    fondo.paste(Image.new("RGB", (lado, lado), marca_rgb), (0, 0), marca)
    return fondo


def icon_svg(gen, placa_rgb, marca_rgb):
    hexa = "#{:02X}{:02X}{:02X}".format
    x, y, lado = gen.MARCA_CAJA
    k = 100 * gen.ESCALA_EN_PLACA_GRANDE / lado
    t = 50 - (x + lado / 2) * k
    return (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="512" height="512">\n'
        "  <!-- Favicon: el logo «Corte» sobre su placa.\n"
        "       Generado por scripts/generate-brand.py - no editar a mano. -->\n"
        f'  <rect width="100" height="100" rx="{gen.PLACA_RADIO:g}" fill="{hexa(*placa_rgb)}"/>\n'
        f'  <path d="{trazo(gen)}" fill="{hexa(*marca_rgb)}" '
        f'transform="translate({t:.4g} {t:.4g}) scale({k:.4g})"/>\n'
        "</svg>\n"
    )


def tsx(gen):
    """Imprime las constantes para src/components/tj/BrandGlyph.tsx."""
    print('const TRAZO = "%s";' % trazo(gen))
    print('const CAJA = "%s";' % caja(gen))


def main():
    gen = generador_de_la_app()
    if "--tsx" in sys.argv:
        tsx(gen)
        return

    placa_rgb, marca_rgb = gen.acentos_de_la_paleta()

    gen.icono(512, placa_rgb, marca_rgb).save(ROOT / "public" / "logo.png", optimize=True)
    apple_icon(gen, 180, placa_rgb, marca_rgb).save(ROOT / "src" / "app" / "apple-icon.png", optimize=True)

    tamanos = [16, 32, 48]
    frames = [gen.icono(s, placa_rgb, marca_rgb) for s in tamanos]
    frames[-1].save(
        ROOT / "src" / "app" / "favicon.ico",
        format="ICO",
        sizes=[(s, s) for s in tamanos],
        append_images=frames[:-1],
    )

    (ROOT / "src" / "app" / "icon.svg").write_text(
        icon_svg(gen, placa_rgb, marca_rgb), encoding="utf-8", newline="\n"
    )

    print("logo.png, apple-icon.png, favicon.ico, icon.svg regenerados desde", MARCA_APP)


if __name__ == "__main__":
    main()
