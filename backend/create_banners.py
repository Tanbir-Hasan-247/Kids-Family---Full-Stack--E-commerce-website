import os
import math
from PIL import Image, ImageDraw, ImageFont, ImageFilter

OUTPUT_DIR = r"C:\Users\Tanbir Hasan\Desktop\kids&familyV1\backend\media\sliders"
BRAIN_DIR = r"C:\Users\Tanbir Hasan\.gemini\antigravity\brain\e4359606-bd55-45e0-9654-de990786f72e"
VARIANTS_DIR = r"C:\Users\Tanbir Hasan\Desktop\kids&familyV1\backend\media\variants"

os.makedirs(OUTPUT_DIR, exist_ok=True)

TARGET_W = 2400
TARGET_H = 880

def get_font(font_name, size):
    font_path = os.path.join(r"C:\Windows\Fonts", font_name)
    try:
        return ImageFont.truetype(font_path, size)
    except Exception:
        return ImageFont.load_default()

def draw_shadowed_text(draw, pos, text, font, fill=(255, 255, 255), shadow_fill=(0, 0, 0, 180), shadow_offset=(3, 3)):
    x, y = pos
    sx, sy = shadow_offset
    draw.text((x + sx, y + sy), text, font=font, fill=shadow_fill)
    draw.text((x, y), text, font=font, fill=fill)

def draw_golden_frame(draw, w, h, margin=24, color=(212, 175, 55, 210), width=3):
    draw.rectangle([margin, margin, w - margin, h - margin], outline=color, width=width)
    inner = margin + 8
    draw.rectangle([inner, inner, w - inner, h - inner], outline=(color[0], color[1], color[2], 100), width=1)
    
    # Corner diamond accents
    for cx, cy in [(margin, margin), (w - margin, margin), (margin, h - margin), (w - margin, h - margin)]:
        s = 10
        draw.polygon([(cx, cy - s), (cx + s, cy), (cx, cy + s), (cx - s, cy)], fill=color)

