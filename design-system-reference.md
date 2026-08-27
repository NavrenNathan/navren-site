# Navren — Design System Reference

Pulled directly from `assets/style.css` (CSS custom properties, `@font-face` rules, and component styles) and the live site at navrenagency.com. Intended as a reference for designing something outside this codebase, e.g. an HTML email — not for editing the site itself.

## Logo

| Variant | File | Dimensions | Public HTTPS URL |
|---|---|---|---|
| Standard (dark logo, for light backgrounds) | `images/navren-logo.png` | 1390×172px, PNG | `https://navrenagency.com/images/navren-logo.png` — confirmed live, HTTP 200 |
| Light (white/light logo, for dark backgrounds) | `images/navren-logo-light.png` | 1390×172px, PNG | `https://navrenagency.com/images/navren-logo-light.png` — confirmed live, HTTP 200 |

Both are served by this app and publicly reachable, so either can be referenced directly from an external HTML email with no hosting changes needed.

## Colors

All values are CSS custom properties from `assets/style.css:33-54`, i.e. the actual tokens the whole site is built from — not estimated.

### Primary brand color

| Token | Hex | Use |
|---|---|---|
| `--jade` | `#0D6B54` | Primary brand color — buttons, links, active states |
| `--jade-deep` | `#0A5744` | Button hover state |
| `--jade-wash` | `rgba(13,107,84,.07)` | Very subtle tinted backgrounds/highlights |

### Text colors

| Token | Hex | Use |
|---|---|---|
| `--ink` | `#0E1513` | Headings, primary body text, also the dark-section background color |
| `--slate` | `#4A5854` | Body copy on light backgrounds |
| `--slate-soft` | `#5E6B67` | Secondary/lighter body text |

### Background colors — light sections

| Token | Hex | Use |
|---|---|---|
| `--paper` | `#F0F2F0` | Default page background (porcelain) |
| `--white` | `#FFFFFF` | Cards, panels, alternating "band" sections |
| `--mist` | `#DCE3E0` | Subtle fill |
| `--line` | `#C9D3CF` | Hairline borders on cards/panels |
| `--line-soft` | `#E3E8E6` | Softer hairline borders |

### Background/text colors — dark sections

The footer and photo-band heroes (`.imgband`) sit on `--ink` (`#0E1513`). These sections use a separate set of colors tuned for contrast against that dark background (defined inline in the footer/imgband rules, not as root tokens):

| Hex | Use |
|---|---|
| `#5BD3A6` | Bright jade — links, eyebrows, button backgrounds on dark backgrounds (the plain `--jade` fails contrast here) |
| `#7BE0BA` | Hover state for the bright jade buttons/links |
| `#9FB6AE` | Body copy on dark backgrounds |
| `#8DA49D` | Muted/secondary text on dark backgrounds (breadcrumbs, addresses) |
| `#A9BDB6` | Footer link text |
| `#6F857E` | Footer legal-row muted text |
| `#E58C74` | Error/fail state text (dark background) |

## Typography

### Fonts

| Role | Family | Fallback stack | Source |
|---|---|---|---|
| Headings/display | **Jost** | `system-ui, -apple-system, sans-serif` | Self-hosted `.woff2` files at `/fonts/` (originally a Google Font, but not loaded from Google's CDN — served by this app) |
| Body copy | **Karla** | `system-ui, -apple-system, sans-serif` | Self-hosted `.woff2`, same as above |
| Labels/eyebrows/mono UI text | **IBM Plex Mono** | `ui-monospace, monospace` | Self-hosted `.woff2`, same as above |

**Important for an HTML email:** all three are self-hosted `@font-face` files, not linked from a CDN, and not system fonts. Most email clients (Outlook, Gmail app, many others) don't load custom `@font-face` fonts reliably. For an email, plan on the fallback stacks actually rendering — i.e. system sans-serif for headings and body, not Jost/Karla — unless using an email-safe web-font-loading technique with a tested fallback.

Weights available (from `@font-face` declarations): Jost — 400, 500, 600, 700. Karla — 400, 500, 600, 700. IBM Plex Mono — 400, 500.

### Size/weight pairing

| Element | Font-size | Weight | Line-height | Notes |
|---|---|---|---|---|
| Page hero H1 (`.phero h1`) | `clamp(32px, 5vw, 56px)` — i.e. ~32–56px, fluid | 700 | 1.0 | letter-spacing -0.024em |
| Section H2 (`.h2`) | `clamp(26px, 3.3vw, 38px)` — ~26–38px, fluid | 700 | 1.04 | letter-spacing -0.02em |
| Card heading (`.cards h3`) | 18.5px | 700 | default | letter-spacing -0.015em |
| Body text (base) | 17px | 400 | 1.62 | site-wide default on `<body>` |
| Hero subhead (`.sub`) | 17–18.5px | 400 | ~1.6 | varies slightly by page |
| Lede paragraph (`.lede`) | 17.5px | 400 | 1.6 | |

For an email, a reasonable non-fluid translation: **H1 ~40px/700**, **H2 ~28px/700**, **body ~16-17px/400**.

## Buttons

### Primary (`.btn`)

- Background: `#0D6B54` (`--jade`)
- Text color: `#FFFFFF`
- Border-radius: `4px`
- Padding: `12px 20px`
- Font-weight: `700`, font-size: `14.5px`
- Style: solid fill, no border
- Hover: background darkens to `#0A5744` (`--jade-deep`), plus a 1px upward lift (`transform: translateY(-1px)`) — not replicable in a static email, but the darker hover color is worth knowing if designing an interactive version

### Secondary (`.btn-ghost`)

- Background: `#FFFFFF`
- Text color: inherited (dark ink by default)
- Border: `1px solid #C9D3CF` (`--line`)
- Border-radius: `4px`
- Padding: `12px 20px`
- Font-weight: `700`, font-size: `14.5px`
- Style: outlined, not solid
- Hover: border and text color both switch to jade `#0D6B54`

Both buttons use a small, restrained corner radius (4px) — not pill-shaped, not sharp/square either.

## Spacing and layout feel

- **Section rhythm:** generous and fluid. Standard vertical section padding is `clamp(46px, 6vw, 78px)` top and bottom — i.e. roughly 46px on small screens scaling up to 78px on large ones. Sections alternate between white (`.band`) and porcelain (`--paper`) backgrounds, separated by hairline borders (`--line`), not hard dividers or shadows.
- **Max content width:** `1240px` (`--maxw`), applied via a `.wrap` container with `margin: 0 auto` — the whole site sits in a centered column at that max width, not full-bleed. Horizontal gutter is fluid: `clamp(20px, 5vw, 64px)`.
- **Cards/panels:** white background, 1px hairline border (`--line`), small border-radius (7px for cards, 9px for panels) — no drop shadows anywhere in the system. Flat, bordered, quiet.
- Overall the layout favors **whitespace over density** — fluid clamp()-based spacing throughout means nothing feels cramped even at large viewport widths, and there's no heavy visual weight (no shadows, no saturated color blocks) competing with the type.

## Overall tone

Minimal and editorial, with a quietly technical edge — a single restrained jade-green accent against porcelain and white, small-radius corners, hairline borders instead of shadows, and uppercase monospace labels doing the "structured/technical" work while a clean sans-serif (Jost) carries the actual headlines. It reads as premium and understated rather than bold or playful — closer to a design studio's or consultancy's site than a consumer brand.
