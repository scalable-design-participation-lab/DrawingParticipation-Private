<template>
  <UModal v-model="isOpen" :ui="{ width: 'sm:max-w-lg' }">
    <UCard class="dark:bg-black">
      <template #header>
        <div class="flex place-content-center">
          <h3 class="text-xl font-semibold">Доступ до відкритих даних</h3>
          <UButton
            color="gray"
            variant="ghost"
            icon="i-heroicons-x-mark-20-solid"
            @click="closeModal"
          />
        </div>
      </template>

      <!-- <p class="text-center leading-tight">
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
      </div> -->

      <div class="space-y-6 px-1">
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
      </div>
    </UCard>
  </UModal>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { getFirestore, collection, getDocs, doc } from 'firebase/firestore'
import { useFirebaseApp } from 'vuefire'

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

const selectedDataType = ref('')
const fileFormat = ref('json')
const isLoading = ref(false)

const dataTypes = [
  { label: 'All Project Data', value: 'all_projects' },
  { label: 'Space Data', value: 'space' },
  { label: 'Belonging Data', value: 'belonging' },
  { label: 'Safety Data', value: 'safety' },
  { label: 'Environment Data', value: 'environment' },
  { label: 'User Data', value: 'users' },
]

const fileFormats = [
  { label: 'JSON', value: 'json' },
  { label: 'CSV', value: 'csv' },
]

const isFormValid = computed(() => {
  return selectedDataType.value && fileFormat.value
})

const closeModal = () => {
  isOpen.value = false
  selectedDataType.value = ''
  fileFormat.value = 'json'
}

const convertToCSV = (data: any, dataType: string) => {
  const items: any[] = []

  if (dataType === 'users') {
    Object.entries(data).forEach(([userId, userData]: [string, any]) => {
      const createdAtTimestamp = userData.createdAt
      let formattedDate = ''
      
      if (createdAtTimestamp) {
        const seconds = createdAtTimestamp.seconds || 
                       (typeof createdAtTimestamp === 'string' ? 
                       parseInt(createdAtTimestamp.match(/seconds=(\d+)/)[1]) : 0)
        const nanoseconds = createdAtTimestamp.nanoseconds || 
                          (typeof createdAtTimestamp === 'string' ? 
                          parseInt(createdAtTimestamp.match(/nanoseconds=(\d+)/)[1]) : 0)
        
        const milliseconds = seconds * 1000 + nanoseconds / 1000000
        
        formattedDate = new Intl.DateTimeFormat('uk-UA', {
          timeZone: 'Europe/Kiev',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false
        }).format(new Date(milliseconds))
      }

      items.push({
        user_id: userId,
        firstname: userData.name?.firstname || '',
        lastname: userData.name?.lastname || '',
        age: userData.age || '',
        gender: userData.gender || '',
        education_level: userData['education level'] || '',
        city_resident: userData['city resident'] || '',
        river_resident: userData['river resident'] || '',
        is_anonymous: userData.isAnonymous || false,
        uid: userData.uid || '',
        created_at: formattedDate,
      })
    })

    if (items.length === 0) return 'No user data available'

    const header = [
      'User ID',
      'First Name',
      'Last Name',
      'Age',
      'Gender',
      'Education Level',
      'City Resident',
      'River Resident',
      'Created At',
      'Is Anonymous',
      'UID',
    ]

    const rows = items.map(item => [
      item.user_id,
      item.firstname,
      item.lastname,
      item.age,
      item.gender,
      item.education_level,
      item.city_resident,
      item.river_resident,
      item.created_at,
      item.is_anonymous,
      item.uid,
    ])

    return [
      header.join(','),
      ...rows.map(row => row.map(field => `"${field}"`).join(','))
    ].join('\n')
  } else {
    Object.entries(data).forEach(([projectId, projectData]: [string, any]) => {
      Object.entries(projectData).forEach(
        ([category, categoryData]: [string, any]) => {
          Object.entries(categoryData).forEach(
            ([type, points]: [string, any]) => {
              if (Array.isArray(points)) {
                points.forEach((point: any) => {
                  let formattedTimestamp = ''
                  
                  try {
                    if (point.timestamp) {
                      if (typeof point.timestamp === 'string') {
                        formattedTimestamp = new Date(point.timestamp).toLocaleString('uk-UA', {
                          timeZone: 'Europe/Kiev',
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                          hour12: false
                        })
                      } else if (point.timestamp.seconds) {
                        const milliseconds = point.timestamp.seconds * 1000 +
                          (point.timestamp.nanoseconds || 0) / 1000000
                        formattedTimestamp = new Date(milliseconds).toLocaleString('uk-UA', {
                          timeZone: 'Europe/Kiev',
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                          hour12: false
                        })
                      }
                    }
                  } catch (error) {
                    console.error('Error formatting timestamp:', error)
                    formattedTimestamp = ''
                  }

                  items.push({
                    project_id: projectId,
                    category,
                    type,
                    longitude: point.lon,
                    latitude: point.lat,
                    comment: point.comment || '',
                    timestamp: formattedTimestamp,
                  })
                })
              }
            },
          )
        },
      )
    })

    if (items.length === 0) return 'No project data available'

    const header = [
      'Project ID',
      'Category',
      'Type',
      'Longitude',
      'Latitude',
      'Comment',
      'Time (Ukraine)',
    ]

    const rows = items.map((item) => [
      item.project_id,
      item.category,
      item.type,
      item.longitude,
      item.latitude,
      item.comment ? `"${item.comment.replace(/"/g, '""')}"` : '',
      item.timestamp,
    ])

    return [header.join(','), ...rows.map((row) => row.join(','))].join('\n')
  }
}

const handleDownload = async () => {
  if (!isFormValid.value) return
  if (!import.meta.client) return

  isLoading.value = true
  try {
    const app = useFirebaseApp()
    const db = getFirestore(app)
    let downloadData: Record<string, any> = {}

    if (selectedDataType.value === 'users') {
      const usersCollection = collection(db, 'users')
      const querySnapshot = await getDocs(usersCollection)
      querySnapshot.forEach((doc) => {
        downloadData[doc.id] = doc.data()
      })
    } else {
      const projectsCollection = collection(db, 'projects')
      const querySnapshot = await getDocs(projectsCollection)
      querySnapshot.forEach((doc) => {
        const data = doc.data()
        if (selectedDataType.value === 'all_projects') {
          downloadData[doc.id] = data
        } else {
          downloadData[doc.id] = {
            [selectedDataType.value]: data[selectedDataType.value] || {},
          }
        }
      })
    }

    if (Object.keys(downloadData).length === 0) {
      throw new Error('No data available for download')
    }

    const content =
      fileFormat.value === 'json'
        ? JSON.stringify(downloadData, null, 2)
        : convertToCSV(downloadData, selectedDataType.value)

    const blob = new Blob([content], {
      type: fileFormat.value === 'json' ? 'application/json' : 'text/csv',
    })

    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    const timestamp = new Date().toISOString().split('T')[0]
    const dataTypeLabel = selectedDataType.value === 'users' ? 'users' : `projects-${selectedDataType.value}`
    link.setAttribute(
      'download',
      `ukraine-${dataTypeLabel}-${timestamp}.${fileFormat.value}`,
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
