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
            @prev="mapUIStore.prevSpaceSubwindow()"
            @next="mapUIStore.nextSpaceSubwindow()"
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
        {{ isSaving ? 'подаючи...' : 'завершити' }}
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
import { useMapUIStore } from '../stores/mapUI'
import SubWindow from './SubWindow.vue'
import { useRouter } from 'vue-router'
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

const mapUIStore = useMapUIStore()
const router = useRouter()

const spaceSubwindow = computed(() => mapUIStore.spaceSubwindow)
const belongingSubwindow = computed(() => mapUIStore.belongingSubwindow)
const safetySubwindow = computed(() => mapUIStore.safetySubwindow)
const environmentSubwindow = computed(() => mapUIStore.environmentSubwindow)

const menuItems = [
  {
    label: 'Середовище',
    defaultOpen: true,
    class: 'dark:!bg-zinc-950 py-2'
  },
  { label: 'Приналежність', class: 'dark:!bg-zinc-950 py-2' },
  { label: 'Безпека', class: 'dark:!bg-zinc-950 py-2' },
  { label: 'Екологія', class: 'dark:!bg-zinc-950 py-2' },
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
      title: 'Позначте місця, які ви відвідували навколо р. Тяжилівка',
      description:
        'Оберіть частоту відвідування за допомогою кнопки нижче, а потім позначте відповідні місця на мапі. Натисніть на іконку «Плюс», щоб додати коментарі та розповісти, з ким та з якою метою ви відвідували ці локації.',
      buttonGroup: [
        {
          text: 'щодня',
          color: 'blue',
          action: () => mapUIStore.activateDrawing('every day'),
        },
        {
          text: 'щотижня',
          color: 'green',
          action: () => mapUIStore.activateDrawing('every week'),
        },
        {
          text: 'інколи',
          color: 'purple',
          action: () => mapUIStore.activateDrawing('sometimes'),
        },
        {
          text: 'лише раз',
          color: 'yellow',
          action: () => mapUIStore.activateDrawing('only once'),
        },
        {
          text: 'ніколи',
          color: 'red',
          action: () => mapUIStore.activateDrawing('never'),
        },
      ],
    },
    2: {
      title: 'Позначте місця для дозвілля навколо р. Тяжилівка',
      description:
        'Натисніть «Додати» і виділіть територію на мапі, де хочете проводити час у майбутньому — відпочивати з друзями, гуляти з собакою тощо. Щоб зберегти результат, двічі натисніть на виділену зону.',
      button: {
        text: 'додати',
        color: 'primary',
        action: () => mapUIStore.activatePolygonDrawing(),
      },
    },
    3: {
      title: 'Позначте дороги, які ведуть до р. Тяжилівка',
      description:
        'Щоб зручніше позначити місця, наблизьте мапу за допомогою масштабування та натисніть «Додати». Далі у кілька натискань відмітьте всі відомі вам дороги до річки.',
      button: {
        text: 'додати',
        color: 'red',
        action: () => mapUIStore.activateLineStringDrawing(),
      },
    },
    4: {
      title: 'Позначте на мапі місця навколо р. Тяжилівка, де ви стикалися з перешкодами',
      description:
        'За допомогою іконки нижче вкажіть, де ви зустрічали перепони на шляху на кшталт розбитої дороги, непрохідного лісу тощо. Після цього переходьте до розділу «Приналежність».',
    },
  }
  return contents[spaceSubwindow.value] || { title: '', description: '' }
})

const belongingContent = computed(() => {
  const contents: Record<number, any> = {
    1: {
      title:
        'Поділіться думкою про місця навколо р. Тяжилівка',
      description:
        'Оберіть іконку (навівши на неї, побачити підказку) та позначте на мапі місця, які вам подобаються, не подобаються або які викликають відчуття спокою. Додайте коментар із поясненням, і після цього переходьте до розділу «Безпека».',
    },
  }
  return contents[belongingSubwindow.value] || { title: '', description: '' }
})

const belongingIconGrid = computed(() => ({
  icons: [
    {
      name: 'dislike',
      src: dislikeIcon,
      tooltip: 'місця, які не подобаються',
    },
    {
      name: 'heart',
      src: heartIcon,
      tooltip: 'місця, які подобаються',
    },
    {
      name: 'smile',
      src: smileIcon,
      tooltip: 'Спогади',
    },
  ],
  onSelect: selectBelongingIcon,
}))

