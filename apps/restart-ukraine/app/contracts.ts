import { z } from 'zod'
import './utils/styles'
import { declareHandler, registerContract } from '../../../base/app/contracts'

/**
 * Contracts for restart-ukraine's own components, so the pages can be specs.
 * Plain module (no Nuxt auto-imports): the verifier CLI loads it with
 * `--contracts apps/restart-ukraine/app/contracts.ts`.
 */

function modal(name: string, description: string) {
  return registerContract({
    name,
    description,
    props: z.strictObject({ modelValue: z.boolean().optional() }),
    emits: ['update:modelValue'],
  })
}

registerContract({
  name: 'RuMap',
  description: 'Background map with the drawing layer, comment popups and comment display (Гуртома́).',
  props: z.strictObject({
    showAllPlusIcons: z.boolean().optional(),
    showCommentIcons: z.boolean().optional(),
    mapType: z.enum(['vector', 'satellite']).optional(),
    blurred: z.boolean().optional(),
  }),
  emits: ['show-comment-display', 'update:model-value', 'update:selectedFeature'],
  stateful: true,
})

registerContract({
  name: 'SideBar',
  description: 'Right-hand accordion with the participation sub-windows. Drives the drawing/sidebar stores.',
  props: z.strictObject({}),
  stateful: true,
})

registerContract({
  name: 'LoadingScreen',
  description: 'Full-screen loading splash with a fake progress bar; emits `done` when it reaches 100 %.',
  props: z.strictObject({}),
  emits: ['done'],
})

registerContract({
  name: 'OnboardingModal',
  description: 'Welcome card with a sign-up call to action.',
  props: z.strictObject({ isVisible: z.boolean() }),
  emits: ['showRegistration'],
})

registerContract({
  name: 'RegistrationModal',
  description: 'Registration form backed by Firebase; emits `registered` on success.',
  props: z.strictObject({ isVisible: z.boolean().optional() }),
  emits: ['close', 'registered'],
  stateful: true,
})

registerContract({
  name: 'AnalysisPanel',
  description: 'Analysis dashboard (metadata, layer cards) and layer controls. `modelValue` = dashboard open.',
  props: z.strictObject({ modelValue: z.boolean().optional() }),
  emits: ['update:modelValue'],
  stateful: true,
})

registerContract({
  name: 'AnalysisLayers',
  description: 'The active analysis layers; goes in the BackgroundMap "layers" slot.',
  props: z.strictObject({}),
  stateful: true,
})

modal('MenuModal', 'Site menu (home / about / support / results).')
modal('MapIntroModal', 'How-to-read-the-map intro.')
modal('SupportModal', 'Help / support dialog.')
registerContract({
  name: 'ComingSoonModal',
  description: 'Download dialog placeholder; emits `download` with { format } when wired.',
  props: z.strictObject({ modelValue: z.boolean() }),
  emits: ['update:modelValue', 'download'],
})

declareHandler('downloadData', 'Download the collected data as JSON or CSV. Payload: { format }')
