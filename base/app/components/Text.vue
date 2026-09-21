<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useSpecLocale } from '../utils/i18n'

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
  /**
   * Render the value: an ISO date or a number in the reader's locale,
   * `relative` for how long ago ("3 days ago"), `host` for the domain of a
   * URL, which is what a link is worth showing under its own label.
   */
  format?: 'date' | 'datetime' | 'number' | 'relative' | 'host'
  /**
   * value -> label, for stored codes ("bici" -> "Bicicleta"); unknown values
   * show as-is. Nest it by language ({ pt: { bici: "Bicicleta" } }) when the
   * label differs per locale and the stored code does not.
   */
  labels?: Record<string, string | Record<string, string>>
  /** Shown when `text` is empty, e.g. a row's untranslated original. */
  fallback?: string | number
  /** Wrapped around the value once it is formatted, e.g. a unit or a currency. */
  prefix?: string
  suffix?: string
  /** Round a number to this many decimals before showing it. */
  decimals?: number
  /**
   * value -> colour, for stored codes, exactly like `labels` but for how it
   * reads. Pairs with the same map on an `Icon` so a theme looks the same
   * wherever it appears.
   */
  colors?: Record<string, string>
  /**
   * Fold to this many lines, with a link to open it. The link appears only
   * when the text really is longer, so a short one is left alone.
   */
  clamp?: number
  moreLabel?: string
  lessLabel?: string
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
  colors: undefined,
  clamp: 0,
  moreLabel: 'Read more',
  lessLabel: 'Read less',
})

const SIZE = { 'xs': 'text-xs', 'sm': 'text-sm', 'md': 'text-base', 'lg': 'text-lg', 'xl': 'text-xl', '2xl': 'text-2xl', '3xl': 'text-3xl' }
const WEIGHT = { normal: 'font-normal', medium: 'font-medium', semibold: 'font-semibold', bold: 'font-bold' }
const TONE = { default: '', muted: 'text-gray-500 dark:text-gray-400', accent: 'text-[--accent]', inverse: 'text-white dark:text-black' }
const ALIGN = { left: 'text-left', center: 'text-center', right: 'text-right' }
const DEFAULT_SIZE = { h1: '3xl', h2: 'xl', h3: 'lg', p: 'md', span: 'md', label: 'xs' } as const
const DEFAULT_WEIGHT = { h1: 'normal', h2: 'semibold', h3: 'semibold', p: 'normal', span: 'normal', label: 'normal' } as const

const wrap = (value: string) => (value === '' ? '' : `${props.prefix}${value}${props.suffix}`)

const locale = useSpecLocale()
// A table nested under the current language wins; anything else is flat, and
// a language with no table of its own falls through to the stored code.
const table = computed(() => {
  const nested = props.labels?.[locale.value]
  return (typeof nested === 'object' ? nested : props.labels) as Record<string, string> | undefined
})

const content = computed(() => {
  const given = props.text ?? ''
  const raw = given === '' || given === null ? props.fallback ?? '' : given
  const labelled = table.value?.[String(raw)]
  if (typeof labelled === 'string') {
    return wrap(labelled)
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
  if (props.format === 'host') {
    try {
      return wrap(new URL(String(raw)).hostname.replace(/^www\./, ''))
    }
    catch {
      return wrap(String(raw))
    }
  }
  // A bare "YYYY-MM-DD" is a calendar day, not UTC midnight (which would show the day before in the Americas).
  const date = typeof raw === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(raw) ? new Date(`${raw}T00:00:00`) : new Date(raw)
  if (Number.isNaN(date.getTime())) {
    return wrap(String(raw))
  }
  if (props.format === 'relative') {
    return wrap(ago(date))
  }
  return wrap(props.format === 'date' ? date.toLocaleDateString() : date.toLocaleString())
})

/** How long ago, in the reader's language, down to "just now". */
function ago(date: Date) {
  const seconds = Math.round((date.getTime() - Date.now()) / 1000)
  const rtf = new Intl.RelativeTimeFormat(locale.value || undefined, { numeric: 'auto' })
  const steps: [Intl.RelativeTimeFormatUnit, number][] = [['second', 60], ['minute', 60], ['hour', 24], ['day', 30], ['month', 12], ['year', Infinity]]
  let value = seconds
  for (const [unit, size] of steps) {
    if (Math.abs(value) < size) {
      return rtf.format(Math.round(value), unit)
    }
    value /= size
  }
  return date.toLocaleDateString()
}

const color = computed(() => props.colors?.[String(props.text ?? '')])

// Folding: the link only appears once the element really is taller than the
// clamp, so a two-line description is left alone.
const body = ref<HTMLElement | null>(null)
const expanded = ref(false)
const overflows = ref(false)

function measure() {
  const el = body.value
  overflows.value = !!el && !expanded.value && el.scrollHeight > el.clientHeight + 1
}

onMounted(measure)
watch([content, () => props.clamp], () => nextTick(measure))

const classes = computed(() => [
  SIZE[props.size ?? DEFAULT_SIZE[props.as]],
  WEIGHT[props.weight ?? DEFAULT_WEIGHT[props.as]],
  // An explicit colour wins over the tone, the way an icon's does.
  color.value ? '' : TONE[props.tone],
  ALIGN[props.align],
  'leading-tight',
  content.value.includes('\n') ? 'whitespace-pre-line' : '',
])

// `line-clamp-N` cannot be built from a variable and still be seen by
// Tailwind, so the clamp is inline.
const clampStyle = computed(() => (props.clamp && !expanded.value
  ? { display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: String(props.clamp), overflow: 'hidden' }
  : undefined))
</script>

<template>
  <component :is="as" v-if="!clamp" :class="classes" :style="color ? { color } : undefined">
    <slot>{{ content }}</slot>
  </component>
  <div v-else>
    <component :is="as" ref="body" :class="classes" :style="{ ...(color ? { color } : {}), ...clampStyle }">
      <slot>{{ content }}</slot>
    </component>
    <button v-if="overflows || expanded" type="button" class="mt-2 text-sm font-semibold text-[--accent] hover:underline" @click="expanded = !expanded">
      {{ expanded ? lessLabel : moreLabel }}
    </button>
  </div>
</template>
