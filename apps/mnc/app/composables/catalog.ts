import { computed, toValue } from 'vue'
import type { MaybeRefOrGetter } from 'vue'

/**
 * The map's catalogue as pure functions over page state: the entries (`features`)
 * and the visible themes (`visibleTags`) come in as props, every component
 * derives what it shows from them. Nothing here is stored.
 */
export const PRIMARY_TAGS = [
  'Health & Crisis Response',
  'Transportation & Mobility',
  'Digital Access & Connectivity',
  'Community Mapping & Visibility',
  'Art & Cultural Expression',
] as const

export interface EntryProperties {
  location?: string
  date?: string
  shortDesc?: string
  description?: string
  mncConnection?: string
  mediaCaptions?: string | string[]
  links?: string
  primaryTag?: string
  secondaryTags?: string | string[]
  string_id?: string
  linkList?: { label: string, url: string }[]
  photos?: string[]
  audio?: string[]
  i18n?: Record<string, Partial<Record<'title' | 'shortDesc' | 'description' | 'mncConnection' | 'location', string>>>
  pending?: boolean
}

/** One map entry (a curated case study or a user submission). */
export interface Entry {
  id: number
  type: 'Point'
  coordinates: [number, number]
  /** The title. */
  comment: string
  timestamp: string
  iconName?: string
  properties: EntryProperties
}

/** Catalogue + user entries, de-duplicated by title (catalogue wins a tie). */
export function dedupe(features: Entry[]): Entry[] {
  const seen = new Set<string>()
  const out: Entry[] = []
  for (const f of features) {
    if (!f.properties?.string_id) {
      continue
    }
    const key = (f.comment || '').trim().toLowerCase() || f.properties.string_id
    if (!seen.has(key)) {
      seen.add(key)
      out.push(f)
    }
  }
  return out
}

function groupByTag(features: Entry[]): Record<string, Entry[]> {
  const out: Record<string, Entry[]> = {}
  for (const f of dedupe(features)) {
    const tag = f.properties?.primaryTag ?? 'Uncategorized'
    ;(out[tag] ||= []).push(f)
  }
  return out
}

const isTagVisible = (visibleTags: string[], tag: string | undefined) => !tag || visibleTags.includes(tag)

function visibleEntries(features: Entry[], visibleTags: string[]): Entry[] {
  return dedupe(features).filter(f => isTagVisible(visibleTags, f.properties?.primaryTag))
}

/** The derived views a component needs, as computeds over its props. */
export function useCatalog(features: MaybeRefOrGetter<Entry[]>, visibleTags: MaybeRefOrGetter<string[]>) {
  return {
    entries: computed(() => dedupe(toValue(features))),
    grouped: computed(() => groupByTag(toValue(features))),
    visible: computed(() => visibleEntries(toValue(features), toValue(visibleTags))),
    isVisible: (tag: string | undefined) => isTagVisible(toValue(visibleTags), tag),
  }
}
