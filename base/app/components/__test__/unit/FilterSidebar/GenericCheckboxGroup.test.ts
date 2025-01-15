import { describe, expect, it } from 'vitest'
import { config, mount } from '@vue/test-utils'
import GenericCheckboxGroup from '@components/FilterSidebar/GenericCheckboxGroup.vue'

// Mock NuxtUI components
const UCheckbox = {
  name: 'UCheckbox',
  template: '<div><input type="checkbox" :checked="modelValue" @change="$emit(\'update:modelValue\', $event.target.checked)" /><label>{{ label }}</label></div>',
  props: ['label', 'modelValue'],
}

const UButton = {
  name: 'UButton',
  template: '<button @click="$emit(\'click\')">{{ label }}</button>',
  props: ['label'],
}

// Configure Vue Test Utils to use the mock components
config.global.stubs = {
  UCheckbox,
  UButton,
}

describe('genericCheckboxGroup', () => {
  const mockProps = {
    items: [
      { label: 'Option 1', value: 'opt1' },
      { label: 'Option 2', value: 'opt2' },
    ],
    modelValue: { opt1: true, opt2: false },
  }

  it('renders correctly', () => {
    const wrapper = mount(GenericCheckboxGroup, { props: mockProps })
    expect(wrapper.element).toMatchSnapshot()
  })

  it('renders the component correctly', () => {
    const wrapper = mount(GenericCheckboxGroup, { props: mockProps })
    expect(wrapper.find('div').exists()).toBe(true)
    expect(wrapper.find('input').exists()).toBe(true)
    expect(wrapper.find('label').exists()).toBe(true)
    expect(wrapper.find('button').exists()).toBe(true)
  })

  it('renders the correct number of checkboxes', () => {
    const wrapper = mount(GenericCheckboxGroup, { props: mockProps })
    const checkboxes = wrapper.findAllComponents(UCheckbox)
    expect(checkboxes).toHaveLength(mockProps.items.length)
  })

  it('renders the "Select All" button', () => {
    const wrapper = mount(GenericCheckboxGroup, { props: mockProps })
    const selectAllButton = wrapper.findComponent(UButton)
    expect(selectAllButton.exists()).toBe(true)
    expect(selectAllButton.text()).toBe('Select All') // Based on initial state
  })

  it('toggles all checkboxes when "Select All" is clicked', async () => {
    const wrapper = mount(GenericCheckboxGroup, { props: mockProps })
    const selectAllButton = wrapper.findComponent(UButton)

    // Deselect all
    await selectAllButton.trigger('click')
    expect(wrapper.emitted('update:modelValue')[1][0]).toEqual({ opt1: false, opt2: false })

    // Select al
    await selectAllButton.trigger('click')
    expect(wrapper.emitted('update:modelValue')[0][0]).toEqual({ opt1: true, opt2: true })
  })

  it('updates individual checkbox values when toggled', async () => {
    const wrapper = mount(GenericCheckboxGroup, { props: mockProps })
    const checkboxes = wrapper.findAllComponents(UCheckbox)

    // Toggle the first checkbox
    await checkboxes[0].vm.$emit('update:modelValue', false)
    expect(wrapper.emitted('update:modelValue')[0][0]).toEqual({ opt1: false, opt2: false })

    // Toggle the second checkbox
    await checkboxes[1].vm.$emit('update:modelValue', true)
    expect(wrapper.emitted('update:modelValue')[1][0]).toEqual({ opt1: false, opt2: true })
  })

  it('initializes all items as selected if modelValue is empty', () => {
    const wrapper = mount(GenericCheckboxGroup, {
      props: { ...mockProps, modelValue: {} },
    })
    const emitted = wrapper.emitted('update:modelValue')
    expect(emitted).toHaveLength(1)
    expect(emitted[0][0]).toEqual({ opt1: true, opt2: true })
  })

  it('renders checkbox labels correctly', () => {
    const wrapper = mount(GenericCheckboxGroup, { props: mockProps })
    const checkboxes = wrapper.findAllComponents(UCheckbox)
    checkboxes.forEach((checkbox, index) => {
      expect(checkbox.props('label')).toBe(mockProps.items[index].label)
    })
  })
})
