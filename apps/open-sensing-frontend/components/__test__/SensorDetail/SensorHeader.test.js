import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import SensorHeader from '../../SensorDetail/SensorHeader.vue'

const mockNuxtUI = {
  UButton: {
    template:
      '<button :icon="icon" :color="color" :variant="variant" :size="size"><slot></slot></button>',
    props: ['icon', 'color', 'variant', 'size'],
  },
  UIcon: {
    template: '<i :name="name"><slot></slot></i>',
    props: ['name'],
  },
  UBadge: {
    template: '<span :color="color"><slot></slot></span>',
    props: ['color'],
  },
}

const createWrapper = (props = {}) => {
  const pinia = createPinia()
  setActivePinia(pinia)

  return mount(SensorHeader, {
    props: {
      selectedSensor: {
        location: 'Test Location',
        status: 'Active',
        batteryLevel: 75,
      },
      ...props,
    },
    global: {
      plugins: [pinia],
      stubs: mockNuxtUI,
    },
  })
}

describe('SensorHeader', () => {
  it('renders sensor location correctly', () => {
    const wrapper = createWrapper()
    const location = wrapper.find('[data-testid="sensor-location"]')
    expect(location.text()).toBe('Test Location')
  })

  it('renders battery level correctly', () => {
    const wrapper = createWrapper()
    const batteryLevel = wrapper.find('[data-testid="battery-level"]')
    expect(batteryLevel.text()).toBe('75%')
  })

  it('renders sensor status with correct color', () => {
    const wrapper = createWrapper({ selectedSensor: { status: 'Active' } })
    const statusBadge = wrapper.find('[data-testid="sensor-status"]')
    expect(statusBadge.text()).toBe('Active')
    expect(statusBadge.attributes('color')).toBe('green')
  })

  it('emits "go-back" event when go back button is clicked', async () => {
    const wrapper = createWrapper()
    const goBackButton = wrapper.find('[data-testid="go-back-button"]')
    await goBackButton.trigger('click')
    expect(wrapper.emitted()).toHaveProperty('go-back')
  })

  it('emits "close" event when close button is clicked', async () => {
    const wrapper = createWrapper()
    const closeButton = wrapper.find('[data-testid="close-button"]')
    await closeButton.trigger('click')
    expect(wrapper.emitted()).toHaveProperty('close')
  })

  it('emits "select-previous" event when select previous button is clicked', async () => {
    const wrapper = createWrapper()
    const prevButton = wrapper.find('[data-testid="select-previous-button"]')
    await prevButton.trigger('click')
    expect(wrapper.emitted()).toHaveProperty('select-previous')
  })

  it('emits "select-next" event when select next button is clicked', async () => {
    const wrapper = createWrapper()
    const nextButton = wrapper.find('[data-testid="select-next-button"]')
    await nextButton.trigger('click')
    expect(wrapper.emitted()).toHaveProperty('select-next')
  })
})
