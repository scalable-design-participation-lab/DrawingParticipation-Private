<template>
  <UCard
    v-if="isOpen"
    class="min-w-48 max-w-72 shadow-lg text-black dark:text-white"
  >
    <template #header>
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <h3 class="font-medium">
            {{ getFeatureTitle(feature) }}
          </h3>
        </div>
        <div class="flex items-center gap-2">
          <UAvatar
            v-if="feature?.name?.firstname"
            :alt="feature.name.firstname"
            size="sm"
          />
          <UButton
            icon="i-heroicons-x-mark"
            color="black"
            variant="ghost"
            size="xs"
            @click="closeModal"
          />
        </div>
      </div>

      <div class="text-xs text-gray-500 dark:text-gray-300">
        <span v-if="feature?.timestamp">
          {{ formatDate(feature.timestamp) }}
        </span>
      </div>
    </template>

    <div>
      <p v-if="feature?.comment?.length > 0" class="text-sm">
        {{ feature.comment }}
      </p>
      <p v-else class="text-sm text-gray-700 dark:text-white italic">
        Ще ніхто не залишив коментарів для цієї локації.
      </p>
    </div>
  </UCard>
</template>

<script setup lang="ts">
import { watch, computed } from 'vue'

interface Name {
  firstname: string
  lastname: string
}

interface Feature {
  id?: string
  type: string
  coordinates: number[]
  comment?: string
  iconName?: string
  frequency?: string
  name?: Name
  timestamp?: string
  isProhibit?: boolean
}

const props = defineProps<{
  modelValue: boolean
  feature: Feature | null
}>()

const emit = defineEmits(['update:modelValue'])

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

const getOverlayPosition = computed(() => {
  if (!props.feature) return [0, 0]

  switch (props.feature.type) {
    case 'Point':
      return props.feature.coordinates
    case 'Polygon':
      const coords = props.feature.coordinates[0]
      const sumX = coords.reduce((sum, coord) => sum + coord[0], 0)
      const sumY = coords.reduce((sum, coord) => sum + coord[1], 0)
      return [sumX / coords.length, sumY / coords.length]
    case 'LineString':
      return props.feature.coordinates[props.feature.coordinates.length - 1]
    default:
      return [0, 0]
  }
})

function formatDate(timestamp: string): string {
  if (!timestamp) return ''
  return new Date(timestamp).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function getFeatureTitle(feature: Feature | null) {
  if (!feature) return 'Деталі локації'

  if (feature.isProhibit) {
    return 'Заборонена зона'
  }

  if (feature.iconName) {
    // Convert iconName to display name in Ukrainian
    const iconDisplayNames = {
      pollution: 'Точка забруднення',
      leaf: 'Зелена зона',
      'flora-fauna': 'Флора та фауна',
      lock: 'Безпечна зона',
      great: 'Дуже безпечна зона',
      calm: 'Спокійна зона',
      safe: 'Безпечна територія',
      broken: 'Небезпечна зона',
      unsafe: 'Небезпечна територія',
      dislike: 'Не подобається',
      negative: 'Негативне',
      heart: 'Улюблене',
      love: 'Улюблене місце',
      smile: 'Щасливе місце',
      positive: 'Позитивне',
      trash: 'Сміття',
    }
    return iconDisplayNames[feature.iconName] || 'Локація'
  } else if (feature.frequency) {
    // Convert frequency to display name in Ukrainian
    const frequencyDisplayNames = {
      'every day': 'Щоденне відвідування',
      everyday: 'Щоденне відвідування',
      'every week': 'Щотижневе відвідування',
      everyweek: 'Щотижневе відвідування',
      sometimes: 'Випадкове відвідування',
      'only once': 'Одноразове відвідування',
      once: 'Одноразове відвідування',
      never: 'Ніколи не відвідував',
    }
    return frequencyDisplayNames[feature.frequency] || 'Локація'
  }

  return 'Деталі локації'
}

function closeModal() {
  emit('update:modelValue', false)
}
</script>

<style scoped>
.space-y-2 > * + * {
  margin-top: 0.5rem;
}

.space-y-1 > * + * {
  margin-top: 0.25rem;
}
</style>
