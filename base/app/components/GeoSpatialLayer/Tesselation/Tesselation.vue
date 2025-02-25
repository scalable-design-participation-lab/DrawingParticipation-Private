<script setup lang="ts">
import * as turf from '@turf/turf'
import GeoJSON from 'ol/format/GeoJSON'
import { Fill, Stroke, Style } from 'ol/style'
import { computed } from 'vue'
import type { Feature } from 'ol'
import * as d3 from 'd3'

export type TesselationType = 'voronoi' | 'tin'

export interface TesselationProps {
  coordinates?: [number, number][]
  bbox?: number[]
  visible?: boolean
  zIndex?: number
  type?: TesselationType
  width?: number
  clusterCount?: number
  primaryColor?: string
  secondaryColor?: string
}

const props = withDefaults(defineProps<TesselationProps>(), {
  coordinates: () => [],
  bbox: () => [28.462271, 49.215576, 28.570271, 49.265576],
  visible: false,
  zIndex: 0,
  type: 'voronoi',
  width: 1,
  clusterCount: 2, // Number of clusters to find
  primaryColor: 'red',
  secondaryColor: 'purple',
})

const geoJson = new GeoJSON()

const features = computed(() => {
  if (!props.coordinates.length) {
    console.warn('No coordinates provided for Tesselation computation.')
    return []
  }
  // Filter points within the bbox
  const [minX, minY, maxX, maxY] = props.bbox
  const filteredCoordinates = props.coordinates.filter(([x, y]) =>
    x >= minX && x <= maxX && y >= minY && y <= maxY,
  )

  if (!filteredCoordinates.length) {
    console.warn('No valid coordinates inside the bounding box for Tesselation.')
    return []
  }

  const pointFeatures = filteredCoordinates.map(coord => turf.point(coord))

  // const pointFeatures = turf.randomPoint(1000, { bbox: props.bbox })

  const clusterCollection = turf.featureCollection(pointFeatures)

  //  Cluster the points using K-means (turf.clustersKmeans)
  //  This adds a "cluster" property to each point (0..clusterCount-1).
  const clusterCount = props.clusterCount
  const clusteredPoints = turf.clustersKmeans(clusterCollection, {
    numberOfClusters: clusterCount,
  })

  //  Compute centroid for each cluster
  const clusterCentroids = []
  for (let c = 0; c < clusterCount; c++) {
    const clusterPts = clusteredPoints.features.filter(
      f => f.properties?.cluster === c,
    )
    if (clusterPts.length > 0) {
      clusterCentroids[c] = turf.centroid(turf.featureCollection(clusterPts))
    }
    else {
      // If a cluster is empty (rare with K-means but possible), use a dummy centroid
      clusterCentroids[c] = turf.point([0, 0])
    }
  }

  // Generate TIN or Voronoi polygons from *all* points
  const polygons
    = props.type === 'tin'
      ? turf.tin(clusteredPoints)
      : turf.voronoi(clusteredPoints, { bbox: props.bbox })

  // Turf’s Voronoi/tin function can sometimes return features without a valid geometry.
  // This can happen if the algorithm can’t compute a proper polygon for certain points—often due
  // to edge cases like points being too close together, lying on the boundary, or duplicate points.
  const validPolygons = {
    ...polygons,
    features: polygons.features.filter(feature => feature.geometry),
  }

  // For each polygon, find the nearest cluster centroid and store:
  //    - cluster ID
  //    - distance to that centroid
  validPolygons.features.forEach((feature) => {
    const cellCentroid = turf.centroid(feature)
    let minDist = Infinity
    let clusterId = -1

    // Find the closest cluster
    for (let c = 0; c < props.clusterCount; c++) {
      const dist = turf.distance(cellCentroid, clusterCentroids[c])
      if (dist < minDist) {
        minDist = dist
        clusterId = c
      }
    }
    // Attach to feature properties
    feature.properties = feature.properties || {}
    feature.properties.cluster = clusterId
    feature.properties.distance = minDist
  })

  // Group polygons by cluster so we can compute a local min/max distance
  // for each cluster, ensuring each cluster is red at center, purple at edges.
  const polygonsByCluster = Array.from(
    { length: clusterCount },
    () => [],
  )

  validPolygons.features.forEach((f) => {
    const c = f.properties.cluster
    polygonsByCluster[c].push(f)
  })

  // For each cluster, find min/max distance
  const distanceRanges: [number, number][] = polygonsByCluster.map((clusterPolys) => {
    if (!clusterPolys.length)
      return [0, 1]
    const ds = clusterPolys.map(cp => cp.properties.distance)
    return [Math.min(...ds), Math.max(...ds)]
  })

  //  Color each polygon: center = red, edges = purple
  //  We do a local color scale for each cluster so each cluster’s center is bright red.
  polygonsByCluster.forEach((clusterPolys, clusterId) => {
    const [minDist, maxDist] = distanceRanges[clusterId] || [0, 1]
    clusterPolys.forEach((p) => {
      const d = p.properties.distance
      // Normalize distance for that cluster
      const distance = (d - minDist) / (maxDist - minDist || 1)
      // Interpolate from red (center) to purple (edge)
      p.properties.fillColor = d3.interpolateRgb(props.primaryColor, props.secondaryColor)(distance)
    })
  })

  // Convert polygons to OL features
  const features = geoJson.readFeatures(validPolygons, {
    dataProjection: 'EPSG:4326',
    featureProjection: 'EPSG:3857',
  })
  return features
})

/**
 * OpenLayers Style Function for Grid Cells
 */
function hexStyleFunction(feature: Feature) {
  return new Style({
    fill: new Fill({
      color: feature.get('fillColor') || 'rgba(0, 0, 0, 0.1)', // Fallback color
    }),
    stroke: new Stroke({ color: '#ffffff', width: props.width }),
  })
}
</script>

<template>
  <ol-vector-layer :visible="props.visible" :z-index="props.zIndex">
    <ol-source-vector :features="features" />
    <ol-style :override-style-function="hexStyleFunction" />
  </ol-vector-layer>
</template>
