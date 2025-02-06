<template>
  <GeneralizedBackgroundMap ref="baseMap">
    <template #layers>
      <ol-vector-layer id="hexLayer">
        <ol-source-vector ref="hexSource" :features="computedHexFeatures" />
        <ol-style :overrideStyleFunction="hexStyleFunction" />
      </ol-vector-layer>
    </template>
  </GeneralizedBackgroundMap>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import * as turf from '@turf/turf';
import GeoJSON from 'ol/format/GeoJSON';
import { Fill, Stroke, Style } from 'ol/style';
import { useAllFeatureStore } from '@base/stores/all-features';
import { toLonLat } from 'ol/proj';

// Get data from the store.
const { featuresByType } = useAllFeatureStore();

// Reference to the map component (if needed later)
const baseMap = ref(null);

// Reference to the vector source component
const hexSource = ref(null);

// Create a GeoJSON formatter instance.
const geoJson = new GeoJSON();

/**
 * Compute the hex features based on featuresByType.Point.
 * Returns an array of OpenLayers features.
 */
const computedHexFeatures = computed(() => {
  if (!featuresByType.Point || !featuresByType.Point.length) {
    return [];
  }

  // Define the hex grid parameters.
  const bbox = [28.422271, 49.200576, 28.582271, 49.285576]; // in EPSG:4326
  const cellSide = 0.1; // in miles
  const options = { units: "miles" };

  // Create the hex grid using Turf.
  const hexgrid = turf.hexGrid(bbox, cellSide, options);

  // Convert each data point to EPSG:4326 and create a FeatureCollection.
  const dataPoints = turf.featureCollection(
    featuresByType.Point.map((feat: any) => {
      const lonLat = toLonLat([feat.coordinates[0], feat.coordinates[1]], 'EPSG:3857');
      return turf.point(lonLat);
    })
  );

  // Count points in each hexagon.
  hexgrid.features.forEach(feature => {
    const ptsWithin = turf.pointsWithinPolygon(dataPoints, feature);
    feature.properties.count = ptsWithin.features.length;
  });

  // Determine the maximum count.
  const maxCount = Math.max(...hexgrid.features.map(feature => feature.properties.count));

  // Assign a fillColor to each hex cell.
  const baseHue = 0; 
  hexgrid.features.forEach(feature => {
    const count = feature.properties.count;
    // Map count: 0 -> 95% lightness; maxCount -> 25% lightness.
    const lightness = maxCount > 0 ? 95 - (count / maxCount) * 70 : 100;
    const alpha = count === 0 ? 0.5 : 1;
    feature.properties.fillColor = `hsla(${baseHue}, 100%, ${lightness}%, ${alpha})`;
  });

  // Convert the Turf GeoJSON to OpenLayers features.
  const features = geoJson.readFeatures(hexgrid, {
    dataProjection: 'EPSG:4326',
    featureProjection: 'EPSG:3857'
  });

  return features;
});


/**
 * Define the style function for the hex cells.
 */
const hexStyleFunction = (feature: any) => {
  const fillColor = feature.get('fillColor') || 'hsla(0, 0%, 0%, 0)';
  return new Style({
    fill: new Fill({
      color: fillColor,
    }),
    stroke: new Stroke({
      color: '#ffffff',
      width: 1,
    }),
  });
};
</script>