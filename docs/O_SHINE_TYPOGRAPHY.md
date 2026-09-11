# O-Shine Typography System

Status: **v1 — custom display face created**

## Primary display font

**O Shine Royal Display** is the project-owned headline/gameplay display face for O-Shine.

It was designed from the current O-Shine visual direction: Royal Toon 3D, King Rico, Fortune Circus, polished gold, ivory, royal purple, red velvet, chunky toy-like silhouettes and mobile-first readability.

### Visual rules

- Heavy, compact forms so titles survive on portrait mobile screens.
- Rounded slab details to bridge **royal** and **circus/arcade** vocabulary.
- Large internal counters for readability under strokes and shadows.
- All-caps display behavior. Lowercase input deliberately maps to capitals.
- The font itself stays monochrome/vector. Gold bevel, purple outline, ivory fill and 3D depth are presentation layers, not baked into glyphs.
- Do not use for legal copy, paragraphs, settings descriptions or long-form UI.

### Approved uses

- O-Shine / minigame titles.
- `BIG WIN`, `MEGA WIN`, `JACKPOT`, `BONUS` and equivalent celebration copy.
- Primary CTA/button labels when large enough.
- Large balance/bet/win values and promotional numbers.
- Store/promotional headings when the art direction calls for the O-Shine branded voice.

### Runtime target

Generated font outputs:

- `OShineRoyalDisplay-Regular.woff2`
- `OShineRoyalDisplay-Regular.ttf`

The deterministic source generator lives at:

`tools/typography/generate_oshine_font.py`

The CSS integration helper lives at:

`src/styles/oshine-royal-display.css`

### Character coverage v1

A–Z, lowercase aliases to caps, 0–9, core punctuation/game symbols, and the PT-BR accented characters required by current product copy.

### Source / originality

The glyph outlines are generated from original geometric constructions. No third-party font outlines are embedded in the generated font files.
