"""OC-01 polish (light): denoise + deepen valley between two pools.
Does NOT screen large overlapping ellipses (that re-merged the bake).
Optionally reinforces each pool core with a narrow soft ellipse.
"""
import math
from pathlib import Path

from PIL import Image, ImageFilter, ImageEnhance, ImageChops, ImageOps

TEX = Path(r"d:\trae_git\Person_Website\Code\public\textures\door")
SRC = TEX / "room_floor_lightmap.jpg"
AO = TEX / "room_floor_ao.jpg"
OUT = SRC

ROOM_W, ROOM_D = 6.6, 8.0
HALF_W, HALF_D = ROOM_W / 2, ROOM_D / 2
U0, V0, U1, V1 = 0.02, 0.02, 0.98, 0.98


def world_to_uv(x, z):
    u = U0 + (U1 - U0) * (x + HALF_W) / ROOM_W
    v = V0 + (V1 - V0) * (HALF_D - z) / ROOM_D
    return u, v


def main():
    # Prefer fresh bake dump if present
    raw = TEX / "room_floor_lightmap_raw.jpg"
    src = raw if raw.exists() else SRC
    img = Image.open(src).convert("RGB")
    w, h = img.size

    # Denoise only — preserve bake dual-pool structure
    out = img.filter(ImageFilter.MedianFilter(size=3))
    out = out.filter(ImageFilter.GaussianBlur(radius=1.4))

    pools = [world_to_uv(0.05, 0.15), world_to_uv(0.10, 1.85)]
    # Image coords (y flips v)
    centers = [(u * (w - 1), (1.0 - v) * (h - 1)) for u, v in pools]
    mid_y = (centers[0][1] + centers[1][1]) * 0.5
    mid_x = (centers[0][0] + centers[1][0]) * 0.5

    px = out.load()
    # Deepen valley BETWEEN the two pools (horizontal band between centers)
    for y in range(h):
        for x in range(w):
            # Distance to nearest pool center (ellipse metric)
            d_min = 1e9
            for cx, cy in centers:
                # Prefer slightly elongated along Z (image Y)
                nx = (x - cx) / (0.09 * w)
                ny = (y - cy) / (0.13 * h)
                d_min = min(d_min, math.sqrt(nx * nx + ny * ny))

            r, g, b = px[x, y]
            lum = 0.2126 * r + 0.7152 * g + 0.0722 * b

            # Between pools: crush mid fill when far from both cores
            if d_min > 1.15:
                # Soft darken outside / between
                k = min(1.0, (d_min - 1.15) / 1.8)
                fade = 1.0 - 0.55 * k
                # Extra valley along the midline between the two centers
                along = abs(y - mid_y) / (0.08 * h)
                if along < 1.0 and abs(x - mid_x) < 0.18 * w:
                    fade *= 0.72 + 0.28 * along
                px[x, y] = (int(r * fade), int(g * fade), int(b * fade))
            elif d_min < 0.55 and lum > 40:
                # Mild core lift (warm), keep soft
                lift = (0.55 - d_min) / 0.55 * 0.12
                px[x, y] = (
                    min(255, int(r * (1 + lift))),
                    min(255, int(g * (1 + lift * 0.85))),
                    min(255, int(b * (1 + lift * 0.5))),
                )

    # Soft-knee highlights
    px = out.load()
    for y in range(0, h, 1):
        for x in range(0, w, 1):
            r, g, b = px[x, y]

            def knee(c):
                if c <= 205:
                    return c
                t = (c - 205) / 50.0
                t = max(0.0, min(1.0, t))
                return int(205 + 38 * t * (2 - t))

            px[x, y] = (knee(r), knee(g), knee(b))

    if AO.exists():
        ao = Image.open(AO).convert("L").resize((w, h), Image.Resampling.LANCZOS)
        ao = ao.filter(ImageFilter.GaussianBlur(radius=0.8))
        # Keep AO subtle
        ao = ImageEnhance.Brightness(ao).enhance(1.05)
        out = ImageChops.multiply(out, Image.merge("RGB", (ao, ao, ao)))

    out = ImageEnhance.Color(out).enhance(1.06)
    out = out.filter(ImageFilter.GaussianBlur(radius=0.7))
    out.save(OUT, quality=90, optimize=True)
    print("polished", OUT, OUT.stat().st_size, "from", src.name)
    print("pools uv", pools)


if __name__ == "__main__":
    main()
