/**
 * Apply targeted fixes to a spec by verifier path ("children[0].props.zoom",
 * "state.dead"). Used by the generation loop from the second round on: the
 * model returns patches for the paths the verifier flagged instead of
 * rewriting the whole spec, so a fix cannot regress the rest of the page.
 */
export interface SpecPatch {
  /** Verifier-style path. "(root)" is not patchable. */
  path: string
  /** New value at the path (ignored when `remove` is true). */
  value?: unknown
  /** Delete the key / array element at the path. */
  remove?: boolean
}

export function parsePath(path: string): (string | number)[] {
  return path.split(/\.|\[(\d+)\]/).filter(s => s !== undefined && s !== '')
    .map(s => (/^\d+$/.test(s) ? Number(s) : s))
}

/** Returns a new spec; missing intermediate objects/arrays are created. */
export function applyPatches(spec: unknown, patches: SpecPatch[]): unknown {
  const root = structuredClone(spec)
  for (const patch of patches) {
    const segments = parsePath(patch.path)
    if (segments.length === 0) {
      continue
    }
    let cursor = root as Record<string | number, unknown>
    for (let i = 0; i < segments.length - 1; i++) {
      const key = segments[i]
      if (typeof cursor[key] !== 'object' || cursor[key] === null) {
        cursor[key] = typeof segments[i + 1] === 'number' ? [] : {}
      }
      cursor = cursor[key] as Record<string | number, unknown>
    }
    const last = segments[segments.length - 1]
    if (patch.remove) {
      if (Array.isArray(cursor) && typeof last === 'number') {
        cursor.splice(last, 1)
      }
      else {
        // A remove patch means the key is gone, not set to undefined.
        // Reflect rather than `delete`, which the lint rules forbid on a
        // computed key (and the two configs spell that rule differently).
        Reflect.deleteProperty(cursor, last)
      }
    }
    else {
      cursor[last] = patch.value
    }
  }
  return root
}
