const columns = [
  {
    alignHeader: 'left',
    alignColumns: 'left',
    key: 'action_type',
    sortMethod: 'text',
    width: 30,
  },
  {
    alignHeader: 'left',
    alignColumns: 'left',
    key: 'description',
    sortMethod: 'text',
    width: 20,
  },
  {
    alignHeader: 'left',
    alignColumns: 'left',
    format: 'DD MMMM YYYY',
    key: 'action_date',
    type: 'date',
    sortMethod: 'date',
    width: 20,
  },
];

export default columns;
