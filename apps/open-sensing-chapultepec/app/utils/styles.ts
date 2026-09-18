import { registerStyle } from '../../../../base/app/utils/styles'

// Bitácora page presets: the Figma grids and the ink-on-paper box.
registerStyle('panel', 'panel', 'Ink border on paper (see assets/css/tailwind.css)')
registerStyle('legend-layout', 'grid h-full grid-cols-[3fr_4fr] gap-10 overflow-auto px-24 pb-8', 'Legend | canvas two-column page')
registerStyle('form-layout', 'grid h-full grid-cols-[1fr_3fr] gap-3 px-8 pb-8', 'Questions | photo two-column page')
registerStyle('canvas-slot', 'min-h-[420px] flex-1 border-b border-black', 'Glyph canvas area above the description form')
registerStyle('fill', 'absolute inset-0', 'Fill the parent (map page)')
registerStyle('placeholder', 'flex h-full items-center justify-center', 'Centered "coming soon" text')

// Shell (app.json `shell`): viewport-high frame, floating header, page area below it.
registerStyle('app-frame', 'h-dvh', 'Full viewport height frame')
registerStyle('page-main', 'relative h-full pt-24', 'Page area under the floating header')
registerStyle('wordmark', 'whitespace-pre-line text-[11px] font-bold leading-tight', 'Three-line text logo')
