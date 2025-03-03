import { defineStore } from 'pinia'
import type { FeatureCollection, Geometry } from 'geojson'

export const useDataStore = defineStore('data', () => {
  const data = ref<FeatureCollection<Geometry> | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  /**
   * Set the GeoJSON data manually
   */
  function setData(newData: FeatureCollection<Geometry>) {
    data.value = newData
  }

  /**
   * Clear stored data
   */
  function clearData() {
    data.value = null
  }

  /**
   * Fetch data from an API
   */
  async function fetchData(url: string) {
    isLoading.value = true
    error.value = null
    try {
      const response = await fetch(url)
      if (!response.ok)
        throw new Error(`Failed to fetch: ${response.statusText}`)
      const jsonData = (await response.json()) as FeatureCollection<Geometry>
      setData(jsonData)
    }
    catch (err) {
      error.value = (err as Error).message
    }
    finally {
      isLoading.value = false
    }
  }

  /**
   * Process uploaded GeoJSON files
   */
  function processGeoJSONFile(file: File) {
    isLoading.value = true
    error.value = null

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const geojsonData = JSON.parse(event.target?.result as string) as FeatureCollection<Geometry>
        setData(geojsonData)
      }
      catch (err) {
        error.value = 'Invalid GeoJSON file'
        console.error('Failed to parse GeoJSON:', err)
      }
      finally {
        isLoading.value = false
      }
    }
    reader.readAsText(file)
  }

  return {
    data,
    isLoading,
    error,
    setData,
    clearData,
    fetchData,
    processGeoJSONFile,
  }
})
