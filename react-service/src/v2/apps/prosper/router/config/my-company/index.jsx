import React from 'react';
import Prosper from 'v2/apps/prosper/pages';
import MyCompany from 'v2/apps/prosper/pages/company';
import i18next from 'v2/helpers/i18n';
import prequal from './prequal';

const config = {
  id: 8,
  path: 'my-company',
  element: (
    <Prosper title={i18next.t('profile')}>
      <MyCompany />
    </Prosper>
  ),
  filter: [],
  filterCountry: [],
  label: i18next.t('my-company'),
  routes: [
    {
      id: 9,
      path: 'profile',
      element: (
        <Prosper title={i18next.t('profile')}>
          <MyCompany />
        </Prosper>
      ),
      filter: [],
      filterCountry: [],
      label: i18next.t('profile'),
    },
    {
      id: 25,
      path: 'profile/:parameter',
      element: (
        <Prosper title={i18next.t('profile')}>
          <MyCompany />
        </Prosper>
      ),
      filter: [],
      filterCountry: [],
    },
    prequal,
  ],
  redirects: [],
};

export default config;
