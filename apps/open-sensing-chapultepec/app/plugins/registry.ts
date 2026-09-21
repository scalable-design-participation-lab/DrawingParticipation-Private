import { defineNuxtPlugin } from '#app'
// A side-effect import: this is what runs the app's registerCollection calls,
// so a data source that names a contract can find it. Every component the
// specs draw is base's, so nothing is registered here.
import '../contracts'

export default defineNuxtPlugin(() => {})
