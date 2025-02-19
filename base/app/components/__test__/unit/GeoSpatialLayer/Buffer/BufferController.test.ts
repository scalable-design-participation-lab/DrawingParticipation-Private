import type { VueWrapper } from '@vue/test-utils'
import { mount } from '@vue/test-utils'
import BufferController from '@components/GeoSpatialLayer/Buffer/BufferController.vue'

describe('bufferController.vue', () => {
  let wrapper: VueWrapper<any>

  beforeEach(() => {
    wrapper = mount(BufferController, {
      props: {
        visible: true,
        zIndex: 40,
        radius: 10,
      },
      global: {
        stubs: {
          UCard: true,
          UToggle: true,
          UInput: true,
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
    expect(wrapper.props().radius).toBe(10)
  })

  it('updates model values when inputs change', async () => {
    await wrapper.setProps({ visible: false })
    expect(wrapper.props().visible).toBe(false)

    await wrapper.setProps({ zIndex: 50 })
    expect(wrapper.props().zIndex).toBe(50)

    await wrapper.setProps({ radius: 15 })
    expect(wrapper.props().radius).toBe(15)
  })
})
