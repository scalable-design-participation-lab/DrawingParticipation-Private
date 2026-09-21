import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import Text from '@components/Text.vue'

const render = (props: Record<string, unknown>) => mount(Text, { props }).text()

describe('text formats a value', () => {
  it('shows the domain of a link, without the www', () => {
    expect(render({ text: 'https://www.example.org/a/b?c=1', format: 'host' })).toBe('example.org')
    // Not a URL: show what was given rather than nothing.
    expect(render({ text: 'not a url', format: 'host' })).toBe('not a url')
  })

  it('says how long ago something was', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-09-21T12:00:00Z'))
    expect(render({ text: '2026-09-21T11:59:30Z', format: 'relative' })).toContain('30 seconds ago')
    expect(render({ text: '2026-09-21T09:00:00Z', format: 'relative' })).toContain('3 hours ago')
    expect(render({ text: '2026-09-18T12:00:00Z', format: 'relative' })).toContain('3 days ago')
    // `numeric: 'auto'` prefers "last year" to "1 year ago", which reads better.
    expect(render({ text: '2025-09-21T12:00:00Z', format: 'relative' })).toBe('last year')
    vi.useRealTimers()
  })
})

describe('text colours a stored code', () => {
  const colors = { health: '#F26D6D', art: '#EBC24A' }

  it('takes the colour of the value, like the icon beside it', () => {
    expect(mount(Text, { props: { text: 'health', colors } }).attributes('style')).toContain('rgb(242, 109, 109)')
    // A value with no colour of its own keeps the tone.
    expect(mount(Text, { props: { text: 'other', colors, tone: 'muted' } }).classes()).toContain('text-gray-500')
  })
})

describe('text folds a long passage', () => {
  it('clamps to the given number of lines', () => {
    const w = mount(Text, { props: { text: 'a long description', clamp: 6 } })
    expect(w.find('p').attributes('style')).toContain('-webkit-line-clamp: 6')
  })

  it('offers no link when nothing is hidden', () => {
    // jsdom reports no layout, so nothing ever overflows: the link stays away.
    const w = mount(Text, { props: { text: 'short', clamp: 6, moreLabel: 'More' } })
    expect(w.find('button').exists()).toBe(false)
  })

  it('unfolds when the link is pressed, and the clamp goes with it', async () => {
    const w = mount(Text, { props: { text: 'a long description', clamp: 6, moreLabel: 'More', lessLabel: 'Less' } })
    // Pretend the browser measured an overflow.
    w.vm.overflows = true
    await w.vm.$nextTick()
    await w.find('button').trigger('click')
    expect(w.find('button').text()).toBe('Less')
    expect(w.find('p').attributes('style') ?? '').not.toContain('line-clamp')
  })

  it('is a plain element when nothing is folded', () => {
    expect(mount(Text, { props: { text: 'x' } }).element.tagName).toBe('P')
  })
})
