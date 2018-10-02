import {shallow} from 'enzyme'
import InfiniteScroll from './InfiniteScroll'

const dataComparator = (prevData, nextData) => {
  return prevData.length !== nextData.length || !prevData.every((item, i) => item === nextData[i])
}

const props = (opts = {}) => ({
  dataComparator,
  data: [1,2,3,4,5,6,7,8,9,10],
  skip: 0,
  paginate: 2,
  defaultPagination: 1,
  ...opts,
})

const InfiniteComponent = opts => (
  <InfiniteScroll {...props(opts)}>
    <div id="results">
      <div>Results</div>
    </div>
  </InfiniteScroll>
)

test('dataComparator', () => {
  const tests = [
    [[1,2,3], [4,5,6]],
    [[1,2,3], [1,2,3]],
    [[1,2,3], [1,2]],
    [[1,2], [1,2,3]],
    [[1,2,3], [3,4,5]],
    [[1,2,3], [1,3,4,5]],
    [[1,1,2,3], [1,3,4,5]],
    [[1,1,2,3], [1,3,1,4,5]],
    [[1,2,3], [3,2,1]],
  ]
  const results = tests.map(([prevD, nextD]) => dataComparator(prevD, nextD))
  expect(results).toEqual([true, false, true, true, true, true, true, true, true])
})

const findResults = el => el.find('#results')
const resultsDataLength = el => findResults(el).prop('data').length

test('renders InfiniteScroll component', () => {
  const tree = renderer.create(InfiniteComponent()).toJSON()
  expect(tree).toMatchSnapshot()
})

describe('paginates', () => {
  test('with no skip', () => {
    const component = shallow(InfiniteComponent())
    expect(resultsDataLength(component)).toBe(2)

    component.setProps(props({defaultPagination: 2}))
    expect(resultsDataLength(component)).toBe(4)
  })

  test('with skip', () => {
    const component = shallow(InfiniteComponent({skip: 3}))
    expect(resultsDataLength(component)).toBe(5)

    component.setProps(props({skip: 3, defaultPagination: 2}))
    expect(resultsDataLength(component)).toBe(7)
  })
})

describe('stops paginating', () => {
  test('when all data present to start with', () => {
    const component = shallow(InfiniteComponent({paginate: 20}))
    expect(resultsDataLength(component)).toBe(10)
  })

  test('when all data present as a result of pagination', () => {
    const component = shallow(InfiniteComponent({paginate: 7}))
    expect(resultsDataLength(component)).toBe(7)

    component.setProps(props({paginate: 7, defaultPagination: 2}))
    expect(resultsDataLength(component)).toBe(10)
  })
})

test('resets pagination when new data provided', () => {
  const component = shallow(InfiniteComponent())
  component.setProps(props({defaultPagination: 2}))
  expect(resultsDataLength(component)).toBe(4)

  component.setProps(props({data: [5,6,7,8]}))
  expect(resultsDataLength(component)).toBe(2)
})
