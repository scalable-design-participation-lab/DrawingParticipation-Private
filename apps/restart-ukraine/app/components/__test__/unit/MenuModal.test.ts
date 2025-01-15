import MenuModal from "@components/MenuModal.vue";
import { config, mount, VueWrapper } from "@vue/test-utils";
import { describe, beforeEach, vi, expect, it } from "vitest";
import { useRouter } from "vue-router";
const pushMock = vi.fn()

vi.mock("vue-router", () => ({
  useRouter: vi.fn(() => ({
    push: pushMock,
    currentRoute: {
      value: { path: "/" },
    },
  })),
}));

// Mocking the Vue components
const UModal = {
  name: "UModel",
  template: "<div><slot/></div>",
};

const UCard = {
  name: "Ucard",
  template: "<div><slot/></div>",
};

const UButton = {
  name: "UButton",
  template: "<button><slot/></button>",
};

const SupportModal = {
  name: "SupporModal",
  template: "<div></div>",
};

config.global.stubs = {
  UModal,
  UCard,
  UButton,
  SupportModal,
};

describe("MenuModal.vue", () => {
  let wrapper: VueWrapper<any>;
  const mockRouter = useRouter();

  beforeEach(() => {
    vi.clearAllMocks();

    wrapper = mount(MenuModal, {
      props: {
        modelValue: true,
      },
      global: {
        stubs: config.global.stubs,
      },
    });
  });

  it("renders correctly", () => {
    expect(wrapper.element).toMatchSnapshot();
  });

  it("displays all menu items", () => {
    const buttons = wrapper.findAllComponents(UButton);
    const menuItems = ["Головна", "Про нас", "Підтримка", "Результати"];
    buttons.forEach((button, index) => {
      expect(button.text()).toBe(menuItems[index]);
    });
  });

  it("emits `select` event when a menu item is clicked", async () => {
    const buttons = wrapper.findAllComponents(UButton);
    await buttons[0].trigger("click");

    expect(wrapper.emitted("select")).toBeTruthy();
    expect(wrapper.emitted("select")[0]).toEqual(["home"]);
  });

  it("closes the modal when an item is clicked", async () => {
    const button = wrapper.findComponent(UButton);
    await button.trigger("click");

    expect(wrapper.props("modelValue")).toBe(true);
  });

  it("shows SupportModal when 'Підтримка' is clicked", async () => {
    const buttons = wrapper.findAllComponents(UButton);
    await buttons[2].trigger("click");

    const supportModal = wrapper.findComponent(SupportModal);
    expect(supportModal.exists()).toBe(true);
  });

  it("navigates to the correct route when a menu item is clicked", async () => {
    const buttons = wrapper.findAllComponents(UButton);

    // Test "Головна"
    await buttons[0].trigger("click");
    expect(mockRouter.push).toHaveBeenCalledWith("/");

    // Test "Про нас"
    await buttons[1].trigger("click");
    expect(mockRouter.push).toHaveBeenCalledWith("/about");

    // Test "Результати"
    await buttons[3].trigger("click");
    expect(mockRouter.push).toHaveBeenCalledWith("/map");
  });
});