#!/usr/bin/env python3
"""Generate branded QR assets and verify that every asset decodes exactly."""

from __future__ import annotations

import io
import sys
import tempfile
from pathlib import Path

import cv2
import numpy as np
import segno
from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "site" / "assets" / "qr"
SITE_URL = "https://b1axk-bit.github.io/silu-huhang-showcase/"
INK = "#081A2B"
PAPER = "#F7F5EF"
GOLD = "#C7A45B"
JADE = "#185751"


def font(size: int, bold: bool = False) -> ImageFont.ImageFont:
    candidates = [
        "/System/Library/Fonts/PingFang.ttc",
        "/System/Library/Fonts/Supplemental/Arial Unicode.ttf",
    ]
    for candidate in candidates:
        path = Path(candidate)
        if path.exists():
            index = 2 if bold and path.suffix == ".ttc" else 0
            return ImageFont.truetype(str(path), size=size, index=index)
    return ImageFont.load_default()


def qr_png(scale: int) -> Image.Image:
    qr = segno.make(SITE_URL, error="h")
    buffer = io.BytesIO()
    qr.save(buffer, kind="png", scale=scale, border=4, dark=INK, light=PAPER)
    buffer.seek(0)
    return Image.open(buffer).convert("RGB")


def draw_brand_mark(draw: ImageDraw.ImageDraw, center_x: int, top: int, size: int) -> None:
    half = size // 2
    points = [
        (center_x, top),
        (center_x + half, top + size // 5),
        (center_x + half - 2, top + int(size * 0.62)),
        (center_x, top + size),
        (center_x - half + 2, top + int(size * 0.62)),
        (center_x - half, top + size // 5),
    ]
    draw.polygon(points, fill=INK, outline=GOLD, width=max(2, size // 40))
    gate_y = top + int(size * 0.65)
    gate_w = int(size * 0.48)
    draw.line((center_x - gate_w, gate_y, center_x + gate_w, gate_y), fill=PAPER, width=max(2, size // 35))
    draw.rectangle(
        (center_x - int(size * 0.25), top + int(size * 0.43), center_x + int(size * 0.25), gate_y),
        outline=PAPER,
        width=max(2, size // 35),
    )
    point_r = max(4, size // 14)
    point_x = center_x + int(size * 0.34)
    point_y = top + int(size * 0.28)
    draw.ellipse((point_x - point_r, point_y - point_r, point_x + point_r, point_y + point_r), fill=GOLD)


def branded_asset(width: int, height: int, qr_scale: int, output: Path) -> None:
    canvas = Image.new("RGB", (width, height), PAPER)
    draw = ImageDraw.Draw(canvas)
    margin = int(width * 0.055)
    border = max(3, width // 300)
    draw.rounded_rectangle(
        (margin, margin, width - margin, height - margin),
        radius=max(12, width // 70),
        outline=GOLD,
        width=border,
    )

    mark_size = int(width * 0.11)
    draw_brand_mark(draw, width // 2, int(height * 0.065), mark_size)
    title_font = font(int(width * 0.047), bold=True)
    subtitle_font = font(int(width * 0.023))
    title = "扫码了解丝路护航"
    subtitle = "项目介绍页｜非业务办理入口"
    title_box = draw.textbbox((0, 0), title, font=title_font)
    subtitle_box = draw.textbbox((0, 0), subtitle, font=subtitle_font)
    title_y = int(height * 0.18)
    draw.text(((width - (title_box[2] - title_box[0])) / 2, title_y), title, font=title_font, fill=INK)
    draw.text(
        ((width - (subtitle_box[2] - subtitle_box[0])) / 2, title_y + int(width * 0.068)),
        subtitle,
        font=subtitle_font,
        fill=JADE,
    )

    qr = qr_png(qr_scale)
    max_qr = int(min(width * 0.68, height * 0.56))
    qr.thumbnail((max_qr, max_qr), Image.Resampling.NEAREST)
    qr_x = (width - qr.width) // 2
    qr_y = int(height * 0.32)
    pad = max(12, width // 55)
    draw.rounded_rectangle(
        (qr_x - pad, qr_y - pad, qr_x + qr.width + pad, qr_y + qr.height + pad),
        radius=max(8, width // 90),
        fill="#FFFFFF",
        outline="#DDE3E6",
        width=max(2, width // 500),
    )
    canvas.paste(qr, (qr_x, qr_y))
    canvas.save(output, format="PNG", optimize=True)


def decode(path: Path) -> str:
    image = cv2.imread(str(path))
    if image is None:
        raise RuntimeError(f"Could not read {path}")
    value, _, _ = cv2.QRCodeDetector().detectAndDecode(image)
    return value


def main() -> int:
    OUTPUT.mkdir(parents=True, exist_ok=True)
    qr = segno.make(SITE_URL, error="h")
    core_svg = OUTPUT / "silu-huhang-qr-core.svg"
    poster = OUTPUT / "silu-huhang-qr-poster.png"
    print_asset = OUTPUT / "silu-huhang-qr-print.png"
    qr.save(core_svg, scale=8, border=4, dark=INK, light=PAPER, xmldecl=False)
    branded_asset(1200, 1480, 10, poster)
    branded_asset(1800, 2220, 15, print_asset)

    with tempfile.TemporaryDirectory() as temp_dir:
      core_png = Path(temp_dir) / "core-from-svg.png"
      qr.save(core_png, kind="png", scale=12, border=4, dark=INK, light=PAPER)
      decoded = {
          "core SVG raster": decode(core_png),
          "poster PNG": decode(poster),
          "print PNG": decode(print_asset),
      }

    failed = False
    for label, value in decoded.items():
        ok = value == SITE_URL
        failed = failed or not ok
        print(f"{label}: {'PASS' if ok else 'FAIL'} -> {value}")

    if failed:
        return 1
    print("All QR assets decode to the confirmed Pages URL.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
