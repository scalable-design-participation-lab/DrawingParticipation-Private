<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import MobileHeader from './MobileHeader.vue'
import ContributeFileUpload from './ContributeFileUpload.vue'
import { PRIMARY_TAGS } from '../../stores/filter'

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

const TOTAL_STEPS = 7
const step = ref(1)
const submitted = ref(false)

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

// Theme options (pick an existing one or type to create a new one).
const themes = ref<string[]>([...PRIMARY_TAGS])
function onCreateTheme(newTheme: string) {
  if (newTheme && !themes.value.includes(newTheme))
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
})

// When the parent hands back a map-tapped coordinate, store it on the form.
watch(() => props.pickedCoordinate, (coord) => {
  if (coord)
    form.coordinate = coord
})

// On step 1 the map shows through, so the backdrop is transparent + click-through.
const isMapStep = computed(() => step.value === 1 && !submitted.value)

function next() {
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
    },
  })
  submitted.value = true
}

function reset() {
  step.value = 1
  submitted.value = false
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
}

function prettyCoord(coord: [number, number]): string {
  return `${coord[0].toFixed(0)}, ${coord[1].toFixed(0)}`
}
</script>

<template>
  <div
    class="fixed inset-0 z-40 flex flex-col"
    :class="isMapStep ? 'pointer-events-none bg-transparent' : 'bg-white'"
  >
    <MobileHeader color="#4FA19D" />

    <!-- Close button (top-right), available throughout the flow -->
    <UButton
      icon="i-heroicons-x-mark"
      color="gray"
      variant="ghost"
      size="sm"
      class="pointer-events-auto absolute right-4 top-6 z-10"
      :ui="{ rounded: 'rounded-full' }"
      :aria-label="$t('contribute.close')"
      @click="emit('close')"
    />

    <!-- ============================== Thank-you ============================== -->
    <div
      v-if="submitted"
      class="pointer-events-auto flex flex-1 flex-col items-center justify-center px-8 text-center"
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
      <!-- Progress bar -->
      <div class="pointer-events-auto mt-20 flex justify-center gap-1.5 px-8">
        <span
          v-for="i in TOTAL_STEPS"
          :key="i"
          class="h-1.5 w-8 rounded-full transition-colors"
          :class="i <= step ? 'bg-[#FB6D6D]' : 'bg-[#F8C9C9]'"
        />
      </div>

      <h2 class="pointer-events-auto mt-5 text-center text-2xl font-extrabold text-[#F26D6D]">
        {{ $t('contribute.title') }}
      </h2>

      <div class="flex-1 overflow-y-auto px-6 pb-32 pt-4">
        <!-- Step 1: the entry's required core — title, theme, location + pin -->
        <div v-if="step === 1" class="pointer-events-auto space-y-4">
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
            :options="themes"
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
            {{ $t('contribute.step1.pinDropped', { coord: prettyCoord(form.coordinate) }) }}
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

      <!-- Footer nav: Back / Next|Submit, sits above the bottom nav bar -->
      <div class="pointer-events-auto absolute inset-x-0 bottom-24 flex items-center justify-center gap-6">
        <button
          v-if="step > 1"
          type="button"
          class="text-sm font-semibold text-[#F26D6D]"
          @click="back"
        >
          {{ $t('contribute.back') }}
        </button>
        <UButton
          v-if="step < TOTAL_STEPS"
          class="rounded-full px-6"
          :style="{ backgroundColor: '#C0392B', color: '#ffffff' }"
          :disabled="step === 1 && !step1Valid"
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
</template>

<style scoped>
.contribute-textarea :deep(textarea) {
  background-color: #fceaea;
  border-color: #f5b5b5;
}
</style>
