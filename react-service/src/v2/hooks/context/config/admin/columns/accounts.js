const columns = [
  {
    alignHeader: 'left',
    alignColumns: 'left',
    key: 'company',
    sortMethod: 'text',
    width: 30,
  },
  {
    alignHeader: 'left',
    alignColumns: 'left',
    key: 'subscription',
    sortMethod: 'text',
    width: 20,
  },
  {
    alignHeader: 'left',
    alignColumns: 'left',
    key: 'first_pqq_sent',
    type: 'text',
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
    width: 20,
  },
  {
    alignHeader: 'left',
    alignColumns: 'left',
    sortMethod: 'text',
    key: 'status',
    type: 'text',
    width: 20,
  },
];

export default columns;
