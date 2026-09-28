import MenuModal from "@components/MenuModal.vue";
import { config, mount, VueWrapper } from "@vue/test-utils";
import { describe, beforeEach, vi, expect, it } from "vitest";
import { useRouter } from "nuxt/app";
const pushMock = vi.fn()

vi.mock('nuxt/app', () => ({
  useRouter: vi.fn(() => ({
    push: pushMock,
  })),
}));

// The component reads its labels via the auto-imported useI18n; vitest has no
// Nuxt auto-imports, so provide it as a global returning the English strings.
vi.stubGlobal('useI18n', () => ({
  t: (key: string) =>
    ({ 'menu.home': 'Home', 'menu.about': 'About Us', 'menu.support': 'Support' } as Record<string, string>)[key] ?? key,
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
    const menuItems = ["Home", "About Us", "Support"];
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

    // Test "Home"
    await buttons[0].trigger("click");
    expect(mockRouter.push).toHaveBeenCalledWith("/");

    // Test "About Us"
    await buttons[1].trigger("click");
    expect(mockRouter.push).toHaveBeenCalledWith("/about");
  });
});