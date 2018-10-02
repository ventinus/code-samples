import React, {PureComponent} from 'react'
import PropTypes from 'prop-types'
import {map, includes, without, reduce, get, intersection} from 'lodash'
import * as R from 'ramda'

// custom helpers
import {hasPresence, isBool} from 'helpers'

export default class Filterable extends PureComponent {
  static propTypes = {
    data: PropTypes.array.isRequired,
    filterGroups: PropTypes.object.isRequired,
    sorters: PropTypes.array,
  }

  static defaultProps = {
    sorters: ['natural'],
  }

  constructor(props) {
    super(props)

    // get the 'state' values from props.filterGroups
    const stateFilters = this._extractFilterGroups('state', props.filterGroups)

    // set default sorter
    const sorter = this.props.sorters[0]

    // pre-filter data based on initial state from filterGroups
    const filteredData = this._filterData(stateFilters)

    // private key for detecting internally if filters have changed
    this._filterChanged = false

    // private key for storing newly filtered data until a render is triggered
    this._dataCache = filteredData

    // private key to store all the possible filter options
    this._filters = this._extractFilterGroups('set', props.filterGroups)

    this.state = {
      sorter,
      filters: stateFilters,
      renderedData: this._sortData(sorter),
      resultsVisible: true
    }
  }

  // This logic is needed to prevent re-renders as a result of site navigation
  shouldComponentUpdate(nextProps, nextState) {
    const {filters, renderedData, sorter, resultsVisible} = this.state
    const changed = this._filterChanged
    this._filterChanged = false

    return changed
      || renderedData.length !== nextState.renderedData.length
      || sorter !== nextState.sorter
      || resultsVisible !== nextState.resultsVisible
  }

  render() {
    const {children} = this.props

    return (
      <div className="filterable-group">
        {React.cloneElement(children[0], {
          filters: this._filters,
          filterState: this.state.filters,
          onFilterChange: this._onFilterChange,
          sorters: this.props.sorters,
          sorterState: this.state.sorter,
          onSorterChange: this._onSortChange,
          applyChanges: this._applyCurrentState
        })}
        <div className={`filterable__results${this.state.resultsVisible ? ' is-visible' : ''}`}>
          {React.cloneElement(children[1], {
            data: this.state.renderedData
          })}
        </div>
      </div>
    )
  }

  /**
   * grabs the values from all the filterGroups based on the key provided
   * with the possibility to extend with more defaults
   *
   * @param  {String} key          either 'set' or 'state', corresponding to keys in filterGroups
   * @param  {Object} filterGroups from props, contains set/state defining filter behavior
   * @return {Object}              All allocated values from the key
   */
  _extractFilterGroups = (key, filterGroups) => {
    return reduce(filterGroups, (a, c, k) => {
      let val = c[key]

      // set default values for sets based of state type
      if (key === 'set' && !c.hasOwnProperty(key)) {
        if (isBool(c.state)) {
          val = [false, true]
        }
      }

      return {
        ...a,
        [k]: val
      }
    }, {})
  }

  /**
   * Tracks changes to filters, updating the filtered data
   *
   * @param  {String}   key           The name of the changed filter
   * @param  {String}   changedFilter The specific filter changed, applicable when filter is an array of options
   * @param  {Boolean}  immediate     Triggers a rerender immediately following filter change
   */
  _onFilterChange = (key, changedFilter, immediate = false) => () => {
    const current = this.state.filters[key]
    let nextValue

    if (isBool(current)) {
      nextValue = !current
    } else if (Array.isArray(current)) {
      nextValue = includes(current, changedFilter)
        ? without(current, changedFilter)
        : current.concat(changedFilter)
    }

    this._filterChanged = true

    this.setState({
      ...this.state,
      filters: {
        ...this.state.filters,
        [key]: nextValue
      }
    }, () => {
      this._dataCache = this._filterData(this.state.filters)
      if (immediate) this._applyCurrentState()
    })
  }

  /**
   * Handles filtering the data, first checking if matchers were provided and uses defaults based on data type
   *
   * @param  {Object} stateFilters The state of the filters
   * @return {Array}               Filtered Data
   */
  _filterData = stateFilters => {
    const filterFns = map(stateFilters, (val, key) => {
      const matcher = this._determineMatcher(key)
      const value = stateFilters[key]
      return matcher(value, key)
    })

    const filter = R.allPass(filterFns)
    return this.props.data.filter(filter)
  }

  /**
   * Handles sorting the data
   * 'natural' does not change the order
   *
   * @param  {String} sorter Formatted 'key:dir' where 'key' is the name of the filter and 'dir' determines ascending or descending
   * @return {Array}         Sorted data
   */
  _sortData = sorter => {
    if (sorter === 'natural') return this._dataCache

    const [key, dir] = sorter.split(':')
    const orderMethod = dir === 'desc' ? R.descend : R.ascend
    const sortFn = R.sortWith([orderMethod(R.compose(this._neutralize(key), R.prop(key)))])

    return sortFn(this._dataCache)
  }

  /**
   * Since data values can have different formatting i.e. 'The Title of an Article', coerce the data to be similar
   * for more accurate sorting
   *
   * @param  {String}   key The field from a data record to check type and neutralize
   * @return {Function}     Handles formatting the data for consistent behavior
   */
  _neutralize = key => {
    switch (typeof this.props.data[0][key]) {
      case 'string':
        return R.toLower
      default:
        return (inp) => inp
    }
  }

  /**
   * Finds the best filter matching function for the filter found by the provided key
   * First checks if one was provided through props and has fallbacks based on data type
   *
   * @param  {String}   key The name of the filter
   * @return {Function}     Function for desired filter
   */
  _determineMatcher = key => {
    const filter = this.props.filterGroups[key]
    const matcher = get(filter, 'matcher')
    if (matcher) return matcher

    if (Array.isArray(filter.state)) {
      return this._defaultArrayMatcher
    } else if (isBool(filter.state)) {
      return this._defaultBoolMatcher
    }
  }

  /**
   * Tracks changes to sorting, triggers immediate re-render
   *
   * @param  {String} nextSorter Next sorting value
   */
  _onSortChange = nextSorter => {
    this.setState({sorter: nextSorter}, this._applyCurrentState)
  }

  /**
   * Applies all current values in state, triggering a render
   */
  _applyCurrentState = () => {
    this.setState({resultsVisible: false})
    // allow time for hide animation to complete
    setTimeout(() => {
      this.setState(({sorter}) => ({renderedData: this._sortData(sorter)}))
      this.setState({resultsVisible: true})
    }, 500)
  }

  /**
   * If val is true, checks if the item also has a true value
   *
   * @param  {Boolean}   val The boolean value to check against
   * @param  {String}    key The key to access each item value
   * @return {Function}      Accepts item as an argument for value checking, returning a boolean after final check performed
   */
  _defaultBoolMatcher = (val, key) => item => !val || item[key]

  /**
   * If there are selections, checks if the items value intersects with the selections
   * otherwise all are returned if no selections are present
   *
   * @param  {Array}  selections Values to check if item has any of
   * @param  {String} key        The key to access each item value
   * @return {Function}          Accepts item as an argument for value checking, returning a boolean after final check performed
   */
  _defaultArrayMatcher = (selections, key) => item => !hasPresence(selections) || hasPresence(intersection(item[key], selections))
}
