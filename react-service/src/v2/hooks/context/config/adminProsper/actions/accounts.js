import i18next from 'v2/helpers/i18n';

const contractorsActions = [
  {
    id: 1,
    align: 'right',
    text: i18next.t('change-subscription'),
    children: [
      { id: 11, name: 'Flexi' },
      { id: 13, name: 'National' },
      { id: 12, name: 'Regional' },
      { id: 10, name: 'Comission' },
      { id: 8, name: 'Yearly' },
    ],
  },
  { id: 2, text: i18next.t('view-or-edit') },
];
export default contractorsActions;
