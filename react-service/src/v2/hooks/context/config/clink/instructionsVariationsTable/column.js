const columns = [
  {
    alignHeader: 'left',
    alignColumns: 'left',
    key: 'instruction',
    label: 'Instruction NR  ',
    width: 10,
  },
  {
    type: 'date',
    format: 'DD MMMM YYYY',
    alignHeader: 'left',
    alignColumns: 'left',
    key: 'date',
    label: 'Date',
    width: 15,
  },
  {
    alignHeader: 'left',
    alignColumns: 'left',
    key: 'subcontractor',
    label: 'Subcontractor Name',
    width: 20,
  },
  {
    alignHeader: 'left',
    alignColumns: 'left',
    key: 'description',
    label: 'Description',
    width: 25,
  },
  {
    alignHeader: 'left',
    alignColumns: 'left',
    key: 'price',
    label: 'Total Value',
    width: 20,
  },
  {
    alignHeader: 'left',
    alignColumns: 'center',
    key: 'actions',
    label: 'Actions',
    width: 10,
  },
];

export default columns;
