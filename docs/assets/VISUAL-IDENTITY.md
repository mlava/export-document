# Visual Identity: export-document

## Theme
A document bureau rendered in slate and scan-blue — precise, technical, trustworthy, built for people who treat their writing as archival-grade material.

## Palette
| Role | Hex | Usage |
|------|-----|-------|
| Background | `#F8FAFC` | page/chart backgrounds |
| Primary text | `#0F172A` | headings, key values |
| Secondary text | `#334155` | body text, descriptions |
| Muted | `#64748B` | captions, footnotes, axis labels |
| Accent | `#2563EB` | highlights, flow arrows, primary CTAs |

Supporting roles: surface `#F1F5F9`, border `#E2E8F0`, destructive `#DC2626`, success `#16A34A`. All primary pairs exceed WCAG AA (4.5:1) on the background.

## Typography mood
Monospace-forward technical register. Headings and code samples in **Fira Code** (weights 500–700) for the ruled-ledger, engineered feel. Body in **Fira Sans** (weights 400–600) — the humanist sans sibling, keeping longform reading comfortable. Tight letter-spacing on display sizes (-0.02em); default tracking on body. Tabular figures when showing file sizes, nesting levels, or format counts.

## Visual personality
Document bureau precision. Think photocopier schematics, library card catalogue cards, mid-century technical drawings: right angles, ruled lines, annotated blueprints. Nothing decorative unless it's load-bearing. Whitespace is a feature, not a gap. The accent blue is used sparingly — it should feel like a rubber stamp, not a highlighter.

## Imagery style
Public-domain imagery in the spirit of: early 20th-century printing presses, library filing systems, typewriter and teletype mechanisms, government document-handling equipment, Bauhaus-era technical diagrams, and engineering blueprints. Monochrome or duotone preferred; if colour is present it should harmonise with the slate/blue palette. Period: 1900–1960 bureau aesthetic. Avoid contemporary stock photography.

## SVG constraints
- **viewBox:** 750×420 landscape (default), 600×600 square for icons/hero marks, 512×768 portrait for vertical flow diagrams
- **Corner treatment:** sharp (0px) for technical diagrams; 4px radius allowed for interactive chips/pills
- **Gradient style:** flat fills only for diagrams. Subtle linear gradients (top-to-bottom, ≤8% value shift) allowed for hero marks
- **Stroke width:** 1.5px for connective lines, 2px for primary shapes, 1px for gridlines
- **Font family:** `"Fira Code", ui-monospace, SFMono-Regular, Menlo, monospace` for labels and code; `"Fira Sans", system-ui, -apple-system, sans-serif` for prose annotations
- **Text rendering:** all readable copy as `<text>` elements — never convert to paths

## Design system source
- Palette and typography pulled from `ui-ux-pro-max` — design system: *Exaggerated Minimalism + Document grey + scan blue* variant
- Recommendation command: `search.py "document conversion export import tool precise technical" --design-system`

## Existing assets
None yet. Assets will be committed to:
- `docs/assets/svg/` — diagrams and charts
- `docs/assets/posters/` — public-domain artwork
