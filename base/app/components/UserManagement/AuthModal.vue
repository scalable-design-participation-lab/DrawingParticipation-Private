/**
 * Authentication modal component
 * 
 * Main modal that handles login, registration, and password reset flows.
 * Checks for persistent authentication and shows welcome back modal when appropriate.
 */

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useFirebaseAuth } from '../../composables/useFirebaseAuth'
import { useUserStore } from '../../stores/user'
import type { UserData } from '../../stores/types/store'
import LoginForm from './LoginForm.vue'
import RegisterForm from './RegisterForm.vue'
import PasswordReset from './PasswordReset.vue'
import WelcomeBackModal from './WelcomeBackModal.vue'

const userStore = useUserStore()

/**
 * Dynamic form field configuration.
 *
 * @remarks
 * Shared configuration used to render registration form inputs in the auth modal.
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
}

/**
 * Auth modal component props.
 *
 * @category Components
 */
const props = defineProps<{
  /** Whether the modal is visible */
  isVisible: boolean
  /** Fields for registration form */
  registrationFields?: FormField[]
  /** Validation schema for registration */
  registrationSchema?: any
  /** Title for login form */
  loginTitle?: string
  /** Subtitle for login form */
  loginSubtitle?: string
  /** Title for registration form */
  registerTitle?: string
  /** Subtitle for registration form */
  registerSubtitle?: string
  /** Text for register button */
  registerButtonText?: string
  /** Whether to show forgot password option */
  showForgotPassword?: boolean
}>()

/**
 * Auth modal component events.
 *
 * @category Components
 */
const emit = defineEmits<{
  /** Emitted when modal should close. */
  close: []
  /**
   * Emitted when user successfully authenticates.
   *
   * @remarks
   * Also triggers user state updates via `useUserStore`.
   */
  userAuthenticated: [user: any, userData?: any]
  /** Emitted when user successfully registers. */
  userRegistered: [user: any, formData: any]
}>()

const { checkPersistentAuth, getUserData } = useFirebaseAuth()

/** Current view state */
const currentView = ref<'login' | 'register' | 'forgot-password'>('login')
/** Whether we're checking for persistent auth */
const isChecking = ref(true)
/** Whether to show welcome back modal */
const showWelcomeBack = ref(false)

/**
 * Checks for persistent authentication when modal becomes visible
 */
const checkPersistentCookie = async () => {
  isChecking.value = true
  
  try {
    const { user, userData } = await checkPersistentAuth()
    
    if (user && userData) {
      userStore.setUserData(userData as UserData)
      showWelcomeBack.value = true
      emit('userAuthenticated', user, userData)
    }
  } catch (error) {
    console.error('Error checking persistent auth:', error)
  } finally {
    isChecking.value = false
  }
}

/**
 * Handles successful login and fetches user data
 */
const handleLoginSuccess = async (user: any) => {
  try {
    // Get user data from Firestore
    const userData = await getUserData(user.uid)
    
    if (userData) {
      userStore.setUserData(userData as UserData)
      showWelcomeBack.value = true
      emit('userAuthenticated', user, userData)
    } else {
      // User authenticated but no profile found
      const basicUserData: UserData = {
        userId: user.uid,
        uid: user.uid,
        email: user.email
      }
      userStore.setUserData(basicUserData)
      emit('userAuthenticated', user, basicUserData)
      emit('close')
    }
  } catch (error) {
    console.error('Error handling login success:', error)
  }
}

/**
 * Handles successful registration
 */
const handleRegisterSuccess = async (user: any, formData: any) => {
  try {
    const newUserData: UserData = { userId: user.uid, uid: user.uid, email: user.email, ...formData }
    userStore.setUserData(newUserData)
    emit('userRegistered', user, formData)
    emit('close')
  } catch (error) {
    console.error('Error handling registration success:', error)
  }
}

/**
 * Handles welcome back modal close
 */
const handleWelcomeBackClose = () => {
  showWelcomeBack.value = false
  emit('close')
}

/**
 * Switches view to login
 */
const switchToLogin = () => {
  currentView.value = 'login'
}

/**
 * Switches view to register
 */
const switchToRegister = () => {
  currentView.value = 'register'
}

/**
 * Switches view to forgot password
 */
const switchToForgotPassword = () => {
  currentView.value = 'forgot-password'
}

/**
 * Handles password reset success and returns to login
 */
const handlePasswordResetSuccess = () => {
  currentView.value = 'login'
}

/**
 * Watches for visibility changes to check persistent auth
 */
watch(
  () => props.isVisible,
  (newValue) => {
    if (newValue) {
      checkPersistentCookie()
    } else {
      // Reset state when modal closes
      currentView.value = 'login'
      showWelcomeBack.value = false
    }
  }
)
</script>

<template>
  <div>
    <!-- Welcome Back Modal -->
    <WelcomeBackModal
      v-if="showWelcomeBack"
      @close="handleWelcomeBackClose"
    />

    <!-- Main Auth Modal -->
    <UCard
      v-if="isVisible && !isChecking && !showWelcomeBack"
      class="auth-modal max-w-[90vw] w-[500px] max-h-[90vh] 
      overflow-y-auto z-50 absolute top-1/2 left-1/2 transform -translate-x-1/2 
      -translate-y-1/2 rounded-xl shadow-xl scrollbar-thin 
      scrollbar-thumb-gray-400 scrollbar-track-gray-100 dark:bg-background-dark"
    >
        <!-- Login Form -->
        <LoginForm
          v-if="currentView === 'login'"
          :title="loginTitle"
          :subtitle="loginSubtitle"
          :show-forgot-password="showForgotPassword"
          @success="handleLoginSuccess"
          @switch-to-register="switchToRegister"
          @forgot-password="switchToForgotPassword"
        />

        <!-- Register Form -->
        <RegisterForm
          v-else-if="currentView === 'register' && registrationFields && registrationSchema"
          :title="registerTitle"
          :subtitle="registerSubtitle"
          :fields="registrationFields"
          :schema="registrationSchema"
          :button-text="registerButtonText"
          @success="handleRegisterSuccess"
          @switch-to-login="switchToLogin"
        />

        <!-- Password Reset Form -->
        <PasswordReset
          v-else-if="currentView === 'forgot-password'"
          @success="handlePasswordResetSuccess"
          @back-to-login="switchToLogin"
        />
    </UCard>
  </div>
</template>

<style scoped>

</style>