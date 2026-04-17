import { type VueWrapper, mount } from '@vue/test-utils'
import { nextTick } from 'vue'

// Import component (no Firebase deps, no mocks needed)
import UserProfile from '@components/UserManagement/UserProfile.vue'

const defaultFormFields = [
  { name: 'email', label: 'Email', type: 'email' as const },
  { name: 'username', label: 'Username', type: 'text' as const },
]

const defaultUserData = {
  email: 'test@example.com',
  username: 'testuser',
}

const globalStubs = {
  UForm: {
    name: 'UForm',
    template: '<form @submit.prevent="$emit(\'submit\', $event)"><slot /></form>',
    emits: ['submit'],
  },
  UFormGroup: {
    name: 'UFormGroup',
    template: '<div><label v-if="label">{{ label }}</label><slot /></div>',
    props: ['label', 'name'],
  },
  UInput: {
    name: 'UInput',
    template: '<input :value="modelValue" :type="type || \'text\'" :disabled="disabled" @input="$emit(\'update:modelValue\', $event.target.value)" />',
    props: ['modelValue', 'type', 'placeholder', 'disabled'],
    emits: ['update:modelValue'],
  },
  USelect: {
    name: 'USelect',
    template: '<select :value="modelValue" :disabled="disabled"><option v-for="opt in (options || [])" :key="opt.value" :value="opt.value">{{ opt.label }}</option></select>',
    props: ['modelValue', 'options', 'placeholder', 'disabled'],
  },
  UButton: {
    name: 'UButton',
    template: '<button :type="type" :disabled="disabled" @click="$emit(\'click\')"><slot /></button>',
    props: ['type', 'color', 'variant', 'icon', 'disabled', 'ui'],
    emits: ['click'],
  },
  UModal: {
    name: 'UModal',
    template: '<div v-if="modelValue"><slot /></div>',
    props: ['modelValue'],
    emits: ['update:modelValue'],
  },
  UCard: {
    name: 'UCard',
    template: '<div><slot name="header" /><slot /><slot name="footer" /></div>',
  },
  UIcon: { name: 'UIcon', template: '<span />' },
}

