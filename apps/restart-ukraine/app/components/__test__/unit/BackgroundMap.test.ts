import { beforeEach, describe, expect, it } from 'vitest';
import { config, mount } from '@vue/test-utils';
import BackgroundMap from '@components/BackgroundMap.vue';
import { createPinia, setActivePinia } from 'pinia';
import { useMapStore } from '@base/stores/map';

// Mock Components
const GeneralizedBackgroundMap = {
  name: 'GeneralizedBackgroundMap',
  template: '<div><slot></slot></div>',
  props: ['mapboxStyleLight', 'mapboxStyleDark'],
};
const DrawingLayer = {
  name: 'DrawingLayer',
  template: '<div><slot></slot></div>',
  props: {
    projection: [Object, String],
    showAllPlusIcons: Boolean,
    showCommentIcons: Boolean,
    enableClick: Boolean,
    isMapPage: Boolean,
    showDeleteButton: Boolean,
  },
  emits: [
    'toggle-comment-popup',
    'toggle-image-upload-popup',
    'show-comment-display',
  ],
};
const CommentModel = {
  name: 'CommentModel',
  template: '<div><slot></slot></div>',
  props: { isVisible: Boolean, featureId: Number },
  emits: ['close'],
};
const CommentDisplay = {
  name: 'CommentDisplay',
  template: '<div><slot></slot></div>',
  props: { modelValue: Boolean, feature: Object },
  emits: ['update:model-value'],
};

// Configure Vue Test Utils
config.global.stubs = {
  GeneralizedBackgroundMap,
  DrawingLayer,
  CommentModel,
  CommentDisplay,
};

describe('BackgroundMap.vue', () => {
  let wrapper: any;
  let pinia: any;
  let mapStore: any;

  beforeEach(() => {
    // Initialize Pinia and set it as active
    pinia = createPinia();
    setActivePinia(pinia);

    // Mount the component
    wrapper = mount(BackgroundMap, {
      props: {
        showAllPlusIcons: true,
        showCommentIcons: true,
        modelValue: false,
        selectedFeature: null,
      },
      global: {
        plugins: [pinia],
      },
    });
  });

  it('renders the GeneralizedBackgroundMap component with correct props', () => {
    const mapComponent = wrapper.findComponent({ name: 'GeneralizedBackgroundMap' });
    expect(mapComponent.exists()).toBe(true);
  });

});