#!/usr/bin/env python3
"""Gera a imagem de compartilhamento e os ícones a partir de ativos já aprovados.

Uso (na raiz do repositório): python3 scripts/gerar-og.py
Requer apenas Pillow. Saídas:
  assets/og-image.jpg (1200x630), assets/favicon-32.png, assets/favicon-192.png,
  assets/favicon-512.png, assets/apple-touch-icon.png (180x180, fundo sólido).
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

RAIZ = Path(__file__).resolve().parent.parent
ASSETS = RAIZ / "assets"
VERDE = (8, 122, 81)        # #087a51
VERDE_ESCURO = (7, 62, 50)  # #073e32
MENTA = (182, 243, 211)     # #b6f3d3
FONTE_TITULO = ASSETS / "fonts" / "hanken-grotesk-latin-wght-normal.woff2"


def fonte(tamanho, peso=600):
    """Hanken Grotesk variável (já hospedada no site); cai para DejaVu se o FreeType não ler woff2."""
    for caminho in (FONTE_TITULO, "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"):
        try:
            f = ImageFont.truetype(str(caminho), tamanho)
            try:
                f.set_variation_by_axes([peso])
            except Exception:
                pass
            return f
        except OSError:
            continue
    return ImageFont.load_default(tamanho)


def logo_redondo(tamanho):
    logo = Image.open(ASSETS / "logo.jpg").convert("RGB").resize((tamanho, tamanho), Image.LANCZOS)
    mascara = Image.new("L", (tamanho * 4, tamanho * 4), 0)
    ImageDraw.Draw(mascara).rounded_rectangle((0, 0, tamanho * 4 - 1, tamanho * 4 - 1), radius=tamanho * 4 // 6, fill=255)
    return logo, mascara.resize((tamanho, tamanho), Image.LANCZOS)


def gerar_og():
    W, H = 1200, 630
    img = Image.new("RGB", (W, H), VERDE)
    # Recorte sem o selo do canto e sem a arte do rodapé da foto original.
    larg = 520
    fachada = Image.open(ASSETS / "fachada.webp").convert("RGB").crop((190, 20, 723, 666))
    img.paste(fachada.resize((larg, H), Image.LANCZOS), (W - larg, 0))
    d = ImageDraw.Draw(img)
    d.rectangle((W - larg - 6, 0, W - larg - 1, H), fill=MENTA)
    logo, mascara = logo_redondo(120)
    img.paste(logo, (70, 70), mascara)
    d.text((70, 250), "Clínica Rinosono", font=fonte(68), fill="white")
    d.text((70, 360), "Otorrinolaringologia e", font=fonte(40, 500), fill=MENTA)
    d.text((70, 410), "medicina do sono", font=fonte(40, 500), fill=MENTA)
    d.text((70, 500), "Lages, SC", font=fonte(40, 500), fill="white")
    destino = ASSETS / "og-image.jpg"
    qualidade = 86
    while True:
        img.save(destino, quality=qualidade, optimize=True, progressive=True)
        if destino.stat().st_size <= 200_000 or qualidade <= 50:
            break
        qualidade -= 6
    print(f"{destino.relative_to(RAIZ)} {destino.stat().st_size // 1024} KB")


def gerar_icones():
    fonte_logo = Image.open(ASSETS / "logo.jpg").convert("RGB")
    for nome, tam in (("favicon-32.png", 32), ("favicon-192.png", 192), ("favicon-512.png", 512)):
        logo, mascara = logo_redondo(tam)
        icone = Image.new("RGBA", (tam, tam), (0, 0, 0, 0))
        icone.paste(logo, (0, 0), mascara)
        icone.save(ASSETS / nome, optimize=True)
        print(f"assets/{nome}")
    # Apple touch: fundo sólido, sem transparência; logo ocupa a área inteira.
    apple = fonte_logo.resize((180, 180), Image.LANCZOS)
    apple.save(ASSETS / "apple-touch-icon.png", optimize=True)
    print("assets/apple-touch-icon.png")


if __name__ == "__main__":
    gerar_og()
    gerar_icones()
