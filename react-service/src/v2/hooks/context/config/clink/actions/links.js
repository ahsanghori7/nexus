import i18next from 'v2/helpers/i18n';

const planMyProjectActions = (base) => {
  const [, slug = ''] = /project\/([^/]+)\//.exec(base) || [];
  const setupBase = `/main-contractor/projects/${slug}/setup`;

  return [
    { id: 1, link: setupBase, label: i18next.t('project-overview') },
    {
      id: 2,
      link: `${setupBase}/project_team`,
      label: i18next.t('project-team'),
    },
    {
      id: 3,
      link: `${setupBase}/scope_details`,
      label: i18next.t('scope-and-details'),
    },
    {
      id: 4,
      link: `${setupBase}/reference_files`,
      label: i18next.t('reference-files'),
    },
    {
      id: 5,
      link: `${setupBase}/work_packages`,
      label: i18next.t('work-packages'),
    },
  ];
};

const procurementToolsActions = (base) => [
  {
    id: 1,
    link: `${base}procurement_schedule`,
    label: 'Procurement schedule',
  },
  { id: 2, link: `${base}issue_enquiry`, label: 'Enquiries issued' },
  { id: 3, link: `${base}quotes_tender`, label: 'Quotes & Tender analysis' },
];

const projectDocumentsActions = (base) => [
  { id: 1, link: `${base}tender_templates`, label: 'Tender templates' },
  {
    id: 2,
    link: `${base}orders`,
    label: 'Orders',
  },
  { id: 3, link: `${base}file_manager`, label: 'File manager' },
];

const projectManagement = (base) => [
  {
    id: 1,
    link: `${base}instructions_variations`,
    label: 'Instructions Variations',
  },
  { id: 2, link: `${base}ncr`, label: 'ncr' },
  { id: 3, link: `${base}forecast_final`, label: 'forecast-final' },
  { id: 4, link: `${base}form_instruction`, label: 'add-new-instructions' },
];

export {
  planMyProjectActions,
  procurementToolsActions,
  projectDocumentsActions,
  projectManagement,
};
