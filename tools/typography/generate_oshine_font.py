from __future__ import annotations

from pathlib import Path
from typing import Dict

from shapely.geometry import LineString, Polygon, MultiPolygon, box, Point
from shapely.ops import unary_union
from fontTools.fontBuilder import FontBuilder
from fontTools.pens.ttGlyphPen import TTGlyphPen
from fontTools.ttLib import TTFont

UPM = 1000
CAP = 700
ASC = 860
DESC = -220
STEM = 150
SERIF = 64
OUT = Path("build/typography/o-shine-royal-display")
OUT.mkdir(parents=True, exist_ok=True)


def capsule(points, width=STEM):
    return LineString(points).buffer(width / 2, cap_style=1, join_style=1, quad_segs=6)


def round_rect(x0, y0, x1, y1, rad=36):
    if x1 <= x0 or y1 <= y0:
        return Polygon()
    rad = max(0, min(rad, (x1 - x0) / 2, (y1 - y0) / 2))
    if rad == 0:
        return box(x0, y0, x1, y1)
    return box(x0 + rad, y0 + rad, x1 - rad, y1 - rad).buffer(rad, quad_segs=6)


def ring_round_rect(x0, y0, x1, y1, thickness=STEM, rad=150):
    outer = round_rect(x0, y0, x1, y1, rad)
    inner = round_rect(
        x0 + thickness,
        y0 + thickness,
        x1 - thickness,
        y1 - thickness,
        max(20, rad - thickness * 0.65),
    )
    return outer.difference(inner)


def serif_bar(cx, y, width=STEM + 2 * SERIF, height=70):
    return round_rect(cx - width / 2, y - height / 2, cx + width / 2, y + height / 2, 24)


def vstem(x, y0=0, y1=CAP, serif_top=True, serif_bottom=True, t=STEM):
    g = round_rect(x - t / 2, y0, x + t / 2, y1, 34)
    parts = [g]
    if serif_top:
        parts.append(serif_bar(x, y1 - 28, t + 2 * SERIF, 72))
    if serif_bottom:
        parts.append(serif_bar(x, y0 + 28, t + 2 * SERIF, 72))
    return unary_union(parts)


def hbar(y, x0, x1, t=STEM, rad=32):
    return round_rect(x0, y - t / 2, x1, y + t / 2, rad)


def cut_rect(g, x0, y0, x1, y1):
    return g.difference(box(x0, y0, x1, y1))


def normalize(g):
    if g.is_empty:
        return g
    return g if g.is_valid else g.buffer(0)


