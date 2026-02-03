import { beforeEach, describe, expect, it, vi } from 'vitest'
import { config, mount, VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import SideBar from '@components/SideBar.vue'

// Mock vue-router
vi.mock('vue-router', () => ({
  useRouter: vi.fn(() => ({ name: 'sidebar' }))
}))

// Mock child components with simple implementations
const UCard = {
    name: "UCard",
    template: '<div class="u-card"><slot></slot></div>'
}
const SubWindow = {
  name: 'SubWindow',
  template: '<div class="sub-window"><slot></slot></div>'
}

const ThankYouModal = {
  name: 'ThankYouModal',
  template: '<div class="thank-you-modal"></div>'
}
const UAccordion = {
    name: "UAccordion",
    template: '<div class="u-accordion"><slot/></div>'
}

// Mock stores with initial states
const mockSidebarStore = {
  spaceSubwindow: 1,
  belongingSubwindow: 1,
  safetySubwindow: 1,
  environmentSubwindow: 1,
  nextSpaceSubwindow: vi.fn(),
  prevSpaceSubwindow: vi.fn(),
  nextBelongingSubwindow: vi.fn(),
  prevBelongingSubwindow: vi.fn(),
  nextSafetySubwindow: vi.fn(),
  prevSafetySubwindow: vi.fn(),
  nextEnvironmentSubwindow: vi.fn(),
  prevEnvironmentSubwindow: vi.fn()
}

const mockDrawingStore = {
  activateDrawing: vi.fn(),
  activatePolygonDrawing: vi.fn(),
  activateLineStringDrawing: vi.fn(),
  activateBelongingDrawing: vi.fn(),
  activateSafetyDrawing: vi.fn(),
  activateEnvironmentDrawing: vi.fn(),
  activateProhibitDrawing: vi.fn()
}

const mockDbStore = {
  saveDataToDatabase: vi.fn()
}

// Mock store modules
vi.mock('@base/stores/sidebar', () => ({
  useSideBarStore: () => mockSidebarStore
}))

vi.mock('@base/stores/drawing', () => ({
  useDrawingStore: () => mockDrawingStore
}))

vi.mock('../stores/db', () => ({
  useDb: () => mockDbStore
}))

// Configure Vue Test Utils
config.global.stubs = {
  SubWindow,
  ThankYouModal,
  UAccordion,
  UCard,
  UButton: true,
  UModal: true
}

describe('SidebarComponent', () => {
  let wrapper: VueWrapper<any>
  let pinia  = null

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks()
    
    pinia = createPinia()
    // Initialize Pinia
    setActivePinia(pinia)

    // Mount component
    wrapper = mount(SideBar, {
      props: {
        modelValue: false
      },
      global: {
        stubs: config.global.stubs,
        plugins: [pinia]
      }
    })
  })

  it('renders correctly', () => {
    expect(wrapper.element).toMatchSnapshot()
  })

  it('renders correctly with initial props', () => {
      expect(wrapper.findComponent({ name: 'UCard' }).exists()).toBe(true)
      expect(wrapper.findComponent(ThankYouModal).exists()).toBe(true)
      expect(wrapper.findComponent(UAccordion).exists()).toBe(true)
  })

  it('initializes with correct menu items', () => {
    const menuItems = wrapper.vm.menuItems
    expect(menuItems).toHaveLength(4)
    expect(menuItems.map(item => item.label)).toEqual([
      'Середовище',
      'Приналежність', 
      'Безпека',
      'Екологія'
    ])
  })

  it('computes correct progress percentages', () => {
    expect(wrapper.vm.spaceProgressPercentage).toBe(25)
    expect(wrapper.vm.belongingProgressPercentage).toBe(100)
    expect(wrapper.vm.safetyProgressPercentage).toBe(100)
    expect(wrapper.vm.environmentProgressPercentage).toBe(50)
  })

  it('handles space content changes correctly', async () => {
    mockSidebarStore.spaceSubwindow = 2
    
    expect(wrapper.vm.spaceContent.title).toBe('Позначте місця для дозвілля навколо р. Тяжилівка')
    expect(wrapper.vm.spaceContent.button).toBeTruthy()
  })

  it('handles space content changes correctly', async () => {
    mockSidebarStore.spaceSubwindow = 1
    
    expect(wrapper.vm.spaceContent.title).toBe('Позначте місця, які ви відвідували навколо р. Тяжилівка')
    expect(wrapper.vm.spaceContent.buttonGroup).toHaveLength(5)
    
  })

  it('activates drawing modes frequency correctly', async () => {
    // Test frequency drawing
    await wrapper.vm.spaceContent.buttonGroup[0].action()
    expect(mockDrawingStore.activateDrawing).toHaveBeenCalledWith('every day')

    await wrapper.vm.spaceContent.buttonGroup[1].action()
    expect(mockDrawingStore.activateDrawing).toHaveBeenCalledWith('every week')

    await wrapper.vm.spaceContent.buttonGroup[2].action()
    expect(mockDrawingStore.activateDrawing).toHaveBeenCalledWith('sometimes')

    await wrapper.vm.spaceContent.buttonGroup[3].action()
    expect(mockDrawingStore.activateDrawing).toHaveBeenCalledWith('only once')

    await wrapper.vm.spaceContent.buttonGroup[4].action()
    expect(mockDrawingStore.activateDrawing).toHaveBeenCalledWith('never')
  })

  it('activates drawing modes correctly', async () => {
    mockSidebarStore.spaceSubwindow = 2
    await wrapper.vm.spaceContent.button.action()
    expect(mockDrawingStore.activatePolygonDrawing).toHaveBeenCalled()
  })

  it('activates drawing modes correctly', async () => {
    mockSidebarStore.spaceSubwindow = 3
    await wrapper.vm.spaceContent.button.action()
    expect(mockDrawingStore.activateLineStringDrawing).toHaveBeenCalled()
  })

  it('handles belonging icon selection', async () => {
    await wrapper.vm.selectBelongingIcon('heart')
    expect(mockDrawingStore.activateBelongingDrawing).toHaveBeenCalledWith('heart')
  })

  it('handles safety icon selection', async () => {
    await wrapper.vm.selectSafetyIcon('lock')
    expect(mockDrawingStore.activateSafetyDrawing).toHaveBeenCalledWith('lock')
  })

  it('handles environment icon selection', async () => {
    await wrapper.vm.selectEnvironmentIcon('leaf')
    expect(mockDrawingStore.activateEnvironmentDrawing).toHaveBeenCalledWith('leaf')
  })


  it('handles save errors correctly', async () => {
    mockDbStore.saveDataToDatabase.mockRejectedValue(new Error('Save failed'))
    
    await wrapper.vm.saveData()
    
    expect(wrapper.vm.showThankYouModal).toBe(false)
    expect(wrapper.vm.isSaving).toBe(false)
    expect(wrapper.vm.notificationColor).toBe('red')
    expect(wrapper.vm.notificationText).toBe('Не вдалося подати дані')
  })

  it('navigates subwindows correctly', async () => {
    await wrapper.vm.nextBelongingSubwindow()
    expect(mockSidebarStore.nextBelongingSubwindow).toHaveBeenCalled()

    await wrapper.vm.prevBelongingSubwindow()
    expect(mockSidebarStore.prevBelongingSubwindow).toHaveBeenCalled()

    await wrapper.vm.nextSafetySubwindow()
    expect(mockSidebarStore.nextSafetySubwindow).toHaveBeenCalled()

    await wrapper.vm.prevSafetySubwindow()
    expect(mockSidebarStore.prevSafetySubwindow).toHaveBeenCalled()
  })

  it('handles null subwindow content gracefully', async () => {
    mockSidebarStore.spaceSubwindow = 999
    await wrapper.vm.$nextTick()
    
    expect(wrapper.vm.spaceContent).toEqual({ title: '', description: '' })
  })

  it('computes correct icon grids', () => {
    // Test belonging icons
    expect(wrapper.vm.belongingIconGrid.icons).toHaveLength(3)
    expect(wrapper.vm.belongingIconGrid.icons[0].name).toBe('dislike')

    // Test pollution icons
    expect(wrapper.vm.pollutionIconGrid.icons).toHaveLength(2)
    expect(wrapper.vm.pollutionIconGrid.icons[0].name).toBe('trash')

    // Test leaf icons
    expect(wrapper.vm.leafIconGrid.icons).toHaveLength(1)
    expect(wrapper.vm.leafIconGrid.icons[0].name).toBe('leaf')
  })
})