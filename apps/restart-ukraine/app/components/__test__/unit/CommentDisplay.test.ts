import { beforeEach, describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import CommentDisplay from '@components/CommentDisplay.vue';
import { createPinia, setActivePinia } from 'pinia';


describe('BackgroundMap.vue', () => {
  let wrapper: any;
  let pinia: any;

  beforeEach(() => {
    // Initialize Pinia and set it as active
    pinia = createPinia();
    setActivePinia(pinia);

    // Mount the component
    wrapper = mount(CommentDisplay), {
      props: {
        modelValue: true,
        features: {
          id: 1,
          properties: {
            comment: 'Test comment',
            date: '2022-01-01',
          }
      },
      global: {
        plugins: [pinia],
      },
    }
  }})

  it('renders the CommentDisplay component', () => {
    const mapComponent = wrapper.findComponent({ name: 'CommentDisplay' });
    expect(mapComponent.exists()).toBe(true);
  });

});