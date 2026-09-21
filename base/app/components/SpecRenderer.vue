<script setup lang="ts">
import { computed, getCurrentInstance, inject, onMounted, provide, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { RootSpec } from '../contracts/spec'
import { DATA_ADAPTER, defaultAdapter } from '../data/adapters'
import { SPEC_I18N } from '../utils/i18n'
import type { DataAdapter } from '../data/adapters'
import { useDataSources } from '../data/useDataSources'
import { SPEC_CONTEXT, resolveExpr, runAction } from '../utils/spec-context'
import type { SpecContext } from '../utils/spec-context'
import SpecNode from './SpecNode.vue'

/**
 * Turns a page spec (see contracts/spec.ts) into a component tree.
 *
 * - `spec.state` becomes reactive page state that `$state.*` binds read and
 *   `set` actions write. A string value like "$query.showIntro" is read from
 *   the route query once, on load.
 * - `spec.dataSources` are loaded through the injected DataAdapter and exposed
 *   as `$data.<name>` (rows only; loading/error live in `$sources.<name>`).
 * - `$errors.<handler>` is the last error a handler threw.
 * - `data` lets the host page pass extra rows without a data source.
 */
const props = defineProps<{
  spec: RootSpec
  data?: Record<string, unknown>
  adapter?: DataAdapter
  navigate?: (to: string) => void
  query?: Record<string, unknown>
  translate?: (key: string) => string
}>()

// Outside a router (tests) callers pass `navigate` + `query` explicitly.
const router = props.navigate ? null : useRouter()
const navigate = props.navigate ?? ((to: string) => {
  router?.push(to)
})
const query: Record<string, unknown> = props.query ?? (props.navigate ? {} : { ...useRoute().query })

// "$t.key": vue-i18n's global $t when the app installed it (mnc), else base's
// app/i18n/*.json translator, else the key shows.
const globals = getCurrentInstance()?.appContext.config.globalProperties as { $t?: (key: string) => string } | undefined
const i18n = inject(SPEC_I18N, null)
const translate = props.translate ?? (globals?.$t ? (key: string) => globals.$t!(key) : i18n?.translate)

const adapter = props.adapter ?? inject(DATA_ADAPTER, defaultAdapter)
// A `where` may name page state, which is built below, so the sources resolve
// through a context that is filled in before `start()` reads anything.
let context: SpecContext | null = null
const { sources, reload, start } = useDataSources(
  props.spec.dataSources ?? {},
  adapter,
  value => (context ? resolveExpr(value, context) : value),
)
const errors = reactive<Record<string, string | undefined>>({})

const seed = { state: {}, data: {}, sources, errors, query, navigate, reload, translate }
// Query params are strings; "true"/"false" almost always mean a boolean flag.
const coerce = (v: unknown) => (v === 'true' ? true : v === 'false' ? false : v)
const state = reactive<Record<string, unknown>>(
  Object.fromEntries(Object.entries(props.spec.state ?? {}).map(([k, v]) => [k, coerce(resolveExpr(v, seed))])),
)

const data = computed<Record<string, unknown>>(() => {
  const out: Record<string, unknown> = { ...(props.data ?? {}) }
  for (const [name, source] of Object.entries(sources)) {
    out[name] = source.items
  }
  return out
})

const ctx = {
  state,
  get data() {
    return data.value
  },
  sources,
  errors,
  query,
  navigate,
  reload,
  translate,
  get locale() {
    return i18n?.locale.value ?? (globals as { $i18n?: { locale?: { value?: string } | string } } | undefined)?.$i18n?.locale as string | undefined
  },
}
context = ctx
provide(SPEC_CONTEXT, ctx)
start()

onMounted(() => {
  if (props.spec.init) {
    runAction(props.spec.init, undefined, ctx)
  }
})

defineExpose({ state, sources, errors })
</script>

<template>
  <SpecNode v-for="(child, i) in spec.children" :key="i" :node="child" />
</template>
