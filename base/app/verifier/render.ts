import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import SpecRenderer from '../components/SpecRenderer.vue'
import type { RootSpec } from '../contracts/spec'
import type { DataAdapter } from '../data/adapters'
import type { VerifyError, VerifyResult } from './index'

/**
 * Level 2 (render) verifier: mount the spec headlessly and collect every Vue
 * warning / error. Test-only (needs @vue/test-utils + jsdom); the static
 * verifier is the one that runs on every LLM turn.
 */
export async function verifyRender(spec: RootSpec, options: {
  adapter?: DataAdapter
  /** Components to stub (e.g. anything that needs WebGL or a real map). */
  stubs?: Record<string, boolean | object>
} = {}): Promise<VerifyResult> {
  const errors: VerifyError[] = []
  const wrapper = mount(SpecRenderer, {
    props: { spec, adapter: options.adapter, navigate: () => {} },
    global: {
      stubs: options.stubs,
      config: {
        warnHandler: (msg: string) => errors.push({ path: '(render)', rule: 'render.warn', message: msg }),
        errorHandler: (err: unknown) => errors.push({ path: '(render)', rule: 'render.error', message: String(err) }),
      },
    },
  })
  await nextTick()
  await new Promise(resolve => setTimeout(resolve, 0))
  wrapper.unmount()
  return { pass: errors.length === 0, errors }
}
