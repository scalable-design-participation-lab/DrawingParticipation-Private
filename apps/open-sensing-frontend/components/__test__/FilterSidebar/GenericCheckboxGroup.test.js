import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, config } from '@vue/test-utils'
import GenericCheckboxGroup from '../../FilterSidebar/GenericCheckboxGroup.vue'

// Mock UCheckbox component
const UCheckbox = {
  name: 'UCheckbox',
  template: '<div class="mock-checkbox"><slot></slot></div>',
  props: ['modelValue', 'label'],
  emits: ['update:modelValue'],
}

// Configure Vue Test Utils to use the mock component
config.global.stubs = {
  UCheckbox,
}

describe('GenericCheckboxGroup', () => {
  let wrapper
  const items = [
    { label: 'Option 1', value: 'opt1' },
    { label: 'Option 2', value: 'opt2' },
    { label: 'Option 3', value: 'opt3' },
  ]

  beforeEach(() => {
    wrapper = mount(GenericCheckboxGroup, {
      props: {
        items: items,
        modelValue: {},
      },
    })
  })

  it('renders the correct number of checkboxes', () => {
    const checkboxes = wrapper.findAllComponents(UCheckbox)
    expect(checkboxes).toHaveLength(items.length)
  })

  it('initializes all checkboxes as checked when no initial selection is provided', async () => {
    await wrapper.vm.$nextTick()
    const emitted = wrapper.emitted('update:modelValue')
    expect(emitted).toBeTruthy()
    expect(emitted[0][0]).toEqual({
      opt1: true,
      opt2: true,
      opt3: true,
    })
  })

  it('updates the model value when a checkbox is clicked', async () => {
    const checkbox = wrapper.findAllComponents(UCheckbox)[0]
    await checkbox.vm.$emit('update:modelValue', false)
    const emitted = wrapper.emitted('update:modelValue')
    expect(emitted).toBeTruthy()
    expect(emitted[1][0]).toEqual({
      opt1: false,
      opt2: true,
      opt3: true,
    })
  })

  it('reflects changes in modelValue prop', async () => {
    await wrapper.setProps({
      modelValue: { opt1: false, opt2: true, opt3: false },
    })
    const checkboxes = wrapper.findAllComponents(UCheckbox)
    expect(checkboxes[0].props('modelValue')).toBe(false)
    expect(checkboxes[1].props('modelValue')).toBe(true)
    expect(checkboxes[2].props('modelValue')).toBe(false)
  })
})
