<script lang="ts">
import { defineComponent, h, onErrorCaptured, ref } from 'vue'

/**
 * Wraps one spec node. If the component under it throws (render, setup,
 * event handler), only this node shows an error box; the rest of the page
 * keeps working. Non-programmers get a visible, local failure instead of a
 * blank screen.
 */
export default defineComponent({
  name: 'SpecErrorBoundary',
  props: { label: { type: String, required: true } },
  setup(props, { slots }) {
    const error = ref<string | null>(null)
    onErrorCaptured((err) => {
      error.value = err instanceof Error ? err.message : String(err)
      console.error(`[spec] "${props.label}" failed:`, err)
      return false
    })
    return () => (error.value
      ? h('div', { class: 'rounded border border-red-300 bg-red-50 p-2 text-xs text-red-700', role: 'alert' }, `${props.label}: ${error.value}`)
      : slots.default?.())
  },
})
</script>
