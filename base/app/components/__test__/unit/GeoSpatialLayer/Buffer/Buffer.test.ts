import type { VueWrapper } from '@vue/test-utils'
import { mount } from '@vue/test-utils'
import type { BufferMode } from '@components/GeoSpatialLayer/Buffer/Buffer.vue'
import Buffer from '@components/GeoSpatialLayer/Buffer/Buffer.vue'
import * as turf from '@turf/turf'
import { vi } from 'vitest'

// Mock Turf.js functions using vi
vi.mock('@turf/turf', async () => {
  const actual = await vi.importActual<typeof import('@turf/turf')>('@turf/turf')
  return {
    ...actual,
    buffer: vi.fn(() => ({
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [[[0, 0], [1, 1], [1, 0], [0, 0]]],
      },
    })),
    union: vi.fn(() => ({
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [[[0, 0], [2, 2], [2, 0], [0, 0]]],
      },
    })),
    intersect: vi.fn(() => ({
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [[[1, 1], [1.5, 1.5], [1.5, 1], [1, 1]]],
      },
    })),
    featureCollection: vi.fn(features => ({
      type: 'FeatureCollection',
      features,
    })),
  }
})

describe('buffer.vue', () => {
  let wrapper: VueWrapper<any>

  beforeEach(() => {
    wrapper = mount(Buffer, {
      props: {
        coordinates: {
          type: 'FeatureCollection',
          features: [
            {
              type: 'Feature',
              geometry: { type: 'Point', coordinates: [106.865, -6.1751] },
              properties: {},
            },
            {
              type: 'Feature',
              geometry: { type: 'Point', coordinates: [151.2093, -33.8688] },
              properties: {},
            },
          ],
        },
        zIndex: 2,
        visible: false,
        radius: 300,
        mode: 'none' as BufferMode,
      },
      global: {
        stubs: {
          'ol-vector-layer': true,
          'ol-source-vector': true,
        },
      },
    })
  })

  it('renders correctly', () => {
    expect(wrapper.element).toMatchSnapshot()
  })

  it('renders with provided props', () => {
    expect(wrapper.props().coordinates).toEqual({
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [106.865, -6.1751] },
          properties: {},
        },
        {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [151.2093, -33.8688] },

          properties: {},
        },
      ],
    })
    expect(wrapper.props().zIndex).toBe(2)
    expect(wrapper.props().visible).toBe(false)
    expect(wrapper.props().radius).toBe(300)
  })

  it('computes buffer features correctly', async () => {
    await wrapper.vm.$nextTick() // Ensure reactivity updates

    const computedBuffers = wrapper.vm.bufferFeatures
    expect(computedBuffers).toBeDefined()
    expect(computedBuffers.length).toBeGreaterThan(0)

    // Ensure turf.buffer is called for each feature
    expect(turf.buffer).toHaveBeenCalledTimes(2)
  })

  it('computes union correctly', async () => {
    await wrapper.setProps({ mode: 'union' })
    await wrapper.vm.$nextTick() // Ensure reactivity updates

    const computedBuffers = wrapper.vm.bufferFeatures
    expect(computedBuffers).toBeDefined()
    expect(computedBuffers.length).toBeGreaterThan(0)

    // Ensure union was called
    expect(turf.union).toHaveBeenCalled()
  })

  it('computes intersect correctly', async () => {
    await wrapper.setProps({ mode: 'intersect' })
    await wrapper.vm.$nextTick() // Ensure reactivity updates

    const computedBuffers = wrapper.vm.bufferFeatures
    expect(computedBuffers).toBeDefined()

    if (computedBuffers.length === 0) {
      expect(turf.intersect).toHaveBeenCalled()
    }
    else {
      expect(computedBuffers.length).toBeGreaterThan(0)
      expect(turf.intersect).toHaveBeenCalled()
    }
  })
})
