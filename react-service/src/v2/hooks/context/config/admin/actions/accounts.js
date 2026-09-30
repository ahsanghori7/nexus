import i18next from 'v2/helpers/i18n';

const accountsActions = [
  {
    id: 1,
    align: 'left',
    text: i18next.t('change-subscription'),
    children: [
      { id: 4, name: i18next.t('essential') },
      { id: 2, name: i18next.t('network') },
      { id: 7, name: i18next.t('comprehensive') },
      { id: 14, name: i18next.t('cancelled') },
    ],
  },
  {
    id: 2,
    align: 'left',
    text: i18next.t('enable-disable'),
  },
  {
    id: 3,
    align: 'left',
    text: i18next.t('view-account-details'),
  },
  {
    id: 4,
    align: 'left',
    text: i18next.t('exempt-initial-pqq'),
  },
  {
    id: 5,
    align: 'left',
    text: i18next.t('add-to-supply-chain'),
  }
];

export default accountsActions;
