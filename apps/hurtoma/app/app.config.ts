export default defineAppConfig({
  ui: {
    primary: 'blue',
    gray: 'slate',
    tooltip: {
      background: '!bg-background',
    },
    variables: {
      dark: {
        background: 'var(--color-slate-950)',
      },
      header: {
        height: '5rem',
      },
    },
    icons: {
      dark: 'i-ph-moon-duotone',
      light: 'i-ph-sun-duotone',
      search: 'i-ph-magnifying-glass-duotone',
      external: 'i-ph-arrow-up-right',
      chevron: 'i-ph-caret-down',
      hash: 'i-ph-hash-duotone',
    },
    header: {
      wrapper: 'lg:mb-0 lg:border-0',
      popover: {
        links: {
          active: 'dark:bg-black',
          inactive: 'dark:hover:bg-black',
        },
      },
    },
  },
})
