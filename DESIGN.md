# Design: Afrodita Chef

The site is the room: beige-striped wallpaper, a pink back room, polka-dot scalloped lamps, pale wood. Colours come from the logo, the old coming-soon page (`#e774b3`) and the photos.

## Colour

| Token | Value | Use |
|---|---|---|
| `--rosa` | `#E774B3` | Brand pink: buttons, lamp, accents |
| `--rosa-deep` | `#B4287F` | Pink text on light grounds |
| `--muro` | `#F3A6CB` | Pink back-room wall (locale section) |
| `--blush` | `#FFEEF5` | Pale pink ground (dishes, contacts, footer) |
| `--verde` | `#A8C870` | Brand apple green: menu section, message bubble, badge |
| `--muschio` | `#3E5A1C` | Moss, green text on light grounds |
| `--prugna` | `#3B1830` | Plum ink; booking section ground |
| `--stripe-a` / `--stripe-b` | `#FFFAF2` / `#E9DABB` | Wallpaper stripes (hero) |
| `--glow` | `#FFD98A` | Lamp light |

Strategy: full palette. Each section owns a ground (stripes, pink, blush, green, plum, blush).

## Type

- Display: Young Serif (self-hosted), up to 6rem, tight tracking, balanced.
- Body: Hanken Grotesk variable, 17px/1.6.
- Handwritten annotations only: Gochi Hand (dish callouts, "in foto" tag).

## Shapes and motifs

- Scalloped section edges (the hem of a lamp shade), 32px tile.
- Arch frames (the pink room's doorway) for the main photos; circles and rounded rectangles for details, slightly rotated.
- Polka dots on the lamp and on the menu course rules.
- Pill buttons; soft neutral shadows (no hard offsets).

## Motion

One authored moment: the hero lamp sways, and the lamp over the booking form lights up as name, date and time are filled in. Headline rise on load, gentle scroll reveals. All disabled under `prefers-reduced-motion`.

## Language

IT and EN live in the same HTML (`<span lang="it">` / `<span lang="en">`), switched by `html[lang]`. Default from `?lang=`, saved choice, then browser language.
