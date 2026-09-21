import { flushPromises, mount } from '@vue/test-utils'
import { beforeAll, describe, expect, it } from 'vitest'
import SpecRenderer from '@base/components/SpecRenderer.vue'
import List from '@base/components/List.vue'
import Stack from '@base/components/Stack.vue'
import Text from '@base/components/Text.vue'
import SpecImage from '@base/components/Image.vue'
import SpecAudio from '@base/components/Audio.vue'
import { registerComponent } from '@base/utils/registry'
import { registerHandler } from '@base/utils/handlers'
import '@base/contracts/components'
import { registerStyle } from '@base/utils/styles'
import manifest from '../../app.json'
import spec from '../index.json'

/**
 * The moderator queue can only be reached by signing in, so the browser cannot
 * show it without Firebase. This mounts that one node of the spec with the
 * rows a moderator would see, which is the part that used to be a component.
 */
// No `@click="$emit('click')"`: the listener the spec sets falls through to
// this button already, and re-emitting would fire every action twice.
const Button = {
  props: ['label', 'icon', 'to', 'size', 'color', 'variant'],
  template: '<button :data-icon="icon">{{ label }}</button>',
}

const calls: { name: string, payload: unknown }[] = []

beforeAll(() => {
  for (const [name, classes] of Object.entries(manifest.styles)) {
    registerStyle(name, classes)
  }
  registerComponent('List', List)
  registerComponent('Stack', Stack)
  registerComponent('Text', Text)
  registerComponent('Image', SpecImage)
  registerComponent('Audio', SpecAudio)
  registerComponent('Button', Button)
  for (const name of ['selectItem', 'loadContributions', 'approveEntry', 'deleteEntry', 'approveContribution', 'deleteContribution', 'signOut']) {
    registerHandler(name, (payload: unknown) => {
      calls.push({ name, payload })
    })
  }
})

/** The review panel as it sits in index.json, with a moderator's rows in state. */
function panel(extra: Record<string, unknown> = {}) {
  const node = spec.children[1].children.find(n => n.style === 'review-panel')
  return mount(SpecRenderer, {
    props: {
      navigate: () => {},
      query: {},
      translate: (key: string) => key,
      spec: {
        version: 1 as const,
        state: {
          isMobile: false,
          reviewOpen: true,
          reviewCollapsed: false,
          auth: { isAdmin: true, isSuperAdmin: false },
          selected: null,
          features: [],
          moderation: [
            { id: '1', string_id: 'user_a', title: 'A mutirao map', primaryTag: 'Community Mapping & Visibility', location: 'Mare, Rio', approved: false, i18n: { pt: { title: 'Mapa do mutirao' }, es: { title: 'Mapa de la minga' } } },
            { id: '2', string_id: 'user_b', title: 'Already live', primaryTag: 'Art & Cultural Expression', location: '', approved: true },
          ],
          pendingContributions: [
            { id: 'c1', projectId: 'user_a', projectTitle: 'A mutirao map', comment: 'Photo from Saturday', media: [{ kind: 'image', url: '/photo.webp', name: 'photo' }] },
          ],
          ...extra,
        },
        children: [node],
      },
    },
  })
}

describe('the moderator queue', () => {
  it('lists both queues with their counts', async () => {
    const w = panel()
    await flushPromises()
    const text = w.text()
    expect(text).toContain('A mutirao map')
    expect(text).toContain('Already live')
    expect(text).toContain('Photo from Saturday')
    // Counts come straight off the arrays.
    expect(text).toContain('mod.entries2')
    expect(text).toContain('mod.contributions1')
  })

  it('shows a submission as pending or live, never both', async () => {
    const w = panel()
    await flushPromises()
    const cards = w.findAll('[title="mod.showOnMap"]')
    expect(cards[0].text()).toContain('mod.pending')
    expect(cards[0].text()).not.toContain('mod.live')
    expect(cards[1].text()).toContain('mod.live')
    // A live submission has nothing left to approve.
    expect(cards[1].text()).not.toContain('mod.approve')
  })

  it('walks the translations a submission carries', async () => {
    const w = panel()
    await flushPromises()
    const first = w.findAll('[title="mod.showOnMap"]')[0].text()
    expect(first).toContain('pt')
    expect(first).toContain('Mapa do mutirao')
    expect(first).toContain('es')
    expect(first).toContain('Mapa de la minga')
  })

  it('selects the project when the card is clicked', async () => {
    calls.length = 0
    const w = panel()
    await flushPromises()
    await w.findAll('[title="mod.showOnMap"]')[0].trigger('click')
    expect(calls.map(c => c.name)).toEqual(['selectItem', 'loadContributions'])
    expect(calls[1].payload).toBe('user_a')
    expect(w.vm.state.reviewCollapsed).toBe(true)
  })

  it('approving does not also open the project', async () => {
    // The whole card is clickable, so every button on it has to stop there.
    calls.length = 0
    const w = panel()
    await flushPromises()
    const approve = w.findAll('[title="mod.showOnMap"]')[0].findAll('button').find(b => b.text() === 'mod.approve')!
    await approve.trigger('click')
    expect(calls.map(c => c.name)).toEqual(['approveEntry'])
    expect(calls[0].payload).toMatchObject({ string_id: 'user_a' })
    expect(w.vm.state.reviewCollapsed).toBe(false)
  })

  it('opening a contribution photo does not open the project either', async () => {
    calls.length = 0
    const w = panel()
    await flushPromises()
    await w.find('img').trigger('click')
    expect(calls).toEqual([])
  })

  it('says so when a queue is empty', async () => {
    const w = panel({ moderation: [], pendingContributions: [] })
    await flushPromises()
    expect(w.text()).toContain('mod.noEntries')
    expect(w.text()).toContain('mod.noContributions')
    expect(w.findAll('[title="mod.showOnMap"]')).toHaveLength(0)
  })

  it('collapses out of the way, keeping its header', async () => {
    const w = panel({ reviewCollapsed: true })
    await flushPromises()
    expect(w.text()).toContain('mod.review')
    expect(w.findAll('[title="mod.showOnMap"]')).toHaveLength(0)
  })

  it('offers the accounts page only to a super admin', async () => {
    const plain = panel()
    await flushPromises()
    expect(plain.findAll('[data-icon="i-heroicons-users"]')).toHaveLength(0)

    const superAdmin = panel({ auth: { isAdmin: true, isSuperAdmin: true } })
    await flushPromises()
    expect(superAdmin.findAll('[data-icon="i-heroicons-users"]')).toHaveLength(1)
  })
})
