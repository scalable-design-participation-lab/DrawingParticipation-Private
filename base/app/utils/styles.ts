/**
 * Style presets: the only way a spec applies layout/visual classes in strict
 * mode. A preset is a name -> Tailwind classes pair registered by base or an
 * app, so the verifier can check the name and an LLM picks from a list instead
 * of inventing class strings.
 *
 * Keep this file under `utils/` so Tailwind scans the class strings.
 */
export interface StylePreset {
  name: string
  classes: string
  description: string
}

const presets = new Map<string, StylePreset>()

export function registerStyle(name: string, classes: string, description = '') {
  presets.set(name, { name, classes, description })
}

export function getStyle(name: string) {
  return presets.get(name)
}

export function listStyles() {
  return [...presets.values()]
}

/** Resolve one or more preset names to a class string (unknown names are skipped; the verifier reports them). */
export function styleClasses(style: string | string[] | undefined) {
  if (!style) {
    return ''
  }
  return (Array.isArray(style) ? style : [style]).map(name => getStyle(name)?.classes ?? '').filter(Boolean).join(' ')
}

// ---------------------------------------------------------------------------
// Base presets: positioning and page scaffolding every app needs.
// ---------------------------------------------------------------------------
registerStyle('page', 'min-h-screen bg-gray-50 dark:bg-gray-900', 'Full-height page background')
registerStyle('screen', 'relative h-screen w-full', 'Viewport-sized positioned container (maps)')
registerStyle('fill', 'absolute inset-0', 'Fill the nearest positioned parent')
registerStyle('overlay', 'absolute inset-0 z-40 bg-black bg-opacity-50', 'Dim everything behind a modal-like element')
registerStyle('content', 'relative px-6 pb-24 pt-24', 'Main content area under a floating header and above a floating footer')
registerStyle('floating-left', 'fixed left-6 top-1/2 z-30 -translate-y-1/2', 'Tool palette anchored to the left edge')
registerStyle('link', 'hover:underline', 'Inline text link')
registerStyle('logo', 'hover:scale-105 dark:invert', 'Partner / sponsor logo image')
