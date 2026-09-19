<script setup lang="ts">
/**
 * A form described by data: one object in, one object out.
 * `fields` says what to render; `modelValue` holds the values keyed by field
 * name. Two looks: "box" (Nuxt UI defaults) and "underline" (the Figma
 * "FECHA_" style).
 */
export interface FormField {
  name: string
  label?: string
  type?: 'text' | 'email' | 'password' | 'textarea' | 'number' | 'date' | 'time' | 'select'
  placeholder?: string
  rows?: number
  options?: { label: string, value: string | number }[]
  required?: boolean
  /** Extra classes on the control (e.g. a width). */
  class?: string
}

const props = withDefaults(defineProps<{
  fields: FormField[]
  modelValue?: Record<string, unknown>
  variant?: 'box' | 'underline'
  /** "stacked": label above the control; "inline": label and control on one line. */
  layout?: 'stacked' | 'inline'
  submitLabel?: string
  /** Gap between fields (Tailwind class). */
  gap?: string
  /** Fields stacked (column, default) or side by side (row). */
  direction?: 'column' | 'row'
  labelClass?: string
  /** field name -> message, shown under the control. */
  errors?: Record<string, string>
}>(), {
  modelValue: () => ({}),
  variant: 'box',
  layout: 'stacked',
  submitLabel: '',
  gap: 'gap-6',
  direction: 'column',
  labelClass: '',
  errors: () => ({}),
})

const emit = defineEmits<{
  'update:modelValue': [value: Record<string, unknown>]
  'submit': [value: Record<string, unknown>]
}>()

function update(name: string, value: unknown) {
  emit('update:modelValue', { ...props.modelValue, [name]: value })
}

const underline = 'w-full !border-b border-current rounded-none px-0 py-1 bg-transparent placeholder:!text-current'
</script>

<template>
  <form class="flex" :class="[gap, direction === 'row' ? 'flex-row flex-wrap items-baseline' : 'flex-col']" @submit.prevent="emit('submit', modelValue)">
    <label
      v-for="field in fields"
      :key="field.name"
      class="flex"
      :class="layout === 'inline' ? 'items-baseline gap-2' : 'flex-col gap-2'"
    >
      <span v-if="field.label" class="whitespace-nowrap text-sm" :class="labelClass">{{ field.label }}</span>

      <UTextarea
        v-if="field.type === 'textarea'"
        :model-value="(modelValue[field.name] as string) ?? ''"
        :rows="field.rows ?? 4"
        :placeholder="field.placeholder"
        :required="field.required"
        :variant="variant === 'underline' ? 'none' : 'outline'"
        :padded="variant !== 'underline'"
        :textarea-class="variant === 'underline' ? `${underline} ${field.class ?? ''}` : field.class"
        class="w-full"
        @update:model-value="update(field.name, $event)"
      />
      <USelect
        v-else-if="field.type === 'select'"
        :model-value="(modelValue[field.name] as string) ?? ''"
        :options="field.options ?? []"
        :placeholder="field.placeholder"
        :required="field.required"
        :variant="variant === 'underline' ? 'none' : 'outline'"
        :padded="variant !== 'underline'"
        :select-class="variant === 'underline' ? `${underline} ${field.class ?? ''}` : field.class"
        class="w-full"
        @update:model-value="update(field.name, $event)"
      />
      <UInput
        v-else
        :model-value="(modelValue[field.name] as string) ?? ''"
        :type="field.type ?? 'text'"
        :placeholder="field.placeholder"
        :required="field.required"
        :variant="variant === 'underline' ? 'none' : 'outline'"
        :padded="variant !== 'underline'"
        :input-class="variant === 'underline' ? `${underline} ${field.class ?? ''}` : field.class"
        class="w-full"
        @update:model-value="update(field.name, $event)"
      />
      <span v-if="errors[field.name]" class="text-xs text-red-600">{{ errors[field.name] }}</span>
    </label>

    <UButton v-if="submitLabel" type="submit" color="black" class="self-start">
      {{ submitLabel }}
    </UButton>
  </form>
</template>
