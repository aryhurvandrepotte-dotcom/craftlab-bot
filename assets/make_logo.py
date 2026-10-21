"""Dessine le logo du bot Craft Lab en pixel art (grille 32x32 agrandie en 512x512).

Usage : python -I assets/make_logo.py  ->  assets/logo.png
"""
from pathlib import Path

from PIL import Image

N = 32          # taille de la grille
SCALE = 16      # 32 x 16 = 512 px
OFFSET = 3      # décalage vertical pour centrer la fiole dans le cercle de Discord

COLORS = {
    'bg': (27, 29, 41),
    'halo': (38, 42, 59),
    'halo2': (46, 52, 74),
    'cork': (107, 62, 31),
    'cork_hi': (154, 91, 46),
    'glass': (207, 232, 255),
    'glass_dark': (127, 167, 201),
    'empty': (51, 64, 90),
    'liquid': (87, 242, 135),
    'liquid_dark': (47, 191, 95),
    'liquid_hi': (182, 255, 207),
    'shine': (255, 255, 255),
    'bubble': (182, 255, 207),
    'spark': (255, 214, 102),
}

img = Image.new('RGB', (N, N), COLORS['bg'])
px = img.load()


def put(x, y, color):
    y += OFFSET
    if 0 <= x < N and 0 <= y < N:
        px[x, y] = COLORS[color]


# Halo rond derrière la fiole
for y in range(N):
    for x in range(N):
        d = ((x - 15.5) ** 2 + (y - 15.5) ** 2) ** 0.5
        if d < 13.5:
            px[x, y] = COLORS['halo2'] if d < 11 else COLORS['halo']

# Bouchon (lignes 5-7)
for x in range(12, 20):
    put(x, 2, 'cork')
    put(x, 4, 'cork')
put(12, 3, 'cork')
put(19, 3, 'cork')
for x in range(13, 19):
    put(x, 3, 'cork_hi')

# Col (lignes 5-9) : contour + verre vide
for y in range(5, 10):
    put(13, y, 'glass')
    put(18, y, 'glass')
    for x in range(14, 18):
        put(x, y, 'empty')
    put(15, y, 'shine') if y in (6, 7) else None

# Corps : s'élargit d'un pixel de chaque côté par ligne, puis fond plat
LIQUID_TOP = 13
body = []
left, right = 13, 18
for y in range(10, 21):
    if y > 10:
        left, right = max(left - 1, 4), min(right + 1, 27)
    body.append((y, left, right))

for y, left, right in body:
    put(left, y, 'glass')
    put(right, y, 'glass')
    for x in range(left + 1, right):
        if y < LIQUID_TOP:
            put(x, y, 'empty')
        elif y == LIQUID_TOP:
            put(x, y, 'liquid_hi')          # surface du liquide
        else:
            put(x, y, 'liquid_dark' if x > right - 3 else 'liquid')
    # reflet sur le verre, côté gauche
    if 11 <= y <= 18:
        put(left + 1, y, 'shine' if y < LIQUID_TOP else 'liquid_hi')

# Fond de la fiole (ligne de contour + coins arrondis)
bottom = body[-1][0] + 1
for x in range(5, 27):
    put(x, bottom, 'glass_dark')
put(4, bottom, 'glass')
put(27, bottom, 'glass')

# Bulles dans le liquide
for x, y in [(11, 16), (17, 15), (21, 18), (14, 19), (19, 17), (9, 19)]:
    put(x, y, 'bubble')

# Bulles qui s'échappent du col
for x, y in [(16, 0), (14, -2), (17, -3)]:
    put(x, y, 'bubble')

# Étincelles "labo"
for cx, cy in [(6, 4), (25, 7)]:
    put(cx, cy, 'spark')
    for dx, dy in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
        put(cx + dx, cy + dy, 'spark')

out = Path(__file__).with_name('logo.png')
img.resize((N * SCALE, N * SCALE), Image.NEAREST).save(out)
print(f'Logo enregistré : {out}')
