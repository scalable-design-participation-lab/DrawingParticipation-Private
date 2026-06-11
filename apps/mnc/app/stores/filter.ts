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

  const mncFeatures = computed(() =>
    featureStore.features.filter(
      f => (f.properties as any)?.string_id,
    ),
  )

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
    selectFeature,
    clearSelection,
  }
})
