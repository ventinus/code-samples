# Vanilla JavaScript

These had real-life applications.

## [Checkpoint](https://github.com/ventinus/code-samples/blob/master/javascript/checkpoint.js)

A performant browser lib, similar to [Waypoints](http://imakewebthings.com/waypoints/), with a simple interface and highly customizable triggers. No arguments needed when creating the main `checkpoint` instance. Available methods upon creation include:

  * `init` (Func): Kicks off the module with measurement caching and event handler adding
  * `enable` (Func): Adds the resize and scroll event handlers
  * `disable` (Func): Removes the resize and scroll event handlers
  * `destroy` (Func): Leads with `disable` and null out all values in local objects. Only run when current instance will never be needed again.
  * `addCheckpoint` (Func): Creates and returns a checkpoint with the following available options:
    * `element` (DOM Node): The element to measure against. (Required)
    * `trigger` (String): Which part of element gets triggered. One of `'top'`, `'center'`, `'bottom'`. Defaults to `'top'`
    * `offset` (Int || String): Number from 0..1 to trigger checkpoint within the viewport. `0` is the top, `1` is the bottom. Values outside of 0..1 will trigger offscreen. When passing a string indicating pixel offset, include `px` with the value. i.e. `{trigger: 'top', offset: '20px'}` will trigger when the top of the element is 20px from the top of the window. Defaults to `0.5`
    * `triggerOnce` (Boolean): When true, checkpoint is removed after first trigger. Defaults to `false`.
    * `handler` (Func): Callback executed when triggered with 2 arguments: `direction` and `element`. `direction` is either `'up'` or `'down'` based on direction of scroll. `element` is the element that was used for triggering the checkpoint
  * `removeCheckpoint` (Func): Passing a previously created checkpoint, can remove the checkpoint from being calculated
  * `refresh` (Func): Refreshes measurements of window, body, and all scroll trigger points
  * `doneEntering` (Func): Tells checkpoint all asynchronous or dynamically added scrollPoints have been added. The only change this makes is checkpoint will disable itself when there are no more scrollPoints to measure

### Checkpoint Example

```js
import checkpoint from 'checkpoint'
const ckPoint = checkpoint()

...

ckPoint.init()

const scrollPoints = Array.from(document.querySelectorAll('.js-checkpoint-trigger')).map(element => {
  return ckPoint.addCheckpoint({
    element,
    trigger: 'bottom', // or 'top' or 'center'
    offset: 1.1, // slightly below the viewport
    handler: trigger
  })
})

function trigger(dir, element) {
  console.log(`I was hit scrolling ${dir}`, element)
}

...

scrollPoints.forEach(point => ckPoint.removeCheckpoint(point))

...

ckPoint.destroy()
```
