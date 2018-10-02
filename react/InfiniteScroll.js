// ==========================================================================
//
// Infinite Scroll
//
// ==========================================================================
import React, {Component} from 'react'
import PropTypes from 'prop-types'
import imagesLoaded from 'imagesloaded'

// custom lib
import checkpoint from 'checkpoint'

export default class InfiniteScroll extends Component {
  static propTypes = {
    skip: PropTypes.number,
    paginate: PropTypes.number,
    defaultPagination: PropTypes.number,
    data: PropTypes.array,
    dataComparator: PropTypes.func
  }

  static defaultProps = {
    // how many to start paginating after
    skip: 0,
    // amount to paginate by
    paginate: 6,
    defaultPagination: 1,
    data: [],
    dataComparator: null
  }

  constructor(props) {
    super(props)

    this.state = this._defaultState(props)

    this._refs = {}
    this._checkpoint = checkpoint()
  }

  componentDidMount() {
    this._checkpoint.init()

    if (!this._allDataRendered()) {
      imagesLoaded(this._refs.container, () => {
        if (!this._refs.container) return

        this._checkpoint.addCheckpoint({
          element: this._refs.container,
          trigger: 'bottom',
          offset: 1.1,
          handler: this._loadMore
        })

        this.setState({paginatedHeight: this._refs.container.offsetHeight})
      })
    }
  }



  componentWillReceiveProps(nextProps) {
    // check if values have changed as well as checking custom dataComparator from props
    if (!this._propsChanged(nextProps) && (this.props.dataComparator && !this.props.dataComparator(this.props.data, nextProps.data))) {
      return
    }

    // refresh the checkpoint to have correct trigger point
    this.setState(this._defaultState(nextProps), () => {
      if (this._checkpoint) this._checkpoint.refresh(true)
    })
  }

  componentWillUnmount() {
    this._checkpoint.destroy()
  }

  render() {
    return (
      <div
        className="paginated"
        ref={node => this._refs.container = node}
        style={{height: this.state.paginatedHeight}}
      >
        <div ref={node => this._refs.containerInner = node}>
          {React.cloneElement(this.props.children, {
            data: this.state.paginatedData,
            skip: this.props.skip
          })}
        </div>
      </div>
    )
  }

  /**
   * Helper for checking if props have changed
   *
   * @param  {Object} nextProps The next prop values
   * @return {Boolean}          Tells whether any of the watched keys have changed value
   */
  _propsChanged = nextProps => {
    return !['skip','paginate','defaultPagination'].map(k => this.props[k] === nextProps[k]).every(v => v)
  }

  /**
   * Paginates the data from props with currentPagination value
   *
   * @param  {Integer} currentPagination Represents the current page
   * @param  {Object}  props             Values from props that are subject to change
   * @return {Array}                     The paginated data
   */
  _applyPagination = (currentPagination, props = this.props) => {
    const {paginate, skip, data} = props
    if (paginate <= 0) return data

    return [
      ...data.slice(0, skip),
      ...data.slice(skip, skip + (paginate * currentPagination))
    ]
  }

  /**
   * Increases the currentPagination state by one
   *
   * @param  {Object} prevState Value of state
   */
  _incrementPagination = prevState => ({currentPagination: prevState.currentPagination + 1})

  /**
   * Loads the next pagination of data if the scroll direction is down
   *
   * @param  {String} direction The direction of scroll, either 'up' or 'down'
   */
  _loadMore = direction => {
    if (direction !== 'down' || this.state.changing || this._allDataRendered()) return

    this.setState({changing: true})
    this.setState(this._incrementPagination)
    this.setState(({currentPagination}) => ({paginatedData: this._applyPagination(currentPagination)}))

    const paginatedHeight = this._refs.containerInner.offsetHeight

    Velocity(this._refs.container,
      {height: paginatedHeight},
      {
        duration: 850,
        complete: () => {
          this.setState({paginatedHeight})
          this._checkpoint.refresh()
          this.setState({changing: false})
        }
      }
    )
  }

  /**
   * Check to determine if all data has been rendered to prevent subsequent `_loadMore` triggers
   *
   * @return {Boolean}
   */
  _allDataRendered = () => this.props.data.length === this.state.paginatedData.length

  /**
   * Useful for resetting state as data can change
   *
   * @param  {Object} props The next value for props
   * @return {Object}       The next state
   */
  _defaultState = props => ({
    paginatedData: this._applyPagination(props.defaultPagination, props),
    currentPagination: props.defaultPagination,
    changing: false,
    paginatedHeight: 'auto'
  })
}
