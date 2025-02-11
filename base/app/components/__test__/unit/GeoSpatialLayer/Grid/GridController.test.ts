import GridController from '@components/GeoSpatialLayer/Grid/GridController.vue'
import type { VueWrapper } from '@vue/test-utils'
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it } from 'vitest'

const UToggle = {
  template: '<input type="checkbox" @input="$emit(\'input\', $event.target.checked)" />',
  props: ['value'],
}
describe('gridController.vue', () => {
  let wrapper: VueWrapper<any>

  beforeEach(() => {
    wrapper = mount(GridController, {
      global: {
        stubs: {
          UToggle,
        },
      },
      props: {
        visible: true,
        baseHue: 180,
        cellSide: 0.5,
        shape: 'Hexagon',
      },
    })
  })
  it('render correctly', () => {
    expect(wrapper.element).toMatchSnapshot()
  })

  it('renders the component properly', () => {
    expect(wrapper.exists()).toBe(true)
  })

  it('toggles visibility', async () => {
    const toggle = wrapper.findComponent(UToggle)
    expect(toggle.exists()).toBe(true)

    await toggle.setValue(false)
    await wrapper.vm.$nextTick()
    expect(wrapper.vm.visible).toBe(false)
  })

  it('updates base hue correctly', async () => {
    const slider = wrapper.find('input[type="range"][min="0"][max="360"]') // Use selector
    expect(slider.exists()).toBe(true)

    await slider.setValue('200')
    await wrapper.vm.$nextTick()

    expect(Number(wrapper.vm.baseHue)).toBe(200)
  })

  it('updates cell side correctly', async () => {
    const slider = wrapper.find('input[type="range"][min="0.1"][max="1"]')
    expect(slider.exists()).toBe(true)

    await slider.setValue('0.8')
    await wrapper.vm.$nextTick() // Ensure reactivity updates

    expect(Number(wrapper.vm.cellSide)).toBe(0.8)
  })

  it('updates shape correctly', async () => {
    const radioSquare = wrapper.find('input[type="radio"][value="Square"]')
    expect(radioSquare.exists()).toBe(true)

    await radioSquare.setValue()
    await wrapper.vm.$nextTick() // Ensure reactivity updates

    expect(wrapper.vm.shape).toBe('Square') // ✅ Check component's state, not props
  })
})
