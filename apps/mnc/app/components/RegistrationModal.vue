<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
import { getAuth, signInAnonymously } from 'firebase/auth'
import { useFirestore } from 'vuefire'
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore'
import { useUserStore } from '@base/stores/user'
import { number, object, string, type InferType } from 'yup'

// https://ui.nuxt.com/components/form
const schema = object({
  lastname: string().required('Last name is required'),
  firstname: string().required('First name is required'),
  age: number()
    .required('Age is required')
    .typeError('Age must be a number')
    .positive('Age must be a positive number')
    .integer('Age must be a whole number'),
  gender: string()
    .required('Gender is required')
    .oneOf(['male', 'female', 'other'], 'Please select a valid gender'),
  educationLevel: string()
    .required('Education level is required')
    .oneOf(['average', 'incomplete_higher', 'higher'], 'Please select a valid education level'),
  residentSince: string()
    .required('Length of residence in Vinnytsia is required')
    .oneOf(['less_than_1_year', '1_5_years', '5_10_years', 'more_than_10_years'], 'Please select a valid option'),
  residentNearRiverSince: string()
    .required('This question is required')
    .oneOf(['yes', 'no', 'unfamiliar'], 'Please select a valid option'),
})
type Schema = InferType<typeof schema>

const auth = getAuth()
const props = defineProps({
  isVisible: Boolean,
})

const emit = defineEmits(['close'])

const userStore = useUserStore()
const db = useFirestore()

// Add state for welcome back modal
const showWelcomeBack = ref(false)
const existingUserData = ref(null)
const isChecking = ref(true)

const formState = reactive({
  lastname: '',
  firstname: '',
  age: '',
  gender: '',
  educationLevel: '',
  residentSince: '',
  residentNearRiverSince: '',
})

const genderOptions = [
  { label: 'Male', value: 'male' },
  { label: 'Female', value: 'female' },
  { label: 'Other', value: 'other' },
]

const educationOptions = [
  { label: 'High School', value: 'average' },
  { label: 'Some College', value: 'incomplete_higher' },
  { label: 'Higher Education', value: 'higher' },
]

const residentCityOptions = [
  { label: 'Less than 1 year', value: 'less_than_1_year' },
  { label: '1-5 years', value: '1_5_years' },
  { label: '5-10 years', value: '5_10_years' },
  { label: 'More than 10 years', value: 'more_than_10_years' },
]

const residentRiverOptions = [
  { label: 'Yes', value: 'yes' },
  { label: 'No', value: 'no' },
  { label: 'First time hearing about it', value: 'unfamiliar' },
]

// Handle welcome back modal close
const handleWelcomeBackClose = () => {
  showWelcomeBack.value = false
  emit('close')
}

// Check if user exists in database
const checkExistingUser = async () => {
  try {
    const userCredential = await signInAnonymously(auth)
    const user = userCredential.user

    console.log('Current user UID:', user.uid)

    const usersRef = collection(db, 'users')
    const q = query(usersRef, where('uid', '==', user.uid))
    const querySnapshot = await getDocs(q)

    if (!querySnapshot.empty) {
      // User exists, show welcome back modal
      const userData = querySnapshot.docs[0].data()
      console.log('Found existing user:', userData)
      existingUserData.value = userData
      userStore.setUserData(userData)
      showWelcomeBack.value = true
      emit('close')
    } else {
      console.log('No existing user found with UID:', user.uid)
    }
    isChecking.value = false
  } catch (error) {
    console.error('Error checking user:', error)
    isChecking.value = false
  }
}

