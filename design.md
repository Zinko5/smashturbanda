---
version: "alpha"
name: "Versus Mode Anime Aesthetic"
description: "Versus mode landing page, anime fighting game style, split screen design, dynamic diagonals, high contrast, hud elements. Ideal for landing pages, modern websites. AI-ready template."
colors:
  primary: "#1a0f1f"
  secondary: "#ffffff"
  tertiary: "#ffcc00"
  neutral: "#00ccff"
  surface: "#ff0055"
  accent: "#00ff00"
typography:
  h1:
    fontFamily: Russo One
    fontSize: 2.5rem
    fontWeight: 700
  body-md:
    fontFamily: Russo One
    fontSize: 1rem
    fontWeight: 400
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.neutral}"
    padding: 12px
---

## Overview

Versus mode landing page, anime fighting game style, split screen design, dynamic diagonals, high contrast, hud elements. Ideal for landing pages, modern websites. AI-ready template. The VS screen is one of the most enduring UI patterns in gaming. Street Fighter II didn't invent it, but it codified the grammar: two portraits, a crackling divider, names in bold type, the whole thing vibrating with anticipation. That split-second before the fight starts? Pure tension design.

Dragon Ball Z games pushed it further — speed lines, ki auras bleeding off the frame, typography that looks like it might explode. Guilty Gear and BlazBlue turned the entire interface into sequential art. Every meter, every health bar, every round indicator was drawn like a manga panel. The UI wasn't separate from the action. It was the action.

This energy migrated. Esports broadcasts borrowed the split composition. Competitive apps adopted the diagonal slash. Twitch overlays, tournament brackets, player cards — all descendants of that original VS screen. The pattern works because it's fundamentally about opposition. Two forces, one frame. No ambiguity about what's happening next.

- Density: 5/10 — Balanced
- Variance: 7/10 — Dynamic
- Motion: 4/10 — Subtle

- **Style:** Dynamic, Competitive, High-Octane
- **Keywords:** anime, versus, fighting, game, split, dynamic, action, slash
- **Era:** Arcade Fighting
- **Light/Dark:** ✗ No / ✓ Full

## Colors

- **Background** (#1a0f1f) — Primary background surface
- **Text** (#ffffff) — Primary text color
- **Accent** (#ffcc00) — Primary accent, CTAs and interactive elements
- **Player 1 Blue** (#00ccff) — Secondary accent
- **Player 2 Red** (#ff0055) — Error states, destructive actions
- **Energy Green** (#00ff00) — Success states, positive indicators


## Typography

- **Display / Hero:** Russo One — Weight 700, tight tracking, used for headline impact
- **Body:** Russo One — Weight 400, 16px/1.6 line-height, max 72ch per line
- **UI Labels / Captions:** Russo One — 0.875rem, weight 500, slight letter-spacing
- **Monospace:** JetBrains Mono — Used for code, metadata, and technical values

Scale:
- Hero: clamp(2.5rem, 5vw, 4rem)
- H1: 2.25rem
- H2: 1.5rem
- Body: 1rem / 1.6
- Small: 0.875rem


## Layout

- **Grid:** CSS Grid primary. Max-width containment: 1280px centered with 1.5rem side padding.
- **Spacing rhythm:** Balanced. Base unit: 0.5rem (8px).
- **Section vertical gaps:** clamp(4rem, 8vw, 8rem).
- **Hero layout:** Asymmetric composition.
- **Feature sections:** Asymmetric grid with varied card sizes. No 3-equal-columns.
- **Mobile collapse:** All multi-column layouts collapse below 768px. No horizontal overflow.
- **z-index contract:** base (0) / sticky-nav (100) / overlay (200) / modal (300) / toast (500).


## Elevation & Depth

Split-screen dichotomy, character avatars, fighting game HUD elements, elemental visual effects, cel-shaded illustration, jagged comic book aesthetic.

- **Physics:** Ease-out curves, 200-300ms duration. Smooth and predictable.
- **Entry animations:** Fade + translate-Y (16px → 0) over 420ms ease-out. Staggered cascades for lists: 80ms between items.
- **Hover states:** Subtle color shift + shadow adjustment over 200ms.
- **Page transitions:** Fade only (200ms).
- **Performance:** Only transform and opacity animated. No layout-triggering properties.


## Shapes

Base corner radius: 8px. See rounded tokens in front matter for the full scale.


## Components

- **Primary Button:** Subtly rounded (0.5rem) shape. Accent color fill. Hover: 8% darken + subtle lift shadow. Active: -1px translate tactile press. Font weight 600. No outer glows.
- **Secondary / Ghost Button:** Outline variant. 1.5px border in muted color. Text in primary color. Hover: subtle background fill.
- **Cards:** Subtly rounded (0.5rem) corners. Surface background. Subtle shadow (0 2px 12px rgba(0,0,0,0.06)). 1px border stroke.
- **Inputs:** Label above input. 1px border stroke. Focus ring: 2px accent color offset 2px. Error text below in semantic red. No floating labels.
- **Navigation:** Primary surface background. Active item: accent color indicator. Font weight 500 when active.
- **Skeletons:** Shimmer animation matching component dimensions. No circular spinners.
- **Empty States:** Icon-based composition with descriptive text and action button.


## Do's and Don'ts

- No emojis in UI — use icon system only (Lucide, Heroicons)
- No pure black (#000000) — use off-black or charcoal variants
- No oversaturated accent colors (saturation cap: 80%)
- No 3-column equal-width feature layouts — use zig-zag or asymmetric grid
- No `h-screen` — use `min-h-[100dvh]`
- No AI copywriting clichés: "Elevate", "Seamless", "Unleash", "Next-Gen"
- No broken external image links — use picsum.photos or inline SVG
- No generic lorem ipsum in demos

- Do Diagonal split layout
- Do Contrasting colors (Red/Blue vs)
- Do Slanted/Skewed containers
- Do Bold Energy/fire effects
- Do Arcade style typography


## Use Case

Landing pages, Modern websites
