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

Accepted props:
  * `data`: The array of data to filter/sort. (Required)
  * `filterGroups`: On object containing information about how each filter should behave. See Examples. (Required)
  Can have two keys (at least one is required):
    * `state`: The initial state of the filters to be applied on first render
    * `set`: The complete set of options for that filter
  * `sorters`: An array of strings representing keys of the data to sort by, formatted like `'key:dir' or just `'key'` with ascending as the default. See Examples. (Optional)

### Filterable Examples

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
