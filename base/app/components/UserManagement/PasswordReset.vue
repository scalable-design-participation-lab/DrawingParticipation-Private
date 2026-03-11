/**
 * Password reset component
 * 
 * Allows users to request a password reset email. Handles form validation
 * and provides feedback on success or error states.
 */
<script setup lang="ts">
import { ref, reactive } from 'vue'
import { object, string } from 'yup'
import { useFirebaseAuth } from '../../composables/useFirebaseAuth'

/**
 * Password reset form validation schema
 */
const resetSchema = object({
  email: string().email('Please enter a valid email').required('Email is required')
})

/**
 * Password reset component props.
 *
 * @category Components
 */
const props = defineProps<{
  /** Optional title for the reset form */
  title?: string
  /** Optional subtitle text */
  subtitle?: string
}>()

/**
 * Password reset component events.
 *
 * @category Components
 */
const emit = defineEmits<{
  /** Emitted when password reset email is sent successfully */
  success: []
  /** Emitted when user wants to go back to login */
  backToLogin: []
}>()

const { resetPassword, authError, isLoading, clearError } = useFirebaseAuth()

/**
 * Reactive form state
 */
const formState = reactive({
  email: ''
})

/** Current reset status */
const resetStatus = ref<'idle' | 'success' | 'error'>('idle')
/** Success message to display */
const successMessage = ref('')

/**
 * Handles form submission and sends password reset email
 */
const onSubmit = async () => {
  clearError()
  resetStatus.value = 'idle'
  
  if (!formState.email) {
    return
  }
  
  const success = await resetPassword(formState.email)
  
  if (success) {
    resetStatus.value = 'success'
    successMessage.value = 'Password reset email sent! Please check your inbox.'
    
    // Auto-redirect to login after 3 seconds
    setTimeout(() => {
      emit('success')
      handleBackToLogin()
    }, 3000)
  } else {
    resetStatus.value = 'error'
  }
}

/**
 * Handles navigation back to login view
 */
const handleBackToLogin = () => {
  clearError()
  resetStatus.value = 'idle'
  successMessage.value = ''
  emit('backToLogin')
}
</script>

<template>
  <div class="space-y-6">
    <div class="text-center">
      <h2 class="text-2xl font-semibold">{{ title || 'Reset Password' }}</h2>
      <p class="mt-2 text-gray-600">
        {{ subtitle || 'Enter your email address to receive a password reset link.' }}
      </p>
    </div>

    <div v-if="authError" class="text-red-500 text-sm text-center">
      {{ authError }}
    </div>

    <div v-if="resetStatus === 'success'" class="text-green-500 text-sm text-center">
      {{ successMessage }}
    </div>

    <UForm
      :schema="resetSchema"
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

      <div class="flex space-x-3">
        <UButton
          type="submit"
          color="primary"
          :ui="{ base: 'flex-1 py-3 rounded-full' }"
          :loading="isLoading"
          :disabled="isLoading || resetStatus === 'success'"
        >
          Send Reset Link
        </UButton>
        
        <UButton
          color="gray"
          variant="outline"
          :ui="{ base: 'flex-1 py-3 rounded-full' }"
          @click="handleBackToLogin"
          :disabled="isLoading"
        >
          Back to Login
        </UButton>
      </div>
    </UForm>
  </div>
</template>