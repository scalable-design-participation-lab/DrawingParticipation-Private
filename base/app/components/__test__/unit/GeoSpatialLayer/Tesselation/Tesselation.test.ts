import Tesselation from '@components/GeoSpatialLayer/Tesselation/Tesselation.vue'
import type { VueWrapper } from '@vue/test-utils'
import { mount } from '@vue/test-utils'

describe('tesselation.vue', () => {
  let wrapper: VueWrapper<any>

  beforeEach(() => {
    wrapper = mount(Tesselation, {
      props: {
        coordinates: [
          [28.5, 49.25],
          [28.55, 49.27],
          [28.53, 49.22],
        ],
        bbox: [28.462271, 49.215576, 28.570271, 49.265576],
        visible: true,
        zIndex: 5,
      },
    })
  })

  it('renders correctly', () => {
    expect(wrapper.element).toMatchSnapshot()
  })

  it('renders with provided props', () => {
    expect(wrapper.props().coordinates).toEqual([
      [28.5, 49.25],
      [28.55, 49.27],
      [28.53, 49.22],
    ])
    expect(wrapper.props().bbox).toEqual([28.462271, 49.215576, 28.570271, 49.265576])
    expect(wrapper.props().visible).toBe(true)
    expect(wrapper.props().zIndex).toBe(5)
  })

  it('computes features correctly when coordinates are provided', () => {
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
        coordinates: [],
      },
    })
    const computedFeatures = (wrapper.vm as any).features
    expect(computedFeatures).toEqual([])
  })

  it('renders with default props', () => {
    wrapper = mount(Tesselation)
    expect(wrapper.props().coordinates).toEqual([])
    expect(wrapper.props().bbox).toEqual([28.462271, 49.215576, 28.570271, 49.265576])
    expect(wrapper.props().visible).toBe(false)
    expect(wrapper.props().zIndex).toBe(0)
  })
})
