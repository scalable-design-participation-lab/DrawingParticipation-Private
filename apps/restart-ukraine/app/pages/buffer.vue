<script setup lang="ts">
import Buffer from '@base/components/GeoSpatialLayer/Buffer/Buffer.vue';
import BufferController from '@base/components/GeoSpatialLayer/Buffer/BufferController.vue';
import { useAllFeatureStore } from '@base/stores/all-features';
import { toLonLat } from 'ol/proj';
import * as turf from "@turf/turf"
import { computed, ref } from 'vue';

const { featuresByType } = useAllFeatureStore();

const coordinates = computed(() => {
    if (!featuresByType.Point || !Array.isArray(featuresByType.Point)) {
        console.error("Invalid feature data:", featuresByType.Point);
        return turf.featureCollection([]);
    }
    const points = featuresByType.Point.map(feature => {
        const lonLat = toLonLat(feature.coordinates as [number, number]);
        return turf.point(lonLat);
    })

    return turf.featureCollection(points);
});

const visible = ref(true);
const zIndex = ref(1);
const radius = ref(200);
const mode = ref<'none' | 'union' | 'intersect'>('none');
const units = ref<'meters' | 'kilometers' | 'miles'>('meters');
</script>

<template>
    <BufferController
        v-model:visible="visible"
        v-model:zIndex="zIndex"
        v-model:radius="radius"
        v-model:mode="mode"
        v-model:units="units"
    />
    <GeneralizedBackgroundMap ref="baseMap" :min-zoom="0"> 
        <template #layers> 
            <Buffer
                :units="units"
                :mode="mode"
                :coordinates="coordinates"
                :visible="visible"
                :z-index="zIndex"
                :radius="radius"
            />
        </template>
    </GeneralizedBackgroundMap>
</template>