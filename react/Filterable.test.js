import {shallow} from 'enzyme'
import * as R from 'ramda'
import Filterable from './Filterable'

const seedFactory = (id, title, date, isFree, tags) => ({id, title, date, isFree, tags})
const seed = [
  seedFactory(1, 'Something to name', new Date(Date.UTC(2015, 1, 1)), true, ['adventure', 'thriller', 'drama']),
  seedFactory(2, 'a time to speak', new Date(Date.UTC(2015, 2, 1)), false, ['adventure', 'thriller']),
  seedFactory(3, 'After the Sunset', new Date(Date.UTC(2015, 0, 1)), true, ['adventure', 'mystery'])
]

const props = (opts = {}) => ({
  data: seed,
  filterGroups: {
    tags: {
      state: opts.tagsState || [],
      set: ['adventure', 'thriller', 'mystery', 'drama'],
    },
    isFree: {
      state: opts.isFreeState || false
    }
  },
  sorters: opts.sorters || ['natural', 'title' ,'date']
})

const FilterComponent = opts => (
  <Filterable {...props(opts)}>
    <div id="filters">Filters</div>
    <div id="results">Results</div>
  </Filterable>
)

const idProp = R.prop('id')

test('renders Filterable component', () => {
  const tree = renderer.create(FilterComponent()).toJSON()
  expect(tree).toMatchSnapshot()
})

describe('filters data', () => {
  test('shows all data with no selected filters', () => {
    const component = shallow(FilterComponent())
    const results = component.find('#results')
    expect(results.props().data.length).toBe(3)
  })

  test('by boolean value', () => {
    const component = shallow(FilterComponent({isFreeState: true}))
    const {data} = component.find('#results').props()
    expect(data.length).toBe(2)
    expect(data.map(idProp)).toEqual([1, 3])
  })

  test('by array value', () => {
    const tagSets = [['thriller'], ['drama', 'mystery'], ['mystery']]
    const [data1, data2, data3] = tagSets.map(tags => {
      const component = shallow(FilterComponent({tagsState: tags}))
      return component.find('#results').props().data
    })

    expect(data1.length).toBe(2)
    expect(data1.map(idProp)).toEqual([1, 2])

    expect(data2.length).toBe(2)
    expect(data2.map(idProp)).toEqual([1, 3])

    expect(data3.length).toBe(1)
    expect(data3.map(idProp)).toEqual([3])
  })

  test('by combination of boolean and array value', () => {
    const component = shallow(FilterComponent({isFreeState: true, tagsState: ['thriller']}))
    const results = component.find('#results')
    const {data} = results.props()

    expect(data.length).toBe(1)
    expect(data[0].id).toBe(1)
  })
})

describe('sorts data', () => {
  test('by natural order', () => {
    const component = shallow(FilterComponent())
    const {data} = component.find('#results').props()
    expect(data.map(idProp)).toEqual([1,2,3])
  })

  test('by string value', () => {
    const sorterSets = [['title:asc'], ['title:desc']]
    const [ids1, ids2] = sorterSets.map(sorters => {
      const component = shallow(FilterComponent({sorters}))
      return component.find('#results').props().data.map(idProp)
    })

    expect(ids1).toEqual([2,3,1])
    expect(ids2).toEqual([1,3,2])
  })

  test('by date value', () => {
    const sorterSets = [['date:asc'], ['date:desc']]
    const [ids1, ids2] = sorterSets.map(sorters => {
      const component = shallow(FilterComponent({sorters}))
      return component.find('#results').props().data.map(idProp)
    })

    expect(ids1).toEqual([3,1,2])
    expect(ids2).toEqual([2,1,3])
  })
})
