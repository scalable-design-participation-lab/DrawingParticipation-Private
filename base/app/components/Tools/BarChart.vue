<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import * as d3 from 'd3'

const props = defineProps({
  data: Array as () => { name: string, value: number, color: string }[],
  width: { type: Number, default: 500 },
  height: { type: Number, default: 300 },
  margin: { type: Object, default: () => ({ top: 30, right: 20, bottom: 50, left: 40 }) },
})

const chart = ref<HTMLElement | null>(null)

watch(() => props.data, () => drawChart(), { deep: true })

onMounted(() => drawChart())

function drawChart() {
  if (!chart.value || !props.data.length)
    return

  d3.select(chart.value).selectAll('*').remove()

  const { width, height, margin } = props
  const values = props.data.map(d => d.value)
  const [minVal, maxVal] = d3.extent(values) as [number, number]

  // Generate histogram bins
  const histogram = d3.bin<number, number>()
    .value(d => d)
    .domain([minVal, maxVal])
    .thresholds(10) // Adjust number of bins
  const bins = histogram(values)

  const svg = d3.select(chart.value)
    .append('svg')
    .attr('viewBox', [0, 0, width, height])

  // Create scales
  const x = d3.scaleLinear()
    .domain([minVal, maxVal])
    .range([margin.left, width - margin.right])

  const y = d3.scaleLinear()
    .domain([0, d3.max(bins, b => b.length) || 0])
    .range([height - margin.bottom, margin.top])

  // Draw bars
  const bars = svg.append('g')
    .selectAll('rect')
    .data(bins)
    .join('rect')
    .attr('x', d => x(d.x0 || 0))
    .attr('y', d => y(d.length))
    .attr('width', d => Math.max(0, x(d.x1 || 0) - x(d.x0 || 0) - 1))
    .attr('height', d => y(0) - y(d.length))
    .attr('fill', d => props.data.find(item => item.value === d.x0)?.color || 'steelblue')

  // Brush functionality
  const brush = d3.brushX()
    .extent([[margin.left, margin.top], [width - margin.right, height - margin.bottom]])
    .on('brush end', brushmove)

  const brushGroup = svg.append('g')
    .attr('class', 'brush')
    .call(brush)

  const handle = brushGroup.selectAll('.handle')
    .data([{ type: 'w' }, { type: 'e' }])
    .enter()
    .append('rect')
    .attr('class', 'handle')
    .attr('width', 4)
    .attr('height', height - margin.top - margin.bottom + 10)
    .attr('fill', '#ffcc00')
    .attr('stroke', '#ff3300')
    .attr('stroke-width', 5)
    .attr('rx', 4)
    .attr('cursor', 'ew-resize')

  function brushmove(event: any) {
    const selection = event.selection
    if (!selection) {
      bars.attr('fill', 'steelblue')
      return
    }

    const [x0, x1] = selection
    const brushMin = x.invert(x0)
    const brushMax = x.invert(x1)
    const dataFiltered = props.data.filter(d => d.value > brushMin && d.value < brushMax)

    bars.attr('fill', d =>
      (d.x1 > brushMin && d.x0 < brushMax) ? 'steelblue' : '#ccc')

    handle.attr('display', null)
      .attr('x', (d: any) => (d.type === 'w' ? x0 - 4 : x1 - 4))
      .attr('y', margin.top)

    // You can do something with `dataFiltered`, e.g., trigger an event or update the component state
    console.log(brushMin, brushMax, dataFiltered)
  }
}
</script>

<template>
  <div ref="chart" />
</template>
