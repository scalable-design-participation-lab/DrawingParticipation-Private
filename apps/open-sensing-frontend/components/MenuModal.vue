<template>
  <UModal v-model="isOpen" :ui="{ width: 'w-96' }">
    <div class="space-y-3 p-6">
      <UButton
        v-for="(item, index) in menuItems"
        :key="index"
        block
        color="white"
        variant="solid"
        :icon="item.icon"
        class="dark:bg-slate-950 dark:text-white text-lg font-semibold rounded-full py-3"
        @click="handleItemClick(item)"
      >
        {{ item.label }}
      </UButton>
    </div>
  </UModal>

  <AboutPopup v-model="showAboutPopup" />
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import AboutPopup from './AboutPopup.vue'

const router = useRouter()
const showAboutPopup = ref(false)

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

const allItems = [
  {
    label: 'Dashboard',
    endpoint: '/',
    action: 'home',
  },
  {
    label: 'About',
    endpoint: '/about',
    action: 'about',
  },
  {
    label: 'Help',
    action: 'help',
  },
]

const currentRoute = computed(() =>
  router.currentRoute.value.path.toLowerCase()
)

const menuItems = computed(() => {
  return allItems.filter((item) => {
    // Skip check if item has no endpoint
    if (!item.endpoint) return true

    // Filter out the current route
    return item.endpoint.toLowerCase() !== currentRoute.value
  })
})

const closeModal = () => {
  isOpen.value = false
}

const handleItemClick = (item) => {
  closeModal()

  const isOnMapPage = router.currentRoute.value.path === '/map'

  switch (item.action) {
    case 'home':
      if (isOnMapPage) {
        router.push('/').then(() => window.location.reload())
      } else {
        router.push('/')
      }
      break
    case 'about':
      if (isOnMapPage) {
        router.push('/about').then(() => window.location.reload())
      } else {
        router.push('/about')
      }
      break
    case 'help':
      showAboutPopup.value = true
      break
    case 'results':
      router.push('/')
      break
  }

  emit('select', item.action)
}
</script>
