import Buffer from '@components/GeoSpatialLayer/Buffer/Buffer.vue'

import { type VueWrapper, mount } from '@vue/test-utils'

describe('buffer.vue', () => {
  let wrapper: VueWrapper<any>
  beforeEach(() => {
    wrapper = mount(Buffer, {
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
})
