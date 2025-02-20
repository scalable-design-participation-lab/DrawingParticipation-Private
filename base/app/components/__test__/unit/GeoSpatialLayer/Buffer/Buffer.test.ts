import type { VueWrapper } from '@vue/test-utils'
import { mount } from '@vue/test-utils'
import type { BufferMode } from '@components/GeoSpatialLayer/Buffer/Buffer.vue'
import Buffer from '@components/GeoSpatialLayer/Buffer/Buffer.vue'
import * as turf from '@turf/turf'
import { vi } from 'vitest'

// Mocking Turf.js functions using vi
vi.mock('@turf/turf', async () => {
  const actual = await vi.importActual<typeof import('@turf/turf')>('@turf/turf')
  return {
    ...actual,
    buffer: vi.fn((point, radius, options) => ({
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [[[0, 0], [1, 1], [1, 0], [0, 0]]],
      },
    })),
    union: vi.fn(features => ({
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [[[0, 0], [2, 2], [2, 0], [0, 0]]],
      },
    })),
    intersect: vi.fn(features => ({
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [[[1, 1], [1.5, 1.5], [1.5, 1], [1, 1]]],
      },
    })),
    point: vi.fn(coord => ({ type: 'Feature', geometry: { type: 'Point', coordinates: coord } })),
    featureCollection: vi.fn(features => ({ type: 'FeatureCollection', features })),
  }
})

describe('buffer.vue', () => {
  let wrapper: VueWrapper<any>

  beforeEach(() => {
    wrapper = mount(Buffer, {
      props: {
        coordinates: [
          [106.8650, -6.1751], // Jakarta
          [151.2093, -33.8688], // Sydney
        ],
        zIndex: 2,
        visible: false,
        radius: 300,
        mode: 'none' as BufferMode, // Default mode
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
    expect(wrapper.props().coordinates).toEqual([
      [106.8650, -6.1751],
      [151.2093, -33.8688],
    ])
    expect(wrapper.props().zIndex).toBe(2)
    expect(wrapper.props().visible).toBe(false)
    expect(wrapper.props().radius).toBe(300)
  })

  it('computes buffer features correctly', () => {
    const computedBuffers = wrapper.vm.bufferFeatures

    expect(computedBuffers).toBeDefined()
    expect(computedBuffers.length).toBeGreaterThan(0)

    // Ensure turf.buffer is called
    expect(turf.buffer).toHaveBeenCalled()
  })

  it('computes union correctly', async () => {
    await wrapper.setProps({ mode: 'union' })

    const computedBuffers = wrapper.vm.bufferFeatures
    expect(computedBuffers).toBeDefined()
    expect(computedBuffers.length).toBeGreaterThan(0)

    // Verify that the union function was called
    expect(turf.union).toHaveBeenCalled()
  })

  it('computes intersect correctly', async () => {
    await wrapper.setProps({ mode: 'intersect' })

    const computedBuffers = wrapper.vm.bufferFeatures
    expect(computedBuffers).toBeDefined()

    // If there's no intersection, return an empty array
    if (computedBuffers.length === 0) {
      expect(turf.intersect).toHaveBeenCalled()
    }
    else {
      expect(computedBuffers.length).toBeGreaterThan(0)
      expect(turf.intersect).toHaveBeenCalled()
    }
  })
})
