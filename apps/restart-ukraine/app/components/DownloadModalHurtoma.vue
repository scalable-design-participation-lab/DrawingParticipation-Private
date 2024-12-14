<template>
  <UModal v-model="isOpen" :ui="{ width: 'sm:max-w-lg' }">
    <UCard class="dark:bg-black">
      <template #header>
        <div class="flex place-content-center">
          <h3 class="text-xl font-semibold">Доступ до відкритих даних</h3>
          <!-- <UButton
            color="gray"
            variant="ghost"
            icon="i-heroicons-x-mark-20-solid"
            @click="closeModal"
          /> -->
        </div>
      </template>

      <p class="text-center leading-tight">
        Ми працюємо над тим, щоб дані, створені на платформі, стали відкритими та доступними для всіх. Повертайтеся незабаром, щоб перевірити оновлення.
      </p>

      <div class="flex justify-center my-8 mb-4">
        <UButton
          color="black"
          class="px-6 py-3 rounded-full hover:bg-gray-300 hover:text-black dark:hover:bg-zinc-700 dark:hover:text-white"
          @click="closeModal"
        >
        Повернутися до карти
        </UButton>
      </div>

      <!-- <div class="space-y-6 px-1">
        <div class="space-y-2">
          <label class="font-medium text-gray-700">Select Data Type:</label>
          <USelect
            v-model="selectedDataType"
            :options="dataTypes"
            placeholder="Choose data type"
          />
        </div>

        <div class="space-y-2">
          <label class="font-medium text-gray-700">File Format:</label>
          <div class="flex gap-4 mt-2">
            <URadio
              v-for="format in fileFormats"
              :key="format.value"
              v-model="fileFormat"
              :name="format.value"
              :label="format.label"
              :value="format.value"
            />
          </div>
        </div>

        <div class="flex justify-end space-x-3 pt-4">
          <UButton color="gray" variant="soft" @click="closeModal">
            Cancel
          </UButton>
          <UButton
            color="primary"
            :loading="isLoading"
            :disabled="!isFormValid"
            @click="handleDownload"
          >
            <template #leading>
              <UIcon name="i-heroicons-arrow-down-tray-20-solid" />
            </template>
            Download
          </UButton>
        </div> 
      </div> -->
    </UCard>
  </UModal>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
// import { getFirestore, collection, getDocs } from 'firebase/firestore'
// import { useFirebaseApp } from 'vuefire'

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true,
  },
})

const emit = defineEmits(['update:modelValue'])

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

// const selectedDataType = ref('')
// const fileFormat = ref('json')
// const isLoading = ref(false)

// const dataTypes = [
//   { label: 'All Data', value: 'all' },
//   { label: 'Space Data', value: 'space' },
//   { label: 'Belonging Data', value: 'belonging' },
//   { label: 'Safety Data', value: 'safety' },
//   { label: 'Environment Data', value: 'environment' },
// ]

// const fileFormats = [
//   { label: 'JSON', value: 'json' },
//   { label: 'CSV', value: 'csv' },
// ]

// const isFormValid = computed(() => {
//   return selectedDataType.value && fileFormat.value
// })

const closeModal = () => {
  isOpen.value = false
  selectedDataType.value = ''
  fileFormat.value = 'json'
}

const convertToCSV = (data: any) => {
  const items: any[] = []

  Object.entries(data).forEach(([projectId, projectData]: [string, any]) => {
    Object.entries(projectData).forEach(
      ([category, categoryData]: [string, any]) => {
        Object.entries(categoryData).forEach(
          ([type, points]: [string, any]) => {
            if (Array.isArray(points)) {
              points.forEach((point: any) => {
                items.push({
                  project_id: projectId,
                  category,
                  type,
                  longitude: point.lon,
                  latitude: point.lat,
                  comment: point.comment || '',
                  timestamp: point.timestamp || '',
                })
              })
            }
          },
        )
      },
    )
  })

  if (items.length === 0) {
    return 'No data available'
  }

  const header = [
    'Project ID',
    'Category',
    'Type',
    'Longitude',
    'Latitude',
    'Comment',
    'Timestamp',
  ]

  const rows = items.map((item) => [
    item.project_id,
    item.category,
    item.type,
    item.longitude,
    item.latitude,
    item.comment ? `"${item.comment.replace(/"/g, '""')}"` : '',
    item.timestamp ? `"${item.timestamp}"` : '',
  ])

  return [header.join(','), ...rows.map((row) => row.join(','))].join('\n')
}

const handleDownload = async () => {
  if (!isFormValid.value) return

  isLoading.value = true
  try {
    const app = useFirebaseApp()
    const db = getFirestore(app)
    const projectsCollection = collection(db, 'projects')
    const querySnapshot = await getDocs(projectsCollection)

    let downloadData: Record<string, any> = {}
    querySnapshot.forEach((doc) => {
      const data = doc.data()
      if (selectedDataType.value === 'all') {
        downloadData[doc.id] = data
      } else {
        downloadData[doc.id] = {
          [selectedDataType.value]: data[selectedDataType.value] || {},
        }
      }
    })

    if (Object.keys(downloadData).length === 0) {
      throw new Error('No data available for download')
    }

    const content =
      fileFormat.value === 'json'
        ? JSON.stringify(downloadData, null, 2)
        : convertToCSV(downloadData)

    const blob = new Blob([content], {
      type: fileFormat.value === 'json' ? 'application/json' : 'text/csv',
    })

    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    const timestamp = new Date().toISOString().split('T')[0]
    link.setAttribute(
      'download',
      `ukraine-data-${selectedDataType.value}-${timestamp}.${fileFormat.value}`,
    )
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)

    closeModal()
  } catch (error) {
    console.error('Download failed:', error)
  } finally {
    isLoading.value = false
  }
}
</script>
