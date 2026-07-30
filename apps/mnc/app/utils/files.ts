/**
 * Helpers for the batch file pickers (the contribute wizard's dropzones and the
 * project photo/audio uploader).
 */

/**
 * Fingerprint identifying "the same file picked twice". Two `File` objects for
 * the same photo are different JS objects, so identity comparison misses them;
 * name + size + mtime is what the browser can tell us about the source file.
 */
export function fileKey(file: File): string {
  return `${file.name}|${file.size}|${file.lastModified}`
}

/**
 * Drops repeats from a batch of picked files, preserving the original order.
 *
 * The contribute wizard collects files across four separate steps and every
 * picker allows re-selecting, so the same photo can legitimately reach us more
 * than once. Uploading it twice would show it twice in the entry's gallery.
 */
export function dedupeFiles(files: File[]): File[] {
  const seen = new Set<string>()
  return files.filter((file) => {
    const key = fileKey(file)
    if (seen.has(key))
      return false
    seen.add(key)
    return true
  })
}
