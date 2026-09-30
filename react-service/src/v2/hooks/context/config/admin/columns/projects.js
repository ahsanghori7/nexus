const columns = [
  {
    alignHeader: 'left',
    alignColumns: 'left',
    key: 'project',
    sortMethod: 'text',
    width: 15,
  },
  {
    alignHeader: 'left',
    alignColumns: 'left',
    key: 'location',
    sortMethod: 'text',
    width: 15,
  },
  {
    key: 'unit-no',
    width: 10,
  },
  {
    alignHeader: 'left',
    alignColumns: 'left',
    key: 'created-by',
    sortMethod: 'text',
    width: 15,
  },
  {
    alignHeader: 'left',
    alignColumns: 'left',
    key: 'approx-cost',
    width: 10,
  },
  {
    alignHeader: 'left',
    alignColumns: 'left',
    key: 'gia',
    sortMethod: 'number',
    width: 10,
  },
  {
    alignHeader: 'left',
    alignColumns: 'left',
    format: 'DD MMMM YYYY',
    key: 'published-date',
    sortMethod: 'date',
    type: 'date',
    width: 15,
  },
];

export default columns;
