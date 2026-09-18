<script setup lang="ts">
import { computed } from 'vue'

/**
 * Typography as data: element, size, weight, tone, alignment. `text` may
 * contain line breaks. Default size follows the element.
 */
const props = withDefaults(defineProps<{
  as?: 'h1' | 'h2' | 'h3' | 'p' | 'span' | 'label'
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl'
  weight?: 'normal' | 'medium' | 'semibold' | 'bold'
  tone?: 'default' | 'muted' | 'accent' | 'inverse'
  align?: 'left' | 'center' | 'right'
  text?: string
}>(), {
  as: 'p',
  size: undefined,
  weight: undefined,
  tone: 'default',
  align: 'left',
  text: '',
})

const SIZE = { 'xs': 'text-xs', 'sm': 'text-sm', 'md': 'text-base', 'lg': 'text-lg', 'xl': 'text-xl', '2xl': 'text-2xl', '3xl': 'text-3xl' }
const WEIGHT = { normal: 'font-normal', medium: 'font-medium', semibold: 'font-semibold', bold: 'font-bold' }
const TONE = { default: '', muted: 'text-gray-500 dark:text-gray-400', accent: 'text-[--accent]', inverse: 'text-white dark:text-black' }
const ALIGN = { left: 'text-left', center: 'text-center', right: 'text-right' }
const DEFAULT_SIZE = { h1: '3xl', h2: 'xl', h3: 'lg', p: 'md', span: 'md', label: 'xs' } as const
const DEFAULT_WEIGHT = { h1: 'normal', h2: 'semibold', h3: 'semibold', p: 'normal', span: 'normal', label: 'normal' } as const

const classes = computed(() => [
  SIZE[props.size ?? DEFAULT_SIZE[props.as]],
  WEIGHT[props.weight ?? DEFAULT_WEIGHT[props.as]],
  TONE[props.tone],
  ALIGN[props.align],
  'leading-tight',
  props.text.includes('\n') ? 'whitespace-pre-line' : '',
])
</script>

<template>
  <component :is="as" :class="classes">
    <slot>{{ text }}</slot>
  </component>
</template>
