#!/usr/bin/env python3
"""Build Lab 6 OpenVPN PDF pages and merge into final report."""
import subprocess
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path("/home/n3xus/Projekty/BezpCDV")
OUT_DIR = ROOT / "build"
SHOTS = ROOT / "screenshots/openvpn"
SRC = ROOT / "Projekt z przedmiotu Bezpieczeństwo Systemów Informatycznych - Nikodem Boniecki - POPRAWIONY.pdf"
BASE_OUT = ROOT / "Projekt z przedmiotu Bezpieczeństwo Systemów Informatycznych - Nikodem Boniecki - FINAL.pdf"
LAB6_OUT = OUT_DIR / "lab6_openvpn.pdf"
PAGES_1_45 = OUT_DIR / "raport_pages_1_45.pdf"

PAGES = [
    ("Lab 6. OpenVPN - konfiguracja serwera", "openvpn01_server_setup.png"),
    ("Lab 6. OpenVPN - uruchomiony tunel VPN (klient)", "openvpn02_tunnel_up.png"),
    ("Lab 6. OpenVPN - ping przez tunel VPN", "openvpn03_ping_tunnel.png"),
    ("Lab 6. OpenVPN - serwer: tun0 i log polaczenia", "openvpn04_server_connected.png"),
]

W, H = 1240, 1754  # A4 @ ~150dpi, matches Canva export


def load_font(size: int):
    for name in (
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
    ):
        p = Path(name)
        if p.exists():
            return ImageFont.truetype(str(p), size)
    return ImageFont.load_default()


def make_page(title: str, shot_name: str) -> Image.Image:
    page = Image.new("RGB", (W, H), "white")
    draw = ImageDraw.Draw(page)
    title_font = load_font(42)
    sub_font = load_font(24)
    draw.text((80, 70), title, fill="black", font=title_font)
    draw.text((80, 130), f"screenshots/openvpn/{shot_name}", fill="#444444", font=sub_font)

    shot = Image.open(SHOTS / shot_name)
    max_w, max_h = W - 160, H - 260
    ratio = min(max_w / shot.width, max_h / shot.height)
    nw, nh = int(shot.width * ratio), int(shot.height * ratio)
    shot = shot.resize((nw, nh), Image.Resampling.LANCZOS)
    x = (W - nw) // 2
    y = 200 + (max_h - nh) // 2
    page.paste(shot, (x, y))
    return page


def images_to_pdf(images, out_pdf: Path):
    rgb = [im.convert("RGB") for im in images]
    rgb[0].save(out_pdf, "PDF", resolution=150.0, save_all=True, append_images=rgb[1:])


def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    pages = [make_page(title, shot) for title, shot in PAGES]
    images_to_pdf(pages, LAB6_OUT)

    subprocess.run(
        [
            "gs",
            "-q",
            "-dNOPAUSE",
            "-dBATCH",
            "-sDEVICE=pdfwrite",
            f"-dFirstPage=1",
            f"-dLastPage=44",
            f"-sOutputFile={PAGES_1_45}",
            str(SRC),
        ],
        check=True,
    )
    subprocess.run(["pdfunite", str(PAGES_1_45), str(LAB6_OUT), str(BASE_OUT)], check=True)
    print(BASE_OUT)


if __name__ == "__main__":
    main()
