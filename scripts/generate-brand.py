#!/usr/bin/env python3
"""
Genera los artefactos de la marca de CountPips: la curva de capital en
retícula de puntos.

    public/logo.png        512x512  — dato estructurado de Organization
                                      (es el logotipo que toma Google) e
                                      icono de la PWA (src/app/manifest.ts)
    src/app/apple-icon.png 180x180  — icono al añadir a pantalla de inicio
    src/app/favicon.ico    16/32/48 — reserva para navegadores que no
                                      resuelven src/app/icon.svg
    src/app/icon.svg       vector   — favicon principal

DE DÓNDE SALE EL DIBUJO
No está inventado: se extrajo punto por punto de la imagen de referencia
que aportó el propietario (un icono de panel LED, 4096x4096, retícula de
41x41 con paso de ~77 px medido por FFT sobre una franja central). El
mapa MOTIVO de abajo es esa extracción, recentrada un punto para que la
figura quede cuadrada dentro de la placa. Seis barras, la línea de precio
en zigzag por encima y la flecha ascendente con su punta: exactamente lo
que trae la referencia.

Sustituye al cuaderno con velas por decisión del propietario (agosto de
2026).

EL FONDO ES PAPEL, NO NEGRO
La referencia trae la placa sobre negro. Aquí el fondo de los mapas de
bits es el papel del sitio (#F0EDE4) y la tinta es la pizarra del acento
en tema claro (#131D26): «papel entintado», que es el lenguaje del sitio,
y despega el icono tanto de una barra clara como de una oscura. El
componente web no lleva fondo: dibuja con rgb(var(--accent-base)) y
hereda el tema.

UNA SOLA RETÍCULA, DOS ACABADOS
Se probaron retículas más gruesas para los tamaños pequeños (27, 21, 17 y
15) remuestreando la referencia, y todas ROMPEN el dibujo: a 27 las
barras salen con huecos de un punto y la punta de la flecha se pierde.
Umbralizar un motivo de trazo fino a baja resolución no simplifica, hace
ruido. Así que la retícula es siempre la misma —la de la referencia— y lo
único que cambia por debajo de 32 px es que se retira la PLACA de puntos
apagados: a ese tamaño mide menos de un píxel por punto y no es detalle,
es suciedad alrededor de la silueta.

LOS PUNTOS SE DIBUJAN COMO UN SOLO TRAZO
En el SVG, cada punto es un subtrazo de longitud cero con
`stroke-linecap: round`. Rinde idéntico a un <circle> —comprobado en
navegador: 3.195 frente a 3.205 píxeles con tinta— y deja UN nodo en vez
de 326. Con la placa serían más de mil.

USO
    python scripts/generate-brand.py          # escribe los artefactos
    python scripts/generate-brand.py --tsx    # imprime las constantes TSX
"""

import sys
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent

PAPER = (240, 237, 228, 255)  # #F0EDE4 — el papel del sitio
TINTA = (19, 29, 38)          # #131D26 — pizarra: --accent-base en claro
VIEW = 512.0
SS = 8  # supermuestreo: PIL no antialiasa círculos pequeños

# La placa se probó a 0,16 de tinta con el punto casi del tamaño del de
# la figura, que es como se ve en la referencia — pero allí es tinta
# CLARA sobre negro y aquí es tinta OSCURA sobre papel, así que la
# relación se invierte: a esos valores el motivo no se despegaba de su
# propio fondo. Medido a cuatro tintas y dos radios, el punto apagado
# tiene que ser visiblemente MENOR y mucho más claro.
TINTA_PLACA = 0.08   # opacidad de los puntos apagados, relativa a la figura
RADIO_REL = 0.36     # radio del punto en fracción del paso de la retícula
RADIO_PLACA_REL = 0.62  # el punto apagado, en fracción del de la figura
UMBRAL_PLACA = 32    # por debajo de este tamaño no se dibuja la placa

# ── El motivo, extraído de la imagen de referencia ────────────────────
# 41x41. Una fila por línea; "#" es punto encendido. No editar a ojo: si
# hay que rehacerlo, volver a extraerlo de la referencia.
MOTIVO = """\
.........................................
.........................................
.........................................
.........................................
.........................................
.........................................
..................................#......
................................##.......
.............................#####.......
...............................###.......
..............................####.......
.............................###.........
............................###..........
...........................###...........
...........................##..#.........
............###...........##..##.........
...........##.##.........##..###.........
..........#....##.......##...###.........
.........##....###.....###...###.........
.........#..#...###....##.##.###.........
........##.##.#..###.###..##.###.........
.......##..##.##..#####..###.###.........
.......##..##.##...###...###.###.........
......##..###.##.#.....#.###.###.........
......#...###.##.##...##.###.###.........
..........###.##.###.###.###.###.........
..........###.##.###.###.###.###.........
.......##.###.##.###.###.###.###.........
......###.###.##.###.###.###.###.........
......###.###.##.###.###.###.###.........
......###.###.##.###.###.###.###.........
......###.###.##.###.###.###.###.........
......###.###.##.###.###.###.###.........
......###.###.##.###.###.###.###.........
.........................................
.........................................
.........................................
.........................................
.........................................
.........................................
.........................................
"""

