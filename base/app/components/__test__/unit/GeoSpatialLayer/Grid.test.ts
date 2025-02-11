import Grid from '@components/GeoSpatialLayer/Grid.vue'
import { type VueWrapper, mount } from '@vue/test-utils'
import * as turf from '@turf/turf'
import Nop from '@components/Nop.vue'

describe('grid.vue', () => {
  let wrapper: VueWrapper<any>

  beforeEach(() => {
    wrapper = mount(Grid, {
      global: {
        stubs: {
          'ol-vector-layer': Nop,
          'ol-source-vector': Nop,
          'ol-style': Nop,
        },
      },
      props: {
        points: [],
      },
    })
  })

  it('renders correctly', () => {
    expect(wrapper.element).toMatchSnapshot()
  })

  it('renders with provided props', () => {
    expect(wrapper.props().points).toStrictEqual([])
  })

  it('renders with default props', () => {
    wrapper = mount(Grid, { props: { points: [] } })
    expect(wrapper.props().cellSide).toBe(1)
    expect(wrapper.props().baseHue).toBe(0)
    expect(wrapper.props().zIndex).toBe(0)
    expect(wrapper.props().shape).toBe('Hexagon')
    expect(wrapper.props().visible).toBe(false)
    expect(wrapper.props().bbox).toStrictEqual([28.422271, 49.200576, 28.582271, 49.285576])
  })

  it('computedHexFeatures should return empty array when no points are provided', async () => {
    expect(wrapper.vm.computedHexFeatures).toStrictEqual([])
  })

  it('computedHexFeatures should generate grid when points exist', async () => {
    const points = [{ coordinates: [28.45, 49.22] }, { coordinates: [28.48, 49.23] }]
    await wrapper.setProps({ points })
    expect(wrapper.vm.computedHexFeatures.length).toBeGreaterThan(0)
  })

  it('createGrid should generate a valid grid', () => {
    const grid = wrapper.vm.createGrid()
    expect(grid).toHaveProperty('type', 'FeatureCollection')
    expect(grid.features.length).toBeGreaterThan(0)
  })

  it('createGrid should respect shape prop', async () => {
    await wrapper.setProps({ shape: 'Triangle' })
    expect(wrapper.vm.createGrid().features.length).toBeGreaterThan(0)

    await wrapper.setProps({ shape: 'Square' })
    expect(wrapper.vm.createGrid().features.length).toBeGreaterThan(0)

    await wrapper.setProps({ shape: 'Hexagon' })
    expect(wrapper.vm.createGrid().features.length).toBeGreaterThan(0)
  })

  it('countPointsInGrid should correctly count points within grid cells', async () => {
    const grid = turf.hexGrid([28.42, 49.20, 28.58, 49.28], 1, { units: 'miles' })
    const dataPoints = turf.featureCollection([
      turf.point([28.45, 49.22]),
      turf.point([28.48, 49.23]),
    ])
    wrapper.vm.countPointsInGrid(grid, dataPoints)

    expect(grid.features.some(f => f.properties.count > 0)).toBe(true)
  })

  it('assignGridColors should assign colors based on density', () => {
    const grid = turf.hexGrid([28.42, 49.20, 28.58, 49.28], 1, { units: 'miles' })
    grid.features.forEach(f => (f.properties.count = Math.floor(Math.random() * 10)))

    wrapper.vm.assignGridColors(grid)

    grid.features.forEach((feature) => {
      expect(feature.properties.fillColor).toMatch(/hsla\(0, 100%, \d+(\.\d+)?%, (0\.\d+|1)\)/)
    })
  })

  it('layer visibility toggles correctly', async () => {
    expect(wrapper.props().visible).toBe(false)

    await wrapper.setProps({ visible: true })
    expect(wrapper.props().visible).toBe(true)

    await wrapper.setProps({ visible: false })
    expect(wrapper.props().visible).toBe(false)
  })

  it('layerId should be computed correctly', async () => {
    expect(wrapper.vm.layerId).toBe('gridLayer')

    await wrapper.setProps({ layerId: 'testLayer' })
    expect(wrapper.vm.layerId).toBe('testLayer')
  })
})
