// useTimeRange.ts
import { type Ref, ref } from 'vue'
import { isSameDay, sub } from 'date-fns'
import type { Duration } from 'date-fns'

export interface TimeRange {
  start: Date
  end: Date
}

/**
 * Composable for managing a time range.
 *
 * @param defaultDuration - The duration used to set the default time range (defaults to 14 days).
 * @returns An object containing the reactive time range, a function to check if a range is selected, and a function to select a range.
 */
export function useTimeRange(defaultDuration: Duration = { days: 14 }): {
  selected: Ref<TimeRange>
  isRangeSelected: (duration: Duration) => boolean
  selectRange: (duration: Duration) => void
} {
  // Initialize the selected time range using the default duration.
  const selected = ref<TimeRange>({ start: sub(new Date(), defaultDuration), end: new Date() })

  /**
   * Check if the currently selected time range matches the range defined by the given duration.
   *
   * @param duration - The duration to compare against.
   * @returns True if the selected range matches the range defined by the duration.
   */
  function isRangeSelected(duration: Duration): boolean {
    return (
      isSameDay(selected.value.start, sub(new Date(), duration))
      && isSameDay(selected.value.end, new Date())
    )
  }

  /**
   * Update the selected time range based on the provided duration.
   *
   * @param duration - The duration for the new time range.
   */
  function selectRange(duration: Duration): void {
    selected.value = { start: sub(new Date(), duration), end: new Date() }
  }

  return { selected, isRangeSelected, selectRange }
}
