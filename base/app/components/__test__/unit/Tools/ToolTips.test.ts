import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ToolTips from '@components/Tools/ToolTips.vue'
import { Feature, Map } from 'ol'
import { Point } from 'ol/geom'
import { nextTick } from 'vue'

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
    await nextTick()
    await wrapper.vm.handleHoverSelect({ selected: [feature] })

    expect(wrapper.vm.hoverPopup.state.visible).toBe(true)
    expect(wrapper.vm.hoverPopup.state.feature).toStrictEqual(feature)
  })

  it('shows pinned popup when feature is clicked', async () => {
    await nextTick()
    await wrapper.vm.handleClick({ selected: [feature] })

    expect(wrapper.vm.pinnedPopup.state.visible).toBe(true)
    expect(wrapper.vm.pinnedPopup.state.feature).toStrictEqual(feature)
  })

  it('hides hover popup when pinned popup is active', async () => {
    await nextTick()
    await wrapper.vm.handleClick({ selected: [feature] })
    await wrapper.vm.handleHoverSelect({ selected: [feature] })

    expect(wrapper.vm.hoverPopup.state.visible).toBe(false)
  })

  it('resets pinned popup on second click', async () => {
    await nextTick()
    await wrapper.vm.handleClick({ selected: [feature] })
    await wrapper.vm.handleClick({ selected: [] })

    expect(wrapper.vm.pinnedPopup.state.visible).toBe(false)
  })

  it('updates popup position on feature selection', async () => {
    await nextTick()
    const getPixelFromCoordinateMock = vi
      .fn()
      .mockReturnValue([100, 200])

    mapInstance.getPixelFromCoordinate = getPixelFromCoordinateMock

    await wrapper.vm.handleClick({ selected: [feature] })

    expect(wrapper.vm.pinnedPopup.state.position).toEqual({ x: 100, y: 200 })
  })
})
