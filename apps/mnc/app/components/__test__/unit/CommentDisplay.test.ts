import { beforeEach, describe, expect, it } from 'vitest';
import { mount, config } from '@vue/test-utils';
import CommentDisplay from '@components/CommentDisplay.vue'; // Adjust the path as needed
import { createPinia, setActivePinia } from 'pinia';

// Mock Components
const UCard = {
  name: 'UCard',
  template: '<div class="u-card"><slot></slot><slot name="header"></slot></div>',
};

const UAvatar = {
  name: 'UAvatar',
  template: '<div class="u-avatar">{{ alt }}</div>',
  props: ['alt', 'size'],
};

const UButton = {
  name: 'UButton',
  template: '<button class="u-button" @click="$emit(\'click\')">{{ icon }}</button>',
  props: ['icon', 'color', 'variant', 'size'],
};

// Configure Vue Test Utils
config.global.stubs = {
  UCard,
  UAvatar,
  UButton,
};

describe('CommentDisplay.vue', () => {
  let wrapper: any;
  let pinia: any;

  beforeEach(() => {
    // Initialize Pinia and set it as active
    pinia = createPinia();
    setActivePinia(pinia);

    // Mount the component with mocked components
    wrapper = mount(CommentDisplay, {
      props: {
        modelValue: true,
        feature: {
          id: '1',
          type: 'Point',
          coordinates: [50, 50],
          comment: 'Test comment',
          iconName: 'pollution',
          timestamp: '2023-11-01T10:00:00Z',
          name: { firstname: 'John', lastname: 'Doe' },
          isProhibit: false,
        },
      },
      global: {
        plugins: [pinia],
      },
    });
  });

  it("renders correctly", () => { 
    expect(wrapper.element).toMatchSnapshot();
  })

  it('renders the UCard component when isOpen is true', () => {
    expect(wrapper.find('.u-card').exists()).toBe(true);
  });

  it('renders the UAvatar component with correct props', () => {
    const avatar = wrapper.findComponent(UAvatar);
    expect(avatar.exists()).toBe(true);
    expect(avatar.text()).toContain('John'); // Mock displays `alt` prop
  });

  it('does not render the UAvatar when feature name is missing', async () => {
    await wrapper.setProps({ feature: { ...wrapper.props().feature, name: undefined } });
    const avatar = wrapper.findComponent(UAvatar);
    expect(avatar.exists()).toBe(false);
  });

  it('renders the UButton component and emits click event', async () => {
    const button = wrapper.findComponent(UButton);
    expect(button.exists()).toBe(true);

    await button.trigger('click');
    expect(wrapper.emitted('update:modelValue')).toBeTruthy();
    expect(wrapper.emitted('update:modelValue')[0]).toEqual([false]);
  });

  it('displays the feature title correctly based on feature data', () => {
    const title = wrapper.find('h3');
    expect(title.text()).toBe('Pollution Point');
  });

  it('displays the formatted timestamp', () => {
    const timestamp = wrapper.find('.text-xs.text-gray-500');
    expect(timestamp.text()).toBe('Nov 1, 2023');
  });

  it('shows fallback message when comment is empty', async () => {
    await wrapper.setProps({ feature: { ...wrapper.props().feature, comment: '' } });
    const fallbackMessage = wrapper.find('p.text-sm.italic');
    expect(fallbackMessage.text()).toBe('No one has left comments for this location yet.');
  });
});