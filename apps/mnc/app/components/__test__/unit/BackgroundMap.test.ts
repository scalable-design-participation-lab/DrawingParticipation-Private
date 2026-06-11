import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { config, mount, VueWrapper } from '@vue/test-utils'
import { nextTick, reactive } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import BackgroundMap from '@components/BackgroundMap.vue'

// BackgroundMap reads the route to decide if it is on the result/map page.
vi.mock('nuxt/app', () => ({
  useRoute: vi.fn(() => ({ name: 'result' })),
}))

// Reactive mock of the app filter store, the single source of truth for the
// current selection (selectFeature / clearSelection / selectedFeature).
const mockFilterStore: any = reactive({ selectedFeature: null, visibleTags: new Set<string>() })
mockFilterStore.selectFeature = vi.fn((f: any) => {
  mockFilterStore.selectedFeature = f
})
mockFilterStore.clearSelection = vi.fn(() => {
  mockFilterStore.selectedFeature = null
})

vi.mock('../../../stores/filter', () => ({
  useFilterStore: () => mockFilterStore,
}))

// Lightweight stubs for the map + popup children so we only exercise
// BackgroundMap's own logic.
const GeneralizedBackgroundMap = {
  name: 'GeneralizedBackgroundMap',
  template:
    '<div class="map-container"><slot name="layers" /><slot name="overlays" /></div>',
}
const DrawingLayer = { name: 'DrawingLayer', template: '<div class="drawing-layer" />' }
const MncMapLayer = { name: 'MncMapLayer', template: '<div class="mnc-map-layer" />' }
const QuickLook = { name: 'QuickLook', template: '<div class="quick-look" />' }
const InfoPopup = { name: 'InfoPopup', template: '<div class="info-popup" />' }

config.global.stubs = {
  GeneralizedBackgroundMap,
  DrawingLayer,
  MncMapLayer,
  QuickLook,
  InfoPopup,
}

describe('BackgroundMap.vue', () => {
  let wrapper: VueWrapper<any>

  beforeEach(() => {
    vi.clearAllMocks()
    mockFilterStore.selectedFeature = null
    setActivePinia(createPinia())
    wrapper = mount(BackgroundMap, { global: { stubs: config.global.stubs } })
  })

  // Unmount between tests: the filter store mock is shared across tests, so a
  // lingering mounted instance would re-render (and crash on a null selection)
  // when the next beforeEach resets the store.
  afterEach(() => {
    wrapper?.unmount()
  })

  it('renders the map container', () => {
    expect(wrapper.findComponent(GeneralizedBackgroundMap).exists()).toBe(true)
  })

  it('does not show either popup initially', () => {
    expect(wrapper.vm.showQuickLook).toBe(false)
    expect(wrapper.vm.showPopup).toBe(false)
  })

  it('handleShowQuickLook selects the feature and opens quick look on desktop', () => {
    const feature = { comment: 'A', coordinates: [100, 200], properties: { string_id: 'x' } }
    wrapper.vm.handleShowQuickLook({ feature })

    expect(mockFilterStore.selectFeature).toHaveBeenCalledWith(feature)
    expect(wrapper.vm.showQuickLook).toBe(true)
    // QuickLook is anchored to the feature's map coordinate, not a screen pixel.
    expect(wrapper.vm.quickLookCenter).toEqual([100, 200])
  })

  it('handleShowQuickLook accepts a bare feature payload', () => {
    const feature = { comment: 'B', coordinates: [50, 60] }
    wrapper.vm.handleShowQuickLook(feature)

    expect(mockFilterStore.selectFeature).toHaveBeenCalledWith(feature)
    expect(wrapper.vm.showQuickLook).toBe(true)
    expect(wrapper.vm.quickLookCenter).toEqual([50, 60])
  })

  it('handleExpandedPopup swaps quick look for the expanded popup', () => {
    wrapper.vm.handleShowQuickLook({ feature: { comment: 'C' } })
    wrapper.vm.handleExpandedPopup()

    expect(wrapper.vm.showPopup).toBe(true)
    expect(wrapper.vm.showQuickLook).toBe(false)
  })

  it('handleCloseQuickLook hides quick look and clears the selection', () => {
    wrapper.vm.handleShowQuickLook({ feature: { comment: 'D' } })
    wrapper.vm.handleCloseQuickLook()

    expect(wrapper.vm.showQuickLook).toBe(false)
    expect(mockFilterStore.clearSelection).toHaveBeenCalled()
  })

  it('closePopup hides the popup and clears the selection', () => {
    wrapper.vm.handleShowQuickLook({ feature: { comment: 'E' } })
    wrapper.vm.handleExpandedPopup()
    wrapper.vm.closePopup()

    expect(wrapper.vm.showPopup).toBe(false)
    expect(mockFilterStore.clearSelection).toHaveBeenCalled()
  })

  it('nonMncFeatureFilter excludes MNC catalog pins (those with a string_id)', () => {
    expect(wrapper.vm.nonMncFeatureFilter({ properties: { string_id: 'mindanao' } })).toBe(false)
    expect(wrapper.vm.nonMncFeatureFilter({ properties: {} })).toBe(true)
    expect(wrapper.vm.nonMncFeatureFilter({})).toBe(true)
  })

  it('parsedLinks splits the selected feature semicolon-separated links', async () => {
    mockFilterStore.selectedFeature = { properties: { links: 'Link A; Link B ;; Link C' } }
    await nextTick()

    const labels = wrapper.vm.parsedLinks.map((l: any) => l.label)
    expect(labels).toEqual(['Link A', 'Link B', 'Link C'])
  })

  it('parsedLinks is empty when there is no selection', () => {
    expect(wrapper.vm.parsedLinks).toEqual([])
  })
})
