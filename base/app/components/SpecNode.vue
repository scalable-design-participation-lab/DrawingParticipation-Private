<script lang="ts">
import type { PropType, VNodeChild } from 'vue'
import { defineComponent, h, inject, withModifiers } from 'vue'
import type { SpecNode as Node } from '../contracts/spec'
import { getComponent } from '../utils/registry'
import { SPEC_CONTEXT, evaluate, materializeProps, resolveExpr, runAction } from '../utils/spec-context'
import type { SpecContext } from '../utils/spec-context'
import { styleClasses } from '../utils/styles'
import SpecErrorBoundary from './SpecErrorBoundary.vue'

/**
 * Renders one spec node (and, recursively, its children). Used by SpecRenderer;
 * not meant to be placed in templates directly.
 */
const SpecNode = defineComponent({
  name: 'SpecNode',
  props: {
    node: { type: Object as PropType<Node>, required: true },
    // Current list item when rendering inside an `item` template.
    item: { type: null as unknown as PropType<unknown>, default: undefined },
  },
  setup(props) {
    const ctx = inject(SPEC_CONTEXT)
    if (!ctx) {
      throw new Error('SpecNode must be rendered inside SpecRenderer')
    }
    return () => renderNode(props.node, props.item, ctx)
  },
})

function renderNode(node: Node, item: unknown, ctx: SpecContext): VNodeChild {
  // "!$state.x" and "$state.view == 'list'" are conditions; anything else is truthiness.
  if (node.if !== undefined && !evaluate(node.if, ctx, item)) {
    return null
  }

  const component = getComponent(node.type)
  const isNative = !component
  if (isNative && !/^[a-z][a-z0-9-]*$/.test(node.type)) {
    // The verifier rejects this before it ships; at runtime just make it visible.
    return h('div', { class: 'text-red-600' }, `Unknown component "${node.type}"`)
  }

  const attrs = materializeProps(node.props ?? {}, ctx, item) as Record<string, unknown>
  if (node.style) {
    attrs.class = [styleClasses(node.style), attrs.class].filter(Boolean).join(' ')
  }
  for (const [prop, expr] of Object.entries(node.bind ?? {})) {
    // `evaluate` handles a plain path exactly like `resolveExpr` and also the
    // condition forms, so `disabled` can say what `if` says.
    attrs[prop] = evaluate(expr, ctx, item)
  }
  for (const [event, actions] of Object.entries(node.on ?? {})) {
    // "click.stop": a row that is itself clickable needs its buttons to stop
    // the click reaching it, which is a DOM concern with no other expression.
    const [name, ...modifiers] = event.split('.')
    const run = (payload: unknown) => runAction(actions, payload, ctx, item)
    attrs[`on${name.charAt(0).toUpperCase()}${name.slice(1)}`] = modifiers.length ? withModifiers(run, modifiers) : run
  }

  const slots: Record<string, (scope?: Record<string, unknown>) => VNodeChild[]> = {}
  for (const child of node.children ?? []) {
    const name = child.slot ?? 'default'
    const existing = slots[name]
    slots[name] = scope => [...(existing?.(scope) ?? []), h(SpecNode, { node: child, item })]
  }
  if (node.item) {
    const template = node.item
    slots.item = scope => [h(SpecNode, { node: template, item: scope?.item })]
  }
  if (node.text !== undefined) {
    const text = String(resolveExpr(node.text, ctx, item) ?? '')
    const existing = slots.default
    slots.default = scope => [text, ...(existing?.(scope) ?? [])]
  }

  if (isNative) {
    return h(node.type, attrs, slots.default?.())
  }
  // Every component node is isolated: if it throws, only it shows an error.
  return h(SpecErrorBoundary, { label: node.type }, { default: () => h(component, attrs, slots) })
}

export default SpecNode
</script>
