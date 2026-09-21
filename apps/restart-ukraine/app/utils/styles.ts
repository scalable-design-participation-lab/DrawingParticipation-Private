import { registerStyle } from '../../../../base/app/utils/styles'

// Гуртомá page-level presets (the few things the layout primitives do not cover).
registerStyle('about-page', 'mb-24 leading-tight', 'About page body')
registerStyle('hero', 'mt-48 px-7', 'First block under the floating header')
registerStyle('section', 'px-7', 'Content block with the page gutter')
registerStyle('pill-button', 'my-2 flex place-self-start rounded-full px-6 py-3', 'Rounded call-to-action button')
registerStyle('pill-button-secondary', 'my-2 flex place-self-start rounded-full bg-gray-300 px-6 py-3 text-black hover:text-white dark:bg-zinc-600 dark:text-white dark:hover:bg-zinc-700', 'Secondary rounded button')
registerStyle('feature-card', 'md:w-56', 'Feature card width in the four-up row')
registerStyle('feature-card-tall', 'pb-32 md:w-56', 'First feature card (taller)')
registerStyle('menu-item', 'rounded-full py-3 text-lg font-semibold', 'Full-width menu entry (Button)')
registerStyle('feature-icon', 'h-6 w-6 flex-shrink-0 text-blue-500', 'Icon in front of a feature line')
registerStyle('sidebar', 'fixed right-6 top-24 z-40 max-h-[calc(100vh-11rem)] w-96 overflow-y-auto md:w-80', 'Participation panel anchored to the right edge')
registerStyle('map-layer', 'absolute inset-0 z-[1]', 'Map behind the floating header/footer')
registerStyle('divider-wide', 'mt-24 mb-8', 'Divider between about sections')
