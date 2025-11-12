<template>
  <UModal v-model="isOpen" :ui="{ width: 'w-96' }">
    <UCard class="p-6 dark:bg-black">
      <UButton
        v-for="(item, index) in menuItems"
        :key="index"
        block
        color="white"
        variant="solid"
        :icon="item.icon"
        class="dark:bg-black dark:text-white text-lg font-semibold rounded-full py-3 my-3"
        @click="handleItemClick(item)"
      >
        {{ item.label }}
      </UButton>
      <UButton
        block
        color="red"
        variant="solid"
        icon="i-heroicons-arrow-right-on-rectangle"
        class="dark:bg-red-700 text-white text-lg font-semibold rounded-full py-3 my-3"
        @click="handleLogout"
      >
        Logout
      </UButton>
    </UCard>
  </UModal>

  <SupportModal v-model="showSupportModal" />
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'nuxt/app'
import SupportModal from './SupportModal.vue'
import { getAuth, signOut } from 'firebase/auth'
import { useUserStore } from '@base/stores/user'

const router = useRouter()
const showSupportModal = ref(false)
const auth = getAuth()
const userStore = useUserStore()

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true,
  },
})

const emit = defineEmits(['update:modelValue', 'select'])

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

const menuItems = [
  {
    label: 'Головна',
    action: 'home',
  },
  {
    label: 'Про нас',
    action: 'about',
  },
  {
    label: 'Підтримка',
    action: 'help',
  },
  {
    label: 'Результати',
    action: 'results',
  },
  {
    label: 'Heat Map',
    action: 'heatmap',
  },
  {
    label: 'Profile',
    action: 'profile',
    icon: 'i-heroicons-user-circle'
  }
]

const closeModal = () => {
  isOpen.value = false
}

const handleItemClick = (item) => {
  closeModal()

  switch (item.action) {
    case 'home':
        router.push('/')
      break
    case 'about':
        router.push('/about')
      break
    case 'help':
      showSupportModal.value = true
      break
    case 'heatmap':
      router.push('/heatmap')
      break
    case 'results':
      router.push('/result')
      break
    case 'profile':
      router.push('/profile')
      break
  }

  emit('select', item.action)
}

const handleLogout = async () => {
  try {
    await signOut(auth)
    console.log('User logged out successfully')
    closeModal()
    userStore.logoutUser()
    router.push('/')
  } catch (error) {
    console.error('Error signing out:', error)
  }
}

</script>