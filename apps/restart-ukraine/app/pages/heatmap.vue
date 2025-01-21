<template>
    <form>
      <fieldset>
        <label for="blur">Blur</label>
        <input
          type="range"
          id="blur"
          min="0"
          max="100"
          step="1"
          v-model.number="blur"
        />
        <span class="description">{{ blur }}</span>
      </fieldset>
      <fieldset>
        <label for="radius">Radius</label>
        <input
          type="range"
          id="radius"
          min="0"
          max="100"
          step="1"
          v-model.number="radius"
        />
        <span class="description">{{ radius }}</span>
      </fieldset>
    </form>
  
    <ol-map
      ref="map"
      :loadTilesWhileAnimating="true"
      :loadTilesWhileInteracting="true"
      style="height: 400px"
    >
      <ol-view
        ref="view"
        :center="center"
        :zoom="zoom"
        :projection="projection"
      />
  
      <ol-tile-layer>
        <ol-source-osm />
      </ol-tile-layer>
  
      <ol-heatmap-layer
        title="heatmap"
        :blur="blur"
        :radius="radius"
        :weight="heatmapWeight"
        :zIndex="1"
      >
        <ol-source-vector
          ref="earthquakes"
          url="https://raw.githubusercontent.com/openlayers/openlayers/main/examples/data/kml/2012_Earthquakes_Mag5.kml"
          :format="kmlFormat"
        >
        </ol-source-vector>
      </ol-heatmap-layer>
    </ol-map>
  </template>
  
  <script setup>
  import { ref } from "vue";
  import KML from "ol/format/KML"; // Explicitly import the KML format
  
  const center = ref([101.97, 4.21]);
  const projection = ref("EPSG:4326");
  const zoom = ref(5);
  const blur = ref(20);
  const radius = ref(20);
  
  // Use the imported KML format
  const kmlFormat = new KML({ extractStyles: false });
  
  const heatmapWeight = function (feature) {
    // Extract magnitude from feature name
    const name = feature.get("name");
    const magnitude = parseFloat(name.substr(2));
    return magnitude - 5;
  };
  </script>