# ==============================================================================
# BANNER 1: FESTIVE FAMILY MATCHING COMBO
# ==============================================================================
def create_banner_1():
    print("Generating Banner 1: Family Matching Combo...")
    base_path = os.path.join(BRAIN_DIR, "banner_test_jpg_1791909076683.jpg")
    img = Image.open(base_path).convert("RGBA")
    
    aspect = img.width / img.height
    new_h = TARGET_H
    new_w = int(new_h * aspect)
    img_resized = img.resize((new_w, new_h), Image.Resampling.LANCZOS)
    
    canvas = Image.new("RGBA", (TARGET_W, TARGET_H), (10, 18, 38, 255))
    paste_x = TARGET_W - new_w
    canvas.paste(img_resized, (paste_x, 0))
    
    # Smooth gradient overlay on the left
    gradient = Image.new("RGBA", (TARGET_W, TARGET_H), (0, 0, 0, 0))
    g_draw = ImageDraw.Draw(gradient)
    for x in range(TARGET_W):
        if x < 850:
            alpha = 252
        elif x < 1550:
            factor = (1550 - x) / 700.0
            alpha = int(252 * factor)
        else:
            alpha = 0
        g_draw.line([(x, 0), (x, TARGET_H)], fill=(10, 18, 38, alpha))
    canvas = Image.alpha_composite(canvas, gradient)
    
    draw = ImageDraw.Draw(canvas)
    f_brand = get_font("georgiab.ttf", 26)
    f_badge = get_font("segoeuib.ttf", 24)
    f_h1 = get_font("georgiab.ttf", 76)
    f_h2 = get_font("georgiab.ttf", 76)
    f_sub = get_font("segoeui.ttf", 27)
    f_tag = get_font("segoeuib.ttf", 25)
    f_cta = get_font("segoeuib.ttf", 30)
    f_perk = get_font("segoeui.ttf", 21)
    
    start_x = 95
    
    # Brand Top
    draw_shadowed_text(draw, (start_x, 90), "K I D S  &  F A M I L Y", font=f_brand, fill=(212, 175, 55))
    
    # Category Pill Badge
    pill_box = [start_x, 140, start_x + 400, 185]
    draw.rounded_rectangle(pill_box, radius=22, fill=(212, 175, 55, 45), outline=(212, 175, 55, 230), width=2)
    draw.text((start_x + 24, 148), "EID & FESTIVE SPECIAL COLLECTION", font=f_badge, fill=(255, 225, 120))
    
    # Main Headline
    draw_shadowed_text(draw, (start_x, 215), "FESTIVE FAMILY", font=f_h1, fill=(245, 215, 110), shadow_offset=(4, 4))
    draw_shadowed_text(draw, (start_x, 305), "MATCHING COMBO", font=f_h2, fill=(255, 255, 255), shadow_offset=(4, 4))
    
    # Divider line
    draw.line([(start_x, 415), (start_x + 380, 415)], fill=(212, 175, 55, 240), width=3)
    draw.line([(start_x + 395, 415), (start_x + 435, 415)], fill=(212, 175, 55, 160), width=2)
    
    # Subtitle
    draw_shadowed_text(draw, (start_x, 445), "Coordinated premium outfits for Baba, Ma & Kids.", font=f_sub, fill=(225, 235, 250))
    draw_shadowed_text(draw, (start_x, 490), "Cut from the same royal fabrics for unforgettable family celebrations.", font=f_sub, fill=(185, 205, 230))
    
    # Discount Badge
    tag_box = [start_x, 560, start_x + 410, 620]
    draw.rounded_rectangle(tag_box, radius=16, fill=(190, 30, 45, 240), outline=(255, 130, 130, 220), width=2)
    draw_shadowed_text(draw, (start_x + 25, 573), "FLAT 35% OFF  |  EXCLUSIVE SET", font=f_tag, fill=(255, 255, 255))
    
    # CTA Button
    cta_box = [start_x, 655, start_x + 290, 735]
    draw.rounded_rectangle(cta_box, radius=40, fill=(212, 175, 55, 255), outline=(255, 235, 150, 255), width=2)
    draw.text((start_x + 55, 675), "SHOP NOW  >", font=f_cta, fill=(15, 25, 45))
    
    # Trust Perks
    draw_shadowed_text(draw, (start_x, 785), "Cash on Delivery Available  •  Easy Size Exchange  •  100% Quality Guaranteed", font=f_perk, fill=(175, 195, 220))
    
    # Outer Golden Frame
    draw_golden_frame(draw, TARGET_W, TARGET_H, margin=20, color=(212, 175, 55, 210), width=3)
    
    out_path = os.path.join(OUTPUT_DIR, "slider_banner_1_family.jpg")
    canvas.convert("RGB").save(out_path, "JPEG", quality=95)
    print("Saved:", out_path)
    return out_path


