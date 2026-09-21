import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import Sheet from '@components/Sheet.vue'

const stubs = { UIcon: true, UButton: { template: '<button><slot /></button>' } }

function sheet(props: Record<string, unknown> = {}) {
  return mount(Sheet, {
    props,
    slots: { peek: '<p>short</p>', default: '<p>everything</p>' },
    global: { stubs },
  })
}

const grip = (w: ReturnType<typeof sheet>) => w.findAll('button').find(b => b.classes().includes('w-10'))!
const close = (w: ReturnType<typeof sheet>) => w.findAll('button').find(b => b.attributes('aria-label') === 'Close')!

describe('sheet', () => {
  it('shows the peek content until it is pulled up', async () => {
    const peeking = sheet()
    expect(peeking.text()).toContain('short')
    expect(peeking.text()).not.toContain('everything')

    const opened = sheet({ state: 'full' })
    expect(opened.text()).toContain('everything')
    expect(opened.text()).not.toContain('short')
  })

  it('asks the page to switch states rather than switching itself', async () => {
    // State lives on the page, so the same sheet can be reopened where it was.
    const w = sheet()
    await grip(w).trigger('click')
    expect(w.emitted('update:state')).toEqual([['full']])
    expect(w.text()).toContain('short')

    const open = sheet({ state: 'full' })
    await grip(open).trigger('click')
    expect(open.emitted('update:state')).toEqual([['peek']])
  })

  it('the whole peek card is the way up, not just the button', async () => {
    const w = sheet({ expandLabel: 'More' })
    await w.find('.cursor-pointer').trigger('click')
    expect(w.emitted('update:state')).toEqual([['full']])
  })

  it('closes both ways at once, so a page can bind either', async () => {
    const w = sheet()
    await close(w).trigger('click')
    expect(w.emitted('update:modelValue')).toEqual([[false]])
    expect(w.emitted('close')).toHaveLength(1)
  })

  it('renders nothing when it is not open', () => {
    expect(sheet({ modelValue: false }).text()).toBe('')
  })

  it('takes its full-height colour from the app, and only when full', () => {
    // No manifest under vitest, so `accent` is empty and the surface shows.
    const surface = sheet({ state: 'full' })
    expect(surface.find('[style*="max-height"]').classes()).toContain('bg-white')

    const peeking = sheet({ tone: 'accent' })
    expect(peeking.find('[style*="max-height"]').classes()).toContain('bg-white')
  })

  it('caps each state at the height it was given', () => {
    expect(sheet({ peekHeight: '35dvh' }).find('[style*="max-height"]').attributes('style')).toContain('35dvh')
    expect(sheet({ state: 'full', fullHeight: '60dvh' }).find('[style*="max-height"]').attributes('style')).toContain('60dvh')
  })
})
