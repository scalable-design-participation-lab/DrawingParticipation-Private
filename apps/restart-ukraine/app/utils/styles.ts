import { registerStyle } from '../../../../base/app/utils/styles'

// Гуртомá page-level presets (the few things the layout primitives do not cover).
registerStyle('about-page', 'mb-24 leading-tight', 'About page body')
registerStyle('hero', 'mt-48 px-7', 'First block under the floating header')
registerStyle('section', 'px-7', 'Content block with the page gutter')
registerStyle('pill-button', 'my-2 flex place-self-start rounded-full px-6 py-3', 'Rounded call-to-action button')
registerStyle('pill-button-secondary', 'my-2 flex place-self-start rounded-full bg-gray-300 px-6 py-3 text-black hover:text-white dark:bg-zinc-600 dark:text-white dark:hover:bg-zinc-700', 'Secondary rounded button')
registerStyle('feature-card', 'md:w-56', 'Feature card width in the four-up row')
registerStyle('feature-card-tall', 'pb-32 md:w-56', 'First feature card (taller)')
registerStyle('map-layer', 'absolute inset-0 z-[1]', 'Map behind the floating header/footer')
