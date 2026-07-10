import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { useFeatureStore } from '@base/stores/features'
import type { Feature } from '@base/stores/types/store'

export const PRIMARY_TAGS = [
  'Health & Crisis Response',
  'Transportation & Mobility',
  'Digital Access & Connectivity',
  'Community Mapping & Visibility',
  'Art & Cultural Expression',
] as const

export type PrimaryTag = typeof PRIMARY_TAGS[number]

export const useFilterStore = defineStore('filter', () => {
  const featureStore = useFeatureStore()

  const isPanelOpen = ref(false)
  const isListOpen = ref(false)
  const visibleTags = ref<Set<string>>(new Set<string>(PRIMARY_TAGS))
  const selectedFeature = ref<Feature | null>(null)

  // MNC catalog + user-submitted entries, de-duplicated by title. Fake/trial
  // user submissions often repeat an existing project's title (with a different
  // string_id), so title is a better key than id here. Static catalog entries
  // load before user solutions, so they win a tie.
  const mncFeatures = computed(() => {
    const seen = new Set<string>()
    const out: Feature[] = []
    for (const f of featureStore.features) {
      if (!(f.properties as any)?.string_id) continue
      const key = (f.comment || '').trim().toLowerCase() || (f.properties as any).string_id
      if (seen.has(key)) continue
      seen.add(key)
      out.push(f)
    }
    return out
  })

  const grouped = computed<Record<string, Feature[]>>(() => {
    const out: Record<string, Feature[]> = {}
    for (const f of mncFeatures.value) {
      const tag = (f.properties as any)?.primaryTag ?? 'Uncategorized'
      ;(out[tag] ||= []).push(f)
    }
    return out
  })

  const visibleFeatures = computed<Feature[]>(() =>
    mncFeatures.value.filter(f => isFeatureVisible(f)),
  )

  function isTagVisible(tag: string | undefined): boolean {
    if (!tag) return true
    return visibleTags.value.has(tag)
  }

  function isFeatureVisible(feature: Feature): boolean {
    return isTagVisible((feature.properties as any)?.primaryTag)
  }

  // The filter panel and the flat list share the same screen slot, so opening
  // one closes the other.
  function togglePanel() {
    isPanelOpen.value = !isPanelOpen.value
    if (isPanelOpen.value)
      isListOpen.value = false
  }

  function toggleList() {
    isListOpen.value = !isListOpen.value
    if (isListOpen.value)
      isPanelOpen.value = false
  }

  function toggleTag(tag: string) {
    const next = new Set(visibleTags.value)
    if (next.has(tag)) next.delete(tag)
    else next.add(tag)
    visibleTags.value = next
  }

  // Make sure a tag is shown — used when a user creates a brand-new theme so
  // its pin isn't immediately filtered out.
  function ensureTagVisible(tag: string) {
    if (tag && !visibleTags.value.has(tag))
      visibleTags.value = new Set(visibleTags.value).add(tag)
  }

  // Show only the given tag on the map (used when a tag chip is clicked) and
  // open the list so the matching entries are listed together.
  function showOnlyTag(tag: string) {
    visibleTags.value = new Set([tag])
  }

  function openList() {
    isListOpen.value = true
    isPanelOpen.value = false
  }

  function selectFeature(f: Feature | null) {
    selectedFeature.value = f
  }

  function clearSelection() {
    selectedFeature.value = null
  }

  return {
    isPanelOpen,
    isListOpen,
    visibleTags,
    selectedFeature,
    mncFeatures,
    grouped,
    visibleFeatures,
    isTagVisible,
    isFeatureVisible,
    togglePanel,
    toggleList,
    toggleTag,
    ensureTagVisible,
    showOnlyTag,
    openList,
    selectFeature,
    clearSelection,
  }
})
