import { type VueWrapper, mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { createTestingPinia } from '@pinia/testing'

// Mock Firebase modules first
vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({})),
  signInAnonymously: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
  linkWithCredential: vi.fn(),
  EmailAuthProvider: { credential: vi.fn() },
  browserLocalPersistence: {},
  setPersistence: vi.fn(),
  onAuthStateChanged: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
}))

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  addDoc: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  getDocs: vi.fn(),
}))

vi.mock('vuefire', () => ({
  useFirestore: vi.fn(() => ({})),
}))

// Mock the composable (covers AuthModal and all child components)
vi.mock('../../../../composables/useFirebaseAuth', () => ({
  useFirebaseAuth: () => ({
    checkPersistentAuth: vi.fn().mockResolvedValue({ user: null, userData: null }),
    getUserData: vi.fn().mockResolvedValue(null),
    signInWithEmail: vi.fn().mockResolvedValue(null),
    signUpWithEmail: vi.fn().mockResolvedValue(null),
    resetPassword: vi.fn().mockResolvedValue(false),
    authError: { value: '' },
    isLoading: { value: false },
    clearError: vi.fn(),
  }),
}))

// Import components after mocks are set up
import AuthModal from '@components/UserManagement/AuthModal.vue'
import LoginForm from '@components/UserManagement/LoginForm.vue'
import RegisterForm from '@components/UserManagement/RegisterForm.vue'
import PasswordReset from '@components/UserManagement/PasswordReset.vue'

describe('AuthModal.vue', () => {
  let wrapper: VueWrapper<any>

  const baseMount = async (props: any = {}) => {
    wrapper = mount(AuthModal, {
      props: {
        isVisible: false, // Start with false to avoid async issues
        registrationFields: [
          { name: 'email', label: 'Email', type: 'email' },
          { name: 'password', label: 'Password', type: 'password' },
        ],
        registrationSchema: {},
        ...props,
      },
      global: {
        plugins: [createTestingPinia()],
        stubs: {
          UCard: { template: '<div><slot /></div>' },
          WelcomeBackModal: { template: '<div data-test="welcome-back" />' },
        },
      },
    })
    
    // Wait for initial render
    await nextTick()
  }

  beforeEach(async () => {
    await baseMount()
  })

  it('renders correctly', async () => {
    await baseMount()
    expect(wrapper.element).toMatchSnapshot()
  })

  it('shows login view by default when visible', async () => {
    await baseMount()
    
    // Set visible to true and wait for async operations
    await wrapper.setProps({ isVisible: true })
    await nextTick()
    await new Promise(resolve => setTimeout(resolve, 10)) // delay for async
    await nextTick()
    
    expect(wrapper.findComponent(LoginForm).exists()).toBe(true)
    expect(wrapper.findComponent(RegisterForm).exists()).toBe(false)
    expect(wrapper.findComponent(PasswordReset).exists()).toBe(false)
  })

  it('switches to register view when requested', async () => {
    await baseMount()
    await wrapper.setProps({ isVisible: true })
    await nextTick()
    await new Promise(resolve => setTimeout(resolve, 10))
    await nextTick()
    
    await wrapper.findComponent(LoginForm).vm.$emit('switch-to-register')
    await nextTick()
    expect(wrapper.findComponent(RegisterForm).exists()).toBe(true)
    expect(wrapper.findComponent(LoginForm).exists()).toBe(false)
  })

  it('switches to forgot password view when requested', async () => {
    await baseMount()
    await wrapper.setProps({ isVisible: true })
    await nextTick()
    await new Promise(resolve => setTimeout(resolve, 10))
    await nextTick()
    
    await wrapper.findComponent(LoginForm).vm.$emit('forgot-password')
    await nextTick()
    expect(wrapper.findComponent(PasswordReset).exists()).toBe(true)
  })

  it('goes back to login after password reset success', async () => {
    await baseMount()
    await wrapper.setProps({ isVisible: true })
    await nextTick()
    await new Promise(resolve => setTimeout(resolve, 10))
    await nextTick()
    
    await wrapper.findComponent(LoginForm).vm.$emit('forgot-password')
    await nextTick()
    await wrapper.findComponent(PasswordReset).vm.$emit('success')
    await nextTick()
    expect(wrapper.findComponent(LoginForm).exists()).toBe(true)
  })
})