def glyph_geom(ch: str):
    W = 640
    g = None
    if ch == "A":
        g = unary_union([
            capsule([(125, 0), (320, CAP)], STEM),
            capsule([(515, 0), (320, CAP)], STEM),
            hbar(275, 190, 450, 120),
            serif_bar(125, 30, 210, 70),
            serif_bar(515, 30, 210, 70),
        ])
    elif ch == "B":
        left = vstem(125)
        outer1 = ring_round_rect(90, 330, 560, 710, 145, 145)
        outer2 = ring_round_rect(90, -10, 575, 390, 145, 155)
        g = unary_union([left, cut_rect(outer1, 0, 250, 155, 800), cut_rect(outer2, 0, -100, 155, 450)])
    elif ch == "C":
        g = cut_rect(ring_round_rect(70, -10, 585, 710, 150, 190), 430, 110, 690, 590)
        g = unary_union([g, round_rect(380, 525, 520, 675, 32), round_rect(380, 25, 520, 175, 32)])
    elif ch == "D":
        bowl = cut_rect(ring_round_rect(85, -5, 590, 705, 150, 190), 0, -100, 155, 800)
        g = unary_union([vstem(125), bowl])
    elif ch == "E":
        g = unary_union([vstem(125), hbar(625, 105, 565, 145), hbar(350, 105, 505, 130), hbar(75, 105, 565, 145)])
    elif ch == "F":
        g = unary_union([vstem(125), hbar(625, 105, 565, 145), hbar(350, 105, 505, 130)])
    elif ch == "G":
        g = cut_rect(ring_round_rect(65, -10, 590, 710, 150, 190), 435, 160, 700, 565)
        g = unary_union([g, hbar(330, 350, 590, 130), round_rect(480, 120, 610, 370, 30)])
    elif ch == "H":
        g = unary_union([vstem(125), vstem(515), hbar(350, 120, 520, 130)])
    elif ch == "I":
        W = 420
        g = unary_union([vstem(210), hbar(625, 75, 345, 120), hbar(75, 75, 345, 120)])
    elif ch == "J":
        W = 560
        g = unary_union([hbar(625, 145, 510, 135), capsule([(440, 630), (440, 155), (350, 60), (225, 60), (150, 120)], 150), serif_bar(440, 630, 260, 70)])
    elif ch == "K":
        g = unary_union([vstem(125), capsule([(165, 350), (515, 675)], 135), capsule([(165, 350), (535, 35)], 140), serif_bar(500, 655, 190, 68), serif_bar(520, 45, 200, 68)])
    elif ch == "L":
        g = unary_union([vstem(125), hbar(75, 105, 565, 145)])
    elif ch == "M":
        W = 760
        g = unary_union([vstem(115), vstem(645), capsule([(115, 625), (285, 285)], 140), capsule([(285, 285), (645, 625)], 140)])
    elif ch == "N":
        g = unary_union([vstem(125), vstem(515), capsule([(150, 620), (490, 80)], 140)])
    elif ch == "O":
        g = ring_round_rect(65, -10, 590, 710, 150, 200)
    elif ch == "P":
        bowl = cut_rect(ring_round_rect(85, 300, 585, 710, 145, 155), 0, 250, 155, 800)
        g = unary_union([vstem(125), bowl])
    elif ch == "Q":
        g = unary_union([ring_round_rect(65, -10, 590, 710, 150, 200), capsule([(370, 170), (565, -35)], 110)])
    elif ch == "R":
        bowl = cut_rect(ring_round_rect(85, 300, 585, 710, 145, 155), 0, 250, 155, 800)
        g = unary_union([vstem(125), bowl, capsule([(330, 330), (560, 35)], 145), serif_bar(545, 42, 190, 68)])
    elif ch == "S":
        pts = [(520, 600), (455, 665), (275, 670), (145, 610), (120, 500), (170, 430), (455, 300), (520, 230), (515, 115), (440, 45), (260, 35), (120, 105)]
        g = unary_union([capsule(pts, 150), round_rect(400, 575, 550, 690, 32), round_rect(90, 20, 245, 135, 32)])
    elif ch == "T":
        g = unary_union([vstem(320, 0, CAP, True, True), hbar(625, 65, 575, 145)])
    elif ch == "U":
        pts = [(125, 640), (125, 170), (180, 70), (320, 35), (460, 70), (515, 170), (515, 640)]
        g = unary_union([capsule(pts, 150), serif_bar(125, 640, 250, 70), serif_bar(515, 640, 250, 70)])
    elif ch == "V":
        g = unary_union([capsule([(120, 650), (320, 45)], 150), capsule([(520, 650), (320, 45)], 150), serif_bar(120, 635, 210, 70), serif_bar(520, 635, 210, 70)])
    elif ch == "W":
        W = 800
        g = unary_union([capsule([(100, 650), (230, 45)], 145), capsule([(230, 45), (400, 405)], 135), capsule([(400, 405), (570, 45)], 135), capsule([(570, 45), (700, 650)], 145), serif_bar(100, 635, 190, 68), serif_bar(700, 635, 190, 68)])
    elif ch == "X":
        g = unary_union([capsule([(120, 650), (520, 45)], 145), capsule([(520, 650), (120, 45)], 145), serif_bar(120, 635, 195, 68), serif_bar(520, 635, 195, 68), serif_bar(120, 50, 195, 68), serif_bar(520, 50, 195, 68)])
    elif ch == "Y":
        g = unary_union([capsule([(120, 650), (320, 360)], 145), capsule([(520, 650), (320, 360)], 145), vstem(320, 0, 385, False, True, 145), serif_bar(120, 635, 195, 68), serif_bar(520, 635, 195, 68)])
    elif ch == "Z":
        g = unary_union([hbar(625, 95, 545, 145), capsule([(505, 600), (135, 95)], 150), hbar(75, 95, 545, 145)])
    elif ch == "0":
        W = 590
        g = unary_union([ring_round_rect(70, -5, 520, 705, 145, 175), capsule([(190, 120), (400, 585)], 70)])
    elif ch == "1":
        W = 430
        g = unary_union([vstem(245, 0, CAP, True, True, 145), capsule([(110, 555), (245, 665)], 110), hbar(75, 90, 380, 135)])
    elif ch == "2":
        W = 590
        upper = cut_rect(ring_round_rect(60, 300, 530, 710, 140, 160), 0, 250, 300, 485)
        g = unary_union([upper, capsule([(475, 380), (135, 85)], 145), hbar(75, 90, 535, 145)])
    elif ch == "3":
        W = 570
        top = cut_rect(ring_round_rect(60, 330, 520, 710, 140, 150), 0, 250, 265, 610)
        bot = cut_rect(ring_round_rect(60, -10, 520, 390, 140, 150), 0, 100, 265, 470)
        g = unary_union([top, bot, hbar(350, 250, 480, 110)])
    elif ch == "4":
        W = 610
        g = unary_union([vstem(465, 0, CAP, True, True, 140), capsule([(465, 650), (120, 235)], 135), hbar(235, 110, 540, 125)])
    elif ch == "5":
        W = 580
        bot = cut_rect(ring_round_rect(70, -10, 525, 405, 140, 150), 0, 125, 280, 500)
        g = unary_union([hbar(625, 90, 520, 140), vstem(155, 345, 650, False, False, 135), hbar(350, 120, 455, 130), bot])
    elif ch == "6":
        W = 590
        g = unary_union([ring_round_rect(65, -10, 530, 410, 140, 160), capsule([(135, 220), (150, 500), (230, 635), (420, 650)], 140)])
    elif ch == "7":
        W = 560
        g = unary_union([hbar(625, 80, 510, 145), capsule([(475, 590), (205, 35)], 150), serif_bar(200, 50, 190, 68)])
    elif ch == "8":
        W = 590
        g = unary_union([ring_round_rect(80, 335, 510, 710, 130, 145), ring_round_rect(65, -10, 525, 400, 140, 155)])
    elif ch == "9":
        W = 590
        g = unary_union([ring_round_rect(60, 295, 525, 710, 140, 160), capsule([(455, 485), (440, 210), (360, 70), (165, 55)], 140)])
    elif ch == "-":
        W = 430
        g = hbar(330, 80, 350, 120)
    elif ch == "_":
        W = 560
        g = hbar(-20, 70, 490, 90)
    elif ch == ".":
        W = 260
        g = Point(130, 65).buffer(72, quad_segs=6)
    elif ch == ",":
        W = 280
        g = unary_union([Point(130, 70).buffer(68, quad_segs=6), capsule([(145, 45), (95, -100)], 75)])
    elif ch == ":":
        W = 280
        g = unary_union([Point(140, 490).buffer(62, quad_segs=6), Point(140, 150).buffer(62, quad_segs=6)])
    elif ch == ";":
        W = 280
        g = unary_union([Point(140, 490).buffer(62, quad_segs=6), Point(140, 160).buffer(62, quad_segs=6), capsule([(145, 125), (95, -20)], 70)])
    elif ch == "!":
        W = 310
        g = unary_union([round_rect(110, 230, 200, 690, 45), Point(155, 80).buffer(65, quad_segs=6)])
    elif ch == "?":
        W = 520
        arc = capsule([(100, 560), (140, 655), (290, 675), (410, 610), (420, 505), (365, 440), (285, 400), (255, 320)], 115)
        g = unary_union([arc, Point(255, 80).buffer(65, quad_segs=6)])
    elif ch == "+":
        W = 520
        g = unary_union([hbar(335, 75, 445, 110), round_rect(205, 155, 315, 515, 30)])
    elif ch == "=":
        W = 540
        g = unary_union([hbar(430, 80, 460, 95), hbar(245, 80, 460, 95)])
    elif ch == "/":
        W = 480
        g = capsule([(100, -30), (380, 730)], 95)
    elif ch == "\\":
        W = 480
        g = capsule([(100, 730), (380, -30)], 95)
    elif ch == "(":
        W = 340
        g = capsule([(245, 685), (160, 590), (120, 350), (160, 110), (245, 15)], 75)
    elif ch == ")":
        W = 340
        g = capsule([(95, 685), (180, 590), (220, 350), (180, 110), (95, 15)], 75)
    elif ch == "[":
        W = 330
        g = unary_union([vstem(145, -20, 720, False, False, 80), hbar(675, 110, 270, 80), hbar(25, 110, 270, 80)])
    elif ch == "]":
        W = 330
        g = unary_union([vstem(185, -20, 720, False, False, 80), hbar(675, 60, 220, 80), hbar(25, 60, 220, 80)])
    elif ch == "%":
        W = 690
        g = unary_union([Point(170, 545).buffer(95, quad_segs=8).difference(Point(170, 545).buffer(42, quad_segs=8)), Point(520, 160).buffer(95, quad_segs=8).difference(Point(520, 160).buffer(42, quad_segs=8)), capsule([(180, 80), (510, 625)], 85)])
    elif ch == "$":
        W = 610
        s, _ = glyph_geom("S")
        g = unary_union([s, round_rect(275, -70, 345, 770, 25)])
    elif ch == "€":
        W = 610
        c, _ = glyph_geom("C")
        g = unary_union([c, hbar(410, 80, 390, 85), hbar(265, 80, 390, 85)])
    elif ch == "£":
        W = 580
        g = unary_union([capsule([(420, 590), (350, 665), (230, 660), (160, 600), (160, 430), (260, 315), (250, 105)], 125), hbar(355, 90, 430, 85), hbar(85, 100, 500, 125)])
    elif ch == "#":
        W = 620
        g = unary_union([capsule([(215, 65), (275, 650)], 85), capsule([(380, 65), (440, 650)], 85), hbar(465, 90, 530, 85), hbar(250, 80, 520, 85)])
    elif ch == "&":
        W = 650
        g = unary_union([ring_round_rect(85, 300, 470, 690, 115, 140), capsule([(290, 380), (120, 220), (145, 95), (265, 40), (390, 80), (545, 250)], 120), capsule([(345, 380), (560, 65)], 90)])
    elif ch == "@":
        W = 790
        g = unary_union([ring_round_rect(55, -10, 735, 710, 95, 220), ring_round_rect(210, 170, 570, 530, 95, 120), capsule([(515, 350), (635, 350), (635, 515)], 80)])
    elif ch == "'":
        W = 240
        g = round_rect(90, 500, 150, 705, 25)
    elif ch == '"':
        W = 360
        g = unary_union([round_rect(85, 500, 145, 705, 25), round_rect(215, 500, 275, 705, 25)])
    elif ch == "*":
        W = 520
        g = unary_union([capsule([(260, 220), (260, 520)], 80), capsule([(125, 300), (395, 440)], 80), capsule([(125, 440), (395, 300)], 80)])
    elif ch == "•":
        W = 300
        g = Point(150, 350).buffer(72, quad_segs=6)
    else:
        W = 500
        g = Polygon()
    return normalize(g), W


