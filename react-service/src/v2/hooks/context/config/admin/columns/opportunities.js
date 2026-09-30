import i18next from 'v2/helpers/i18n';

const columns = [
  {
    alignHeader: 'left',
    alignColumns: 'left',
    key: 'project_package',
    label: `${i18next.t('projects-table-column-project')}/${i18next.t(
      'prosper-label-package'
    )}`,
    sortMethod: 'text',
    width: 25,
  },
  {
    alignHeader: 'left',
    alignColumns: 'left',
    key: 'main_contractor',
    label: i18next.t('c_link_user'),
    sortMethod: 'text',
    width: 20,
  },
  {
    alignHeader: 'left',
    alignColumns: 'left',
    format: 'DD/MM/YYYY',
    key: 'tender_return',
    label: i18next.t('tender_return_date'),
    type: 'date',
    sortMethod: 'date',
    width: 15,
  },
  {
    alignHeader: 'left',
    alignColumns: 'left',
    format: 'DD/MM/YYYY',
    key: 'start_on_site',
    label: i18next.t('start_on_site'),
    type: 'date',
    sortMethod: 'date',
    width: 15,
  },
  {
    alignHeader: 'left',
    alignColumns: 'left',
    key: 'current_interest',
    label: i18next.t('current_interest'),
    sortMethod: 'number',
    width: 15,
  },
];

export default columns;
