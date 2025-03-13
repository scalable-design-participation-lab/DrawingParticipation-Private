<script setup>
import { ref } from 'vue';
import RangeBrush from '@base/components/Tools/RangeBrush.vue';
import BarChart from '@base/components/Tools/BarChart.vue';
const chartData = [
  { name: "Item 1", value: 12, color: "#4e79a7" },
  { name: "Item 2", value: 35, color: "#4e79a7" },
  { name: "Item 3", value: 42, color: "#4e79a7" },
  { name: "Item 1", value: 12, color: "#4e79a7" },
  { name: "Item 2", value: 35, color: "#4e79a7" },
  { name: "Item 1", value: 12, color: "#4e79a7" },
  { name: "Item 2", value: 35, color: "#4e79a7" },
  { name: "Item 3", value: 42, color: "#4e79a7" },
  { name: "Item 4", value: 27, color: "#4e79a7" },
  { name: "Item 5", value: 53, color: "#4e79a7" },
  { name: "Item 6", value: 19, color: "#4e79a7" },
  { name: "Item 7", value: 62, color: "#4e79a7" },
  { name: "Item 8", value: 38, color: "#4e79a7" },
  { name: "Item 9", value: 45, color: "#4e79a7" },
  { name: "Item 10", value: 29, color: "#4e79a7" },
  { name: "Item 3", value: 42, color: "#4e79a7" },
  { name: "Item 1", value: 12, color: "#4e79a7" },
  { name: "Item 2", value: 35, color: "#4e79a7" },
  { name: "Item 3", value: 42, color: "#4e79a7" },
  { name: "Item 4", value: 27, color: "#4e79a7" },
  { name: "Item 5", value: 53, color: "#4e79a7" },
  { name: "Item 6", value: 19, color: "#4e79a7" },
  { name: "Item 7", value: 62, color: "#4e79a7" },
  { name: "Item 8", value: 38, color: "#4e79a7" },
  { name: "Item 9", value: 45, color: "#4e79a7" },
  { name: "Item 10", value: 29, color: "#4e79a7" },
  { name: "Item 3", value: 42, color: "#4e79a7" },
  { name: "Item 4", value: 27, color: "#4e79a7" },
  { name: "Item 5", value: 53, color: "#4e79a7" },
  { name: "Item 6", value: 19, color: "#4e79a7" },
  { name: "Item 7", value: 62, color: "#4e79a7" },
  { name: "Item 8", value: 38, color: "#4e79a7" },
  { name: "Item 9", value: 45, color: "#4e79a7" },
  { name: "Item 10", value: 29, color: "#4e79a7" },
  { name: "Item 11", value: 51, color: "#4e79a7" },
  { name: "Item 12", value: 22, color: "#4e79a7" },
  { name: "Item 13", value: 47, color: "#4e79a7" },
  { name: "Item 14", value: 33, color: "#4e79a7" },
  { name: "Item 4", value: 27, color: "#4e79a7" },
  { name: "Item 5", value: 53, color: "#4e79a7" },
  { name: "Item 6", value: 19, color: "#4e79a7" },
  { name: "Item 7", value: 62, color: "#4e79a7" },
  { name: "Item 8", value: 38, color: "#4e79a7" },
  { name: "Item 9", value: 45, color: "#4e79a7" },
  { name: "Item 10", value: 29, color: "#4e79a7" },
  { name: "Item 11", value: 51, color: "#4e79a7" },
  { name: "Item 12", value: 22, color: "#4e79a7" },
  { name: "Item 13", value: 47, color: "#4e79a7" },
  { name: "Item 14", value: 33, color: "#4e79a7" },
  { name: "Item 15", value: 58, color: "#4e79a7" },
]

</script>

<template>
  <RangeBrush class="w-[1000px]" />
  <BarChart :data="chartData" :width="100" :height="50" />
</template>