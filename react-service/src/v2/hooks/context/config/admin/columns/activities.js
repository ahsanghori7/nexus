import i18next from 'v2/helpers/i18n';

const columns = [
  {
    alignHeader: 'left',
    alignColumns: 'left',
    format: 'DD/MM/YYYY',
    key: 'last_activity',
    label: i18next.t('last-activity'),
    type: 'date',
    sortMethod: 'date',
    width: 15,
  },
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
    format: 'DD/MM/YYYY',
    key: 'interest_registered',
    label: i18next.t('interest_registered_date'),
    type: 'date',
    sortMethod: 'date',
    width: 20,
  },
  {
    alignHeader: 'left',
    alignColumns: 'left',
    format: 'DD/MM/YYYY',
    key: 'enquiry_recieved',
    label: i18next.t('tender_received'),
    type: 'date',
    sortMethod: 'date',
    width: 15,
  },
  {
    alignHeader: 'left',
    alignColumns: 'left',
    format: 'DD/MM/YYYY',
    key: 'quotes_uploaded',
    label: i18next.t('quote_uploaded'),
    type: 'date',
    sortMethod: 'date',
    width: 15,
  },
  {
    alignHeader: 'left',
    alignColumns: 'left',
    key: 'packaged_awarded_status',
    label: i18next.t('success'),
    sortMethod: 'text',
    width: 15,
  },
];

export default columns;
