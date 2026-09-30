import React from 'react';
import Prosper from 'v2/apps/prosper/pages';
import PrequalificationV2 from 'v2/apps/prosper/pages/prequalification_v2';
import i18next from 'v2/helpers/i18n';

const config = {
  id: 10,
  path: 'prequalification',
  element: (
    <Prosper title={i18next.t('users-table-column-prequalification')}>
      <PrequalificationV2 />
    </Prosper>
  ),
  filter: [],
  filterCountry: [],
  label: i18next.t('users-table-column-prequalification'),
  redirects: [],
};

export default config;
