const columns = [
  {
    alignHeader: 'left',
    alignColumns: 'left',
    key: 'company',
    sortMethod: 'text',
    width: 15,
  },
  {
    alignHeader: 'left',
    alignColumns: 'left',
    key: 'user',
    sortMethod: 'text',
    width: 15,
  },
  {
    alignHeader: 'left',
    alignColumns: 'left',
    key: 'prequalification',
    width: 15,
  },
  {
    alignHeader: 'left',
    alignColumns: 'left',
    key: 'subscription',
    sortMethod: 'text',
    width: 15,
  },
  {
    alignHeader: 'left',
    alignColumns: 'left',
    format: 'DD MMMM YYYY',
    key: 'registration-date',
    type: 'date',
    sortMethod: 'date',
    width: 15,
  },
];

export default columns;
