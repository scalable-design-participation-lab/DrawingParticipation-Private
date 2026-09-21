import { flushPromises, mount } from '@vue/test-utils'
import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import SpecRenderer from '@base/components/SpecRenderer.vue'
import UploadQueue from '@base/components/UploadQueue.vue'
import FileDropZone from '@base/components/FileDropZone.vue'
import Stack from '@base/components/Stack.vue'
import Text from '@base/components/Text.vue'
import { registerComponent } from '@base/utils/registry'
import { registerHandler } from '@base/utils/handlers'
import { registerStyle } from '@base/utils/styles'
import '@base/contracts/components'
import manifest from '../../app.json'
import spec from '../index.json'

/**
 * Adding a photo or a voice note to an entry: the dialog is a node of the
 * page now, and both detail views only ask for it. Firebase is the handler
 * underneath, so this drives everything above it.
 */
URL.createObjectURL = () => 'blob:preview'
URL.revokeObjectURL = () => {}

const Button = {
  props: ['label', 'icon', 'size', 'color', 'variant', 'loading', 'disabled'],
  template: '<button :data-loading="loading">{{ label }}</button>',
}
const Modal = {
  props: ['modelValue', 'title'],
  template: '<div v-if="modelValue" class="modal"><slot /></div>',
}
const FormFields = {
  props: ['fields', 'modelValue'],
  template: '<form />',
}

const uploads: { name: string, args: unknown }[] = []
const saved: unknown[] = []
let settle: ((value: unknown) => void)[] = []

beforeAll(() => {
  for (const [name, classes] of Object.entries(manifest.styles)) {
    registerStyle(name, classes)
  }
  registerComponent('UploadQueue', UploadQueue)
  registerComponent('Stack', Stack)
  registerComponent('Text', Text)
  registerComponent('Button', Button)
  registerComponent('Modal', Modal)
  registerComponent('FormFields', FormFields)
  registerHandler('uploadMedia', (payload, _ctx, args) => {
    const { file } = payload as { file: File }
    uploads.push({ name: file.name, args })
    return new Promise(resolve => settle.push(resolve))
  })
  registerHandler('addContribution', (payload) => {
    saved.push(payload)
  })
})

/** The dialog as it sits in index.json, opened for one entry. */
function dialog(state: Record<string, unknown> = {}) {
  const node = spec.children[1].children.find(
    n => n.type === 'Modal' && n.props?.title === '$t.detail.addPhoto',
  )
  return mount(SpecRenderer, {
    props: {
      navigate: () => {},
      query: {},
      translate: (key: string) => key,
      spec: {
        version: 1 as const,
        state: {
          uploadFor: 'user_a',
          uploadMedia: [],
          uploadDraft: { comment: '' },
          uploadBusy: false,
          ...state,
        },
        children: [node],
      },
    },
    global: { stubs: { UIcon: true, UButton: { template: '<button />' }, VoiceRecorder: true } },
  })
}

function pick(w: ReturnType<typeof dialog>, name: string) {
  return w.findComponent(FileDropZone).vm.$emit('files', [new File(['x'], name, { type: 'image/png' })])
}

function press(w: ReturnType<typeof dialog>, label: string) {
  return w.findAll('button').find(b => b.text() === label)!.trigger('click')
}

describe('the add-media dialog', () => {
  beforeEach(() => {
    uploads.length = 0
    saved.length = 0
    settle = []
  })

  it('is closed until an entry asks for it', async () => {
    const w = dialog({ uploadFor: null })
    await flushPromises()
    expect(w.find('.modal').exists()).toBe(false)
  })

  it('uploads through the app handler, for the entry it was opened for', async () => {
    const w = dialog()
    await flushPromises()
    await pick(w, 'photo.png')
    await flushPromises()
    expect(uploads).toEqual([{ name: 'photo.png', args: 'user_a' }])
  })

  it('holds the save button while anything is still going up', async () => {
    const w = dialog()
    await flushPromises()
    await pick(w, 'photo.png')
    await flushPromises()
    expect(w.vm.state.uploadBusy).toBe(true)

    settle[0]({ url: '/uploads/photo.png', kind: 'image' })
    await flushPromises()
    expect(w.vm.state.uploadBusy).toBe(false)
    expect(w.vm.state.uploadMedia).toEqual([{ url: '/uploads/photo.png', kind: 'image' }])
  })

  it('saves the comment with whatever finished uploading, then forgets it all', async () => {
    const w = dialog({ uploadDraft: { comment: 'Taken on Saturday' } })
    await flushPromises()
    await pick(w, 'photo.png')
    await flushPromises()
    settle[0]({ url: '/uploads/photo.png', kind: 'image' })
    await flushPromises()

    await press(w, 'detail.add')
    await flushPromises()
    expect(saved).toEqual([{
      projectId: 'user_a',
      comment: 'Taken on Saturday',
      media: [{ url: '/uploads/photo.png', kind: 'image' }],
    }])
    // Nothing is carried into the next entry someone opens.
    expect(w.vm.state).toMatchObject({ uploadFor: null, uploadMedia: [], uploadDraft: { comment: '' } })
  })

  it('closing saves nothing and leaves nothing behind', async () => {
    const w = dialog({ uploadDraft: { comment: 'never mind' } })
    await flushPromises()
    await press(w, 'upload.close')
    expect(saved).toEqual([])
    expect(w.vm.state).toMatchObject({ uploadFor: null, uploadDraft: { comment: '' } })
  })
})
