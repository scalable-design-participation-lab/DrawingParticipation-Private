import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import FeatureLayer from '@components/FeatureLayer.vue'

/**
 * `visibleTags` is how a legend or a filter panel hides a category. A bug here
 * is invisible in code review and very visible on a map: the wrong set means
 * markers vanish.
 */
const passthrough = (tag: string) => ({ name: tag, template: '<div><slot /></div>' })
const stubs = {
  'ol-vector-layer': passthrough('ol-vector-layer'),
  'ol-source-vector': passthrough('ol-source-vector'),
  'ol-interaction-draw': passthrough('ol-interaction-draw'),
  'ol-geom-point': { name: 'ol-geom-point', template: '<i class="point" />' },
  'ol-geom-polygon': { name: 'ol-geom-polygon', template: '<i class="polygon" />' },
  'ol-geom-line-string': { name: 'ol-geom-line-string', template: '<i class="line" />' },
  'ol-feature': { name: 'ol-feature', props: ['properties'], template: '<div class="feature"><slot /></div>' },
  'ol-style': passthrough('ol-style'),
  'ol-style-icon': { name: 'ol-style-icon', props: ['src'], template: '<i class="icon" :data-src="src" />' },
  'ol-style-circle': passthrough('ol-style-circle'),
  'ol-style-fill': { name: 'ol-style-fill', template: '<i />' },
  'ol-style-stroke': { name: 'ol-style-stroke', template: '<i />' },
  'ol-overlay': passthrough('ol-overlay'),
  'UIcon': { name: 'UIcon', template: '<i />' },
}

const features = [
  { id: 'a', type: 'Point' as const, coordinates: [0, 0], iconName: 'movilidad' },
  { id: 'b', type: 'Point' as const, coordinates: [1, 1], iconName: 'verde' },
  { id: 'c', type: 'Point' as const, coordinates: [2, 2], iconName: 'cultura' },
]
const icons = { movilidad: '/m.svg', verde: '/v.svg', cultura: '/c.svg' }

function render(visibleTags?: unknown) {
  return mount(FeatureLayer, {
    props: { features, icons, ...(visibleTags === undefined ? {} : { visibleTags }) },
    global: { stubs },
  })
}

describe('featureLayer visibleTags', () => {
  it('draws every feature when no filter is given', () => {
    expect(render().findAll('.icon')).toHaveLength(3)
  })

  it('draws only the categories a checkbox map marks true', () => {
    const wrapper = render({ movilidad: false, verde: true, cultura: true })
    const drawn = wrapper.findAll('.icon').map(i => i.attributes('data-src'))
    expect(drawn).toEqual(['/v.svg', '/c.svg'])
  })

  it('accepts a plain list of tags', () => {
    const drawn = render(['verde']).findAll('.icon').map(i => i.attributes('data-src'))
    expect(drawn).toEqual(['/v.svg'])
  })

  it('hides everything when the map marks everything false', () => {
    expect(render({ movilidad: false, verde: false, cultura: false }).findAll('.icon')).toHaveLength(0)
  })

  it('keeps one properties object per feature across renders', async () => {
    // vue3-openlayers answers a change of `properties` with
    // setGeometry(undefined). Hand it a new object when a filter changes and
    // every feature left on the map loses its geometry, which looks exactly
    // like the icons failing to load.
    const wrapper = render({ movilidad: true, verde: true, cultura: true })
    const before = wrapper.findAllComponents({ name: 'ol-feature' }).map(c => c.props('properties'))
    await wrapper.setProps({ visibleTags: { movilidad: false, verde: true, cultura: true } })
    const after = wrapper.findAllComponents({ name: 'ol-feature' }).map(c => c.props('properties'))

    expect(after).toHaveLength(2)
    expect(after[0]).toBe(before[1])
    expect(after[1]).toBe(before[2])
  })
})
