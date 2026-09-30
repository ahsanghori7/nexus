import i18next from 'v2/helpers/i18n';

const columns = [
  {
    alignHeader: 'left',
    alignColumns: 'left',
    label: i18next.t('project'),
    key: 'name',
    sortMethod: 'text',
    width: 19,
  },
  {
    alignHeader: 'left',
    alignColumns: 'left',
    label: i18next.t('package'),
    key: 'tender',
    sortMethod: 'text',
    width: 19,
  },
  {
    alignHeader: 'left',
    alignColumns: 'left',
    label: i18next.t('c_link_user'),
    key: 'contractor',
    sortMethod: 'text',
    width: 19,
  },
  {
    alignHeader: 'left',
    alignColumns: 'left',
    label: i18next.t('subcontractor'),
    key: 'subcontractor',
    sortMethod: 'text',
    width: 19,
  },
  {
    alignHeader: 'left',
    alignColumns: 'left',
    label: i18next.t('type'),
    key: 'type',
    sortMethod: 'text',
    width: 12,
  },
  {
    alignHeader: 'left',
    alignColumns: 'left',
    label: i18next.t('date'),
    format: 'DD MMMM YYYY',
    key: 'date',
    type: 'date',
    sortMethod: 'date',
    width: 12,
  },
];

export default columns;
