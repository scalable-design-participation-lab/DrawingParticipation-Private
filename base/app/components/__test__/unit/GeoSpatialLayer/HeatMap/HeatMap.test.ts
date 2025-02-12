import HeatMap from '@components/GeoSpatialLayer/HeatMap/HeatMap.vue'
import { type VueWrapper, mount } from '@vue/test-utils'
import GeoJSON from 'ol/format/GeoJSON'

describe('heatMap.vue', () => {
  let wrapper: VueWrapper<any>
  beforeEach(() => {
    wrapper = mount(HeatMap, {
      props: {
        blur: 30,
        radius: 10,
        format: new GeoJSON(),
        features: [],
      },
    })
  })
  it('renders correctly', () => {
    expect(wrapper.element).toMatchSnapshot()
  })
  it('renders with provided props', () => {
    expect(wrapper.props().blur).toBe(30)
    expect(wrapper.props().radius).toBe(10)
    expect(wrapper.props().features).toStrictEqual([])
  })
  it('renders with default props', () => {
    wrapper = mount(HeatMap)
    expect(wrapper.props().blur).toBe(20)
    expect(wrapper.props().radius).toBe(20)
    expect(wrapper.props().features).toStrictEqual([])
  })
})