def polygon_to_glyph(geom):
    pen = TTGlyphPen(None)
    if geom.is_empty:
        return pen.glyph()
    polys = [geom] if isinstance(geom, Polygon) else list(geom.geoms) if isinstance(geom, MultiPolygon) else []
    for poly in polys:
        ext = list(poly.exterior.coords)[:-1][::-1]
        if len(ext) >= 3:
            pen.moveTo((round(ext[0][0]), round(ext[0][1])))
            for x, y in ext[1:]:
                pen.lineTo((round(x), round(y)))
            pen.closePath()
        for interior in poly.interiors:
            pts = list(interior.coords)[:-1][::-1]
            if len(pts) >= 3:
                pen.moveTo((round(pts[0][0]), round(pts[0][1])))
                for x, y in pts[1:]:
                    pen.lineTo((round(x), round(y)))
                pen.closePath()
    return pen.glyph()


def accent_geom(kind):
    if kind == "acute": return capsule([(390, 735), (500, 835)], 70)
    if kind == "grave": return capsule([(300, 835), (410, 735)], 70)
    if kind == "circ": return unary_union([capsule([(285, 745), (390, 835)], 60), capsule([(390, 835), (495, 745)], 60)])
    if kind == "tilde": return capsule([(280, 780), (330, 820), (390, 790), (445, 760), (500, 805)], 55)
    if kind == "cedilla": return capsule([(335, -20), (380, -75), (350, -145), (285, -165)], 65)
    return Polygon()


