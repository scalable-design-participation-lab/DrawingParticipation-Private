import InterpolateController from '@components/GeoSpatialLayer/Interpolate/InterpolateController.vue'
import Nop from '@components/Nop.vue'
import { type VueWrapper, mount } from '@vue/test-utils'

describe('interpolateController.vue', () => {
  let wrapper: VueWrapper<any>
  beforeEach(() => {
    wrapper = mount(InterpolateController, {
      props: {
        visible: true,
        zIndex: 1,
        gridType: 'points',
        units: 'miles',
      },
      global: {
        stubs: {
          UToggle: Nop,
          UCard: Nop,
          UInput: Nop,
        },
      },
    })
  })

  it('renders correctly', () => {
    expect(wrapper.element).toMatchSnapshot()
  })
})