# ==============================================================================
# BANNER 2: ROYAL PANJABI & KOTI (FATHER & SON)
# ==============================================================================
def create_banner_2():
    print("Generating Banner 2: Royal Panjabi & Koti (Father & Son)...")
    base_path = os.path.join(BRAIN_DIR, "banner_father_son_jpg_1791909140638.jpg")
    img = Image.open(base_path).convert("RGBA")
    
    aspect = img.width / img.height
    new_h = TARGET_H
    new_w = int(new_h * aspect)
    img_resized = img.resize((new_w, new_h), Image.Resampling.LANCZOS)
    
    canvas = Image.new("RGBA", (TARGET_W, TARGET_H), (10, 26, 18, 255))
    canvas.paste(img_resized, (0, 0))
    
    # Deep opaque gradient starting at x=550 reaching full opacity at x=880 to completely cover ghost background text
    gradient = Image.new("RGBA", (TARGET_W, TARGET_H), (0, 0, 0, 0))
    g_draw = ImageDraw.Draw(gradient)
    for x in range(TARGET_W):
        if x > 880:
            alpha = 255
        elif x > 550:
            factor = (x - 550) / 330.0
            alpha = int(255 * factor)
        else:
            alpha = 0
        g_draw.line([(x, 0), (x, TARGET_H)], fill=(10, 26, 18, alpha))
    canvas = Image.alpha_composite(canvas, gradient)
    
    draw = ImageDraw.Draw(canvas)
    f_brand = get_font("georgiab.ttf", 26)
    f_badge = get_font("segoeuib.ttf", 24)
    f_h1 = get_font("georgiab.ttf", 74)
    f_h2 = get_font("georgiab.ttf", 74)
    f_sub = get_font("segoeui.ttf", 27)
    f_tag = get_font("segoeuib.ttf", 25)
    f_cta = get_font("segoeuib.ttf", 30)
    f_perk = get_font("segoeui.ttf", 21)
    
    start_x = 1180
    
    # Brand Top
    draw_shadowed_text(draw, (start_x, 90), "K I D S  &  F A M I L Y   L U X U R Y", font=f_brand, fill=(212, 175, 55))
    
    # Category Pill
    pill_box = [start_x, 140, start_x + 420, 185]
    draw.rounded_rectangle(pill_box, radius=22, fill=(212, 175, 55, 45), outline=(212, 175, 55, 230), width=2)
    draw.text((start_x + 24, 148), "ROYAL HERITAGE FESTIVE COLLECTION", font=f_badge, fill=(255, 225, 120))
    
    # Main Headline
    draw_shadowed_text(draw, (start_x, 215), "PANJABI & KOTI", font=f_h1, fill=(245, 215, 110), shadow_offset=(4, 4))
    draw_shadowed_text(draw, (start_x, 305), "FATHER & SON COMBO", font=f_h2, fill=(255, 255, 255), shadow_offset=(4, 4))
    
    # Divider Line
    draw.line([(start_x, 415), (start_x + 390, 415)], fill=(212, 175, 55, 240), width=3)
    draw.line([(start_x + 405, 415), (start_x + 445, 415)], fill=(212, 175, 55, 160), width=2)
    
    # Subtitle
    draw_shadowed_text(draw, (start_x, 445), "Handcrafted embroidery on pure cotton & silk blend.", font=f_sub, fill=(225, 240, 230))
    draw_shadowed_text(draw, (start_x, 490), "Make Eid, Jummah and family festivals truly memorable.", font=f_sub, fill=(190, 215, 200))
    
    # Discount Badge
    tag_box = [start_x, 560, start_x + 440, 620]
    draw.rounded_rectangle(tag_box, radius=16, fill=(180, 30, 40, 240), outline=(255, 130, 130, 220), width=2)
    draw_shadowed_text(draw, (start_x + 24, 573), "SPECIAL 40% OFF  |  LIMITED EDITION", font=f_tag, fill=(255, 255, 255))
    
    # CTA Button
    cta_box = [start_x, 655, start_x + 410, 735]
    draw.rounded_rectangle(cta_box, radius=40, fill=(212, 175, 55, 255), outline=(255, 235, 150, 255), width=2)
    draw.text((start_x + 48, 675), "EXPLORE PANJABI SETS  >", font=f_cta, fill=(12, 28, 20))
    
    # Trust Perks
    draw_shadowed_text(draw, (start_x, 785), "Premium Fabrics  •  Fast Nationwide Delivery  •  Cash on Delivery", font=f_perk, fill=(180, 210, 195))
    
    # Outer Golden Frame
    draw_golden_frame(draw, TARGET_W, TARGET_H, margin=20, color=(212, 175, 55, 210), width=3)
    
    out_path = os.path.join(OUTPUT_DIR, "slider_banner_2_panjabi.jpg")
    canvas.convert("RGB").save(out_path, "JPEG", quality=95)
    print("Saved:", out_path)
    return out_path