def build():
    chars = list('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_. ,:;!?+=/\\()[]%$€£#&@\'"*•')
    chars = [c for c in chars if c != " "]
    glyphs: Dict[str, object] = {".notdef": polygon_to_glyph(round_rect(80, 0, 520, 700, 50).difference(round_rect(170, 90, 430, 610, 25)))}
    metrics = {".notdef": (600, 40)}
    cmap = {}
    glyph_order = [".notdef"]
    names = {".": "period", ",": "comma", ":": "colon", ";": "semicolon", "!": "exclam", "?": "question", "+": "plus", "=": "equal", "/": "slash", "\\": "backslash", "(": "parenleft", ")": "parenright", "[": "bracketleft", "]": "bracketright", "%": "percent", "$": "dollar", "€": "Euro", "£": "sterling", "#": "numbersign", "&": "ampersand", "@": "at", "'": "quotesingle", '"': "quotedbl", "*": "asterisk", "•": "bullet", "-": "hyphen", "_": "underscore"}
    for ch in chars:
        geom, width = glyph_geom(ch)
        name = names.get(ch, ch)
        glyphs[name] = polygon_to_glyph(geom)
        metrics[name] = (width, 20)
        glyph_order.append(name)
        cmap[ord(ch)] = name
        if "A" <= ch <= "Z":
            cmap[ord(ch.lower())] = name

    glyphs["space"] = TTGlyphPen(None).glyph()
    metrics["space"] = (320, 0)
    glyph_order.append("space")
    cmap[32] = "space"

    for aname, kind in [("acutecomb", "acute"), ("gravecomb", "grave"), ("circumflexcomb", "circ"), ("tildecomb", "tilde"), ("cedillacomb", "cedilla")]:
        glyphs[aname] = polygon_to_glyph(accent_geom(kind))
        metrics[aname] = (0, 0)
        glyph_order.append(aname)

    accent_map = {
        "Á": ("A", "acutecomb"), "À": ("A", "gravecomb"), "Â": ("A", "circumflexcomb"), "Ã": ("A", "tildecomb"),
        "É": ("E", "acutecomb"), "Ê": ("E", "circumflexcomb"), "È": ("E", "gravecomb"),
        "Í": ("I", "acutecomb"), "Ì": ("I", "gravecomb"), "Î": ("I", "circumflexcomb"),
        "Ó": ("O", "acutecomb"), "Ò": ("O", "gravecomb"), "Ô": ("O", "circumflexcomb"), "Õ": ("O", "tildecomb"),
        "Ú": ("U", "acutecomb"), "Ù": ("U", "gravecomb"), "Û": ("U", "circumflexcomb"),
        "Ç": ("C", "cedillacomb"),
    }
    for ch, (base, acc) in accent_map.items():
        name = f"uni{ord(ch):04X}"
        pen = TTGlyphPen(glyphs)
        pen.addComponent(base, (1, 0, 0, 1, 0, 0))
        pen.addComponent(acc, (1, 0, 0, 1, 0, 0))
        glyphs[name] = pen.glyph()
        metrics[name] = metrics[base]
        glyph_order.append(name)
        cmap[ord(ch)] = name
        cmap[ord(ch.lower())] = name

    fb = FontBuilder(UPM, isTTF=True)
    fb.setupGlyphOrder(glyph_order)
    fb.setupCharacterMap(cmap)
    fb.setupGlyf(glyphs)
    fb.setupHorizontalMetrics(metrics)
    fb.setupHorizontalHeader(ascent=ASC, descent=DESC)
    fb.setupNameTable({
        "familyName": "O Shine Royal Display",
        "styleName": "Regular",
        "uniqueFontIdentifier": "OShineRoyalDisplay-Regular-v1.0",
        "fullName": "O Shine Royal Display Regular",
        "psName": "OShineRoyalDisplay-Regular",
        "version": "Version 1.000; O-Shine custom display typeface",
        "manufacturer": "O-Shine Studio",
        "designer": "O-Shine Studio / OpenAI",
        "description": "Original chunky rounded slab display typeface created for the O-Shine Royal Toon 3D visual system. Display use only.",
    })
    fb.setupOS2(sTypoAscender=ASC, sTypoDescender=DESC, sTypoLineGap=40, usWinAscent=ASC, usWinDescent=abs(DESC), sxHeight=520, sCapHeight=CAP, usWeightClass=800, usWidthClass=4, fsSelection=0x40)
    fb.setupPost(isFixedPitch=0)
    fb.setupMaxp()

    ttf = OUT / "OShineRoyalDisplay-Regular.ttf"
    fb.save(ttf)
    font = TTFont(ttf)
    font.flavor = "woff2"
    woff2 = OUT / "OShineRoyalDisplay-Regular.woff2"
    font.save(woff2)
    print(ttf)
    print(woff2)


if __name__ == "__main__":
    build()
