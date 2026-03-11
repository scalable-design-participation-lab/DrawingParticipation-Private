/**
 * User profile component
 * 
 * Comprehensive profile management component with editable fields, tab support,
 * and account deletion. Handles form state, validation, and user data updates.
 */
<script setup lang="ts">
import { ref, watch } from 'vue'

/**
 * Configuration for form fields
 */
export interface FormFieldConfig {
  /** Field name identifier */
  name: string
  /** Display label for the field */
  label: string
  /** Input type */
  type?: 'text' | 'number' | 'email' | 'select'
  /** Placeholder text */
  placeholder?: string
  /** Whether the field is disabled */
  disabled?: boolean
  /** Options for select fields */
  options?: Array<{ label: string; value: string }>
}

/**
 * Configuration for tabs
 */
export interface TabConfig {
  /** Unique tab identifier */
  key: string
  /** Display label for the tab */
  label: string
}

/**
 * User profile data structure
 */
export interface UserProfileData {
  /** User email address */
  email?: string
  /** Additional user data fields */
  [key: string]: any
}

const props = defineProps({
  /**
   * User profile data to display/edit
   */
  userData: {
    type: Object as () => UserProfileData | null,
    default: null,
  },
  /**
   * Configuration for form fields
   */
  formFields: {
    type: Array as () => FormFieldConfig[],
    required: true,
  },
  /**
   * Initial loading state
   */
  isLoading: {
    type: Boolean,
    default: false,
  },
  /**
   * Error message to display
   */
  error: {
    type: String,
    default: '',
  },
  /**
   * Success message to display
   */
  success: {
    type: String,
    default: '',
  },
  /**
   * Whether to show tabs
   */
  showTabs: {
    type: Boolean,
    default: false,
  },
  /**
   * Tab configurations
   */
  tabs: {
    type: Array as () => TabConfig[],
    default: () => [],
  },
  /**
   * Active tab key
   */
  activeTab: {
    type: String,
    default: '',
  },
  /**
   * Whether to show delete account button
   */
  showDeleteAccount: {
    type: Boolean,
    default: true,
  },
  /**
   * Whether to show back button
   */
  showBackButton: {
    type: Boolean,
    default: true,
  },
  /**
   * Back button label
   */
  backButtonLabel: {
    type: String,
    default: 'Back to Map',
  },
  /**
   * Title for the profile page
   */
  title: {
    type: String,
    default: 'User Profile',
  },
  /**
   * Subtitle for the profile page
   */
  subtitle: {
    type: String,
    default: 'View and edit profile information',
  },
  /**
   * Custom validation function for form submission
   */
  validationRules: {
    type: Function as () => ((data: Record<string, any>) => boolean | string) | undefined,
    default: undefined,
  },
  /**
   * Custom formatter for form data before submission
   */
  formDataFormatter: {
    type: Function as () => ((data: Record<string, any>) => Record<string, any>) | undefined,
    default: undefined,
  },
  /**
   * Custom class name for the container
   */
  className: {
    type: String,
    default: '',
  },
})

const emit = defineEmits<{
  /**
   * Emitted when user submits profile update
   */
  'profile:update': [data: Record<string, any>]
  /**
   * Emitted when user requests account deletion
   */
  'account:delete': [password: string]
  /**
   * Emitted when active tab changes
   */
  'tab:change': [tabKey: string]
  /**
   * Emitted when back button is clicked
   */
  'navigation:back': []
  /**
   * Emitted when edit mode is toggled
   */
  'edit:toggle': [isEditing: boolean]
  /**
   * Emitted when delete modal should open/close
   */
  'delete-modal:toggle': [isOpen: boolean]
}>()

/** Whether the form is in edit mode */
const isEditing = ref(false)
/** Whether the delete account modal is open */
const isDeleteAccountModalOpen = ref(false)
/** Password for account deletion confirmation */
const deletePassword = ref('')
/** Error message for delete account action */
const deleteError = ref('')

