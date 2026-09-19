import GeneralizedBackgroundMap from '../components/GeneralizedBackgroundMap.vue'
import GeneralizedHeader from '../components/GeneralizedHeader.vue'
import GeneralizedFooter from '../components/GeneralizedFooter.vue'
import Modal from '../components/Modal.vue'
import MarkerOverlay from '../components/MarkerOverlay.vue'
import FeatureLayer from '../components/FeatureLayer.vue'
import StepCard from '../components/StepCard.vue'
import Accordion from '../components/Accordion.vue'
import FileDropZone from '../components/FileDropZone.vue'
import PhotoDropZone from '../components/PhotoDropZone.vue'
import FormFields from '../components/FormFields.vue'
import MapTypeToggle from '../components/MapTypeToggle.vue'
import GenericFilterSidebar from '../components/FilterSidebar/GenericFilterSidebar.vue'
import GenericToolbar from '../components/toolbar/GenericToolbar.vue'
import ToolTips from '../components/Tools/ToolTips.vue'
import Stack from '../components/Stack.vue'
import Grid from '../components/Grid.vue'
import Panel from '../components/Panel.vue'
import Text from '../components/Text.vue'
import Image from '../components/Image.vue'
import { registerComponent } from '../utils/registry'
import { defineNuxtPlugin } from '#app'
import { UButton, UCard, UDivider, UIcon } from '#components'
// Registers the base contracts and style presets as side effects.
import '../contracts/components'
import '../utils/styles'

/**
 * Wires every generalized base component to its contract name so JSON specs
 * can reference them. Apps add their own in a plugin of their own.
 */
export default defineNuxtPlugin(() => {
  registerComponent('BackgroundMap', GeneralizedBackgroundMap)
  registerComponent('Header', GeneralizedHeader)
  registerComponent('Footer', GeneralizedFooter)
  registerComponent('Modal', Modal)
  registerComponent('MarkerOverlay', MarkerOverlay)
  registerComponent('FeatureLayer', FeatureLayer)
  registerComponent('StepCard', StepCard)
  registerComponent('Accordion', Accordion)
  registerComponent('FileDropZone', FileDropZone)
  registerComponent('PhotoDropZone', PhotoDropZone)
  registerComponent('FormFields', FormFields)
  registerComponent('MapTypeToggle', MapTypeToggle)
  registerComponent('FilterSidebar', GenericFilterSidebar)
  registerComponent('Toolbar', GenericToolbar)
  registerComponent('ToolTips', ToolTips)
  registerComponent('Stack', Stack)
  registerComponent('Grid', Grid)
  registerComponent('Panel', Panel)
  registerComponent('Text', Text)
  registerComponent('Image', Image)

  // Nuxt UI primitives content pages need. They are lazy global components,
  // so they come from Nuxt's `#components` map rather than `vueApp.component()`.
  registerComponent('Button', UButton)
  registerComponent('Divider', UDivider)
  registerComponent('Card', UCard)
  registerComponent('Icon', UIcon)
})
