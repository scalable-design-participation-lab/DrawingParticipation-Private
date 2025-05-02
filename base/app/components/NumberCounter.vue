<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'

const props = defineProps({
  startNumber: {
    type: Number,
    default: 0,
  },
  endNumber: {
    type: Number,
    required: true,
  },
  step: {
    type: Number,
    default: 1,
  },
  tickRate: {
    type: Number,
    default: 50,
    validator: value => value > 0,
  },
  format: {
    type: String,
    default: null,
  },
  autoStart: {
    type: Boolean,
    default: true,
  },
  numberClass: {
    type: String,
    default: '',
  },
  triggerAnimation: {
    type: Number,
    default: 0,
  },
})

const emit = defineEmits(['completed', 'update'])

const currentNumber = ref(props.startNumber)
let intervalId = null

const formattedNumber = computed(() => {
  if (!props.format) {
    return currentNumber.value.toString()
  }

  if (props.format === 'currency') {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: 'USD',
    }).format(currentNumber.value)
  }
  else if (props.format === 'percent') {
    return new Intl.NumberFormat(undefined, {
      style: 'percent',
      minimumFractionDigits: 2,
    }).format(currentNumber.value / 100)
  }
  else if (props.format === 'comma') {
    return new Intl.NumberFormat().format(currentNumber.value)
  }
  else if (props.format.startsWith('decimal:')) {
    const places = Number.parseInt(props.format.split(':')[1]) || 2
    return currentNumber.value.toFixed(places)
  }

  return currentNumber.value.toString()
})

function startAnimation() {
  stopAnimation()
  currentNumber.value = props.startNumber

  intervalId = setInterval(() => {
    if (props.startNumber <= props.endNumber) {
      currentNumber.value = Math.min(
        currentNumber.value + props.step,
        props.endNumber,
      )
    }
    else {
      currentNumber.value = Math.max(
        currentNumber.value - props.step,
        props.endNumber,
      )
    }

    emit('update', currentNumber.value)

    if (
      (props.startNumber <= props.endNumber && currentNumber.value >= props.endNumber)
      || (props.startNumber > props.endNumber && currentNumber.value <= props.endNumber)
    ) {
      stopAnimation()
      emit('completed')
    }
  }, props.tickRate)
}

function stopAnimation() {
  if (intervalId !== null) {
    clearInterval(intervalId)
    intervalId = null
  }
}

onMounted(() => {
  if (props.autoStart) {
    startAnimation()
  }
})

onUnmounted(() => {
  stopAnimation()
})

watch(() => props.triggerAnimation, () => {
  startAnimation()
})

watch([() => props.startNumber, () => props.endNumber], () => {
  if (props.autoStart) {
    startAnimation()
  }
})

defineExpose({
  startAnimation,
  stopAnimation,
  currentNumber,
})
</script>

<template>
  <div class="text-center">
    <slot name="prefix" />
    <span :class="numberClass">{{ formattedNumber }}</span>
    <slot name="suffix" />
  </div>
</template>
