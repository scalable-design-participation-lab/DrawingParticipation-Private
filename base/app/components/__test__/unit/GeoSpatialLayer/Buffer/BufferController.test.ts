import BufferController from '@components/GeoSpatialLayer/Buffer/BufferController.vue'
import { type VueWrapper, mount } from '@vue/test-utils'

describe('bufferController.vue', () => {
  let wrapper: VueWrapper<any>

  beforeEach(() => {
    wrapper = mount(BufferController, {
      props: {
        visible: true,
        buffer: 0.5,
        color: '#ff0000',
      },
    })
  })
  it ('renders correctly', () => {
    expect(wrapper.element).toMatchSnapshot()
  })
})
