// useFilters.ts

export function useFilters(state: Ref<Record<string, boolean>>) {
  /**
   * Toggle a given filter key.
   *
   * @param key - The filter key to toggle.
   */
  function toggleFilter(key: string): void {
    if (key in state.value) {
      state.value[key] = !state.value[key]
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
    if (key in state.value) {
      state.value[key] = value
    }
  }

  function resetFilters(newFilters: Record<string, boolean>) {
    // Replace all existing filters with the new ones
    state.value = { ...newFilters }
  }
  // Return state properties and helper functions.
  // Using toRefs() ensures that individual properties remain reactive.
  return {
    toggleFilter,
    setFilter,
    resetFilters,
  }
}
