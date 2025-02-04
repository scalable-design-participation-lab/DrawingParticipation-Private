// useFilters.ts
import { reactive, toRefs } from 'vue'

export function useFilters(initialFilters: Record<string, boolean>) {
  // Create a reactive copy of the initial filters.
  // This ensures that the object is reactive and can be updated.
  const state = reactive({
    filters: { ...initialFilters },
  })

  /**
   * Toggle a given filter key.
   *
   * @param key - The filter key to toggle.
   */
  function toggleFilter(key: string): void {
    if (key in state.filters) {
      state.filters[key] = !state.filters[key]
    }
    else {
      console.warn(`Filter key '${key}' does not exist in the filters object.`)
    }
  }

  /**
   * Optionally, you can add more helper functions, for example,
   * to set a filter explicitly or reset all filters.
   */
  function setFilter(key: string, value: boolean): void {
    if (key in state.filters) {
      state.filters[key] = value
    }
  }

  function resetFilters(newFilters: Record<string, boolean>) {
    // Replace all existing filters with the new ones
    state.filters = { ...newFilters }
  }
  // Return state properties and helper functions.
  // Using toRefs() ensures that individual properties remain reactive.
  return {
    ...toRefs(state),
    toggleFilter,
    setFilter,
    resetFilters,
  }
}
