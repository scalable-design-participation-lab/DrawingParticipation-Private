<script setup lang="ts">
import * as d3 from 'd3'
import { computed, onMounted, ref, watch } from 'vue'

const props = defineProps({
  width: { type: Number, default: 1500 },
  height: { type: Number, default: 200 },
  startDate: { type: Date, default: () => new Date(2013, 7, 1) },
  endDate: { type: Date, default: () => new Date(2014, 7, 1) },
  intervalHours: { type: Number, default: 730 },
  step: { type: Number, default: 1 },
})

const container = ref<SVGSVGElement | null>(null)
const margin = { top: 10, right: 0, bottom: 20, left: 0 }
const isAnimating = ref(true)
const animationSpeed = ref(1000)
const animateBrushRef = ref<() => void>()
const step = ref(props.step)
const timeStepMs = computed(() => (step.value * props.intervalHours) * 60 * 60 * 1000)

const x = computed(() => d3.scaleTime()
  .domain([props.startDate, props.endDate])
  .range([margin.left, props.width - margin.right]),
)

const currentSelection = ref<[Date, Date]>([
  props.startDate,
  new Date(props.startDate.getTime() + timeStepMs.value),
])

const interval = computed(() => d3.timeDay.every(props.intervalHours))

onMounted(renderChart)
watch(() => [props.width, props.height, props.startDate, props.intervalHours], renderChart)

function renderChart() {
  if (!container.value)
    return

  d3.select(container.value).selectAll('*').remove()
  const svg = d3.select(container.value).attr('viewBox', `0 0 ${props.width} ${props.height}`)

  // Background grid lines
  svg.append('g')
    .attr('class', 'grid')
    .attr('transform', `translate(0,${props.height - margin.bottom})`)
    .call(d3.axisBottom(x.value)
      .ticks(interval.value)
      .tickSize(-props.height + margin.top + margin.bottom)
      .tickFormat(() => null))
    .selectAll('.tick line')
    .attr('stroke', '#ddd')
    .attr('stroke-opacity', 0.7)

  const brush = d3.brushX()
    .extent([[margin.left, margin.top], [props.width - margin.right, props.height - margin.bottom]])
    .on('end', brushended)

  svg.append('g').call(axis)
  const brushGroup = svg.append('g').call(brush)

  function brushended(event) {
    if (!event.sourceEvent || !event.selection)
      return
    const [x0, x1] = event.selection.map(d => interval.value.round(x.value.invert(d)))
    brushGroup.transition().ease(d3.easeLinear).call(brush.move, x1 > x0 ? [x.value(x0), x.value(x1)] : null)
    currentSelection.value = [x0, x1]
    // Find the step value to calculate the next selection
    step.value = Math.round((x1.getTime() - x0.getTime()) / timeStepMs.value)
    isAnimating.value = false
  }

  function animateBrush() {
    if (!isAnimating.value)
      return

    const [currentStart, currentEnd] = currentSelection.value
    const nextStart = new Date(currentStart.getTime() + timeStepMs.value)
    const nextEnd = new Date(currentEnd.getTime() + timeStepMs.value)
    // Reset the selection if it exceeds the domain
    if (nextEnd > x.value.domain()[1]) {
      nextStart.setTime(props.startDate.getTime())
      nextEnd.setTime(props.startDate.getTime() + (currentEnd.getTime() - currentStart.getTime()))
    }

    currentSelection.value = [nextStart, nextEnd]
    brushGroup.transition()
      .duration(animationSpeed.value)
      .call(brush.move, [x.value(nextStart), x.value(nextEnd)])
      .on('end', animateBrush)
  }
  animateBrushRef.value = animateBrush

  if (isAnimating.value)
    animateBrush()
}

function toggleAnimation() {
  isAnimating.value = !isAnimating.value
  if (isAnimating.value)
    animateBrushRef.value?.()
}

function axis(g) {
  g.attr('transform', `translate(0,${props.height - margin.bottom})`)
    .call(d3.axisBottom(x.value).ticks(interval.value).tickSize(-props.height + margin.top + margin.bottom).tickFormat(d3.timeFormat('%b %d')))
    .selectAll('.tick line')
    .attr('stroke', '#aaa')
}
</script>

<template>
  <div class="p-4">
    <p class="font-semibold">
      Current Selection: {{ currentSelection[0].toDateString() }} - {{ currentSelection[1].toDateString() }}
    </p>
    <div class="flex items-center gap-4 my-4">
      <label class="flex items-center gap-2">
        <span>Animation Speed (ms/day):</span>
        <input v-model.number="animationSpeed" type="number" min="100" step="100" class="border p-1 rounded w-24">
      </label>
      <button class="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded shadow" @click="toggleAnimation">
        {{ isAnimating ? '⏸ Pause' : '▶ Resume' }}
      </button>
    </div>
    <svg ref="container" class="w-full" />
  </div>
</template>