const safetyContent = computed(() => {
  const contents: Record<number, any> = {
    1: {
      title:
        'Поділіться думкою про рівень безпеки навколо р. Тяжилівка',
      description:
        "Оберіть іконку (навівши на неї, побачите підказку) та позначте на мапі  місця, які вам подобаються, не подобаються або пов' язані із певними  спогадами. Додайте коментар із поясненням, і після цього переходьте до  розділу «Екологія».",
    },
  }
  return contents[safetySubwindow.value] || { title: '', description: '' }
})

const safetyIconGrid = computed(() => ({
  icons: [
    {
      name: 'broken',
      src: brokenIcon,
      tooltip: 'місця, де вам безпечно',
    },
    {
      name: 'calm',
      src: calmIcon,
      tooltip: 'місця, де вам спокійно',
    },
    {
      name: 'lock',
      src: lockIcon,
      tooltip: 'місця, де вам небезпечно',
    },
  ],
  onSelect: selectSafetyIcon,
}))

const environmentContent = computed(() => {
  const contents: Record<number, any> = {
    1: {
      title:
        'Поділіться думкою про рівень засміченості навколо р. Тяжилівка',
      description:
        'Оберіть іконку (навівши на неї, побачити підказку) та позначте на мапі місця, де ви помічали сміття — навкруги річки та у воді. Додайте коментар із поясненням, і після цього натисніть стрілку «Вправо».',
    },
    2: {
      title:
        'Поділіться думкою про рівень засміченості р. Тяжилівка',
      description:
        'Оберіть іконку (навівши на неї, побачити підказку) та позначте на мапі місця, де ви зустрічали незвичні рослини та тварин. Додайте коментар із поясненням, і після цього натисніть «Завершити».',
    },
  }
  return contents[environmentSubwindow.value] || { title: '', description: '' }
})

const pollutionIconGrid = computed(() => ({
  icons: [
  {
      name: 'trash',
      src: trashIcon,
      tooltip: 'сміття навколо',
    },
    {
      name: 'pollution',
      src: pollutionIcon,
      tooltip: 'сміття у воді',
    },
  ],
  onSelect: selectEnvironmentIcon,
}))

const leafIconGrid = computed(() => ({
  icons: [
    {
      name: 'leaf',
      src: leafIcon,
      tooltip: 'місця з цікавими тваринами і рослинами',
    },
  ],
  onSelect: selectEnvironmentIcon,
}))

const prohibitIconGrid = computed(() => ({
  icons: [
    {
      name: 'prohibit',
      src: prohibitIcon,
      tooltip: 'Місця, які потрібно заборонити',
    },
  ],
  onSelect: selectProhibitIcon,
}))

const showSubmitButton = computed(() => {
  return environmentSubwindow.value === 2
})

function nextBelongingSubwindow() {
  mapUIStore.nextBelongingSubwindow()
}

function prevBelongingSubwindow() {
  mapUIStore.prevBelongingSubwindow()
}

function selectBelongingIcon(iconName: string) {
  console.log('Selected icon:', iconName)
  mapUIStore.activateBelongingDrawing(iconName)
}

function nextSafetySubwindow() {
  mapUIStore.nextSafetySubwindow()
}

function prevSafetySubwindow() {
  mapUIStore.prevSafetySubwindow()
}

function selectSafetyIcon(iconName: string) {
  console.log('Selected safety icon:', iconName)
  mapUIStore.activateSafetyDrawing(iconName)
}

function nextEnvironmentSubwindow() {
  mapUIStore.nextEnvironmentSubwindow()
}

function prevEnvironmentSubwindow() {
  mapUIStore.prevEnvironmentSubwindow()
}

function selectEnvironmentIcon(iconName: string) {
  console.log('Selected icon:', iconName)
  mapUIStore.activateEnvironmentDrawing(iconName)
}

function selectProhibitIcon() {
  console.log('Selected prohibit icon')
  mapUIStore.activateProhibitDrawing()
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
    await mapUIStore.saveDataToDatabase()
    showThankYouModal.value = true
  } catch (error) {
    console.error('Error submitting data to database:', error)
    showErrorNotification('Не вдалося подати дані')
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
