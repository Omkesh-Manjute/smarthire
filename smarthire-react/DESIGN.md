# VerifyHire Design System

Candidate verification platform for US IT recruiters. Dark theme, amber accent, minimal professional UI.

---

## 1. Visual Theme & Atmosphere

**Design Philosophy:**
- Dark-first interface with high contrast for data-heavy dashboards
- Amber accent color for trust indicators and primary actions
- Minimal, professional aesthetic suitable for HR/recruitment tools
- Clean typography with clear hierarchy for readability

**Mood:** Professional, trustworthy, modern, data-focused

---

## 2. Color Palette

### Primary Colors
| Name | Hex | Usage |
|------|-----|-------|
| `--bg` | `#0b0b0c` | Main background |
| `--bg-card` | `#121214` | Card/panel backgrounds |
| `--text` | `#f5f5f5` | Primary text |
| `--text-muted` | `#9a9590` | Secondary/muted text |
| `--border` | `rgba(255,255,255,0.08)` | Borders and dividers |

### Accent Colors
| Name | Hex | Usage |
|------|-----|-------|
| `--amber` | `#f59e0b` | Primary accent, CTAs, trust scores |
| `--amber-border` | `rgba(245,158,11,0.3)` | Amber borders |
| `--green` | `#22c55e` | Trusted/success status |
| `--orange` | `#f97316` | Medium risk warning |
| `--red` | `#ef4444` | High risk/error states |
| `--blue` | `#3b82f6` | Links, info states |

### Status Colors
| Status | Background | Text | Border |
|--------|------------|------|--------|
| Trusted | `rgba(34,197,94,0.15)` | `#4ade80` | `rgba(34,197,94,0.3)` |
| Medium Risk | `rgba(249,115,22,0.15)` | `#fb923c` | `rgba(249,115,22,0.3)` |
| High Risk | `rgba(239,68,68,0.15)` | `#f87171` | `rgba(239,68,68,0.3)` |

---

## 3. Typography

### Font Families
- **Headings:** `'Syne', sans-serif` - Modern geometric sans-serif
- **Body:** `'DM Sans', sans-serif` - Clean, readable sans-serif

### Type Scale
| Element | Size | Weight | Line Height |
|---------|------|--------|-------------|
| Hero Title | `clamp(3.2rem, 7vw, 6rem)` | 900 | 1.02 |
| H1 | `clamp(1.75rem, 3.5vw, 2.25rem)` | 700 | 1.15 |
| H2 | `1.5rem` | 600 | 1.3 |
| H3 | `1.25rem` | 600 | 1.4 |
| Body | `15px` | 400 | 1.6 |
| Small | `13px` | 400 | 1.5 |
| Caption | `12px` | 500 | 1.4 |

### Hero Title Special
- Gradient text: `linear-gradient(135deg, #f5f5f5 0%, #f59e0b 60%, #ffb347 100%)`
- Text shadow glow: `0 0 40px rgba(245,158,11,0.15)`

---

## 4. Components

### Buttons

**Primary Button:**
```css
background: var(--amber);
color: #000;
border-radius: 10px;
padding: 0.75rem 1.5rem;
font-weight: 600;
transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
/* Hover: transform: translateY(-2px), box-shadow with amber glow */
```

**Ghost Button:**
```css
background: transparent;
border: 1px solid var(--border);
color: var(--text);
border-radius: 10px;
/* Hover: border-color: var(--amber-border), background: rgba(245,158,11,0.05) */
```

**Large Button:**
- Padding: `1rem 2rem`
- Font size: `15px`

### Cards

**Feature Card:**
```css
background: var(--bg-card);
border: 1px solid var(--border);
border-radius: 16px;
padding: 1.5rem;
transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
/* Hover: border-color: var(--amber-border), box-shadow: 0 20px 40px rgba(245,158,11,0.08) */
```

**Icon Box (inside cards):**
```css
width: 48px;
height: 48px;
background: rgba(245,158,11,0.1);
border-radius: 12px;
/* Icon color: var(--amber) */
```

### Inputs

**Text Input:**
```css
background: var(--bg);
border: 1px solid var(--border);
border-radius: 10px;
padding: 0.75rem 1rem;
color: var(--text);
font-family: 'DM Sans', sans-serif;
/* Focus: border-color: var(--amber), box-shadow: 0 0 0 4px rgba(245,158,11,0.15) */
```

### Navigation

**Nav Bar:**
- Background: `rgba(11,11,12,0.8)` with `backdrop-filter: blur(20px)`
- Border bottom: `1px solid var(--border)`
- Padding: `1rem 2rem`

**Nav Link:**
- Font size: `14px`
- Font weight: `500`
- Color: `var(--text-muted)`
- Hover color: `var(--text)`
- Active: `color: var(--amber)`

