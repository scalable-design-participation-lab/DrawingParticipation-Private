/**
 * Small preview of a catalog photo, for anywhere the image is rendered at card
 * size (list covers, map quick look) rather than full width.
 *
 * scripts/optimize-photos.mjs writes a `-thumb` variant next to every catalog
 * photo: ~24 KB against ~134 KB for the full-size WebP, and against ~2.6 MB for
 * the original PNG. User-uploaded photos live in Firebase Storage and have no
 * derivative, so they are returned untouched (issue #47).
 */
export function photoThumb(url: string | undefined | null): string {
  if (!url)
    return ''
  return url.startsWith('/Solution_Photos/') && url.endsWith('.webp')
    ? url.replace(/\.webp$/, '-thumb.webp')
    : url
}
