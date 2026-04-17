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
const mockSignUpWithEmail = vi.fn()
const mockAuthError = ref('')
const mockIsLoading = ref(false)
const mockClearError = vi.fn()

vi.mock('../../../../composables/useFirebaseAuth', () => ({
  useFirebaseAuth: () => ({
    signUpWithEmail: mockSignUpWithEmail,
    authError: mockAuthError,
    isLoading: mockIsLoading,
    clearError: mockClearError,
  }),
}))

// Import component after mocks are set up
import RegisterForm from '@components/UserManagement/RegisterForm.vue'

const defaultFields = [
  { name: 'email', label: 'Email', type: 'email' as const, placeholder: 'Enter email' },
  { name: 'password', label: 'Password', type: 'password' as const, placeholder: 'Enter password' },
  { name: 'username', label: 'Username', type: 'text' as const, placeholder: 'Enter username' },
]

describe('RegisterForm.vue', () => {
  let wrapper: VueWrapper<any>

  const baseMount = (props: any = {}) => {
    wrapper = mount(RegisterForm, {
      props: {
        title: 'Register',
        subtitle: 'Create your account',
        fields: defaultFields,
        schema: {},
        buttonText: 'Sign Up',
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
            props: ['label', 'name'],
          },
          UInput: {
            template: '<input :value="modelValue" :type="type || \'text\'" @input="$emit(\'update:modelValue\', $event.target.value)" />',
            props: ['modelValue', 'placeholder', 'color', 'variant', 'size', 'type'],
            emits: ['update:modelValue'],
          },
          USelect: {
            template: '<select :value="modelValue" @change="$emit(\'update:modelValue\', $event.target.value)"><option v-for="opt in options" :key="opt.value" :value="opt.value">{{ opt.label }}</option></select>',
            props: ['modelValue', 'options', 'placeholder', 'color', 'variant', 'size'],
            emits: ['update:modelValue'],
          },
          UButton: {
            name: 'UButton',
            template: '<button :type="type" :disabled="disabled || loading" @click="$emit(\'click\')"><slot /></button>',
            props: ['type', 'color', 'class', 'loading', 'disabled', 'ui'],
            emits: ['click'],
          },
        },
      },
    })
  }

  beforeEach(() => {
    mockSignUpWithEmail.mockClear()
    mockClearError.mockClear()
    mockAuthError.value = ''
    mockIsLoading.value = false
    baseMount()
  })

  it('renders correctly', () => {
    expect(wrapper.element).toMatchSnapshot()
  })

  it('renders with default title when title prop is omitted', () => {
    baseMount({ title: undefined })
    expect(wrapper.find('h2').text()).toBe('Register')
  })

  it('renders with custom title and subtitle', () => {
    expect(wrapper.find('h2').text()).toBe('Register')
    expect(wrapper.find('p').text()).toBe('Create your account')
  })

  it('renders form fields from props', () => {
    const labels = wrapper.findAll('label')
    expect(labels.some(l => l.text() === 'Email')).toBe(true)
    expect(labels.some(l => l.text() === 'Password')).toBe(true)
    expect(labels.some(l => l.text() === 'Username')).toBe(true)
  })

  it('renders USelect for select-type fields', () => {
    baseMount({
      fields: [
        { name: 'email', label: 'Email', type: 'email' },
        { name: 'password', label: 'Password', type: 'password' },
        { name: 'role', label: 'Role', type: 'select', options: [{ label: 'Admin', value: 'admin' }] },
      ],
    })
    expect(wrapper.find('select').exists()).toBe(true)
  })

  it('renders custom button text', () => {
    const submitButton = wrapper.findAll('button').find(btn => btn.text() === 'Sign Up')
    expect(submitButton).toBeTruthy()
  })

  it('renders default button text when buttonText prop is omitted', () => {
    baseMount({ buttonText: undefined })
    const submitButton = wrapper.findAll('button').find(btn => btn.text() === 'Register')
    expect(submitButton).toBeTruthy()
  })

  it('displays auth error when present', async () => {
    mockAuthError.value = 'Email already in use'
    await nextTick()
    expect(wrapper.find('.text-red-500').text()).toBe('Email already in use')
  })

  it('does not show error element when there is no auth error', () => {
    expect(wrapper.find('.text-red-500').exists()).toBe(false)
  })

  it('shows loading state on submit button', async () => {
    mockIsLoading.value = true
    await nextTick()
    const submitButton = wrapper.findComponent({ name: 'UButton' })
    expect(submitButton.props('loading')).toBe(true)
    expect(submitButton.props('disabled')).toBe(true)
  })

  it('emits switchToLogin and calls clearError when login link is clicked', async () => {
    const loginButton = wrapper.findAll('button').find(btn => btn.text().includes('Login'))
    expect(loginButton).toBeTruthy()
    await loginButton!.trigger('click')
    expect(wrapper.emitted('switchToLogin')).toBeTruthy()
    expect(mockClearError).toHaveBeenCalled()
  })

  it('calls signUpWithEmail and emits success on successful registration', async () => {
    const mockUser = { uid: '456', email: 'new@example.com' }
    mockSignUpWithEmail.mockResolvedValue(mockUser)

    await wrapper.find('input[type="email"]').setValue('new@example.com')
    await wrapper.find('input[type="password"]').setValue('password123')

    await wrapper.find('form').trigger('submit')

    expect(mockSignUpWithEmail).toHaveBeenCalledWith('new@example.com', 'password123')
    expect(mockClearError).toHaveBeenCalled()
    expect(wrapper.emitted('success')).toBeTruthy()
    expect(wrapper.emitted('success')![0][0]).toEqual(mockUser)
  })

  it('includes uid in emitted form data on success', async () => {
    const mockUser = { uid: '456', email: 'new@example.com' }
    mockSignUpWithEmail.mockResolvedValue(mockUser)

    await wrapper.find('input[type="email"]').setValue('new@example.com')
    await wrapper.find('input[type="password"]').setValue('password123')

    await wrapper.find('form').trigger('submit')

    const emittedFormData = wrapper.emitted('success')![0][1] as Record<string, any>
    expect(emittedFormData.uid).toBe('456')
    expect(emittedFormData.email).toBe('new@example.com')
  })

  it('does not emit success when signUpWithEmail returns null', async () => {
    mockSignUpWithEmail.mockResolvedValue(null)

    await wrapper.find('input[type="email"]').setValue('new@example.com')
    await wrapper.find('input[type="password"]').setValue('password123')

    await wrapper.find('form').trigger('submit')

    expect(mockSignUpWithEmail).toHaveBeenCalled()
    expect(wrapper.emitted('success')).toBeFalsy()
  })

  it('does not call signUpWithEmail when email is missing', async () => {
    await wrapper.find('input[type="password"]').setValue('password123')
    await wrapper.find('form').trigger('submit')
    expect(mockSignUpWithEmail).not.toHaveBeenCalled()
  })

  it('does not call signUpWithEmail when password is missing', async () => {
    await wrapper.find('input[type="email"]').setValue('new@example.com')
    await wrapper.find('form').trigger('submit')
    expect(mockSignUpWithEmail).not.toHaveBeenCalled()
  })
})
