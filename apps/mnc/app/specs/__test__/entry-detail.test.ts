import { flushPromises, mount } from '@vue/test-utils'
import { beforeAll, describe, expect, it, vi } from 'vitest'
import SpecRenderer from '@base/components/SpecRenderer.vue'
import List from '@base/components/List.vue'
import Grid from '@base/components/Grid.vue'
import Stack from '@base/components/Stack.vue'
import Panel from '@base/components/Panel.vue'
import Text from '@base/components/Text.vue'
import SpecAudio from '@base/components/Audio.vue'
import SpecImage from '@base/components/Image.vue'
import SpecIcon from '@base/components/SpecIcon.vue'
import { registerComponent } from '@base/utils/registry'
import { registerHandler } from '@base/utils/handlers'
import { registerStyle } from '@base/utils/styles'
import '@base/contracts/components'
import manifest from '../../app.json'
import tagLabels from '../../../content/mncTags.i18n.json'
import spec from '../index.json'

/**
 * The desktop twin of the entry sheet: the same entry, the same data, more
 * room. It used to be a 266-line component.
 */
const Button = {
  props: ['label', 'icon', 'size', 'color', 'variant'],
  template: '<button :data-icon="icon">{{ label }}</button>',
}
const Carousel = {
  props: ['images', 'alt'],
  template: '<div class="carousel">{{ images.length }}</div>',
}

const calls: { name: string, payload: unknown }[] = []

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
  registerComponent('Grid', Grid)
  registerComponent('Stack', Stack)
  registerComponent('Panel', Panel)
  registerComponent('Text', Text)
  registerComponent('Audio', SpecAudio)
  registerComponent('Image', SpecImage)
  registerComponent('Icon', SpecIcon)
  registerComponent('Button', Button)
  registerComponent('Carousel', Carousel)
  for (const name of ['approveContribution', 'deleteContribution']) {
    registerHandler(name, (payload: unknown) => {
      calls.push({ name, payload })
    })
  }
})

const ENTRY = {
  comment: 'The Health Wagon',
  properties: {
    string_id: 'hw',
    primaryTag: 'Health & Crisis Response',
    secondaryTags: ['rural', 'mobile clinic'],
    date: '1980s',
    location: 'Southwestern Virginia',
    description: 'Free health services from a fleet of RVs.',
    mncConnection: 'A network of volunteers dispatches the vans.',
    photos: ['/a.webp'],
    audio: ['/note.webm'],
    linkList: [{ label: 'Health Wagon', url: 'https://www.thehealthwagon.org/about' }],
    i18n: { pt: { title: 'A Carroça da Saúde' } },
  },
}

function panel(state: Record<string, unknown> = {}, locale = 'en') {
  calls.length = 0
  const node = find(spec.children, n => n.style === 'detail-backdrop')
  return mount(SpecRenderer, {
    props: {
      navigate: () => {},
      query: {},
      translate: (key: string) => key,
      spec: {
        version: 1 as const,
        state: {
          detail: true,
          selected: ENTRY,
          contributions: [],
          contributionsLoading: false,
          auth: { isAdmin: false },
          uploadFor: null,
          visibleTags: [],
          listOpen: false,
          tagLabels,
          linkLabels: {},
          ...state,
        },
        children: [node],
      },
    },
    global: {
      stubs: { UIcon: true, UButton: { template: '<button />' } },
      config: { globalProperties: { $i18n: { locale } } },
    },
  })
}

function press(w: ReturnType<typeof panel>, label: string) {
  return w.findAll('button').find(b => b.text() === label)!.trigger('click')
}

describe('the desktop entry panel', () => {
  it('shows everything the entry carries', async () => {
    const w = panel()
    await flushPromises()
    const text = w.text()
    expect(text).toContain('The Health Wagon')
    expect(text).toContain('1980s')
    expect(text).toContain('Southwestern Virginia')
    expect(text).toContain('Free health services')
    expect(text).toContain('A network of volunteers')
    expect(w.find('.carousel').text()).toBe('1')
    expect(w.find('audio').attributes('src')).toBe('/note.webm')
  })

  it('is not there until a row is opened', async () => {
    expect(panel({ detail: false }).text()).toBe('')
    expect(panel({ selected: null }).text()).toBe('')
  })

  it('shows the theme and the free tags, and narrows to the theme when pressed', async () => {
    const w = panel()
    await flushPromises()
    expect(w.text()).toContain('Health & Crisis Response')
    expect(w.text()).toContain('rural')
    expect(w.text()).toContain('mobile clinic')

    await w.find('.cursor-pointer').trigger('click')
    expect(w.vm.state.visibleTags).toEqual(['Health & Crisis Response'])
    expect(w.vm.state.listOpen).toBe(true)
    // Narrowing closes the panel, or you would be reading it behind the list.
    expect(w.vm.state.detail).toBe(false)
    expect(w.vm.state.selected).toBe(null)
  })

  it('reads the entry in the reader language, and the theme with it', async () => {
    const w = panel({}, 'pt')
    await flushPromises()
    expect(w.text()).toContain('A Carroça da Saúde')
    expect(w.text()).toContain('Saúde e Resposta a Crises')
  })

  it('puts the domain under a link label', async () => {
    const w = panel()
    await flushPromises()
    const link = w.find('a')
    expect(link.attributes('href')).toBe('https://www.thehealthwagon.org/about')
    expect(link.text()).toContain('Health Wagon')
    expect(link.text()).toContain('thehealthwagon.org')
  })

  it('asks the page for the upload dialog', async () => {
    const w = panel()
    await flushPromises()
    await press(w, 'detail.addPhoto')
    expect(w.vm.state.uploadFor).toBe('hw')
  })

  it('says it is loading, then that there is nothing yet', async () => {
    expect(panel({ contributionsLoading: true }).text()).toContain('detail.loading')
    const w = panel()
    await flushPromises()
    expect(w.text()).toContain('detail.noContributions')
  })

  it('bylines a contribution by who and when', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-09-21T12:00:00Z'))
    const w = panel({
      contributions: [
        { id: 'c1', userId: 'anonymous', createdAt: '2026-09-18T12:00:00Z', comment: 'Saw it', approved: true, media: [] },
        { id: 'c2', userId: 'uid-9', createdAt: '2026-09-21T11:00:00Z', comment: 'Me too', approved: false, media: [] },
      ],
    })
    await flushPromises()
    expect(w.text()).toContain('detail.anonymous')
    expect(w.text()).toContain('3 days ago')
    expect(w.text()).toContain('detail.contributor')
    expect(w.text()).toContain('1 hour ago')
    // Only the unapproved one is marked.
    expect(w.text()).toContain('detail.pending')
    vi.useRealTimers()
  })

  it('moderates only for a moderator, and only what is pending', async () => {
    const visitor = panel({ contributions: [{ id: 'c1', approved: false, comment: 'x', media: [] }] })
    await flushPromises()
    expect(visitor.text()).not.toContain('detail.approve')

    const w = panel({
      auth: { isAdmin: true },
      contributions: [
        { id: 'c1', approved: false, comment: 'pending', media: [] },
        { id: 'c2', approved: true, comment: 'in', media: [] },
      ],
    })
    await flushPromises()
    expect(w.findAll('button').filter(b => b.text() === 'detail.approve')).toHaveLength(1)
    expect(w.findAll('button').filter(b => b.text() === 'detail.delete')).toHaveLength(2)
    await press(w, 'detail.approve')
    expect(calls).toEqual([{ name: 'approveContribution', payload: expect.objectContaining({ id: 'c1' }) }])
  })
})
