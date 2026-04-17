import { type VueWrapper, mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { createTestingPinia } from '@pinia/testing'

// Mock Firebase modules first
vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({})),
}))

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  getDocs: vi.fn(),
  doc: vi.fn(),
  getDoc: vi.fn(),
}))

vi.mock('vuefire', () => ({
  useFirestore: vi.fn(() => ({})),
}))

// Import component after mocks are set up
import WelcomeBackModal from '@components/UserManagement/WelcomeBackModal.vue'

describe('WelcomeBackModal.vue', () => {
  let wrapper: VueWrapper<any>

  const baseMount = (userData: any = null) => {
    wrapper = mount(WelcomeBackModal, {
      global: {
        plugins: [
          createTestingPinia({
            initialState: {
              user: { userData },
            },
          }),
        ],
        stubs: {
          UModal: {
            template: '<div v-if="modelValue"><slot /></div>',
            props: ['modelValue'],
            emits: ['update:modelValue'],
          },
          UCard: {
            template: '<div><slot name="header" /><slot /><slot name="footer" /></div>',
          },
          UButton: {
            template: '<button @click="$emit(\'click\')"><slot /></button>',
            emits: ['click'],
          },
        },
      },
    })
  }

  it('renders correctly', () => {
    baseMount()
    expect(wrapper.element).toMatchSnapshot()
  })

  it('shows welcome heading and greeting text', () => {
    baseMount()
    expect(wrapper.text()).toContain('Welcome Back')
    expect(wrapper.text()).toContain('Great to see you again!')
  })

  it('shows user full name when first and last name are available', async () => {
    baseMount({ name: { firstname: 'Jane', lastname: 'Smith' }, email: 'jane@example.com' })
    await nextTick()
    expect(wrapper.text()).toContain('Jane')
    expect(wrapper.text()).toContain('Smith')
  })

  it('falls back to email when name is not available', async () => {
    baseMount({ email: 'jane@example.com' })
    await nextTick()
    expect(wrapper.text()).toContain('jane@example.com')
  })

  it('does not show email when full name is present', async () => {
    baseMount({ name: { firstname: 'Jane', lastname: 'Smith' }, email: 'jane@example.com' })
    await nextTick()
    expect(wrapper.text()).not.toContain('jane@example.com')
  })

  it('shows no user-specific text when userData is null', async () => {
    baseMount(null)
    await nextTick()
    expect(wrapper.text()).not.toContain('@')
  })

  it('emits close when continue button is clicked', async () => {
    baseMount()
    await wrapper.find('button').trigger('click')
    expect(wrapper.emitted('close')).toBeTruthy()
  })

  it('renders the continue button', () => {
    baseMount()
    const continueButton = wrapper.findAll('button').find(btn => btn.text() === 'Continue')
    expect(continueButton).toBeTruthy()
  })
})
