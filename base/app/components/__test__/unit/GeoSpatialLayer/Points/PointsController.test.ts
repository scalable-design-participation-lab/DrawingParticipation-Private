import PointsController from '@components/GeoSpatialLayer/Points/PointsController.vue'
import type { VueWrapper } from '@vue/test-utils'
import { mount } from '@vue/test-utils'

describe('pointsController.vue', () => {
  let wrapper: VueWrapper<any>

  beforeEach(() => {
    wrapper = mount(PointsController, {
      props: {
        visible: true,
        zIndex: 40,
        shapePoints: 5,
        shapeRadius: 10,
        shapeOpacity: 0.5,
        shapeFillColor: '#FF0000',
      },
      global: {
        stubs: {
          'UCard': true,
          'UToggle': true,
          'UInput': true,
          'color-picker-block': true,
        },
      },
    })
  })

  it('renders correctly', () => {
    expect(wrapper.element).toMatchSnapshot()
  })

  it('renders with provided props', () => {
    expect(wrapper.props().visible).toBe(true)
    expect(wrapper.props().zIndex).toBe(40)
    expect(wrapper.props().shapePoints).toBe(5)
    expect(wrapper.props().shapeRadius).toBe(10)
    expect(wrapper.props().shapeOpacity).toBe(0.5)
    expect(wrapper.props().shapeFillColor).toBe('#FF0000')
  })
})
