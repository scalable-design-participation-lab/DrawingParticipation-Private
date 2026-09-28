<template>
  <UCard 
    class="fixed right-6 top-24 w-96 md:w-80 max-h-[calc(100vh-11rem)] z-40 shadow-xl dark:bg-black flex flex-col overflow-hidden"
  >
    <div 
      class="flex-1 overflow-y-scroll max-h-[calc(100vh-13rem)] px-1"
    >
      <UAccordion
        color="white"
        variant="solid"
        :items="menuItems"
        class="space-y-1.5"
      >
        <template #item="{ item }">
          <SubWindow
            v-if="item.label === 'Середовище'"
            :current-subwindow="spaceSubwindow"
            :max-subwindow="4"
            :progress-percentage="spaceProgressPercentage"
            :title="spaceContent.title"
            :icon="spaceContent.icon"
            :paragraph="spaceContent.description"
            :button="spaceContent.button"
            :button-group="spaceContent.buttonGroup"
            :icon-grid="spaceSubwindow === 4 ? prohibitIconGrid : null"
            @prev="sidebarStore.prevSpaceSubwindow()"
            @next="sidebarStore.nextSpaceSubwindow()"
          >
          </SubWindow>
          <SubWindow
            v-if="item.label === 'Приналежність'"
            :current-subwindow="belongingSubwindow"
            :max-subwindow="1"
            :progress-percentage="belongingProgressPercentage"
            :title="belongingContent.title"
            :icon="belongingContent.icon"
            :paragraph="belongingContent.description"
            :icon-grid="belongingSubwindow === 1 ? belongingIconGrid : null"
            @prev="prevBelongingSubwindow"
            @next="nextBelongingSubwindow"
          >
          </SubWindow>
          <SubWindow
            v-if="item.label === 'Безпека'"
            :current-subwindow="safetySubwindow"
            :max-subwindow="1"
            :progress-percentage="safetyProgressPercentage"
            :title="safetyContent.title"
            :icon="safetyContent.icon"
            :paragraph="safetyContent.description"
            :icon-grid="safetySubwindow === 1 ? safetyIconGrid : null"
            @prev="prevSafetySubwindow"
            @next="nextSafetySubwindow"
          >
          </SubWindow>
          <SubWindow
            v-if="item.label === 'Екологія'"
            :current-subwindow="environmentSubwindow"
            :max-subwindow="2"
            :progress-percentage="environmentProgressPercentage"
            :title="environmentContent.title"
            :icon="environmentContent.icon"
            :paragraph="environmentContent.description"
            :icon-grid="
              environmentSubwindow === 1
                ? pollutionIconGrid
                : environmentSubwindow === 2
                  ? leafIconGrid
                  : null
            "
            @prev="prevEnvironmentSubwindow"
            @next="nextEnvironmentSubwindow"
          >
          </SubWindow>
        </template>
      </UAccordion>
      
      <UButton
        class="my-2 py-3 px-6 rounded-full flex place-self-end hover:bg-gray-300 hover:text-black dark:hover:bg-zinc-700 dark:hover:text-white"
        color="black"
        :loading="isSaving"
        :disabled="isSaving"
        @click="saveData"
      >
        {{ isSaving ? 'Submitting...' : 'Finish' }}
      </UButton>
      <ThankYouModal v-model="showThankYouModal" />
    </div>
  </UCard>
</template>

<style scoped>
/* WebKit scrollbar styling for Mac and Chrome */
.overflow-y-scroll::-webkit-scrollbar {
  -webkit-appearance: none;
  width: 6px;
}

.overflow-y-scroll::-webkit-scrollbar-thumb {
  border-radius: 4px;
  background-color: rgba(156, 163, 175, 0.5);
  border: 2px solid transparent;
  background-clip: padding-box;
}

.overflow-y-scroll::-webkit-scrollbar-track {
  background-color: transparent;
}
</style>

<script setup lang="ts">
import { computed, ref } from 'vue'
import SubWindow from './SubWindow.vue'
import ThankYouModal from './ThankYouModal.vue'

import dislikeIcon from '@/assets/icons/dislike.svg'
import heartIcon from '@/assets/icons/heart.svg'
import smileIcon from '@/assets/icons/smile.svg'
import brokenIcon from '@/assets/icons/broken.svg'
import calmIcon from '@/assets/icons/calm.svg'
import lockIcon from '@/assets/icons/lock.svg'
import trashIcon from '@/assets/icons/trash.svg'
import pollutionIcon from '@/assets/icons/pollution.svg'
import leafIcon from '@/assets/icons/leaf.svg'
import prohibitIcon from '@/assets/icons/prohibit.svg'
import { useSideBarStore } from '@base/stores/sidebar'
import { useDrawingStore } from '@base/stores/drawing'
import { useDb } from "../stores/db"
import type { IconType } from '@base/stores/types/store'

