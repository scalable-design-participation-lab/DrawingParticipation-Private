<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'nuxt/app'
import { useUserStore } from '@base/stores/user'
import UserProfile, { type FormFieldConfig, type TabConfig } from '@base/components/UserManagement/UserProfile.vue'
import { useFirebaseProfile } from '@base/composables/useFirebaseProfile'
import { getAuth } from 'firebase/auth'

const router = useRouter()
const userStore = useUserStore()
const { 
  isLoading, 
  error, 
  success, 
  loadUserProfile, 
  watchAuthState, 
  updateUserProfile, 
  deleteUserAccount,
  clearMessages 
} = useFirebaseProfile()

const auth = getAuth()
const userData = ref<any>(null)
const unsubscribe = ref<(() => void) | null>(null)

// Form field configuration
const formFields: FormFieldConfig[] = [
  {
    name: 'email',
    label: 'Email',
    type: 'email',
    placeholder: 'Введіть свій email',
    disabled: true,
  },
  {
    name: 'name.lastname',
    label: 'Прізвище',
    type: 'text',
    placeholder: 'Вкажіть своє прізвище',
  },
  {
    name: 'name.firstname',
    label: "Ім'я",
    type: 'text',
    placeholder: "Вкажіть своє ім'я",
  },
  {
    name: 'age',
    label: 'Вік',
    type: 'number',
    placeholder: 'Вкажіть свій вік',
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
    ],
  },
  {
    name: 'education level',
    label: 'Рівень освіти',
    type: 'select',
    placeholder: 'Оберіть свій рівень освіти',
    options: [
      { label: 'Середня', value: 'average' },
      { label: 'Неповна вища', value: 'incomplete_higher' },
      { label: 'Вища', value: 'higher' },
    ],
  },
  {
    name: 'city resident',
    label: 'Скільки ви мешкаєте у Вінниці',
    type: 'select',
    placeholder: 'Напишіть, скільки років ви проживаєте у місті',
    options: [
      { label: 'Менш як 1 рік', value: 'less_than_1_year' },
      { label: '1-5 років', value: '1_5_years' },
      { label: '5-10 років', value: '5_10_years' },
      { label: 'Понад 10 років', value: 'more_than_10_years' },
    ],
  },
  {
    name: 'river resident',
    label: 'Ви живете біля річки Тяжилівка',
    type: 'select',
    placeholder: 'Оберіть, чи живете ви біля річки Тяжилівка',
    options: [
      { label: 'Так', value: 'yes' },
      { label: 'Ні', value: 'no' },
      { label: 'Вперше чую про неї', value: 'unfamiliar' },
    ],
  },
]

// Tabs configuration
const tabs: TabConfig[] = [
  { key: 'profile', label: 'Edit Profile' },
  { key: 'markings', label: 'My Markings' },
]

const activeTab = ref('profile')

// Form data formatter - transforms form state to nested structure
const formDataFormatter = (data: Record<string, any>) => {
  // Handle both flat (name.lastname) and nested (name: { lastname }) structures
  const formatted: Record<string, any> = {
    email: data.email,
    name: {
      lastname: data['name.lastname'] || data.name?.lastname || '',
      firstname: data['name.firstname'] || data.name?.firstname || '',
    },
    age: data.age ? parseInt(data.age) : undefined,
    gender: data.gender || '',
    'education level': data['education level'] || '',
    'city resident': data['city resident'] || '',
    'river resident': data['river resident'] || '',
    isAnonymous: false,
  }
  return formatted
}

// Handle profile update
const handleProfileUpdate = async (data: Record<string, any>) => {
  clearMessages()
  
  if (data.error) {
    return
  }

  const formattedData = formDataFormatter(data)
  const success = await updateUserProfile(formattedData)
  
  if (success) {
    // Reload user data
    const currentUser = auth.currentUser
    if (currentUser) {
      const updatedData = await loadUserProfile(currentUser.uid)
      if (updatedData) {
        userData.value = updatedData
        userStore.setUserData(updatedData)
      }
    }
  }
}

// Handle account deletion
const handleAccountDelete = async (password: string) => {
  clearMessages()
  const success = await deleteUserAccount(password)
  
  if (success) {
    // Clear user store and redirect to home
    userStore.logoutUser()
    router.push('/')
  }
}

// Handle tab change
const handleTabChange = (tabKey: string) => {
  activeTab.value = tabKey
  
  if (tabKey === 'markings') {
    const uid = auth.currentUser?.uid
    router.push({ path: '/result', query: uid ? { uid } : {} })
    activeTab.value = 'profile'
  }
}

// Handle navigation back
const handleNavigationBack = () => {
  router.push('/')
}

// Load user data on mount
onMounted(() => {
  unsubscribe.value = watchAuthState(async (user, data) => {
    if (!user) {
      userData.value = null
      return
    }

    if (data) {
      // Transform data to match form field structure (support nested properties)
      userData.value = {
        email: data.email || user.email || '',
        name: {
          lastname: data.name?.lastname || '',
          firstname: data.name?.firstname || '',
        },
        age: data.age?.toString() || '',
        gender: data.gender || '',
        'education level': data['education level'] || '',
        'city resident': data['city resident'] || '',
        'river resident': data['river resident'] || '',
      }
    } else {
      userData.value = {
        email: user.email || '',
        name: {
          lastname: '',
          firstname: '',
        },
        age: '',
        gender: '',
        'education level': '',
        'city resident': '',
        'river resident': '',
      }
    }
  })
})

// Cleanup on unmount
onUnmounted(() => {
  if (unsubscribe.value) {
    unsubscribe.value()
  }
})
</script>

<template>
  <UserProfile
    :user-data="userData"
    :form-fields="formFields"
    :is-loading="isLoading"
    :error="error"
    :success="success"
    :show-tabs="true"
    :tabs="tabs"
    :active-tab="activeTab"
    :show-delete-account="true"
    :show-back-button="true"
    back-button-label="Back to Map"
    title="User Profile"
    subtitle="View and edit profile information"
    :form-data-formatter="formDataFormatter"
    @profile:update="handleProfileUpdate"
    @account:delete="handleAccountDelete"
    @tab:change="handleTabChange"
    @navigation:back="handleNavigationBack"
  />
</template>
