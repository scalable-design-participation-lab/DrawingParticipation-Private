<template>
  <GeneralizedBackgroundMap
    ref="baseMap"
    :mapbox-style-light="mapboxStyleLight"
    :mapbox-style-dark="mapboxStyleDark"
    @toggle-icon-details="handleTogglePopup"
  >
    <template #layers>
      <DrawingLayer
        :projection="projection"
        :is-map-page="isMapPage"
        :show-delete-button="false"
        :showCommentIcons= "false"
        :show-all-plus-icons="false"
        :feature-filter="featureFilter"
      />
    </template>
  </GeneralizedBackgroundMap>

  <!-- Info Popup -->
  <InfoPopup
    v-if="showPopup && selectedFeature"
    :title="selectedFeature.comment"
    :date-published="selectedFeature.properties?.date || 'hi'"
    :imagePath="'/Solution_Photos/'+ selectedFeature.properties?.string_id +'/1.png'"
    :location="selectedFeature.properties?.location || 'hi'"
    :caption="selectedFeature.properties?.mediaCaptions || 'hi'"
    :description="selectedFeature.properties?.description || 'hi'"
    :connection="selectedFeature.properties?.mncConnection || 'hi'"
    :links="parsedLinks"
    @close="closePopup"
  />
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'nuxt/app'
import { useFilterStore } from '../stores/filter'
import InfoPopup from './infoPopup.vue'

const route = useRoute()
const projection = ref('EPSG:3857')
const isMapPage = computed(() => route.name === 'result')
const baseMap = ref(null)

const filterStore = useFilterStore()

const selectedFeature = computed(() => filterStore.selectedFeature)
const showPopup = computed(() => selectedFeature.value !== null)

// Parse links from semicolon-separated string
const parsedLinks = computed(() => {
  if (!selectedFeature.value?.properties?.links) {
    return []
  }

  const linksString = selectedFeature.value.properties.links
  // Split by semicolon and filter out empty strings
  return linksString
    .split(';')
    .map(link => link.trim())
    .filter(link => link.length > 0)
    .map(link => ({ label: link, url: '' }))
})

function handleTogglePopup(feature: any) {
  filterStore.selectFeature(feature)
}

function closePopup() {
  filterStore.clearSelection()
}

const featureFilter = (feature: any) => filterStore.isFeatureVisible(feature)

const mapboxStyleLight = 'restartukraine/cm3p0s3gw00yd01seasye5jdw'
const mapboxStyleDark = 'restartukraine/cm3p4jqnj009y01s79ngdah4r'
</script>
