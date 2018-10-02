// ==================================================================================================
//
// Dependencies: lodash
// simple bare-bones waypoint-esque
// next steps:
//  allow offset prop in checkpoint to be a function? or allow way to build custom offset dynamically
//  add a way for multiple instances of checkpoint to collaborate to maintain only one scroll and resize event
// ==================================================================================================
import {throttle, debounce, forEach, reject} from 'lodash'

const checkpoint = () => {
  // event callbacks
  const cbs = {}

  const props = {
    isEnabled: false,
    windowHeight: 0,
    bodyHeight: 0,
    scrollPoints: [],
    currentScroll: 0,
    doneEntering: false,
  }

  const DEFAULT_CHECKPOINT_OPTIONS = {
    trigger: 'top',
    offset: 1,
    triggerOnce: false,
    handler(direction, element) {
      console.log('define handler. direction is', direction, element)
    }
  }

  const TRIGGER_METHODS_MAP = {
    top: offsetTopAtCustom,
    bottom: offsetBottomAtCustom,
    center: offsetCenterAtCustom
  }

  // kicks off checkpoint
  const init = () => {
    getMeasurements()
    enable()
  }

  // measures the window and body, caching them to props
  const getMeasurements = () => {
    props.windowHeight = getWindowHeight()
    props.bodyHeight = getBodyHeight()
  }

  // executed on scroll to check where scrollPoints are
  const onScroll = () => {
    if (!props.isEnabled) return
    props.currentScroll = window.pageYOffset
    checkScrollPoints()
  }

  // runs when window is resized to recalculate browser/body dimensions and refresh all checkpoints and to see if
  // any have moved considerably with respect to the viewport
  const onResize = () => {
    if (!props.isEnabled) return
    props.currentScroll = window.pageYOffset
    getMeasurements()
    refresh()
    checkScrollPoints()
  }

  // adds event handlers
  const enable = () => {
    if (props.isEnabled) return

    cbs.onResize = debounce(onResize, 300, false)
    cbs.onScroll = throttle(onScroll, 300)

    window.addEventListener('resize', cbs.onResize)
    window.addEventListener('scroll', cbs.onScroll)

    props.isEnabled = true
  }

  // removes added event handlers, allowing for easy re-enabling
  const disable = () => {
    if (!props.isEnabled) return

    // Remove your event handlers here
    window.removeEventListener('resize', cbs.onResize)
    window.removeEventListener('scroll', cbs.onScroll)

    props.isEnabled = false
  }

  // a complete teardown of checkpoint
  const destroy = () => {
    disable()

    // empty out objects in outer scope
    ;[cbs, props, DEFAULT_CHECKPOINT_OPTIONS, TRIGGER_METHODS_MAP].forEach(obj => {
      for (let key in obj) {
        if (obj.hasOwnProperty(key)) {
          obj[key] = null
        }
      }
    })
  }

  // cross-browser way for getting window height
  function getWindowHeight() { return window.innerHeight || document.documentElement.clientHeight }

  // cross-browser way for getting document.body height
  function getBodyHeight() {
    const {body, documentElement} = document

    return Math.max(body.scrollHeight, body.offsetHeight, documentElement.clientHeight,
        documentElement.scrollHeight, documentElement.offsetHeight)
  }

  // loop through scrollPoints to see if any have changed with respect to the viewport
  const checkScrollPoints = function() {
    const { scrollPoints } = props

    scrollPoints.forEach(point => {
      if (props.currentScroll >= point.value && !point.hasPassed) {
        point.handler('down', point.element)
        point.hasPassed = true
        if (point.triggerOnce) removeCheckpoint(point)
      } else if (props.currentScroll <= point.value && point.hasPassed) {
        point.handler('up', point.element)
        point.hasPassed = false
      }
    })
  }

  // creates and adds the new scrollPoint(s) to props.scrollPoints
  // returns the individual or set of added scrollpoints
  const addCheckpoint = options => {
    if (!options.element) {
      throw new Error('element key is missing from addCheckpoint options')
    }

    const fullOptions = {
      ...DEFAULT_CHECKPOINT_OPTIONS,
      ...options
    }

    if (!TRIGGER_METHODS_MAP.hasOwnProperty(fullOptions.trigger)) {
      console.log('trigger value in addCheckpoint options is invalid. defaulting to top')
      fullOptions.trigger = 'top'
    }

    props.currentScroll = window.pageYOffset

    if (options.element.length) {
      return map(options.element, el => {
        pushScrollPoint(genCheckpoint(el, fullOptions))
      })
    } else {
      return pushScrollPoint(genCheckpoint(fullOptions.element, fullOptions))
    }
  }

  // adds the new checkpoint to scrollPoints
  const pushScrollPoint = newPoint => {
    // filter to remove nulls
    props.scrollPoints = [...props.scrollPoints, newPoint].filter(p => p)
    return newPoint
  }

  const genCheckpoint = (element, options) => {
    const {top, height} = element.getBoundingClientRect()
    const method = TRIGGER_METHODS_MAP[options.trigger]
    const value = method(element, options.offset, top, height)
    const hasPassed = props.currentScroll >= value

    if (hasPassed) {
      options.handler('down', element)
      if (options.triggerOnce) return null
    }

    return {
      method,
      value,
      hasPassed,
      element: element,
      offset: options.offset,
      handler: options.handler,
      triggerOnce: options.triggerOnce
    }
  }

  const removeCheckpoint = ({element}) => {
    props.scrollPoints = reject(props.scrollPoints, p => p.element === element)
    if (props.scrollPoints.length <= 0 && props.doneEntering) {
      disable()
    }
  }

  const recalcCheckpoints = () => {
    return props.scrollPoints.map(point => {
      const {top, height} = point.element.getBoundingClientRect()
      return {
        ...point,
        value: point.method(point.element, point.offset, top, height)
      }
    })
  }

  const refresh = () => {
    props.scrollPoints = recalcCheckpoints()
  }

  // Utility Functions
  // _____________________________________________________________

  // Takes a string input representing a pixel value, e.g. '20px' or '-20px'
  // and coerces it into a number, integer or float
  const coercePxToNum = pixels => +pixels.match(/-?\d*[^px]/)[0]

  // Takes either a number from 0 through 1 that represents a percentage
  // or a string representing a pixel value, e.g. '20px' or '-20px'
  const convertOffset = offset => {
    return typeof offset === 'string' ? props.windowHeight - coercePxToNum(offset) : props.windowHeight * offset
  }

  // Makes sure the number is within the page bounds.
  // Returns outer number closest to input if it falls outside
  const numWithinPageBounds = num => Math.min(Math.max(0, num), props.bodyHeight)

  const checkFixedScroll = element => element.getAttribute('checkpoint-fixed') ? 0 : props.currentScroll

  // Functions for setting where element in window is triggered
  // _____________________________________________________________

  // Top of element is at custom point of page (Number between 0 and 1. 0 is at top, 1 is at bottom)
  function offsetTopAtCustom(element, offset, top) {
    return numWithinPageBounds(top - convertOffset(offset) + checkFixedScroll(element))
  }

  // Bottom of element is at custom point of page (Number between 0 and 1. 0 is at top, 1 is at bottom)
  function offsetBottomAtCustom(element, offset, top, height) {
    return numWithinPageBounds(top + height - convertOffset(offset) + checkFixedScroll(element))
  }

  // Center of element is at custom point of page (Number between 0 and 1. 0 is at top, 1 is at bottom)
  function offsetCenterAtCustom(element, offset, top, height) {
    return numWithinPageBounds(top + (height / 2) - convertOffset(offset) + checkFixedScroll(element))
  }

  const doneEntering = () => props.doneEntering = true

  // exposed API
  return {
    init,
    enable,
    disable,
    destroy,
    addCheckpoint,
    removeCheckpoint,
    refresh,
    doneEntering
  }
}

export default checkpoint
