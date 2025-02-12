import type { VueWrapper } from '@vue/test-utils'
import { config, mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import LayerSidebar from '@components/GeoSpatialLayer/HeatMap/HeatMapController.vue'

// Dummy data for props
const dummyCategories = {
  sectionA: ['button1', 'button2'],
  sectionB: ['button3'],
}

const dummyFilters = {
  Comments: false,
}

const dummyLayerSettings = {
  // Use the helper key format "section.button"
  'sectionA.button1': {
    gradient: ['#000000', '#111111', '#222222', '#333333', '#ffffff'],
    weight: 0.5,
    blur: 10,
    radius: 20,
    opacity: 0.8,
    visible: true,
    zIndex: 1,
  },
  'sectionA.button2': {
    gradient: ['#aaaaaa', '#bbbbbb', '#cccccc', '#dddddd', '#eeeeee'],
    weight: 0.6,
    blur: 15,
    radius: 25,
    opacity: 0.7,
    visible: true,
    zIndex: 1,
  },
  'sectionB.button3': {
    gradient: ['#123456', '#234567', '#345678', '#456789', '#fedcba'],
    weight: 0.4,
    blur: 5,
    radius: 10,
    opacity: 0.9,
    visible: true,
    zIndex: 1,
  },
}

const dummyRanges = [
  { label: 'Last 7 Days', duration: { days: 7 } },
  { label: 'Last 14 Days', duration: { days: 14 } },
]

// Mock NuxtUI components
const UCard = {
  name: 'UCard',
  template: '<div><slot></slot></div>',
}
// Mock NuxtUI components
const UButton = {
  name: 'UButton',
  template: '<button :class="$attrs.class"><slot></slot></button>',
}
const UPopover = {
  name: 'UPopover',
  template: `<div>
    <slot></slot>
    <slot name="panel"></slot>
  </div>`,
}
const UInput = {
  name: 'UInput',
  template: `<input :value="modelValue" @input="$emit('update:modelValue', $event.target.value)" />`,
  props: ['modelValue'],
}
const DatePicker = {
  name: 'DatePicker',
  template: `<div class="date-picker-stub" @click="onClick">DatePicker</div>`,
  emits: ['update:modelValue', 'close'],
  methods: {
    onClick(this: any) {
      // Simulate a new time range
      const newRange = { start: new Date('2023-01-01'), end: new Date('2023-01-15') }
      this.$emit('update:modelValue', newRange)
      this.$emit('close')
    },
  },
}
const UToggle = {
  name: 'UToggle',
  template: `<button @click="$emit('click')">{{ modelValue }}</button>`,
  props: ['modelValue', 'onIcon', 'offIcon'],
}
const draggable = {
  name: 'draggable',
  template: `<div><slot/></div>`,
}
const UIcon = {
  name: 'UIcon',
  template: `<div><slot/></div>`,
}
const colorPickerBlock = {
  name: 'colorPickerBlock',
  template: `<div class="color-picker-stub" @click="$emit('change', { hex: '#abcdef' })">
    {{ modelValue }}
  </div>`,
  props: ['modelValue'],
}
config.global.stubs = {
  UCard,
  UButton,
  UPopover,
  UInput,
  DatePicker,
  UToggle,
  draggable,
  UIcon,
  'color-picker-block': colorPickerBlock,
}

describe('layerSidebar.vue', () => {
  let wrapper: VueWrapper<any>
  beforeEach(() => {
    vi.clearAllMocks()
    wrapper = mount(LayerSidebar, {
      props: {
        categories: dummyCategories,
        filters: dummyFilters,
        layerSettings: dummyLayerSettings,
        ranges: dummyRanges,
        filterTime: { start: new Date(), end: new Date() },
      },
      global: {
        components: {

        },
      },
    })
  })
  it('renders correctly', () => {
    expect(wrapper.element).toMatchSnapshot()
  })

  it('renders the layers header and category sections', () => {
    expect(wrapper.html()).toContain('Layers')

    Object.keys(dummyCategories).forEach((section) => {
      expect(wrapper.html()).toContain(section)
    })

    Object.values(dummyCategories).flat().forEach((button) => {
      expect(wrapper.html()).toContain(button)
    })
  })
})
