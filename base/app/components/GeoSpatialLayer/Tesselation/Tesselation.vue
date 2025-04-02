<script setup lang="ts">
import * as turf from '@turf/turf'
import GeoJSON from 'ol/format/GeoJSON'
import { Fill, Stroke, Style } from 'ol/style'
import { computed } from 'vue'
import type { Feature } from 'ol'
import * as d3 from 'd3'
import type { FeatureCollection, Geometry } from 'geojson'

export type TesselationType = 'voronoi' | 'tin'

export interface TesselationProps {
  features?: FeatureCollection<Geometry>
  bbox?: number[]
  visible?: boolean
  zIndex?: number
  type?: TesselationType
  width?: number
  clusterCount?: number
  primaryColor?: string
  secondaryColor?: string
  area?: boolean
}

const props = withDefaults(defineProps<TesselationProps>(), {
  features: () => ({
    type: 'FeatureCollection',
    features: [],
  }),
  bbox: () => [28.462271, 49.215576, 28.570271, 49.265576],
  visible: false,
  zIndex: 0,
  type: 'voronoi',
  width: 1,
  clusterCount: 2, // Number of clusters to find
  primaryColor: 'red',
  secondaryColor: 'purple',
  area: true,
})

const geoJson = new GeoJSON()

const computedFeatures = computed(() => {
  if (!props.features.features) {
    console.warn('No coordinates provided for Tesselation computation.')
    return []
  }
  if (!Array.isArray(props.features.features)) {
    throw new TypeError('Invalid format: coordinates must be an array of [number, number] pairs.')
  }

  const seen = new Set<string>()
  const uniqueCoordinates: [number, number][] = []
  for (const coord of props.features.features) {
    const coordinates = coord.geometry.coordinates
    const key = coordinates.join(',')
    if (!seen.has(key)) {
      seen.add(key)
      uniqueCoordinates.push(coordinates)
    }
  }

  // Filter points within the bbox using unique coordinates
  const [minX, minY, maxX, maxY] = props.bbox
  const filteredCoordinates = uniqueCoordinates.filter(([x, y]) =>
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

  // Compute centroids for each cluster
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
  //    - area of the polygon
  validPolygons.features.forEach((feature) => {
    const cellCentroid = turf.centroid(feature)
    const area = turf.area(feature)
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
    feature.properties.area = area
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
  // Calculate areas
  const areaRanges: [number, number][] = polygonsByCluster.map((clusterPolys) => {
    if (!clusterPolys.length)
      return [0, 1]
    const areas = clusterPolys.map(feature => turf.area(feature))
    return [Math.min(...areas), Math.max(...areas)]
  })

  //  Color each polygon: center = red, edges = purple
  //  We do a local color scale for each cluster so each cluster’s center is bright red.
  polygonsByCluster.forEach((clusterPolys, clusterId) => {
    const [minDist, maxDist] = distanceRanges[clusterId] || [0, 1]
    const [minArea, maxArea] = areaRanges[clusterId] || [0, 1]
    clusterPolys.forEach((p) => {
      const distance = p.properties.distance
      const area = p.properties.area
      // Normalize distance for that cluster
      const normDist = (distance - minDist) / (maxDist - minDist || 1)
      // Interpolate from red (center) to purple (edge)
      p.properties.fillColor = props.area
        ? d3.scaleSequential(d3.interpolateRgb(props.secondaryColor, props.primaryColor)).domain([minArea, maxArea])(area)
        : d3.interpolateRgb(props.primaryColor, props.secondaryColor)(normDist)
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
      color: feature.get('fillColor') || 'rgba(0, 0, 0, 0)', // Fallback color
    }),
    stroke: new Stroke({ color: '#ffffff', width: props.width }),
  })
}
</script>

<template>
  <ol-vector-layer :visible="props.visible" :z-index="props.zIndex">
    <ol-source-vector :features="computedFeatures" />
    <ol-style :override-style-function="hexStyleFunction" />
  </ol-vector-layer>
</template>
