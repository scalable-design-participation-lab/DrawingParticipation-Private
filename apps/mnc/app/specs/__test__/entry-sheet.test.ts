import { flushPromises, mount } from '@vue/test-utils'
import { beforeAll, describe, expect, it } from 'vitest'
import SpecRenderer from '@base/components/SpecRenderer.vue'
import Sheet from '@base/components/Sheet.vue'
import List from '@base/components/List.vue'
import Stack from '@base/components/Stack.vue'
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
 * One entry on a phone. The sheet used to be a component; what it reads is
 * mnc's own data model, so this drives it with a real-shaped entry.
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

/** The sheet sits inside the mobile half of the page, so look for it. */
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
  registerComponent('Sheet', Sheet)
  registerComponent('List', List)
  registerComponent('Stack', Stack)
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
    date: '1980s',
    location: 'Southwestern Virginia',
    shortDesc: 'A clinic on wheels.',
    description: 'Free health services from a fleet of RVs.',
    photos: ['/a.webp', '/b.webp'],
    audio: ['/note.webm'],
    linkList: [{ label: 'Health Wagon', url: 'https://example.org' }, { label: 'No link here', url: '' }],
    i18n: { pt: { title: 'A Carroça da Saúde', location: 'Virgínia do Sudoeste' } },
  },
}

function sheet(state: Record<string, unknown> = {}, locale = 'en') {
  calls.length = 0
  const node = find(spec.children, n => n.type === 'Sheet')
  return mount(SpecRenderer, {
    props: {
      navigate: () => {},
      query: {},
      translate: (key: string) => key,
      spec: {
        version: 1 as const,
        state: {
          selected: ENTRY,
          cardState: 'peek',
          contributions: [],
          auth: { isAdmin: false },
          uploadFor: null,
          tagLabels,
          linkLabels: {},
          ...state,
        },
        children: [node],
      },
    },
    global: {
      stubs: { UIcon: true, UButton: { template: '<button />' } },
      // Where both `$locale` and a per-language `labels` table look for the
      // current language: the app's globals, not the instance proxy.
      config: { globalProperties: { $i18n: { locale } } },
    },
  })
}

describe('the entry sheet, peeking', () => {
  it('shows the title, the theme and the summary', async () => {
    const w = sheet()
    await flushPromises()
    expect(w.text()).toContain('The Health Wagon')
    expect(w.text()).toContain('Health & Crisis Response')
    expect(w.text()).toContain('A clinic on wheels.')
    // The rest waits until it is pulled up.
    expect(w.text()).not.toContain('Free health services')
  })
})

describe('the entry sheet, open', () => {
  const open = (state: Record<string, unknown> = {}, locale?: string) =>
    sheet({ cardState: 'full', ...state }, locale)

  it('shows everything the entry carries', async () => {
    const w = open()
    await flushPromises()
    expect(w.text()).toContain('The Health Wagon')
    expect(w.text()).toContain('1980s')
    expect(w.text()).toContain('Southwestern Virginia')
    expect(w.text()).toContain('Free health services')
    expect(w.find('.carousel').text()).toBe('2')
    expect(w.find('audio').attributes('src')).toBe('/note.webm')
  })

  it('reads the entry in the reader language, falling back to the original', async () => {
    const w = open({}, 'pt')
    await flushPromises()
    expect(w.text()).toContain('A Carroça da Saúde')
    expect(w.text()).toContain('Virgínia do Sudoeste')
    // No Portuguese description was written, so the original still shows.
    expect(w.text()).toContain('Free health services')
  })

  it('translates the theme, which is stored as its English key', async () => {
    // The theme only shows while peeking, which is where it always did.
    expect(sheet({}, 'pt').text()).toContain('Saúde e Resposta a Crises')
    expect(sheet({}, 'es').text()).toContain('Salud y gestión de crisis')
    // A language with no table of its own falls through to the key.
    expect(sheet({}, 'en').text()).toContain('Health & Crisis Response')
  })

  it('links out only where there is somewhere to go', async () => {
    const w = open()
    await flushPromises()
    const links = w.findAll('a')
    expect(links).toHaveLength(1)
    expect(links[0].attributes('href')).toBe('https://example.org')
    expect(w.text()).toContain('No link here')
  })

  it('invites the first contribution, and asks the page to open the dialog', async () => {
    const w = open()
    await flushPromises()
    expect(w.text()).toContain('mDetail.beFirst')
    await w.findAll('button').find(b => b.text() === 'detail.add')!.trigger('click')
    expect(w.vm.state.uploadFor).toBe('hw')
  })

  it('shows contributions, and their photos, with no moderation for a visitor', async () => {
    const w = open({
      contributions: [{ id: 'c1', comment: 'Saw it last week', approved: false, media: [{ kind: 'image', url: '/c.webp', name: 'c' }] }],
    })
    await flushPromises()
    expect(w.text()).toContain('Saw it last week')
    expect(w.find('img').attributes('src')).toBe('/c.webp')
    expect(w.text()).not.toContain('detail.approve')
  })

  it('offers approve and delete to a moderator, and approve only while it is pending', async () => {
    const w = open({
      auth: { isAdmin: true },
      contributions: [
        { id: 'c1', comment: 'pending one', approved: false, media: [] },
        { id: 'c2', comment: 'already in', approved: true, media: [] },
      ],
    })
    await flushPromises()
    expect(w.findAll('button').filter(b => b.text() === 'detail.approve')).toHaveLength(1)
    expect(w.findAll('button').filter(b => b.text() === 'detail.delete')).toHaveLength(2)

    await w.findAll('button').find(b => b.text() === 'detail.approve')!.trigger('click')
    expect(calls).toEqual([{ name: 'approveContribution', payload: expect.objectContaining({ id: 'c1' }) }])
  })
})