**Sidebar Nav Item:**
```css
padding: 0.6rem 0.75rem;
border-radius: 8px;
color: var(--text-muted);
font-size: 13px;
/* Hover: background: rgba(245,158,11,0.1), color: var(--text) */
/* Active: background: rgba(245,158,11,0.15), color: var(--amber) */
```

### Tables

**Table Header:**
```css
background: rgba(255,255,255,0.04);
font-size: 11px;
font-weight: 700;
text-transform: uppercase;
letter-spacing: 0.08em;
color: var(--text-muted);
```

**Table Row:**
```css
border-bottom: 1px solid var(--border);
transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
/* Hover: background: rgba(245,158,11,0.03) */
/* Selected: background: rgba(245,158,11,0.08), border-left: 3px solid var(--amber) */
```

**Score Cell:**
- Font: `Syne, sans-serif`
- Weight: `800`
- Size: `14px`
- Color: `var(--amber)`

### Status Badges

**Pill Badge:**
```css
font-size: 13px;
font-weight: 700;
padding: 6px 12px;
border-radius: 100px;
/* Variants: trusted (green), medium (orange), highrisk (red) */
```

### Progress/Score Circles

**Score Circle:**
- SVG circular progress with stroke-dasharray
- Background track: `rgba(245,158,11,0.1)`
- Progress color: Status color (amber/green/orange/red)
- Stroke width: `8px`

---

## 5. Layout Principles

### Spacing Scale
| Token | Value |
|-------|-------|
| xs | 0.25rem (4px) |
| sm | 0.5rem (8px) |
| md | 1rem (16px) |
| lg | 1.5rem (24px) |
| xl | 2rem (32px) |
| 2xl | 3rem (48px) |

### Container
- Max width: `1200px`
- Padding: `0 2rem`

### Grid
- Feature grid: `repeat(3, 1fr)` with `1.5rem` gap
- Step grid: `repeat(4, 1fr)` with `1.5rem` gap
- Responsive: Collapses to 1-2 columns on mobile

### Dashboard Layout
- Sidebar: `240px` fixed width
- Main content: Flexible
- Right panel: `340px` when open
- Gap between sections: `1.5rem`

---

## 6. Depth & Elevation

### Shadows
| Level | Shadow |
|-------|--------|
| Card default | `0 4px 24px rgba(0,0,0,0.2)` |
| Card hover | `0 20px 40px rgba(245,158,11,0.08)` |
| Modal | `0 24px 80px rgba(0,0,0,0.5)` |
| Button hover | `0 8px 24px rgba(245,158,11,0.2)` |

### Z-Index Scale
| Element | Z-Index |
|---------|---------|
| Modal overlay | 100 |
| Modal | 101 |
| Dropdown | 50 |
| Header | 10 |
| Sidebar | 5 |

---

## 7. Animation & Transitions

### Timing Functions
- Default: `cubic-bezier(0.4, 0, 0.2, 1)`
- Bounce: `cubic-bezier(0.68, -0.55, 0.265, 1.55)`

### Durations
- Fast: `0.2s` (hover states)
- Normal: `0.3s` (transitions)
- Slow: `0.4s` (card animations)

### Key Animations

**Fade Up:**
```css
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
```

**Pulse (for indicators):**
```css
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
```

**Shimmer (for loading):**
```css
@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}
```

---

## 8. Responsive Behavior

### Breakpoints
| Name | Width |
|------|-------|
| Mobile | < 640px |
| Tablet | 640px - 1024px |
| Desktop | > 1024px |

### Mobile Adaptations
- Sidebar becomes hamburger menu or bottom nav
- Tables scroll horizontally or stack cards
- Hero title reduces size
- Grid columns collapse to 1-2
- Padding reduces to `1rem`

---

## 9. Do's and Don'ts

### Do's
- Use amber sparingly for emphasis (CTAs, scores, active states)
- Maintain high contrast for readability
- Use Syne font for headings only
- Include hover states for all interactive elements
- Use status colors consistently (green=trusted, orange=medium, red=high risk)

### Don'ts
- Don't use pure white (#fff), use off-white (#f5f5f5)
- Don't use more than 3 colors in a single component
- Don't use borders darker than the background
- Don't use shadows on dark backgrounds (use glows instead)

---

## 10. Agent Prompt Guide

**Quick Color Reference:**
- Background: `#0b0b0c` (near black)
- Cards: `#121214` (dark gray)
- Primary accent: `#f59e0b` (amber/orange)
- Success: `#22c55e` (green)
- Warning: `#f97316` (orange)
- Error: `#ef4444` (red)
- Text: `#f5f5f5` (off-white)
- Muted: `#9a9590` (warm gray)

**Ready-to-use Prompts:**

1. "Create a dark card with amber accent border on hover"
2. "Build a status badge with pill shape - green for trusted, orange for medium, red for high risk"
3. "Design a data table with sortable columns and amber score cells"
4. "Create a circular progress indicator with amber stroke for trust score"

---

*This design system is for VerifyHire - a candidate verification platform.*
