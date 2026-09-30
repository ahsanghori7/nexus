import React from 'react';
import Prosper from 'v2/apps/prosper/pages';
import ChangerPassword from 'v2/apps/prosper/pages/change-password';
import i18next from 'v2/helpers/i18n';

const config = {
  id: 12,
  path: 'change-password',
  element: (
    <Prosper title={i18next.t('change-password')}>
      <ChangerPassword />
    </Prosper>
  ),
  filter: [],
  filterCountry: [],
  redirects: [],
};

export default config;
