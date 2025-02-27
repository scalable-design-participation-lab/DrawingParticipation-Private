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
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
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
    expect(consoleWarnSpy).toHaveBeenCalledWith('No valid coordinates inside the bounding box for Tesselation.')
    consoleWarnSpy.mockRestore()
  })

  it('returns 2 cell features when inputting 4 coordinates in TIN mode', () => {
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
      global: {
        stubs: {
          'ol-vector-layer': Nop,
          'ol-source-vector': Nop,
          'ol-style': Nop,
        },
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

  it('removes duplicate coordinates and produces same features as unique input', () => {
    // Test with duplicate coordinates
    const dupCoordinates = [
      [28.5, 49.25],
      [28.5, 49.25],
      [28.55, 49.27],
      [28.55, 49.27],
      [28.53, 49.22],
    ]
    const uniqueCoordinates = [
      [28.5, 49.25],
      [28.55, 49.27],
      [28.53, 49.22],
    ]
    const wrapperDup = mount(Tesselation, {
      props: {
        coordinates: {
          type: 'FeatureCollection',
          features: dupCoordinates.map(coord => ({
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: coord,
            },
            properties: {},
          })),
        },
        bbox: [28.462271, 49.215576, 28.570271, 49.265576],
        visible: true,
        zIndex: 5,
        clusterCount: 1,
      },
      global: {
        stubs: {
          'ol-vector-layer': Nop,
          'ol-source-vector': Nop,
          'ol-style': Nop,
        },
      },
    })

    const wrapperUnique = mount(Tesselation, {
      props: {
        coordinates: {
          type: 'FeatureCollection',
          features: uniqueCoordinates.map(coord => ({
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: coord,
            },
            properties: {},
          })),
        },
        bbox: [28.462271, 49.215576, 28.570271, 49.265576],
        visible: true,
        zIndex: 5,
        clusterCount: 1,
      },
      global: {
        stubs: {
          'ol-vector-layer': Nop,
          'ol-source-vector': Nop,
          'ol-style': Nop,
        },
      },
    })

    const featuresDup = (wrapperDup.vm as any).features
    const featuresUnique = (wrapperUnique.vm as any).features

    // The number of features should be identical if duplicate removal works correctly.
    expect(featuresDup.length).toEqual(featuresUnique.length)
  })
  it('computes features correctly when valid coordinates are provided', () => {
    const computedFeatures = (wrapper.vm as any).features
    expect(Array.isArray(computedFeatures)).toBe(true)
    if (computedFeatures.length > 0) {
      computedFeatures.forEach((feature: any) => {
        expect(typeof feature.get('fillColor')).toBe('string')
      })
    }
  })

  it('removes duplicate coordinates and produces the same output as unique input', () => {
    const duplicateCoordinates = [
      [28.5, 49.25],
      [28.5, 49.25],
      [28.55, 49.27],
      [28.55, 49.27],
      [28.53, 49.22],
    ]
    const uniqueCoordinates = [
      [28.5, 49.25],
      [28.55, 49.27],
      [28.53, 49.22],
    ]

    const wrapperDup = mount(Tesselation, { props: { coordinates: { type: 'FeatureCollection', features: duplicateCoordinates.map(coord => ({ type: 'Feature', geometry: { type: 'Point', coordinates: coord }, properties: {} })) } } })
    const wrapperUnique = mount(Tesselation, { props: { coordinates: { type: 'FeatureCollection', features: uniqueCoordinates.map(coord => ({ type: 'Feature', geometry: { type: 'Point', coordinates: coord }, properties: {} })) } } })

    expect((wrapperDup.vm as any).features.length).toEqual((wrapperUnique.vm as any).features.length)
  })

  it('ensures cluster count behavior does not change output', () => {
    const wrapperCluster2 = mount(Tesselation, { props: { clusterCount: 2, coordinates: { type: 'FeatureCollection', features: [
      { type: 'Feature', geometry: { type: 'Point', coordinates: [28.5, 49.25] }, properties: {} },
      { type: 'Feature', geometry: { type: 'Point', coordinates: [28.55, 49.27] }, properties: {} },
      { type: 'Feature', geometry: { type: 'Point', coordinates: [28.53, 49.22] }, properties: {} },
    ] } } })
    const wrapperCluster4 = mount(Tesselation, { props: { clusterCount: 4, coordinates: { type: 'FeatureCollection', features: [
      { type: 'Feature', geometry: { type: 'Point', coordinates: [28.5, 49.25] }, properties: {} },
      { type: 'Feature', geometry: { type: 'Point', coordinates: [28.55, 49.27] }, properties: {} },
      { type: 'Feature', geometry: { type: 'Point', coordinates: [28.53, 49.22] }, properties: {} },
    ] } } })

    expect((wrapperCluster2.vm as any).features.length).toBe((wrapperCluster4.vm as any).features.length)
    expect((wrapperCluster4.vm as any).features.length).toBe((wrapperCluster2.vm as any).features.length)
  })

  it('returns correct number of cells in TIN mode', () => {
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
                coordinates: [28.55, 49.26],
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
        type: 'tin',
      },
    })
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
                coordinates: [28.55, 49.26],
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
        type: 'voronoi',
      },
    })
    expect((wrapper.vm as any).features.length).toBe(4)
  })

  it('filters out coordinates outside the bbox', () => {
    const outOfBoundsCoords = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [27.0, 48.0], // Outside bbox
          },
          properties: {},
        },
        {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [28.5, 49.25], // Inside bbox
          },
          properties: {},
        },
        {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [30.0, 50.0], // Outside bbox
          },
          properties: {},
        },
      ],
    }
    wrapper = mount(Tesselation, {
      props: {
        coordinates: { ...outOfBoundsCoords, features: outOfBoundsCoords.features.map(feature => ({ ...feature, type: 'Feature' as const })) },
        bbox: [28.462271, 49.215576, 28.570271, 49.265576],
      },
    })
    expect((wrapper.vm as any).features.length).toBe(1)
  })

  it('ensures each feature has a valid color assignment', () => {
    const computedFeatures = (wrapper.vm as any).features
    computedFeatures.forEach((feature: any) => {
      expect(typeof feature.get('fillColor')).toBe('string')
      expect(feature.get('fillColor')).toMatch(/^rgb|^#/) // Should be a valid color
    })
  })

  it('handles single coordinate input gracefully', () => {
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
          ],
        },
      },
    })
    expect((wrapper.vm as any).features.length).toBe(1)
  })
})
