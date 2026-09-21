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
  // No $emit here: the native click already falls through to the real handler,
  // and re-emitting it ran every press twice.
  template: '<button>{{ label }}</button>',
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
    const wrapper = mount(GenericCheckboxGroup, { props: { ...mockProps } })
    const selectAllButton = wrapper.findComponent(UButton)

    // Not everything is selected yet, so the button selects the rest.
    await selectAllButton.trigger('click')
    expect(wrapper.emitted('update:modelValue')[0][0]).toEqual({ opt1: true, opt2: true })

    // The parent owns the value: feed it back, the way a bound page does.
    await wrapper.setProps({ modelValue: { opt1: true, opt2: true } })
    await selectAllButton.trigger('click')
    console.log('EMITTED', JSON.stringify(wrapper.emitted('update:modelValue')), 'PROPS', JSON.stringify(wrapper.props('modelValue')))
    expect(wrapper.emitted('update:modelValue')[1][0]).toEqual({ opt1: false, opt2: false })
  })

  it('updates individual checkbox values when toggled', async () => {
    const wrapper = mount(GenericCheckboxGroup, { props: { ...mockProps } })
    const checkboxes = wrapper.findAllComponents(UCheckbox)

    await checkboxes[0].vm.$emit('update:modelValue', false)
    expect(wrapper.emitted('update:modelValue')[0][0]).toEqual({ opt1: false, opt2: false })

    await wrapper.setProps({ modelValue: { opt1: false, opt2: false } })
    await checkboxes[1].vm.$emit('update:modelValue', true)
    expect(wrapper.emitted('update:modelValue')[1][0]).toEqual({ opt1: false, opt2: true })
  })

  it('keeps no state of its own', async () => {
    // It used to hold a private copy seeded on mount, so reopening the panel
    // silently re-selected everything while the page's filter said otherwise.
    const wrapper = mount(GenericCheckboxGroup, { props: { ...mockProps } })
    await wrapper.findAllComponents(UCheckbox)[0].vm.$emit('update:modelValue', false)

    // The parent ignored the event, so nothing on screen may have changed.
    expect(wrapper.findAll('input')[0].element.checked).toBe(true)

    await wrapper.setProps({ modelValue: { opt1: false, opt2: false } })
    expect(wrapper.findAll('input')[0].element.checked).toBe(false)
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
