import { registerComponent } from '../../../../base/app/utils/registry'
import GlyphCanvas from '../components/GlyphCanvas.vue'
import GlyphLegend from '../components/GlyphLegend.vue'
import WeatherGlyph from '../components/WeatherGlyph.vue'
import { weatherGlyphContract } from '../contracts'
import { defineNuxtPlugin } from '#app'

// App-local components that JSON specs may reference (base ones come from base's plugin).
export default defineNuxtPlugin(() => {
  registerComponent('WeatherGlyph', WeatherGlyph, weatherGlyphContract)
  registerComponent('GlyphLegend', GlyphLegend)
  registerComponent('GlyphCanvas', GlyphCanvas)
})
