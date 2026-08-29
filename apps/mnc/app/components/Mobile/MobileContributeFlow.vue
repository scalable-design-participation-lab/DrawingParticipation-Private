<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { toLonLat } from 'ol/proj'
import MobileHeader from './MobileHeader.vue'
import ContributeFileUpload from './ContributeFileUpload.vue'
import { PRIMARY_TAGS } from '../../stores/filter'
import { useLocalizedEntry } from '../../composables/useLocalizedEntry'
import { useIsMobile } from '../../composables/useIsMobile'

/**
 * Mobile "Join Our Research" flow — a 7-step wizard plus a thank-you screen,
 * launched from the bottom-nav "+" button.
 *
 * A submission IS a map entry: on submit the parent persists it as a pending
 * `userSolutions` doc (title + theme + location + the research answers), drops
 * the author's pending pin, and it goes through the same moderator review queue
 * as a desktop-added entry. Personal contact info is stored separately, admin-
 * only. Step 1 (title + theme + a dropped pin) is required; the rest is optional.
 */
const props = defineProps<{
  // A coordinate (EPSG:3857) captured when the user taps the map to drop a pin.
  // The parent feeds it back in after the location-picking interaction.
  pickedCoordinate?: [number, number] | null
}>()

const emit = defineEmits<{
  'close': []
  // Asks the parent to hide the flow and let the user tap the map.
  'pick-location': []
  'submit': [payload: ContributePayload]
}>()

interface ContributePayload {
  title: string
  primaryTag: string
  location: string
  coordinate: [number, number] | null
  example: string
  why: string
  date: string
  additionalInfo: string
  connectInfo: boolean | null
  fullName: string
  email: string
  country: string
  city: string
  files: {
    example: File[]
    why: File[]
    media: File[]
    additional: File[]
  }
}

const { isMobile } = useIsMobile()
const { locale } = useI18n()
const { tagLabel } = useLocalizedEntry()

const TOTAL_STEPS = 7
const step = ref(1)
const submitted = ref(false)

// After a pin drops, pause on a confirm screen (map + dropped pin + Next)
// before the title/theme form, so the user can check the placement first.
const confirmingPin = ref(false)

const form = reactive({
  title: '',
  primaryTag: '',
  location: '',
  coordinate: null as [number, number] | null,
  example: '',
  why: '',
  date: '',
  additionalInfo: '',
  connectInfo: null as boolean | null,
  fullName: '',
  email: '',
  country: '',
  city: '',
})

// Theme options (pick an existing one or type to create a new one). The VALUE
// stays the English key — it is what gets stored on the entry and filtered on —
// while the label follows the UI language.
const themes = ref<string[]>([...PRIMARY_TAGS])
const themeOptions = computed(() => {
  const list = themes.value.map(t => ({ label: tagLabel(t), value: t }))
  // A theme the user typed is set on the model directly, without going through
  // the list — keep an option for it or the field would render as empty.
  if (form.primaryTag && !themes.value.includes(form.primaryTag))
    list.push({ label: form.primaryTag, value: form.primaryTag })
  return list
})
// USelectMenu hands back the raw query for a plain option list and an object
// once option-attribute/value-attribute are set — accept both shapes.
function onCreateTheme(option: string | { label?: string, value?: string }) {
  const newTheme = (typeof option === 'string' ? option : option?.value ?? option?.label ?? '').trim()
  if (!newTheme)
    return
  if (!themes.value.includes(newTheme))
    themes.value.push(newTheme)
  form.primaryTag = newTheme
}

// Step 1 is the entry's required core: a title, a theme, and a dropped pin.
const step1Valid = computed(() =>
  form.title.trim().length > 0 && form.primaryTag.length > 0 && !!form.coordinate,
)

const files = reactive({
  example: [] as File[],
  why: [] as File[],
  media: [] as File[],
  additional: [] as File[],
  // Voice notes recorded in place of typing (steps 2 and 3).
  voiceExample: [] as File[],
  voiceWhy: [] as File[],
})

