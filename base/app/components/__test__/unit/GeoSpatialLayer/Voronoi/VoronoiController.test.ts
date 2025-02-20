import VoronoiController from '@components/GeoSpatialLayer/Voronoi/VoronoiController.vue'
import type { VueWrapper } from '@vue/test-utils'
import { mount } from '@vue/test-utils'

describe('voronoiController.vue', () => {
  let wrapper: VueWrapper<any>

  beforeEach(() => {
    wrapper = mount(VoronoiController, {
      props: {
        visible: true,
        zIndex: 40,
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
    expect(wrapper.props().zIndex).toBe(40)
  })
})
