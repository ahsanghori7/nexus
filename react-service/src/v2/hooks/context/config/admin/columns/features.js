import i18n from 'v2/helpers/i18n';

const columns = [
  {
    alignHeader: 'left',
    alignColumns: 'left',
    key: 'account',
    label: i18n.t('account'),
    sortMethod: 'text',
    width: 30,
  },
  {
    alignHeader: 'left',
    alignColumns: 'left',
    key: 'features',
    label: i18n.t('features'),
    sortMethod: 'text',
    width: 60,
  },
];

export default columns;