describe('UserProfile.vue', () => {
  let wrapper: VueWrapper<any>

  const baseMount = (props: any = {}) => {
    wrapper = mount(UserProfile, {
      props: {
        formFields: defaultFormFields,
        userData: defaultUserData,
        ...props,
      },
      global: { stubs: globalStubs },
    })
  }

  beforeEach(() => {
    baseMount()
  })

  it('renders correctly', () => {
    expect(wrapper.element).toMatchSnapshot()
  })

  it('renders default title and subtitle', () => {
    expect(wrapper.find('h1').text()).toBe('User Profile')
    expect(wrapper.text()).toContain('View and edit profile information')
  })

  it('renders custom title and subtitle', () => {
    baseMount({ title: 'My Profile', subtitle: 'Edit your info' })
    expect(wrapper.find('h1').text()).toBe('My Profile')
    expect(wrapper.text()).toContain('Edit your info')
  })

  it('shows error message when error prop is set', async () => {
    baseMount({ error: 'Something went wrong' })
    await nextTick()
    expect(wrapper.find('.bg-red-100').text()).toContain('Something went wrong')
  })

  it('shows success message when success prop is set', async () => {
    baseMount({ success: 'Profile updated!' })
    await nextTick()
    expect(wrapper.find('.bg-green-100').text()).toContain('Profile updated!')
  })

  it('hides form and shows spinner when isLoading is true', async () => {
    baseMount({ isLoading: true })
    await nextTick()
    expect(wrapper.findComponent({ name: 'UForm' }).exists()).toBe(false)
  })

  it('populates form fields from userData', async () => {
    await nextTick()
    const emailInput = wrapper.find('input[type="email"]')
    expect((emailInput.element as HTMLInputElement).value).toBe('test@example.com')
  })

  it('supports nested property access in form fields', async () => {
    baseMount({
      formFields: [{ name: 'name.firstname', label: 'First Name', type: 'text' }],
      userData: { name: { firstname: 'Alice' } },
    })
    await nextTick()
    const input = wrapper.find('input[type="text"]')
    expect((input.element as HTMLInputElement).value).toBe('Alice')
  })

  it('renders back button with default label', () => {
    const backButton = wrapper.findAll('button').find(btn => btn.text().includes('Back to Map'))
    expect(backButton).toBeTruthy()
  })

  it('hides back button when showBackButton is false', () => {
    baseMount({ showBackButton: false })
    const backButton = wrapper.findAll('button').find(btn => btn.text().includes('Back to Map'))
    expect(backButton).toBeFalsy()
  })

  it('renders custom back button label', () => {
    baseMount({ backButtonLabel: 'Go Home' })
    const backButton = wrapper.findAll('button').find(btn => btn.text().includes('Go Home'))
    expect(backButton).toBeTruthy()
  })

  it('emits navigation:back when back button is clicked', async () => {
    const backButton = wrapper.findAll('button').find(btn => btn.text().includes('Back to Map'))
    await backButton!.trigger('click')
    expect(wrapper.emitted('navigation:back')).toBeTruthy()
  })

  it('shows Edit Profile button in view mode', () => {
    const editButton = wrapper.findAll('button').find(btn => btn.text() === 'Edit Profile')
    expect(editButton).toBeTruthy()
  })

  it('enters edit mode and emits edit:toggle when Edit Profile is clicked', async () => {
    const editButton = wrapper.findAll('button').find(btn => btn.text() === 'Edit Profile')
    await editButton!.trigger('click')
    expect(wrapper.emitted('edit:toggle')).toBeTruthy()
    expect(wrapper.emitted('edit:toggle')![0]).toEqual([true])
    await nextTick()
    expect(wrapper.findAll('button').find(btn => btn.text() === 'Save Changes')).toBeTruthy()
  })

  it('disables inputs in view mode', () => {
    const inputs = wrapper.findAll('input')
    inputs.forEach(input => {
      expect((input.element as HTMLInputElement).disabled).toBe(true)
    })
  })

  it('enables inputs in edit mode', async () => {
    const editButton = wrapper.findAll('button').find(btn => btn.text() === 'Edit Profile')
    await editButton!.trigger('click')
    await nextTick()
    const inputs = wrapper.findAll('input').filter(i => (i.element as HTMLInputElement).type !== 'hidden')
    expect(inputs.some(i => !(i.element as HTMLInputElement).disabled)).toBe(true)
  })

  it('returns to view mode and emits edit:toggle(false) when Cancel is clicked', async () => {
    const editButton = wrapper.findAll('button').find(btn => btn.text() === 'Edit Profile')
    await editButton!.trigger('click')
    await nextTick()

    const cancelButton = wrapper.findAll('button').find(btn => btn.text() === 'Cancel')
    await cancelButton!.trigger('click')
    await nextTick()

    expect(wrapper.emitted('edit:toggle')).toHaveLength(2)
    expect(wrapper.emitted('edit:toggle')![1]).toEqual([false])
    expect(wrapper.findAll('button').find(btn => btn.text() === 'Edit Profile')).toBeTruthy()
  })

  it('emits profile:update with form data when form is submitted', async () => {
    const editButton = wrapper.findAll('button').find(btn => btn.text() === 'Edit Profile')
    await editButton!.trigger('click')
    await nextTick()

    await wrapper.find('form').trigger('submit')

    expect(wrapper.emitted('profile:update')).toBeTruthy()
    const emittedData = wrapper.emitted('profile:update')![0][0] as Record<string, any>
    expect(emittedData.email).toBe('test@example.com')
  })

  it('applies custom formDataFormatter before emitting', async () => {
    baseMount({
      formDataFormatter: (data: Record<string, any>) => ({ ...data, transformed: true }),
    })
    const editButton = wrapper.findAll('button').find(btn => btn.text() === 'Edit Profile')
    await editButton!.trigger('click')
    await nextTick()

    await wrapper.find('form').trigger('submit')

    const emittedData = wrapper.emitted('profile:update')![0][0] as Record<string, any>
    expect(emittedData.transformed).toBe(true)
  })

  it('emits validation error when validationRules returns a string', async () => {
    baseMount({ validationRules: () => 'Validation failed' })
    const editButton = wrapper.findAll('button').find(btn => btn.text() === 'Edit Profile')
    await editButton!.trigger('click')
    await nextTick()

    await wrapper.find('form').trigger('submit')

    const emittedData = wrapper.emitted('profile:update')![0][0] as Record<string, any>
    expect(emittedData.error).toBe('Validation failed')
  })

  it('shows delete account button by default', () => {
    const deleteButton = wrapper.findAll('button').find(btn => btn.text() === 'Delete Account')
    expect(deleteButton).toBeTruthy()
  })

  it('hides delete account button when showDeleteAccount is false', () => {
    baseMount({ showDeleteAccount: false })
    // Only the outer "Delete Account" button should be absent
    const buttons = wrapper.findAll('button')
    const outerDelete = buttons.find(btn => btn.text() === 'Delete Account')
    expect(outerDelete).toBeFalsy()
  })

  it('emits delete-modal:toggle(true) when Delete Account button is clicked', async () => {
    const deleteButton = wrapper.findAll('button').find(btn => btn.text() === 'Delete Account')
    await deleteButton!.trigger('click')
    expect(wrapper.emitted('delete-modal:toggle')).toBeTruthy()
    expect(wrapper.emitted('delete-modal:toggle')![0]).toEqual([true])
  })

  it('shows delete confirmation modal and emits account:delete with password', async () => {
    // Open the modal
    const deleteButton = wrapper.findAll('button').find(btn => btn.text() === 'Delete Account')
    await deleteButton!.trigger('click')
    await nextTick()

    // Fill in password inside the modal
    const passwordInput = wrapper.find('input[type="password"]')
    await passwordInput.setValue('mypassword')

    // Click the confirm delete button inside the modal footer
    const allDeleteButtons = wrapper.findAll('button').filter(btn => btn.text() === 'Delete Account')
    // The last one is the modal confirm button
    await allDeleteButtons[allDeleteButtons.length - 1].trigger('click')

    expect(wrapper.emitted('account:delete')).toBeTruthy()
    expect(wrapper.emitted('account:delete')![0]).toEqual(['mypassword'])
  })

  it('shows error in modal when delete is attempted without password', async () => {
    const deleteButton = wrapper.findAll('button').find(btn => btn.text() === 'Delete Account')
    await deleteButton!.trigger('click')
    await nextTick()

    const allDeleteButtons = wrapper.findAll('button').filter(btn => btn.text() === 'Delete Account')
    await allDeleteButtons[allDeleteButtons.length - 1].trigger('click')

    expect(wrapper.emitted('account:delete')).toBeFalsy()
    expect(wrapper.text()).toContain('Password is required')
  })

  it('renders tabs when showTabs is true', () => {
    baseMount({
      showTabs: true,
      tabs: [
        { key: 'profile', label: 'Profile' },
        { key: 'settings', label: 'Settings' },
      ],
      activeTab: 'profile',
    })
    const tabButtons = wrapper.find('.border-b').findAll('button')
    expect(tabButtons).toHaveLength(2)
    expect(tabButtons[0].text()).toBe('Profile')
    expect(tabButtons[1].text()).toBe('Settings')
  })

  it('emits tab:change with tab key when a tab is clicked', async () => {
    baseMount({
      showTabs: true,
      tabs: [
        { key: 'profile', label: 'Profile' },
        { key: 'settings', label: 'Settings' },
      ],
      activeTab: 'profile',
    })
    const tabButtons = wrapper.find('.border-b').findAll('button')
    await tabButtons[1].trigger('click')
    expect(wrapper.emitted('tab:change')).toBeTruthy()
    expect(wrapper.emitted('tab:change')![0]).toEqual(['settings'])
  })

  it('closes edit mode when success prop updates', async () => {
    const editButton = wrapper.findAll('button').find(btn => btn.text() === 'Edit Profile')
    await editButton!.trigger('click')
    await nextTick()
    expect(wrapper.findAll('button').find(btn => btn.text() === 'Save Changes')).toBeTruthy()

    await wrapper.setProps({ success: 'Profile saved!' })
    await nextTick()

    expect(wrapper.findAll('button').find(btn => btn.text() === 'Edit Profile')).toBeTruthy()
    expect(wrapper.findAll('button').find(btn => btn.text() === 'Save Changes')).toBeFalsy()
  })

  it('exposes reset() method that exits edit mode', async () => {
    const editButton = wrapper.findAll('button').find(btn => btn.text() === 'Edit Profile')
    await editButton!.trigger('click')
    await nextTick()

    wrapper.vm.reset()
    await nextTick()

    expect(wrapper.findAll('button').find(btn => btn.text() === 'Edit Profile')).toBeTruthy()
  })

  it('exposes validate() that returns true when no validationRules prop', () => {
    expect(wrapper.vm.validate()).toBe(true)
  })

  it('exposes validate() that calls validationRules when provided', () => {
    const mockRule = vi.fn().mockReturnValue(true)
    baseMount({ validationRules: mockRule })
    wrapper.vm.validate()
    expect(mockRule).toHaveBeenCalled()
  })

  it('exposes setEditing() that enters edit mode', async () => {
    wrapper.vm.setEditing(true)
    await nextTick()
    expect(wrapper.findAll('button').find(btn => btn.text() === 'Save Changes')).toBeTruthy()
  })

  it('exposes setEditing() that exits edit mode', async () => {
    wrapper.vm.setEditing(true)
    await nextTick()
    wrapper.vm.setEditing(false)
    await nextTick()
    expect(wrapper.findAll('button').find(btn => btn.text() === 'Edit Profile')).toBeTruthy()
  })
})
