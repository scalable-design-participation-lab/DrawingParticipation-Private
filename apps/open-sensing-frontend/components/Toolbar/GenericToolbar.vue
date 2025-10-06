<!--
 * GenericToolbar Component
 *
 * A vertical toolbar component that supports both light and dark modes.
 * Uses NuxtUI components and color system for consistent theming.
 *
 * @component
 * @example
 * <GenericToolbar :tools="toolbarItems" @tool-click="handleToolSelection" />
 -->

<template>
  <div
    class="flex flex-col rounded-full py-3"
    :class="['bg-white dark:bg-gray-800', 'shadow-lg dark:shadow-gray-900']"
  >
    <UButton
      v-for="(tool, index) in tools"
      :key="index"
      :class="[
        'w-12 h-12 my-1 rounded-full',
        'hover:translate-y-[-2px] hover:shadow-md',
        'hover:border dark:hover:border-gray-700',
        'flex items-center justify-center',
      ]"
      :color="colorMode.value === 'dark' ? 'gray' : 'white'"
      variant="ghost"
      icon
      @click="handleToolClick(index)"
    >
      <UTooltip :text="tool.tooltip">
        <UIcon
          :name="tool.icon"
          class="text-2xl transform translate-y-[0.5px]"
          :class="['text-gray-800 dark:text-gray-200']"
        />
      </UTooltip>
    </UButton>
  </div>
</template>

<script setup lang="ts">
// Use type instead of interface to avoid parsing error
type Tool = {
  icon: string
  tooltip: string
  action?: () => void
}

const props = defineProps<{
  tools: Tool[]
}>()

const emit = defineEmits<{
  (e: 'toolClick', index: number): void
}>()

// Get color mode for dynamic styling
const colorMode = useColorMode()

const handleToolClick = (index: number) => {
  if (props.tools[index].action) {
    props.tools[index].action!()
  }
  emit('toolClick', index)
}
</script>
