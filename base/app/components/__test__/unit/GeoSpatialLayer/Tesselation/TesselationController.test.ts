import TesselationController from '@components/GeoSpatialLayer/Tesselation/TesselationController.vue'
import type { VueWrapper } from '@vue/test-utils'
import { mount } from '@vue/test-utils'

describe('voronoiController.vue', () => {
  let wrapper: VueWrapper<any>

  beforeEach(() => {
    wrapper = mount(TesselationController, {
      props: {
        visible: true,
        zIndex: 40,
        type: 'voronoi',
      },
      global: {
        stubs: ['UCard', 'UToggle', 'UInput'],
      },
    })
  })

  it('renders correctly', () => {
    expect(wrapper.element).toMatchSnapshot()
  })

  it('renders with provided props', () => {
    expect(wrapper.props().visible).toBe(true)
    expect(wrapper.props().type).toBe('voronoi')
    expect(wrapper.props().zIndex).toBe(40)
  })
})
