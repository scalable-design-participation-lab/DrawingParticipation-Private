<template>
  <UModal v-model="isOpen" :ui="{ width: 'md:max-w-xl' }">
    <UCard>
      <template #header>
          <h3 class="flex place-content-center text-xl font-semibold">Thank you for participating!</h3>
      </template>

      <div class="space-y-4">
        <p>
          Thank you for participating in the survey. Thanks to you, we are one step closer to renovating the area around the Tyazhylivka River.
        </p>
        <p>Invite your friends to register on the platform and view the results of other participants.</p>
      </div>

      <template #footer>
        <div class="flex place-content-center gap-2">
          <UButton color="black" variant="solid" class="rounded-full px-6 py-3" @click="viewResults">
            View Results
          </UButton>
        </div>
      </template>
    </UCard>
  </UModal>
</template>

<script setup lang="ts">
import {computed} from "vue"

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:modelValue'])
const router = useRouter()

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

function viewResults() {
  isOpen.value = false
  router.push({
    path: '/result',
    query: { showIntro: 'false' },
  })
}
</script>
