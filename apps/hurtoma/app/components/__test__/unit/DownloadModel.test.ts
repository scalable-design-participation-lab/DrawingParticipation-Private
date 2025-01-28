import DownloadModal from "@components/DownloadModal.vue"
import { config, mount, VueWrapper } from "@vue/test-utils"
import { describe, vi, beforeEach, it, expect } from "vitest"

// Mock Components with simple implementations 
const GenericFilterSidebar = { 
  name: 'GenericFilterSidebar',
  template: `
    <div>
      <slot name="before-filters"></slot>
      <slot name="footer-buttons"></slot>
    </div>
  `,
  props: ['isVisible', 'title', 'filterSections'],
}

const URadio = { 
  name: "URadio",
  template: `
    <input 
      type="radio" 
      :value="value" 
      :label="label" 
      :data-test="\`file-format-option-\${value}\`"
      @change="$emit('update:modelValue', $event.target.value)"
    />
  `,
  props: ['value', 'label', 'modelValue'],
}

const UButton = { 
  name: "UButton",
  template: `
    <button :data-test="\`cancel-button\`" @click="$emit('click')">
      <slot />
    </button>
  `,
}

const UIcon = { 
  name: "UIcon",
  template: '<i></i>'
}

config.global.stubs = {
  GenericFilterSidebar,
  UButton,
  UIcon,
  URadio,
}

describe("DownloadModal.vue", () => { 
  let wrapper: VueWrapper<any>;

  beforeEach(() => { 
    vi.clearAllMocks();

    wrapper = mount(DownloadModal, {
      props: {
        filterSections: [
          { name: "filter1", props: { modelValue: "value1" } },
          { name: "filter2", props: { modelValue: "value2" } },
        ],
      },
      global: {
        stubs: config.global.stubs,
      },
    });
  });


  it("renders all components", () => { 
    expect(wrapper.findComponent(GenericFilterSidebar).exists()).toBe(true);
    expect(wrapper.findComponent(URadio).exists()).toBe(true);
    expect(wrapper.findComponent(UButton).exists()).toBe(true);
    expect(wrapper.findComponent(UIcon).exists()).toBe(false);
  });

  it("initializes with default file format as JSON", () => {
    expect(wrapper.vm.fileFormat).toBe("json");
  });


  it("handles filter changes correctly", async () => {
    wrapper.vm.handleFilterChange({ name: "filter1", value: "newValue" });
    await wrapper.vm.$nextTick();
    expect(wrapper.vm.selectedFilters.filter1).toBe("newValue");
  });

  it("does not emit 'close' when clicking inside the modal", async () => {
    const modalContent = wrapper.findComponent(GenericFilterSidebar);
    await modalContent.trigger("click");
    expect(wrapper.emitted("close")).toBeFalsy();
  });

  it("handles empty filter sections correctly", async () => {
    const emptyWrapper = mount(DownloadModal, {
      props: {
        filterSections: [],
      },
      global: {
        stubs: config.global.stubs,
      },
    })  ;
    expect(emptyWrapper.vm.selectedFilters).toEqual({});
  });
})  ;