import { beforeEach, describe, expect, it, vi } from 'vitest';
import { config, mount, VueWrapper } from '@vue/test-utils';
import BackgroundMap from '@components/BackgroundMap.vue';
import { createPinia, setActivePinia } from 'pinia';

// Mock vue-router
vi.mock('vue-router', () => ({
  useRoute: vi.fn(() => ({ name: 'result' }))
}));

// Mock Components with simple implementations
const GeneralizedBackgroundMap = {
  name: 'GeneralizedBackgroundMap',
  template: '<div class="map-container"><slot name="layers"></slot><slot name="overlays"></slot></div>',
};

const DrawingLayer = {
  name: 'DrawingLayer',
  template: '<div class="drawing-layer"></div>',
};

const CommentModal = {
  name: 'CommentModal',
  template: '<div class="comment-modal"></div>',
};

const CommentDisplay = {
  name: 'CommentDisplay',
  template: '<div class="comment-display"></div>',
};

// Mock stores
const mockFeatureStore = {
  addFeature: vi.fn(),
};

const mockDrawingStore = {
  drawEnable: false,
  drawType: null,
};

const mockMapStore = {
  mapType: 'light',
};

const mockSideBarStore = {
  currentFrequency: 'daily',
};

vi.mock('@base/stores/features', () => ({
  useFeatureStore: () => mockFeatureStore
}));

vi.mock('@base/stores/drawing', () => ({
  useDrawingStore: () => mockDrawingStore
}));

vi.mock('@base/stores/map', () => ({
  useMapStore: () => mockMapStore
}));

vi.mock('@base/stores/sidebar', () => ({
  useSideBarStore: () => mockSideBarStore
}));

// Extend existing mocks to cover new test cases
const mockMap = {
  getPixelFromCoordinate: vi.fn(),
  getSize: vi.fn(),
};


// Configure Vue Test Utils
config.global.stubs = {
  GeneralizedBackgroundMap,
  DrawingLayer,
  CommentModal,
  CommentDisplay,
  'ol-source-vector': true,
  'ol-layer-vector': true,
  'ol-overlay': true,
};

