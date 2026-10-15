"""Post-polish room_floor_lightmap.jpg: denoise + two soft elliptical pools.
UV2 floor: u~(x), v~(HALF_D - z). Ceiling spots at three.js (0.05,0.15) & (0.1,1.85).
"""
import math
from pathlib import Path

from PIL import Image, ImageFilter, ImageEnhance

TEX = Path(r"d:\trae_git\Person_Website\Code\public\textures\door")
SRC = TEX / "room_floor_lightmap.jpg"
OUT = SRC

ROOM_W, ROOM_D = 6.6, 8.0
HALF_W, HALF_D = ROOM_W / 2, ROOM_D / 2
U0, V0, U1, V1 = 0.02, 0.02, 0.98, 0.98


def world_to_uv(x, z):
    u = U0 + (U1 - U0) * (x + HALF_W) / ROOM_W
    v = V0 + (V1 - V0) * (HALF_D - z) / ROOM_D
    return u, v


def main():
    img = Image.open(SRC).convert("RGB")
    w, h = img.size

    # Denoise: median then gaussian (keeps soft edges better than sharpen)
    clean = img.filter(ImageFilter.MedianFilter(size=3))
    clean = clean.filter(ImageFilter.GaussianBlur(radius=1.6))
    clean = ImageEnhance.Color(clean).enhance(1.05)

    # Soft elliptical pool overlays (additive warm glow)
    pools = [
        (*world_to_uv(0.05, 0.15), 0.11, 0.15, 0.55),  # u,v, rx, ry, strength
        (*world_to_uv(0.10, 1.85), 0.10, 0.14, 0.48),
    ]
    base = clean.load()
    out = clean.copy()
    px = out.load()

    for u, v, rx, ry, strength in pools:
        cx, cy = u * (w - 1), (1.0 - v) * (h - 1)  # image y flips V
        rx_px, ry_px = rx * w, ry * h
        x0 = max(0, int(cx - rx_px * 2.2))
        x1 = min(w, int(cx + rx_px * 2.2) + 1)
        y0 = max(0, int(cy - ry_px * 2.2))
        y1 = min(h, int(cy + ry_px * 2.2) + 1)
        for y in range(y0, y1):
            for x in range(x0, x1):
                nx = (x - cx) / max(1e-6, rx_px)
                ny = (y - cy) / max(1e-6, ry_px)
                d2 = nx * nx + ny * ny
                if d2 > 4.5:
                    continue
                fall = math.exp(-d2 * 0.85)
                r, g, b = px[x, y]
                add = strength * fall * 255.0
                px[x, y] = (
                    min(255, int(r + add * 1.0)),
                    min(255, int(g + add * 0.78)),
                    min(255, int(b + add * 0.42)),
                )

    # Mild contrast: crush muddy mid-gray, keep pool highs
    out = ImageEnhance.Contrast(out).enhance(1.18)
    out = ImageEnhance.Brightness(out).enhance(0.96)
    # Final tiny blur so pool edges stay soft (not crispy)
    out = out.filter(ImageFilter.GaussianBlur(radius=0.8))

    out.save(OUT, quality=88, optimize=True)
    print("polished", OUT, OUT.stat().st_size)
    print("pools uv", [world_to_uv(0.05, 0.15), world_to_uv(0.10, 1.85)])


if __name__ == "__main__":
    main()