// Human-readable place for the dropped pin (reverse-geocoded); shown instead of
// raw coordinates, which mean nothing to a user.
const pinPlace = ref('')

// Reverse-geocode the dropped point into "City, Country" (OpenStreetMap
// Nominatim, no key). Fills the editable location field and the confirmation.
async function resolvePlace(coord: [number, number]) {
  pinPlace.value = ''
  try {
    const [lon, lat] = toLonLat(coord)
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&zoom=10&addressdetails=1&accept-language=${locale.value || 'en'}`,
    )
    if (res.ok) {
      const a = (await res.json())?.address || {}
      const city = a.city || a.town || a.village || a.county || a.state || ''
      const country = a.country || ''
      const label = [city, country].filter(Boolean).join(', ')
      if (label) {
        pinPlace.value = label
        if (!form.location.trim())
          form.location = label
      }
    }
  }
  catch {
    // Offline / rate-limited: the user can still type the location manually.
  }
}

// When the parent hands back a map-tapped coordinate, store it + resolve a place.
// immediate: desktop opens the wizard already seeded with a tapped coordinate.
watch(() => props.pickedCoordinate, (coord) => {
  if (coord) {
    form.coordinate = coord
    resolvePlace(coord)
    confirmingPin.value = true
  }
}, { immediate: true })

// On step 1 the map shows through, so the backdrop is transparent + click-through.
const isMapStep = computed(() => step.value === 1 && !submitted.value)

// On the mobile map step the floating groups (progress+title, the step-1 form)
// sit over the live map, so they need an opaque card backing to stay readable.
// Desktop always renders inside a solid modal, so it never needs this.
const mapCard = computed(() => isMobile.value && isMapStep.value)

function next() {
  // The pin-confirm screen's Next just dismisses it — it doesn't advance the
  // step, since the title/theme form underneath still needs filling in.
  if (step.value === 1 && confirmingPin.value) {
    confirmingPin.value = false
    return
  }
  // Can't leave step 1 without the entry's required core (title/theme/pin).
  if (step.value === 1 && !step1Valid.value)
    return
  if (step.value < TOTAL_STEPS)
    step.value += 1
}

function back() {
  if (step.value > 1)
    step.value -= 1
}

function submit() {
  emit('submit', {
    title: form.title,
    primaryTag: form.primaryTag,
    location: form.location,
    coordinate: form.coordinate,
    example: form.example,
    why: form.why,
    date: form.date,
    additionalInfo: form.additionalInfo,
    connectInfo: form.connectInfo,
    fullName: form.fullName,
    email: form.email,
    country: form.country,
    city: form.city,
    files: {
      example: [...files.example],
      why: [...files.why],
      media: [...files.media],
      additional: [...files.additional],
      voiceExample: [...files.voiceExample],
      voiceWhy: [...files.voiceWhy],
    },
  })
  submitted.value = true
}

function reset() {
  step.value = 1
  submitted.value = false
  confirmingPin.value = false
  Object.assign(form, {
    title: '',
    primaryTag: '',
    location: '',
    coordinate: null,
    example: '',
    why: '',
    date: '',
    additionalInfo: '',
    connectInfo: null,
    fullName: '',
    email: '',
    country: '',
    city: '',
  })
  files.example = []
  files.why = []
  files.media = []
  files.additional = []
  files.voiceExample = []
  files.voiceWhy = []
}

function prettyCoord(coord: [number, number]): string {
  return `${coord[0].toFixed(0)}, ${coord[1].toFixed(0)}`
}
</script>

<template>
  <div
    class="fixed inset-0 z-40"
    :class="isMobile
      ? (isMapStep ? 'flex flex-col pointer-events-none bg-transparent' : 'flex flex-col bg-white')
      : 'flex items-center justify-center bg-black/50 p-4'"
  >
    <!-- Full-screen on mobile; a centered, bounded card on desktop. -->
    <div
      :class="isMobile
        ? 'relative flex w-full flex-1 flex-col'
        : 'pointer-events-auto relative flex max-h-[88vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-zinc-900'"
    >
      <MobileHeader v-if="isMobile" :title-link="false" />

      <!-- Close button. Solid white circle so it stays visible over the map on
           step 1. On mobile it sits below the header row (whose language + map
           toggle own the top-right corner) and above it in the stacking order. -->
      <UButton
        v-if="!mapCard"
        icon="i-heroicons-x-mark"
        color="gray"
        variant="solid"
        size="sm"
        class="pointer-events-auto absolute z-30 bg-white text-gray-700 shadow-md hover:bg-gray-100 dark:bg-zinc-800 dark:text-gray-200 dark:hover:bg-zinc-700"
        :class="isMobile ? 'right-6 top-24' : 'right-4 top-4'"
        :ui="{ rounded: 'rounded-full' }"
        :aria-label="$t('contribute.close')"
        @click="emit('close')"
      />

    <!-- ============================== Thank-you ============================== -->
    <div
      v-if="submitted"
      class="pointer-events-auto flex flex-1 flex-col items-center justify-center px-8 py-12 text-center md:py-16"
    >
      <h2 class="text-3xl font-extrabold text-[#F26D6D]">
        {{ $t('contribute.title') }}
      </h2>
      <h3 class="mt-4 text-xl font-bold text-[#FB6D6D]">
        {{ $t('contribute.thankYou') }}
      </h3>
      <p class="mt-6 max-w-xs text-sm text-[#A84A4A]">
        {{ $t('contribute.received') }}
      </p>
      <p class="mt-2 max-w-xs text-sm text-[#A84A4A]">
        {{ $t('contribute.inTouch') }}
      </p>
      <UButton
        class="mt-10 rounded-full px-6"
        :style="{ backgroundColor: '#C0392B', color: '#ffffff' }"
        @click="reset"
      >
        {{ $t('contribute.anotherStory') }}
      </UButton>
    </div>

    <!-- =============================== Steps =============================== -->
    <template v-else>
      <!-- Progress + title. On the mobile map step this floats over the live
           map, so it gets an opaque card backing to stay legible. -->
      <div
        class="pointer-events-auto mt-20 md:mt-8"
        :class="mapCard ? 'mx-4 rounded-2xl bg-white px-6 py-4 shadow-lg dark:bg-zinc-900' : ''"
      >
        <div class="flex justify-center gap-1.5 px-8">
          <span
            v-for="i in TOTAL_STEPS"
            :key="i"
            class="h-1.5 w-8 rounded-full transition-colors"
            :class="i <= step ? 'bg-[#FB6D6D]' : 'bg-[#F8C9C9]'"
          />
        </div>

        <h2 class="mt-4 text-center text-2xl font-extrabold text-[#F26D6D]">
          {{ $t('contribute.title') }}
        </h2>
      </div>

      <div class="mx-auto w-full max-w-2xl flex-1 overflow-y-auto px-6 pb-32 pt-4 md:pb-6">
        <!-- Step 1a: confirm the just-dropped pin before the form, so the
             user can check the placement (the live map + pin show through
             behind this card on mobile) before typing anything. -->
        <div
          v-if="step === 1 && confirmingPin"
          class="pointer-events-auto space-y-4"
          :class="mapCard ? 'rounded-2xl bg-white p-5 shadow-lg dark:bg-zinc-900' : ''"
        >
          <p class="text-sm font-semibold text-[#F26D6D]">
            {{ $t('contribute.step1.confirmPinPrompt') }}
          </p>
          <p v-if="form.coordinate" class="flex items-center gap-1 text-xs text-emerald-600">
            <UIcon name="i-heroicons-map-pin" class="h-4 w-4" />
            {{ $t('contribute.step1.pinDropped', { coord: pinPlace || form.location || prettyCoord(form.coordinate) }) }}
          </p>
          <button
            type="button"
            class="text-sm font-medium text-[#FB6D6D] underline"
            @click="emit('pick-location')"
          >
            {{ $t('contribute.step1.movePin') }}
          </button>
        </div>

        <!-- Step 1b: the entry's required core — title, theme, location + pin -->
        <div
          v-else-if="step === 1"
          class="pointer-events-auto space-y-4"
          :class="mapCard ? 'rounded-2xl bg-white p-5 shadow-lg dark:bg-zinc-900' : ''"
        >
          <p class="text-sm font-semibold text-[#F26D6D]">
            {{ $t('contribute.step1.prompt') }}
          </p>
          <UInput
            v-model="form.title"
            :placeholder="$t('add.titlePlaceholder')"
            :ui="{ rounded: 'rounded-full' }"
          />
          <USelectMenu
            v-model="form.primaryTag"
            :options="themeOptions"
            value-attribute="value"
            option-attribute="label"
            searchable
            creatable
            :placeholder="$t('add.themePlaceholder')"
            @create="onCreateTheme"
          />
          <UInput
            v-model="form.location"
            :placeholder="$t('contribute.step1.placeholder')"
            :ui="{ rounded: 'rounded-full' }"
          />
          <button
            type="button"
            class="text-sm font-medium text-[#FB6D6D] underline"
            @click="emit('pick-location')"
          >
            {{ $t('contribute.step1.dropPin') }}
          </button>
          <p v-if="form.coordinate" class="flex items-center gap-1 text-xs text-emerald-600">
            <UIcon name="i-heroicons-map-pin" class="h-4 w-4" />
            {{ $t('contribute.step1.pinDropped', { coord: pinPlace || form.location || prettyCoord(form.coordinate) }) }}
          </p>
        </div>

        <!-- Step 2: Describe an example -->
        <div v-else-if="step === 2" class="space-y-4">
          <p class="text-sm font-semibold text-[#F26D6D]">
            {{ $t('contribute.step2.prompt') }}
          </p>
          <UTextarea
            v-model="form.example"
            :rows="5"
            :placeholder="$t('contribute.descPlaceholder')"
            :ui="{ rounded: 'rounded-2xl' }"
            class="contribute-textarea"
          />
          <ContributeVoiceRecorder v-model="files.voiceExample" />
          <ContributeFileUpload v-model="files.example" />
        </div>

        <!-- Step 3: Why is this a good example -->
        <div v-else-if="step === 3" class="space-y-4">
          <p class="text-sm font-semibold text-[#F26D6D]">
            {{ $t('contribute.step3.prompt') }}
          </p>
          <UTextarea
            v-model="form.why"
            :rows="5"
            :placeholder="$t('contribute.descPlaceholder')"
            :ui="{ rounded: 'rounded-2xl' }"
            class="contribute-textarea"
          />
          <ContributeVoiceRecorder v-model="files.voiceWhy" />
          <ContributeFileUpload v-model="files.why" />
        </div>

        <!-- Step 4: Illustrative media -->
        <div v-else-if="step === 4" class="space-y-4">
          <p class="text-sm font-semibold text-[#F26D6D]">
            {{ $t('contribute.step4.prompt') }}
          </p>
          <ContributeFileUpload v-model="files.media" />
        </div>

        <!-- Step 5: Date -->
        <div v-else-if="step === 5" class="space-y-4">
          <p class="text-sm font-semibold text-[#F26D6D]">
            {{ $t('contribute.step5.prompt') }}
          </p>
          <UInput
            v-model="form.date"
            type="date"
            :ui="{ rounded: 'rounded-full' }"
          />
        </div>

        <!-- Step 6: Additional info -->
        <div v-else-if="step === 6" class="space-y-4">
          <p class="text-sm font-semibold text-[#F26D6D]">
            {{ $t('contribute.step6.prompt') }}
          </p>
          <UTextarea
            v-model="form.additionalInfo"
            :rows="5"
            :placeholder="$t('contribute.descPlaceholder')"
            :ui="{ rounded: 'rounded-2xl' }"
            class="contribute-textarea"
          />
          <ContributeFileUpload v-model="files.additional" />
        </div>

        <!-- Step 7: Personal information -->
        <div v-else-if="step === 7" class="space-y-4">
          <p class="text-sm font-semibold text-[#F26D6D]">
            {{ $t('contribute.step7.prompt') }}
          </p>
          <div class="space-y-2">
            <label class="flex items-center gap-2 text-sm text-gray-700">
              <input
                v-model="form.connectInfo"
                type="radio"
                :value="true"
                class="accent-[#FB6D6D]"
              >
              {{ $t('contribute.step7.yes') }}
            </label>
            <label class="flex items-center gap-2 text-sm text-gray-700">
              <input
                v-model="form.connectInfo"
                type="radio"
                :value="false"
                class="accent-[#FB6D6D]"
              >
              {{ $t('contribute.step7.no') }}
            </label>
          </div>

          <p class="pt-2 text-sm font-semibold text-[#F26D6D]">
            {{ $t('contribute.step7.ifYes') }}
          </p>
          <div class="space-y-3">
            <div class="flex items-center gap-3">
              <label class="w-28 flex-shrink-0 text-sm text-[#F26D6D]">{{ $t('contribute.step7.fullName') }}</label>
              <UInput v-model="form.fullName" class="flex-1" :ui="{ rounded: 'rounded-full' }" />
            </div>
            <div class="flex items-center gap-3">
              <label class="w-28 flex-shrink-0 text-sm text-[#F26D6D]">{{ $t('contribute.step7.email') }}</label>
              <UInput v-model="form.email" type="email" class="flex-1" :ui="{ rounded: 'rounded-full' }" />
            </div>
            <div class="flex items-center gap-3">
              <label class="w-28 flex-shrink-0 text-sm text-[#F26D6D]">{{ $t('contribute.step7.country') }}</label>
              <UInput v-model="form.country" class="flex-1" :ui="{ rounded: 'rounded-full' }" />
            </div>
            <div class="flex items-center gap-3">
              <label class="w-28 flex-shrink-0 text-sm text-[#F26D6D]">{{ $t('contribute.step7.city') }}</label>
              <UInput v-model="form.city" class="flex-1" :ui="{ rounded: 'rounded-full' }" />
            </div>
          </div>

          <p class="pt-1 text-xs leading-snug text-gray-500">
            {{ $t('contribute.step7.privacy') }}
          </p>
        </div>
      </div>

      <!-- Footer nav: Back / Next|Submit. Above the bottom nav on mobile;
           an in-card footer on desktop. -->
      <div
        class="pointer-events-auto flex items-center justify-center gap-6"
        :class="isMobile ? 'absolute inset-x-0 bottom-24 safe-bottom' : 'shrink-0 border-t border-gray-100 py-4 dark:border-zinc-800'"
      >
        <button
          v-if="step > 1"
          type="button"
          class="text-sm font-semibold text-[#F26D6D]"
          @click="back"
        >
          {{ $t('contribute.back') }}
        </button>
        <!-- Step 1 has no Back, so the close action takes the Back slot here
             (the top-corner X is hidden on the mobile map step). A white pill
             backdrop keeps it readable where it floats over the map. -->
        <button
          v-else-if="mapCard"
          type="button"
          class="rounded-full bg-white px-6 py-2 text-sm font-semibold text-[#F26D6D] shadow-md hover:bg-gray-100 dark:bg-zinc-800 dark:hover:bg-zinc-700"
          @click="emit('close')"
        >
          {{ $t('contribute.close') }}
        </button>
        <UButton
          v-if="step < TOTAL_STEPS"
          class="rounded-full px-6"
          :style="{ backgroundColor: '#C0392B', color: '#ffffff' }"
          :disabled="step === 1 && !confirmingPin && !step1Valid"
          @click="next"
        >
          {{ $t('contribute.next') }}
        </UButton>
        <UButton
          v-else
          class="rounded-full px-6"
          :style="{ backgroundColor: '#C0392B', color: '#ffffff' }"
          @click="submit"
        >
          {{ $t('contribute.submit') }}
        </UButton>
      </div>
    </template>
    </div>
  </div>
</template>

<style scoped>
.contribute-textarea :deep(textarea) {
  background-color: #fceaea;
  border-color: #f5b5b5;
}
</style>