describe('BackgroundMap.vue', () => {
  let wrapper: VueWrapper<any>;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Initialize Pinia
    setActivePinia(createPinia());

    // Mount component
    wrapper = mount(BackgroundMap, {
      props: {
        showAllPlusIcons: true,
        showCommentIcons: true,
        modelValue: false,
        selectedFeature: null,
      },
      global: {
        stubs: config.global.stubs,
      },
    });
  });
  it("renders correctly", () => { 
    expect(wrapper.element).toMatchSnapshot();
  })

  it('renders correctly with initial props', () => {
    expect(wrapper.findComponent(GeneralizedBackgroundMap).exists()).toBe(true);
    expect(wrapper.findComponent(DrawingLayer).exists()).toBe(false);
    expect(wrapper.findComponent(CommentDisplay).exists()).toBe(false);
    expect(wrapper.findComponent(CommentModal).exists()).toBe(false)
  });

  it('handles map click in draw mode', async () => {
    // Set up drawing mode
    mockDrawingStore.drawEnable = true;
    mockDrawingStore.drawType = 'Point';

    // Simulate map click
    await wrapper.vm.handleMapClick({ coordinate: [100, 100] });

    expect(mockFeatureStore.addFeature).toHaveBeenCalledWith({
      type: 'Point',
      coordinates: [100, 100],
      frequency: 'daily',
    });
  });

  it('toggles comment modal correctly', async () => {
    const feature = {
      id: 1,
      type: 'Point',
      coordinates: [100, 100],
    };

    // Open modal
    await wrapper.vm.toggleCommentModal(feature);
    expect(wrapper.vm.CommentModalVisible).toBe(true);
    expect(wrapper.vm.selectedFeatureId).toBe(1);

    // Close modal
    await wrapper.vm.toggleCommentModal(feature);
    expect(wrapper.vm.CommentModalVisible).toBe(false);
    expect(wrapper.vm.selectedFeatureId).toBe(null);
  });

  it('calculates popup position correctly', () => {
    const feature = {
      type: 'Point',
      coordinates: [100, 100],
    };

    const result = wrapper.vm.calculatePopupPosition(feature);
    
    expect(result).toEqual({
      position: [100, 100],
      offset: [0, 0], // Default offset when map is not available
    });
  });

  it('handles comment display updates', async () => {
    // Test showing comment display
    const feature = {
      id: 1,
      type: 'Point',
      coordinates: [100, 100],
    };

    await wrapper.vm.handleShowCommentDisplay({ feature });
    expect(wrapper.vm.showCommentDisplay).toBe(true);
    expect(wrapper.vm.selectedFeatureForDisplay).toEqual(feature);

    // Test hiding comment display
    await wrapper.vm.updateShowCommentDisplay(false);
    expect(wrapper.vm.showCommentDisplay).toBe(false);
  });

  it('handles different feature types for position calculation', () => {
    // Test Point feature
    const pointFeature = {
      type: 'Point',
      coordinates: [100, 100],
    };
    const pointResult = wrapper.vm.getFeaturePosition(pointFeature);
    expect(pointResult).toEqual([100, 100]);

    // Test Polygon feature
    const polygonFeature = {
      type: 'Polygon',
      coordinates: [[[0, 0], [100, 0], [100, 100], [0, 100]]],
    };
    const polygonResult = wrapper.vm.getFeaturePosition(polygonFeature);
    expect(polygonResult).toEqual([50, 50]); // Center of polygon

    // Test LineString feature
    const lineStringFeature = {
      type: 'LineString',
      coordinates: [[0, 0], [100, 100]],
    };
    const lineStringResult = wrapper.vm.getFeaturePosition(lineStringFeature);
    expect(lineStringResult).toEqual([100, 100]); // Last point
  });
  it('handles opening and closing image upload modal', async () => {
      const feature = { id: 1 };
      
      // Test opening
      await wrapper.vm.toggleImageUploadModal(feature);
      expect(wrapper.vm.CommentModalVisible).toBe(true);
      expect(wrapper.vm.selectedFeatureId).toBe(1);

      // Test closing
      await wrapper.vm.toggleImageUploadModal(feature);
      expect(wrapper.vm.CommentModalVisible).toBe(false);
      expect(wrapper.vm.selectedFeatureId).toBe(null);
    });
  it('returns default coordinates for null feature', () => {
        const result = wrapper.vm.getFeaturePosition(null);
        expect(result).toEqual([0, 0]);
      });
  it('closes display when showing same feature twice', async () => {
      const feature = { id: 1 };
      
      // First display
      await wrapper.vm.handleShowCommentDisplay({ feature });
      expect(wrapper.vm.showCommentDisplay).toBe(true);
      
      // Second display of same feature
      await wrapper.vm.handleShowCommentDisplay({ feature });
      expect(wrapper.vm.showCommentDisplay).toBe(false);
      expect(wrapper.vm.selectedFeatureForDisplay).toBe(null);
    });
  it('calculates position for upper-left quadrant', () => {

      mockMap.getSize.mockImplementation(() => [800, 600]);
      mockMap.getPixelFromCoordinate.mockImplementation(() => [600, 400]);
      mockMap.getPixelFromCoordinate.mockImplementation(() => [200, 200]);
      
      const feature = {
        type: 'Point',
        coordinates: [100, 100]
      };
      
      const { position, offset } = wrapper.vm.calculatePopupPosition(feature);
      expect(position).toEqual([100, 100]);
      expect(offset[0]).toBe(0); // Should show on right
      expect(offset[1]).toBe(0); // Should show below
    });

  it('calculates position for lower-right quadrant', () => {
      mockMap.getPixelFromCoordinate.mockImplementation(() => [400, 300]);
      mockMap.getSize.mockImplementation(() => [800, 600]);
      mockMap.getPixelFromCoordinate.mockImplementation(() => [600, 400]);
      
      const feature = {
        type: 'Point',
        coordinates: [100, 100]
      };
      
      const { position, offset } = wrapper.vm.calculatePopupPosition(feature);
      expect(position).toEqual([100, 100]);
      expect(offset[0]).toBe(0); // Should show on left
      expect(offset[1]).toBe(0); // Should show above
    });
  it('handles null pixel from map', () => {
      mockMap.getPixelFromCoordinate.mockImplementation(() => null);
      
      const feature = {
        type: 'Point',
        coordinates: [100, 100]
      };
      
      const { position, offset } = wrapper.vm.calculatePopupPosition(feature);
      expect(position).toEqual([100, 100]);
      expect(offset).toEqual([0, 0]);
    });
  it('handles null map reference', async () => {
      wrapper.vm.baseMap = null;
      
      const feature = {
        type: 'Point',
        coordinates: [100, 100]
      };
      
      const { position, offset } = wrapper.vm.calculatePopupPosition(feature);
      expect(position).toEqual([100, 100]);
      expect(offset).toEqual([0, 0]);
    });
});