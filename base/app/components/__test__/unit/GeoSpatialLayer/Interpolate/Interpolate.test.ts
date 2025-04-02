import Interpolate from '@components/GeoSpatialLayer/Interpolate/Interpolate.vue'
import { type VueWrapper, mount } from '@vue/test-utils'

describe('interpolate.vue', () => {
  let wrapper: VueWrapper<any>
  beforeEach(() => {
    wrapper = mount(Interpolate, {
      props:
            {
              features: {
                type: 'FeatureCollection',
                features: [],
              },
              property: 'Solrad',
              gridSize: 2,
              gridType: 'point',
              units: 'miles',
              visible: true,
              zIndex: 1,
              bbox: [13, 3, 15, 5],
            },
    })
  })

  it('renders correctly', () => {
    expect(wrapper.element).toMatchSnapshot()
  })
  it('renders with provided props', () => {
    expect(wrapper.props().features).toStrictEqual(
      {
        type: 'FeatureCollection',
        features: [],
      },
    )
    expect(wrapper.props().property).toBe('Solrad')
    expect(wrapper.props().gridType).toBe('point')
    expect(wrapper.props().units).toBe('miles')
    expect(wrapper.props().visible).toBe(true)
    expect(wrapper.props().zIndex).toBe(1)
    expect(wrapper.props().bbox).toStrictEqual([13, 3, 15, 5])
  })
  it('renders with default props', () => {
    wrapper = mount(Interpolate)
    expect(wrapper.props().features).toStrictEqual({
      type: 'FeatureCollection',
      features: [],
    })
    expect(wrapper.props().property).toBe(undefined)
    expect(wrapper.props().gridSize).toBe(100)
    expect(wrapper.props().units).toBe('miles')
    expect(wrapper.props().visible).toBe(true)
    expect(wrapper.props().zIndex).toBe(1)
    expect(wrapper.props().bbox).toStrictEqual([-180, -90, 180, 90])
  })
})
