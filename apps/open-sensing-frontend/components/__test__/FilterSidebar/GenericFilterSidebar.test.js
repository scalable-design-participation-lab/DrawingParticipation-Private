import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, config } from '@vue/test-utils'
import GenericFilterSidebar from '../../FilterSidebar/GenericFilterSidebar.vue'

// Mock components
const UCard = {
  name: 'UCard',
  template:
    '<div><slot name="header"></slot><slot></slot><slot name="footer"></slot></div>',
}

const UButton = {
  name: 'UButton',
  template:
    '<button @click="$emit(\'click\')"><span v-if="icon" :class="icon"></span><slot></slot></button>',
  props: ['icon', 'color', 'variant', 'label'],
  emits: ['click'],
}

const UAccordion = {
  name: 'UAccordion',
  template:
    '<div><slot name="item" v-for="item in items" :item="item"></slot></div>',
  props: ['items'],
}

const GenericCheckboxGroup = {
  name: 'GenericCheckboxGroup',
  template: '<div class="mock-checkbox-group"></div>',
  emits: ['update:modelValue'],
}

const GenericDateRangePicker = {
  name: 'GenericDateRangePicker',
  template: '<div class="mock-date-range-picker"></div>',
  emits: ['update:modelValue'],
}

const UIcon = {
  name: 'UIcon',
  template: '<span class="mock-icon"></span>',
  props: ['name'],
}

// Configure Vue Test Utils to use the mock components
config.global.stubs = {
  UCard,
  UButton,
  UAccordion,
  GenericCheckboxGroup,
  GenericDateRangePicker,
  UIcon,
}

describe('GenericFilterSidebar', () => {
  let wrapper
  const filterSections = [
    {
      name: 'status',
      component: 'GenericCheckboxGroup',
      props: {
        items: [
          { label: 'Active', value: 'active' },
          { label: 'Inactive', value: 'inactive' },
        ],
      },
    },
    {
      name: 'dateRange',
      component: 'GenericDateRangePicker',
      props: {},
    },
  ]

  beforeEach(() => {
    wrapper = mount(GenericFilterSidebar, {
      props: {
        isVisible: true,
        title: 'Test Filters',
        filterSections,
      },
    })
  })

  it('renders the component when visible', () => {
    expect(wrapper.find('.filter-sidebar').exists()).toBe(true)
    expect(wrapper.find('h2').text()).toBe('Test Filters')
  })

  it('does not render when not visible', async () => {
    await wrapper.setProps({ isVisible: false })
    expect(wrapper.find('.filter-sidebar').exists()).toBe(false)
  })

  it('renders the correct number of filter sections', () => {
    const sections = wrapper.findAll(
      '.mock-checkbox-group, .mock-date-range-picker'
    )
    expect(sections).toHaveLength(filterSections.length)
  })

  it('emits close event when close button is clicked', async () => {
    const closeButton = wrapper.findAll('button').at(0)
    await closeButton.trigger('click')
    expect(wrapper.emitted('close')).toBeTruthy()
  })

  it('emits reset event when reset button is clicked', async () => {
    const resetButton = wrapper
      .findAll('button')
      .find((button) => button.text().includes('Reset'))
    expect(resetButton).toBeTruthy()
    if (resetButton) {
      await resetButton.trigger('click')
      expect(wrapper.emitted('reset')).toBeTruthy()
    } else {
      throw new Error('Reset button not found')
    }
  })

  it('emits filter-change event when a filter value changes', async () => {
    const checkboxGroup = wrapper.findComponent(GenericCheckboxGroup)
    await checkboxGroup.vm.$emit('update:modelValue', { active: true })

    const emitted = wrapper.emitted('filter-change')
    expect(emitted).toBeTruthy()
    expect(emitted[0][0]).toEqual({ name: 'status', value: { active: true } })
  })

  it('resolves components correctly', () => {
    const checkboxGroup = wrapper.findComponent(GenericCheckboxGroup)
    const dateRangePicker = wrapper.findComponent(GenericDateRangePicker)

    expect(checkboxGroup.exists()).toBe(true)
    expect(dateRangePicker.exists()).toBe(true)
  })
})
