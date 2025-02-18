import Points from '@components/GeoSpatialLayer/Points/Points.vue'
import { type VueWrapper, mount } from '@vue/test-utils'

describe('points.vue', () => {
  let wrapper: VueWrapper<any>
  beforeEach(() => {
    wrapper = mount(Points, {
      props: {
        features: [],
      },
    })
  })
  it('renders correctly', () => {
    expect(wrapper.element).toMatchSnapshot()
  })
  it('renders with provided props', () => {
    expect(wrapper.props().features).toStrictEqual([])
  })
  it('renders with default props', () => {
    wrapper = mount(Points)
    expect(wrapper.props().features).toStrictEqual([])
  })
})
