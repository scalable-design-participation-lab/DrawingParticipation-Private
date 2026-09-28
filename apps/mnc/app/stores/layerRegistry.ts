import Grid, { type GridType } from '@base/components/GeoSpatialLayer/Grid/Grid.vue';
import HeatMap from '@base/components/GeoSpatialLayer/HeatMap/HeatMap.vue';
import GridController from '@base/components/GeoSpatialLayer/Grid/GridController.vue';
import HeatMapController from '@base/components/GeoSpatialLayer/HeatMap/HeatMapController.vue';
import BufferIcon from '@base/components/Icons/BufferIcon.vue';
import BufferController from '@base/components/GeoSpatialLayer/Buffer/BufferController.vue';
import Buffer from '@base/components/GeoSpatialLayer/Buffer/Buffer.vue';
import InterpolateIcon from '@base/components/Icons/InterpolateIcon.vue';
import Interpolate from '@base/components/GeoSpatialLayer/Interpolate/Interpolate.vue';
import InterpolateController from '@base/components/GeoSpatialLayer/Interpolate/InterpolateController.vue';
import PointIcon from '@base/components/Icons/PointIcon.vue';
import Points from '@base/components/GeoSpatialLayer/Points/Points.vue';
import PointsController from '@base/components/GeoSpatialLayer/Points/PointsController.vue';
import TesselationIcon from '@base/components/Icons/TesselationIcon.vue';
import Tesselation from '@base/components/GeoSpatialLayer/Tesselation/Tesselation.vue';
import TesselationController from '@base/components/GeoSpatialLayer/Tesselation/TesselationController.vue';
import GridIcon from '@base/components/Icons/GridIcon.vue';
import HeatMapIcon from '@base/components/Icons/HeatMapIcon.vue';

export const layerDefinitions = {
  grid: {
    label: 'Grid',
    icon: GridIcon,
    component: Grid,
    controller: GridController,
    defaultProps: {
      shape:     'Hexagon' as GridType,
      baseHue:    0,
      cellSide:   0.2,
      visible:    true,
      width:      1,
    }
  },
  buffer: {
    label: 'Buffer',
    icon: BufferIcon,
    component: Buffer,
    controller: BufferController,
    defaultProps: {
        units: 'meters', 
        mode: 'none',
        radius: 200,
        visible: true, 
        zIndex: 1,
    }
  },
  interpolate: {
    label: 'Interpolate',
    icon: InterpolateIcon,
    component: Interpolate,
    controller: InterpolateController,
    defaultProps: {
        zIndex: 1,
        visible: true,
        gridSize: 0.4,
        gridType: 'square',
        units: 'kilometers',
        bbox: [28.462271, 49.215576, 28.570271, 49.265576],
        property: 'value',
    }
  },
  points: {
    label: 'Points',
    icon: PointIcon,
    component: Points,
    controller: PointsController,
    defaultProps: {
        visible: true, 
        zIndex: 1,
    }
  },
  tesselation: { 
    label: 'Tesselation',
    icon: TesselationIcon,
    component: Tesselation,
    controller: TesselationController,
    defaultProps: {
        type: 'voronoi',
        visible: true,
        zIndex: 1,
        opacity: 0.5,
        opacityMode: 'larger',
        clusterCount: 1,
        primaryColor: '#FF0000',
        secondaryColor: '#800080',
        area: true,
    }
  },
  heatmap: {
    label: 'Heatmap',
    component: HeatMap,
    controller: HeatMapController,
    icon: HeatMapIcon,
    defaultProps: { 
      visible: true,
      weight:  1,
      gradient: ['blue','cyan','lime','yellow','red'],
      blur:    15,
      radius:  8,
      opacity: 0.6,
      zIndex:  1,
      // NOTE: features are usually passed in dynamically from your store,
      // so you can leave it undefined here or default to an empty array.
      features: []}   
  },
} ;