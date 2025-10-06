import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import * as d3 from 'd3'

export const useSolutionsStore = defineStore('solutions', () => {
  const masterSolutions = ref([])
  const selectedSolution = ref({})
  const parsedSolutions = ref([])
  const solutionsObject = ref({})

  const loadMasterSolutions = async () => {
    const response = await fetch('/master_solutions.csv')
    const text = await response.text()
    const data = d3.csvParse(text, (d) => {
      const newD = {}
      Object.keys(d).forEach((key) => {
        newD[key] = +d[key]
      })
      return newD
    })
    masterSolutions.value = data
  }

  const setSelectedSolution = (solution) => {
    selectedSolution.value = solution
  }

  const updateParsedSolutions = (solutions) => {
    parsedSolutions.value = solutions
  }

  const updateSolutionsObject = (solutions) => {
    solutionsObject.value = solutions
  }

  const updatedMaxMinVals = computed(() => {
    const vals = {}
    if (masterSolutions.value.length === 0) return vals
    Object.keys(masterSolutions.value[0]).forEach(
      (key) =>
        (vals[key] = {
          max: Math.max(...masterSolutions.value.map((o) => o[key])),
          min: Math.min(...masterSolutions.value.map((o) => o[key])),
        })
    )
    return vals
  })

  const feasibleSites = computed(() => {
    const MIN_HUB_AREA = 2 // acres
    return parsedSolutions.value.filter(
      (site) => site.AREA_BUILD >= MIN_HUB_AREA && site.HAS_ECO_HUB === '0.0'
    )
  })

  const builtSites = computed(() =>
    parsedSolutions.value.filter((site) => site.BUILT !== '0')
  )

  return {
    masterSolutions,
    selectedSolution,
    parsedSolutions,
    solutionsObject,
    loadMasterSolutions,
    setSelectedSolution,
    updateParsedSolutions,
    updateSolutionsObject,
    updatedMaxMinVals,
    feasibleSites,
    builtSites,
  }
})