# ==============================================================================
# BANNER 3: JOYFUL KIDS' SUMMER & PLAYFUL WEAR
# ==============================================================================
def create_banner_3():
    print("Generating Banner 3: Joyful Kids Wear...")
    base_path = os.path.join(BRAIN_DIR, "banner_kids_playful_jpg_1791909113150.jpg")
    img = Image.open(base_path).convert("RGBA")
    
    aspect = img.width / img.height
    new_h = TARGET_H
    new_w = int(new_h * aspect)
    img_resized = img.resize((new_w, new_h), Image.Resampling.LANCZOS)
    
    canvas = Image.new("RGBA", (TARGET_W, TARGET_H), (248, 245, 240, 255))
    canvas.paste(img_resized, (0, 0))
    
    # Soft warm white gradient on right side
    gradient = Image.new("RGBA", (TARGET_W, TARGET_H), (0, 0, 0, 0))
    g_draw = ImageDraw.Draw(gradient)
    for x in range(TARGET_W):
        if x > 1400:
            alpha = 245
        elif x > 900:
            factor = (x - 900) / 500.0
            alpha = int(245 * factor)
        else:
            alpha = 0
        g_draw.line([(x, 0), (x, TARGET_H)], fill=(252, 250, 246, alpha))
    canvas = Image.alpha_composite(canvas, gradient)
    
    draw = ImageDraw.Draw(canvas)
    f_brand = get_font("georgiab.ttf", 26)
    f_badge = get_font("segoeuib.ttf", 24)
    f_h1 = get_font("georgiab.ttf", 74)
    f_h2 = get_font("georgiab.ttf", 74)
    f_sub = get_font("segoeui.ttf", 27)
    f_tag = get_font("segoeuib.ttf", 25)
    f_cta = get_font("segoeuib.ttf", 30)
    f_perk = get_font("segoeui.ttf", 21)
    
    start_x = 1200
    
    # Brand Top
    draw_shadowed_text(draw, (start_x, 90), "K I D S  &  F A M I L Y   J U N I O R", font=f_brand, fill=(210, 105, 30), shadow_fill=(255, 255, 255, 120), shadow_offset=(2, 2))
    
    # Category Pill
    pill_box = [start_x, 140, start_x + 420, 185]
    draw.rounded_rectangle(pill_box, radius=22, fill=(255, 235, 205, 230), outline=(230, 130, 40, 200), width=2)
    draw.text((start_x + 24, 148), "TRENDY CASUAL & PARTY COLLECTION", font=f_badge, fill=(180, 75, 15))
    
    # Main Headline
    draw_shadowed_text(draw, (start_x, 215), "JOYFUL KIDS WEAR", font=f_h1, fill=(25, 45, 65), shadow_fill=(255, 255, 255, 200), shadow_offset=(3, 3))
    draw_shadowed_text(draw, (start_x, 305), "BOYS & GIRLS STYLES", font=f_h2, fill=(215, 65, 40), shadow_fill=(255, 255, 255, 200), shadow_offset=(3, 3))
    
    # Divider Line
    draw.line([(start_x, 415), (start_x + 390, 415)], fill=(230, 130, 40, 240), width=3)
    draw.line([(start_x + 405, 415), (start_x + 445, 415)], fill=(230, 130, 40, 160), width=2)
    
    # Subtitle
    draw_shadowed_text(draw, (start_x, 445), "Soft organic cotton, vibrant colors & comfortable fits.", font=f_sub, fill=(60, 70, 85), shadow_fill=(255, 255, 255, 160))
    draw_shadowed_text(draw, (start_x, 490), "Smart polo shirts, cute floral dresses and active wear.", font=f_sub, fill=(90, 100, 115), shadow_fill=(255, 255, 255, 160))
    
    # Discount Badge
    tag_box = [start_x, 560, start_x + 440, 620]
    draw.rounded_rectangle(tag_box, radius=16, fill=(230, 50, 65, 240), outline=(255, 150, 150, 230), width=2)
    draw_shadowed_text(draw, (start_x + 25, 573), "UP TO 50% OFF  |  SPECIAL SEASON", font=f_tag, fill=(255, 255, 255))
    
    # CTA Button
    cta_box = [start_x, 655, start_x + 350, 735]
    draw.rounded_rectangle(cta_box, radius=40, fill=(25, 55, 85, 255), outline=(55, 95, 140, 255), width=2)
    draw.text((start_x + 46, 675), "SHOP KIDS WEAR  >", font=f_cta, fill=(255, 255, 255))
    
    # Trust Perks
    draw_shadowed_text(draw, (start_x, 785), "100% Breathable Cotton  •  Safe For Sensitive Skin  •  Fast Delivery", font=f_perk, fill=(110, 120, 135), shadow_fill=(255, 255, 255, 120))
    
    # Outer Framing
    draw_golden_frame(draw, TARGET_W, TARGET_H, margin=20, color=(210, 140, 45, 200), width=3)
    
    out_path = os.path.join(OUTPUT_DIR, "slider_banner_3_kids.jpg")
    canvas.convert("RGB").save(out_path, "JPEG", quality=95)
    print("Saved:", out_path)
    return out_path


