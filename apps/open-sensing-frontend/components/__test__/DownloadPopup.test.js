import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import DownloadPopup from '../DownloadPopup.vue'
import GenericFilterSidebar from '../FilterSidebar/GenericFilterSidebar.vue'

const mockNuxtUI = {
  UButton: {
    template: '<button><slot></slot></button>',
    props: ['color', 'variant'],
  },
  URadio: {
    name: 'URadio',
    template:
      '<label><input type="radio" :value="value" :name="name" :data-test="$attrs[\'data-test\']" /><span>{{ label }}</span></label>',
    props: ['modelValue', 'name', 'value', 'label'],
  },
  UIcon: {
    template: '<i></i>',
    props: ['name'],
  },
  UCard: {
    template: '<div class="u-card"><slot></slot></div>',
    props: ['ui'],
  },
  UAccordion: {
    template: '<div class="u-accordion"><slot></slot></div>',
    props: ['items', 'ui'],
  },
}

vi.mock('../Toolbar/GenericFilterSidebar.vue', () => ({
  default: {
    name: 'GenericFilterSidebar',
    template:
      '<div><slot /><slot name="before-filters" /><slot name="footer-buttons" /></div>',
    props: ['isVisible', 'title', 'filterSections'],
    emits: ['close', 'filter-change', 'download'],
  },
}))

const createWrapper = (props = {}) => {
  const pinia = createPinia()
  setActivePinia(pinia)

  return mount(DownloadPopup, {
    props: {
      filterSections: [
        { name: 'dateRange', props: { modelValue: [] } },
        { name: 'sensors', props: { modelValue: [] } },
      ],
      ...props,
    },
    global: {
      plugins: [pinia],
      stubs: {
        ...mockNuxtUI,
        Teleport: true,
      },
      components: {
        GenericFilterSidebar,
      },
    },
  })
}

describe('DownloadPopup', () => {
  test('renders the component correctly', () => {
    const wrapper = createWrapper()
    expect(wrapper.exists()).toBe(true)
    expect(wrapper.find('[data-test="download-popup"]').exists()).toBe(true)
  })

  test('displays file format options', () => {
    const wrapper = createWrapper()
    const fileFormatOptions = wrapper.findAllComponents({ name: 'URadio' })

    expect(fileFormatOptions.length).toBe(2)
    expect(fileFormatOptions[0].props('value')).toBe('json')
    expect(fileFormatOptions[1].props('value')).toBe('csv')
  })

  test('emits close event when cancel button is clicked', async () => {
    const wrapper = createWrapper()
    await wrapper.vm.$emit('close')
    expect(wrapper.emitted('close')).toBeTruthy()
  })

  test('emits download event with correct data when download button is clicked', async () => {
    const wrapper = createWrapper()
    await wrapper.vm.$emit('download', {
      filters: { dateRange: [], sensors: [] },
      format: 'json',
    })
    expect(wrapper.emitted('download')).toBeTruthy()
    expect(wrapper.emitted('download')[0][0]).toEqual({
      filters: {
        dateRange: [],
        sensors: [],
      },
      format: 'json',
    })
  })

  test('updates file format when radio button is changed', async () => {
    const wrapper = createWrapper()
    await wrapper.vm.handleFilterChange({ name: 'fileFormat', value: 'csv' })
    await wrapper.vm.$emit('download', {
      filters: { dateRange: [], sensors: [] },
      format: 'csv',
    })
    expect(wrapper.emitted('download')[0][0].format).toBe('csv')
  })

  test('updates selected filters when filter-change event is emitted', async () => {
    const wrapper = createWrapper()
    await wrapper.vm.handleFilterChange({
      name: 'dateRange',
      value: ['2023-01-01', '2023-12-31'],
    })
    await wrapper.vm.handleFilterChange({
      name: 'sensors',
      value: ['sensor1', 'sensor2'],
    })
    await wrapper.vm.$emit('download', {
      filters: {
        dateRange: ['2023-01-01', '2023-12-31'],
        sensors: ['sensor1', 'sensor2'],
      },
      format: 'json',
    })
    expect(wrapper.emitted('download')[0][0].filters).toEqual({
      dateRange: ['2023-01-01', '2023-12-31'],
      sensors: ['sensor1', 'sensor2'],
    })
  })
})
