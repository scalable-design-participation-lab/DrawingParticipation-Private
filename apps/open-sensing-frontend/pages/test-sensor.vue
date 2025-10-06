<template>
  <div class="p-4">
    <UCard class="max-w-3xl mx-auto">
      <template #header>
        <h2 class="text-xl font-bold">Sensor Data Test</h2>
      </template>

      <div class="space-y-6">
        <!-- Test Data Input -->
        <div>
          <UTextarea
            v-model="testData"
            label="Test Data (JSON format)"
            :rows="12"
            class="font-mono text-sm"
            placeholder="Enter JSON test data here..."
          />
        </div>

        <!-- Action Buttons -->
        <div class="flex gap-4">
          <UButton
            color="blue"
            :loading="isLoading"
            :disabled="isLoading"
            @click="sendTestData"
          >
            {{ isLoading ? 'Sending...' : 'Send Test Data' }}
          </UButton>
          <UButton variant="outline" @click="loadSampleData">
            Load Sample Data
          </UButton>
          <UButton variant="soft" color="gray" @click="clearData">
            Clear Data
          </UButton>
        </div>

        <!-- Response Display -->
        <div v-if="response" class="mt-4">
          <h3 class="font-bold mb-2">Response:</h3>
          <pre class="bg-gray-50 p-4 rounded-lg border text-sm overflow-auto">{{
            JSON.stringify(response, null, 2)
          }}</pre>
        </div>

        <!-- Error Display -->
        <UAlert
          v-if="error"
          color="red"
          variant="soft"
          icon="i-heroicons-exclamation-triangle"
          :title="error.title || 'Error'"
          :description="error.message || error"
        />
      </div>
    </UCard>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { logger } from '../utils/logger'

const testData = ref('')
const response = ref(null)
const error = ref('')
const isLoading = ref(false)

// Sample test data
const sampleData = {
  ID: 'sensor:860322068064283',
  Temperature: 25.5,
  Relative_Humidity: 60,
  VOC: 100,
  NOx: 50,
  PM1: 10,
  PM25: 25,
  PM4: 40,
  PM10: 100,
  Soil_Moisture: 75,
  Solar_Input_Current: 2.5,
  Battery_Level: 85,
  Lat: 42.3398,
  Lon: -71.0892,
  Local_Temp: 24.5,
  Voltage: 3.7,
  timestamp: Math.floor(Date.now() / 1000),
  'BME-Temp': 25.2,
}

const loadSampleData = () => {
  testData.value = JSON.stringify(sampleData, null, 2)
  error.value = ''
  response.value = null
}

const clearData = () => {
  testData.value = ''
  error.value = ''
  response.value = null
}

const sendTestData = async () => {
  if (!testData.value.trim()) {
    error.value = {
      title: 'Validation Error',
      message: 'Please enter test data',
    }
    return
  }

  isLoading.value = true
  error.value = ''
  response.value = null

  try {
    // Parse JSON data
    const data = JSON.parse(testData.value)
    logger.info('Sending test data:', data)

    // Send request
    response.value = await $fetch('/api/insert', {
      method: 'POST',
      body: data,
    })

    logger.info('Received response:', response.value)
  } catch (e) {
    logger.error('Error in sendTestData:', e)
    error.value = {
      title: 'Error',
      message:
        e instanceof SyntaxError
          ? 'Invalid JSON format, please check input data'
          : e.message || 'Error sending data',
    }
  } finally {
    isLoading.value = false
  }
}

// Load sample data on mount
onMounted(() => {
  logger.info('Test sensor page mounted')
  loadSampleData()
})
</script>

<style scoped>
pre {
  max-height: 400px;
}
</style>
