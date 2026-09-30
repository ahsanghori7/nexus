// TODO: set labels with --> label: i18next.t('c_link_user'),

const columns = [
  {
    alignHeader: 'left',
    alignColumns: 'left',
    key: 'account',
    label: 'Account',
    sortMethod: 'text',
    width: 15,
  },
  {
    alignHeader: 'left',
    alignColumns: 'left',
    key: 'projects',
    label: '# of new Projects',
    sortMethod: 'number',
    width: 15,
  },
  {
    alignHeader: 'left',
    alignColumns: 'left',
    key: 'users',
    label: '# of users',
    sortMethod: 'number',
    width: 10,
  },
  {
    alignHeader: 'left',
    alignColumns: 'left',
    key: 'monthly_users',
    label: 'Monthly Active Users',
    sortMethod: 'number',
    width: 15,
  },
  {
    alignHeader: 'left',
    alignColumns: 'left',
    key: 'tender',
    label: 'Created a Tender',
    sortMethod: 'text',
    width: 15,
  },
  {
    alignHeader: 'left',
    alignColumns: 'left',
    key: 'issued',
    label: 'Issued a Contract',
    sortMethod: 'text',
    width: 15,
  },
  {
    alignHeader: 'left',
    alignColumns: 'left',
    key: 'budget',
    label: 'Uploaded a Budget',
    sortMethod: 'text',
    width: 15,
  },
];

export default columns;
