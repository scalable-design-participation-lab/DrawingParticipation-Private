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
          реєстрація
        </h3>
      </template>

      <p class="mb-4 px-6 leading-tight">
        Щоб взяти участь у Гуртома́, дайте відповіді на запитання
      </p>

      <UForm
        :state="formState"
        class="space-y-3 md:space-y-4 px-4 md:px-6"
        @submit="onSubmit"
      >
        <UFormGroup label="Прізвище" name="lastname">
          <UInput
            v-model="formState.lastname"
            placeholder="Вкажіть своє прізвище"
            color="blue"
            variant="outline"
            size="md"
          />
        </UFormGroup>
        <UFormGroup label="Ім'я" name="firstname">
          <UInput
            v-model="formState.firstname"
            placeholder="Вкажіть своє ім'я"
            color="blue"
            variant="outline"
            size="md"
          />
        </UFormGroup>
        <UFormGroup label="Вік" name="age">
          <UInput
            v-model="formState.age"
            type="number"
            placeholder="Вкажіть свій вік"
            color="blue"
            variant="outline"
            size="md"
          />
        </UFormGroup>
        <UFormGroup label="Стать" name="gender">
          <USelect
            v-model="formState.gender"
            :options="genderOptions"
            placeholder="Оберіть свою стать"
            color="blue"
            variant="outline"
            size="md"
          />
        </UFormGroup>
        <UFormGroup label="Рівень освіти" name="educationLevel">
          <USelect
            v-model="formState.educationLevel"
            :options="educationOptions"
            placeholder="Оберіть свій рівень освіти"
            color="blue"
            variant="outline"
            size="md"
          />
        </UFormGroup>
        <UFormGroup label="Скільки ви мешкаєте у Вінниці" name="residentSince">
          <USelect
            v-model="formState.residentCity"
            :options="residentCityOptions"
            placeholder="Напишіть, скільки років ви проживаєте у місті"
            color="blue"
            variant="outline"
            size="md"
          />
        </UFormGroup>
        <UFormGroup
          label="Ви живете біля річки Тяжилівка"
          name="residentNearRiverSince"
        >
          <USelect
            v-model="formState.residentRiver"
            :options="residentRiverOptions"
            placeholder="Оберіть, чи живете ви біля річки Тяжилівка"
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
            перейти до карти
          </UButton>
        </div>
      </UForm>

      <template #footer>
        <p class="text-xs text-slate-400 px-4 py-3 md:px-6 leading-tight">
          Беручи участь у цьому опитуванні, ви погоджуєтесь на збір, обробку та
          використання ваших відповідей у дослідницьких цілях відповідно до
          чинного законодавства України. Ваші персональні дані залишаються
          конфіденційними та не передаватимуться третім особам без вашої згоди,
          за винятком випадків, передбачених законом. Зверніть увагу, що надані
          вами медіафайли чи коментарі можуть бути опубліковані для загального
          доступу. Участь у дослідженні є добровільною, і ви можете припинити її
          у будь-який момент.
        </p>
      </template>
    </UCard>
  </div>
</template>

<script setup>
import { ref, reactive, watch } from 'vue'
import { useMapUIStore } from '../stores/mapUI'
import { getAuth, signInAnonymously } from 'firebase/auth'
import { useFirestore } from 'vuefire'
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore'

const auth = getAuth()
const props = defineProps({
  isVisible: Boolean,
})

const emit = defineEmits(['close'])

const mapUIStore = useMapUIStore()
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
  residentCity: '',
  residentRiver: '',
})

const genderOptions = [
  { label: 'Чоловік', value: 'male' },
  { label: 'Жінка', value: 'female' },
  { label: 'Інше', value: 'other' },
]

const educationOptions = [
  { label: 'Середня', value: 'average' },
  { label: 'Неповна вища', value: 'incomplete_higher' },
  { label: 'Вища', value: 'higher' },
]

const residentCityOptions = [
  { label: 'Менш як 1 рік', value: 'less_than_1_year' },
  { label: '1-5 років', value: '1_5_years' },
  { label: '5-10 років', value: '5_10_years' },
  { label: 'Понад 10 років', value: 'more_than_10_years' },
]

const residentRiverOptions = [
  { label: 'Так', value: 'yes' },
  { label: 'Ні', value: 'no' },
  { label: 'Вперше чую про неї', value: 'unfamiliar' },
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
      mapUIStore.setUserData(userData)
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
      'city resident': formState.residentCity,
      'river resident': formState.residentRiver,
      createdAt: new Date(),
      isAnonymous: true,
    })

    console.log('User data saved to Firestore:', {
      docId: docRef.id,
      uid: user.uid,
      name: `${formState.firstname} ${formState.lastname}`,
    })

    mapUIStore.setUserData({
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
