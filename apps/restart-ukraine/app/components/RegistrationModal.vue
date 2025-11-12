<script setup lang="ts">
import { ref, watch } from 'vue'
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth'
import { useFirestore } from 'vuefire'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { useUserStore } from '@base/stores/user'
import { number, object, string } from 'yup'
import { useFirebaseAuth } from '../../../../base/app/composables/useFirebaseAuth'

// https://ui.nuxt.com/components/form
const schema = object({
  lastname: string().required('Прізвище є обов’язковим'),
  firstname: string().required('Ім’я є обов’язковим'),
  age: number()
    .required('Вік є обов’язковим')
    .typeError('Вік має бути числом')
    .positive('Вік має бути позитивним числом')
    .integer('Вік має бути цілим числом'),
  gender: string()
    .required('Стать є обов’язковою')
    .oneOf(['male', 'female', 'other'], 'Оберіть коректну стать'),
  educationLevel: string()
    .required('Рівень освіти є обов’язковим')
    .oneOf(['average', 'incomplete_higher', 'higher'], 'Оберіть коректний рівень освіти'),
  residentSince: string()
    .required('Тривалість проживання у Вінниці є обов’язковою')
    .oneOf(['less_than_1_year', '1_5_years', '5_10_years', 'more_than_10_years'], 'Оберіть коректний варіант'),
  residentNearRiverSince: string()
    .required('Це питання є обов’язковим')
    .oneOf(['yes', 'no', 'unfamiliar'], 'Оберіть коректний варіант'),
  email: string().email('Please enter a valid email').required('Email is required'),
  password: string().min(6, 'Password must be at least 6 characters').required('Password is required')
})

const auth = getAuth()
const props = defineProps({
  isVisible: Boolean,
})

  // Set persistence to local (survives browser restarts)
  setPersistence(auth, browserLocalPersistence)
    .then(() => {
      console.log('Persistence set to LOCAL')
    })
    .catch((error) => {
      console.error('Error setting persistence:', error)
    })

  // Create a function to check for persistent authentication
  const checkPersistentCookie = async () => {
    console.log('checkPersistentCookie called')
    try {
      // Check if user is already authenticated
      const currentUser = auth.currentUser
      
      if (currentUser) {
        console.log('Persistent cookie check - user found:', currentUser.uid)
        
        // Look up user data in Firestore
        const usersRef = collection(db, 'users')
        const q = query(usersRef, where('uid', '==', currentUser.uid))
        const querySnapshot = await getDocs(q)
        
        if (!querySnapshot.empty) {
          // User exists, show welcome back modal
          const userData = querySnapshot.docs[0].data()
          console.log('Found existing user data:', userData)
          existingUserData.value = userData
          userStore.setUserData({
            userId: userData.uid || userData.userId,
            ...userData
          })
          console.log('userStore.userData.value after set:', userStore.userData.value)
          showWelcomeBack.value = true
          emit('close')
          isChecking.value = false
        } else {
          console.log('User authenticated but no profile found in database - showing registration form')
          // Don't close the modal, just set basic user data and show registration form
          userStore.setUserData({
            userId: currentUser.uid,
            uid: currentUser.uid,
            email: currentUser.email
          })
          
          isChecking.value = false
          currentView.value = 'register'
          // Modal stays open for user to complete registration
        }
      } else {
        console.log('No persistent authenticated user found')
        isChecking.value = false
      }
    } catch (error) {
      console.error('Error checking persistent cookie:', error)
      isChecking.value = false
    }
  }

const emit = defineEmits(['close'])

const userStore = useUserStore()
const db = useFirestore()
const { checkPersistentAuth, saveUserData } = useFirebaseAuth()

// Add state for welcome back modal and view management
const currentView = ref('login')
const showWelcomeBack = ref(false)
const existingUserData = ref(null)
const isChecking = ref(true)

// Registration fields for the specific app form
const registrationFields = [
  {
    name: 'email',
    label: 'Email',
    type: 'email',
    placeholder: 'Enter your email'
  },
  {
    name: 'password',
    label: 'Password',
    type: 'password',
    placeholder: 'Enter your password'
  },
  {
    name: 'lastname',
    label: 'Прізвище',
    type: 'text',
    placeholder: 'Вкажіть своє прізвище'
  },
  {
    name: 'firstname',
    label: 'Ім\'я',
    type: 'text',
    placeholder: 'Вкажіть своє ім\'я'
  },
  {
    name: 'age',
    label: 'Вік',
    type: 'number',
    placeholder: 'Вкажіть свій вік'
  },
  {
    name: 'gender',
    label: 'Стать',
    type: 'select',
    placeholder: 'Оберіть свою стать',
    options: [
      { label: 'Чоловік', value: 'male' },
      { label: 'Жінка', value: 'female' },
      { label: 'Інше', value: 'other' },
    ]
  },
  {
    name: 'educationLevel',
    label: 'Рівень освіти',
    type: 'select',
    placeholder: 'Оберіть свій рівень освіти',
    options: [
      { label: 'Середня', value: 'average' },
      { label: 'Неповна вища', value: 'incomplete_higher' },
      { label: 'Вища', value: 'higher' },
    ]
  },
  {
    name: 'residentSince',
    label: 'Скільки ви мешкаєте у Вінниці',
    type: 'select',
    placeholder: 'Напишіть, скільки років ви проживаєте у місті',
    options: [
      { label: 'Менш як 1 рік', value: 'less_than_1_year' },
      { label: '1-5 років', value: '1_5_years' },
      { label: '5-10 років', value: '5_10_years' },
      { label: 'Понад 10 років', value: 'more_than_10_years' },
    ]
  },
  {
    name: 'residentNearRiverSince',
    label: 'Ви живете біля річки Тяжилівка',
    type: 'select',
    placeholder: 'Оберіть, чи живете ви біля річки Тяжилівка',
    options: [
      { label: 'Так', value: 'yes' },
      { label: 'Ні', value: 'no' },
      { label: 'Вперше чую про неї', value: 'unfamiliar' },
    ]
  }
]

