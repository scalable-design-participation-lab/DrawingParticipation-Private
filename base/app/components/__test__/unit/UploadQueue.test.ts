import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it } from 'vitest'
import UploadQueue from '@components/UploadQueue.vue'
import FileDropZone from '@components/FileDropZone.vue'
import { registerHandler } from '../../../utils/handlers'
import { SPEC_CONTEXT } from '../../../utils/spec-context'
import type { SpecContext } from '../../../utils/spec-context'

/**
 * The queue owes a page three things: every file reaches the app's own
 * uploader, what it hands back is what the page gets, and nothing is reported
 * as ready until it actually is.
 */
// jsdom has no object URLs; the queue makes one per row for the thumbnail.
URL.createObjectURL = () => 'blob:preview'
URL.revokeObjectURL = () => {}

type Progress = (percent: number) => void
const started: { name: string, args: unknown, onProgress: Progress }[] = []
let settle: ((value: unknown) => void)[] = []

registerHandler('testUpload', (payload, _ctx, args) => {
  const { file, onProgress } = payload as { file: File, onProgress: Progress }
  started.push({ name: file.name, args, onProgress })
  return new Promise(resolve => settle.push(resolve))
})

registerHandler('failingUpload', () => Promise.reject(new Error('bucket is on fire')))

const ctx = { state: {}, errors: {} } as unknown as SpecContext

function queue(props: Record<string, unknown> = {}) {
  return mount(UploadQueue, {
    props: { uploader: 'testUpload', ...props },
    global: {
      provide: { [SPEC_CONTEXT as symbol]: ctx },
      // No `@click="$emit('click')"` on the button stub: the native click
      // already falls through, and re-emitting removes two rows per press.
      stubs: { UIcon: true, UButton: { template: '<button />' }, VoiceRecorder: true },
    },
  })
}

function file(name: string, type = 'image/png', lastModified = 1) {
  return new File(['x'], name, { type, lastModified })
}

/** The picker is headless, so hand the files straight to it. */
function pick(w: ReturnType<typeof queue>, ...files: File[]) {
  return w.findComponent(FileDropZone).vm.$emit('files', files)
}

describe('uploadQueue', () => {
  beforeEach(() => {
    started.length = 0
    settle = []
  })

  it('sends every picked file to the named handler with the args it was given', async () => {
    const w = queue({ args: { entry: 'abc' } })
    await pick(w, file('one.png'), file('two.png', 'image/png', 2))
    await flushPromises()
    expect(started.map(s => s.name)).toEqual(['one.png', 'two.png'])
    expect(started[0].args).toEqual({ entry: 'abc' })
  })

  it('reports nothing until an upload actually finishes', async () => {
    const w = queue()
    await pick(w, file('one.png'))
    await flushPromises()
    expect(w.emitted('update:modelValue')).toBeUndefined()
    expect(w.emitted('busy')?.at(-1)).toEqual([true])

    settle[0]({ url: '/uploads/one.png' })
    await flushPromises()
    expect(w.emitted('update:modelValue')?.at(-1)).toEqual([[{ url: '/uploads/one.png' }]])
    expect(w.emitted('busy')?.at(-1)).toEqual([false])
  })

  it('shows how far along each one is', async () => {
    const w = queue()
    await pick(w, file('one.png'))
    await flushPromises()
    expect(w.find('[style*="width: 0%"]').exists()).toBe(true)

    started[0].onProgress(42)
    await flushPromises()
    expect(w.find('[style*="width: 42%"]').exists()).toBe(true)
  })

  it('uploads the same file once, however many times it is picked', async () => {
    const w = queue()
    await pick(w, file('one.png'))
    await pick(w, file('one.png'))
    await flushPromises()
    expect(started).toHaveLength(1)
    expect(w.findAll('li')).toHaveLength(1)
  })

  it('keeps a failure out of the results and says so', async () => {
    const w = queue({ uploader: 'failingUpload', failedLabel: 'Could not upload' })
    await pick(w, file('one.png'))
    await flushPromises()
    expect(w.text()).toContain('Could not upload')
    expect(w.emitted('update:modelValue')).toBeUndefined()
  })

  it('says so rather than hanging when the handler does not exist', async () => {
    const w = queue({ uploader: 'nobodyRegisteredThis', failedLabel: 'Could not upload' })
    await pick(w, file('one.png'))
    await flushPromises()
    expect(w.text()).toContain('Could not upload')
    expect(w.emitted('busy')?.at(-1)).not.toEqual([true])
  })

  it('drops a removed row from the results', async () => {
    const w = queue()
    await pick(w, file('one.png'), file('two.png', 'image/png', 2))
    await flushPromises()
    settle[0]({ url: '/one' })
    settle[1]({ url: '/two' })
    await flushPromises()
    expect(w.emitted('update:modelValue')?.at(-1)).toEqual([[{ url: '/one' }, { url: '/two' }]])

    await w.findAll('li')[0].find('button').trigger('click')
    expect(w.emitted('update:modelValue')?.at(-1)).toEqual([[{ url: '/two' }]])
  })
})
