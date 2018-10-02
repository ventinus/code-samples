# React

Some awesome React components, fully tested

## Filterable

At its heart, filters and sorts data. It expects 2 children, the first is treated as the form for interacting with the filters/sorters. Props injected to that child are:
  * `filters`: All available filters
  * `filterState`: Current state of filters
  * `onFilterChange`: Callback for when a filter is changed
  * `sorters`: All available sorters
  * `sorterState`: Current state of sorters
  * `onSorterChange`: Callback for when a sorter is changed
  * `applyChanges`: Function to trigger rerender of data after changes (useful to be making filter changes without repeat offenses in the UI and limit to one change at the end)

The second expected child of `Filterable` is where all of the filtered and sorted data gets passed with `data` as the only injected prop.

Accepted props to `Filterable`:
  * `data` (Array): The array of data to filter/sort. (Required)
  * `filterGroups` (Object): On object containing information about how each filter should behave. See example. (Required)
  Can have two keys (at least one is required):
    * `state`: The initial state of the filters to be applied on first render
    * `set`: The complete set of options for that filter
  * `sorters` (Array): An array of strings representing keys of the data to sort by, formatted like `'key:dir'` or just `'key'` with ascending as the default. See example. (Optional)

### Filterable Example

```jsx
const movies = [
  {
    id: 1,
    title: 'Movie Title',
    date: new Date(Date.UTC(2015, 1, 1)),
    isFree: false,
    tags: ['adventure', 'thriller'],
  },
  ...
]

<Filterable
  data={movies}
  filterGroups={{
    tags: {
      state: [],
      set: ['adventure', 'thriller', 'mystery', 'drama']
    },
    isFree: {state: false},
  }}
  sorters={['natural', 'title' ,'date']}
>
  <FiltersForm />
  <FilteredBody />
</Filterable>
```


## Infinite Scroll

A scroll-triggered component for dynamically rendering paginated data.

Accepted props to `InfiniteScroll`:
  * `data` (Array): The data to paginate (Required)
  * `skip` (Int): Amount to show before pagination starts. Default is 0
  * `paginate` (Int): Amount to paginate by. Default is 6
  * `defaultPagination` (Int): Default page to start pagination. Default is 1
  * `dataComparator` (Func): A function with two arguments, `prevData` and `nextData`, to check for any custom changes to the data

### InfiniteScroll Example

```jsx
const dataChanged = (prevData, nextData) => {
  return prevData.length !== nextData.length || !prevData.every((item, i) => item === nextData[i])
}

<InfiniteScroll skip={4} dataComparator={dataChanged}>
  <DataBody />
</InfiniteScroll>
```
