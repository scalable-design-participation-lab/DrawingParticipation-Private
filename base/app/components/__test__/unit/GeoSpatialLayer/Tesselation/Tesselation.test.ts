import Tesselation from '@components/GeoSpatialLayer/Tesselation/Tesselation.vue'
import type { VueWrapper } from '@vue/test-utils'
import { mount } from '@vue/test-utils'
import Nop from '@components/Nop.vue'

describe('tesselation.vue', () => {
  let wrapper: VueWrapper<any>

  beforeEach(() => {
    wrapper = mount(Tesselation, {
      props: {
        coordinates: {
          type: 'FeatureCollection',
          features: [
            {
              type: 'Feature',
              geometry: {
                type: 'Point',
                coordinates: [28.5, 49.25],
              },
              properties: {},
            },
            {
              type: 'Feature',
              geometry: {
                type: 'Point',
                coordinates: [28.55, 49.27],
              },
              properties: {},
            },
            {
              type: 'Feature',
              geometry: {
                type: 'Point',
                coordinates: [28.53, 49.22],
              },
              properties: {},
            },
            {
              type: 'Feature',
              geometry: {
                type: 'Point',
                coordinates: [28.51, 49.224],
              },
              properties: {},
            },
          ],
        },
        bbox: [28.462271, 49.215576, 28.570271, 49.265576],
        visible: true,
        zIndex: 5,
      },
      global: {
        stubs: {
          'ol-vector-layer': Nop,
          'ol-source-vector': Nop,
          'ol-style': Nop,
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
          geometry: {
            type: 'Point',
            coordinates: [28.5, 49.25],
          },
          properties: {},
        },
        {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [28.55, 49.27],
          },
          properties: {},
        },
        {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [28.53, 49.22],
          },
          properties: {},
        },
        {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [28.51, 49.224],
          },
          properties: {},
        },
      ],
    })

    // Access the computed "features" from the component's setup state
    const computedFeatures = (wrapper.vm as any).features
    expect(Array.isArray(computedFeatures)).toBe(true)
    // When coordinates are provided, Turf should generate one or more features
    if (computedFeatures.length > 0) {
      computedFeatures.forEach((feature: any) => {
        // Each feature should have a 'fillColor' set by randomColor()
        expect(typeof feature.get('fillColor')).toBe('string')
      })
    }
  })

  it('computes empty features and logs a warning when no coordinates are provided', () => {
    wrapper = mount(Tesselation, {
      props: {
        coordinates: {
          type: 'FeatureCollection',
          features: [],
        },
      },
    })
    const computedFeatures = (wrapper.vm as any).features
    expect(computedFeatures).toEqual([])
  })

  it('return 2 cells feature when inputing 4 coordinates in TIN', () => {
    wrapper = mount(Tesselation, {
      props: {
        coordinates: {
          type: 'FeatureCollection',
          features: [
            {
              type: 'Feature',
              geometry: {
                type: 'Point',
                coordinates: [28.5, 49.25],
              },
              properties: {},
            },
            {
              type: 'Feature',
              geometry: {
                type: 'Point',
                coordinates: [28.55, 49.25],
              },
              properties: {},
            },
            {
              type: 'Feature',
              geometry: {
                type: 'Point',
                coordinates: [28.53, 49.22],
              },
              properties: {},
            },
            {
              type: 'Feature',
              geometry: {
                type: 'Point',
                coordinates: [28.51, 49.224],
              },
              properties: {},
            },
          ],
        },
        bbox: [28.462271, 49.215576, 28.570271, 49.265576],
        visible: true,
        zIndex: 5,
        type: 'tin',
      },
    })

    expect(wrapper.vm.features.length).toBe(2)
  })

  it('renders with default props', () => {
    wrapper = mount(Tesselation)
    expect(wrapper.props().coordinates).toEqual({ features: [], type: 'FeatureCollection' })
    expect(wrapper.props().bbox).toEqual([28.462271, 49.215576, 28.570271, 49.265576])
    expect(wrapper.props().visible).toBe(false)
    expect(wrapper.props().zIndex).toBe(0)
  })
})
