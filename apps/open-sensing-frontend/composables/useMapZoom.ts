import { Ref } from 'vue'
import { View } from 'ol'
import * as turf from '@turf/turf'

export function useMapZoom(view: Ref<View | null>) {
  function computeMapBounds(coords: [number, number][]) {
    if (coords.length === 0) return null

    const features = coords.map((coord) => turf.point(coord))
    const collection = turf.featureCollection(features)

    const center = turf.centroid(collection).geometry.coordinates as [
      number,
      number
    ]
    const bbox = turf.bbox(collection) // [minX, minY, maxX, maxY]

    const latDiff = Math.abs(bbox[3] - bbox[1])
    const lonDiff = Math.abs(bbox[2] - bbox[0])
    const maxDiff = Math.max(latDiff, lonDiff)

    // Tighter zoom heuristic: higher zoom values for smaller spreads
    let zoom = 19
    if (maxDiff > 20) zoom = 4
    else if (maxDiff > 10) zoom = 6
    else if (maxDiff > 5) zoom = 8
    else if (maxDiff > 1) zoom = 12
    else if (maxDiff > 0.2) zoom = 15
    else if (maxDiff > 0.05) zoom = 17
    else zoom = 19 // Very close zoom

    return { center, zoom }
  }

  function zoomToCoords(coords: [number, number][], duration = 1000) {
    if (!view.value || coords.length === 0) return

    const bounds = computeMapBounds(coords)
    if (!bounds) return

    view.value.animate({
      center: bounds.center,
      zoom: bounds.zoom,
      duration,
    })
  }

  function zoomToCenter(center: [number, number], zoom = 15, duration = 1000) {
    if (!view.value) return

    view.value.animate({
      center,
      zoom,
      duration,
    })
  }

  return {
    computeMapBounds,
    zoomToCoords,
    zoomToCenter,
  }
}
