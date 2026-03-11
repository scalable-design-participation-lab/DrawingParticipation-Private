/**
 * Login form component for user authentication
 * 
 * Handles email and password login with validation and error handling.
 * Provides options to switch to registration or reset password.
 */
<script setup lang="ts">
import { reactive } from 'vue'
import { object, string, type InferType } from 'yup'
import { useFirebaseAuth } from '../../composables/useFirebaseAuth'

/**
 * Login form validation schema
 */
const loginSchema = object({
  email: string().email('Please enter a valid email').required('Email is required'),
  password: string().min(6, 'Password must be at least 6 characters').required('Password is required')
})

/**
 * Type for login form data
 */
type LoginSchema = InferType<typeof loginSchema>

/**
 * Login form component props.
 *
 * @category Components
 */
const props = defineProps<{
  /** Optional title for the login form */
  title?: string
  /** Optional subtitle text */
  subtitle?: string
  /** Whether to show the forgot password link */
  showForgotPassword?: boolean
}>()

/**
 * Login form component events.
 *
 * @category Components
 */
const emit = defineEmits<{
  /** Emitted when login is successful */
  success: [user: any, userData?: any]
  /** Emitted when user wants to switch to registration */
  switchToRegister: []
  /** Emitted when user clicks forgot password */
  forgotPassword: []
}>()

const { signInWithEmail, authError, isLoading, clearError } = useFirebaseAuth()

/**
 * Reactive form state
 */
const formState = reactive({
  email: '',
  password: ''
})

/**
 * Handles form submission and attempts to sign in
 */
const onSubmit = async () => {
  clearError()
  
  const user = await signInWithEmail(formState.email, formState.password)
  
  if (user) {
    emit('success', user)
  }
}

/**
 * Switches to the registration view
 */
const handleSwitchToRegister = () => {
  clearError()
  emit('switchToRegister')
}

/**
 * Handles forgot password action
 */
const handleForgotPassword = () => {
  clearError()
  emit('forgotPassword')
}
</script>

<template>
  <div class="space-y-6">
    <div class="text-center">
      <h2 class="text-2xl font-semibold">{{ title || 'Login' }}</h2>
      <p v-if="subtitle" class="mt-2 text-gray-600">{{ subtitle }}</p>
    </div>

    <div v-if="authError" class="text-red-500 text-sm text-center">
      {{ authError }}
    </div>

    <UForm
      :schema="loginSchema"
      :state="formState"
      class="space-y-4"
      @submit="onSubmit"
    >
      <UFormGroup label="Email" name="email">
        <UInput
          v-model="formState.email"
          placeholder="Enter your email"
          color="primary"
          variant="outline"
          size="md"
          type="email"
        />
      </UFormGroup>

      <UFormGroup label="Password" name="password">
        <UInput
          v-model="formState.password"
          type="password"
          placeholder="Enter your password"
          color="primary"
          variant="outline"
          size="md"
        />
      </UFormGroup>

      <UButton
        type="submit"
        color="black"
        :ui="{ base: 'pl-4 w-full py-3 rounded-full hover:bg-gray-300 hover:text-black dark:hover:bg-zinc-700' }"
        :loading="isLoading"
        :disabled="isLoading"
      >
        Login
      </UButton>
    </UForm>

    <div class="text-center space-y-2">
      <p class="text-sm text-gray-600">
        Don't have an account?
        <button 
          @click="handleSwitchToRegister" 
          class="text-primary hover:underline focus:outline-none"
        >
          Register
        </button>
      </p>

      <p v-if="showForgotPassword" class="text-sm text-gray-600">
        <button 
          @click="handleForgotPassword" 
          class="text-primary hover:underline focus:outline-none"
        >
          Forgot password? Click to reset.
        </button>
      </p>
    </div>
  </div>
</template>