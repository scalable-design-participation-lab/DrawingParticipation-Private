import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, config } from '@vue/test-utils'
import { sub, format } from 'date-fns'
import GenericDateRangePicker from '../../FilterSidebar/GenericDateRangePicker.vue'

// Mock components
const UButton = {
  name: 'UButton',
  template: '<button @click="$emit(\'click\')"><slot></slot></button>',
  props: ['icon', 'color', 'variant', 'label'],
  emits: ['click'],
}

const DatePicker = {
  name: 'DatePicker',
  template: '<div class="mock-date-picker"></div>',
  props: ['modelValue', 'min', 'max', 'range'],
  emits: ['update:modelValue'],
}

// Configure Vue Test Utils to use the mock components
config.global.stubs = {
  UButton,
  DatePicker,
  Teleport: true, // Mock Teleport
}

describe('GenericDateRangePicker', () => {
  let wrapper
  const defaultDateRange = {
    start: sub(new Date(), { days: 14 }),
    end: new Date(),
  }

  beforeEach(() => {
    wrapper = mount(GenericDateRangePicker, {
      props: {
        modelValue: defaultDateRange,
      },
    })
  })

  it('renders the component', () => {
    expect(wrapper.find('button').exists()).toBe(true)
  })

  it('displays the formatted date range', () => {
    const expectedText = `${format(
      defaultDateRange.start,
      'd MMM, yyyy'
    )} - ${format(defaultDateRange.end, 'd MMM, yyyy')}`
    expect(wrapper.find('button').text()).toBe(expectedText)
  })

  it('opens the date picker modal when button is clicked', async () => {
    await wrapper.find('button').trigger('click')
    expect(wrapper.vm.isOpen).toBe(true)
    expect(wrapper.find('.mock-date-picker').exists()).toBe(true)
  })

  it('emits update:modelValue when a predefined range is selected', async () => {
    await wrapper.find('button').trigger('click')
    await wrapper.vm.$nextTick()

    await wrapper.vm.handleRangeClick({ days: 14 })
    await wrapper.vm.$nextTick()

    const emitted = wrapper.emitted('update:modelValue')
    expect(emitted).toBeTruthy()
    if (emitted) {
      expect(emitted[emitted.length - 1][0]).toEqual({
        start: expect.any(Date),
        end: expect.any(Date),
      })
    }
  })

  it('updates the date range when DatePicker emits an update', async () => {
    await wrapper.find('button').trigger('click') // Open the modal
    await wrapper.vm.$nextTick()

    const newDateRange = {
      start: sub(new Date(), { days: 7 }),
      end: new Date(),
    }
    const datePicker = wrapper.findComponent(DatePicker)
    expect(datePicker.exists()).toBe(true)

    await datePicker.vm.$emit('update:modelValue', newDateRange)
    await wrapper.vm.$nextTick()

    const emitted = wrapper.emitted('update:modelValue')
    expect(emitted).toBeTruthy()
    if (emitted) {
      expect(emitted[emitted.length - 1][0]).toEqual(newDateRange)
    }
  })

  it('closes the modal when Apply button is clicked', async () => {
    await wrapper.find('button').trigger('click')
    expect(wrapper.vm.isOpen).toBe(true)

    const applyButton = wrapper
      .findAll('button')
      .find((btn) => btn.text() === 'Apply')
    await applyButton.trigger('click')

    expect(wrapper.vm.isOpen).toBe(false)
  })
})
