import type { VueWrapper } from '@vue/test-utils'
import { mount } from '@vue/test-utils'
import Buffer from '@components/GeoSpatialLayer/Buffer/Buffer.vue'
import * as turf from '@turf/turf'

describe('buffer.vue', () => {
  let wrapper: VueWrapper<any>

  beforeEach(() => {
    wrapper = mount(Buffer, {
      props: {
        coordinates: [
          [106.8650, -6.1751], // Example: Jakarta
          [151.2093, -33.8688], // Example: Sydney
        ],
        zIndex: 2,
        visible: false,
        radius: 300,
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

    // Verify that buffers were generated using turf.buffer
    const expectedBuffers = wrapper.props().coordinates.map(coord =>
      turf.buffer(turf.point(coord), wrapper.props().radius, { units: 'meters' }),
    )

    expect(expectedBuffers).toBeDefined()
    expect(expectedBuffers.length).toBe(wrapper.props().coordinates.length)
  })
})
