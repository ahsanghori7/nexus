import i18next from 'v2/helpers/i18n';

const columns = [
  {
    alignHeader: 'left',
    alignColumns: 'left',
    label: i18next.t('number_logins'),
    key: 'total',
    sortMethod: 'text',
    width: 30,
  },
  {
    alignHeader: 'left',
    alignColumns: 'left',
    label: i18next.t('last_login'),
    key: 'last_login',
    sortMethod: 'text',
    width: 35,
  },
  {
    alignHeader: 'left',
    alignColumns: 'left',
    label: i18next.t('number_logins_month'),
    key: 'last_month',
    sortMethod: 'text',
    width: 35,
  },
];

export default columns;
