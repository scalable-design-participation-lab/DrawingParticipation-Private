/**
 * Registration form component
 * 
 * Handles user registration with configurable form fields and validation.
 * Creates new user accounts and emits registration data for further processing.
 */

<script setup lang="ts">
import { reactive } from 'vue'
import { object, string, type InferType } from 'yup'
import { useFirebaseAuth } from '../../composables/useFirebaseAuth'

/**
 * Dynamic form field configuration.
 *
 * @remarks
 * Used to build the registration form from a configurable field list.
 *
 * @category Types
 */
interface FormField {
  /** Field name identifier */
  name: string
  /** Display label for the field */
  label: string
  /** Input type */
  type?: 'text' | 'number' | 'email' | 'password' | 'select'
  /** Placeholder text */
  placeholder?: string
  /** Options for select fields */
  options?: Array<{ label: string, value: string }>
  /** Custom validation rules */
  validation?: any
}

/**
 * Register form component props.
 *
 * @category Components
 */
const props = defineProps<{
  /** Optional title for the register form */
  title?: string
  /** Optional subtitle text */
  subtitle?: string
  /** Array of form field configurations */
  fields: FormField[]
  /** Validation schema for the form */
  schema: any
  /** Text for the submit button */
  buttonText?: string
}>()

/**
 * Register form component events.
 *
 * @category Components
 */
const emit = defineEmits<{
  /** Emitted when registration is successful */
  success: [user: any, formData: Record<string, any>]
  /** Emitted when user wants to switch to login */
  switchToLogin: []
}>()

const { signUpWithEmail, authError, isLoading, clearError } = useFirebaseAuth()

/**
 * Reactive form state created from field configurations
 */
const formState = reactive(
  props.fields.reduce((acc, field) => {
    acc[field.name] = ''
    return acc
  }, {} as Record<string, any>)
)

/**
 * Handles form submission and attempts to register user
 */
const onSubmit = async () => {
  clearError()
  
  // Extract email and password for auth
  const email = formState.email
  const password = formState.password
  
  if (!email || !password) {
    return
  }
  
  const user = await signUpWithEmail(email, password)
  
  if (user) {
    // Add uid to form data
    const formData = {
      ...formState,
      uid: user.uid,
    }
    
    emit('success', user, formData)
  }
}

/**
 * Switches to the login view
 */
const handleSwitchToLogin = () => {
  clearError()
  emit('switchToLogin')
}
</script>

<template>
  <div class="space-y-6">
    <div class="text-center">
      <h2 class="text-2xl font-semibold">{{ title || 'Register' }}</h2>
      <p v-if="subtitle" class="mt-2 text-gray-600">{{ subtitle }}</p>
    </div>

    <div v-if="authError" class="text-red-500 text-sm text-center">
      {{ authError }}
    </div>

    <UForm
      :schema="schema"
      :state="formState"
      class="space-y-4"
      @submit="onSubmit"
    >
      <template v-for="field in fields" :key="field.name">
        <UFormGroup :label="field.label" :name="field.name">
          <USelect
            v-if="field.type === 'select' && field.options"
            v-model="formState[field.name]"
            :options="field.options"
            :placeholder="field.placeholder"
            color="primary"
            variant="outline"
            size="md"
          />
          <UInput
            v-else
            v-model="formState[field.name]"
            :type="field.type || 'text'"
            :placeholder="field.placeholder"
            color="primary"
            variant="outline"
            size="md"
          />
        </UFormGroup>
      </template>

      <UButton
        type="submit"
        color="black"
        :ui="{ base: 'w-full py-3 rounded-full hover:bg-gray-300 hover:text-black dark:hover:bg-zinc-700 dark:hover:text-white' }"
        :loading="isLoading"
        :disabled="isLoading"
      >
        {{ buttonText || 'Register' }}
      </UButton>
    </UForm>

    <div class="text-center">
      <p class="text-sm text-gray-600">
        Already have an account?
        <button 
          @click="handleSwitchToLogin" 
          class="text-primary hover:underline focus:outline-none"
        >
          Login
        </button>
      </p>
    </div>
  </div>
</template>