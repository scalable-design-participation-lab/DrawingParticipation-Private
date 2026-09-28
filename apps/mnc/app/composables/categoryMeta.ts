// Single source of truth for the five MNC primary-tag categories: the accent
// color and glyph used to render them consistently across the map markers,
// the detail-panel tag chip, and the bottom-bar quick filters.

export interface CategoryMeta {
  // Vivid accent, used for the marker ring/glyph and (in dark mode) chip text.
  color: string
  icon: string
  // Darkened accent for chip text on a LIGHT background — the vivid color alone
  // is too low-contrast on white (e.g. yellow ~1.6:1), so light mode uses this.
  ink: string
}

// Darken a #rrggbb hex toward black. 0.45 keeps enough hue to read as the
// category color while clearing the WCAG AA contrast bar on a white/tinted card.
function darken(hex: string, f = 0.45): string {
  const n = Number.parseInt(hex.slice(1), 16)
  const r = Math.round(((n >> 16) & 255) * f)
  const g = Math.round(((n >> 8) & 255) * f)
  const b = Math.round((n & 255) * f)
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`
}

interface RawMeta { color: string, icon: string }

// Colors are drawn from the app's existing accent palette (the conic gradient
// used on the old pins), with a distinct blue added for Transportation.
const RAW: Record<string, RawMeta> = {
  'Health & Crisis Response': { color: '#F26D6D', icon: 'i-heroicons-heart' },
  'Transportation & Mobility': { color: '#4C9BEA', icon: 'i-ph-bus' },
  'Digital Access & Connectivity': { color: '#57C9C0', icon: 'i-heroicons-wifi' },
  'Community Mapping & Visibility': { color: '#6FCF97', icon: 'i-heroicons-user-group' },
  'Art & Cultural Expression': { color: '#EBC24A', icon: 'i-heroicons-light-bulb' },
}

const DEFAULT_RAW: RawMeta = { color: '#57C9C0', icon: 'i-heroicons-map-pin' }

function withInk(raw: RawMeta): CategoryMeta {
  return { ...raw, ink: darken(raw.color) }
}

export const CATEGORY_META: Record<string, CategoryMeta> = Object.fromEntries(
  Object.entries(RAW).map(([tag, raw]) => [tag, withInk(raw)]),
)

export function categoryMeta(tag: string | undefined | null): CategoryMeta {
  return (tag && CATEGORY_META[tag]) || withInk(DEFAULT_RAW)
}