const drawingStore = useDrawingStore()
const sidebarStore = useSideBarStore()
const dbStore = useDb()

const spaceSubwindow = computed(() => sidebarStore.spaceSubwindow)
const belongingSubwindow = computed(() => sidebarStore.belongingSubwindow)
const safetySubwindow = computed(() => sidebarStore.safetySubwindow)
const environmentSubwindow = computed(() => sidebarStore.environmentSubwindow)

const menuItems = [
  {
    label: 'Environment',
    defaultOpen: true,
    class: 'dark:!bg-zinc-950 py-2'
  },
  { label: 'Belonging', class: 'dark:!bg-zinc-950 py-2' },
  { label: 'Safety', class: 'dark:!bg-zinc-950 py-2' },
  { label: 'Ecology', class: 'dark:!bg-zinc-950 py-2' },
]

const spaceProgressPercentage = computed(() => (spaceSubwindow.value / 4) * 100)
const belongingProgressPercentage = computed(
  () => (belongingSubwindow.value / 1) * 100,
)
const safetyProgressPercentage = computed(
  () => (safetySubwindow.value / 1) * 100,
)
const environmentProgressPercentage = computed(
  () => (environmentSubwindow.value / 2) * 100,
)

const spaceContent = computed(() => {
  const contents: Record<number, any> = {
    1: {
      title: 'Mark the places you visited around the Tyazhylivka River',
      description:
        'Select the frequency of visits using the button below, then mark the corresponding places on the map. Click on the "Plus" icon to add comments and tell us who you visited these locations with and for what purpose.',
      buttonGroup: [
        {
          text: 'Every day',
          color: 'blue',
          action: () => drawingStore.activateDrawing('every day'),
        },
        {
          text: 'Every week',
          color: 'green',
          action: () => drawingStore.activateDrawing('every week'),
        },
        {
          text: 'Sometimes',
          color: 'purple',
          action: () => drawingStore.activateDrawing('sometimes'),
        },
        {
          text: 'Only once',
          color: 'yellow',
          action: () => drawingStore.activateDrawing('only once'),
        },
        {
          text: 'Never',
          color: 'red',
          action: () => drawingStore.activateDrawing('never'),
        },
      ],
    },
    2: {
      title: 'Mark leisure places around the Tyazhylivka River',
      description:
        'Click "Add" and highlight an area on the map where you would like to spend time in the future—relaxing with friends, walking your dog, etc. To save the result, double-click on the highlighted zone.',
      button: {
        text: 'Add',
        color: 'primary',
        action: () => drawingStore.activatePolygonDrawing(),
      },
    },
    3: {
      title: 'Mark the roads leading to the Tyazhylivka River',
      description:
        'To make marking places more convenient, zoom in on the map and click "Add". Then, with a few clicks, mark all the roads to the river that you know.',
      button: {
        text: 'Add',
        color: 'red',
        action: () => drawingStore.activateLineStringDrawing(),
      },
    },
    4: {
      title: 'Mark places around the Tyazhylivka River where you encountered obstacles',
      description:
        'Using the icon below, indicate where you encountered obstacles such as a broken road, impassable forest, etc. After that, proceed to the "Belonging" section.',
    },
  }
  return contents[spaceSubwindow.value] || { title: '', description: '' }
})

const belongingContent = computed(() => {
  const contents: Record<number, any> = {
    1: {
      title:
        'Share your thoughts about places around the Tyazhylivka River',
      description:
        'Select an icon (hover over it to see a tooltip) and mark places on the map that you like, dislike, or that evoke a sense of calm. Add a comment with an explanation, and then proceed to the "Safety" section.',
    },
  }
  return contents[belongingSubwindow.value] || { title: '', description: '' }
})

const belongingIconGrid = computed(() => ({
  icons: [
    {
      name: 'dislike',
      src: dislikeIcon,
      tooltip: 'Places you dislike',
    },
    {
      name: 'heart',
      src: heartIcon,
      tooltip: 'Places you like',
    },
    {
      name: 'smile',
      src: smileIcon,
      tooltip: 'Memories',
    },
  ],
  onSelect: selectBelongingIcon,
}))

