import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useSiteStore = defineStore('site', () => {
  const selectedSite = ref('')
  const selectedSiteProps = ref({})
  const development = ref('')

  const updateSelectedSite = (site) => {
    selectedSite.value = site
  }

  const updateSelectedSiteProps = (props) => {
    selectedSiteProps.value = props
  }

  return {
    selectedSite,
    selectedSiteProps,
    development,
    updateSelectedSite,
    updateSelectedSiteProps,
  }
})
