import { describe, expect, it } from 'vitest'
import { dedupeFiles, fileKey } from '../../files'

/** Two `File` objects standing for the same picked file. */
function sameFileTwice(name: string, bytes: number): [File, File] {
  const a = new File([new Uint8Array(bytes)], name, { type: 'image/png' })
  const b = new File([new Uint8Array(bytes)], name, { type: 'image/png' })
  Object.defineProperty(b, 'lastModified', { value: a.lastModified })
  return [a, b]
}

describe('dedupeFiles', () => {
  it('keeps the first copy of a repeated file, in order', () => {
    // The wizard collects files across four steps, so the same photo can
    // legitimately arrive more than once.
    const [a, aAgain] = sameFileTwice('a.png', 4)
    const b = new File([new Uint8Array(8)], 'b.png', { type: 'image/png' })

    expect(fileKey(a)).toBe(fileKey(aAgain))
    expect(dedupeFiles([a, aAgain, b, a]).map(f => f.name)).toEqual(['a.png', 'b.png'])
  })

  it('keeps different files that merely share a name', () => {
    // A phone photo roll hands us "image.jpg" for every shot — those are
    // distinct pictures and must all be uploaded.
    const first = new File([new Uint8Array(4)], 'image.jpg', { type: 'image/jpeg' })
    const second = new File([new Uint8Array(99)], 'image.jpg', { type: 'image/jpeg' })

    expect(dedupeFiles([first, second])).toHaveLength(2)
  })

  it('returns an empty list unchanged', () => {
    expect(dedupeFiles([])).toEqual([])
  })
})
