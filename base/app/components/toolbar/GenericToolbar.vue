<!--
 * GenericToolbar Component
 *
 * This component renders a vertical toolbar with customizable tool buttons.
 * Each tool is represented by an icon and can have an associated action.
 * The toolbar supports visual feedback for the active tool and hover effects.
 *
 * @component
 * @example
 * <GenericToolbar :tools="toolbarItems" @tool-click="handleToolSelection" />
 -->

<script setup lang="ts">
interface Tool {
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

function handleToolClick(index: number) {
  if (props.tools[index].action) {
    props.tools[index].action!()
  }
  emit('toolClick', index)
}
</script>

<template>
  <div class="flex flex-col bg-white/90 rounded-3xl p-4 shadow-lg">
    <UButton
      v-for="(tool, index) in tools"
      :key="index"
      class="w-14 h-14 my-2 bg-white hover:translate-y-[-2px] hover:shadow-md hover:bg-gray-100 flex items-center justify-center"
      color="white"
      variant="ghost"
      icon
      @click="handleToolClick(index)"
    >
      <UIcon
        :name="tool.icon"
        class="text-2xl text-gray-800 transform translate-y-[0.5px]"
      />
    </UButton>
  </div>
</template>
