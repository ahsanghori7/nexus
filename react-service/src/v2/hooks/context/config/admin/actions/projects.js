import i18next from 'v2/helpers/i18n';

const projectsActions = [
  {
    id: 2,
    align: 'right',
    text: i18next.t('change-status'),
    children: [
      { id: 4, name: i18next.t('publish') },
      { id: 2, name: i18next.t('pending') },
      { id: 7, name: i18next.t('private') },
      { id: 14, name: i18next.t('archived') },
    ],
  },
];
export default projectsActions;
