import { flushPromises, mount } from '@vue/test-utils'
import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import SpecRenderer from '@base/components/SpecRenderer.vue'
import List from '@base/components/List.vue'
import Stack from '@base/components/Stack.vue'
import Text from '@base/components/Text.vue'
import SpecIcon from '@base/components/SpecIcon.vue'
import FileDropZone from '@base/components/FileDropZone.vue'
import { registerComponent } from '@base/utils/registry'
import { registerHandler } from '@base/utils/handlers'
import { registerStyle } from '@base/utils/styles'
import '@base/contracts/components'
import manifest from '../../app.json'
import spec from '../index.json'

/**
 * "Join Our Research": seven steps, a dropped pin, and a submission that
 * becomes a pending map entry. It used to be 584 lines of Vue.
 */
const Button = {
  props: ['label', 'icon', 'size', 'color', 'variant', 'disabled'],
  template: '<button :disabled="disabled">{{ label }}</button>',
}
const FormFields = {
  props: ['fields', 'modelValue'],
  emits: ['update:modelValue'],
  template: '<form><input v-for="f in fields" :key="f.name" :name="f.name"></form>',
}
const VoiceRecorder = { template: '<div class="recorder" />' }

const calls: { name: string, payload: unknown, args: unknown }[] = []

function find(nodes: any[], match: (n: any) => boolean): any {
  for (const n of nodes ?? []) {
    if (!n || typeof n !== 'object') {
      continue
    }
    if (match(n)) {
      return n
    }
    const hit = find([...(n.children ?? []), ...(n.item ? [n.item] : [])], match)
    if (hit) {
      return hit
    }
  }
  return null
}

beforeAll(() => {
  for (const [name, classes] of Object.entries(manifest.styles)) {
    registerStyle(name, classes)
  }
  registerComponent('List', List)
  registerComponent('Stack', Stack)
  registerComponent('Text', Text)
  registerComponent('Icon', SpecIcon)
  registerComponent('Button', Button)
  registerComponent('FormFields', FormFields)
  registerComponent('FileDropZone', FileDropZone)
  registerComponent('VoiceRecorder', VoiceRecorder)
  // `step` is base's, and the real one is what the wizard walks on.
  registerHandler('step', (_p, ctx, args) => {
    const { of: key, by = 1, min = 1, max } = args as { of: string, by?: number, min?: number, max?: number }
    const next = Number(ctx.state[key] ?? min) + by
    ctx.state[key] = Math.max(min, max === undefined ? next : Math.min(max, next))
  })
  for (const name of ['submitEntry', 'placeName']) {
    registerHandler(name, (payload: unknown, _ctx: unknown, args: unknown) => {
      calls.push({ name, payload, args })
    })
  }
})

const BLANK = {
  title: '',
  primaryTag: '',
  location: '',
  coordinate: null,
  example: '',
  why: '',
  date: '',
  additionalInfo: '',
  connectInfo: null,
  fullName: '',
  email: '',
  country: '',
  city: '',
}

function wizard(state: Record<string, unknown> = {}) {
  calls.length = 0
  const node = find(spec.children, n => n.style === 'wizard-shell')
  return mount(SpecRenderer, {
    props: {
      navigate: () => {},
      query: {},
      translate: (key: string) => key,
      spec: {
        version: 1 as const,
        state: {
          ...spec.state,
          wizardOpen: true,
          entry: { ...BLANK },
          ...state,
        },
        children: [node],
      },
    },
    global: { stubs: { UIcon: true, UButton: { template: '<button />' } } },
  })
}

function press(w: ReturnType<typeof wizard>, label: string) {
  return w.findAll('button').find(b => b.text() === label)!.trigger('click')
}

