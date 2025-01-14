import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { FrequencyType, IconType } from './types/store'

/**
 * Sidebar state store for managing UI elements such as subwindows, modals, and icons.
 */
export const useSideBarStore = defineStore('sidebar', () => {
  /**
   * The current state of the subwindows.
   */
  const spaceSubwindow = ref<number>(1)
  const belongingSubwindow = ref<number>(1)
  const safetySubwindow = ref<number>(1)
  const environmentSubwindow = ref<number>(1)

  /**
   * Tracks whether the comment modal is open.
   */
  const isCommentModalOpen = ref<boolean>(false)

  /**
   * The currently selected icons for belonging, safety, and environment.
   */
  const currentBelongingIcon = ref<IconType>(null)
  const currentSafetyIcon = ref<IconType>(null)
  const currentEnvironmentIcon = ref<IconType>(null)

  /**
   * The current frequency setting.
   */
  const currentFrequency = ref<FrequencyType>('every day')

  /**
   * Map of colors associated with each frequency.
   */
  const colors: Record<string, string> = {
    'every day': '#0000FF',
    'every week': '#00FF00',
    'sometimes': '#800080',
    'only once': '#B2FB4C',
    'never': '#FF0000',
  }

  /**
   * Resets all subwindows except the one specified.
   *
   * @param currentTheme - The theme of the current subwindow to exclude from reset.
   */
  function resetOtherSubwindows(currentTheme: 'space' | 'belonging' | 'safety' | 'environment'): void {
    if (currentTheme !== 'space')
      spaceSubwindow.value = 1
    if (currentTheme !== 'belonging')
      belongingSubwindow.value = 1
    if (currentTheme !== 'safety')
      safetySubwindow.value = 1
    if (currentTheme !== 'environment')
      environmentSubwindow.value = 1
  }

  /**
   * Advances the space subwindow to the next one, if possible.
   */
  function nextSpaceSubwindow(): void {
    if (spaceSubwindow.value < 4) {
      spaceSubwindow.value++
      resetOtherSubwindows('space')
      console.log('Current space subwindow:', spaceSubwindow.value)
    }
  }

  /**
   * Moves the space subwindow to the previous one, if possible.
   */
  function prevSpaceSubwindow(): void {
    if (spaceSubwindow.value > 1) {
      spaceSubwindow.value--
      resetOtherSubwindows('space')
    }
  }

  /**
   * Advances the belonging subwindow to the next one, if possible.
   */
  function nextBelongingSubwindow(): void {
    if (belongingSubwindow.value < 1) {
      belongingSubwindow.value++
      resetOtherSubwindows('belonging')
    }
  }

  /**
   * Moves the belonging subwindow to the previous one, if possible.
   */
  function prevBelongingSubwindow(): void {
    if (belongingSubwindow.value > 1) {
      belongingSubwindow.value--
      resetOtherSubwindows('belonging')
    }
  }

  /**
   * Advances the safety subwindow to the next one, if possible.
   */
  function nextSafetySubwindow(): void {
    if (safetySubwindow.value < 1) {
      safetySubwindow.value++
      resetOtherSubwindows('safety')
    }
  }

  /**
   * Moves the safety subwindow to the previous one, if possible.
   */
  function prevSafetySubwindow(): void {
    if (safetySubwindow.value > 1) {
      safetySubwindow.value--
      resetOtherSubwindows('safety')
    }
  }

  /**
   * Advances the environment subwindow to the next one, if possible.
   */
  function nextEnvironmentSubwindow(): void {
    if (environmentSubwindow.value < 2) {
      environmentSubwindow.value++
      resetOtherSubwindows('environment')
    }
  }

  /**
   * Moves the environment subwindow to the previous one, if possible.
   */
  function prevEnvironmentSubwindow(): void {
    if (environmentSubwindow.value > 1) {
      environmentSubwindow.value--
      resetOtherSubwindows('environment')
    }
  }

  /**
   * Computes the current color based on the selected frequency.
   */
  const currentColor = computed<string>(() => {
    return colors[currentFrequency.value] || '#000000'
  })

  /**
   * Sets the frequency to the specified value.
   *
   * @param frequency - The new frequency value.
   */
  function setFrequency(frequency: 'every day' | 'every week' | 'sometimes' | 'only once' | 'never'): void {
    currentFrequency.value = frequency
  }

  /**
   * Sets the icon for the belonging icon.
   *
   * @param icon - The icon name to set the icon for.
   */
  function setBelongingIcon(icon: IconType): void {
    currentBelongingIcon.value = icon
  }

  /**
   * Sets the icon for the safety Icon icon.
   *
   * @param icon - The icon name to set the icon for.
   */
  function setSafetyIcon(icon: IconType): void {
    currentSafetyIcon.value = icon
  }

  /**
   * Sets the icon for the environment Icon icon.
   *
   * @param icon - The icon name to set the icon for.
   */
  function setEnvironmentIcon(icon: IconType): void {
    currentEnvironmentIcon.value = icon
  }

  return {
    spaceSubwindow,
    belongingSubwindow,
    safetySubwindow,
    environmentSubwindow,
    isCommentModalOpen,
    currentFrequency,
    currentColor,
    currentBelongingIcon,
    currentSafetyIcon,
    currentEnvironmentIcon,
    setFrequency,
    setBelongingIcon,
    setSafetyIcon,
    setEnvironmentIcon,
    resetOtherSubwindows,
    prevBelongingSubwindow,
    nextBelongingSubwindow,
    prevEnvironmentSubwindow,
    nextEnvironmentSubwindow,
    prevSafetySubwindow,
    nextSafetySubwindow,
    prevSpaceSubwindow,
    nextSpaceSubwindow,
  }
})
