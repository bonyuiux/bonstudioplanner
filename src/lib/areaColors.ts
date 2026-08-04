// Area identity colours.
//
// These sit deliberately outside the urgency ramp. Urgency owns saturated
// red / orange / yellow on the 2px left border of a task row; area colour only
// ever appears on an eyebrow label or a card border.
//
// The palette below is chosen for the SWATCH — what the colour looks like as a
// dot you pick from. It is NOT used directly as text: measured against white,
// these run 2.4:1 to 3.7:1, all of which fail WCAG AA (4.5:1 for normal text).
// accentText() below solves that at render time.

export const AREA_COLORS: { name: string; value: string }[] = [
  { name: 'Brass',   value: '#C9A25E' },
  { name: 'Clay',    value: '#A97C50' },
  { name: 'Olive',   value: '#9DA37C' },
  { name: 'Sage',    value: '#8FA5A0' },
  { name: 'Rose',    value: '#B08A8A' },
  { name: 'Heather', value: '#9A8FB0' },
  { name: 'Walnut',  value: '#614E3A' },
]

export const DEFAULT_AREA_COLOR = '#614E3A'

// ─── WCAG contrast ───────────────────────────────────────────────────────────

function channel(v: number): number {
  const c = v / 255
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
}

function parse(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ]
}

function luminance(hex: string): number {
  const [r, g, b] = parse(hex)
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
}

/** WCAG 2.1 contrast ratio between two hex colours. 1:1 to 21:1. */
export function contrastRatio(a: string, b: string): number {
  const la = luminance(a), lb = luminance(b)
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05)
}

function shift(hex: string, factor: number): string {
  const [r, g, b] = parse(hex)
  const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(n)))
  const to = (n: number) => clamp(factor < 1 ? n * factor : n + (255 - n) * (factor - 1))
  return `#${[to(r), to(g), to(b)].map(n => n.toString(16).padStart(2, '0')).join('')}`
}

const SURFACE_LIGHT = '#FFFFFF'
const SURFACE_DARK  = '#3A342E'   // the dark-mode overlay card

/**
 * Returns the area's colour darkened (on light surfaces) or lightened (on dark
 * ones) just far enough to clear a target contrast ratio against the card it
 * sits on. Preserves hue, so Finance still reads as brass and Health as sage —
 * they just stop being unreadable.
 *
 * Default target is 4.5:1, WCAG AA for normal text. Pass 3 for large text or
 * for non-text UI like a border.
 */
export function accentText(hex: string, onDark: boolean, target = 4.5): string {
  const surface = onDark ? SURFACE_DARK : SURFACE_LIGHT
  if (!/^#[0-9a-f]{6}$/i.test(hex)) return onDark ? '#F5F3F0' : '#111111'

  let out = hex
  for (let i = 0; i < 24; i++) {
    if (contrastRatio(out, surface) >= target) return out
    out = shift(out, onDark ? 1.09 : 0.91)
  }
  return onDark ? '#F5F3F0' : '#111111'
}

/** Low-alpha wash. Hex + 2 alpha digits. */
export function areaTint(color: string, alpha = '12'): string {
  return /^#[0-9a-f]{6}$/i.test(color) ? `${color}${alpha}` : 'transparent'
}

// ─── Overlay palette ─────────────────────────────────────────────────────────
//
// Overlays deliberately do NOT read CSS custom properties. Twice now a stale
// stylesheet left a variable undefined and the fallback inverted the design —
// light cards on a dark page. These are literal values chosen per theme and
// measured against WCAG 2.1 AA.
//
// Dark mode note: on a near-black veil no dark card can reach 3:1 by fill
// alone, so card identification comes from `cardBorder` (4.30:1 against the
// veil), which is what SC 1.4.11 actually asks for.

export interface OverlayPalette {
  veil: string
  sheet: string
  cardCurrent: string
  cardClosed: string
  cardBorder: string
  text: string
  muted: string
  /** Chrome sits directly on the veil, which is dark in both themes. */
  chrome: string
}

export function overlayPalette(onDark: boolean): OverlayPalette {
  return onDark
    ? {
        veil:        'rgba(0, 0, 0, 0.85)',   // composites to #040303
        sheet:       '#3A342E',
        cardCurrent: '#3A342E',               // body text 11.08:1
        cardClosed:  '#2A2521',               // body text 13.69:1
        cardBorder:  '#7A7167',               // 4.30:1 against the veil
        text:        '#F5F3F0',
        muted:       '#B5AFA8',               // 5.65:1 / 6.98:1
        chrome:      '#F5F3F0',               // 18.60:1
      }
    : {
        veil:        'rgba(18, 16, 12, 0.92)', // composites to #24221D
        sheet:       '#FFFDF9',
        cardCurrent: '#FFFFFF',                // 15.89:1 against the veil
        cardClosed:  '#D8D3CB',                // 10.67:1 against the veil
        cardBorder:  'rgba(17, 17, 17, 0.22)',
        text:        '#111111',                // 12.68:1 on the closed card
        muted:       '#55504A',                // 5.36:1 on the closed card
        chrome:      '#F5F3F0',                // 14.35:1
      }
}