const safetyContent = computed(() => {
  const contents: Record<number, any> = {
    1: {
      title:
        'Share your thoughts about safety levels around the Tyazhylivka River',
      description:
        'Select an icon (hover over it to see a tooltip) and mark places on the map that you like, dislike, or that are associated with certain memories. Add a comment with an explanation, and then proceed to the "Ecology" section.',
    },
  }
  return contents[safetySubwindow.value] || { title: '', description: '' }
})

const safetyIconGrid = computed(() => ({
  icons: [
    {
      name: 'broken',
      src: brokenIcon,
      tooltip: 'Places where you feel safe',
    },
    {
      name: 'calm',
      src: calmIcon,
      tooltip: 'Places where you feel calm',
    },
    {
      name: 'lock',
      src: lockIcon,
      tooltip: 'Places where you feel unsafe',
    },
  ],
  onSelect: selectSafetyIcon,
}))

const environmentContent = computed(() => {
  const contents: Record<number, any> = {
    1: {
      title:
        'Share your thoughts about pollution levels around the Tyazhylivka River',
      description:
        'Select an icon (hover over it to see a tooltip) and mark places on the map where you noticed trash—around the river and in the water. Add a comment with an explanation, and then click the "Right" arrow.',
    },
    2: {
      title:
        'Share your thoughts about pollution levels of the Tyazhylivka River',
      description:
        'Select an icon (hover over it to see a tooltip) and mark places on the map where you encountered unusual plants and animals. Add a comment with an explanation, and then click "Finish".',
    },
  }
  return contents[environmentSubwindow.value] || { title: '', description: '' }
})

const pollutionIconGrid = computed(() => ({
  icons: [
    {
      name: 'trash',
      src: trashIcon,
      tooltip: 'Trash around',
    },
    {
      name: 'pollution',
      src: pollutionIcon,
      tooltip: 'Trash in water',
    },
  ],
  onSelect: selectEnvironmentIcon,
}))

const leafIconGrid = computed(() => ({
  icons: [
    {
      name: 'leaf',
      src: leafIcon,
      tooltip: 'Places with interesting animals and plants',
    },
  ],
  onSelect: selectEnvironmentIcon,
}))

const prohibitIconGrid = computed(() => ({
  icons: [
    {
      name: 'prohibit',
      src: prohibitIcon,
      tooltip: 'Places that should be prohibited',
    },
  ],
  onSelect: selectProhibitIcon,
}))

const showSubmitButton = computed(() => {
  return environmentSubwindow.value === 2
})

function nextBelongingSubwindow() {
  sidebarStore.nextBelongingSubwindow()
}

function prevBelongingSubwindow() {
  sidebarStore.prevBelongingSubwindow()
}

function selectBelongingIcon(iconName: IconType) {
  console.log('Selected icon:', iconName)
  drawingStore.activateBelongingDrawing(iconName)
}

function nextSafetySubwindow() {
  sidebarStore.nextSafetySubwindow()
}

function prevSafetySubwindow() {
  sidebarStore.prevSafetySubwindow()
}

function selectSafetyIcon(iconName: IconType) {
  console.log('Selected safety icon:', iconName)
  drawingStore.activateSafetyDrawing(iconName)
}

function nextEnvironmentSubwindow() {
  sidebarStore.nextEnvironmentSubwindow()
}

function prevEnvironmentSubwindow() {
  sidebarStore.prevEnvironmentSubwindow()
}

function selectEnvironmentIcon(iconName: IconType) {
  console.log('Selected icon:', iconName)
  drawingStore.activateEnvironmentDrawing(iconName)
}

function selectProhibitIcon() {
  console.log('Selected prohibit icon')
  drawingStore.activateProhibitDrawing()
}

const isSaving = ref(false)
const showNotification = ref(false)
const notificationColor = ref('green')
const notificationTitle = ref('')
const notificationText = ref('')
const notificationId = ref('save-notification')
const showThankYouModal = ref(false)

async function saveData() {
  isSaving.value = true
  try {
    await dbStore.saveDataToDatabase()
    showThankYouModal.value = true
  } catch (error) {
    console.error('Error submitting data to database:', error)
    showErrorNotification('Failed to submit data')
  } finally {
    isSaving.value = false
  }
}

function showSuccessNotification(message: string) {
  notificationColor.value = 'green'
  notificationTitle.value = 'Success'
  notificationText.value = message
  showNotification.value = true
}

function showErrorNotification(message: string) {
  notificationColor.value = 'red'
  notificationTitle.value = 'Error'
  notificationText.value = message
  showNotification.value = true
}
</script>
