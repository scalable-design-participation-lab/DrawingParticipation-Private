import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ToolTips from '@components/Tools/ToolTips.vue'
import { Feature, Map } from 'ol'
import { Point } from 'ol/geom'

describe('toolTips.vue', () => {
  let wrapper: any
  let mapInstance: Map
  let feature: Feature
  const originalResizeObserver = globalThis.ResizeObserver

  beforeAll(() => {
    globalThis.ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
  })

  beforeEach(() => {
    // Create teleport target
    const overlayDiv = document.createElement('div')
    overlayDiv.id = 'map-overlays'
    document.body.appendChild(overlayDiv)

    mapInstance = new Map()
    vi.spyOn(mapInstance, 'getPixelFromCoordinate').mockReturnValue([100, 200])
    feature = new Feature({
      geometry: new Point([0, 0]),
      name: 'Test Feature',
    })

    wrapper = mount(ToolTips, {
      props: {
        mapInstance,
      },
    })
  })

  afterEach(() => {
    // Cleanup DOM and component
    wrapper?.unmount()
    wrapper = null
    document.getElementById('map-overlays')?.remove()
  })

  afterAll(() => {
    globalThis.ResizeObserver = originalResizeObserver
  })

  it('renders properly', async () => {
    expect(wrapper.element).toMatchSnapshot()
  })
  it('mounts properly', async () => {
    expect(wrapper.exists()).toBe(true)
  })

  it('shows hover popup when feature is hovered', async () => {
    // Hover reads the map through forEachFeatureAtPixel; it never selects.
    vi.spyOn(mapInstance, 'forEachFeatureAtPixel').mockReturnValue(feature)
    await wrapper.vm.handlePointerMove({ pixel: [10, 10], dragging: false })

    expect(wrapper.vm.hoverPopup.state.visible).toBe(true)
    expect(wrapper.vm.hoverPopup.state.feature).toStrictEqual(feature)
  })

  it('does not touch the style of the feature under the pointer', async () => {
    // A category icon must survive being hovered: setting a style on the
    // feature, then clearing it, used to leave a default circle for good.
    vi.spyOn(mapInstance, 'forEachFeatureAtPixel').mockReturnValue(feature)
    await wrapper.vm.handlePointerMove({ pixel: [10, 10], dragging: false })
    expect(feature.getStyle()).toBeNull()

    vi.spyOn(mapInstance, 'forEachFeatureAtPixel').mockReturnValue(undefined)
    await wrapper.vm.handlePointerMove({ pixel: [999, 999], dragging: false })
    expect(feature.getStyle()).toBeNull()
    expect(wrapper.vm.hoverPopup.state.visible).toBe(false)
  })

  it('shows pinned popup when feature is clicked', async () => {
    await wrapper.vm.handleClick({ selected: [feature] })

    expect(wrapper.vm.pinnedPopup.state.visible).toBe(true)
    expect(wrapper.vm.pinnedPopup.state.feature).toStrictEqual(feature)
  })

  it('hides hover popup when pinned popup is active', async () => {
    vi.spyOn(mapInstance, 'forEachFeatureAtPixel').mockReturnValue(feature)
    await wrapper.vm.handleClick({ selected: [feature] })
    await wrapper.vm.handlePointerMove({ pixel: [10, 10], dragging: false })

    expect(wrapper.vm.hoverPopup.state.visible).toBe(false)
  })

  it('resets pinned popup on second click', async () => {
    await wrapper.vm.handleClick({ selected: [feature] })
    await wrapper.vm.handleClick({ selected: [] })

    expect(wrapper.vm.pinnedPopup.state.visible).toBe(false)
  })

  it('updates popup position on feature selection', async () => {
    const getPixelFromCoordinateMock = vi
      .fn()
      .mockReturnValue([100, 200])

    mapInstance.getPixelFromCoordinate = getPixelFromCoordinateMock

    await wrapper.vm.handleClick({ selected: [feature] })

    expect(wrapper.vm.pinnedPopup.state.position).toEqual({ x: 100, y: 200 })
  })
})
