import { config, mount, VueWrapper } from '@vue/test-utils'
import MapIntroModal from '@components/MapIntroModal.vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const UModal = {
  name: 'UModal',
  template: '<div><slot /><slot name="header" /><slot name="footer" /></div>',
}

const UCard = {
  name: 'UCard',
  template: '<div><slot /><slot name="header" /><slot name="footer" /></div>',
}

const UButton = {
  name: 'UButton',
  template: '<button @click="closeModel"><slot /></button>',
  props: ['closeModel']
}

config.global.stubs = { UModal, UCard, UButton }

describe('mapIntroModel.vue', () => {
  let wrapper: VueWrapper<any>; 

  beforeEach(() => { 
    vi.clearAllMocks()

    wrapper = mount(MapIntroModal, 
      {
        props: { 
          modelValue: false
        },
        global: { 
          stubs: config.global.stubs
        }
      },
    )
  })
  it('renders correctly', () => {
    expect(wrapper.element).toMatchSnapshot()
  })

  it('closes the modal on button click', async () => {
    const closeButton = wrapper.findComponent(UButton)
    
    await closeButton.trigger('click')

    expect(wrapper.vm.isOpen).toBe(false)

    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
  })
})
