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
    </UCard>
  </UModal>

  <SupportModal v-model="showSupportModal" />
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import SupportModal from './SupportModal.vue'

const router = useRouter()
const showSupportModal = ref(false)

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
    label: 'Карта',
    action: 'home',
  },
  {
    label: 'Про проєкт',
    action: 'about',
  },
  {
    label: 'Допомога',
    action: 'help',
  },
  {
    label: 'Результати',
    action: 'results',
  },
]

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
      showSupportModal.value = true
      break
    case 'results':
      router.push('/map')
      break
  }

  emit('select', item.action)
}
</script>
