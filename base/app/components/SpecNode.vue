<script lang="ts">
import type { PropType, VNodeChild } from 'vue'
import { defineComponent, h, inject } from 'vue'
import type { SpecNode as Node } from '../contracts/spec'
import { getComponent } from '../utils/registry'
import { SPEC_CONTEXT, materializeProps, resolveExpr, runAction } from '../utils/spec-context'
import type { SpecContext } from '../utils/spec-context'
import { styleClasses } from '../utils/styles'

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
  if (node.if !== undefined && !resolveExpr(node.if, ctx, item)) {
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
    attrs[prop] = resolveExpr(expr, ctx, item)
  }
  for (const [event, actions] of Object.entries(node.on ?? {})) {
    attrs[`on${event.charAt(0).toUpperCase()}${event.slice(1)}`] = (payload: unknown) => runAction(actions, payload, ctx, item)
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
  return h(component, attrs, slots)
}

export default SpecNode
</script>
