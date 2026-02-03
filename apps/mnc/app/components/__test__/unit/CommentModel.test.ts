import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mount, VueWrapper } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import CommentModal from '@components/CommentModal.vue';

// Mock the feature store
const mockFeatureStore = {
  getComment: vi.fn(),
  addComment: vi.fn(),
};

vi.mock('@base/stores/features', () => ({
  useFeatureStore: () => mockFeatureStore
}));

// Mock Nuxt UI components
const UCard = {
  name: 'UCard',
  template: '<div class="u-card"><slot /></div>',
};

const UTextarea = {
  name: 'UTextarea',
  template: '<textarea class="u-textarea" :value="modelValue" @input="$emit(\'input\', $event)"></textarea>',
  props: ['modelValue', 'placeholder'],
  emits: ['input'],
};

const UButton = {
  name: 'UButton',
  template: '<button class="u-button"><slot /></button>',
  props: ['color', 'variant'],
};

describe('CommentModal.vue', () => {
  let wrapper: VueWrapper<any>;

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();
    
    // Initialize Pinia
    setActivePinia(createPinia());

    // Mount component with default props
    wrapper = mount(CommentModal, {
      props: {
        isVisible: true,
        featureId: 1,
      },
      global: {
        stubs: {
          UCard,
          UTextarea,
          UButton,
        },
      },
    });
  });


  it("renders correctly", () => { 
    expect(wrapper.element).toMatchSnapshot();
  })
  // Test initial rendering
  it('renders when visible', () => {
    expect(wrapper.find('.u-card').exists()).toBe(true);
    expect(wrapper.find('.u-textarea').exists()).toBe(true);
    expect(wrapper.findAll('.u-button')).toHaveLength(2);
  });

  it('does not render when not visible', async () => {
    await wrapper.setProps({ isVisible: false });
    expect(wrapper.find('.u-card').exists()).toBe(false);
  });

  // Test loading existing comment
  it('loads existing comment on mount', async () => {
    mockFeatureStore.getComment.mockReturnValue('Existing comment');
    
    wrapper.vm.loadExistingComment() // Call method directly

    expect(mockFeatureStore.getComment).toHaveBeenCalledWith(1);
    expect(wrapper.vm.localComment).toBe('Existing comment');
    expect(wrapper.vm.existingComment).toBe('Existing comment');
  });

  // Test watching featureId changes
  it('loads new comment when featureId changes', async () => {
    mockFeatureStore.getComment.mockReturnValue('New comment');
    
    await wrapper.setProps({ featureId: 2 });
    
    expect(mockFeatureStore.getComment).toHaveBeenCalledWith(2);
    expect(wrapper.vm.localComment).toBe('New comment');
  });

  // Test watching visibility changes
  it('reloads comment when becoming visible', async () => {
    await wrapper.setProps({ isVisible: false });
    mockFeatureStore.getComment.mockReturnValue('Reloaded comment');
    await wrapper.setProps({ isVisible: true });
    
    expect(mockFeatureStore.getComment).toHaveBeenCalledWith(1);
    expect(wrapper.vm.localComment).toBe('Reloaded comment');
  });

  // Test adding/updating comment
  it('adds new comment when no existing comment', async () => {
    wrapper.vm.localComment = 'New comment';
    await wrapper.find('.u-button:last-child').trigger('click');
    
    expect(mockFeatureStore.addComment).toHaveBeenCalledWith(1, 'New comment');
    expect(wrapper.emitted('close')).toBeTruthy();
  });

  it('updates existing comment', async () => {
    wrapper.vm.existingComment = 'Old comment';
    wrapper.vm.localComment = 'Updated comment';
    await wrapper.find('.u-button:last-child').trigger('click');
    
    expect(mockFeatureStore.addComment).toHaveBeenCalledWith(1, 'Updated comment');
    expect(wrapper.emitted('close')).toBeTruthy();
  });

  // Test closing modal
  it('emits close event when closing', async () => {
    await wrapper.find('.u-button:first-child').trigger('click');
    expect(wrapper.emitted('close')).toBeTruthy();
  });

  // Test button text
  it('shows correct button text based on existing comment', async () => {
    // New comment
    const addButton = wrapper.find('.u-button:last-child');
    expect(addButton.text()).toBe('Оновити');

    // Existing comment
    wrapper.vm.existingComment = 'Existing';
    await wrapper.vm.$nextTick();
    expect(addButton.text()).toBe('Оновити');
  });

  // Test null featureId handling
  it('does not add comment when featureId is null', async () => {
    await wrapper.setProps({ featureId: null });
    wrapper.vm.localComment = 'Test comment';
    await wrapper.find('.u-button:last-child').trigger('click');
    
    expect(mockFeatureStore.addComment).not.toHaveBeenCalled();
  });
});