/**
 * Form state dynamically created from formFields
 */
const formState = ref<Record<string, any>>({})

/**
 * Initializes form state from userData and formFields
 */
watch(
  () => [props.userData, props.formFields],
  () => {
    if (props.userData && props.formFields) {
      const state: Record<string, any> = {}
      props.formFields.forEach((field) => {
        // Support nested properties (e.g., name.firstname)
        const keys = field.name.split('.')
        let value = props.userData
        for (const key of keys) {
          value = value?.[key]
        }
        state[field.name] = value?.toString() || ''
      })
      formState.value = state
    }
  },
  { immediate: true, deep: true }
)

/**
 * Handles form submission with validation and formatting
 */
const handleSubmit = () => {
  // Validate if custom validation rules provided
  if (props.validationRules) {
    const validationResult = props.validationRules(formState.value)
    if (validationResult !== true) {
      emit('profile:update', { error: validationResult })
      return
    }
  }

  // Format data if custom formatter provided
  let dataToEmit = { ...formState.value }
  if (props.formDataFormatter) {
    dataToEmit = props.formDataFormatter(dataToEmit)
  }

  emit('profile:update', dataToEmit)
}

/**
 * Handles edit mode toggle
 */
const handleEditToggle = (value: boolean) => {
  isEditing.value = value
  emit('edit:toggle', value)
}

/**
 * Handles cancel edit and resets form state
 */
const handleCancelEdit = () => {
  // Reset form state from userData
  if (props.userData && props.formFields) {
    const state: Record<string, any> = {}
    props.formFields.forEach((field) => {
      const keys = field.name.split('.')
      let value = props.userData
      for (const key of keys) {
        value = value?.[key]
      }
      state[field.name] = value?.toString() || ''
    })
    formState.value = state
  }
  handleEditToggle(false)
}

/**
 * Handles account deletion with password confirmation
 */
const handleDeleteAccount = () => {
  if (!deletePassword.value) {
    deleteError.value = 'Password is required'
    return
  }
  deleteError.value = ''
  emit('account:delete', deletePassword.value)
}

/**
 * Handles tab change
 */
const handleTabChange = (tabKey: string) => {
  emit('tab:change', tabKey)
}

/**
 * Handles delete modal open/close state
 */
const handleDeleteModalToggle = (isOpen: boolean) => {
  isDeleteAccountModalOpen.value = isOpen
  if (!isOpen) {
    deletePassword.value = ''
    deleteError.value = ''
  }
  emit('delete-modal:toggle', isOpen)
}

/**
 * Watches for external delete error updates
 */
watch(
  () => props.error,
  (newError) => {
    if (newError && isDeleteAccountModalOpen.value) {
      deleteError.value = newError
    }
  }
)

/**
 * Watches for success messages to close edit mode
 */
watch(
  () => props.success,
  (newSuccess) => {
    if (newSuccess) {
      isEditing.value = false
    }
  }
)

/**
 * Exposes methods for programmatic control
 */
defineExpose({
  reset: () => {
    handleCancelEdit()
  },
  validate: () => {
    if (props.validationRules) {
      return props.validationRules(formState.value)
    }
    return true
  },
  setEditing: (value: boolean) => {
    handleEditToggle(value)
  },
})
</script>

