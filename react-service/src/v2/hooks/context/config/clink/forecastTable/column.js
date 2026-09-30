const columns = [
  {
    alignHeader: 'left',
    alignColumns: 'left',
    key: 'package',
    label: 'Package',
    sortMethod: 'number',
    width: 30,
  },
  {
    alignHeader: 'left',
    alignColumns: 'right',
    key: 'budget',
    label: 'Budget',
    width: 14,
  },
  {
    alignHeader: 'left',
    alignColumns: 'right',
    key: 'order',
    label: 'Order Value',
    sortMethod: 'text',
    width: 14,
  },
  {
    alignHeader: 'left',
    alignColumns: 'right',
    key: 'variations',
    label: 'Variations',
    width: 14,
  },
  {
    alignHeader: 'left',
    alignColumns: 'right',
    key: 'omissions',
    label: 'Omissions',
    width: 14,
  },

  {
    alignHeader: 'left',
    alignColumns: 'right',
    key: 'total',
    label: 'Total Value',
    width: 14,
  },
];

export default columns;