// Handle welcome back modal close
const handleWelcomeBackClose = () => {
  showWelcomeBack.value = false
  emit('close')
}

// Handle successful login from LoginForm component
const handleLoginSuccess = async (user) => {
  try {
    // Look up user data in Firestore
    const usersRef = collection(db, 'users')
    const q = query(usersRef, where('uid', '==', user.uid))
    const querySnapshot = await getDocs(q)
    
    if (!querySnapshot.empty) {
      // User exists, show welcome back modal
      const userData = querySnapshot.docs[0].data()
      console.log('Found existing user:', userData)
      existingUserData.value = userData
      userStore.setUserData({
        userId: userData.uid || userData.userId,
        ...userData
      })
      showWelcomeBack.value = true
    } else {
      console.log('User authenticated but no data found')
      userStore.setUserData({
        userId: user.uid,
        uid: user.uid,
        email: user.email
      })
      emit('close')
    }
  } catch (error) {
    console.error('Error handling login success:', error)
  }
}

// Handle successful registration from RegisterForm component
const handleRegisterSuccess = async (user, formData) => {
  try {
    // Transform form data to match your database structure
    const userData = {
      uid: user.uid,
      email: formData.email,
      name: {
        lastname: formData.lastname,
        firstname: formData.firstname,
      },
      age: parseInt(formData.age),
      gender: formData.gender,
      'education level': formData.educationLevel,
      'city resident': formData.residentSince,
      'river resident': formData.residentNearRiverSince,
      isAnonymous: false,
    }

    // Save to Firestore
    const docId = await saveUserData(userData)
    
    if (docId) {
      userStore.setUserData({
        ...formData,
        uid: user.uid,
      })
      console.log('User registered and data saved:', docId)
      emit('close')
    }
  } catch (error) {
    console.error('Error handling user registration:', error)
  }
}

// Toggle between login and signup modes
const switchToLogin = () => {
  currentView.value = 'login'
}

const switchToRegister = () => {
  currentView.value = 'register'
}

// Toggle between login and forgot password views
const switchToForgotPassword = () => {
  currentView.value = 'forgot-password'
}

const handlePasswordResetSuccess = () => {
  currentView.value = 'login'
}

// watch for visibility changes
watch(
  () => props.isVisible,
  (newValue) => {
    console.log('Modal visibility changed:', newValue)
    if (newValue) {
      console.log('Modal is now visible, checking persistent cookie')
      checkPersistentCookie()
    } else {
      // Reset state when modal closes
      currentView.value = 'login'
      showWelcomeBack.value = false
      existingUserData.value = null
    }
  }
)
</script>

<template>
  <div>
    <!-- Welcome Back Modal -->
    <WelcomeBackModal
      v-if="showWelcomeBack"
      :user-data="existingUserData"
      @close="handleWelcomeBackClose"
    />

    <!-- Main Auth Modal -->
    <UCard
      v-if="isVisible && !isChecking && !showWelcomeBack"
      class="registration-card max-w-[90vw] w-[500px] max-h-[90vh] overflow-y-auto z-50 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rounded-xl shadow-xl scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100 dark:bg-black"
    >
      <div class="p-6">
        <!-- Login Form -->
        <UserManagementLoginForm
          v-if="currentView === 'login'"
          title="Login"
          subtitle="Login to your account"
          :show-forgot-password="true"
          @success="handleLoginSuccess"
          @switch-to-register="switchToRegister"
          @forgot-password="switchToForgotPassword"
        />

        <!-- Register Form -->
        <UserManagementRegisterForm
          v-else-if="currentView === 'register'"
          title="реєстрація"
          subtitle="Щоб взяти участь у Гуртома́, дайте відповіді на запитання"
          :fields="registrationFields"
          :schema="registrationSchema"
          button-text="перейти до карти"
          @success="handleRegisterSuccess"
          @switch-to-login="switchToLogin"
        />

        <!-- Password Reset Form -->
        <UserManagementPasswordReset
          v-else-if="currentView === 'forgot-password'"
          @success="handlePasswordResetSuccess"
          @back-to-login="switchToLogin"
        />
      </div>

      <template #footer>
        <p v-if="currentView === 'register'" class="text-xs text-slate-400 px-4 py-3 md:px-6 leading-tight">
          Беручи участь у цьому опитуванні, ви погоджуєтесь на збір, обробку та
          використання ваших відповідей у дослідницьких цілях відповідно до
          чинного законодавства України. Ваші персональні дані залишаються
          конфіденційними та не передаватимуться третім особам без вашої згоди,
          за винятком випадків, передбачених законом. Зверніть увагу, що надані
          вами медіафайли чі коментарі можуть бути опубліковані для загального
          доступу. Участь у дослідженні є добровільною, і ви можете припинити її
          у будь-який момент.
        </p>
      </template>
    </UCard>
  </div>
</template>