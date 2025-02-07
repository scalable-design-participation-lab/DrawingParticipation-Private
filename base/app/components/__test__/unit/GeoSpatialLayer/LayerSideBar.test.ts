import type { VueWrapper } from '@vue/test-utils'
import { config, mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { format } from 'date-fns'
import LayerSidebar from '@components/GeoSpatialLayer/LayerSidebar.vue'

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
  // Freeze time before any tests run
  beforeAll(() => {
  // Use fake timers and set the current date to a fixed point
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2025-01-22T00:00:00Z'))
  })

  beforeEach(() => {
    vi.clearAllMocks()
    wrapper = mount(LayerSidebar, {
      props: {
        categories: dummyCategories,
        filters: dummyFilters,
        layerSettings: dummyLayerSettings,
        ranges: dummyRanges,
      },
      global: {
        components: {

        },
      },
    })
  })
  // Restore real timers after all tests
  afterAll(() => {
    vi.useRealTimers()
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

  it('emits "updateSelection" when layerSettings change', async () => {
    const expectedEmits = Object.keys(dummyLayerSettings).length
    expect(wrapper.emitted('updateSelection')?.length).toBeGreaterThanOrEqual(expectedEmits)

    const newOpacity = 0.5
    dummyLayerSettings['sectionA.button1'].opacity = newOpacity

    await wrapper.setProps({ layerSettings: { ...dummyLayerSettings } })

    const updateSelectionEvents = wrapper.emitted('updateSelection')
    expect(updateSelectionEvents).toBeDefined()
    const found = updateSelectionEvents!.some(
      args =>
        args[0] === 'sectionA.button1'
        && args[1]
        && Number((args[1] as { opacity: number }).opacity) === newOpacity,
    )
    expect(found).toBe(true)
  })

  it('toggles a layer when its button is clicked', async () => {
    const layerButtons = wrapper.findAll('button')
    const button1 = layerButtons.find(btn => btn.text().includes('button1'))
    expect(button1).toBeTruthy()
    if (button1) {
      await button1.trigger('click')
    }

    expect(wrapper.emitted('updateSelection')).toBeTruthy()
  })

  it('emits "updateFilter" when a filter is toggled', async () => {
    const toggle = wrapper.findComponent(UToggle)
    expect(toggle.exists()).toBe(true)

    await toggle.trigger('click')

    const filterEmits = wrapper.emitted('updateFilter')
    expect(filterEmits).toBeTruthy()
    expect(filterEmits![0]).toEqual(['Comments'])
  })

  it('emits "updateFilterTime" when the time range changes', async () => {
    const popover = wrapper.findComponent(UPopover)
    await popover.trigger('click')

    await wrapper.vm.$nextTick()

    const datePicker = wrapper.findComponent(DatePicker)
    expect(datePicker.exists()).toBe(true)

    await datePicker.trigger('click')

    await wrapper.vm.$nextTick()

    const timeRangeEmits = wrapper.emitted('updateFilterTime')
    expect(timeRangeEmits).toBeTruthy()

    const payload = timeRangeEmits![0][0] as { start: string | Date, end: string | Date }
    expect(payload).toHaveProperty('start')
    expect(payload).toHaveProperty('end')

    const formattedStart = format(new Date(payload.start), 'd MMM, yyyy')
    const formattedEnd = format(new Date(payload.end), 'd MMM, yyyy')
    expect(formattedStart).toBeDefined()
    expect(formattedEnd).toBeDefined()
  })

  it('updates the gradient color when a color picker emits a change', async () => {
    // Find the button for "button1" and click it to toggle (activate) the layer
    const layerButtons = wrapper.findAll('button')
    const button1 = layerButtons.find(btn => btn.text().includes('button1'))
    expect(button1).toBeTruthy()
    if (button1) {
      await button1.trigger('click')
      await wrapper.vm.$nextTick()
    }
    const popover = wrapper.findComponent(UPopover)
    await popover.trigger('click')
    await wrapper.vm.$nextTick()

    const colorPicker = wrapper.findComponent(colorPickerBlock)
    expect(colorPicker.exists()).toBe(true)

    await colorPicker.trigger('click')
    const updateSelectionEvents = wrapper.emitted('updateSelection')
    expect(updateSelectionEvents).toBeTruthy()

    const updatedEvent = updateSelectionEvents!.find(
      args => args[0] === 'sectionA.button1' && (args[1] as { gradient: string[] }).gradient[0] === '#abcdef',
    )
    expect(updatedEvent).toBeTruthy()
  })
})
