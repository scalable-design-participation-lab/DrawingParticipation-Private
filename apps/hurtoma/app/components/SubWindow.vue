<template>
  <UCard class="dark:bg-black">
    <div class="space-y-3">
      <UProgress
        :value="progressPercentage"
        :ui="{
          progress: {
            base: 'block appearance-none border-none overflow-hidden',
            bar: '[&::-webkit-progress-value]:rounded-full [&::-webkit-progress-value]:transition-all [&::-webkit-progress-value]:ease-in-out [&::-moz-progress-bar]:rounded-full',
            background:
              '[&::-webkit-progress-value]:bg-lime-400 [&::-moz-progress-bar]:bg-lime-400',
            track:
              '[&::-webkit-progress-bar]:bg-gray-200 [&::-webkit-progress-bar]:rounded-full [@supports(selector(&::-moz-progress-bar))]:bg-gray-700',
          },
        }"
      />
      <div v-if="title || icon">
        <UIcon v-if="icon" :name="icon" />
        <h2
          v-if="title"
          class="text-md md:text-lg font-semibold !leading-tight"
        >
          {{ title }}
        </h2>
      </div>
      <p v-if="paragraph" class="text-xs md:text-sm !leading-tight pb-2">
        {{ paragraph }}
      </p>

      <UButton
        v-if="button"
        :color="button.color"
        class="w-full mb-2"
        @click="button.action"
      >
        {{ button.text }}
      </UButton>

      <div v-if="buttonGroup" class="flex flex-col space-y-2">
        <UTooltip
          v-for="btn in buttonGroup"
          :key="btn.text"
          :text="btn.tooltip"
          :disabled="!showTooltip"
        >
          <UButton
            :color="btn.color"
            variant="outline"
            :ui="{
              rounded: 'rounded-full',
              base: 'transition-all duration-300 ease-in-out hover:scale-105',
              padding: { sm: 'py-1.5', md: 'py-2', lg: 'py-2.5' },
            }"
            :class="[
              'w-full justify-center hover:!bg-gray-50 dark:hover:!bg-zinc-800',
              {
                'border-2 border-red-500': btn.color === 'red',
                'border-2 border-green-500': btn.color === 'green',
                'border-2 border-blue-500': btn.color === 'blue',
                'border-2 border-yellow-500': btn.color === 'yellow',
                'border-2 border-purple-500': btn.color === 'purple',
              },
            ]"
            @click="btn.action"
          >
            {{ btn.text }}
          </UButton>
        </UTooltip>
      </div>

      <div v-if="iconGrid">
        <p class="text-sm text-gray-400 mb-2">{{ iconGrid.title }}</p>
        <UCard class="dark:!bg-zinc-950">
          <div class="grid grid-cols-3 gap-3">
            <UTooltip
              v-for="icon in iconGrid.icons"
              :key="icon.name"
              :text="icon.tooltip"
              :disabled="!showTooltip"
            >
              <UButton variant="ghost" @click="iconGrid.onSelect(icon.name)">
                <img
                  :src="icon.src"
                  :alt="icon.name"
                  class="w-auto h-8 dark:!invert"
                />
              </UButton>
            </UTooltip>
          </div>
        </UCard>
      </div>

      <slot></slot>

      <div class="flex justify-between">
        <UButton
          icon="i-heroicons-arrow-left-20-solid"
          color="white"
          variant="solid"
          class="rounded-full p-2 hover:bg-gray-300 dark:!bg-zinc-900 dark:hover:!bg-zinc-700"
          :disabled="currentSubwindow === 1"
          @click="$emit('prev')"
        />
        <UButton
          icon="i-heroicons-arrow-right-20-solid"
          color="white"
          variant="solid"
          class="rounded-full p-2 hover:bg-gray-300 dark:!bg-zinc-900 dark:hover:!bg-zinc-700"
          :disabled="currentSubwindow === maxSubwindow"
          @click="$emit('next')"
        />
      </div>
    </div>
  </UCard>
</template>

<script setup lang="ts">
interface Button {
  text: string
  color: string
  tooltip?: string
  action: () => void
}

interface IconGridItem {
  name: string
  src: string
  tooltip?: string
}

interface IconGrid {
  title: string
  icons: IconGridItem[]
  onSelect: (iconName: string) => void
}

defineProps({
  currentSubwindow: {
    type: Number,
    required: true,
  },
  maxSubwindow: {
    type: Number,
    required: true,
  },
  progressPercentage: {
    type: Number,
    required: true,
  },
  title: {
    type: String,
    default: '',
  },
  icon: {
    type: String,
    default: '',
  },
  paragraph: {
    type: String,
    default: '',
  },
  button: {
    type: Object as () => Button,
    default: null,
  },
  buttonGroup: {
    type: Array as () => Button[],
    default: () => [],
  },
  iconGrid: {
    type: Object as () => IconGrid,
    default: null,
  },
  showTooltip: {
    type: Boolean,
    default: true,
  },
})

defineEmits(['prev', 'next'])
</script>
