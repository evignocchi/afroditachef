# Design: Aiclo

The page is a recording being analysed. An amber waveform runs from the live session panel in the hero, through the results band, to the closing call. The product proves itself with its own interface: panels with window chrome show demo data (Marco Rossi, Acme Corp), always labelled as demo.

## Colour

Strategy: one committed brand colour on a warm dark ground, plus a single drenched amber band (Risultati).

| Token | Value | Use |
|---|---|---|
| `--ground` / `--ground-2` | `#0F0E0C` / `#14120F` | Page ground; alternating section ground |
| `--panel` / `--panel-2` | `#1A1814` / `#221F1A` | Product panels |
| `--line` / `--line-2` | `#2C2822` / `#3A352D` | Hairlines, ledgers, borders |
| `--ink` / `--ink-2` / `--muted` | `#F4EFE7` / `#C9C1B4` / `#9D9486` | Text levels |
| `--amber` / `--amber-hi` / `--amber-lo` | `#F9A517` / `#FFC861` / `#C97F06` | Brand: accents, bars, waveform; primary button gradient hi→amber |
| `--amber-ink` / `--amber-ink-2` | `#1D1404` / `#4A3306` | Text on amber |
| `--rec` | `#EF3B45` | REC state, risk alerts |
| `--good` / `--bad` | `#7BD1A0` / `#F2867C` | Score deltas, strengths / weaknesses |

## Type

- Display: Sora variable (self-hosted), 600, tracking −0.035 to −0.05em, balanced. H1 up to 4.6rem.
- Body: Onest variable, 17px/1.6 (16px on mobile).
- Mono: JetBrains Mono only for data: timers, URLs, scores, durations, CRM field keys.

## Components

- **Panel**: radius 22px, 1px `--line` border, subtle top gradient, neutral elevation shadow; optional chrome bar (REC + timer or three dots, mono URL on the right).
- **Score bars**: 6px track, amber fill (coral for the weak dimension), filling from the left on entering view.
- **Ledgers instead of cards**: stats, security points, FAQ and quotes sit on hairline rules, never in icon-card grids.
- **Buttons**: pill. Primary = amber gradient with dark ink; ghost = `--line-2` border, amber on hover.
- **Icons**: one inline SVG sprite, 1.7px stroke, amber.
- No eyebrow labels above headings.

## Motion

Signature: the 10×10 coverage grid, 5 squares "heard" → all 100 amber "analysed" with a diagonal wave and a count to 100% (runs once on view; toggle Oggi / Con Aiclo). Hero: ticking timer, playhead lighting the waveform, rotating transcript lines. Panels rise once on view; step rules draw in. All disabled under `prefers-reduced-motion`.

## Assets

`assets/aiclo-logo.svg` (inlined as a sprite symbol), `favicon.png`, `app-recording.webp` (real app screenshot), store badges: all sourced from aiclo.io.
