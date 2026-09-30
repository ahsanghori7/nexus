import i18next from 'v2/helpers/i18n';

const columns = [
  {
    alignHeader: 'left',
    alignColumns: 'left',
    label: i18next.t('c_link_user'),
    key: 'name',
    sortMethod: 'text',
    width: 100,
  },
];

export default columns;