// Original onSubmit function
const onSubmit = async () => {
  try {
    const userCredential = await signInAnonymously(auth)
    const user = userCredential.user

    console.log('Anonymous authentication successful:', {
      uid: user.uid,
      isAnonymous: user.isAnonymous,
      creationTime: user.metadata.creationTime,
    })

    const usersCollection = collection(db, 'users')
    const docRef = await addDoc(usersCollection, {
      uid: user.uid,
      name: {
        lastname: formState.lastname,
        firstname: formState.firstname,
      },
      age: parseInt(formState.age),
      gender: formState.gender,
      'education level': formState.educationLevel,
      'city resident': formState.residentSince,
      'river resident': formState.residentNearRiverSince,
      createdAt: new Date(),
      isAnonymous: true,
    })

    console.log('User data saved to Firestore:', {
      docId: docRef.id,
      uid: user.uid,
      name: `${formState.firstname} ${formState.lastname}`,
    })

    userStore.setUserData({
      ...formState,
      uid: user.uid,
    })
    emit('close')
  } catch (error) {
    console.error('Authentication error:', {
      code: error.code,
      message: error.message,
      stack: error.stack,
    })
  }
}

// Watch for visibility changes
watch(
  () => props.isVisible,
  (newValue) => {
    if (newValue) {
      checkExistingUser()
    }
  },
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

    <!-- Registration Form -->
    <UCard
      v-if="isVisible && !isChecking && !showWelcomeBack"
      class="registration-card max-w-[90vw] w-[500px] max-h-[90vh] overflow-y-auto z-50 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rounded-xl shadow-xl scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100 dark:bg-black"
    >
      <template #header>
        <h3 class="text-xl md:text-2xl font-semibold text-center">
          Registration
        </h3>
      </template>

      <p class="mb-4 px-6 leading-tight">
        To participate in Hurtoma, please answer the following questions
      </p>

      <UForm
        :schema="schema"
        :state="formState"
        class="space-y-3 md:space-y-4 px-4 md:px-6"
        @submit="onSubmit"
      >
        <UFormGroup label="Last Name" name="lastname">
          <UInput
            v-model="formState.lastname"
            placeholder="Enter your last name"
            color="blue"
            variant="outline"
            size="md"
          />
        </UFormGroup>
        <UFormGroup label="First Name" name="firstname">
          <UInput
            v-model="formState.firstname"
            placeholder="Enter your first name"
            color="blue"
            variant="outline"
            size="md"
          />
        </UFormGroup>
        <UFormGroup label="Age" name="age">
          <UInput
            v-model="formState.age"
            type="number"
            placeholder="Enter your age"
            color="blue"
            variant="outline"
            size="md"
          />
        </UFormGroup>
        <UFormGroup label="Gender" name="gender">
          <USelect
            v-model="formState.gender"
            :options="genderOptions"
            placeholder="Select your gender"
            color="blue"
            variant="outline"
            size="md"
          />
        </UFormGroup>
        <UFormGroup label="Education Level" name="educationLevel">
          <USelect
            v-model="formState.educationLevel"
            :options="educationOptions"
            placeholder="Select your education level"
            color="blue"
            variant="outline"
            size="md"
          />
        </UFormGroup>
        <UFormGroup label="How long have you lived in Vinnytsia" name="residentSince">
          <USelect
            v-model="formState.residentSince"
            :options="residentCityOptions"
            placeholder="Enter how many years you have lived in the city"
            color="blue"
            variant="outline"
            size="md"
          />
        </UFormGroup>
        <UFormGroup
          label="Do you live near the Tyazhylivka River"
          name="residentNearRiverSince"
        >
          <USelect
            v-model="formState.residentNearRiverSince"
            :options="residentRiverOptions"
            placeholder="Select whether you live near the Tyazhylivka River"
            color="blue"
            variant="outline"
            size="md"
          />
        </UFormGroup>

        <div class="flex justify-center">
          <UButton
            type="submit"
            color="black"
            class="my-2 px-6 py-3 rounded-full hover:bg-gray-300 hover:text-black dark:hover:bg-zinc-700 dark:hover:text-white"
          >
            Go to Map
          </UButton>
        </div>
      </UForm>

      <template #footer>
        <p class="text-xs text-slate-400 px-4 py-3 md:px-6 leading-tight">
          By participating in this survey, you agree to the collection, processing, and use of your responses for research purposes in accordance with current Ukrainian legislation. Your personal data remains confidential and will not be shared with third parties without your consent, except as required by law. Please note that media files or comments you provide may be published for public access. Participation in the research is voluntary, and you can discontinue it at any time.
        </p>
      </template>
    </UCard>
  </div>
</template>