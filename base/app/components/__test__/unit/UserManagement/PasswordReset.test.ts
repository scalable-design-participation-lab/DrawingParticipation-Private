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
const mockResetPassword = vi.fn()
const mockAuthError = ref('')
const mockIsLoading = ref(false)
const mockClearError = vi.fn()

vi.mock('../../../../composables/useFirebaseAuth', () => ({
  useFirebaseAuth: () => ({
    resetPassword: mockResetPassword,
    authError: mockAuthError,
    isLoading: mockIsLoading,
    clearError: mockClearError,
  }),
}))

// Import component after mocks are set up
import PasswordReset from '@components/UserManagement/PasswordReset.vue'

describe('PasswordReset.vue', () => {
  let wrapper: VueWrapper<any>

  const baseMount = (props: any = {}) => {
    wrapper = mount(PasswordReset, {
      props: {
        title: 'Reset Password',
        subtitle: 'Enter your email to reset',
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
          UButton: {
            name: 'UButton',
            template: '<button :type="type" :disabled="disabled || loading" @click="$emit(\'click\')"><slot /></button>',
            props: ['type', 'color', 'variant', 'class', 'loading', 'disabled', 'ui'],
            emits: ['click'],
          },
        },
      },
    })
  }

  beforeEach(() => {
    mockResetPassword.mockClear()
    mockClearError.mockClear()
    mockAuthError.value = ''
    mockIsLoading.value = false
    vi.useFakeTimers()
    baseMount()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders correctly', () => {
    expect(wrapper.element).toMatchSnapshot()
  })

  it('renders with provided title and subtitle', () => {
    expect(wrapper.find('h2').text()).toBe('Reset Password')
    expect(wrapper.find('p').text()).toBe('Enter your email to reset')
  })

  it('renders default title when title prop is omitted', () => {
    baseMount({ title: undefined, subtitle: undefined })
    expect(wrapper.find('h2').text()).toBe('Reset Password')
  })

  it('displays auth error when present', async () => {
    mockAuthError.value = 'No account found with this email'
    await nextTick()
    expect(wrapper.find('.text-red-500').text()).toBe('No account found with this email')
  })

  it('does not show error element when there is no auth error', () => {
    expect(wrapper.find('.text-red-500').exists()).toBe(false)
  })

  it('does not show success message initially', () => {
    expect(wrapper.find('.text-green-500').exists()).toBe(false)
  })

  it('shows loading state on submit button', async () => {
    mockIsLoading.value = true
    await nextTick()
    const buttons = wrapper.findAllComponents({ name: 'UButton' })
    expect(buttons[0].props('loading')).toBe(true)
    expect(buttons[0].props('disabled')).toBe(true)
  })

  it('emits backToLogin and calls clearError when back button is clicked', async () => {
    const backButton = wrapper.findAll('button').find(btn => btn.text().includes('Back to Login'))
    expect(backButton).toBeTruthy()
    await backButton!.trigger('click')
    expect(wrapper.emitted('backToLogin')).toBeTruthy()
    expect(mockClearError).toHaveBeenCalled()
  })

  it('calls resetPassword with the entered email on submit', async () => {
    mockResetPassword.mockResolvedValue(true)

    await wrapper.find('input[type="email"]').setValue('user@example.com')
    await wrapper.find('form').trigger('submit')

    expect(mockResetPassword).toHaveBeenCalledWith('user@example.com')
    expect(mockClearError).toHaveBeenCalled()
  })

  it('shows success message after successful reset', async () => {
    mockResetPassword.mockResolvedValue(true)

    await wrapper.find('input[type="email"]').setValue('user@example.com')
    await wrapper.find('form').trigger('submit')
    await nextTick()

    expect(wrapper.find('.text-green-500').text()).toContain('Password reset email sent')
  })

  it('emits success and backToLogin after 3-second delay on successful reset', async () => {
    mockResetPassword.mockResolvedValue(true)

    await wrapper.find('input[type="email"]').setValue('user@example.com')
    await wrapper.find('form').trigger('submit')
    await nextTick()

    // Events should not yet be emitted before timer fires
    expect(wrapper.emitted('success')).toBeFalsy()

    vi.advanceTimersByTime(3000)
    await nextTick()

    expect(wrapper.emitted('success')).toBeTruthy()
    expect(wrapper.emitted('backToLogin')).toBeTruthy()
  })

  it('does not emit success on failed reset', async () => {
    mockResetPassword.mockResolvedValue(false)

    await wrapper.find('input[type="email"]').setValue('user@example.com')
    await wrapper.find('form').trigger('submit')
    await nextTick()

    vi.advanceTimersByTime(3000)
    await nextTick()

    expect(wrapper.emitted('success')).toBeFalsy()
  })

  it('disables submit button after successful reset', async () => {
    mockResetPassword.mockResolvedValue(true)

    await wrapper.find('input[type="email"]').setValue('user@example.com')
    await wrapper.find('form').trigger('submit')
    await nextTick()

    const submitButton = wrapper.findAllComponents({ name: 'UButton' })[0]
    expect(submitButton.props('disabled')).toBe(true)
  })

  it('does not call resetPassword when email is missing', async () => {
    await wrapper.find('form').trigger('submit')
    expect(mockResetPassword).not.toHaveBeenCalled()
  })
})