N = len(MOTIVO.strip("\n").split("\n"))
PASO = VIEW / (N + 1)
RADIO = round(PASO * RADIO_REL, 2)
RADIO_PLACA = round(RADIO * RADIO_PLACA_REL, 2)


def celdas_motivo():
    """Celdas (fila, columna) encendidas del motivo."""
    filas = MOTIVO.strip("\n").split("\n")
    return {(r, c) for r, f in enumerate(filas) for c, ch in enumerate(f) if ch == "#"}


def celdas_placa():
    """Celdas de la placa: el cuadrado redondeado menos el motivo.

    |x|^4 + |y|^4 <= 1 da la silueta de «squircle» de la referencia, que
    no es un rectángulo redondeado sino una curva continua.
    """
    c0 = (N - 1) / 2
    dentro = {
        (r, q)
        for r in range(N)
        for q in range(N)
        if abs((q - c0) / c0) ** 4 + abs((r - c0) / c0) ** 4 <= 1.0
    }
    return dentro - celdas_motivo()


def centro(r, c):
    return round(PASO * (c + 1), 1), round(PASO * (r + 1), 1)


MOTIVO_CELDAS = sorted(celdas_motivo())
PLACA_CELDAS = sorted(celdas_placa())


def trazo(celdas):
    """`d` de un trazo cuyos subtrazos de longitud cero son los puntos."""
    return "".join("M%s %sh0" % centro(r, c) for r, c in celdas)


# ── Mapas de bits ─────────────────────────────────────────────────────
def dibuja(px, con_placa, fondo=PAPER):
    """Pinta la retícula a `px` píxeles de lado sobre el papel."""
    L = px * SS
    esc = L / VIEW
    img = Image.new("RGBA", (L, L), fondo)
    d = ImageDraw.Draw(img)

    def puntos(celdas, radio, alpha):
        rr = radio * esc
        for r, c in celdas:
            cx, cy = centro(r, c)
            x, y = cx * esc, cy * esc
            d.ellipse([x - rr, y - rr, x + rr, y + rr], fill=TINTA + (alpha,))

    if con_placa:
        puntos(PLACA_CELDAS, RADIO_PLACA, round(255 * TINTA_PLACA))
    puntos(MOTIVO_CELDAS, RADIO, 255)
    return img.resize((px, px), Image.LANCZOS)


def icon_svg():
    """El favicon vectorial.

    Sin placa: un favicon se dibuja a 16-32 px, que es justo el rango en
    el que los puntos apagados dejan de ser detalle. El papel de fondo se
    conserva porque despega la figura tanto de una barra clara como de
    una oscura; en transparente, la tinta pizarra desaparecería sobre
    pestañas negras.
    """
    papel = "#%02X%02X%02X" % PAPER[:3]
    tinta = "#%02X%02X%02X" % TINTA
    return (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" '
        'width="512" height="512">\n'
        "  <!-- Favicon: la curva de capital en reticula de puntos.\n"
        "       Generado por scripts/generate-brand.py - no editar a mano. -->\n"
        '  <rect width="512" height="512" rx="96" fill="%s"/>\n' % papel
        + '  <path d="%s" fill="none" stroke="%s" stroke-width="%s" '
        'stroke-linecap="round"/>\n' % (trazo(MOTIVO_CELDAS), tinta, RADIO * 2)
        + "</svg>\n"
    )


def tsx():
    """Imprime las constantes para src/components/tj/BrandGlyph.tsx."""
    print('const MOTIVO = "%s";' % trazo(MOTIVO_CELDAS))
    print('const PLACA = "%s";' % trazo(PLACA_CELDAS))
    print("const GROSOR = %s;" % (RADIO * 2))
    print("const GROSOR_PLACA = %s;" % (RADIO_PLACA * 2))
    print("const UMBRAL_PLACA = %s;" % UMBRAL_PLACA)


def main():
    if "--tsx" in sys.argv:
        tsx()
        return

    dibuja(512, con_placa=True).save(ROOT / "public" / "logo.png")
    dibuja(180, con_placa=True).save(ROOT / "src" / "app" / "apple-icon.png")

    # El .ico sirve 16, 32 y 48: los tres por debajo del umbral, así que
    # ninguno lleva placa. A 48 px un punto apagado mide 0,2 px y lo
    # único que hace es emborronar la silueta justo donde más falta hace
    # que se lea.
    dibuja(48, con_placa=False).save(
        ROOT / "src" / "app" / "favicon.ico",
        sizes=[(16, 16), (32, 32), (48, 48)],
        append_images=[dibuja(32, con_placa=False), dibuja(16, con_placa=False)],
    )

    (ROOT / "src" / "app" / "icon.svg").write_text(icon_svg(), encoding="ascii")

    print("logo.png, apple-icon.png, favicon.ico, icon.svg regenerados.")
    print(
        "reticula %dx%d - motivo %d puntos, placa %d."
        % (N, N, len(MOTIVO_CELDAS), len(PLACA_CELDAS))
    )


if __name__ == "__main__":
    main()
