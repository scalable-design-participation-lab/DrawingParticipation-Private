import { type VueWrapper, mount } from '@vue/test-utils'
import { nextTick, ref } from 'vue'

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

// Mock the composable
const mockSignInWithEmail = vi.fn()
const mockAuthError = ref('')
const mockIsLoading = ref(false)
const mockClearError = vi.fn()

vi.mock('../../../../composables/useFirebaseAuth', () => ({
  useFirebaseAuth: () => ({
    signInWithEmail: mockSignInWithEmail,
    authError: mockAuthError,
    isLoading: mockIsLoading,
    clearError: mockClearError,
  }),
}))

// Import component after mocks are set up
import LoginForm from '@components/UserManagement/LoginForm.vue'

describe('LoginForm.vue', () => {
  let wrapper: VueWrapper<any>

  const baseMount = (props: any = {}) => {
    wrapper = mount(LoginForm, {
      props: {
        title: 'Login',
        subtitle: 'Enter your credentials',
        showForgotPassword: true,
        ...props,
      },
      global: {
        stubs: {
          UForm: {
            name: 'UForm',
            template: '<form @submit.prevent="$emit(\'submit\', $event)"><slot /></form>',
            emits: ['submit'],
          },
          UFormGroup: { 
            template: '<div><label v-if="label">{{ label }}</label><slot /></div>',
            props: ['label', 'name']
          },
          UInput: {
            template: '<input :value="modelValue" :type="type || \'text\'" @input="$emit(\'update:modelValue\', $event.target.value)" />',
            props: ['modelValue', 'placeholder', 'color', 'variant', 'size', 'type'],
            emits: ['update:modelValue']
          },
          UButton: {
            name: 'UButton',
            template: '<button :type="type" :disabled="disabled || loading" @click="$emit(\'click\')"><slot /></button>',
            props: ['type', 'color', 'class', 'loading', 'disabled'],
            emits: ['click'],
          },
        },
      },
    })
  }

  beforeEach(() => {
    // Reset mocks before each test
    mockSignInWithEmail.mockClear()
    mockClearError.mockClear()
    mockAuthError.value = ''
    mockIsLoading.value = false
    baseMount()
  })

  it('renders correctly', () => {
    expect(wrapper.element).toMatchSnapshot()
  })

  it('renders with default props', () => {
    expect(wrapper.find('h2').text()).toBe('Login')
    expect(wrapper.find('p').text()).toBe('Enter your credentials')
  })

  it('renders with custom props', () => {
    baseMount({
      title: 'Sign In',
      subtitle: 'Welcome back',
      showForgotPassword: false,
    })
    
    expect(wrapper.find('h2').text()).toBe('Sign In')
    expect(wrapper.find('p').text()).toBe('Welcome back')
    // Check that forgot password button doesn't exist
    const forgotPasswordButtons = wrapper.findAll('button').filter(btn => 
      btn.text().includes('Forgot password')
    )
    expect(forgotPasswordButtons).toHaveLength(0)
  })

  it('shows forgot password link when showForgotPassword is true', () => {
    const forgotPasswordButtons = wrapper.findAll('button').filter(btn => 
      btn.text().includes('Forgot password')
    )
    expect(forgotPasswordButtons).toHaveLength(1)
  })

  it('hides forgot password link when showForgotPassword is false', () => {
    baseMount({ showForgotPassword: false })
    const forgotPasswordButtons = wrapper.findAll('button').filter(btn => 
      btn.text().includes('Forgot password')
    )
    expect(forgotPasswordButtons).toHaveLength(0)
  })

  it('displays auth error when present', async () => {
    mockAuthError.value = 'Invalid credentials'
    await nextTick()
    
    expect(wrapper.find('.text-red-500').text()).toBe('Invalid credentials')
  })

  it('shows loading state on submit button', async () => {
    mockIsLoading.value = true
    await nextTick()
    
    const submitButton = wrapper.findComponent({ name: 'UButton' })
    expect(submitButton.props('loading')).toBe(true)
    expect(submitButton.props('disabled')).toBe(true)
  })

  it('emits switchToRegister when register link is clicked', async () => {
    const registerButton = wrapper.findAll('button').find(btn => 
      btn.text().includes('Register')
    )
    expect(registerButton).toBeTruthy()
    await registerButton!.trigger('click')
    
    expect(wrapper.emitted('switchToRegister')).toBeTruthy()
    expect(mockClearError).toHaveBeenCalled()
  })

  it('emits forgotPassword when forgot password link is clicked', async () => {
    const forgotPasswordButton = wrapper.findAll('button').find(btn => 
      btn.text().includes('Forgot password')
    )
    expect(forgotPasswordButton).toBeTruthy()
    await forgotPasswordButton!.trigger('click')
    
    expect(wrapper.emitted('forgotPassword')).toBeTruthy()
    expect(mockClearError).toHaveBeenCalled()
  })

  it('calls signInWithEmail and emits success on successful login', async () => {
    const mockUser = { uid: '123', email: 'test@example.com' }
    mockSignInWithEmail.mockResolvedValue(mockUser)
    
    // Fill form
    const emailInput = wrapper.find('input[type="email"]')
    const passwordInput = wrapper.find('input[type="password"]')
    
    await emailInput.setValue('test@example.com')
    await passwordInput.setValue('password123')
    
    // Submit form
    await wrapper.find('form').trigger('submit')

    expect(mockSignInWithEmail).toHaveBeenCalledWith('test@example.com', 'password123')
    expect(mockClearError).toHaveBeenCalled()
    expect(wrapper.emitted('success')).toBeTruthy()
    expect(wrapper.emitted('success')[0]).toEqual([mockUser])
  })

  it('does not emit success on failed login', async () => {
    mockSignInWithEmail.mockResolvedValue(null)
    
    // Fill form
    const emailInput = wrapper.find('input[type="email"]')
    const passwordInput = wrapper.find('input[type="password"]')
    
    await emailInput.setValue('test@example.com')
    await passwordInput.setValue('wrongpassword')
    
    // Submit form
    await wrapper.find('form').trigger('submit')

    expect(mockSignInWithEmail).toHaveBeenCalledWith('test@example.com', 'wrongpassword')
    expect(wrapper.emitted('success')).toBeFalsy()
  })
})
