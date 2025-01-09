import { defineStore } from 'pinia';
import { ref } from 'vue';

// Store for managing the UI state of the actions, eg. subwindows, modals, ect
export const useSideBarStore = defineStore("sidebar", () => {
    const spaceSubwindow = ref(1);
    const belongingSubwindow = ref(1);
    const safetySubwindow = ref(1);
    const environmentSubwindow = ref(1);
    const isCommentModalOpen = ref(false)
    const currentBelongingIcon = ref(null)
    const currentSafetyIcon = ref(null)
    const currentEnvironmentIcon = ref(null)

    // Sidebar options 
    const currentFrequency = ref('every day');
    const colors = {
        'every day': '#0000FF',
        'every week': '#00FF00',
        'sometimes': '#800080',
        'only once': '#B2FB4C',
        'never': '#FF0000',
    };

    function resetOtherSubwindows(currentTheme) {
        if (currentTheme !== 'space') spaceSubwindow.value = 1;
        if (currentTheme !== 'belonging') belongingSubwindow.value = 1;
        if (currentTheme !== 'safety') safetySubwindow.value = 1;
        if (currentTheme !== 'environment') environmentSubwindow.value = 1;
    }
    function nextSpaceSubwindow() {
        if (spaceSubwindow.value < 4) {
            spaceSubwindow.value++
            resetOtherSubwindows('space')
            console.log('Current space subwindow:', spaceSubwindow.value)
        }
    }

    function prevSpaceSubwindow() {
        if (spaceSubwindow.value > 1) {
            spaceSubwindow.value--
            resetOtherSubwindows('space')
        }
    }

    function nextBelongingSubwindow() {
        if (belongingSubwindow.value < 1) {
            belongingSubwindow.value++
            resetOtherSubwindows('belonging')
        }
    }

    function prevBelongingSubwindow() {
        if (belongingSubwindow.value > 1) {
            belongingSubwindow.value--
            resetOtherSubwindows('belonging')
        }
    }

    function nextSafetySubwindow() {
        if (safetySubwindow.value < 1) {
            safetySubwindow.value++
            resetOtherSubwindows('safety')
        }
    }

    function prevSafetySubwindow() {
        if (safetySubwindow.value > 1) {
            safetySubwindow.value--
            resetOtherSubwindows('safety')
        }
    }

    function nextEnvironmentSubwindow() {
        if (environmentSubwindow.value < 2) {
            environmentSubwindow.value++
            resetOtherSubwindows('environment')
        }
    }

    function prevEnvironmentSubwindow() {
        if (environmentSubwindow.value > 1) {
            environmentSubwindow.value--
            resetOtherSubwindows('environment')
        }
    }

    const currentColor = computed(() => {
        return colors[currentFrequency.value] || '#000000';
    });

    function setFrequency(frequency) {
        currentFrequency.value = frequency;
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
        resetOtherSubwindows,
        prevBelongingSubwindow,
        nextBelongingSubwindow,
        prevEnvironmentSubwindow,
        nextEnvironmentSubwindow,
        prevSafetySubwindow,
        nextSafetySubwindow,
        prevSpaceSubwindow,
        nextSpaceSubwindow

    };
});