<template>
  <div :class="['max-w-4xl mx-auto p-6', className]">
    <!-- Tabs -->
    <div v-if="showTabs && tabs.length > 0" class="mb-6 flex gap-4 border-b">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        :class="[
          'px-4 py-2 -mb-px border-b-2',
          activeTab === tab.key
            ? 'border-black font-bold'
            : 'border-transparent text-gray-500',
        ]"
        @click="handleTabChange(tab.key)"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- Tab Content -->
    <div v-if="!showTabs || activeTab === 'profile' || activeTab === ''">
      <!-- Back Button -->
      <div v-if="showBackButton" class="mb-6">
        <UButton
          color="black"
          variant="ghost"
          icon="i-heroicons-arrow-left"
          @click="$emit('navigation:back')"
        >
          {{ backButtonLabel }}
        </UButton>
      </div>

      <div class="mb-8">
        <h1 class="text-3xl font-bold mb-2">{{ title }}</h1>
        <p class="text-gray-600">{{ subtitle }}</p>
      </div>

      <!-- Error and Success Messages -->
      <div v-if="error" class="mb-4 p-4 bg-red-100 text-red-700 rounded-lg">
        {{ error }}
      </div>
      <div v-if="success" class="mb-4 p-4 bg-green-100 text-green-700 rounded-lg">
        {{ success }}
      </div>

      <!-- Loading State -->
      <div v-if="isLoading" class="flex justify-center items-center h-64">
        <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 animate-spin" />
      </div>

      <!-- Profile Form -->
      <UForm
        v-else
        :state="formState"
        class="space-y-6"
        @submit.prevent="handleSubmit"
      >
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <template v-for="field in formFields" :key="field.name">
            <!-- Text/Number/Email Input -->
            <UFormGroup
              v-if="field.type !== 'select'"
              :label="field.label"
              :name="field.name"
            >
              <UInput
                v-model="formState[field.name]"
                :type="field.type || 'text'"
                :disabled="field.disabled || !isEditing"
                :placeholder="field.placeholder"
              />
            </UFormGroup>

            <!-- Select Input -->
            <UFormGroup
              v-else
              :label="field.label"
              :name="field.name"
            >
              <USelect
                v-model="formState[field.name]"
                :options="field.options || []"
                :disabled="field.disabled || !isEditing"
                :placeholder="field.placeholder"
              />
            </UFormGroup>
          </template>
        </div>

        <!-- Action Buttons -->
        <div class="flex justify-between items-center mt-8">
          <div class="space-x-4">
            <UButton
              v-if="!isEditing"
              color="black"
              @click="handleEditToggle(true)"
            >
              Edit Profile
            </UButton>
            <template v-else>
              <UButton type="submit" color="black">
                Save Changes
              </UButton>
              <UButton color="gray" @click="handleCancelEdit">
                Cancel
              </UButton>
            </template>
          </div>

          <UButton
            v-if="showDeleteAccount"
            color="red"
            variant="ghost"
            @click="handleDeleteModalToggle(true)"
          >
            Delete Account
          </UButton>
        </div>
      </UForm>

      <!-- Delete Account Modal -->
      <UModal :model-value="isDeleteAccountModalOpen" @update:model-value="handleDeleteModalToggle">
        <UCard>
          <template #header>
            <div class="flex items-center gap-2">
              <UIcon
                name="i-heroicons-exclamation-triangle"
                class="w-6 h-6 text-red-500"
              />
              <h3 class="text-lg font-semibold">Delete Account</h3>
            </div>
          </template>

          <p class="text-gray-600">
            Are you sure you want to delete your account? This action is
            irreversible and will result in the loss of all your data.
          </p>
          <div class="mt-4">
            <UFormGroup
              label="Enter your password to confirm"
              name="deletePassword"
            >
              <UInput
                v-model="deletePassword"
                type="password"
                placeholder="Password"
              />
            </UFormGroup>
            <div v-if="deleteError" class="text-red-600 mt-2">
              {{ deleteError }}
            </div>
          </div>

          <template #footer>
            <div class="flex justify-end gap-3">
              <UButton
                color="gray"
                @click="handleDeleteModalToggle(false)"
              >
                Cancel
              </UButton>
              <UButton color="red" @click="handleDeleteAccount">
                Delete Account
              </UButton>
            </div>
          </template>
        </UCard>
      </UModal>
    </div>

    <!-- Other Tab Content (handled by parent via slot) -->
    <slot v-else :name="`tab-${activeTab}`" />
  </div>
</template>