# ==============================================================================
# BANNER 4: GIRLS' PRINCESS FROCKS & PARTY DRESSES (DUAL SHOWCASE)
# ==============================================================================
def create_banner_4():
    print("Generating Banner 4: Girls' Party Dresses (Dual Showcase)...")
    frock1_path = os.path.join(VARIANTS_DIR, "kf_real_prod_16_1.jpg") # Maroon
    frock2_path = os.path.join(VARIANTS_DIR, "kf_real_prod_17_1.jpg") # Yellow
    
    img1 = Image.open(frock1_path).convert("RGBA")
    img2 = Image.open(frock2_path).convert("RGBA")
    
    # Deep royal festive maroon/burgundy luxury canvas
    canvas = Image.new("RGBA", (TARGET_W, TARGET_H), (58, 14, 25, 255))
    
    # Radial glows behind images
    bg_glow = Image.new("RGBA", (TARGET_W, TARGET_H), (0, 0, 0, 0))
    bg_draw = ImageDraw.Draw(bg_glow)
    for r in range(500, 0, -15):
        alpha = int((1.0 - r / 500.0) * 150)
        bg_draw.ellipse([1850 - r, 440 - r, 1850 + r, 440 + r], fill=(180, 45, 75, alpha))
    canvas = Image.alpha_composite(canvas, bg_glow)
    
    # Target frame height for photos
    target_h1 = int(TARGET_H * 0.88)
    aspect1 = img1.width / img1.height
    target_w1 = int(target_h1 * aspect1)
    img1_resized = img1.resize((target_w1, target_h1), Image.Resampling.LANCZOS)
    
    target_h2 = int(TARGET_H * 0.80)
    aspect2 = img2.width / img2.height
    target_w2 = int(target_h2 * aspect2)
    img2_resized = img2.resize((target_w2, target_h2), Image.Resampling.LANCZOS)
    
    # Paste Photo 2 (Yellow frock, center-right)
    mask2 = Image.new("L", (target_w2, target_h2), 0)
    ImageDraw.Draw(mask2).rounded_rectangle([0, 0, target_w2, target_h2], radius=32, fill=255)
    paste2_x = TARGET_W - target_w1 - target_w2 - 110
    paste2_y = int((TARGET_H - target_h2) / 2)
    
    # Gold border for Photo 2
    s2 = Image.new("RGBA", (TARGET_W, TARGET_H), (0, 0, 0, 0))
    ImageDraw.Draw(s2).rounded_rectangle([paste2_x - 6, paste2_y - 6, paste2_x + target_w2 + 6, paste2_y + target_h2 + 6], radius=36, fill=(212, 175, 55, 160), outline=(255, 225, 120, 240), width=3)
    canvas = Image.alpha_composite(canvas, s2)
    canvas.paste(img2_resized, (paste2_x, paste2_y), mask2)
    
    # Paste Photo 1 (Maroon frock, rightmost hero)
    mask1 = Image.new("L", (target_w1, target_h1), 0)
    ImageDraw.Draw(mask1).rounded_rectangle([0, 0, target_w1, target_h1], radius=36, fill=255)
    paste1_x = TARGET_W - target_w1 - 70
    paste1_y = int((TARGET_H - target_h1) / 2)
    
    # Gold border for Photo 1
    s1 = Image.new("RGBA", (TARGET_W, TARGET_H), (0, 0, 0, 0))
    ImageDraw.Draw(s1).rounded_rectangle([paste1_x - 8, paste1_y - 8, paste1_x + target_w1 + 8, paste1_y + target_h1 + 8], radius=42, fill=(212, 175, 55, 190), outline=(255, 230, 140, 255), width=3)
    canvas = Image.alpha_composite(canvas, s1)
    canvas.paste(img1_resized, (paste1_x, paste1_y), mask1)
    
    draw = ImageDraw.Draw(canvas)
    f_brand = get_font("georgiab.ttf", 26)
    f_badge = get_font("segoeuib.ttf", 24)
    f_h1 = get_font("georgiab.ttf", 74)
    f_h2 = get_font("georgiab.ttf", 74)
    f_sub = get_font("segoeui.ttf", 27)
    f_tag = get_font("segoeuib.ttf", 25)
    f_cta = get_font("segoeuib.ttf", 30)
    f_perk = get_font("segoeui.ttf", 21)
    
    start_x = 90
    
    # Brand Top
    draw_shadowed_text(draw, (start_x, 90), "K I D S  &  F A M I L Y   P R I N C E S S", font=f_brand, fill=(245, 215, 110))
    
    # Category Pill
    pill_box = [start_x, 140, start_x + 420, 185]
    draw.rounded_rectangle(pill_box, radius=22, fill=(212, 175, 55, 45), outline=(212, 175, 55, 230), width=2)
    draw.text((start_x + 24, 148), "DESIGNER FROCKS & FESTIVE DRESSES", font=f_badge, fill=(255, 225, 120))
    
    # Main Headline
    draw_shadowed_text(draw, (start_x, 215), "GIRLS' ELEGANT", font=f_h1, fill=(255, 225, 120), shadow_offset=(4, 4))
    draw_shadowed_text(draw, (start_x, 305), "PARTY & FROCK SETS", font=f_h2, fill=(255, 255, 255), shadow_offset=(4, 4))
    
    # Divider Line
    draw.line([(start_x, 415), (start_x + 390, 415)], fill=(212, 175, 55, 240), width=3)
    draw.line([(start_x + 405, 415), (start_x + 445, 415)], fill=(212, 175, 55, 160), width=2)
    
    # Subtitle
    draw_shadowed_text(draw, (start_x, 445), "Gorgeous handcrafted cotton frocks with matching headband.", font=f_sub, fill=(245, 225, 230))
    draw_shadowed_text(draw, (start_x, 490), "Made for twirling, celebrating and looking like a little princess.", font=f_sub, fill=(220, 195, 205))
    
    # Discount Badge
    tag_box = [start_x, 560, start_x + 410, 620]
    draw.rounded_rectangle(tag_box, radius=16, fill=(185, 30, 45, 240), outline=(255, 130, 130, 220), width=2)
    draw_shadowed_text(draw, (start_x + 24, 573), "SPECIAL 30% OFF  |  NEW ARRIVALS", font=f_tag, fill=(255, 255, 255))
    
    # CTA Button
    cta_box = [start_x, 655, start_x + 310, 735]
    draw.rounded_rectangle(cta_box, radius=40, fill=(212, 175, 55, 255), outline=(255, 235, 150, 255), width=2)
    draw.text((start_x + 50, 675), "SHOP FROCKS  >", font=f_cta, fill=(45, 10, 18))
    
    # Trust Perks
    draw_shadowed_text(draw, (start_x, 785), "Pure Soft Cotton  •  Skin-Friendly Dyes  •  Cash on Delivery Available", font=f_perk, fill=(215, 190, 200))
    
    # Outer Golden Frame
    draw_golden_frame(draw, TARGET_W, TARGET_H, margin=20, color=(212, 175, 55, 210), width=3)
    
    out_path = os.path.join(OUTPUT_DIR, "slider_banner_4_frocks.jpg")
    canvas.convert("RGB").save(out_path, "JPEG", quality=95)
    print("Saved:", out_path)
    return out_path

if __name__ == "__main__":
    create_banner_1()
    create_banner_2()
    create_banner_3()
    create_banner_4()
    print("All 4 premium banners regenerated successfully!")