describe('the contribute wizard', () => {
  beforeEach(() => {
    calls.length = 0
  })

  it('is closed until something opens it', () => {
    expect(wizard({ wizardOpen: false }).text()).toBe('')
    // And it steps aside while the reader is placing a pin on the map.
    expect(wizard({ picking: true }).text()).toBe('')
  })

  it('shows how far along it is', async () => {
    const w = wizard({ wizardStep: 3 })
    await flushPromises()
    expect(w.findAll('.bg-\\[\\#FB6D6D\\]')).toHaveLength(3)
    expect(w.findAll('.bg-\\[\\#F8C9C9\\]')).toHaveLength(4)
  })

  it('will not leave step 1 without a title, a theme and a pin', async () => {
    const next = (entry: Record<string, unknown>) => {
      const w = wizard({ entry: { ...BLANK, ...entry } })
      return w.findAll('button').find(b => b.text() === 'contribute.next')!
    }
    expect(next({}).attributes('disabled')).toBeDefined()
    expect(next({ title: 'A map' }).attributes('disabled')).toBeDefined()
    expect(next({ title: 'A map', primaryTag: 'Art & Cultural Expression' }).attributes('disabled')).toBeDefined()
    expect(next({ title: 'A map', primaryTag: 'Art & Cultural Expression', coordinate: [1, 2] }).attributes('disabled')).toBeUndefined()
  })

  it('walks forward and back, and stops at the ends', async () => {
    const w = wizard({ wizardStep: 2 })
    await flushPromises()
    await press(w, 'contribute.next')
    expect(w.vm.state.wizardStep).toBe(3)
    await press(w, 'contribute.back')
    expect(w.vm.state.wizardStep).toBe(2)

    const first = wizard({ wizardStep: 1, entry: { ...BLANK } })
    await flushPromises()
    expect(first.findAll('button').find(b => b.text() === 'contribute.back')!.attributes('disabled')).toBeDefined()

    const last = wizard({ wizardStep: 7 })
    await flushPromises()
    // The last step submits instead of going further.
    expect(last.findAll('button').find(b => b.text() === 'contribute.next')).toBeUndefined()
    expect(last.findAll('button').find(b => b.text() === 'contribute.submit')).toBeDefined()
  })

  it('confirms a dropped pin before asking for anything else', async () => {
    const w = wizard({ wizardConfirmPin: true, entry: { ...BLANK, coordinate: [1, 2] }, placeName: 'Maré, Brazil' })
    await flushPromises()
    expect(w.text()).toContain('contribute.step1.confirmPinPrompt')
    expect(w.text()).toContain('Maré, Brazil')
    // Its Next dismisses the confirmation without advancing.
    await press(w, 'contribute.next')
    expect(w.vm.state).toMatchObject({ wizardConfirmPin: false, wizardStep: 1 })
  })

  it('hands the map back for a different spot', async () => {
    const w = wizard({ wizardConfirmPin: true, entry: { ...BLANK, coordinate: [1, 2] } })
    await flushPromises()
    await press(w, 'contribute.step1.movePin')
    expect(w.vm.state.picking).toBe(true)
  })

  it('asks for contact details only when someone says yes', async () => {
    const no = wizard({ wizardStep: 7 })
    await flushPromises()
    expect(no.text()).not.toContain('contribute.step7.ifYes')

    const yes = wizard({ wizardStep: 7, entry: { ...BLANK, connectInfo: true } })
    await flushPromises()
    expect(yes.text()).toContain('contribute.step7.ifYes')
    expect(yes.find('[name="email"]').exists()).toBe(true)
  })

  it('submits everything that was filled in, then says thank you', async () => {
    const entry = { ...BLANK, title: 'A map', primaryTag: 'Art & Cultural Expression', coordinate: [1, 2], example: 'We drew it together' }
    const w = wizard({ wizardStep: 7, entry })
    await flushPromises()
    await press(w, 'contribute.submit')
    await flushPromises()

    expect(calls).toHaveLength(1)
    expect(calls[0].name).toBe('submitEntry')
    expect(calls[0].payload).toMatchObject({ title: 'A map', coordinate: [1, 2], example: 'We drew it together' })
    expect((calls[0].payload as { files: Record<string, unknown> }).files).toHaveProperty('voiceExample')

    expect(w.vm.state.wizardSubmitted).toBe(true)
    expect(w.text()).toContain('contribute.thankYou')
  })

  it('starts over with nothing carried across', async () => {
    const w = wizard({ wizardSubmitted: true, wizardStep: 7, entry: { ...BLANK, title: 'A map' } })
    await flushPromises()
    await press(w, 'contribute.anotherStory')
    expect(w.vm.state).toMatchObject({ wizardStep: 1, wizardSubmitted: false, entry: BLANK })
  })

  it('closing puts the map back and forgets the draft', async () => {
    const w = wizard({ wizardStep: 4, entry: { ...BLANK, title: 'A map' }, mobileView: 'more' })
    await flushPromises()
    await press(w, 'contribute.close')
    expect(w.vm.state).toMatchObject({ wizardOpen: false, mobileView: 'map', wizardStep: 1, entry: BLANK })
  })
})
