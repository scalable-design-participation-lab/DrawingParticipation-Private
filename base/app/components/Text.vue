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
  /** Content; numbers (e.g. a bound `$data.rows.length`) are rendered as-is. */
  text?: string | number
  /** Render an ISO date / a number in the reader's locale. */
  format?: 'date' | 'datetime' | 'number'
  /** value -> label, for stored codes ("bici" -> "Bicicleta"); unknown values show as-is. */
  labels?: Record<string, string>
  /** Shown when `text` is empty, e.g. a row's untranslated original. */
  fallback?: string | number
  /** Wrapped around the value once it is formatted, e.g. a unit or a currency. */
  prefix?: string
  suffix?: string
  /** Round a number to this many decimals before showing it. */
  decimals?: number
}>(), {
  as: 'p',
  size: undefined,
  weight: undefined,
  tone: 'default',
  align: 'left',
  text: '',
  format: undefined,
  labels: undefined,
  fallback: '',
  prefix: '',
  suffix: '',
  decimals: undefined,
})

const SIZE = { 'xs': 'text-xs', 'sm': 'text-sm', 'md': 'text-base', 'lg': 'text-lg', 'xl': 'text-xl', '2xl': 'text-2xl', '3xl': 'text-3xl' }
const WEIGHT = { normal: 'font-normal', medium: 'font-medium', semibold: 'font-semibold', bold: 'font-bold' }
const TONE = { default: '', muted: 'text-gray-500 dark:text-gray-400', accent: 'text-[--accent]', inverse: 'text-white dark:text-black' }
const ALIGN = { left: 'text-left', center: 'text-center', right: 'text-right' }
const DEFAULT_SIZE = { h1: '3xl', h2: 'xl', h3: 'lg', p: 'md', span: 'md', label: 'xs' } as const
const DEFAULT_WEIGHT = { h1: 'normal', h2: 'semibold', h3: 'semibold', p: 'normal', span: 'normal', label: 'normal' } as const

const wrap = (value: string) => (value === '' ? '' : `${props.prefix}${value}${props.suffix}`)

const content = computed(() => {
  const given = props.text ?? ''
  const raw = given === '' || given === null ? props.fallback ?? '' : given
  if (props.labels && String(raw) in props.labels) {
    return wrap(props.labels[String(raw)])
  }
  if (raw === '') {
    return ''
  }
  if (props.decimals !== undefined && raw !== '' && !Number.isNaN(Number(raw))) {
    return wrap(Number(raw).toLocaleString(undefined, { maximumFractionDigits: props.decimals }))
  }
  if (!props.format) {
    return wrap(String(raw))
  }
  if (props.format === 'number') {
    return wrap(Number(raw).toLocaleString())
  }
  // A bare "YYYY-MM-DD" is a calendar day, not UTC midnight (which would show the day before in the Americas).
  const date = typeof raw === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(raw) ? new Date(`${raw}T00:00:00`) : new Date(raw)
  if (Number.isNaN(date.getTime())) {
    return wrap(String(raw))
  }
  return wrap(props.format === 'date' ? date.toLocaleDateString() : date.toLocaleString())
})

const classes = computed(() => [
  SIZE[props.size ?? DEFAULT_SIZE[props.as]],
  WEIGHT[props.weight ?? DEFAULT_WEIGHT[props.as]],
  TONE[props.tone],
  ALIGN[props.align],
  'leading-tight',
  content.value.includes('\n') ? 'whitespace-pre-line' : '',
])
</script>

<template>
  <component :is="as" :class="classes">
    <slot>{{ content }}</slot>
  </component>
</template>
